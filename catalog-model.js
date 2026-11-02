/**
 * Catálogo editorial v1: separa obra, arranjo e aula, sem alterar IDs existentes.
 * Conteúdo publicado exige revisão editorial e autorização verificável.
 */
export const CATALOG_SCHEMA="musical-sense-catalog";
export const CATALOG_VERSION=1;
export const SUPPORTED_LICENSES=["original","CC0","CC-BY","public-domain","permission"];
export const SUPPORTED_INSTRUMENTS=["piano","keyboard","acoustic","electric","ukulele","bass-guitar"];
const validId=id=>typeof id==="string"&&/^[a-z0-9][a-z0-9-]{1,79}$/.test(id);
const plain=value=>value&&typeof value==="object"&&!Array.isArray(value);
const allowedUrl=value=>typeof value==="string"&&/^https:\/\/[^\s"'<>]{3,400}$/.test(value);
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const text=(v,max=150)=>typeof v==="string"&&v.trim().length>0&&v.trim().length<=max;
const permittedKind=["song","exercise"];
const cleanNotes=notes=>Array.isArray(notes)&&notes.length>=3&&notes.length<=512&&notes.every(n=>plain(n)&&integer(n.m,24,96)&&Number.isFinite(n.beats)&&n.beats>=.25&&n.beats<=8&&!n.chord&&!n.rest);
export function validateEditorialCatalog(raw,{allowDrafts=true}={}){
 const errors=[];
 if(!plain(raw)||raw.schema!==CATALOG_SCHEMA||raw.version!==CATALOG_VERSION)
  return {valid:false,errors:["Cabeçalho ou versão de catálogo incompatível."],published:{works:[],arrangements:[]},count:0};
 const works=Array.isArray(raw.works)?raw.works:[],arrangements=Array.isArray(raw.arrangements)?raw.arrangements:[];
 if(!Array.isArray(raw.works)||!Array.isArray(raw.arrangements))errors.push("Obras e arranjos precisam ser listas.");
 if(works.length>2000||arrangements.length>5000)errors.push("Catálogo excede o limite desta versão.");
 const workIds=new Set(),arrangementIds=new Set();
 for(const w of works){
  if(!plain(w)){errors.push("Obra inválida.");continue}
  if(!validId(w.id)||workIds.has(w.id))errors.push("ID de obra inválido ou repetido: "+String(w.id));
  else workIds.add(w.id);
  if(!text(w.title,120)||!text(w.composer,120))errors.push("Título/compositor inválido: "+String(w.id));
  if(!text(w.genre,45))errors.push("Gênero ausente: "+String(w.id));
  if(!SUPPORTED_LICENSES.includes(w.license))errors.push("Licença não aceita: "+String(w.id));
  if(!["draft","published"].includes(w.status))errors.push("Status de obra inválido: "+String(w.id));
  if(w.sourceUrl!==undefined&&w.sourceUrl!==""&&!allowedUrl(w.sourceUrl))errors.push("URL de fonte deve ser HTTPS: "+String(w.id));
  if(w.status==="published"){
   if(w.rightsVerified!==true||!text(w.reviewedBy,120)||!text(w.reviewedAt,50))
    errors.push("Publicação exige revisão explícita e identificação da fonte: "+String(w.id));
   if(!w.sourceUrl&&!text(w.evidence,400))errors.push("Falta evidência da origem/licença: "+String(w.id));
   if(w.license==="permission"&&!text(w.evidence,400))errors.push("Permissão exige documento de autorização: "+String(w.id));
   if(w.license==="CC-BY"&&!text(w.attribution,200))errors.push("CC-BY exige atribuição: "+String(w.id));
  }else if(!allowDrafts)errors.push("Há obra em rascunho: "+String(w.id));
 }
 for(const a of arrangements){
  if(!plain(a)){errors.push("Arranjo inválido.");continue}
  if(!validId(a.id)||arrangementIds.has(a.id))errors.push("ID de arranjo inválido ou repetido: "+String(a.id));
  else arrangementIds.add(a.id);
  if(!workIds.has(a.workId))errors.push("Arranjo aponta para obra inexistente: "+String(a.id));
  if(!SUPPORTED_INSTRUMENTS.includes(a.instrument))errors.push("Instrumento inválido: "+String(a.id));
  if(!permittedKind.includes(a.kind))errors.push("Tipo de arranjo inválido: "+String(a.id));
  if(!integer(a.difficulty,1,3))errors.push("Dificuldade precisa ser 1, 2 ou 3: "+String(a.id));
  if(!integer(a.bpm,35,220))errors.push("BPM inválido: "+String(a.id));
  if(!cleanNotes(a.notes))errors.push("Notas monofônicas inválidas, ausentes ou excessivas: "+String(a.id));
  if(!["draft","published"].includes(a.status))errors.push("Status de arranjo inválido: "+String(a.id));
  if(a.status==="published"){
   const w=works.find(x=>x?.id===a.workId);
   if(w?.status!=="published")errors.push("Obra precisa estar publicada antes do arranjo: "+String(a.id));
   if(!text(a.reviewedBy,120)||!text(a.reviewedAt,50))errors.push("Arranjo precisa de revisão editorial: "+String(a.id));
  }else if(!allowDrafts)errors.push("Há arranjo em rascunho: "+String(a.id));
 }
 const publishedWorks=works.filter(w=>w?.status==="published");
 const publishedArrangements=arrangements.filter(a=>a?.status==="published"&&publishedWorks.some(w=>w.id===a.workId));
 return {valid:errors.length===0,errors,published:{works:publishedWorks,arrangements:publishedArrangements},
  count:arrangements.length,worksCount:works.length};
}
export function normalizedLegacyCatalog(entries){
 const works=[],arrangements=[],lessons=[],seen=new Map();
 for(const entry of entries){
  if(!entry||!entry.id)continue;
  const workId=entry.workId||"legacy-"+entry.id.replace(/[^a-z0-9-]/gi,"-").toLowerCase();
  const arrangementId=entry.arrangementId||"legacy-arr-"+entry.id.replace(/[^a-z0-9-]/gi,"-").toLowerCase();
  const work={id:workId,title:entry.title,composer:entry.artist,genre:entry.genre,source:entry.source,contentType:entry.contentType||"song",catalogOrigin:"legacy"};
  if(!seen.has(workId)){works.push(work);seen.set(workId,true)}
  arrangements.push({id:arrangementId,workId,instrument:entry.instrument,difficulty:entry.difficulty,bpm:entry.bpm||80,
    notes:entry.notes||[],status:"published",catalogOrigin:"legacy",entryId:entry.id});
  if(entry.lessonId||entry.vocalId)lessons.push({id:entry.lessonId||entry.vocalId,workId,arrangementId,kind:entry.kind});
 }
 return {works,arrangements,lessons};
}
export function publishedCatalogEntries(catalog){
 if(!catalog||!Array.isArray(catalog.works)||!Array.isArray(catalog.arrangements))return [];
 return catalog.arrangements.flatMap(a=>{
  const w=catalog.works.find(x=>x.id===a.workId);
  if(!w||a.status!=="published"||w.status!=="published")return [];
  return [{
   id:"curated:"+a.id,lessonId:"curated-"+a.id,kind:"instrument",instrument:a.instrument==="keyboard"?"piano":a.instrument,
   title:w.title,artist:w.composer,description:a.description||"Arranjo revisado para prática por microfone",
   cover:a.cover||"🎼",genre:w.genre,level:["","Iniciante","Básico","Intermediário"][a.difficulty]||"Iniciante",
   difficulty:a.difficulty,bpm:a.bpm,minutes:Math.max(1,Math.ceil(a.notes.reduce((sum,n)=>sum+n.beats,0)*60/a.bpm/60)),
   notes:a.notes.map(n=>({m:n.m,beats:n.beats,f:0})),source:w.sourceUrl||w.evidence||w.license,capability:"pitch",
   contentType:a.kind,workId:w.id,arrangementId:a.id,license:w.license,attribution:w.attribution||w.composer,catalogOrigin:"curated"
  }];
 });
}
export function curatedLessonById(id,catalog){
 if(typeof id!=="string"||!id.startsWith("curated-"))return null;
 const entry=publishedCatalogEntries(catalog).find(x=>x.lessonId===id);
 if(!entry)return null;
 return {id:entry.lessonId,instrument:entry.instrument,course:entry.contentType==="song"?"solo":"fundamentals",
  title:entry.title,subtitle:entry.description,icon:entry.cover,kind:entry.contentType==="song"?"song":"technique",
  level:entry.difficulty,minutes:entry.minutes,xp:Math.min(130,65+entry.notes.length*3),
  tip:"Toque uma nota por vez. Este arranjo foi revisado para prática monofônica.",
  steps:entry.notes};
}
export function catalogSummary(entries){
 const normalized=normalizedLegacyCatalog(entries);
 const counts={songs:0,exercises:0,lyrics:0};
 for(const e of entries){
  if(e.contentType==="exercise")counts.exercises++;
  else if(e.contentType==="lyrics")counts.lyrics++;
  else counts.songs++;
 }
 return {works:normalized.works.length,arrangements:normalized.arrangements.length,lessons:normalized.lessons.length,...counts};
}
