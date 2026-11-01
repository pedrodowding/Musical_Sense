/**
 * Motor determinístico de performance monofônica, sem dependências.
 * O relógio é injetado pelo chamador para permitir testes e evitar drift de setInterval.
 */
export class PerformanceSession {
  constructor(steps,{bpm=80,countIn=4,latencyMs=160}={}){
    if(!Array.isArray(steps)||steps.length===0)throw new Error("Uma performance requer notas.");
    this.steps=steps.map(s=>({m:Number(s.m),beats:Math.max(.25,Number(s.beats)||1)}));
    this.bpm=Math.max(40,Math.min(160,Number(bpm)||80));
    this.beatMs=60000/this.bpm;
    this.countIn=Math.max(1,Math.min(8,countIn));
    this.latencyMs=Math.max(0,Math.min(350,latencyMs));
    this.beats=[];let current=0;
    for(const step of this.steps){this.beats.push(current);current+=step.beats}
    this.totalBeats=current;
    this.phase="ready";this.index=0;this.events=Array(this.steps.length).fill(null);
    this.hits=0;this.perfect=0;this.good=0;this.ok=0;this.misses=0;this.wrong=0;this.wrongByNote=Array(this.steps.length).fill(0);this.combo=0;this.bestCombo=0;this.score=0;
    this.startAt=0;this.countdownStart=0;this.pausedAt=0;this.previousPhase="ready";this.lastBeatIndex=-1;this.lastWrongAt=-Infinity;
    this.lastFeedback="Acompanhe a linha de chegada e toque no tempo.";
  }
  get windowMs(){return Math.max(160,Math.min(370,this.beatMs*.40))}
  get total(){return this.steps.length}
  get progress(){return this.index/this.total}
  start(now){
    if(this.phase!=="ready")return this.tick(now);
    this.countdownStart=now;this.startAt=now+this.countIn*this.beatMs;
    this.phase="countin";this.lastBeatIndex=-1;
    return this.tick(now);
  }
  pause(now){
    if(this.phase!=="countin"&&this.phase!=="running")return false;
    this.previousPhase=this.phase;this.pausedAt=now;this.phase="paused";return true;
  }
  resume(now){
    if(this.phase!=="paused")return false;
    const shift=Math.max(0,now-this.pausedAt);
    this.startAt+=shift;this.countdownStart+=shift;this.phase=this.previousPhase;
    this.pausedAt=0;this.lastBeatIndex=-1;return true;
  }
  setLatency(ms){this.latencyMs=Math.max(0,Math.min(350,Number(ms)||0))}
  positionBeats(now){
    const at=this.phase==="paused"?this.pausedAt:now;
    if(this.phase==="ready")return -this.countIn;
    return (at-this.startAt)/this.beatMs;
  }
  countdown(now){
    if(this.phase!=="countin")return 0;
    return Math.max(0,Math.ceil((this.startAt-now)/this.beatMs));
  }
  expectedAt(index){return this.startAt+this.beats[index]*this.beatMs}
  tick(now){
    const changed=[];
    if(this.phase==="ready"||this.phase==="paused"||this.phase==="finished")return {changed,beat:false,phase:this.phase,index:this.index};
    let beat=false,beatNumber=-1;
    const currentBeat=Math.floor((now-this.countdownStart)/this.beatMs);
    if(currentBeat!==this.lastBeatIndex&&currentBeat>=0){
      this.lastBeatIndex=currentBeat;beat=true;beatNumber=currentBeat;
    }
    if(this.phase==="countin"&&now>=this.startAt){this.phase="running";this.lastFeedback="Valendo! Toque quando a nota encontrar a linha."}
    if(this.phase==="running"){
      while(this.index<this.total && now>this.expectedAt(this.index)+this.windowMs+this.latencyMs){
        this.events[this.index]={status:"miss",offsetMs:null};
        changed.push({type:"miss",index:this.index,note:this.steps[this.index].m});
        this.misses++;this.combo=0;this.index++;
        this.lastFeedback="A nota passou. Não pare: acompanhe a próxima.";
      }
      if(this.index>=this.total)this.phase="finished";
    }
    return {changed,beat,beatNumber,phase:this.phase,index:this.index};
  }
  receive({note,source="microphone",cents=0},now){
    const tick=this.tick(now);
    if(this.phase!=="running"||this.index>=this.total)return {type:"ignored",tick};
    const idx=this.index,target=this.steps[idx].m;
    const time=now-(source==="midi"?0:this.latencyMs);
    const delta=time-this.expectedAt(idx);
    if(delta< -this.windowMs)return {type:"early",index:idx,delta:Math.round(delta)};
    if(delta>this.windowMs)return {type:"late",index:idx,delta:Math.round(delta)};
    if(note!==target || Math.abs(cents)>45){
      if(now-this.lastWrongAt>=180){
        this.wrong++;this.wrongByNote[idx]++;this.lastWrongAt=now;this.lastFeedback="Outra nota detectada. Olhe a posição e tente seguir no tempo.";
      }
      return {type:"wrong",index:idx,expected:target,received:note,delta:Math.round(delta)};
    }
    const abs=Math.abs(delta),status=abs<=this.beatMs*.10?"perfect":abs<=this.beatMs*.22?"good":"ok";
    this.events[idx]={status,offsetMs:Math.round(delta)};
    if(status==="perfect")this.perfect++;
    else if(status==="good")this.good++;
    else this.ok++;
    this.hits++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    this.score+=status==="perfect"?100:status==="good"?75:50;
    this.lastFeedback=status==="perfect"?"Perfeito! No tempo certo.":status==="good"?"Muito bem!":delta<0?"Um pouco adiantado.":"Um pouco atrasado.";
    this.index++;
    if(this.index>=this.total)this.phase="finished";
    return {type:"hit",status,index:idx,delta:Math.round(delta),phase:this.phase};
  }
  difficultRange(){
    let worst=-1,weight=0;
    for(let i=0;i<this.events.length;i++){
      const entry=this.events[i],w=(!entry||entry.status==="miss"?4:entry.status==="ok"?2:entry.status==="good"?1:0)+Math.min(3,this.wrongByNote[i]);
      if(w>weight){weight=w;worst=i}
    }
    if(worst<0 && this.wrong===0)return null;
    if(worst<0)worst=Math.min(this.index,this.total-1);
    const start=Math.max(0,Math.min(worst-1,Math.max(0,this.total-4)));
    return {start,end:Math.min(this.total,start+4)};
  }
  summary(){return {
    total:this.total,hits:this.hits,misses:this.misses,wrong:this.wrong,
    perfect:this.perfect,good:this.good,ok:this.ok,bestCombo:this.bestCombo,score:this.score,
    accuracy:Math.round(this.hits/this.total*100),rhythmAccuracy:Math.round((this.perfect+this.good)/this.total*100),
    difficultRange:this.difficultRange(),wrongByNote:[...this.wrongByNote],events:this.events.map((e,i)=>({index:i,...(e||{status:"miss"})}))
  }}
}
