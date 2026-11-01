
import {noteFrequency} from "./music-data.js";
export function estimatePitch(samples,rate){
  const n=samples.length,window=Math.floor(n/2),max=Math.min(Math.floor(rate/65),window-1),min=Math.max(2,Math.floor(rate/1250));
  let sumSq=0;for(let i=0;i<n;i++)sumSq+=samples[i]*samples[i];
  const rms=Math.sqrt(sumSq/n);
  if(rms<0.004)return {hz:0,confidence:0,rms};
  const diff=new Float32Array(max+1);
  const count=Math.min(window,n-max);
  for(let tau=1;tau<=max;tau++){
    let total=0;
    for(let i=0;i<count;i+=2){const delta=samples[i]-samples[i+tau];total+=delta*delta}
    diff[tau]=total;
  }
  let running=0,bestTau=0,lowest=1;
  for(let tau=1;tau<=max;tau++){
    running+=diff[tau];
    if(tau<min)continue;
    const normalized=diff[tau]*tau/(running+1e-12);
    if(normalized<lowest){lowest=normalized;bestTau=tau}
    if(normalized<.14){
      let local=tau;
      while(local+1<=max&&diff[local+1]<diff[local])local++;
      bestTau=local;
      break;
    }
  }
  if(!bestTau||lowest>.24)return {hz:0,confidence:Math.max(0,1-lowest),rms};
  let offset=0;
  if(bestTau>1&&bestTau<max){
    const a=diff[bestTau-1],b=diff[bestTau],c=diff[bestTau+1];
    const den=a-2*b+c;
    if(Math.abs(den)>1e-8)offset=Math.max(-.5,Math.min(.5,.5*(a-c)/den));
  }
  const hz=rate/(bestTau+offset);
  return {hz:hz>=65&&hz<=1250?hz:0,confidence:Math.max(0,1-lowest),rms};
}
export class AudioEngine{
  constructor(onFrame,onNote,onStatus){
    this.onFrame=onFrame;this.onNote=onNote;this.onStatus=onStatus;
    this.ctx=null;this.stream=null;this.analyser=null;this.source=null;
    this.active=false;this.raf=0;this.lastAnalysis=0;this.candidate=null;this.candidateFrames=0;
    this.latched=null;this.quietFrames=0;this.prevRms=0;this.lastEmitted=0;
    this.threshold=.012;this.ignoreUntil=0;this.midiAccess=null;this.midiHandlers=[];this.generation=0;this.openPromise=null;
  }
  get listening(){return this.active}
  async start(){
    if(this.active)return;
    if(this.openPromise)return this.openPromise;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error("Abra o aplicativo por HTTPS em um navegador que permite microfone.");
    const generation=++this.generation;
    this.onStatus("permission");
    const task=this.open(generation);this.openPromise=task;
    try{await task}finally{if(this.openPromise===task)this.openPromise=null}
  }
  async open(generation){
    let stream=null,ctx=null;
    const cancelled=()=>generation!==this.generation;
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(cancelled()){stream.getTracks().forEach(t=>t.stop());return}
      this.stream=stream;
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)throw new Error("O navegador não oferece processamento de áudio.");
      ctx=new Ctx();this.ctx=ctx;await ctx.resume();
      if(cancelled()){stream.getTracks().forEach(t=>t.stop());ctx.close().catch(()=>{});return}
      const source=ctx.createMediaStreamSource(stream);
      const filter=ctx.createBiquadFilter();filter.type="highpass";filter.frequency.value=67;
      const analyser=ctx.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=0;
      source.connect(filter);filter.connect(analyser);
      if(cancelled()){stream.getTracks().forEach(t=>t.stop());ctx.close().catch(()=>{});return}
      this.source=source;this.analyser=analyser;this.active=true;
      this.reset();this.onStatus("listening");
      this.raf=requestAnimationFrame(t=>this.loop(t));
      stream.getAudioTracks().forEach(track=>track.addEventListener("ended",()=>this.stop()));
    }catch(err){
      if(cancelled()){if(stream)stream.getTracks().forEach(t=>t.stop());if(ctx)ctx.close().catch(()=>{});return}
      this.stop();this.onStatus("error",err.message||"Não foi possível usar o microfone.");throw err;
    }
  }
  reset(){this.candidate=null;this.candidateFrames=0;this.latched=null;this.quietFrames=0;this.prevRms=0;this.lastEmitted=0}
  loop(time){
    if(!this.active||!this.analyser||!this.ctx)return;
    this.raf=requestAnimationFrame(t=>this.loop(t));
    if(time-this.lastAnalysis<65)return;
    this.lastAnalysis=time;
    const buf=new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    let energy=0;for(let i=0;i<buf.length;i++)energy+=buf[i]*buf[i];
    const rms=Math.sqrt(energy/buf.length);
    if(time<this.ignoreUntil){this.reset();this.onFrame({rms,hz:0,note:null,confidence:0,cents:0,ignored:true});return}
    if(rms<this.threshold){
      this.quietFrames++;
      if(this.quietFrames>=2){this.candidate=null;this.candidateFrames=0;this.latched=null}
      this.prevRms=rms;
      this.onFrame({rms,hz:0,note:null,confidence:0,cents:0});
      return;
    }
    this.quietFrames=0;
    const result=estimatePitch(buf,this.ctx.sampleRate);
    const semitone=result.hz?69+12*Math.log2(result.hz/440):0;
    const note=result.hz?Math.round(semitone):null;
    const cents=result.hz?Math.round((semitone-note)*100):0;
    const valid=note!==null&&result.confidence>.72&&Math.abs(cents)<=47;
    this.onFrame({rms,hz:result.hz,note,cents,confidence:result.confidence});
    if(!valid){this.candidate=null;this.candidateFrames=0;this.prevRms=rms;return}
    const onset=this.prevRms>.006&&rms>this.prevRms*1.75&&time-this.lastEmitted>250;
    if(onset&&this.latched===note)this.latched=null;
    if(this.candidate===note)this.candidateFrames++;
    else{this.candidate=note;this.candidateFrames=1}
    if(this.candidateFrames>=3&&this.latched!==note&&time-this.lastEmitted>270){
      this.latched=note;this.lastEmitted=time;
      this.onNote({note,hz:result.hz,cents,confidence:result.confidence,source:"microphone"});
    }
    this.prevRms=rms;
  }
  setSensitivity(value){this.threshold=.005+(.035-.005)*(1-Math.max(0,Math.min(1,value)))}
  muteFor(ms){this.ignoreUntil=performance.now()+ms;this.reset()}
  stop(){
    this.generation++;this.openPromise=null;
    this.active=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;
    if(this.stream){this.stream.getTracks().forEach(t=>t.stop());this.stream=null}
    if(this.ctx){const c=this.ctx;this.ctx=null;c.close().catch(()=>{})}
    this.source=null;this.analyser=null;this.reset();
    this.onStatus("off");
  }
  async enableMidi(){
    if(!navigator.requestMIDIAccess)throw new Error("Este navegador não suporta Web MIDI. No Safari do iPad use o microfone.");
    const access=await navigator.requestMIDIAccess({sysex:false});this.midiAccess=access;
    const bind=()=>{this.midiHandlers.forEach(({input,handler})=>input.removeEventListener("midimessage",handler));this.midiHandlers=[];for(const input of access.inputs.values()){const handler=e=>{const [status,note,velocity]=e.data;const cmd=status&0xf0;if(cmd===0x90&&velocity>0)this.onNote({note,hz:noteFrequency(note),cents:0,confidence:1,source:"midi"})};input.addEventListener("midimessage",handler);this.midiHandlers.push({input,handler})}};
    bind();access.onstatechange=bind;return this.midiHandlers.length;
  }
  disconnectMidi(){this.midiHandlers.forEach(({input,handler})=>input.removeEventListener("midimessage",handler));this.midiHandlers=[];if(this.midiAccess)this.midiAccess.onstatechange=null;this.midiAccess=null}
}
export class SoundPlayer{
  constructor(){this.ctx=null;this.timer=null;this.demoEnd=0;this.oscillators=new Set()}
  async context(){if(!this.ctx){const Ctx=window.AudioContext||window.webkitAudioContext;this.ctx=new Ctx()}await this.ctx.resume();return this.ctx}
  tone(ctx,midi,start,duration=.35,volume=.14){
    const f=noteFrequency(midi);
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.025);g.gain.exponentialRampToValueAtTime(.0001,start+duration+.12);g.connect(ctx.destination);
    const oscs=[];[[1,1],[2,.18],[3,.07]].forEach(([multiple,level])=>{const o=ctx.createOscillator();o.type="sine";o.frequency.value=f*multiple;const gain=ctx.createGain();gain.gain.value=level;o.connect(gain);gain.connect(g);this.oscillators.add(o);o.onended=()=>this.oscillators.delete(o);o.start(start);o.stop(start+duration+.16);oscs.push(o)});
    return oscs;
  }
  async play(notes,tempo=96){
    const ctx=await this.context();const start=ctx.currentTime+.07;let cursor=start;
    for(const entry of notes){const midi=typeof entry==="number"?entry:entry.m;const beats=(entry.beats||1);const duration=Math.min(1.4,(60/tempo)*beats);this.tone(ctx,midi,cursor,duration*.82);cursor+=duration}
    this.demoEnd=performance.now()+(cursor-start)*1000+350;return Math.ceil((cursor-start)*1000+350)
  }
  async metronomeClick(strong=false){
    const ctx=await this.context(),t=ctx.currentTime+.012,o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=strong?1100:800;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.085);
    o.connect(g);g.connect(ctx.destination);this.oscillators.add(o);o.onended=()=>this.oscillators.delete(o);o.start(t);o.stop(t+.1);
  }
  stop(){if(this.timer)clearInterval(this.timer);this.timer=null;for(const osc of this.oscillators){try{osc.stop()}catch{}}this.oscillators.clear()}
  async metronome(bpm){this.stop();let i=0;await this.metronomeClick(true);this.timer=setInterval(()=>this.metronomeClick(++i%4===0),60000/bpm)}
}
