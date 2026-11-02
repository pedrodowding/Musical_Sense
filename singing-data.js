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
 ]},
 {id:"voice-colors",title:"Cores do Céu",artist:"Original Musical Sense",level:"Iniciante",genre:"Canções",icon:"🌈",bpm:82,key:"Dó maior",
  description:"Canção original em quatro frases sobre ouvir e explorar.",
  phrases:[
    P("Vejo o céu mudar",["Ve","jo","o","céu","mu","dar"],[60,62,64,67,65,64]),
    P("Uma luz a brilhar",["U","ma","luz","a","bri","lhar"],[62,64,65,67,65,60]),
    P("A canção vem me guiar",["A","can","ção","vem","me","gui","ar"],[60,62,64,65,67,65,64]),
    P("Até o dia chegar",["A","té","o","di","a","che","gar"],[62,64,65,67,69,67,60])
  ]},
 {id:"voice-rhythm",title:"Ritmo no Peito",artist:"Original Musical Sense",level:"Iniciante",genre:"Canções",icon:"💓",bpm:90,key:"Sol maior",
  description:"Trabalhe articulação e mantenha o pulso com a sua voz.",
  phrases:[
    P("Meu coração faz tum",["Meu","co","ra","ção","faz","tum"],[62,64,67,69,67,62]),
    P("O som vem pelo ar",["O","som","vem","pe","lo","ar"],[64,67,69,71,69,67]),
    P("Se eu escutar bem",["Se","eu","es","cu","tar","bem"],[62,64,67,69,67,64]),
    P("Eu posso acompanhar",["Eu","pos","so","a","com","pa","nhar"],[64,67,69,71,69,67,62])
  ]},
 {id:"voice-small-steps",title:"Pequenos Passos",artist:"Original Musical Sense",level:"Básico",genre:"Canções",icon:"👣",bpm:76,key:"Dó maior",
  description:"Intervalos suaves, frases longas e prática de respiração.",
  phrases:[
    P("Um passo de cada vez",["Um","pas","so","de","ca","da","vez"],[60,62,64,65,67,65,64]),
    P("A voz encontra a paz",["A","voz","en","con","tra","a","paz"],[62,64,65,67,69,67,65]),
    P("Um sonho vai crescer",["Um","so","nho","vai","cres","cer"],[64,65,67,69,67,64]),
    P("Se eu voltar a cantar",["Se","eu","vol","tar","a","can","tar"],[62,64,65,67,65,62,60])
  ]},
 {id:"voice-breeze",title:"Vento de Música",artist:"Original Musical Sense",level:"Básico",genre:"Canções",icon:"🍃",bpm:84,key:"Fá maior",
  description:"Melodia original com pequenas mudanças de direção.",
  phrases:[
    P("O vento vem brincar",["O","ven","to","vem","brin","car"],[65,67,69,72,69,65]),
    P("Nas folhas do jardim",["Nas","fo","lhas","do","jar","dim"],[67,69,72,74,72,69]),
    P("A música vem soar",["A","mú","si","ca","vem","so","ar"],[65,67,69,72,74,72,69]),
    P("E fica junto a mim",["E","fi","ca","jun","to","a","mim"],[69,67,65,67,69,67,65])
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
