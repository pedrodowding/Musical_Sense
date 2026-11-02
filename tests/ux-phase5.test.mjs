import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=(name,keys,deps={})=>{
 const source=readFileSync(new URL("../"+name,import.meta.url),"utf8").replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
 return new Function(...Object.keys(deps),source+";return {"+keys.join(",")+"};")(...Object.values(deps));
};
const inst=load("instrument-data.js",["INSTRUMENTS","STRING_LESSONS","instrumentId","instrumentInfo","getInstrumentCourses","lessonsForInstrument"]);
const music=load("music-data.js",["LESSONS"]);
const model=load("catalog-model.js",["validateEditorialCatalog","normalizedLegacyCatalog","publishedCatalogEntries","catalogSummary","curatedLessonById"]);
const {PUBLISHED_CATALOG}=load("catalog-published.js",["PUBLISHED_CATALOG"]);
const cat=load("catalog.js",["publishedLessons"],{...inst,...model,PUBLISHED_CATALOG});
const discovery=load("discovery-ui.js",["learningPath","instrumentContext"],{...inst,...cat});
const home=load("home-ui.js",["homeDashboard"]);
const account=load("account-ui.js",["profileHub"]);
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const lessonsFor=id=>[
 ...inst.lessonsForInstrument(id,music.LESSONS),
 ...cat.publishedLessons().filter(l=>l.instrument===id)
];
test("ukulele tem iconografia de instrumento, não de flor",()=>{
 const uke=inst.instrumentInfo("ukulele");
 assert.equal(uke.name,"Ukulele");
 assert.notEqual(uke.icon,"🌺");
 assert.ok(/^[^\p{L}]{1,5}$/u.test(uke.icon));
 const lessons=lessonsFor("ukulele");
 assert.notEqual(lessons[0].icon,"🌺");
});
test("trilha de 11 aulas é agrupada e mantém TODAS as aulas operáveis",()=>{
 const lessons=lessonsFor("ukulele");
 assert.equal(lessons.length,11);
 const html=discovery.learningPath({instrument:"Ukulele",lessons,completed:{},checkpoints:{}});
 assert.equal((html.match(/<details class="journey-chapter"/g)||[]).length,4);
 assert.equal((html.match(/<details class="journey-chapter" open>/g)||[]).length,1);
 assert.equal((html.match(/class="journey-lesson path-unit /g)||[]).length,11);
 assert.ok(html.includes("Mais melodias"));
 assert.ok(html.includes("Primeiros passos"));
 for(const lesson of lessons)assert.ok(html.includes('data-lesson="'+lesson.id+'"'),"Inaccessible lesson "+lesson.id);
 assert.ok(!html.includes("Bloqueada"));
 assert.ok(!html.includes('class="learning-path"'));
});
test("ao completar capítulos, apenas o capítulo da próxima aula fica aberto",()=>{
 const lessons=lessonsFor("ukulele");
 const completed=Object.fromEntries(lessons.slice(0,6).map(l=>[l.id,{at:1,stars:3}]));
 const html=discovery.learningPath({instrument:"Ukulele",lessons,completed,checkpoints:{}});
 const open=html.indexOf('<details class="journey-chapter" open>'),last=html.lastIndexOf('<details class="journey-chapter"');
 assert.ok(open>0&&last>=open,"A próxima aula fica no capítulo de melodias");
 assert.ok(html.includes("6 de 11 concluídas"));
 const intro=html.indexOf('class="journey-chapter-lessons"',open);
 assert.ok(html.indexOf('data-lesson="'+lessons[6].id+'"',intro)>intro);
 assert.equal((html.match(/<details class="journey-chapter" open>/g)||[]).length,1);
});
test("checkpoint continua disponível após reorganizar capítulos",()=>{
 const lessons=lessonsFor("piano");
 const third=lessons[2];
 const html=discovery.learningPath({instrument:"Piano",lessons,completed:{
 [lessons[0].id]:{at:1},[lessons[1].id]:{at:2}
 },checkpoints:{[third.id]:{index:2}}});
 assert.ok(html.includes("Continuar de onde parei"));
 assert.ok(html.includes("2/"+third.steps.length+" notas"));
 assert.ok(html.includes('data-lesson="'+third.id+'"'));
});
test("início reduz poluição visual sem esconder progresso e menus",()=>{
 const uke=inst.instrumentInfo("ukulele"),next=lessonsFor("ukulele")[0];
 const html=home.homeDashboard({instrument:uke,level:{level:2},completed:1,total:11,
  nextLesson:next,streak:3,xp:220,recommendation:{kind:"instrument",id:"curated:ms-original-ukulele-01-arr",
  title:"Areia e Sol",artist:"Musical Sense (composição didática original)",cover:"🏖️",level:"Iniciante"}});
 assert.equal((html.match(/class="btn home-main-cta"/g)||[]).length,1);
 assert.ok(html.includes('data-lesson="'+next.id+'"'));
 assert.ok(html.includes('data-route="courses"'));
 assert.equal((html.match(/<details class="home-group"/g)||[]).length,2);
 assert.ok(!html.includes('class="home-switch-instrument"'),"Botão Trocar duplicado no herói");
 assert.ok(!html.includes("Musical Sense (composição didática original)"),"Crédito muito longo no cartão");
 assert.ok(html.includes("1 de 11 aulas concluídas"));
});
test("perfil usa disclosure para métricas e gestão, mantendo links funcionais",()=>{
 const html=account.profileHub({user:{name:"Aluno 1",xp:0},level:{level:1,progress:0},
 streak:{current:0},completed:0,favoritesCount:0,accuracy:null,practiceMinutes:0,instrumentName:"Ukulele"});
 assert.equal((html.match(/<details class="profile-more"/g)||[]).length,2);
 assert.ok(html.includes("Meu desempenho"));
 assert.ok(html.includes("Conta e preferências"));
 assert.ok(html.includes("Sem práticas"));
 assert.ok(html.includes('data-route="family"'));
 assert.ok(html.includes('data-route="settings"'));
 assert.ok(!html.includes('class="account-hero-switch"'),"Troca de perfil duplicada no corpo");
});
test("a barra mobile usa SVG no lugar de ícones emoji, com cinco destinos",()=>{
 const app=read("app.js"),css=read("mobile-focus-v5.css"),html=read("index.html"),sw=read("sw.js");
 assert.ok(app.includes("function mobileNavGlyph(route)"));
 assert.ok(app.includes("mobileNavGlyph(id)"));
 assert.ok(css.includes(".mobile-nav .icon svg"));
 for(const id of ["home","courses","library","workouts","singing","profiles"])assert.ok(app.includes(id+":'"),id);
 assert.ok(css.includes("min-height:44px")||css.includes("min-height:42px"));
 assert.ok(html.includes("/mobile-focus-v5.css"));
 assert.ok(sw.includes("/mobile-focus-v5.css"));
 assert.ok(sw.includes("musical-sense-app-v16"));
});
test("a melhoria não altera identificadores, XP nem o catálogo de músicas",()=>{
 const v=cat.publishedLessons();
 assert.equal(v.length,28);
 assert.equal(lessonsFor("ukulele").length,11);
 assert.equal(lessonsFor("piano").length,20);
 const app=read("app.js");
 assert.ok(!app.includes('localStorage.clear('));
 assert.ok(app.includes("u.completed"));
 assert.ok(app.includes("u.xp")||app.includes("user.xp"));
});
