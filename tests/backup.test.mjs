import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=async name=>import("data:text/javascript;base64,"+readFileSync(new URL("../"+name,import.meta.url)).toString("base64"));
const game=await load("gamification.js"),lyrics=await load("lyrics-library.js");
const raw=readFileSync(new URL("../backup.js",import.meta.url),"utf8").replace(/^import[^\n]*\n/gm,"").replace(/^export /gm,"");
const {makeBackup,parseBackup}=new Function("ensureProgress","safeLibrary",raw+";return {makeBackup,parseBackup}")(game.ensureProgress,lyrics.safeLibrary);
const base=()=>({users:[{id:"u1",name:"Aluno",instrument:"Piano",xp:312,totalCorrect:14,totalAttempts:16,completed:{first:{stars:3,at:1}},game:{badges:{"first-note":{at:1}}},history:[],personalLyrics:[]}],active:"u1"});
test("backup preserva alunos, progresso e XP",()=>{
 const result=parseBackup(makeBackup(base()));
 assert.equal(result.users.length,1);assert.equal(result.users[0].xp,312);
 assert.equal(result.users[0].completed.first.stars,3);
 assert.equal(result.users[0].game.badges["first-note"].at,1);
 assert.equal(result.active,"u1");
});
test("backup mantém favoritos separados por perfil",()=>{
 const x=base();x.users[0].favorites=["piano:joy","string:violao-song"];
 const data=parseBackup(makeBackup(x));
 assert.deepEqual(data.users[0].favorites,x.users[0].favorites);
});
test("backup mantém letras pessoais apenas dentro do perfil",()=>{
 const x=base(),song=lyrics.createPersonalSong({title:"Minha música",lyrics:"[00:01.00]Verso",rightsConfirmed:true});
 x.users[0].personalLyrics=[song];
 const data=parseBackup(makeBackup(x));
 assert.equal(data.users[0].personalLyrics[0].title,"Minha música");
 assert.equal(data.users[0].personalLyrics[0].kind,"lyrics-only");
});
test("backup rejeita arquivos externos ou malformados",()=>{
 assert.throws(()=>parseBackup("{"),/JSON/);
 assert.throws(()=>parseBackup(JSON.stringify({schema:"outro",version:1,data:base()})),/compatível/);
 assert.throws(()=>parseBackup(JSON.stringify({schema:"musical-sense-backup",version:1,data:{users:[]}})),/um a cinco/);
});
test("backup bloqueia perfis duplicados e nomes excessivamente longos",()=>{
 const x=base();x.users.push({...x.users[0],name:"A".repeat(300)});
 assert.throws(()=>parseBackup(makeBackup(x)),/repetidos/);
 x.users[1].id="u2";
 const result=parseBackup(makeBackup(x));
 assert.equal(result.users[1].name.length,30);
});
test("backup restaura compensações padrão quando ausentes",()=>{
 const result=parseBackup(makeBackup(base()));
 assert.equal(result.perfLatency,160);
 assert.equal(result.vocalLatency,130);
});
