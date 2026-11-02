import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const clean=s=>s.replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
const load=(path,names,dependencies={})=>
 new Function(...Object.keys(dependencies),clean(read(path))+";return {"+names.join(",")+"}")(...Object.values(dependencies));

function boot(){
 const music=load("music-data.js",["LESSONS","COURSES","SONGS","noteName","noteShort","lessonById","getSessionNotes","initialUser"]);
 const instruments=load("instrument-data.js",["INSTRUMENTS","STRING_LESSONS","instrumentId","instrumentInfo","instrumentName",
  "lessonsForInstrument","findInstrumentLesson","getInstrumentCourses","stringTunings","stringPosition"]);
 const instrumentUI=load("instrument-ui.js",["fretboard","instrumentOptions"],{...music,...instruments});
 const singing=load("singing-data.js",["VOCAL_SONGS","vocalById"]);
 const model=load("catalog-model.js",["publishedCatalogEntries","normalizedLegacyCatalog","catalogSummary","curatedLessonById","validateEditorialCatalog"]);
 const {PUBLISHED_CATALOG}=load("catalog-published.js",["PUBLISHED_CATALOG"]);
 const catalog=load("catalog.js",["catalogEntries","catalogFilter","catalogEntryById","suggestedCatalogEntry","publishedLesson","publishedLessons","availableGenres"],{...instruments,...model,PUBLISHED_CATALOG});
 const discovery=load("discovery-ui.js",["instrumentContext","instrumentPicker","learningPath","catalogResultsMarkup","catalogPage","songDetailPage"],
  {...instruments,...instrumentUI,...catalog,availableGenres:catalog.availableGenres});
 const lyrics=load("lyrics-library.js",["createPersonalSong","safeLibrary"]);
 const game=load("gamification.js",["awardPractice","ensureProgress","levelInfo","missionState","streakInfo","localDay","BADGES"]);
 const backup=load("backup.js",["makeBackup","parseBackup"],{...game,...lyrics});
 const scoreImport=load("score-import.js",["parseMusicXML","parseMIDI","draftFromImport"]);
 const scoreImportUI=load("score-import-ui.js",["scoreImportPage"]);
 const singingEngine=load("singing-engine.js",["SingingSession"]);
 const performanceEngine=load("performance-engine.js",["PerformanceSession"]);
 const clock={now:()=>0};
 const singingUI=load("singing-ui.js",["renderSingingHome","renderImportLyrics","renderVocalPractice","renderVocalResult","renderPersonalPractice","renderAchievements"],{performance:clock});
 const performanceUI=load("performance-view.js",["performanceRollSvg","performancePanel","performanceResultExtra"],{performance:clock});
 const homeUI=load("home-ui.js",["homeDashboard"]);
 const accountUI=load("account-ui.js",["profileSwitcher","profileHub","familyProfilesPage","progressPage","myMusicPage","settingsPage"]);
 const state={html:"",resultHtml:"",count:"",writes:0};
 const events={};
 const document={
   title:"",hidden:false,querySelector(selector){
    if(selector==="#app")return {set innerHTML(value){state.html=value},get innerHTML(){return state.html}};
    if(selector==="#catalog-results")return {set innerHTML(value){state.resultHtml=value}};
    if(selector==="#catalog-count")return {set textContent(value){state.count=value}};
    return null;
   },
   querySelectorAll(){return []},addEventListener(name,fn){events[name]=fn},
   createElement(){return {remove(){},set textContent(value){}}},body:{appendChild(){}}
 };
 const win={addEventListener(){},scrollTo(){},confirm(){return true},prompt(){return "Outro"},isSecureContext:true,location:{reload(){}}};
 const storage={getItem(){return null},setItem(){state.writes++},removeItem(){}};
 class Audio{
  constructor(onFrame,onNote,onStatus){this.status=onStatus;this.active=false}
  get listening(){return this.active}
  async start(){this.active=true;this.status("listening")}
  stop(){this.active=false;this.status("off")}
  disconnectMidi(){}setSensitivity(){}setProfile(){}setNoiseFloor(){}beginCalibration(){return true}finishCalibration(){return {ok:true,noiseFloor:.002,environment:"silencioso"}}muteFor(){}
 }
 class Player{constructor(){this.volume=.85;this.metronomeVolume=.72;this.timbre="piano"}
  setVolume(value){this.volume=value;return value}getVolume(){return this.volume}
  setMetronomeVolume(value){this.metronomeVolume=value;return value}setTimbre(value){this.timbre=value;return value}
  setSampleMode(x){this.sampleMode=x;return x}getSampleMode(){return this.sampleMode||"real"}soundSource(){return "synth"}
  stop(){}async context(){}async metronomeClick(){}async play(){return 200}}
 const bindings={...music,...instruments,...instrumentUI,...singing,...catalog,...discovery,
  ...lyrics,...game,...backup,...scoreImport,...scoreImportUI,...model,...singingEngine,...performanceEngine,...singingUI,...performanceUI,...accountUI,...homeUI,
  document,window:win,navigator:{mediaDevices:{getUserMedia(){}},serviceWorker:{},userAgent:"Test"},
  localStorage:storage,performance:clock,AudioEngine:Audio,SoundPlayer:Player,
  setInterval(){return 1},clearInterval(){},requestAnimationFrame(){return 1},cancelAnimationFrame(){},
  setTimeout(){return 1},clearTimeout(){}};
 const app=new Function(...Object.keys(bindings),clean(read("app.js"))+";return {active,changePage,currentLessons,startLesson,onNote,getPage:()=>page,getSession:()=>session,getTimbre:()=>player.timbre}")(...Object.values(bindings));
 const click=async dataset=>events.click({target:{closest:()=>({dataset,disabled:false})}});
 return {app,state,events,click};
}
test("início oferece troca de instrumento e apenas cinco abas no mobile",()=>{
 const {state}=boot();
 assert.ok(state.html.includes('data-route="instruments"'));
 const nav=state.html.split('<nav class="mobile-nav"')[1].split("</nav>")[0];
 assert.ok(nav);
 assert.equal((nav.match(/<button /g)||[]).length,5);
});
test("seleção de violão muda toda a trilha e a recomendação musical",async()=>{
 const {app,click,state}=boot();
 app.changePage("instruments");
 await click({instrument:"acoustic"});
 assert.equal(app.active().instrument,"Violão");
 assert.ok(state.html.includes("SEU INSTRUMENTO ATUAL"));
 assert.ok(state.html.includes(">Violão</strong>"));
 app.changePage("courses");
 assert.ok(state.html.includes("Primeira corda: Mi"));
 assert.ok(!state.html.includes("Conheça o Dó central"));
 app.changePage("library");
 assert.ok(state.html.includes("Pequena melodia no violão"));
 assert.ok(!state.html.includes("Ode à Alegria"));
});
test("favoritos são persistentes e pesquisa não fecha o teclado",async()=>{
 const {app,click,state,events}=boot();
 app.changePage("library");
 await click({catalogScope:"all"});
 events.input({target:{id:"catalog-query",value:"Ode"}});
 assert.ok(state.resultHtml.includes("Ode à Alegria"));
 assert.ok(!state.resultHtml.includes("Dia de Sol"));
 assert.equal(state.count,"1 opções");
 await click({favorite:"piano:joy"});
 assert.deepEqual(app.active().favorites,["piano:joy"]);
 await click({catalogScope:"favorites"});
 assert.ok(state.html.includes("Ode à Alegria"));
});
test("detalhes de música de outro instrumento pedem troca explícita",async()=>{
 const {app,click,state}=boot();
 await click({instrument:"acoustic"});
 app.changePage("library");await click({catalogScope:"all"});
 await click({openSong:"piano:joy"});
 assert.ok(state.html.includes("Trocar para Piano"));
 await click({startSong:"piano:joy"});
 assert.equal(app.active().instrument,"Piano");
 assert.equal(app.getPage(),"practice");
 assert.equal(app.getSession().lesson.id,"joy");
});
test("baixo usa desenho de corda e casa e gera progresso independente",async()=>{
 const {app,click,state}=boot();
 await click({instrument:"bass-guitar"});
 await app.startLesson("baixo-first",false);
 assert.ok(state.html.includes('class="fretboard"'));
 assert.ok(!state.html.includes('class="piano"'));
 const lesson=app.getSession();
 for(const step of lesson.steps)app.onNote({note:step.m,cents:0,source:"test"});
 assert.equal(app.getPage(),"result");
 assert.ok(app.active().completed["baixo-first"]);
});
test("voz abre trilha de canto sem teclado ou exercícios de piano",async()=>{
 const {app,click,state}=boot();
 await click({instrument:"voice"});
 app.changePage("courses");
 assert.ok(state.html.includes("TRILHA DE CANTO"));
 assert.ok(state.html.includes('data-vocal="voice-warmup"'));
 app.changePage("library");
 assert.ok(state.html.includes("Vocalize com Lá"));
 assert.ok(!state.html.includes("Ode à Alegria"));
});

