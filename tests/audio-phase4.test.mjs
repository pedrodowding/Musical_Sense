import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
const source=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const clean=s=>s.replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
const combined=[
 "const noteFrequency=m=>440*Math.pow(2,(m-69)/12);",
 clean(source("sample-bank.js")),
 clean(source("instrument-audio.js")),
 clean(source("audio-engine.js"))
].join("\n");
const {
 SAMPLE_BANKS,closestSample,RealSampleBank,AUDIO_PROFILES,audioProfile,sensitivityThreshold,
 calibrateNoise,estimatePitch,AudioEngine,SoundPlayer
}=new Function(combined+";return {SAMPLE_BANKS,closestSample,RealSampleBank,AUDIO_PROFILES,audioProfile,sensitivityThreshold,calibrateNoise,estimatePitch,AudioEngine,SoundPlayer}")();
const synth=(frequency,rate,n,{partials=[1,.45,.17],noise=0}={})=>{
 const out=new Float32Array(n);let seed=1776;
 for(let i=0;i<n;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const random=seed/4294967296*2-1;
  const t=i/rate;let value=0;
  partials.forEach((a,k)=>value+=a*Math.sin(2*Math.PI*frequency*t*(k+1)));
  out[i]=.075*value+noise*random;
 }
 return out;
};
test("reconhece graves do baixo e notas dos demais instrumentos em 44.1/48kHz",()=>{
 for(const rate of [44100,48000]){
  for(const hz of [41.203,55,73.416,98,130.813,196,261.626,440,659.255,880]){
   const bass=hz<65;
   const result=estimatePitch(synth(hz,rate,bass?8192:4096,{noise:.0015}),rate,{minHz:bass?37:60,maxHz:1400});
   const error=1200*Math.log2(result.hz/hz);
   assert.ok(Math.abs(error)<8,hz+"Hz "+rate+" error cents: "+error);
   assert.ok(result.confidence>.75,"Confiança insuficiente em "+hz+" Hz");
  }
 }
});
test("rejeita silêncio, ruído não periódico e sinais sem registro válido",()=>{
 assert.equal(estimatePitch(new Float32Array(8192),48000,{minHz:37,maxHz:600}).hz,0);
 const noise=new Float32Array(8192);let seed=9124;
 for(let i=0;i<noise.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise[i]=.12*(seed/4294967296*2-1)}
 assert.equal(estimatePitch(noise,48000,{minHz:37,maxHz:600}).hz,0);
});
test("detecção suporta ausência da fundamental quando há 2º e 3º harmônicos",()=>{
 const sample=new Float32Array(8192),hz=110,sr=48000;
 for(let i=0;i<sample.length;i++)sample[i]=.08*Math.sin(2*Math.PI*2*hz*i/sr)+.07*Math.sin(2*Math.PI*3*hz*i/sr);
 const found=estimatePitch(sample,sr,{minHz:60,maxHz:600});
 assert.ok(Math.abs(1200*Math.log2(found.hz/hz))<13,"Frequência subjacente errada: "+found.hz);
});
test("perfil do baixo habilita FFT maior e filtro mais grave sem alterar piano",()=>{
 const audio=new AudioEngine(()=>{},()=>{},()=>{});
 audio.analyser={fftSize:0};audio.filter={frequency:{value:0}};
 audio.setProfile("bass-guitar");
 assert.equal(audio.analyser.fftSize,8192);
 assert.equal(audio.filter.frequency.value,28);
 audio.setSensitivity(.7);
 assert.ok(audio.threshold>=.004&&audio.threshold<.015);
 audio.setProfile("ukulele");
 assert.equal(audio.analyser.fftSize,4096);
 assert.equal(audio.filter.frequency.value,95);
 assert.equal(audio.noiseFloor,0);
 assert.equal(audio.profile,"ukulele");
 assert.equal(audioProfile("unknown").fftSize,4096);
});
test("calibração usa mediana, não grava áudio e só recomenda gate após dados suficientes",()=>{
 const audio=new AudioEngine(()=>{},()=>{},()=>{});
 audio.setProfile("ukulele");audio.active=true;
 assert.equal(audio.beginCalibration(),true);
 audio.calibration.push(...Array(30).fill(.003),.03,.06);
 const result=audio.finishCalibration();
 assert.equal(result.ok,true);
 assert.equal(result.sampleCount,32);
 assert.ok(Math.abs(result.noiseFloor-.003)<.00001);
 assert.equal(audio.noiseFloor,result.noiseFloor);
 assert.ok(audio.threshold>=audioProfile("ukulele").minRms*.8);
 assert.equal(audio.calibration,null);
 assert.equal(calibrateNoise([.01,.02],"piano").ok,false);
 assert.equal(calibrateNoise(Array(30).fill(.2),"piano").ok,false);
});
test("samples são gravações CC0 com arquivos OGG/FLAC válidos e URLs locais",()=>{
 const all=Object.entries(SAMPLE_BANKS).flatMap(([instrument,items])=>items.map(x=>({instrument,...x})));
 assert.equal(all.length,11);
 for(const item of all){
  assert.match(item.url,/^\/assets\/samples\/[a-z]+\/[a-z0-9]+\.(ogg|flac)$/);
  const bytes=readFileSync(new URL(".."+item.url,import.meta.url));
  assert.ok(bytes.byteLength>10000&&bytes.byteLength<2000000,item.url);
  const signature=bytes.subarray(0,4).toString("ascii");
  assert.equal(signature,item.url.endsWith(".ogg")?"OggS":"fLaC",item.url);
 }
 const licenses=source("docs/SAMPLE_CREDITS.md");
 for(const name of ["Meta Open Sound","FreePats","CC0","ukulele","piano","bass","electric","acoustic"])assert.ok(licenses.includes(name),name);
});
test("amostra próxima é escolhida por altura e rejeita intervalo exagerado",()=>{
 const map=new Map([["/assets/samples/ukulele/a4.flac",{duration:2,length:96000}],
                    ["/assets/samples/ukulele/cs5.flac",{duration:2,length:96000}]]);
 const a=closestSample("ukulele",71,map);
 assert.equal(a.midi,69);
 assert.ok(Math.abs(a.playbackRate-2**(2/12))<1e-7);
 assert.equal(closestSample("voice",71,map),null);
 assert.equal(closestSample("ukulele",1,map),null);
});
class Param{
 constructor(v=1){this.value=v}
 setValueAtTime(v){this.value=v}
 exponentialRampToValueAtTime(v){this.value=v}
 setTargetAtTime(v){this.value=v}
}
class AudioNode{
 constructor(){this.gain=new Param();this.connections=[]}
 connect(x){this.connections.push(x);return x}
}
class SampleSource extends AudioNode{
 constructor(){super();this.playbackRate={value:1};this.started=false;this.stopped=false}
 start(){this.started=true}stop(){this.stopped=true}
}
class BrowserContext{
 constructor(){this.destination=new AudioNode();this.state="running";this.currentTime=10;this.sampleRate=48000;
  this.oscillators=[];this.sources=[];this.decodes=0}
 createGain(){return new AudioNode()}
 createDynamicsCompressor(){return Object.assign(new AudioNode(),
  {threshold:new Param(),knee:new Param(),ratio:new Param(),attack:new Param(),release:new Param()})}
 createOscillator(){const o=new SampleSource();o.frequency={value:0};this.oscillators.push(o);return o}
 createBufferSource(){const s=new SampleSource();this.sources.push(s);return s}
 createBuffer(channels,length,rate){const data=new Float32Array(length);return {length,getChannelData:()=>data}}
 async decodeAudioData(data){this.decodes++;return {duration:3,length:144000}}
 async resume(){this.state="running"}
}
test("som real é carregado uma vez, escolhe amostra e interrompe com stop",async()=>{
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,"window");
 const oldFetch=Object.getOwnPropertyDescriptor(globalThis,"fetch");
 let requestCount=0;
 Object.defineProperty(globalThis,"window",{configurable:true,value:{AudioContext:BrowserContext}});
 Object.defineProperty(globalThis,"fetch",{configurable:true,value:async url=>{requestCount++;
  assert.match(url,/^\/assets\/samples\/ukulele\//);
  return {ok:true,arrayBuffer:async()=>new Uint8Array(600).buffer};
 }});
 try{
  const p=new SoundPlayer();
  p.setTimbre("ukulele");p.setSampleMode("real");
  await p.play([{m:69,beats:1},{m:72,beats:1}],90);
  const ctx=p.ctx;
  assert.equal(requestCount,3);
  assert.equal(ctx.decodes,3);
  assert.equal(p.soundSource(),"real");
  assert.equal(ctx.sources.length,2);
  assert.ok(ctx.sources.every(x=>x.started));
  assert.ok(ctx.oscillators.length===0);
  const playbackRate=ctx.sources[1].playbackRate.value;
  assert.ok(playbackRate>.5&&playbackRate<2);
  await p.play([{m:76,beats:1}],90);
  assert.equal(requestCount,3,"Amostras devem estar em cache");
  p.stop();
  assert.ok(ctx.sources.every(x=>x.stopped));
 }finally{
  if(oldWindow)Object.defineProperty(globalThis,"window",oldWindow);else delete globalThis.window;
  if(oldFetch)Object.defineProperty(globalThis,"fetch",oldFetch);else delete globalThis.fetch;
 }
});
test("codec indisponível faz fallback para síntese sem bloquear notas",async()=>{
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,"window");
 const oldFetch=Object.getOwnPropertyDescriptor(globalThis,"fetch");
 Object.defineProperty(globalThis,"window",{configurable:true,value:{AudioContext:BrowserContext}});
 Object.defineProperty(globalThis,"fetch",{configurable:true,value:async()=>({ok:true,arrayBuffer:async()=>new Uint8Array(600).buffer})});
 try{
  const ctx=new BrowserContext();ctx.decodeAudioData=async()=>{throw Error("FLAC não suportado")};
  const p=new SoundPlayer();p.ctx=ctx;p.setTimbre("ukulele");p.setSampleMode("real");
  await p.play([{m:69,beats:1}],90);
  assert.equal(p.soundSource(),"synth");
  assert.equal(ctx.sources.length,1,"Fallback Karplus-Strong deve usar buffer próprio");
  p.setSampleMode("synth");
  assert.equal(p.getSampleMode(),"synth");
  p.stop();
 }finally{
  if(oldWindow)Object.defineProperty(globalThis,"window",oldWindow);else delete globalThis.window;
  if(oldFetch)Object.defineProperty(globalThis,"fetch",oldFetch);else delete globalThis.fetch;
 }
});
test("app oferece seleção de fonte real/sintetizada e calibração por instrumento",()=>{
 const app=source("app.js");
 for(const snippet of ['id="sound-source"','data-action="mic-calibrate"',
  'applyMicrophoneProfile(lesson.instrument||active().instrument)','db.sampleMode=mode',
  'audio.audioCalibrations','audio.setProfile(id)'].slice(0,4))assert.ok(app.includes(snippet),snippet);
 assert.ok(app.includes('audio.setProfile(id)'));
 assert.ok(app.includes('active().audioCalibrations?.[id]'));
 const sw=source("sw.js");
 assert.ok(sw.includes("sample-bank.js")&&sw.includes("instrument-audio.js"));
 assert.ok(!sw.includes('"/assets/samples/ukulele/a4.flac"'),"Samples não devem ocupar o cache inicial");
});
