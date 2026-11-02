import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=(path,names,deps={})=>{
 const src=readFileSync(new URL("../"+path,import.meta.url),"utf8").replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
 return new Function(...Object.keys(deps),src+";return {"+names.join(",")+"};")(...Object.values(deps));
};
const model=load("catalog-model.js",["validateEditorialCatalog","publishedCatalogEntries","curatedLessonById","normalizedLegacyCatalog","catalogSummary"]);
const {PUBLISHED_CATALOG}=load("catalog-published.js",["PUBLISHED_CATALOG"]);
const ins=load("instrument-data.js",["STRING_LESSONS","instrumentId","instrumentInfo"]);
const music=load("music-data.js",["SONGS","LESSONS"]);
const vocals=load("singing-data.js",["VOCAL_SONGS"]);
const catalog=load("catalog.js",["catalogEntries","catalogFilter","availableGenres","publishedLesson","catalogRelationships"],{...ins,...model,PUBLISHED_CATALOG});
const importer=load("score-import.js",["parseMIDI","parseMusicXML","draftFromImport"]);
const ui=load("score-import-ui.js",["scoreImportPage"]);
const entries=catalog.catalogEntries({pianoSongs:music.SONGS,lessons:music.LESSONS,vocalSongs:vocals.VOCAL_SONGS});
const fixture={
 schema:"musical-sense-catalog",version:1,
 works:[{id:"my-song",title:"Minha música",composer:"Autora",genre:"Autorais",license:"original",
  status:"draft",rightsVerified:false}],
 arrangements:[{id:"my-song-piano",workId:"my-song",instrument:"piano",kind:"song",
  difficulty:1,bpm:90,status:"draft",notes:[{m:60,beats:1},{m:62,beats:1},{m:64,beats:2}]}]
};
test("catálogo inicial mantém as 32 entradas e diferencia músicas, exercícios e letras",()=>{
 assert.equal(entries.length,32);
 assert.ok(entries.every(x=>x.workId&&x.arrangementId&&x.contentType));
 const types=Object.fromEntries(["song","exercise"].map(t=>[t,entries.filter(x=>x.contentType===t).length]));
 assert.ok(types.song>0&&types.exercise>0);
 const rel=catalog.catalogRelationships(entries);
 assert.equal(rel.works.length,32);assert.equal(rel.arrangements.length,32);
 assert.equal(rel.lessons.length,32);
});
test("filtros de tipo e gênero funcionam sem afetar o instrumento",()=>{
 const songs=catalog.catalogFilter(entries,{scope:"mine",instrument:"Piano",type:"song"});
 assert.ok(songs.length>0&&songs.every(x=>x.contentType==="song"&&x.instrument==="piano"));
 const exercises=catalog.catalogFilter(entries,{scope:"all",instrument:"Piano",type:"exercise"});
 assert.ok(exercises.every(x=>x.contentType==="exercise"));
 const classic=catalog.catalogFilter(entries,{scope:"all",instrument:"Piano",genre:"Clássicas"});
 assert.ok(classic.some(x=>x.title==="Ode à Alegria"));
 assert.ok(catalog.availableGenres(entries).includes("Autorais"));
});
test("rascunho não fica público e é aceito no processo editorial",()=>{
 const result=model.validateEditorialCatalog(fixture);
 assert.equal(result.valid,true);
 assert.equal(result.published.works.length,0);
 assert.equal(result.published.arrangements.length,0);
});
test("publicação sem revisão e sem origem comprovada é rejeitada",()=>{
 const copy=structuredClone(fixture);
 copy.works[0].status="published";copy.arrangements[0].status="published";
 const validation=model.validateEditorialCatalog(copy);
 assert.equal(validation.valid,false);
 assert.ok(validation.errors.some(x=>/revisão|evidência/.test(x)));
 assert.ok(validation.errors.some(x=>/arranjo/i.test(x)));
});
test("publicação revisada entra no catálogo e gera aula executável",()=>{
 const copy=structuredClone(fixture);
 Object.assign(copy.works[0],{status:"published",rightsVerified:true,reviewedBy:"Editor",reviewedAt:"2026-11-02",
  sourceUrl:"https://example.org/partitura"});
 Object.assign(copy.arrangements[0],{status:"published",reviewedBy:"Editor",reviewedAt:"2026-11-02"});
 const result=model.validateEditorialCatalog(copy);
 assert.equal(result.valid,true,JSON.stringify(result.errors));
 const published=model.publishedCatalogEntries(result.published);
 assert.equal(published[0].id,"curated:my-song-piano");
 const lesson=model.curatedLessonById("curated-my-song-piano",result.published);
 assert.deepEqual(lesson.steps.map(s=>s.m),[60,62,64]);
 assert.equal(lesson.instrument,"piano");
});
test("não publica arranjo com acordes, tempos inválidos ou permissões sem evidência",()=>{
 const copy=structuredClone(fixture);
 copy.arrangements[0].notes[1].chord=true;
 assert.equal(model.validateEditorialCatalog(copy).valid,false);
 copy.arrangements[0].notes[1].chord=false;
 copy.arrangements[0].bpm=800;
 assert.equal(model.validateEditorialCatalog(copy).valid,false);
 copy.arrangements[0].bpm=90;
 copy.works[0].status="published";copy.works[0].license="permission";
 copy.works[0].rightsVerified=true;copy.works[0].reviewedBy="Editor";copy.works[0].reviewedAt="2026-11-02";
 assert.equal(model.validateEditorialCatalog(copy).valid,false);
});
function createMidi({polyphonic=false}={}){
 const events=[0,255,81,3,7,161,32,0,0x90,60,95];
 if(polyphonic)events.push(0,0x90,64,70);
 events.push(0x83,0x60,0x80,60,0);
 if(polyphonic)events.push(0,0x80,64,0);
 events.push(0,0x90,62,95,0x83,0x60,0x80,62,0);
 events.push(0,0x90,64,95,0x87,0x40,0x80,64,0);
 events.push(0,255,47,0);
 const len=events.length;
 return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,
  77,84,114,107,(len>>>24)&255,(len>>>16)&255,(len>>>8)&255,len&255,...events]);
}
test("MIDI SMF tipo 0 importa melodia com BPM e durações",()=>{
 const song=importer.parseMIDI(createMidi());
 assert.equal(song.format,"MIDI");
 assert.equal(song.bpm,120);
 assert.deepEqual(song.notes.map(n=>n.m),[60,62,64]);
 assert.deepEqual(song.notes.map(n=>n.beats),[1,1,2]);
});
test("MIDI com notas simultâneas é recusado em vez de perder a harmonia",()=>{
 assert.throws(()=>importer.parseMIDI(createMidi({polyphonic:true})),/simultâneas/);
});
test("rascunho importado possui entidade de obra e de arranjo, sem publicar",()=>{
 const preview=importer.parseMIDI(createMidi());
 const draft=importer.draftFromImport(preview,{title:"Música nova",composer:"Eu",instrument:"ukulele",license:"original"});
 assert.equal(draft.works[0].status,"draft");
 assert.equal(draft.arrangements[0].status,"draft");
 assert.equal(draft.arrangements[0].instrument,"ukulele");
 assert.equal(model.validateEditorialCatalog(draft).valid,true);
});
test("MusicXML rejeita entradas perigosas e formatos compactados",()=>{
 assert.throws(()=>importer.parseMusicXML('<!DOCTYPE score-partwise [<!ENTITY x SYSTEM "file:///etc/passwd">]>'),/DTD/);
 assert.throws(()=>importer.parseMusicXML(""),/vazia/);
});
test("formulário de importação deixa claro que não publica automaticamente",()=>{
 const page=ui.scoreImportPage({preview:importer.parseMIDI(createMidi())});
 assert.ok(page.includes('id="score-file"'));
 assert.ok(page.includes('id="score-draft-form"'));
 assert.ok(page.includes('name="rights"'));
 assert.ok(page.includes('data-action="import-audition"'));
 assert.ok(page.includes("sem publicar conteúdo"));
});
test("build editorial permanece sincronizado e começa sem obras extras na Fase 2",()=>{
 assert.deepEqual(PUBLISHED_CATALOG,{works:[],arrangements:[]});
 const original=JSON.parse(readFileSync(new URL("../data/catalog.json",import.meta.url),"utf8"));
 assert.equal(model.validateEditorialCatalog(original).valid,true);
});
