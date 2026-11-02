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
const {AudioEngine,estimatePitch}=await import("data:text/javascript;base64,"+Buffer.from(raw).toString("base64"));
test("detector identifica notas sintetizadas em 44,1/48 kHz",()=>{
 for(const sampleRate of [44100,48000]){
  for(const freq of [110,130.813,196,261.626,329.628,440,659.255,880]){
   const samples=new Float32Array(4096);
   for(let i=0;i<samples.length;i++){
    const t=i/sampleRate;
    samples[i]=.09*Math.sin(2*Math.PI*freq*t)+.04*Math.sin(4*Math.PI*freq*t)+.02*Math.sin(6*Math.PI*freq*t);
   }
   const r=estimatePitch(samples,sampleRate);
   const cents=1200*Math.log2(r.hz/freq);
   assert.ok(Math.abs(cents)<7,Math.round(freq)+" Hz: "+cents.toFixed(2)+" cents");
  }
 }
});
test("silêncio não produz nota falsa",()=>{
 assert.equal(estimatePitch(new Float32Array(4096),48000).hz,0);
});
test("sair durante permissão cancela stream e permite nova tentativa",async()=>{
 const descriptors=new Map();
 for(const prop of ["window","navigator","requestAnimationFrame","cancelAnimationFrame"]){
   descriptors.set(prop,Object.getOwnPropertyDescriptor(globalThis,prop));
 }
 function replace(name,value){Object.defineProperty(globalThis,name,{configurable:true,writable:true,value})}
 let pending=[],closed=0;
 class FakeContext{
   async resume(){}
   async close(){closed++}
   createMediaStreamSource(){return {connect(){}}}
   createBiquadFilter(){return {frequency:{value:0},connect(){}}}
   createAnalyser(){return {fftSize:4096,smoothingTimeConstant:0}}
 }
 replace("window",{isSecureContext:true,AudioContext:FakeContext});
 replace("navigator",{mediaDevices:{getUserMedia:()=>new Promise(resolve=>pending.push(resolve))}});
 replace("requestAnimationFrame",()=>1);
 replace("cancelAnimationFrame",()=>{});
 const streams=[];
 function fakeStream(){
   const obj={stopped:0},track={stop(){obj.stopped++},addEventListener(){}};
   obj.getTracks=()=>[track];obj.getAudioTracks=()=>[track];streams.push(obj);return obj;
 }
 try{
   const audio=new AudioEngine(()=>{},()=>{},()=>{});
   const first=audio.start();audio.stop();
   pending[0](fakeStream());await first;
   assert.equal(streams[0].stopped,1);assert.equal(audio.listening,false);
   const second=audio.start(),duplicate=audio.start();
   assert.equal(pending.length,2);
   pending[1](fakeStream());await Promise.all([second,duplicate]);
   assert.equal(audio.listening,true);audio.stop();
   assert.equal(streams[1].stopped,1);assert.equal(audio.listening,false);
   assert.ok(closed>=1);
 }finally{
   for(const [key,descriptor] of descriptors){
     if(descriptor)Object.defineProperty(globalThis,key,descriptor);
     else delete globalThis[key];
   }
 }
});
