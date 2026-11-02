import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=(p,exportNames,dependencies={})=>{
 const source=readFileSync(new URL("../"+p,import.meta.url),"utf8")
   .replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
 return new Function(...Object.keys(dependencies),source+";return {"+exportNames.join(",")+"}")(...Object.values(dependencies));
};
const music=load("music-data.js",["LESSONS","SONGS","noteName","noteShort"]);
const instruments=load("instrument-data.js",["INSTRUMENTS","STRING_LESSONS","instrumentId","instrumentInfo","instrumentName",
 "lessonsForInstrument","findInstrumentLesson","getInstrumentCourses","stringPosition","stringTunings"]);
const singing=load("singing-data.js",["VOCAL_SONGS"]);
const ui=load("instrument-ui.js",["fretboard","instrumentOptions"],{...music,...instruments});
const model=load("catalog-model.js",["publishedCatalogEntries","normalizedLegacyCatalog","catalogSummary","curatedLessonById","validateEditorialCatalog"]);
const {PUBLISHED_CATALOG}=load("catalog-published.js",["PUBLISHED_CATALOG"]);
const catalog=load("catalog.js",["catalogEntries","catalogFilter","catalogEntryById","suggestedCatalogEntry","publishedLesson","publishedLessons","availableGenres"],{...instruments,...model,PUBLISHED_CATALOG});
const discovery=load("discovery-ui.js",["instrumentContext","instrumentPicker","learningPath","catalogResultsMarkup","catalogPage","songDetailPage"],
 {...instruments,...ui,...catalog,availableGenres:catalog.availableGenres});
const data={pianoSongs:music.SONGS,lessons:music.LESSONS,vocalSongs:singing.VOCAL_SONGS};

