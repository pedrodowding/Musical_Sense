
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
/**
 * Reprodutor sintetizado de notas e pulsos.
 * Uma única saída master mantém o volume previsível em Safari, iPad e desktop.
 * A compressão limita picos, mas não substitui o volume físico do dispositivo.
 */
/**
 * Guia de cordas: síntese física simplificada por linha de atraso
 * (Karplus-Strong). Não utiliza samples de músicas ou instrumentos de terceiros.
 * "Ukulele" é distinto de "Piano": ataque pinçado e decaimento de corda.
 */
export function synthesizePluckedString(frequency,sampleRate,duration=1,voice="ukulele"){
  const f=Number(frequency),sr=Number(sampleRate);
  if(!Number.isFinite(f)||!Number.isFinite(sr)||f<35||f>2200||sr<8000||sr>192000)return new Float32Array(0);
  const d=Math.max(.1,Math.min(3.1,Number(duration)||1));
  const count=Math.min(600000,Math.ceil(sr*d)),delayLength=Math.max(4,Math.round(sr/f-.5));
  const delay=new Float32Array(delayLength),output=new Float32Array(count);
  const traits={
    ukulele:{feedback:.9898,brightness:.33,body:.70},
    acoustic:{feedback:.9955,brightness:.25,body:.85},
    electric:{feedback:.9976,brightness:.12,body:.90},
    bass:{feedback:.9985,brightness:.09,body:1},
    strings:{feedback:.994,brightness:.26,body:.84}
  };
  const tone=traits[voice]||traits.ukulele;
  // Deterministic excitation: repeatable audio and test results.
  let seed=(Math.round(f*100) ^ delayLength*2654435761)>>>0;
  let previousExcitation=0;
  for(let i=0;i<delayLength;i++){
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    const white=(seed/4294967296)*2-1;
    previousExcitation=white*tone.brightness+previousExcitation*(1-tone.brightness);
    delay[i]=previousExcitation*tone.body;
  }
  let index=0,previousSample=0,peak=0;
  for(let i=0;i<count;i++){
    const current=delay[index];
    const next=delay[(index+1)%delayLength];
    delay[index]=.5*(current+next)*tone.feedback;
    index=(index+1)%delayLength;
    const sample=.85*current+.15*previousSample;
    previousSample=current;
    output[i]=sample;
    if(Math.abs(sample)>peak)peak=Math.abs(sample);
  }
  // Normalize conservatively: different pitches retain similar audibility.
  const scale=peak>.0001?Math.min(2.2,.68/peak):1;
  const fade=Math.min(count-1,Math.round(sr*.065));
  for(let i=0;i<count;i++){
    const edge=i<Math.round(sr*.0025)?i/Math.max(1,Math.round(sr*.0025)):1;
    const tail=i>=count-fade?(count-i)/Math.max(1,fade):1;
    output[i]*=scale*edge*tail;
  }
  return output;
}
export class SoundPlayer{
  constructor(){
    this.ctx=null;this.timer=null;this.demoEnd=0;this.oscillators=new Set();this.sources=new Set();
    this.input=null;this.compressor=null;this.master=null;
    this.volume=.85;this.metronomeVolume=.72;this.timbre="piano";
  }
  clamp(value,fallback=1){
    const number=Number(value);
    return Number.isFinite(number)?Math.min(1,Math.max(0,number)):fallback;
  }
  outputGain(){
    return .96*Math.pow(this.volume,1.15);
  }
  setVolume(value){
    this.volume=this.clamp(value,.85);
    if(this.master&&this.ctx){
      const gain=this.master.gain,now=this.ctx.currentTime,target=this.outputGain();
      if(typeof gain.setTargetAtTime==="function")gain.setTargetAtTime(target,now,.025);
      else gain.value=target;
    }
    return this.volume;
  }
  getVolume(){return this.volume}
  setMetronomeVolume(value){this.metronomeVolume=this.clamp(value,.72);return this.metronomeVolume}
  setTimbre(value){this.timbre=["piano","strings","soft","ukulele","acoustic","electric","bass"].includes(value)?value:"piano";return this.timbre}
  initMaster(ctx){
    if(this.master)return;
    this.input=ctx.createGain();
    this.compressor=typeof ctx.createDynamicsCompressor==="function"?ctx.createDynamicsCompressor():null;
    this.master=ctx.createGain();
    this.master.gain.value=this.outputGain();
    if(this.compressor){
      const c=this.compressor;
      c.threshold.value=-12;c.knee.value=15;c.ratio.value=7;
      c.attack.value=.005;c.release.value=.18;
      this.input.connect(c);c.connect(this.master);
    }else this.input.connect(this.master);
    this.master.connect(ctx.destination);
  }
  async context(){
    if(!this.ctx){
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)throw new Error("Este navegador não oferece saída Web Audio.");
      this.ctx=new Ctx();
    }
    this.initMaster(this.ctx);
    if(this.ctx.state!=="running")await this.ctx.resume();
    return this.ctx;
  }
  tone(ctx,midi,start,duration=.35,volume=.30){
    const f=noteFrequency(midi);
    const valid=Number.isFinite(f)&&f>30&&f<20000;
    if(!valid)return [];
    const timbre=this.timbre;
    if(["ukulele","acoustic","electric","bass","strings"].includes(timbre)
       &&typeof ctx.createBuffer==="function"&&typeof ctx.createBufferSource==="function"){
      const d=Math.max(.09,Math.min(3,Number(duration)||.35));
      const tail=timbre==="bass"?.52:timbre==="electric"?.42:.25;
      const samples=synthesizePluckedString(f,ctx.sampleRate,d+tail,timbre);
      if(!samples.length)return [];
      const buffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);
      buffer.getChannelData(0).set(samples);
      const source=ctx.createBufferSource();
      source.buffer=buffer;
      const envelope=ctx.createGain();
      const peak=Math.min(.55,Math.max(.1,Number(volume)||.30))*1.05;
      envelope.gain.setValueAtTime(.0001,start);
      envelope.gain.exponentialRampToValueAtTime(peak,start+.008);
      envelope.gain.setValueAtTime(peak,start+Math.min(.1,d*.2));
      envelope.gain.exponentialRampToValueAtTime(.0001,start+d+tail);
      source.connect(envelope);envelope.connect(this.input||ctx.destination);
      this.sources.add(source);
      source.onended=()=>this.sources.delete(source);
      source.start(start);source.stop(start+d+tail+.015);
      return [source];
    }
    const harmonics=timbre==="strings"?[[1,1],[2,.43],[3,.22],[4,.10]]:
      timbre==="soft"?[[1,1],[2,.12],[3,.035]]:
      [[1,1],[2,.34],[3,.14],[4,.06]];
    const d=Math.max(.09,Math.min(3,Number(duration)||.35));
    const peak=Math.min(.38,Math.max(.035,Number(volume)||.30));
    const attack=timbre==="strings"?.007:timbre==="soft"?.032:.014;
    const g=ctx.createGain();
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(peak,start+attack);
    if(timbre==="strings"){
      g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*.22),start+d*.76);
    }else{
      g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*.68),start+d*.82);
    }
    g.gain.exponentialRampToValueAtTime(.0001,start+d+.095);
    g.connect(this.input||ctx.destination);
    const oscs=[];
    for(const [multiple,level] of harmonics){
      if(f*multiple>ctx.sampleRate*.47)continue;
      const o=ctx.createOscillator();o.type="sine";o.frequency.value=f*multiple;
      const harmonicGain=ctx.createGain();harmonicGain.gain.value=level;
      o.connect(harmonicGain);harmonicGain.connect(g);
      this.oscillators.add(o);o.onended=()=>this.oscillators.delete(o);
      o.start(start);o.stop(start+d+.13);oscs.push(o);
    }
    return oscs;
  }
  async play(notes,tempo=96){
    const ctx=await this.context();
    const speed=Math.min(220,Math.max(35,Number(tempo)||96));
    const start=ctx.currentTime+.07;let cursor=start;
    for(const entry of notes){
      const midi=typeof entry==="number"?entry:entry.m;
      const beats=Math.max(.25,Math.min(8,Number(entry?.beats)||1));
      const duration=Math.min(3,(60/speed)*beats);
      this.tone(ctx,midi,cursor,duration*.85);
      cursor+=duration;
    }
    this.demoEnd=performance.now()+(cursor-start)*1000+250;
    return Math.ceil((cursor-start)*1000+250);
  }
  async metronomeClick(strong=false){
    if(this.metronomeVolume<=0||this.volume<=0)return;
    const ctx=await this.context(),t=ctx.currentTime+.012;
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type="sine";o.frequency.value=strong?1260:880;
    const peak=(strong?.32:.24)*this.metronomeVolume;
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(peak,t+.004);
    g.gain.exponentialRampToValueAtTime(.0001,t+.09);
    o.connect(g);g.connect(this.input||ctx.destination);
    this.oscillators.add(o);o.onended=()=>this.oscillators.delete(o);
    o.start(t);o.stop(t+.11);
  }
  stop(){
    if(this.timer)clearInterval(this.timer);this.timer=null;
    for(const osc of this.oscillators){try{osc.stop()}catch{}}
    this.oscillators.clear();
    for(const source of this.sources){try{source.stop()}catch{}}
    this.sources.clear();
  }
  async metronome(bpm){
    this.stop();let i=0;
    await this.metronomeClick(true);
    const interval=60000/Math.min(220,Math.max(35,Number(bpm)||80));
    this.timer=setInterval(()=>this.metronomeClick(++i%4===0).catch(()=>{}),interval);
  }
}