test("mudar para ukulele sincroniza início, exemplos, trilha, treino e biblioteca",async()=>{
 const {app,click,state}=boot();
 await click({instrument:"ukulele"});
 assert.equal(app.active().instrument,"Ukulele");
 assert.equal(app.getTimbre(),"ukulele");
 assert.ok(state.html.includes("Vamos tocar hoje?"));
 assert.ok(state.html.includes("Para ukulele"));
 assert.ok(state.html.includes('class="home-groups"'));
 assert.ok(!state.html.includes('class="grid three"'));
 const nav=state.html.split('<nav class="mobile-nav"')[1].split("</nav>")[0];
 assert.ok(nav.includes('data-route="workouts"'));
 assert.ok(!nav.includes('data-route="singing"'));
 app.changePage("workouts");
 assert.ok(state.html.includes("Treinos de ukulele"));
 assert.ok(!state.html.includes('data-vocal="voice-warmup"'));
 app.changePage("library");
 assert.ok(state.html.includes("Areia e Sol"));
 assert.ok(!state.html.includes("Ode à Alegria"));
 await app.startLesson("curated-ms-original-ukulele-01-arr",false);
 assert.equal(app.getPage(),"practice");
 assert.equal(app.getTimbre(),"ukulele");
 assert.ok(state.html.includes('class="fretboard"'));
 assert.ok(state.html.includes("Onde tocar no Ukulele"));
 assert.ok(!state.html.includes("Conectar MIDI"));
 assert.ok(state.html.includes("Ajustes de som e entrada"));
});
test("voz tem navegação de cantar e retorna ao timbre vocal após mudar instrumento",async()=>{
 const {app,click,state}=boot();
 await click({instrument:"ukulele"});
 await click({instrument:"voice"});
 assert.equal(app.active().instrument,"Voz");
 assert.equal(app.getTimbre(),"soft");
 assert.ok(state.html.includes("Sua voz é o instrumento."));
 const nav=state.html.split('<nav class="mobile-nav"')[1].split("</nav>")[0];
 assert.ok(nav.includes('data-route="singing"'));
 assert.ok(!nav.includes('data-route="workouts"'));
 app.changePage("workouts");
 assert.ok(state.html.includes("Treino de canto"));
 assert.ok(!state.html.includes("Treinos de ukulele"));
 await click({instrument:"piano"});
 assert.equal(app.getTimbre(),"piano");
 assert.ok(state.html.includes("Para piano"));
});
test("favoritos dos demais instrumentos ficam agrupados fora da lista principal",async()=>{
 const {app,click,state}=boot();
 app.active().favorites=["piano:joy","curated:ms-original-ukulele-01-arr"];
 await click({instrument:"ukulele"});
 app.changePage("my-music");
 assert.ok(state.html.includes("Favoritas de Ukulele"));
 assert.ok(state.html.includes("Areia e Sol"));
 assert.ok(state.html.includes("Outros instrumentos"));
 const outer=state.html.indexOf("Outros instrumentos");
 const piano=state.html.indexOf("Ode à Alegria");
 assert.ok(outer>=0&&piano>outer);
 assert.equal(app.active().favorites.length,2);
});