test("sete opções mapeiam corretamente instrumentos anteriores e voz",()=>{
 assert.equal(instruments.INSTRUMENTS.length,7);
 for(const [name,id] of [["Piano","piano"],["Teclado","keyboard"],["Violão","acoustic"],["Guitarra","electric"],
  ["Ukulele","ukulele"],["Baixo","bass-guitar"],["Voz","voice"]]){
  assert.equal(instruments.instrumentId(name),id);
 }
});
test("cada instrumento oferece somente a trilha musical adequada",()=>{
 const a=instruments.lessonsForInstrument("Violão",music.LESSONS);
 const b=instruments.lessonsForInstrument("Guitarra",music.LESSONS);
 const u=instruments.lessonsForInstrument("Ukulele",music.LESSONS);
 const bass=instruments.lessonsForInstrument("Baixo",music.LESSONS);
 assert.ok(a.length>=6);assert.ok(b.length>=6);assert.ok(u.length>=6);assert.ok(bass.length>=6);
 assert.ok(a.every(l=>l.instrument==="acoustic"));
 assert.ok(b.every(l=>l.instrument==="electric"));
 assert.ok(bass.every(l=>l.instrument==="bass-guitar"));
 assert.equal(instruments.lessonsForInstrument("Voz",music.LESSONS).length,0);
 const keyboard=instruments.lessonsForInstrument("Teclado",music.LESSONS);
 assert.equal(keyboard.length,music.LESSONS.length);
 assert.deepEqual(new Set(keyboard.map(x=>x.id)),new Set(music.LESSONS.map(x=>x.id)));
 assert.deepEqual(keyboard.slice(0,4).map(x=>x.id),["first","five","reading","rhythm"]);
});
test("não há duplicação de IDs nem melodias fora do alcance do braço exibido",()=>{
 const ids=instruments.STRING_LESSONS.map(l=>l.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const l of instruments.STRING_LESSONS){
  for(const step of l.steps){
    const pos=instruments.stringPosition(l.instrument,step.m);
    assert.ok(pos,"posição ausente: "+l.id);
    assert.ok(pos.fret<=7,"posição não exibida: "+l.id);
    assert.ok(step.beats>0);
  }
 }
});
test("exercícios de canto não são descritos como acordes de guitarra",()=>{
 const path=discovery.learningPath({instrument:"Voz",lessons:[]});
 assert.ok(path.includes("TRILHA DE CANTO"));
 assert.ok(path.includes("data-vocal="));
 assert.equal(path.includes("data-lesson="),false);
});
test("braço correto para cada instrumento identifica corda e casa",()=>{
 const views=[
  ui.fretboard("Violão",{m:67},{showHint:true}),
  ui.fretboard("Ukulele",{m:72},{showHint:true}),
  ui.fretboard("Baixo",{m:45},{showHint:true})];
 for(const v of views){assert.ok(v.includes('class="fretboard"'));assert.ok(v.includes("casa"));assert.ok(v.includes("fret-marker"))}
});
test("biblioteca reúne lições realmente tocáveis e canções vocais autorais",()=>{
 const entries=catalog.catalogEntries(data);
 assert.ok(entries.length>=30);
 assert.ok(entries.filter(x=>x.instrument==="acoustic").length>=6);
 assert.ok(entries.filter(x=>x.instrument==="voice").length>=3);
 assert.ok(entries.every(x=>x.source));
 assert.ok(entries.every(x=>x.kind!=="personal"||!x.notes.length));
});
test("filtros por instrumento não mostram aulas de piano para violão",()=>{
 const entries=catalog.catalogEntries(data);
 const guitar=catalog.catalogFilter(entries,{scope:"mine",instrument:"Violão"});
 assert.ok(guitar.length>=6);assert.ok(guitar.every(x=>x.instrument==="acoustic"));
 const keys=catalog.catalogFilter(entries,{scope:"mine",instrument:"Teclado"});
 assert.ok(keys.length>=5);assert.ok(keys.every(x=>x.instrument==="piano"));
});
test("busca ignora acentos e ordena favoritos corretamente",()=>{
 const entries=catalog.catalogEntries(data);
 const res=catalog.catalogFilter(entries,{scope:"all",query:"VIOLAO",instrument:"Piano"});
 assert.ok(res.length>=6);
 const id="piano:joy";
 const selected=catalog.catalogFilter(entries,{scope:"all",instrument:"Piano",favorites:[id]});
 assert.equal(selected[0].id,id);
});
test("seleção por nível, favoritos e canto é funcional",()=>{
 const entries=catalog.catalogEntries(data);
 assert.ok(catalog.catalogFilter(entries,{scope:"favorites",favorites:["piano:joy"],instrument:"Piano"}).length===1);
 assert.ok(catalog.catalogFilter(entries,{scope:"voice",instrument:"Violão"}).every(x=>x.instrument==="voice"));
 assert.ok(catalog.catalogFilter(entries,{scope:"all",instrument:"Piano",difficulty:"2"}).length>=1);
});
test("telas de descoberta contêm CTAs reais e estado vazio acessível",()=>{
 const entries=catalog.catalogEntries(data);
 const markup=discovery.catalogPage({entries,scope:"all",difficulty:"all",query:"",favorites:[],instrument:"Piano"});
 assert.ok(markup.includes('id="catalog-query"'));
 assert.ok(markup.includes('data-open-song="piano:joy"'));
 assert.ok(markup.includes("catalog-fav"));
 const empty=discovery.catalogResultsMarkup(entries,{query:"zzzinexistente",scope:"all",favorites:[]});
 assert.ok(empty.includes("Nenhuma música encontrada"));
 assert.ok(empty.includes('data-action="catalog-reset"'));
});
test("detalhe avisa quando instrumento é diferente antes de iniciar",()=>{
 const item=catalog.catalogEntryById("piano:joy",data);
 const detail=discovery.songDetailPage(item,{instrument:"Violão"});
 assert.ok(detail.includes("Trocar para Piano"));
 assert.ok(detail.includes('data-action="preview-song"'));
 const same=discovery.songDetailPage(item,{instrument:"Teclado"});
 assert.ok(same.includes("Começar prática"));
});
test("cinco abas móveis, áreas seguras e arquivos em cache",()=>{
 const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 const css=readFileSync(new URL("../mobile-ux.css",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
 const nav=app.match(/const mobileRoutes=\[([^\n]+)\]/);
 assert.ok(nav);
 assert.equal((nav[1].match(/\["/g)||[]).length,5);
 assert.ok(css.includes("env(safe-area-inset-bottom)"));
 assert.ok(css.includes("min-height:44px"));
 for(const name of ["mobile-ux.css","instrument-data.js","instrument-ui.js","catalog.js","discovery-ui.js"])
  assert.ok(sw.includes(name));
});
