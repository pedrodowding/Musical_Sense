/**
 * Exercícios vocais: compara a frequência sustentada com uma melodia autorizada.
 * Não transcreve fala nem verifica se o texto foi pronunciado corretamente.
 */
export class SingingSession{
 constructor(song,{bpm=song.bpm||80,transpose=0,latencyMs=130,countIn=4}={}){
  if(!song?.steps?.length)throw new Error("Canção sem melodia");
  this.song=song;this.bpm=Math.max(50,Math.min(140,Number(bpm)||80));
  this.beatMs=60000/this.bpm;this.transpose=Math.max(-12,Math.min(12,Number(transpose)||0));
  this.latencyMs=Math.max(0,Math.min(350,Number(latencyMs)||0));this.countIn=countIn;
  this.phase="ready";this.startAt=0;this.countdownStart=0;this.pausedAt=0;this.pausePhase="ready";
  this.index=0;this.lastBeat=-1;this.lastSampleAt=null;this.totalBeats=song.totalBeats;
  this.metrics=song.steps.map(()=>({soundedMs:0,matchedMs:0,frames:0,goodFrames:0}));
  this.events=Array(song.steps.length).fill(null);this.accepted=0;this.perfect=0;this.good=0;this.missed=0;this.wrong=0;this.lastFeedback="Acompanhe a letra e cante a nota indicada.";
 }
 start(now){
   if(this.phase!=="ready")return;
   this.countdownStart=now;this.startAt=now+this.countIn*this.beatMs;this.lastBeat=-1;this.phase="countin";
 }
 pause(now){
   if(!["countin","running"].includes(this.phase))return false;
   this.pausePhase=this.phase;this.pausedAt=now;this.phase="paused";return true;
 }
 resume(now){
   if(this.phase!=="paused")return false;
   const delta=Math.max(0,now-this.pausedAt);this.startAt+=delta;this.countdownStart+=delta;
   this.lastSampleAt=null;this.lastBeat=-1;this.phase=this.pausePhase;return true;
 }
 beatPosition(now){const at=this.phase==="paused"?this.pausedAt:now;return this.phase==="ready"?-this.countIn:(at-this.startAt)/this.beatMs}
 countdown(now){return this.phase==="countin"?Math.max(0,Math.ceil((this.startAt-now)/this.beatMs)):0}
 noteAt(index){return this.song.steps[index].startBeat*this.beatMs+this.startAt}
 noteEnd(index){const s=this.song.steps[index];return this.noteAt(index)+s.beats*this.beatMs}
 currentPhrase(){const step=this.song.steps[Math.min(this.index,this.song.steps.length-1)];return step?.phrase??0}
 finalize(index){
   if(this.events[index])return this.events[index];
   const m=this.metrics[index],duration=this.song.steps[index].beats*this.beatMs;
   const enough=Math.min(190,Math.max(85,duration*.28));
   const accuracy=m.goodFrames/Math.max(1,m.frames);
   const coverage=m.matchedMs/Math.max(1,duration);
   let status="miss";
   if(m.soundedMs>85){
     if(m.matchedMs>=enough&&accuracy>=.62){
       status=coverage>=.62&&accuracy>=.84?"perfect":"good";
     }else status="wrong";
   }
   this.events[index]={status,accuracy:Math.round(accuracy*100),coverage:Math.round(coverage*100)};
   if(status==="perfect"){this.perfect++;this.accepted++}
   else if(status==="good"){this.good++;this.accepted++}
   else if(status==="wrong")this.wrong++;
   else this.missed++;
   this.lastFeedback=status==="perfect"?"Excelente afinação!":status==="good"?"Boa! Mantenha a voz estável.":status==="wrong"?"A nota ficou fora da melodia. Tente acompanhar o tom.":"A nota passou sem voz detectada. Continue cantando.";
   return this.events[index];
 }
 tick(now){
   if(this.phase==="ready"||this.phase==="paused"||this.phase==="finished")return {beat:false,changed:[]};
   const beat=Math.floor((now-this.countdownStart)/this.beatMs),newBeat=beat>=0&&beat!==this.lastBeat;
   if(newBeat)this.lastBeat=beat;
   if(this.phase==="countin"&&now>=this.startAt)this.phase="running";
   const changed=[];
   if(this.phase==="running"){
     const effective=now-this.latencyMs;
     while(this.index<this.song.steps.length&&effective>=this.noteEnd(this.index)){
       changed.push({index:this.index,...this.finalize(this.index)});
       this.index++;
     }
     if(this.index>=this.song.steps.length)this.phase="finished";
   }
   return {beat:newBeat,beatNumber:beat,changed,phase:this.phase};
 }
 sample(frame,now){
   if(this.phase!=="running")return null;
   const when=now-this.latencyMs,stepIndex=this.song.steps.findIndex(step=>this.startAt+step.startBeat*this.beatMs<=when&&when<this.startAt+(step.startBeat+step.beats)*this.beatMs);
   if(stepIndex<0||this.events[stepIndex])return null;
   if(frame.ignored)return null;
   const dt=this.lastSampleAt===null?65:Math.min(120,Math.max(0,now-this.lastSampleAt));
   this.lastSampleAt=now;
   const voiced=frame.note!==null&&frame.rms>=.008&&frame.confidence>=.69;
   const metrics=this.metrics[stepIndex];
   if(!voiced)return {voiced:false,index:stepIndex};
   const target=this.song.steps[stepIndex].m+this.transpose;
   const semitoneError=frame.note-target, centsError=semitoneError*100+(frame.cents||0);
   const correct=Math.abs(centsError)<=70;
   metrics.soundedMs+=dt;metrics.frames++;
   if(correct){metrics.matchedMs+=dt;metrics.goodFrames++}
   return {voiced:true,correct,index:stepIndex,target,centsError:Math.round(centsError)};
 }
 summary(){
   if(this.phase!=="finished")for(let i=0;i<this.song.steps.length;i++)this.finalize(i);
   const total=this.song.steps.length,accuracy=Math.round(this.accepted/total*100),intonation=Math.round(this.events.reduce((sum,e)=>sum+(e.status==="perfect"?100:e.status==="good"?70:0),0)/total);
   return {total,accuracy,intonation,accepted:this.accepted,perfect:this.perfect,good:this.good,wrong:this.wrong,missed:this.missed,
    events:this.events.map((e,i)=>({index:i,...(e||{status:"miss"})})),validWords:false,transposition:this.transpose,bpm:this.bpm};
 }
}
