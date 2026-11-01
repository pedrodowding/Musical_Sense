import {ensureProgress} from "./gamification.js";
import {safeLibrary} from "./lyrics-library.js";
const instruments=["Piano","Teclado","Violão","Guitarra","Ukulele","Baixo"];
const nonnegative=(n,max=1e9)=>Math.min(max,Math.max(0,Number(n)||0));
function plainObject(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
function objectSubset(v,limit=300){return Object.fromEntries(Object.entries(plainObject(v)).filter(([k])=>k.length<110&&/^[\w|:-]+$/.test(k)).slice(-limit))}
function safeHistory(v){
 if(!Array.isArray(v))return [];
 return v.slice(-250).filter(x=>x&&typeof x==="object").map(x=>({
  id:String(x.id||"").slice(0,100),kind:String(x.kind||"instrument").slice(0,30),mode:String(x.mode||"").slice(0,30),
  day:String(x.day||"").slice(0,10),seconds:nonnegative(x.seconds,3600),
  xp:nonnegative(x.xp,10000),accuracy:x.accuracy===null?null:nonnegative(x.accuracy,100),
  correct:nonnegative(x.correct,10000),attempts:nonnegative(x.attempts,10000),
  passed:Boolean(x.passed),full:Boolean(x.full),at:nonnegative(x.at,Date.now()+86400000)
 }));
}
export function makeBackup(db){
 return JSON.stringify({schema:"musical-sense-backup",version:1,exportedAt:new Date().toISOString(),
  warning:"Este backup contém nomes de perfis, progresso e eventuais letras pessoais. Guarde em local seguro.",
  data:{users:db.users,active:db.active,perfLatency:db.perfLatency,vocalLatency:db.vocalLatency}},null,2);
}
export function parseBackup(text){
 if(typeof text!=="string"||text.length>2e6)throw Error("Arquivo inválido ou maior que 2 MB.");
 let envelope;try{envelope=JSON.parse(text)}catch{throw Error("O arquivo não é um JSON válido.")}
 if(envelope?.schema!=="musical-sense-backup"||envelope.version!==1)throw Error("Este não é um backup compatível do Musical Sense.");
 const source=envelope.data;
 if(!source||!Array.isArray(source.users)||source.users.length<1||source.users.length>5)throw Error("Backup deve conter de um a cinco perfis.");
 const ids=new Set(),users=source.users.map((value,i)=>{
  const x=plainObject(value),id=/^[A-Za-z0-9_-]{1,80}$/.test(String(x.id||""))?String(x.id):"restored-"+i;
  if(ids.has(id))throw Error("O backup tem perfis com identificadores repetidos.");
  ids.add(id);
  const name=String(x.name||"Aluno").trim().slice(0,30)||"Aluno";
  const user={
   id,name,instrument:instruments.includes(x.instrument)?x.instrument:"Piano",xp:nonnegative(x.xp,1e8),
   completed:objectSubset(x.completed,150),vocalCompleted:objectSubset(x.vocalCompleted,150),
   checkpoints:objectSubset(x.checkpoints,150),personalLyrics:safeLibrary(x.personalLyrics),
   totalCorrect:nonnegative(x.totalCorrect,1e8),totalAttempts:nonnegative(x.totalAttempts,1e8),
   practiceSeconds:nonnegative(x.practiceSeconds,1e9),history:safeHistory(x.history),
   createdAt:nonnegative(x.createdAt,Date.now()),game:{
    badges:objectSubset(x.game?.badges),claims:objectSubset(x.game?.claims),
    rewardCounts:objectSubset(x.game?.rewardCounts),days:objectSubset(x.game?.days),
    missions:objectSubset(x.game?.missions),
    streak:nonnegative(x.game?.streak,3650),longestStreak:nonnegative(x.game?.longestStreak,3650),
    lastDay:String(x.game?.lastDay||"").slice(0,10)
   }
  };
  return ensureProgress(user);
 });
 return {users,active:ids.has(source.active)?source.active:users[0].id,
  perfLatency:source.perfLatency==null?160:nonnegative(source.perfLatency,350),vocalLatency:source.vocalLatency==null?130:nonnegative(source.vocalLatency,350)};
}
