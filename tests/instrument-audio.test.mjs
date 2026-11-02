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
const {SoundPlayer,synthesizePluckedString}=await import("data:text/javascript;base64,"+Buffer.from(raw).toString("base64"));
class Param{
 constructor(value=1){this.value=value}
 setValueAtTime(value){this.value=value}
 exponentialRampToValueAtTime(value){this.value=value}
 setTargetAtTime(value){this.value=value}
}
class Node{constructor(){this.connections=[];this.gain=new Param()}connect(target){this.connections.push(target);return target}}
class Osc extends Node{constructor(){super();this.frequency={value:0}}start(){}stop(){}}
class BufferSource extends Node{
 constructor(){super();this.started=false;this.stopped=false;this.buffer=null}
 start(){this.started=true}
 stop(){this.stopped=true}
}
class CTX{
 constructor(){this.state="running";this.currentTime=2;this.sampleRate=44100;this.destination=new Node();this.oscillators=[];this.bufferSources=[]}
 async resume(){}
 createGain(){return new Node()}
 createDynamicsCompressor(){return Object.assign(new Node(),{threshold:new Param(),knee:new Param(),ratio:new Param(),attack:new Param(),release:new Param()})}
 createOscillator(){const v=new Osc();this.oscillators.push(v);return v}
 createBuffer(channels,length,sampleRate){assert.equal(channels,1);assert.equal(sampleRate,this.sampleRate);const data=new Float32Array(length);return{length,getChannelData:()=>data}}
 createBufferSource(){const v=new BufferSource();this.bufferSources.push(v);return v}
}
const oldWindow=()=>Object.getOwnPropertyDescriptor(globalThis,"window");
function restore(descriptor){if(descriptor)Object.defineProperty(globalThis,"window",descriptor);else delete globalThis.window}
test("cordas sintetizadas têm ataque e decaimento diferentes de osciladores de piano",async()=>{
 const original=oldWindow();
 Object.defineProperty(globalThis,"window",{value:{AudioContext:CTX},writable:true,configurable:true});
 try{
  const player=new SoundPlayer(),ctx=await player.context();
  for(const voice of ["ukulele","acoustic","electric","bass"]){
    assert.equal(player.setTimbre(voice),voice);
    const before=ctx.bufferSources.length,oscs=ctx.oscillators.length;
    const note=voice==="bass"?43:voice==="ukulele"?69:64;
    const sources=player.tone(ctx,note,ctx.currentTime+.05,.45);
    assert.equal(sources.length,1);
    assert.equal(ctx.bufferSources.length,before+1);
    assert.equal(ctx.oscillators.length,oscs,"cordas não devem usar a síntese senoidal de piano");
    assert.ok(sources[0].buffer.length>ctx.sampleRate*.45);
    assert.ok(sources[0].started);
    assert.ok(sources[0].buffer.getChannelData(0).some(x=>Math.abs(x)>.1));
  }
  assert.equal(player.setTimbre("piano"),"piano");
  player.tone(ctx,60,ctx.currentTime+.05,.45);
  assert.equal(ctx.oscillators.length,4);
  player.stop();
  assert.equal(player.sources.size,0);
  assert.ok(ctx.bufferSources.every(v=>v.stopped));
 }finally{restore(original)}
});
test("corda do ukulele apresenta queda de amplitude, não uma onda constante",()=>{
 const data=synthesizePluckedString(440,44100,1.8,"ukulele");
 assert.ok(data.length>70000);
 assert.ok(data.every(Number.isFinite));
 const rms=span=>Math.sqrt(span.reduce((sum,x)=>sum+x*x,0)/span.length);
 const head=rms(data.slice(1000,8000)),tail=rms(data.slice(50000,57000));
 assert.ok(head>tail*2,"decaimento de corda insuficiente: "+head+" vs "+tail);
});
test("timbres distintos geram ondas distintas, sem baixar áudio externo",()=>{
 const ukulele=synthesizePluckedString(440,48000,1.2,"ukulele");
 const guitar=synthesizePluckedString(440,48000,1.2,"acoustic");
 const bass=synthesizePluckedString(98,48000,1.2,"bass");
 assert.ok(ukulele.length>0&&guitar.length>0&&bass.length>0);
 assert.notDeepEqual(Array.from(ukulele.slice(300,310)),Array.from(guitar.slice(300,310)));
 assert.notDeepEqual(Array.from(guitar.slice(300,310)),Array.from(bass.slice(300,310)));
});
test("não aceita parâmetros inválidos nem cria buffers gigantes",()=>{
 assert.equal(synthesizePluckedString(0,48000,1,"ukulele").length,0);
 assert.equal(synthesizePluckedString(Infinity,48000,1,"ukulele").length,0);
 assert.ok(synthesizePluckedString(440,48000,100000,"ukulele").length<=48000*3.1+1);
});
test("aplicativo usa o timbre apropriado por instrumento e notas do próprio instrumento no teste",()=>{
 const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 assert.ok(app.includes('ukulele:"ukulele"'));
 assert.ok(app.includes('acoustic:"acoustic"'));
 assert.ok(app.includes('"bass-guitar":"bass"'));
 assert.ok(app.includes('applyTimbre(session.lesson.instrument||active().instrument)'));
 assert.ok(app.includes('currentLessons()[0]?.steps?.slice(0,5)'));
});
