import {instrumentInfo,stringTunings,stringPosition} from "./instrument-data.js";
import {noteName} from "./music-data.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function fretboard(instrument,step,{showHint=true,heard=null}={}){
 const info=instrumentInfo(instrument),tuning=stringTunings(instrument);
 if(!tuning.length)return "";
 const target=stringPosition(info.id,step.m);
 const maxFret=7;
 const rows=tuning.map((base,index)=>{
  const name=noteName(base,false),isTarget=target&&index+1===target.stringNumber;
  let cells="";
  for(let fret=0;fret<=maxFret;fret++){
   const midi=base+fret;
   const highlight=isTarget&&fret===target.fret;
   const heardHere=heard===midi&&isTarget;
   cells+='<span class="fret-cell '+(highlight?(heardHere?"is-heard":showHint?"is-target":"is-next"):"")+'"><span class="fret-string"></span>'+(highlight?'<span class="fret-marker">'+esc(noteName(midi,false))+'</span>':fret===0?'<span class="fret-open">◯</span>':"")+'</span>';
  }
  return '<div class="fret-row"><span class="fret-label">'+esc(name)+'</span>'+cells+'</div>';
 }).join("");
 const fretNumbers='<div class="fret-row fret-numbers"><span class="fret-label">Casa</span>'+Array.from({length:maxFret+1},(_,i)=>'<span class="fret-num">'+i+'</span>').join("")+'</div>';
 return '<div class="fretboard" role="img" aria-label="Braço do '+esc(info.name)+', '+(target?"corda "+target.stringNumber+", casa "+target.fret:"nota "+esc(noteName(step.m)))+'">'+fretNumbers+rows+'</div>'+
 '<div class="fret-instruction"><span class="fret-instruction-icon">👆</span><div><strong>'+(target?esc(target.stringName)+" · "+(target.fret===0?"corda solta":"casa "+target.fret):esc(noteName(step.m)))+'</strong><small>Toque no seu '+esc(info.name.toLowerCase())+'. O desenho é uma referência, não um teclado interativo.</small></div></div>';
}
export function instrumentOptions(selected){
 return '<div class="instrument-options" role="group" aria-label="Escolher instrumento">'+
 ["piano","keyboard","acoustic","electric","ukulele","bass-guitar","voice"].map(id=>{
  const info=instrumentInfo(id),isSelected=selected===id;
  return '<button class="instrument-option '+(isSelected?"active":"")+'" data-instrument="'+id+'" aria-pressed="'+isSelected+'"><span class="instrument-emoji">'+info.icon+'</span><span><strong>'+esc(info.name)+'</strong><small>'+esc(info.description)+'</small></span><span class="instrument-check">'+(isSelected?"✓":"›")+'</span></button>';
 }).join("")+'</div>';
}
