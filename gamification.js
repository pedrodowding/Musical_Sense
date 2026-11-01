/**
 * Economia de XP e progresso em dados locais. Regras determinísticas para evitar
 * recompensas duplicadas e incentivar aprendizagem, não repetição mecânica.
 */
export const BADGES=[
 {id:"first-note",icon:"🎵",name:"Primeira nota",description:"Acertar sua primeira nota",xp:15},
 {id:"first-lesson",icon:"🎓",name:"Primeira aula",description:"Concluir uma aula de instrumento",xp:20},
 {id:"first-voice",icon:"🎤",name:"Soltou a voz",description:"Concluir uma prática vocal",xp:20},
 {id:"five-lessons",icon:"📚",name:"Estudioso",description:"Concluir cinco aulas diferentes",xp:50},
 {id:"precision",icon:"🎯",name:"Boa afinação",description:"Terminar uma atividade com pelo menos 90% de acertos",xp:25},
 {id:"song",icon:"🎼",name:"Primeira música",description:"Concluir uma atividade de melodia ou canto",xp:25},
 {id:"streak3",icon:"🔥",name:"Três dias de música",description:"Praticar durante três dias seguidos",xp:35},
 {id:"streak7",icon:"🏅",name:"Uma semana musical",description:"Praticar durante sete dias seguidos",xp:70}
];
export const MISSIONS=[
 {id:"daily-lesson",icon:"🎹",name:"Concluir uma aula",goal:1,key:"lessons",xp:15},
 {id:"daily-vocal",icon:"🎤",name:"Praticar canto",goal:1,key:"vocal",xp:15},
 {id:"daily-notes",icon:"🎵",name:"Acertar 12 notas",goal:12,key:"notes",xp:20},
 {id:"daily-minutes",icon:"⏱",name:"Praticar 3 minutos",goal:180,key:"seconds",xp:30}
];
export function localDay(value=new Date()){const d=value instanceof Date?value:new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
export function levelInfo(xp){const total=Math.max(0,Math.floor(Number(xp)||0)),level=Math.floor(Math.sqrt(total/150))+1,from=150*(level-1)**2,to=150*level**2;return {level,xp:total,from,to,progress:Math.max(0,Math.min(100,Math.round((total-from)/(to-from)*100)))}}
export function ensureProgress(user){
 if(!user.completed||typeof user.completed!=="object")user.completed={};
 user.xp=Math.max(0,Math.floor(Number(user.xp)||0));
 const g=user.game&&typeof user.game==="object"?user.game:{};
 if(!g.badges||typeof g.badges!=="object")g.badges={};
 if(!g.days||typeof g.days!=="object")g.days={};
 if(!g.claims||typeof g.claims!=="object")g.claims={};
 if(!g.rewardCounts||typeof g.rewardCounts!=="object")g.rewardCounts={};
 if(!g.missions||typeof g.missions!=="object")g.missions={};
 g.streak=Math.max(0,Number(g.streak)||0);g.longestStreak=Math.max(0,Number(g.longestStreak)||0);
 if(!Array.isArray(user.history))user.history=[];
 user.game=g;
 return user;
}
export function dailyProgress(user,date=localDay()){
 ensureProgress(user);
 return user.game.days[date]||{lessons:0,vocal:0,notes:0,seconds:0,sessions:0};
}
export function streakInfo(user,today=localDay()){
 ensureProgress(user);const g=user.game;
 if(!g.lastDay)return {current:0,best:g.longestStreak||0};
 const last=new Date(today+"T12:00:00");last.setDate(last.getDate()-1);
 const yesterday=localDay(last);
 return {current:g.lastDay===today||g.lastDay===yesterday?g.streak:0,best:g.longestStreak||0};
}
function badgeRules(user,result,streak){
 const completed=Object.keys(user.completed||{}).length;
 return {
  "first-note":result.kind!=="personal"&&(user.totalCorrect||0)>=1,
  "first-lesson":completed>=1,
  "first-voice":result.kind==="vocal"&&result.passed&&result.full!==false,
  "five-lessons":completed>=5,
  "precision":result.kind!=="personal"&&result.passed&&result.accuracy>=90,
  "song":result.passed&&result.full!==false&&(result.kind==="vocal"||result.song===true),
  "streak3":streak.current>=3,
  "streak7":streak.current>=7
 };
}
function prune(g){
 for(const key of ["claims","rewardCounts","days","missions"]){
   const entries=Object.entries(g[key]);if(entries.length>350){for(const [k] of entries.slice(0,entries.length-300))delete g[key][k]}
 }
}
export function awardPractice(user,input,now=new Date()){
 ensureProgress(user);const g=user.game,date=localDay(now),day=g.days[date]||{lessons:0,vocal:0,notes:0,seconds:0,sessions:0};
 const key=String(input.sessionId||"").trim();if(!key)throw Error("Identificador de sessão obrigatório");
 if(g.claims[key])return {...g.claims[key],duplicate:true};
 const before=levelInfo(user.xp);
 const kind=input.kind==="vocal"?"vocal":input.kind==="personal"?"personal":"instrument";
 const correct=Math.max(0,Math.floor(Number(input.correct)||0)),attempts=Math.max(correct,Math.floor(Number(input.attempts)||0));
 const seconds=Math.min(3600,Math.max(0,Math.floor(Number(input.seconds)||0)));
 const accuracy=kind==="personal"?null:attempts?Math.round(correct/attempts*100):0;
 const passed=Boolean(input.passed)&&correct>0;
 const full=input.full!==false;
 const lessonId=String(input.lessonId||"practice");
 const rewardKey=date+"|"+kind+"|"+lessonId;const count=g.rewardCounts[rewardKey]||0;
 const base=Math.max(0,Math.min(250,Math.floor(Number(input.baseXp)||0)));
 const quality=0.5+(accuracy||0)/200;
 const first=passed&&full&&count===0;
 const multiplier=first?1:count<3?.25:0;
 let xp=(passed&&attempts>0)?Math.max(0,Math.round(base*quality*multiplier)):0;
 if(kind==="personal")xp=seconds>=20&&correct>0&&count===0?Math.min(10,Math.round(seconds/12)):0;
 g.rewardCounts[rewardKey]=count+1;
 if(kind!=="personal"){
  user.totalCorrect=(user.totalCorrect||0)+correct;
  user.totalAttempts=(user.totalAttempts||0)+attempts;
 }
 user.practiceSeconds=(user.practiceSeconds||0)+seconds;
 if(passed&&full&&kind==="vocal"){
   user.vocalCompleted=user.vocalCompleted||{};
   const prev=user.vocalCompleted[lessonId];user.vocalCompleted[lessonId]={at:now.getTime(),bestAccuracy:Math.max(accuracy,prev?.bestAccuracy||0)};
 }
 if(passed&&full&&kind==="instrument"){
   const prev=user.completed[lessonId],stars=Math.max(1,Math.min(3,Number(input.stars)||1));
   user.completed[lessonId]={at:now.getTime(),stars:Math.max(stars,prev?.stars||0)};
 }
 if(seconds>=10||correct>0){
   if(g.lastDay!==date){
     const prevDate=new Date(date+"T12:00:00");prevDate.setDate(prevDate.getDate()-1);
     g.streak=g.lastDay===localDay(prevDate)?g.streak+1:1;
     g.lastDay=date;g.longestStreak=Math.max(g.longestStreak,g.streak);
   }
 }
 day.sessions++;
 day.seconds+=seconds;
 if(kind!=="personal")day.notes+=correct;
 if(passed&&full){if(kind==="vocal")day.vocal++;else if(kind==="instrument")day.lessons++}
 g.days[date]=day;
 const missions=[];
 for(const mission of MISSIONS){
   const claimKey=date+"|"+mission.id;
   if(day[mission.key]>=mission.goal&&!g.missions[claimKey]){
     g.missions[claimKey]=true;xp+=mission.xp;
     missions.push({...mission});
   }
 }
 const unlocked=[];
 for(const badge of BADGES){
   if(g.badges[badge.id])continue;
   if(badgeRules(user,{kind,passed,full,accuracy,song:input.song},streakInfo(user,date))[badge.id]){
     g.badges[badge.id]={at:now.getTime()};xp+=badge.xp;unlocked.push({...badge});
   }
 }
 user.xp+=xp;const after=levelInfo(user.xp);
 const result={xp,lessonXp:Math.max(0,xp-missions.reduce((s,m)=>s+m.xp,0)-unlocked.reduce((s,b)=>s+b.xp,0)),missions:missions.map(m=>m.id),badges:unlocked.map(b=>b.id),levelUp:after.level>before.level,level:after.level,accuracy,streak:streakInfo(user,date).current,replay:count>0};
 g.claims[key]=result;prune(g);
 user.history.push({id:lessonId,kind,mode:input.mode||"",day:date,seconds,xp,accuracy,correct,attempts,passed,full,at:now.getTime()});
 user.history=user.history.slice(-250);
 return result;
}
export function missionState(user,date=localDay()){
 const daily=dailyProgress(user,date);
 return MISSIONS.map(m=>({...m,current:Math.min(m.goal,daily[m.key]||0),done:(daily[m.key]||0)>=m.goal}));
}
