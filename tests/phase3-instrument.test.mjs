import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const load=(path,keys,deps={})=>new Function(...Object.keys(deps),
 read(path).replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"")+";return {"+keys.join(",")+"};")(...Object.values(deps));
const music=load("music-data.js",["SONGS","LESSONS"]);
const instruments=load("instrument-data.js",["INSTRUMENTS","STRING_LESSONS","instrumentId","instrumentInfo","stringPosition","lessonsForInstrument"]);
const vocal=load("singing-data.js",["VOCAL_SONGS"]);
const model=load("catalog-model.js",["validateEditorialCatalog","publishedCatalogEntries","curatedLessonById","normalizedLegacyCatalog","catalogSummary"]);
const {PUBLISHED_CATALOG}=load("catalog-published.js",["PUBLISHED_CATALOG"]);
const catalog=load("catalog.js",["catalogEntries","catalogFilter","publishedLessons","publishedLesson"],{...model,...instruments,PUBLISHED_CATALOG});
const home=load("home-ui.js",["homeDashboard"]);
const singing=load("singing-ui.js",["renderSingingHome"]);
const editorial=JSON.parse(read("data/catalog.json"));
const entries=catalog.catalogEntries({pianoSongs:music.SONGS,lessons:music.LESSONS,vocalSongs:vocal.VOCAL_SONGS});

test("expansão oferece cinquenta melodias e preserva quatorze exercícios anteriores",()=>{
 assert.equal(entries.length,64);
 assert.equal(entries.filter(x=>x.contentType==="song").length,50);
 assert.equal(entries.filter(x=>x.contentType==="exercise").length,14);
 assert.equal(PUBLISHED_CATALOG.works.length,28);
 assert.equal(PUBLISHED_CATALOG.arrangements.length,28);
 assert.equal(vocal.VOCAL_SONGS.length,7);
 assert.equal(new Set(entries.map(e=>e.id)).size,64);
});
test("todas as melodias novas possuem origem declarada e revisão automatizada transparente",()=>{
 const validation=model.validateEditorialCatalog(editorial);
 assert.equal(validation.valid,true,validation.errors.join("\n"));
 assert.equal(validation.published.works.length,28);
 assert.ok(editorial.works.every(w=>w.license==="original"&&w.evidence.includes("criada para este projeto")));
 assert.ok(editorial.works.every(w=>w.reviewedBy.includes("automatizada")&&w.reviewedBy.includes("sem revisão humana")));
 assert.ok(editorial.arrangements.every(a=>a.status==="published"&&a.notes.length>=12&&a.notes.length<=30));
});
test("caminhos novos possuem notas distintas e estão dentro das casas iniciais das cordas",()=>{
 const duplicates=new Set();
 for(const arrangement of editorial.arrangements){
  const key=arrangement.instrument+":"+arrangement.notes.map(x=>x.m).join(",");
  assert.ok(!duplicates.has(key),"Melodia duplicada no instrumento: "+arrangement.id);
  duplicates.add(key);
  assert.ok(arrangement.notes.every(x=>x.beats>=.25&&x.beats<=8));
  if(arrangement.instrument!=="piano"){
   for(const note of arrangement.notes){
    const position=instruments.stringPosition(arrangement.instrument,note.m);
    assert.ok(position,"Nota fora do instrumento: "+arrangement.id);
    assert.ok(position.fret<=7,"Casa distante no primeiro nível: "+arrangement.id);
   }
  }
 }
});
test("cada instrumento recebe músicas e aulas da sua modalidade",()=>{
 const totals={piano:13,keyboard:13,acoustic:11,electric:11,ukulele:11,"bass-guitar":11,voice:7};
 for(const [instrument,count] of Object.entries(totals)){
  const matching=catalog.catalogFilter(entries,{scope:"mine",instrument});
  assert.equal(matching.length,count,"Instrumento: "+instrument);
  const songs=matching.filter(x=>x.contentType==="song");
  assert.ok(songs.length>=5,"Poucas melodias: "+instrument);
  const ids=new Set(matching.map(x=>x.id));
  assert.equal(ids.size,matching.length);
 }
 assert.equal(catalog.publishedLessons().length,28);
 for(const lesson of catalog.publishedLessons()){
  assert.equal(lesson.instrument,instruments.instrumentInfo(lesson.instrument).id);
  assert.equal(lesson.kind,"song");
  assert.ok(lesson.steps.length>=12);
 }
});
test("início usa um único passo principal, uma recomendação e menus recolhíveis",()=>{
 for(const info of instruments.INSTRUMENTS){
  const voice=info.id==="voice";
  const lesson=instruments.lessonsForInstrument(info.id,music.LESSONS)[0];
  const songs=catalog.catalogFilter(entries,{scope:"mine",instrument:info.id,type:"song"});
  const html=home.homeDashboard({instrument:info,level:{level:1,progress:20},completed:0,total:10,
   nextLesson:lesson,nextVocal:vocal.VOCAL_SONGS[0],recommendation:songs[0],xp:100,streak:2});
  assert.ok(html.includes(info.name),"Instrumento ausente no início: "+info.id);
  assert.equal((html.match(/<details class="home-group"/g)||[]).length,2);
  assert.equal((html.match(/class="home-music-card"/g)||[]).length,1);
  assert.equal((html.match(/class="btn home-main-cta"/g)||[]).length,1);
  assert.ok(html.includes('data-route="courses"'));
  assert.ok(html.includes("Mais atividades"));
  assert.ok(html.includes("Minha evolução"));
  assert.ok(!html.includes('class="grid three"'));
  assert.ok(html.includes(voice?'data-vocal="voice-warmup"':'data-lesson="'+lesson.id+'"'));
 }
});
test("canto mantém letras e canções originais em subseções, sem ocupar a página inteira",()=>{
 const html=singing.renderSingingHome(vocal.VOCAL_SONGS,[],{});
 assert.ok(html.includes("Ver todas as 6 canções"));
 assert.ok(html.includes("Minhas letras"));
 assert.ok(html.includes('data-vocal="voice-colors"'));
 assert.equal((html.match(/<details class="home-group"/g)||[]).length,2);
});
test("menu principal é responsivo ao instrumento selecionado e mantém cinco destinos",()=>{
 const app=read("app.js");
 assert.ok(app.includes('voice?["singing","🎤","Cantar"]:["workouts","⏱","Praticar"]'));
 assert.ok(app.includes('db.soundTimbre="auto"'));
 assert.ok(app.includes('lessonInfo.group==="strings"?fretboard(lessonInfo.id'));
 const sw=read("sw.js");
 for(const asset of ["home-ui.js","home-focus.css","singing-data.js","catalog-published.js"]){
  assert.ok(sw.includes(asset),asset);
 }
 const css=read("home-focus.css");
 assert.ok(css.includes("max-width:480px"));
 assert.ok(css.includes("home-groups"));
});
