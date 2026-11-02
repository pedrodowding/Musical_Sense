import {instrumentId,instrumentInfo,STRING_LESSONS} from "./instrument-data.js";
import {publishedCatalogEntries,normalizedLegacyCatalog,catalogSummary,curatedLessonById} from "./catalog-model.js";
import {PUBLISHED_CATALOG} from "./catalog-published.js";
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
export function catalogEntries({pianoSongs,lessons,vocalSongs,personalSongs=[]}){
 const piano=pianoSongs.map(song=>{
  const lesson=lessons.find(l=>l.id===song.id);
  return {
   id:"piano:"+song.id,lessonId:song.id,kind:"instrument",instrument:"piano",title:song.name,
   artist:song.artist,description:lesson?.subtitle||"Pratique no piano ou teclado",
   cover:song.cover,genre:song.genre,level:"Iniciante",difficulty:1,minutes:lesson?.minutes||5,
   notes:lesson?.steps||[],source:song.id==="joy"?"Tema de Beethoven em domínio público":song.id==="lamb"?"Melodia tradicional":"Exercício ou melodia original",
   capability:"pitch",contentType:lesson?.kind==="song"?"song":"exercise",
   workId:"legacy-piano-"+song.id,arrangementId:"legacy-piano-arr-"+song.id,catalogOrigin:"legacy"
  };
 });
 const stringSongs=STRING_LESSONS.map(l=>({
  id:"string:"+l.id,lessonId:l.id,kind:"instrument",instrument:l.instrument,title:l.title,
  artist:"Musical Sense",description:l.subtitle,cover:l.icon,genre:l.kind==="song"?"Melodias":"Exercícios",level:"Iniciante",
  difficulty:1,minutes:l.minutes,notes:l.steps,source:"Conteúdo didático original",capability:"pitch",
  contentType:l.kind==="song"?"song":"exercise",workId:"legacy-string-"+l.id,
  arrangementId:"legacy-string-arr-"+l.id,catalogOrigin:"legacy"
 }));
 const vocals=vocalSongs.map(song=>({
  id:"vocal:"+song.id,vocalId:song.id,kind:"vocal",instrument:"voice",title:song.title,
  artist:song.artist,description:song.description,cover:song.icon,genre:song.genre,level:song.level,
  difficulty:song.level==="Iniciante"?1:2,bpm:song.bpm,minutes:Math.max(1,Math.ceil(song.totalBeats*60/song.bpm/60)),
  notes:song.steps,source:"Composição original",capability:"pitch-and-lyrics",
  contentType:song.genre==="Vocalizes"?"exercise":"song",workId:"legacy-vocal-"+song.id,
  arrangementId:"legacy-vocal-arr-"+song.id,catalogOrigin:"legacy"
 }));
 const personal=personalSongs.map(song=>({
  id:"personal:"+song.id,personalId:song.id,kind:"personal",instrument:"voice",title:song.title,
  artist:song.artist,description:song.timed?"Letra com sincronização LRC":"Texto com avanço aproximado",
  cover:"📝",genre:"Minha biblioteca",level:"Livre",difficulty:0,minutes:Math.max(1,Math.ceil(song.durationMs/60000)),
  notes:[],source:"Letra pessoal autorizada pelo aluno",capability:"lyrics-only",
  contentType:"lyrics",workId:"personal-work-"+song.id,arrangementId:"personal-arr-"+song.id,catalogOrigin:"personal"
 }));
 return [...piano,...stringSongs,...vocals,...publishedCatalogEntries(PUBLISHED_CATALOG),...personal];
}
export function catalogEntryById(id,data){
 return catalogEntries(data).find(e=>e.id===id)||null;
}
export function catalogFilter(entries,{query="",scope="mine",difficulty="all",favorites=[],instrument="piano",type="all",genre="all"}={}){
 const activeId=instrumentId(instrument),favoriteSet=new Set(Array.isArray(favorites)?favorites:[]);
 const matches=entries.filter(e=>{
  if(scope==="mine"&&!(e.instrument===activeId||(activeId==="keyboard"&&e.instrument==="piano")))return false;
  if(scope==="voice"&&e.kind!=="vocal"&&e.kind!=="personal")return false;
  if(scope==="favorites"&&!favoriteSet.has(e.id))return false;
  if(scope==="personal"&&e.kind!=="personal")return false;
  if(difficulty!=="all"&&String(e.difficulty)!==String(difficulty))return false;
  if(type!=="all"&&e.contentType!==type)return false;
  if(genre!=="all"&&e.genre!==genre)return false;
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

export function catalogRelationships(entries){
 const normalized=normalizedLegacyCatalog(entries);
 return {...normalized,summary:catalogSummary(entries)};
}
export function publishedLesson(id){
 return curatedLessonById(id,PUBLISHED_CATALOG);
}
export function publishedLessons(){
 return publishedCatalogEntries(PUBLISHED_CATALOG).map(entry=>curatedLessonById(entry.lessonId,PUBLISHED_CATALOG)).filter(Boolean);
}
export function availableGenres(entries){
 return [...new Set(entries.map(x=>x.genre).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
