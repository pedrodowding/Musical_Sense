/**
 * Conteúdo vocal ORIGINAL composto para o Musical Sense.
 * Nenhuma letra protegida, gravação comercial ou melodia de terceiros é distribuída.
 */
const P=(text,syllables,notes,beats)=>({text,syllables,notes,beats:beats||notes.map((_,i)=>i===notes.length-1?2:1)});
const source={type:"original",author:"Musical Sense",license:"original-app-content",territory:"global",lyricsRights:true,melodyRights:true,recordingRights:false};
const raw=[
 {id:"voice-warmup",title:"Vocalize com Lá",artist:"Exercício original Musical Sense",level:"Iniciante",genre:"Vocalizes",icon:"🎤",bpm:72,key:"Dó maior",description:"Descubra seu alcance e mantenha notas estáveis.",phrases:[
 P("Lá, lá, lá, lá, lá",["Lá","Lá","Lá","Lá","Lá"],[60,62,64,65,67],[1,1,1,1,2]),
 P("Lá, lá, lá, lá, lá",["Lá","Lá","Lá","Lá","Lá"],[67,65,64,62,60],[1,1,1,1,2])
 ]},
 {id:"voice-shine",title:"Minha Voz Vai Brilhar",artist:"Original Musical Sense",level:"Iniciante",genre:"Canções",icon:"✨",bpm:80,key:"Dó maior",description:"Uma canção curta com letra sincronizada, afinação e ritmo.",phrases:[
 P("Minha voz vai brilhar",["Mi","nha","voz","vai","bri","lhar"],[60,62,64,65,67,67],[1,1,1,1,1,2]),
 P("No azul do céu",["No","a","zul","do","céu"],[67,65,64,62,60],[1,1,1,1,2]),
 P("Eu escuto cada som",["Eu","es","cu","to","ca","da","som"],[60,62,64,65,67,65,64],[1,1,1,1,1,1,2]),
 P("E volto a cantar",["E","vol","to","a","can","tar"],[62,64,65,67,64,60],[1,1,1,1,1,2])
 ]},
 {id:"voice-day",title:"Um Novo Dia de Música",artist:"Original Musical Sense",level:"Básico",genre:"Canções",icon:"☀️",bpm:90,key:"Dó maior",description:"Cante acompanhando as frases e mantenha o pulso.",phrases:[
 P("Um novo dia chegou",["Um","no","vo","di","a","che","gou"],[60,62,64,65,67,65,64],[1,1,1,1,1,1,2]),
 P("E a música começou",["E","a","mú","si","ca","co","me","çou"],[62,64,65,67,69,67,65,64],[1,1,1,1,1,1,1,2]),
 P("Eu solto a minha voz",["Eu","sol","to","a","mi","nha","voz"],[60,62,64,65,67,65,64],[1,1,1,1,1,1,2]),
 P("E canto junto com você",["E","can","to","jun","to","com","vo","cê"],[62,64,65,67,69,67,64,60],[1,1,1,1,1,1,1,2])
 ]}
];
export function buildVocalSong(rawSong){
 let position=0;const steps=[],phrases=[];
 for(let i=0;i<rawSong.phrases.length;i++){
   const p=rawSong.phrases[i];
   if(p.notes.length!==p.syllables.length||p.notes.length!==p.beats.length)throw new Error("Letra e melodia estão desalinhadas: "+rawSong.id);
   const startBeat=position;
   for(let j=0;j<p.notes.length;j++){
     const beats=Number(p.beats[j]);if(!Number.isFinite(beats)||beats<=0)throw new Error("Duração inválida");
     const step={m:p.notes[j],beats,syllable:p.syllables[j],phrase:i,startBeat:position};
     steps.push(step);position+=beats;
   }
   phrases.push({text:p.text,startBeat,endBeat:position,first:steps.length-p.notes.length,last:steps.length-1});
 }
 return {...rawSong,source:{...source},steps,phrases,totalBeats:position};
}
export const VOCAL_SONGS=raw.map(buildVocalSong);
export function vocalById(id){return VOCAL_SONGS.find(s=>s.id===id)||null}
export function dayKey(value=new Date()){
 const d=value instanceof Date?value:new Date(value);
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
