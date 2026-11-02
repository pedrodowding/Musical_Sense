import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const clean=s=>s.replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
const load=(path,names,bindings={})=>new Function(...Object.keys(bindings),clean(read(path))+";return {"+names.join(",")+"};")(...Object.values(bindings));
const homeUI=load("home-ui.js",["homeDashboard"]);
const account=load("account-ui.js",["profileSwitcher","profileHub","familyProfilesPage","progressPage","myMusicPage","settingsPage"]);
function boot(){
 const music=load("music-data.js",["LESSONS","COURSES","SONGS","noteName","noteShort","lessonById","getSessionNotes","initialUser"]);
 const instruments=load("instrument-data.js",["INSTRUMENTS","STRING_LESSONS","instrumentId","instrumentInfo","instrumentName",
  "lessonsForInstrument","findInstrumentLesson","getInstrumentCourses","stringTunings","stringPosition"]);
 const instrumentUI=load("instrument-ui.js",["fretboard","instrumentOptions"],{...music,...instruments});
 const singing=load("singing-data.js",["VOCAL_SONGS","vocalById"]);
 const model=load("catalog-model.js",["publishedCatalogEntries","normalizedLegacyCatalog","catalogSummary","curatedLessonById","validateEditorialCatalog"]);
 const {PUBLISHED_CATALOG}=load("catalog-published.js",["PUBLISHED_CATALOG"]);
 const catalog=load("catalog.js",["catalogEntries","catalogFilter","catalogEntryById","suggestedCatalogEntry","publishedLesson","publishedLessons","availableGenres"],{...instruments,...model,PUBLISHED_CATALOG});
 const discovery=load("discovery-ui.js",["instrumentContext","instrumentPicker","learningPath","catalogResultsMarkup","catalogPage","songDetailPage"],{
  ...instruments,...instrumentUI,...catalog,availableGenres:catalog.availableGenres
 });
 const lyrics=load("lyrics-library.js",["createPersonalSong","safeLibrary"]);
 const game=load("gamification.js",["awardPractice","ensureProgress","levelInfo","missionState","streakInfo","localDay","BADGES"]);
 const backup=load("backup.js",["makeBackup","parseBackup"],{...game,...lyrics});
 const scoreImport=load("score-import.js",["parseMusicXML","parseMIDI","draftFromImport"]);
 const scoreImportUI=load("score-import-ui.js",["scoreImportPage"]);
 const singingEngine=load("singing-engine.js",["SingingSession"]);
 const performanceEngine=load("performance-engine.js",["PerformanceSession"]);
 const perf={now:()=>0};
 const singingUI=load("singing-ui.js",["renderSingingHome","renderImportLyrics","renderVocalPractice","renderVocalResult","renderPersonalPractice","renderAchievements"],{performance:perf});
 const performanceUI=load("performance-view.js",["performanceRollSvg","performancePanel","performanceResultExtra"],{performance:perf});
 const state={html:"",persisted:null,writes:0,dialog:{open:false,showModal(){this.open=true},close(){this.open=false}},promptValue:"Renomeado",confirmResult:true};
 const callbacks={};
 const document={
  title:"",hidden:false,querySelector(sel){
   if(sel==="#app")return {set innerHTML(v){state.html=v;state.dialog.open=false},get innerHTML(){return state.html}};
   if(sel==="#profile-dialog"&&state.html.includes('id="profile-dialog"'))return state.dialog;
   if(sel==="#account-heading")return {focus(){state.focused=true}};
   return null;
  },
  querySelectorAll(){return[]},addEventListener(name,fn){callbacks[name]=fn},
  createElement(){return {remove(){},set textContent(v){}}},body:{appendChild(){}}
 };
 const window={addEventListener(){},scrollTo(){},confirm(){return state.confirmResult},prompt(){return state.promptValue},
  isSecureContext:true,location:{reload(){}}};
 const localStorage={getItem(){return state.persisted},setItem(_,value){state.writes++;state.persisted=value},removeItem(){}};
 class Audio{constructor(onFrame,onNote,onStatus){this.status=onStatus;this.active=false}
  get listening(){return this.active}async start(){this.active=true;this.status("listening")}
  stop(){this.active=false;this.status("off")}disconnectMidi(){}setSensitivity(){}muteFor(){}
 }
 class Player{constructor(){this.volume=.85;this.metronomeVolume=.72;this.timbre="piano"}
  stop(){}async context(){}async metronomeClick(){}async play(){return 1000}
  setVolume(x){this.volume=x;return x}getVolume(){return this.volume}
  setMetronomeVolume(x){this.metronomeVolume=x;return x}setTimbre(x){this.timbre=x}
 }
 class Form{constructor(element){this.fields=element.fields||{}}get(key){return this.fields[key]}}
 const bindings={...music,...instruments,...instrumentUI,...singing,...catalog,...discovery,...lyrics,...game,...backup,
  ...scoreImport,...scoreImportUI,...model,...singingEngine,...performanceEngine,...singingUI,...performanceUI,...account,...homeUI,document,window,
  navigator:{mediaDevices:{getUserMedia(){}},serviceWorker:{},userAgent:"Safari test"},
  localStorage,performance:perf,AudioEngine:Audio,SoundPlayer:Player,FormData:Form,
  setInterval(){return 1},clearInterval(){},requestAnimationFrame(){return 1},cancelAnimationFrame(){},
  setTimeout(){return 1},clearTimeout(){}
 };
 const app=new Function(...Object.keys(bindings),clean(read("app.js"))+
  ";return {active,changePage,getPage:()=>page,getProfiles:()=>db.users,startLesson,onNote,getDb:()=>db};")(...Object.values(bindings));
 const click=async dataset=>callbacks.click({target:{closest:()=>({disabled:false,dataset})}});
 const submit=fields=>callbacks.submit({target:{id:"profile-form",fields},preventDefault(){}});
 return {app,state,click,submit};
}

