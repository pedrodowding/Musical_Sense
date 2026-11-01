/**
 * Instrumentos e exercícios de cordas com indicação REAL de corda e casa.
 * Exercícios de corda única: não afirmamos reconhecer acordes simultâneos.
 */
export const INSTRUMENTS=[
 {id:"piano",name:"Piano",icon:"🎹",group:"keys",available:true,description:"Notas, partitura e pequenas melodias"},
 {id:"keyboard",name:"Teclado",icon:"🎼",group:"keys",available:true,description:"Prática por microfone e notas no teclado"},
 {id:"acoustic",name:"Violão",icon:"🎸",group:"strings",available:true,description:"Notas e melodias na primeira corda"},
 {id:"electric",name:"Guitarra",icon:"⚡",group:"strings",available:true,description:"Riffs e melodias em uma corda"},
 {id:"ukulele",name:"Ukulele",icon:"🌺",group:"strings",available:true,description:"Melodias na corda Lá"},
 {id:"bass-guitar",name:"Baixo",icon:"🎸",group:"strings",available:true,description:"Grooves na corda Sol"},
 {id:"voice",name:"Voz",icon:"🎤",group:"vocal",available:true,description:"Afinação, aquecimento e canções com letra"}
];
const nameMap=new Map(INSTRUMENTS.flatMap(i=>[[i.id,i.id],[i.name.toLocaleLowerCase("pt-BR"),i.id]]));
export function instrumentId(value){return nameMap.get(String(value||"").trim().toLocaleLowerCase("pt-BR"))||"piano"}
export function instrumentInfo(value){return INSTRUMENTS.find(i=>i.id===instrumentId(value))||INSTRUMENTS[0]}
export function instrumentName(value){return instrumentInfo(value).name}
const E=(m,frets=[0],beats=1)=>({m,beats,f:0,frets});
const sources=[
 {id:"acoustic",prefix:"violao",string:"Mi aguda",stringNumber:1,open:64,kind:"guitar",program:[
  {key:"first",title:"Primeira corda: Mi, Fá, Sol",subtitle:"Conheça a primeira corda do violão",icon:"🎸",kind:"notes",notes:[64,65,67,65,64],xp:50,minutes:4},
  {key:"steps",title:"Caminhos na corda Mi",subtitle:"Alternância entre as casas 0, 1, 3 e 5",icon:"👆",kind:"technique",notes:[64,65,67,69,67,65,64],xp:75,minutes:5},
  {key:"song",title:"Pequena melodia no violão",subtitle:"Uma melodia original na primeira corda",icon:"🎵",kind:"song",notes:[64,67,69,67,65,64,65,67,64],xp:110,minutes:6},
  {key:"rhythm",title:"Primeiro ritmo no violão",subtitle:"Notas repetidas com ataques separados",icon:"🥁",kind:"rhythm",notes:[64,64,67,67,69,67,65,64],xp:90,minutes:5}
 ]},
 {id:"electric",prefix:"guitarra",string:"Mi aguda",stringNumber:1,open:64,kind:"guitar",program:[
  {key:"first",title:"Primeiro riff",subtitle:"Riff original na corda Mi aguda",icon:"⚡",kind:"notes",notes:[64,64,67,69,67,64],xp:50,minutes:4},
  {key:"steps",title:"Casas e precisão",subtitle:"Explorando as casas 0, 1, 3 e 5",icon:"🎸",kind:"technique",notes:[64,65,67,69,67,65,64],xp:75,minutes:5},
  {key:"song",title:"Riff de descoberta",subtitle:"Melodia original de guitarra",icon:"🎶",kind:"song",notes:[64,67,69,71,69,67,65,64],xp:110,minutes:6},
  {key:"rhythm",title:"Pulso do rock",subtitle:"Ataques na corda Mi com metrônomo",icon:"🥁",kind:"rhythm",notes:[64,64,64,67,67,69,67,64],xp:90,minutes:5}
 ]},
 {id:"ukulele",prefix:"uke",string:"Lá",stringNumber:1,open:69,kind:"ukulele",program:[
  {key:"first",title:"Seu primeiro Lá",subtitle:"Comece com a corda Lá do ukulele",icon:"🌺",kind:"notes",notes:[69,71,72,71,69],xp:50,minutes:4},
  {key:"steps",title:"Primeiras casas",subtitle:"Casas 0, 2, 3 e 5 da corda Lá",icon:"☀️",kind:"technique",notes:[69,71,72,74,72,71,69],xp:75,minutes:5},
  {key:"song",title:"Canção da ilha",subtitle:"Pequena melodia original para ukulele",icon:"🏝️",kind:"song",notes:[69,72,74,72,71,69,71,72,69],xp:110,minutes:6},
  {key:"rhythm",title:"Pulso tropical",subtitle:"Repita notas no tempo musical",icon:"🥁",kind:"rhythm",notes:[69,69,72,72,74,72,71,69],xp:90,minutes:5}
 ]},
 {id:"bass-guitar",prefix:"baixo",string:"Sol",stringNumber:1,open:43,kind:"bass",program:[
  {key:"first",title:"Corda Sol do baixo",subtitle:"Encontre Sol e Lá na corda mais aguda",icon:"🎸",kind:"notes",notes:[43,45,43,45,47],xp:50,minutes:4},
  {key:"steps",title:"Explorando as casas",subtitle:"Casas 0, 2, 4 e 5",icon:"🔊",kind:"technique",notes:[43,45,47,48,47,45,43],xp:75,minutes:5},
  {key:"song",title:"Primeiro groove",subtitle:"Linha de baixo original de uma corda",icon:"🎵",kind:"song",notes:[43,43,45,47,45,43,48,47,43],xp:110,minutes:6},
  {key:"rhythm",title:"Groove no pulso",subtitle:"Notas graves repetidas no tempo",icon:"🥁",kind:"rhythm",notes:[43,43,45,45,47,45,43,43],xp:90,minutes:5}
 ]}
];
const extraMelodies={
 acoustic:[
  {key:"morning",title:"Manhã de Cordas",subtitle:"Melodia original para violão, corda Mi",icon:"🌅",kind:"song",notes:[64,65,67,69,67,65,64,67,64],beats:[1,1,1,2,1,1,2,1,2],xp:110,minutes:5},
  {key:"trail",title:"Trilha do Vento",subtitle:"Outra melodia original para violão",icon:"🍃",kind:"song",notes:[64,67,65,64,69,67,65,64],beats:[1,1,1,2,1,1,1,2],xp:120,minutes:6}
 ],
 electric:[
  {key:"night",title:"Riff da Noite",subtitle:"Riff melódico original de guitarra",icon:"🌙",kind:"song",notes:[64,67,69,67,64,65,67,69,64],beats:[1,1,2,1,1,1,1,2,2],xp:110,minutes:5},
  {key:"electric",title:"Faísca Musical",subtitle:"Desafio original na corda Mi aguda",icon:"⚡",kind:"song",notes:[64,65,67,71,69,67,65,64],beats:[1,1,1,2,1,1,1,2],xp:120,minutes:6}
 ],
 ukulele:[
  {key:"sun",title:"Dia de Sol",subtitle:"Canção original de ukulele na corda Lá",icon:"☀️",kind:"song",notes:[69,71,72,74,72,71,69,72,69],beats:[1,1,1,2,1,1,2,1,2],xp:110,minutes:5},
  {key:"waves",title:"Ondas da Ilha",subtitle:"Melodia original para ukulele",icon:"🌊",kind:"song",notes:[69,72,71,69,74,72,71,69],beats:[1,1,1,2,1,1,1,2],xp:120,minutes:6}
 ],
 "bass-guitar":[
  {key:"pulse",title:"Pulso da Cidade",subtitle:"Groove original de baixo na corda Sol",icon:"🌆",kind:"song",notes:[43,43,45,47,43,45,48,47,43],beats:[1,1,1,2,1,1,1,2,2],xp:110,minutes:5},
  {key:"walk",title:"Passos do Baixo",subtitle:"Linha original para baixo elétrico",icon:"🎵",kind:"song",notes:[43,45,47,45,43,48,47,45,43],beats:[1,1,2,1,1,1,1,1,2],xp:120,minutes:6}
 ]
};
for(const source of sources)source.program.splice(3,0,...extraMelodies[source.id]);
export const STRING_LESSONS=sources.flatMap((source)=>{
 return source.program.map((entry,index)=>({
   id:source.prefix+"-"+entry.key,
   instrument:source.id,course:entry.kind==="song"?"solo":entry.kind==="rhythm"?"harmony":"fundamentals",
   title:entry.title,subtitle:entry.subtitle,icon:entry.icon,minutes:entry.minutes,xp:entry.xp,level:index+1,
   kind:entry.kind,tip:"Use somente a "+source.string+" ("+source.stringNumber+"ª corda). As notas são reconhecidas individualmente pelo microfone.",
   stringLabel:source.string,stringNumber:source.stringNumber,
   steps:entry.notes.map((m,i)=>E(m,[m-source.open],entry.beats?.[i]||(entry.kind==="rhythm"&&i%4===3?2:1))),
   isOriginal:true
 }));
});
export function lessonsForInstrument(instrument,pianoLessons){
 const id=instrumentId(instrument);
 if(id==="piano"||id==="keyboard")return pianoLessons;
 if(id==="voice")return [];
 return STRING_LESSONS.filter(l=>l.instrument===id);
}
export function findInstrumentLesson(id,pianoLessons){
 return pianoLessons.find(l=>l.id===id)||STRING_LESSONS.find(l=>l.id===id)||null;
}
export function stringPosition(instrument,midi){
 const id=instrumentId(instrument);
 const spec=sources.find(s=>s.id===id);
 if(!spec)return null;
 const fret=midi-spec.open;
 if(fret<0||fret>12)return null;
 return {stringNumber:spec.stringNumber,stringName:spec.string,fret,open:spec.open};
}
const pitches={acoustic:[64,59,55,50,45,40],electric:[64,59,55,50,45,40],ukulele:[69,64,60,67],"bass-guitar":[43,38,33,28]};
export function stringTunings(instrument){
 return pitches[instrumentId(instrument)]||[];
}
export function getInstrumentCourses(instrument){
 const id=instrumentId(instrument);
 return [
  {id:"fundamentals",name:"Primeiros passos",subtitle:"Descubra seu instrumento",icon:"🎯",theme:"violet"},
  {id:"solo",name:"Sua primeira música",subtitle:"Melodias acessíveis",icon:"🎵",theme:"mint"},
  {id:"harmony",name:"Ritmo e técnica",subtitle:"Pratique seu pulso",icon:"🥁",theme:"peach"}
 ];
}
