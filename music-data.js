
// Material didático original e melodias tradicionais/em domínio público.
const N=(m,f=1,beats=1)=>({m,f,beats});
export const LESSONS=[
{id:"first",course:"fundamentals",title:"Conheça o Dó central",subtitle:"Descubra sua primeira nota no piano",icon:"🎹",minutes:3,xp:50,level:1,kind:"notes",tip:"Encontre o Dó central, à esquerda do grupo de duas teclas pretas.",steps:[N(60),N(60),N(62,2),N(60),N(62,2),N(64,3)]},
{id:"five",course:"fundamentals",title:"As cinco primeiras notas",subtitle:"Dó, Ré, Mi, Fá e Sol",icon:"✋",minutes:5,xp:80,level:2,kind:"notes",tip:"Mantenha a mão relaxada. Use um dedo para cada tecla branca.",steps:[N(60,1),N(62,2),N(64,3),N(65,4),N(67,5),N(65,4),N(64,3),N(62,2),N(60,1)]},
{id:"reading",course:"fundamentals",title:"Aprenda a ler notas",subtitle:"Relacione a partitura às teclas",icon:"🎼",minutes:6,xp:90,level:3,kind:"reading",tip:"Cada linha ou espaço na pauta representa uma nota.",steps:[N(64,3),N(67,5),N(65,4),N(62,2),N(60,1),N(64,3),N(65,4),N(67,5)]},
{id:"lamb",course:"solo",title:"Primeira melodia",subtitle:"Maria Tinha um Carneirinho (tradicional)",icon:"🐑",minutes:5,xp:110,level:4,kind:"song",tip:"Agora as notas formam uma pequena melodia. Repita as notas com ataques separados.",steps:[N(64,3),N(62,2),N(60,1),N(62,2),N(64,3),N(64,3),N(64,3,2),N(62,2),N(62,2),N(62,2,2),N(64,3),N(67,5),N(67,5,2)]},
{id:"scale",course:"solo",title:"Escala de Dó maior",subtitle:"Suba e desça oito notas",icon:"🌈",minutes:7,xp:110,level:5,kind:"technique",tip:"Toque de forma contínua. A passagem de dedo pode ser estudada lentamente.",steps:[60,62,64,65,67,69,71,72,71,69,67,65,64,62,60].map(m=>N(m,0))},
{id:"joy",course:"solo",title:"Ode à Alegria",subtitle:"Beethoven, tema em domínio público",icon:"✨",minutes:7,xp:130,level:6,kind:"song",tip:"Ouça o exemplo antes de tocar. O objetivo é memorizar a sequência.",steps:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62].map(m=>N(m,0))},
{id:"bass",course:"harmony",title:"Descubra a mão esquerda",subtitle:"Notas graves com a mão esquerda",icon:"⬅️",minutes:5,xp:90,level:7,kind:"technique",tip:"Notas mais graves ficam à esquerda do piano. Tocaremos uma de cada vez.",steps:[N(48,5),N(50,4),N(52,3),N(53,2),N(55,1),N(53,2),N(52,3),N(48,5)]},
{id:"arpeggio",course:"harmony",title:"Primeiros acordes",subtitle:"Aprenda tríades em arpejos",icon:"🎵",minutes:6,xp:120,level:8,kind:"arpeggio",tip:"Este exercício identifica as notas do acorde separadamente, não acordes simultâneos.",steps:[60,64,67,60,65,69,72,65,67,71,74,67].map(m=>N(m,0))},
{id:"intervals",course:"harmony",title:"Saltos e intervalos",subtitle:"Treine distâncias entre notas",icon:"🚀",minutes:6,xp:120,level:9,kind:"technique",tip:"Antecipe visualmente para onde sua mão vai.",steps:[60,64,60,67,60,72,67,64,60].map(m=>N(m,0))},
{id:"rhythm",course:"fundamentals",title:"Pulso e repetição",subtitle:"Treine ataques separados com um pulso",icon:"🥁",minutes:5,xp:100,level:4,kind:"rhythm",tip:"Ative o metrônomo, ouça o pulso e toque uma nota por batida. No modo guiado o avanço é por nota. No modo Performance, acompanhe a linha verde para treinar o tempo.",steps:[N(60,1),N(60,1),N(60,1),N(60,1),N(62,2),N(62,2),N(64,3),N(64,3)]}
];
export const COURSES=[
{id:"fundamentals",name:"Primeiros passos",subtitle:"Notas, teclado e leitura musical",icon:"🎹",theme:"violet",count:4,description:"Comece do zero e aprenda a reconhecer notas no instrumento real."},
{id:"solo",name:"Melodias e solos",subtitle:"Toque suas primeiras músicas",icon:"🎶",theme:"mint",count:3,description:"Transforme notas em melodias e desenvolva fluidez."},
{id:"harmony",name:"Harmonia e técnica",subtitle:"Mãos, intervalos e arpejos",icon:"✨",theme:"peach",count:3,description:"Conheça estruturas musicais e ganhe coordenação."}
];
export const SONGS=[
{id:"lamb",name:"Maria Tinha um Carneirinho",artist:"Melodia tradicional",cover:"🐑",level:"Iniciante",genre:"Tradicionais"},
{id:"joy",name:"Ode à Alegria",artist:"L. van Beethoven",cover:"🌟",level:"Iniciante",genre:"Clássicas"},
{id:"scale",name:"Escala de Dó maior",artist:"Exercício didático original",cover:"🌈",level:"Iniciante",genre:"Exercícios"}
];
const namesPT=["Dó","Dó♯","Ré","Ré♯","Mi","Fá","Fá♯","Sol","Sol♯","Lá","Lá♯","Si"];
const namesEN=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export function noteName(m,includeOctave=true){return namesPT[((m%12)+12)%12]+(includeOctave?" "+(Math.floor(m/12)-1):"")}
export function noteShort(m){return namesEN[((m%12)+12)%12]+(Math.floor(m/12)-1)}
export function noteFrequency(m){return 440*Math.pow(2,(m-69)/12)}
export function lessonById(id){return LESSONS.find(l=>l.id===id)||LESSONS[0]}
export function getSessionNotes(lesson){return lesson.steps.map(s=>typeof s==="number"?{m:s,f:0,beats:1}:s)}
export function initialUser(name="Aluno 1",instrument="Piano"){return {id:"u"+Date.now()+Math.random().toString(36).slice(2,6),name,instrument,xp:0,completed:{},totalCorrect:0,totalAttempts:0,practiceSeconds:0,history:[],createdAt:Date.now()}}