test("perfil é um painel pessoal e não a antiga mistura de configurações e formulários",()=>{
 const {app,state}=boot();app.changePage("profiles");
 assert.ok(state.html.includes("MEU ESPAÇO MUSICAL"));
 assert.ok(state.html.includes("Minha evolução"));
 assert.ok(state.html.includes("Minhas músicas"));
 assert.ok(state.html.includes("Perfis da família"));
 assert.ok(state.html.includes("Configurações"));
 assert.ok(!state.html.includes('id="backup-file"'));
 assert.ok(!state.html.includes('id="profile-form"'));
});
test("o avatar abre um seletor nativo e a troca mantém a navegação simples",async()=>{
 const {app,state,click,submit}=boot();app.changePage("family");
 submit({name:"Filha",instrument:"Ukulele"});
 assert.equal(app.getProfiles().length,2);
 const first=app.getProfiles()[0],second=app.getProfiles()[1];
 await click({action:"open-profile-switch"});
 assert.equal(state.dialog.open,true);
 assert.ok(state.html.includes('data-profile="'+first.id+'"'));
 assert.ok(state.html.includes('data-profile="'+second.id+'"'));
 await click({profile:first.id});
 assert.equal(app.active().id,first.id);
 assert.equal(app.getPage(),"home");
 assert.equal(state.dialog.open,false);
});
test("um toque no avatar e outro no aluno, inclusive com o foco visual adequado",async()=>{
 const {app,state,click,submit}=boot();app.changePage("family");submit({name:"Mãe",instrument:"Piano"});
 await click({action:"open-profile-switch"});assert.equal(state.dialog.open,true);
 await click({action:"close-profile-switch"});assert.equal(state.dialog.open,false);
 app.changePage("profiles");assert.equal(state.focused,true);
});
test("perfis mantêm progresso e favoritos separados",async()=>{
 const {app,state,click,submit}=boot();
 const first=app.active();first.xp=244;first.favorites=["piano:joy"];first.completed.first={at:1,stars:3};
 app.changePage("family");submit({name:"Segundo",instrument:"Violão"});
 const second=app.active();
 assert.equal(second.xp,0);assert.equal(second.completed.first,undefined);
 assert.equal(second.favorites,undefined);
 await click({profile:first.id});
 assert.equal(app.active().xp,244);
 assert.deepEqual(app.active().favorites,["piano:joy"]);
 assert.equal(app.active().completed.first.stars,3);
 assert.equal(JSON.parse(state.persisted).users.length,2);
});
test("família suporta criar, renomear, excluir e proíbe apagar o último",async()=>{
 const {app,state,click,submit}=boot();
 app.changePage("family");
 assert.ok(state.html.includes('id="profile-form"'));
 submit({name:"Filho",instrument:"Baixo"});
 const child=app.active();
 state.promptValue="Novo apelido";
 await click({profileEdit:child.id});
 assert.equal(app.active().name,"Novo apelido");
 await click({profileDelete:child.id});
 assert.equal(app.getProfiles().length,1);
 await click({profileDelete:app.getProfiles()[0].id});
 assert.equal(app.getProfiles().length,1);
});
test("instrumentos disponíveis não exibem mais o aviso desatualizado",()=>{
 const {app,state}=boot();app.changePage("family");
 assert.ok(state.html.includes("Ukulele"));
 assert.ok(state.html.includes("Baixo"));
 assert.ok(!state.html.includes("Outros instrumentos terão conteúdos próprios"));
});
test("configurações têm som, diagnóstico e backup, mas não ocupam a tela principal",()=>{
 const {app,state}=boot();
 app.changePage("settings");
 assert.ok(state.html.includes('data-route="sound"'));
 assert.ok(state.html.includes('data-route="diagnostics"'));
 assert.ok(state.html.includes('data-action="backup-export"'));
 assert.ok(state.html.includes('data-action="backup-import"'));
 assert.ok(state.html.includes('id="backup-file"'));
 app.changePage("profiles");
 assert.ok(!state.html.includes('id="backup-file"'));
});
test("página de evolução exibe semana, progresso instrumental e missões",()=>{
 const {app,state}=boot();app.changePage("progress");
 assert.ok(state.html.includes("Prática nos últimos 7 dias"));
 assert.ok(state.html.includes("Piano / Teclado"));
 assert.ok(state.html.includes("Trilhas por instrumento"));
 assert.ok(state.html.includes("Missões de hoje"));
 assert.ok(!state.html.includes("undefined"));
});
test("Minhas músicas recupera favoritos e atividades recentes sem criar catálogo novo",()=>{
 const {app,state}=boot(),u=app.active();u.favorites=["piano:joy"];
 u.history=[{id:"joy",kind:"instrument",at:Date.now(),seconds:60,day:"2026-11-01"}];
 app.changePage("my-music");
 assert.ok(state.html.includes("Ode à Alegria"));
 assert.ok(state.html.includes("Praticadas recentemente"));
 assert.ok(state.html.includes('data-favorite="piano:joy"'));
 assert.ok(state.html.includes('data-open-song="piano:joy"'));
});
test("a aba Perfil fica selecionada em suas telas internas sem criar novas abas móveis",()=>{
 const {app,state}=boot();
 for(const route of ["profiles","family","settings","progress","my-music","instruments","achievements"]){
  app.changePage(route);
  const nav=state.html.split('<nav class="mobile-nav"')[1].split("</nav>")[0];
  assert.equal((nav.match(/<button /g)||[]).length,5);
  assert.match(nav,/data-route="profiles" aria-label="Perfil" aria-current="page"/);
 }
});
test("textos do usuário são escapados e a interface tem controles operáveis",()=>{
 const malicious='<img src=x onerror=alert(1)>';
 const html=account.profileSwitcher([{id:"one",name:malicious,instrument:"Piano",xp:25}],"one");
 assert.ok(!html.includes(malicious));
 assert.ok(html.includes("&lt;img"));
 assert.ok(html.includes('aria-labelledby="profile-dialog-title"'));
 assert.ok(html.includes('data-action="close-profile-switch"'));
 const css=read("account-ux.css");
 assert.ok(css.includes("min-height:44px"));
 assert.ok(css.includes("max-width:480px"));
});
