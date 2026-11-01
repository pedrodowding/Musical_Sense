import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const contents=readFileSync(new URL("../gamification.js",import.meta.url));
const game=await import("data:text/javascript;base64,"+contents.toString("base64"));
const base={kind:"instrument",lessonId:"first",baseXp:80,correct:8,attempts:8,seconds:40,passed:true,full:true,stars:3};
const make=()=>({xp:0,totalCorrect:0,totalAttempts:0,completed:{},history:[]});

test("nível tem limites fixos e progresso percentual",()=>{
 assert.equal(game.levelInfo(0).level,1);
 assert.equal(game.levelInfo(149).level,1);
 assert.equal(game.levelInfo(150).level,2);
 assert.equal(game.levelInfo(599).level,2);
 assert.equal(game.levelInfo(600).level,3);
});
test("primeira conclusão concede XP, medalhas e progresso por aluno",()=>{
 const user=make(),result=game.awardPractice(user,{...base,sessionId:"lesson-1"},new Date(2026,10,1,12));
 assert.ok(result.xp>80);assert.ok(result.badges.includes("first-note"));
 assert.ok(result.badges.includes("first-lesson"));assert.ok(result.missions.includes("daily-lesson"));
 assert.ok(user.completed.first);assert.equal(user.history.length,1);
 assert.equal(user.history[0].day,"2026-11-01");
});
test("mesma sessão nunca duplica XP ou histórico",()=>{
 const user=make(),input={...base,sessionId:"unique"};
 const a=game.awardPractice(user,input,new Date(2026,10,1));
 const before=user.xp,b=game.awardPractice(user,input,new Date(2026,10,1));
 assert.equal(before,user.xp);assert.equal(b.duplicate,true);assert.equal(b.xp,a.xp);
 assert.equal(user.history.length,1);
});
test("repetição de atividade tem limite diário de XP base",()=>{
 const user=make(),now=new Date(2026,10,1);
 const results=[0,1,2,3,4].map(i=>game.awardPractice(user,{...base,sessionId:"repeat-"+i},now));
 assert.ok(results[0].lessonXp>results[1].lessonXp);
 assert.ok(results[1].lessonXp>0);assert.ok(results[2].lessonXp>0);
 assert.equal(results[3].lessonXp,0);assert.equal(results[4].lessonXp,0);
});
test("incompleta não desbloqueia aula nem medalha de conclusão",()=>{
 const user=make();const result=game.awardPractice(user,{...base,sessionId:"failed",correct:1,attempts:8,passed:false},new Date(2026,10,1));
 assert.equal(result.lessonXp,0);assert.equal(user.completed.first,undefined);
 assert.equal(game.missionState(user,new Date(2026,10,1).toLocaleDateString("en-CA")).length,4);
});
test("sequência de prática se mantém por dias consecutivos",()=>{
 const user=make();
 for(let i=1;i<=3;i++)game.awardPractice(user,{...base,sessionId:"day-"+i,lessonId:"lesson-"+i},new Date(2026,10,i,12));
 assert.equal(game.streakInfo(user,"2026-11-03").current,3);
 assert.ok(user.game.badges.streak3);
 assert.equal(game.streakInfo(user,"2026-11-05").current,0);
});
test("canto concluído destrava a medalha vocal sem criar aula instrumental",()=>{
 const user=make();
 game.awardPractice(user,{kind:"vocal",lessonId:"voice-warmup",sessionId:"vocal-1",correct:9,attempts:10,seconds:25,baseXp:85,passed:true,full:true},new Date(2026,10,1));
 assert.ok(user.game.badges["first-voice"]);assert.ok(user.vocalCompleted["voice-warmup"]);
 assert.deepEqual(user.completed,{});
});
test("letra pessoal não recebe pontuação de afinação",()=>{
 const user=make(),input={kind:"personal",lessonId:"personal-1",sessionId:"lyrics-1",correct:1,attempts:1,seconds:40,passed:true,full:true};
 const first=game.awardPractice(user,input,new Date(2026,10,1));
 const second=game.awardPractice(user,{...input,sessionId:"lyrics-2"},new Date(2026,10,1));
 assert.ok(first.lessonXp<=10);
 assert.equal(second.lessonXp,0);
 assert.equal(user.completed["personal-1"],undefined);
});
