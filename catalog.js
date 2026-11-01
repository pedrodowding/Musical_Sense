import {instrumentId,instrumentInfo,STRING_LESSONS} from "./instrument-data.js";
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
export function catalogEntries({pianoSongs,lessons,vocalSongs,personalSongs=[]}){
 const piano=pianoSongs.map(song=>{
  const lesson=lessons.find(l=>l.id===song.id);
  return {
   id:"piano:"+song.id,lessonId:song.id,kind:"instrument",instrument:"piano",title:song.name,
   artist:song.artist,description:lesson?.subtitle||"Pratique no piano ou teclado",
   cover:song.cover,genre:song.genre,level:"Iniciante",difficulty:1,minutes:lesson?.minutes||5,
   notes:lesson?.steps||[],source:song.id==="joy"?"Domínio público":"Tradicional ou exercício autoral",capability:"pitch"
  };
 });
 const stringSongs=STRING_LESSONS.map(l=>({
  id:"string:"+l.id,lessonId:l.id,kind:"instrument",instrument:l.instrument,title:l.title,
  artist:"Musical Sense",description:l.subtitle,cover:l.icon,genre:l.kind==="song"?"Melodias":"Exercícios",level:"Iniciante",
  difficulty:1,minutes:l.minutes,notes:l.steps,source:"Exercício original",capability:"pitch"
 }));
 const vocals=vocalSongs.map(song=>({
  id:"vocal:"+song.id,vocalId:song.id,kind:"vocal",instrument:"voice",title:song.title,
  artist:song.artist,description:song.description,cover:song.icon,genre:song.genre,level:song.level,
  difficulty:song.level==="Iniciante"?1:2,bpm:song.bpm,minutes:Math.max(1,Math.ceil(song.totalBeats*60/song.bpm/60)),
  notes:song.steps,source:"Composição original",capability:"pitch-and-lyrics"
 }));
 const personal=personalSongs.map(song=>({
  id:"personal:"+song.id,personalId:song.id,kind:"personal",instrument:"voice",title:song.title,
  artist:song.artist,description:song.timed?"Letra com sincronização LRC":"Texto com avanço aproximado",
  cover:"📝",genre:"Minha biblioteca",level:"Livre",difficulty:0,minutes:Math.max(1,Math.ceil(song.durationMs/60000)),
  notes:[],source:"Adicionada pelo aluno, uso autorizado declarado",capability:"lyrics-only"
 }));
 return [...piano,...stringSongs,...vocals,...personal];
}
export function catalogEntryById(id,data){
 return catalogEntries(data).find(e=>e.id===id)||null;
}
export function catalogFilter(entries,{query="",scope="mine",difficulty="all",favorites=[],instrument="piano"}={}){
 const activeId=instrumentId(instrument),favoriteSet=new Set(Array.isArray(favorites)?favorites:[]);
 const matches=entries.filter(e=>{
  if(scope==="mine"&&!(e.instrument===activeId||(activeId==="keyboard"&&e.instrument==="piano")))return false;
  if(scope==="voice"&&e.kind!=="vocal"&&e.kind!=="personal")return false;
  if(scope==="favorites"&&!favoriteSet.has(e.id))return false;
  if(scope==="personal"&&e.kind!=="personal")return false;
  if(difficulty!=="all"&&String(e.difficulty)!==String(difficulty))return false;
  const words=fold([e.title,e.artist,e.description,e.genre,instrumentInfo(e.instrument).name,e.source].join(" "));
  return !query.trim()||words.includes(fold(query));
 });
 return matches.sort((a,b)=>{
  const fA=favoriteSet.has(a.id)?1:0,fB=favoriteSet.has(b.id)?1:0;
  if(fA!==fB)return fB-fA;
  const aMine=a.instrument===activeId||(activeId==="keyboard"&&a.instrument==="piano");
  const bMine=b.instrument===activeId||(activeId==="keyboard"&&b.instrument==="piano");
  if(aMine!==bMine)return Number(bMine)-Number(aMine);
  return a.difficulty-b.difficulty||a.title.localeCompare(b.title,"pt-BR");
 });
}
export function suggestedCatalogEntry(entries,instrument,completed={},favorites=[]){
 const target=instrumentId(instrument),matching=entries.filter(e=>(e.instrument===target||(target==="keyboard"&&e.instrument==="piano"))&&e.kind!=="personal");
 return matching.find(e=>!completed[e.lessonId||e.vocalId])||matching[0]||null;
}
