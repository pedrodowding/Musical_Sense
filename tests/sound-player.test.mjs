import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const modules=["sample-bank.js","instrument-audio.js"].map(name=>
 readFileSync(new URL("../"+name,import.meta.url),"utf8").replace(/^export /gm,""));
const raw=[
 "const noteFrequency=m=>440*Math.pow(2,(m-69)/12);",
 ...modules,
 readFileSync(new URL("../audio-engine.js",import.meta.url),"utf8").replace(/^import[^\n]*\n/gm,"")
].join("\n");
const {SoundPlayer}=await import("data:text/javascript;base64,"+Buffer.from(raw).toString("base64"));

class Param{
 constructor(value=1){this.value=value;this.events=[]}
 setValueAtTime(value,time){this.value=value;this.events.push({type:"start",value,time})}
 exponentialRampToValueAtTime(value,time){this.value=value;this.events.push({type:"ramp",value,time})}
 setTargetAtTime(value,time,constant){this.value=value;this.events.push({type:"target",value,time,constant})}
}
class Node{
 constructor(){this.connections=[];this.gain=new Param()}
 connect(other){this.connections.push(other);return other}
}
class Osc extends Node{
 constructor(){super();this.frequency={value:0};this.started=[];this.stopped=[];this.type="sine"}
 start(time){this.started.push(time)}
 stop(time){this.stopped.push(time)}
}
class Compressor extends Node{
 constructor(){super();for(const key of ["threshold","knee","ratio","attack","release"])this[key]={value:0}}
}
class Context{
 constructor(){this.state="suspended";this.currentTime=2;this.sampleRate=48000;this.destination=new Node();this.nodes=[];this.oscillators=[]}
 async resume(){this.state="running"}
 createGain(){const n=new Node();this.nodes.push(n);return n}
 createDynamicsCompressor(){const n=new Compressor();this.nodes.push(n);return n}
 createOscillator(){const n=new Osc();this.oscillators.push(n);return n}
}

test("reprodutor inicia com volume mais forte e estabelece master/compressor",async()=>{
 const original=globalThis.window;
 globalThis.window={AudioContext:Context};
 try{
  const p=new SoundPlayer(),ctx=await p.context();
  assert.equal(p.getVolume(),.85);
  assert.equal(ctx.state,"running");
  assert.ok(p.input.connections.includes(p.compressor));
  assert.ok(p.compressor.connections.includes(p.master));
  assert.ok(p.master.connections.includes(ctx.destination));
  assert.equal(p.master.gain.value,p.outputGain());
  assert.ok(p.compressor.threshold.value<0);
  assert.ok(p.compressor.ratio.value>1);
 }finally{globalThis.window=original}
});

test("guia aplica amplitude acima do sintetizador anterior, sem ligação direta com speaker",async()=>{
 const original=globalThis.window;globalThis.window={AudioContext:Context};
 try{
  const p=new SoundPlayer(),ctx=await p.context();
  const osc=p.tone(ctx,60,ctx.currentTime+.1,.4);
  assert.equal(osc.length,4);
  const envelopes=ctx.nodes.filter(node=>node.connections.includes(p.input));
  assert.equal(envelopes.length,1);
  const peak=envelopes[0].gain.events.find(e=>e.type==="ramp")?.value;
  assert.ok(peak>=.28,"ganho musical menor que o esperado: "+peak);
  assert.equal(osc.every(o=>o.started.length&&o.stopped.length),true);
  p.stop();assert.equal(p.oscillators.size,0);
 }finally{globalThis.window=original}
});

test("ajustar volume em tempo real é suave, limitado e reversível",async()=>{
 const original=globalThis.window;globalThis.window={AudioContext:Context};
 try{
  const p=new SoundPlayer();await p.context();
  p.setVolume(1.7);assert.equal(p.getVolume(),1);
  p.setVolume(-4);assert.equal(p.getVolume(),0);
  p.setVolume(.42);assert.equal(p.getVolume(),.42);
  const changes=p.master.gain.events.filter(e=>e.type==="target");
  assert.equal(changes.length,3);
  assert.ok(changes.every(x=>x.constant>0),"volume deve mudar sem clique digital");
 }finally{globalThis.window=original}
});

test("metrônomo aceita volume próprio e compartilha o mesmo barramento",async()=>{
 const original=globalThis.window;globalThis.window={AudioContext:Context};
 try{
  const p=new SoundPlayer(),ctx=await p.context();
  p.setMetronomeVolume(.9);
  await p.metronomeClick(true);
  assert.equal(ctx.oscillators.length,1);
  const envelope=ctx.nodes.find(n=>n.connections.includes(p.input));
  assert.ok(envelope);
  assert.ok(envelope.gain.events.find(e=>e.type==="ramp")?.value>.09);
  const count=ctx.oscillators.length;
  p.setMetronomeVolume(0);await p.metronomeClick(true);
  assert.equal(ctx.oscillators.length,count);
 }finally{globalThis.window=original}
});

test("seleção de timbre altera harmônicos e não aceita strings arbitrárias",async()=>{
 const original=globalThis.window;globalThis.window={AudioContext:Context};
 try{
  const p=new SoundPlayer(),ctx=await p.context();
  assert.equal(p.setTimbre("strings"),"strings");
  p.tone(ctx,67,2.2,.3);
  assert.equal(ctx.oscillators.length,4);
  assert.equal(p.setTimbre("soft"),"soft");
  p.tone(ctx,67,3,.3);
  assert.equal(ctx.oscillators.length,7);
  assert.equal(p.setTimbre("unknown"),"piano");
 }finally{globalThis.window=original}
});

test("melodia sintetizada e pulso não deixam osciladores ativos ao sair",async()=>{
 const originalWindow=globalThis.window,originalPerformance=globalThis.performance;
 globalThis.window={AudioContext:Context};globalThis.performance={now:()=>100};
 try{
  const p=new SoundPlayer();
  const duration=await p.play([{m:60,beats:1},{m:64,beats:1},{m:67,beats:2}],85);
  assert.ok(duration>1000);
  assert.ok(p.oscillators.size>0);
  await p.metronomeClick();
  p.stop();assert.equal(p.oscillators.size,0);
 }finally{globalThis.window=originalWindow;globalThis.performance=originalPerformance}
});
