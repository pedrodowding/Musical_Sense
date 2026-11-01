
import {LESSONS,COURSES,SONGS,noteName,noteShort,lessonById,getSessionNotes,initialUser} from "./music-data.js";
import {AudioEngine,SoundPlayer} from "./audio-engine.js";
import {PerformanceSession} from "./performance-engine.js";
import {performanceRollSvg,performancePanel,performanceResultExtra} from "./performance-view.js";
import {VOCAL_SONGS,vocalById} from "./singing-data.js";
import {SingingSession} from "./singing-engine.js";
import {createPersonalSong,safeLibrary} from "./lyrics-library.js";
import {renderSingingHome,renderImportLyrics,renderVocalPractice,renderVocalResult,renderPersonalPractice,renderAchievements} from "./singing-ui.js";
import {awardPractice,ensureProgress,levelInfo,missionState,streakInfo,localDay,BADGES} from "./gamification.js";
import {makeBackup,parseBackup} from "./backup.js";
import {INSTRUMENTS,instrumentId,instrumentInfo,instrumentName,lessonsForInstrument,findInstrumentLesson,getInstrumentCourses} from "./instrument-data.js";
import {fretboard} from "./instrument-ui.js";
import {catalogEntries,catalogFilter,catalogEntryById} from "./catalog.js";
import {instrumentContext,instrumentPicker,learningPath,catalogPage,catalogResultsMarkup,songDetailPage} from "./discovery-ui.js";
const DBKEY="musical-sense-v3",OLDKEY="musical-sense-v1";
const routes=[["home","⌂","Início"],["courses","◎","Trilha"],["library","♫","Músicas"],["singing","🎤","Cantar"],["workouts","◷","Treinos"],["profiles","♙","Perfis"]];
const mobileRoutes=[["home","🏠","Início"],["courses","🧭","Trilha"],["library","🎵","Músicas"],["singing","🎤","Cantar"],["profiles","👤","Perfil"]];
const $=s=>document.querySelector(s);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const percent=(a,b)=>b?Math.round(a/b*100):0;
function load(){
  let db=null;
  try{db=JSON.parse(localStorage.getItem(DBKEY))}catch{}
  if(db&&Array.isArray(db.users)&&db.users.length)return db;
  let old=null;try{old=JSON.parse(localStorage.getItem(OLDKEY))}catch{}
  if(old&&Array.isArray(old.users)&&old.users.length){
    const users=old.users.map(u=>Object.assign(initialUser(u.name||"Aluno",u.instrument||"Piano"),{
      id:u.id||"u"+Date.now(),xp:u.xp||0,totalCorrect:u.correct||0,totalAttempts:u.attempts||0,
      completed:Object.fromEntries((u.lessons||[]).map(id=>[id,{at:Date.now(),stars:1}]))
    }));
    return {users,active:users.some(u=>u.id===old.active)?old.active:users[0].id};
  }
  const u=initialUser();return {users:[u],active:u.id};
}
let db=load(),page="home",courseFilter="all",songFilter="Todas",session=null,audioStatus="off",audioError="",lastFrame=null,tipTimer=null,demoBusy=false,metronome=false,bpm=80,toastTimer=null;
db.users.forEach(u=>{ensureProgress(u);u.personalLyrics=safeLibrary(u.personalLyrics)});
let vocal=null,vocalAward=null,personalSession=null,singingRAF=0,singingLastTick=0,vocalFrame=null,editingSongId=null;
let catalogQuery="",catalogScope="mine",catalogDifficulty="all",songDetailId=null;
let performanceRAF=0,lastVisualTick=0;
const player=new SoundPlayer();
const audio=new AudioEngine(frame=>onFrame(frame),ev=>onNote(ev),(status,error)=>{audioStatus=status;if(error)audioError=error;updateAudioUI()});
const active=()=>db.users.find(u=>u.id===db.active)||db.users[0];
const currentInstrument=()=>instrumentInfo(active().instrument);
const currentLessons=()=>lessonsForInstrument(active().instrument,LESSONS);
const catalogData=()=>({pianoSongs:SONGS,lessons:LESSONS,vocalSongs:VOCAL_SONGS,personalSongs:active().personalLyrics||[]});
const fullCatalog=()=>catalogEntries(catalogData());
const selectedCatalogEntry=()=>catalogEntryById(songDetailId,catalogData());
const save=()=>{try{localStorage.setItem(DBKEY,JSON.stringify(db));return true}catch(e){console.warn("Armazenamento local indisponível",e);return false}};
function toast(message){const prev=$("#toast");if(prev)prev.remove();const node=document.createElement("div");node.id="toast";node.className="toast";node.textContent=message;document.body.appendChild(node);clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.remove(),3500)}
function navButton(item){const [id,icon,label]=item;return '<button class="nav-btn '+(page===id?"active":"")+'" data-route="'+id+'"><span class="i">'+icon+'</span><span>'+label+'</span></button>'}
function mobileButton(item){const [id,icon,label]=item;const selected=page===id||(page==="song-detail"&&id==="library")||(page==="instruments"&&id==="profiles");return '<button class="'+(selected?"active":"")+'" data-route="'+id+'" aria-label="'+label+'" aria-current="'+(selected?"page":"false")+'"><span class="icon">'+icon+'</span><span>'+label+'</span></button>'}
function shell(content){
  const u=active(),complete=currentLessons().filter(l=>u.completed[l.id]).length;
  return '<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">♫</span> Musical Sense</div><div class="side-caption">EXPLORAR</div>'+
  routes.map(navButton).join("")+'<div class="sidebar-spacer"></div><div class="sidebar-panel"><strong>🎯 Seu progresso</strong><p>'+complete+' aulas concluídas · '+u.xp+' XP</p><div class="progress-track" style="margin-top:12px"><div class="progress-fill" style="width:'+percent(complete,Math.max(1,currentLessons().length))+'%"></div></div></div></aside>'+
  '<div class="main"><div class="content"><div class="topbar"><span class="eyebrow">APRENDA NO SEU TEMPO</span><div class="top-actions"><span class="bubble">⚡ '+u.xp+' XP</span><button class="profile-switch" data-route="profiles" title="Trocar perfil"><span class="avatar">'+esc(u.name.trim().charAt(0).toUpperCase())+'</span>'+esc(u.name.split(" ")[0])+' ▾</button></div></div>'+
  content+'</div></div></div><nav class="mobile-nav" aria-label="Navegação principal">'+mobileRoutes.map(mobileButton).join("")+'</nav>';
}
function metric(label,value,icon,color){return '<div class="card stat"><span class="stat-icon '+color+'">'+icon+'</span><div><b>'+esc(value)+'</b><span>'+esc(label)+'</span></div></div>'}
function home(){
  const u=active(),info=currentInstrument(),lessons=currentLessons(),complete=lessons.filter(l=>u.completed[l.id]).length,
    next=lessons.find(l=>!u.completed[l.id])||lessons[0],level=levelInfo(u.xp),streak=streakInfo(u);
  const isVoice=info.id==="voice",cta=isVoice?'<button class="btn white" data-vocal="voice-warmup">🎤 Aquecer minha voz</button>':next?'<button class="btn white" data-lesson="'+esc(next.id)+'">▶ '+(complete?"Continuar minha trilha":"Começar primeira aula")+'</button>':'<button class="btn white" data-route="instruments">Escolher instrumento</button>';
  const title=isVoice?"Sua voz é seu instrumento.":complete?"Cada nota leva você mais longe.":"Sua jornada musical começa aqui.";
  let out=instrumentContext(u.instrument)+
    '<section class="hero"><div class="hero-copy"><span class="pill dark">'+info.icon+' '+esc(info.name.toUpperCase())+' · NÍVEL '+level.level+'</span><h1>'+title+'</h1><p>'+(isVoice?"Pratique afinação e cante com letras sincronizadas.":"Aprenda em lições curtas, com seu instrumento físico e feedback por microfone.")+'</p>'+cta+'</div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit"></div><span class="big-note">♫</span><span class="spark">✦</span></div></section>';
  out+='<div class="grid three" style="margin-top:13px">'+metric("Seu nível",level.level,"⭐","purple")+metric("XP total",u.xp,"⚡","green")+metric("Dias de prática",streak.current,"🔥","")+'</div>';
  if(next)out+='<div class="section-head"><h2>Seu próximo passo</h2><button class="link-action" data-route="courses">Ver trilha →</button></div>'+
    '<div class="lesson-row"><span class="lesson-icon">'+next.icon+'</span><div class="grow"><span class="eyebrow">'+(complete?"CONTINUE DE ONDE PAROU":"PRIMEIRA LIÇÃO")+'</span><h3>'+esc(next.title)+'</h3><p>'+esc(next.subtitle)+'</p><div class="lesson-foot"><span>⏱ '+next.minutes+' min</span><span>⚡ até '+next.xp+' XP base</span></div></div><button class="btn lesson-action" data-lesson="'+esc(next.id)+'">'+(u.checkpoints?.[next.id]?"Retomar":"Começar")+' →</button></div>';
  if(isVoice)out+='<div class="section-head"><h2>Comece cantando</h2><button class="link-action" data-route="singing">Ver repertório →</button></div>'+
    '<div class="lesson-row"><span class="lesson-icon teal">🎤</span><div class="grow"><h3>Vocalize com Lá</h3><p>Aqueça sua voz e experimente notas sustentadas.</p></div><button class="btn lesson-action" data-vocal="voice-warmup">Cantar →</button></div>';
  out+='<div class="section-head"><h2>O que vamos fazer hoje?</h2></div><div class="grid two"><div class="card workout"><div class="workout-deco" aria-hidden="true">♫</div><span class="pill dark">PRÁTICA CURTA</span><h2 style="margin:12px 0 8px">Treino de 5 minutos</h2><p>Uma sessão rápida pode manter o seu ritmo de estudo.</p><button class="btn white" data-route="workouts">Escolher treino →</button></div><div class="gamification-mini"><span class="pill">🏆 DESAFIOS</span><h3 style="margin:12px 0 5px">Suas conquistas</h3><p>Complete missões diárias e acompanhe seu progresso.</p><div class="statline"><strong>Próximo nível</strong><span>'+level.progress+'%</span></div><div class="progress-track"><div class="progress-fill" style="width:'+level.progress+'%"></div></div><button class="btn sm ghost" style="margin-top:13px" data-route="achievements">Ver conquistas →</button></div></div>';
  out+='<div class="section-head"><h2>Músicas para '+esc(info.name.toLowerCase())+'</h2><button class="link-action" data-route="library">Ver biblioteca →</button></div>';
  const preview=catalogFilter(fullCatalog(),{scope:"mine",instrument:info.id,difficulty:"all",favorites:u.favorites||[]}).slice(0,2);
  out+='<div class="lesson-list">'+(preview.length?preview.map(item=>'<div class="lesson-row"><span class="lesson-icon sky">'+item.cover+'</span><div class="grow"><h3>'+esc(item.title)+'</h3><p>'+esc(item.artist)+' · '+esc(item.level)+'</p></div><button class="btn sm lesson-action" data-open-song="'+esc(item.id)+'">Ver →</button></div>').join(""):'<div class="card"><p class="muted small">Escolha um instrumento para encontrar as músicas adequadas.</p><button class="btn sm" data-route="instruments">Escolher</button></div>')+'</div>';
  return out;
}
function courseCard(c){
  const total=LESSONS.filter(l=>l.course===c.id),done=total.filter(l=>active().completed[l.id]).length;
  return '<div class="course-card"><div class="course-art '+c.theme+'"><span class="course-badge">'+done+'/'+total.length+' aulas</span><span aria-hidden="true">'+c.icon+'</span></div><div class="course-inner"><h3>'+esc(c.name)+'</h3><p>'+esc(c.subtitle)+'</p><div class="progress-track" style="margin-bottom:14px"><div class="progress-fill" style="width:'+percent(done,total.length)+'%"></div></div><div class="course-foot"><span>'+percent(done,total.length)+'% concluído</span><button class="btn sm ghost" data-course="'+c.id+'">Explorar →</button></div></div></div>';
}
function lessonCard(l){
  const done=active().completed[l.id],checkpoint=active().checkpoints?.[l.id],colored=l.course==="solo"?"teal":l.course==="harmony"?"gold":"sky";
  return '<div class="lesson-row"><span class="lesson-icon '+colored+'">'+l.icon+'</span><div class="grow"><div class="row wrap" style="gap:8px"><h3>'+esc(l.title)+'</h3>'+(done?'<span class="pill green">✓ Concluída</span>':'')+'</div><p>'+esc(l.subtitle)+'</p><div class="lesson-foot"><span>⏱ '+l.minutes+' min</span><span>⚡ '+l.xp+' XP</span><span>Nível '+l.level+'</span></div></div><button class="btn sm '+(done?"ghost":"")+' lesson-action" data-lesson="'+l.id+'">'+(done?"Refazer ↻":checkpoint?.index>0?"Continuar "+checkpoint.index+"/"+getSessionNotes(l).length+" →":"Começar →")+'</button></div>';
}
function courses(){
 const u=active();
 return '<div class="page-intro"><span class="eyebrow">UM PASSO DE CADA VEZ</span><h1>Sua trilha de aprendizagem</h1><p>Uma sequência clara de lições para seu instrumento, sem bloquear a liberdade de praticar.</p></div>'+
 learningPath({instrument:u.instrument,lessons:currentLessons(),completed:u.completed||{},checkpoints:u.checkpoints||{}});
}
function library(){
 return catalogPage({entries:fullCatalog(),query:catalogQuery,scope:catalogScope,difficulty:catalogDifficulty,
   favorites:active().favorites||[],instrument:active().instrument});
}
function songDetail(){
 return songDetailPage(selectedCatalogEntry(),{favorite:(active().favorites||[]).includes(songDetailId),instrument:active().instrument});
}
function instrumentsPage(){
 return instrumentPicker(active().instrument);
}
function workouts(){
 const u=active(),today=localDay(),seconds=(u.history||[]).filter(h=>h.day===today).reduce((sum,h)=>sum+(Number(h.seconds)||0),0),
   options=currentLessons().filter(l=>["notes","reading","technique","rhythm"].includes(l.kind)).slice(0,3),
   isVoice=currentInstrument().id==="voice";
 return instrumentContext(u.instrument)+'<div class="page-intro"><span class="eyebrow">CONSTÂNCIA MUSICAL</span><h1>Treinos rápidos ⏱</h1><p>Escolha uma habilidade para praticar em sessões curtas.</p></div>'+
 '<div class="card workout"><span class="pill dark">DESAFIO DO DIA</span><h2 style="margin:13px 0 8px">Meta: cinco minutos</h2><p>'+Math.floor(Math.min(300,seconds)/60)+' de 5 minutos registrados hoje.</p><div class="progress-track" style="background:#5a5a89;max-width:440px"><div class="progress-fill" style="width:'+Math.min(100,percent(seconds,300))+'%"></div></div><p class="small" style="margin:10px 0 0">O aplicativo registra tempo nas práticas concluídas.</p></div>'+
 '<div class="section-head"><h2>Escolha uma atividade</h2></div><div class="lesson-list">'+options.map(lessonCard).join("")+
 '<div class="lesson-row"><span class="lesson-icon teal">🎤</span><div class="grow"><h3>Aquecimento vocal</h3><p>Vocalize e exercite a afinação.</p><div class="lesson-foot"><span>🎤 Canto</span></div></div><button class="btn sm lesson-action" data-vocal="voice-warmup">Cantar →</button></div></div>'+
 (isVoice?'<p class="inline-tip">Você escolheu voz. Os exercícios de notas do piano não são apresentados nesta trilha.</p>':"");
}
function diagnostics(){
 let storageStatus="Disponível";try{const key="musical-sense-diagnostic";localStorage.setItem(key,"ok");localStorage.removeItem(key)}catch(e){storageStatus="Bloqueado ou indisponível"}
 const micSupported=Boolean(navigator.mediaDevices?.getUserMedia),secure=Boolean(window.isSecureContext),pwa=Boolean(navigator.serviceWorker);
 const note=lastFrame?.note;
 return '<div class="page-intro"><button class="link-action" data-route="profiles">← Voltar para perfis</button><h1>Diagnóstico do Musical Sense 🔧</h1><p>Use esta tela para descobrir por que o aplicativo não está captando som ou salvando seu progresso. Não é necessário concluir uma aula para testar.</p></div>'+
 '<div class="grid two"><section class="card"><h2>🎙 Teste do microfone</h2><span class="pill '+(audio.listening?"green":"orange")+'">'+(audio.listening?"Captando som":"Desligado")+'</span><p class="small muted" style="margin-top:15px">Toque uma nota ou cante uma vogal sustentada depois de ativar.</p>'+
 '<div class="vocal-meter"><div id="diag-meter"></div></div><div class="vocal-readings"><div><b id="diag-note">'+(note===null||note===undefined?"—":noteName(note))+'</b><span>Nota</span></div><div><b id="diag-hz">'+(lastFrame?.hz?lastFrame.hz.toFixed(1):"0")+'</b><span>Hz</span></div><div><b id="diag-confidence">'+(lastFrame?.confidence?Math.round(lastFrame.confidence*100):0)+'%</b><span>Confiança</span></div></div>'+
 '<button class="btn '+(audio.listening?"ghost":"")+'" data-action="diagnose-mic">'+(audio.listening?"Desligar":"🎙 Testar microfone")+'</button></section>'+
 '<section class="card"><h2>Verificações do dispositivo</h2>'+
 [['HTTPS / contexto seguro',secure],['API do microfone',micSupported],['PWA / Service Worker',pwa],['Armazenamento de progresso',storageStatus==="Disponível"]].map(([label,ok])=>'<div class="row between" style="border-bottom:1px solid #edf0f7;padding:10px 0"><span class="small">'+esc(label)+'</span><span class="pill '+(ok?"green":"orange")+'">'+(ok?"✓ OK":"Verificar")+'</span></div>').join("")+
 '<p class="muted small" style="margin-top:15px">Armazenamento: '+esc(storageStatus)+' · Perfil ativo: '+esc(active().name)+'</p>'+
 '<div class="row wrap"><button class="btn sm ghost" data-action="diagnose-copy">Copiar diagnóstico</button><button class="btn sm outline" data-action="diagnose-reload">Atualizar aplicativo</button></div></section></div>'+
 '<div class="card" style="margin-top:18px"><h3>O que testar</h3><p class="muted small">1. Ative o microfone. 2. Cante uma vogal ou toque uma nota longa. 3. Veja se o nível de volume sobe. 4. Se o volume subir, mas não houver nota, reduza o ruído e tente outro registro. 5. Copie o diagnóstico se precisar relatar o problema.</p></div>';
}
function diagnosticReport(){
 return ["Musical Sense - diagnóstico","Data: "+new Date().toISOString(),"Contexto HTTPS: "+Boolean(window.isSecureContext),
 "Microfone: "+audioStatus,"Suporte getUserMedia: "+Boolean(navigator.mediaDevices?.getUserMedia),
 "Nota detectada: "+(lastFrame?.note==null?"nenhuma":noteName(lastFrame.note)),
 "Hz: "+(lastFrame?.hz?.toFixed(1)||0),"Volume RMS: "+(lastFrame?.rms?.toFixed(4)||0),
 "Confiança: "+(lastFrame?.confidence?.toFixed(3)||0),
 "PWA: "+Boolean(navigator.serviceWorker),"Navegador: "+(navigator.userAgent||"indisponível")].join("\n");
}
function profiles(){
  const u=active();
  return '<div class="page-intro"><span class="eyebrow">UM ESPAÇO PARA CADA MÚSICO</span><h1>Perfis da família</h1><p>Compartilhem o aparelho sem misturar pontos, aulas e conquistas. Os dados ficam salvos apenas neste navegador.</p><button class="btn ghost sm" data-route="instruments">🎸 Trocar meu instrumento: '+esc(instrumentName(u.instrument))+' →</button></div>'+
  '<div class="grid two"><section class="card"><h2>Escolha quem vai tocar</h2>'+db.users.map(p=>'<div class="profile-row '+(p.id===u.id?"active":"")+'"><span class="avatar">'+esc(p.name[0].toUpperCase())+'</span><div class="grow"><b>'+esc(p.name)+'</b><div class="muted small">'+esc(p.instrument)+' · '+(p.xp||0)+' XP</div></div><div class="profile-tools"><button class="btn sm '+(p.id===u.id?"ghost":"")+'" data-profile="'+esc(p.id)+'">'+(p.id===u.id?"✓ Ativo":"Entrar")+'</button><button class="btn sm outline" data-profile-edit="'+esc(p.id)+'" aria-label="Renomear perfil">✎</button><button class="btn sm outline" data-profile-delete="'+esc(p.id)+'" aria-label="Excluir perfil">×</button></div></div>').join("")+'</section>'+
  '<section class="card"><h2>Adicionar músico</h2><form id="profile-form"><label class="form-field" for="profile-name">Nome</label><input class="form-input" id="profile-name" name="name" maxlength="30" required placeholder="Ex.: Ana"><label class="form-field" for="profile-instrument">Instrumento</label><select class="form-input" id="profile-instrument" name="instrument">'+INSTRUMENTS.map(v=>'<option>'+esc(v.name)+'</option>').join("")+'</select><button class="btn" type="submit">+ Criar perfil</button></form><p class="inline-tip">Nesta fase, as trilhas práticas estão preparadas para piano e teclado. Outros instrumentos terão conteúdos próprios em versões futuras.</p><button class="btn sm outline" data-route="diagnostics">🔧 Diagnóstico e teste de microfone</button></section></div>'+
  '<div class="card" style="margin-top:18px"><h3>Seus números</h3><div class="grid three">'+metric("Experiência",u.xp+" XP","⚡","purple")+metric("Lições",Object.keys(u.completed||{}).length,"🏆","green")+metric("Precisão",percent(u.totalCorrect,u.totalAttempts)+"%","🎯","")+'</div></div>'+
  '<div class="card" style="margin-top:17px"><h3>💾 Backup da família</h3><p class="muted small">Exporte seus perfis, XP, aulas e letras pessoais para um arquivo JSON. Guarde-o com cuidado, pois pode conter nomes e letras. Restaurar um backup substitui os dados deste dispositivo.</p><div class="row wrap"><button class="btn sm ghost" data-action="backup-export">⬇ Exportar progresso</button><label class="btn sm outline" for="backup-file">⬆ Restaurar backup</label><input type="file" id="backup-file" accept=".json,application/json" style="display:none"></div></div>';
}
const degree=[0,0,1,1,2,3,3,4,4,5,5,6];
function diatonic(m){return Math.floor(m/12)*7+degree[((m%12)+12)%12]}
function noteY(m,bass){return 138-(diatonic(m)-(bass?diatonic(43):diatonic(64)))*8.5}
function scoreSvg(){
  const steps=session.steps,start=Math.floor(session.index/8)*8,windowSteps=steps.slice(start,start+8),bass=session.lesson.id==="bass"||session.lesson.instrument==="bass-guitar";
  let svg='<svg viewBox="0 0 860 210" role="img" aria-label="Partitura: próxima nota '+esc(noteName(steps[session.index].m))+'"><rect width="860" height="210" fill="#fff"/>';
  for(let i=0;i<5;i++)svg+='<line class="score-line" x1="68" x2="837" y1="'+(70+i*17)+'" y2="'+(70+i*17)+'"/>';
  svg+='<text x="15" y="137" fill="#353451" font-family="serif" font-size="83">'+(bass?"𝄢":"𝄞")+'</text>';
  windowSteps.forEach((entry,j)=>{
    const i=start+j,x=112+j*99,y=noteY(entry.m,bass),current=i===session.index,previous=session.feedback[i],isWrong=current&&session.wrongFlashUntil>Date.now();
    const fill=isWrong?"#ee6e80":["correct","perfect","good"].includes(previous)?"#2bbfa6":["hint","ok"].includes(previous)?"#efb552":previous==="miss"?"#ee6e80":current?"#6b56eb":"#abb0c4";
    if(current)svg+='<rect x="'+(x-37)+'" y="34" width="74" height="143" rx="21" fill="#eeeafe"/><line x1="'+x+'" x2="'+x+'" y1="31" y2="179" stroke="#9586ee" stroke-width="2" stroke-dasharray="5 6"/>';
    if(y>=153){for(let ledger=155;ledger<=y+4;ledger+=17)svg+='<line x1="'+(x-22)+'" x2="'+(x+22)+'" y1="'+ledger+'" y2="'+ledger+'" stroke="#9fa5b7" stroke-width="1.5"/>'}
    if(y<=55){for(let ledger=53;ledger>=y-4;ledger-=17)svg+='<line x1="'+(x-22)+'" x2="'+(x+22)+'" y1="'+ledger+'" y2="'+ledger+'" stroke="#9fa5b7" stroke-width="1.5"/>'}
    svg+='<line x1="'+(x+11)+'" x2="'+(x+11)+'" y1="'+y+'" y2="'+(y-44)+'" stroke="'+fill+'" stroke-width="3.2"/>';
    svg+='<ellipse cx="'+x+'" cy="'+y+'" rx="14" ry="10" transform="rotate(-20 '+x+' '+y+')" fill="'+fill+'"/>';
    if(entry.f)svg+='<circle cx="'+x+'" cy="'+(y-69)+'" r="13" fill="'+(current?"#6d5be7":"#e4e6f0")+'"/><text x="'+x+'" y="'+(y-65)+'" font-size="12" fill="'+(current?"#fff":"#68718e")+'" font-weight="800" text-anchor="middle">'+entry.f+'</text>';
    if(previous)svg+='<text x="'+x+'" y="195" fill="'+fill+'" font-size="19" text-anchor="middle">'+(previous==="miss"?"×":previous==="hint"?"★":"✓")+'</text>';
    if(current)svg+='<text x="'+x+'" y="20" fill="#6756e4" font-size="12" text-anchor="middle" font-weight="800">AGORA</text>';
  });
  return svg+'</svg>';
}
function piano(){
  const bass=session.lesson.id==="bass",from=bass?48:60,target=session.steps[session.index].m,heard=lastFrame&&lastFrame.note,whites=[],blacks=[];
  const keys=[0,2,4,5,7,9,11],blackAfter=[0,1,3,4,5],labelSet=[0,3,7,10];
  for(let octave=0;octave<2;octave++){
    for(let i=0;i<7;i++){
      const m=from+octave*12+keys[i];
      const keyClass=m===target&&session.showHint?" target":m===heard?" heard":"";
      whites.push('<div class="white-key'+keyClass+'" title="'+noteName(m)+'"><span class="key-label">'+(labelSet.includes(i+octave*7)?esc(noteShort(m)):"")+'</span></div>');
    }
  }
  for(let octave=0;octave<2;octave++){
    for(const i of blackAfter){
      const m=from+octave*12+keys[i]+1;
      const pos=(octave*7+i+1)/14*100;
      const c=m===target&&session.showHint?" target":m===heard?" heard":"";
      blacks.push('<div class="black-key'+c+'" style="left:'+pos+'%" title="'+noteName(m)+'"></div>');
    }
  }
  return '<div class="piano" aria-label="Teclado visual para orientação, sem entrada por toque">'+whites.join("")+blacks.join("")+'</div>';
}
function audioText(){if(audioStatus==="listening")return "Microfone ouvindo seu instrumento";if(audioStatus==="permission")return "Solicitando acesso ao microfone";if(audioStatus==="error")return audioError||"Microfone indisponível";return "Microfone desligado"}
function coachMessage(){
  if(session.mode==="performance"&&session.performance){const p=session.performance;if(p.phase==="ready")return "Escolha a velocidade e pressione Começar performance.";if(p.phase==="paused")return "A performance está pausada. Continue quando estiver pronto.";if(p.phase==="countin")return "Ouça os quatro tempos de preparação.";return p.lastFeedback}
  if(session.coach)return session.coach;
  if(audioStatus==="error")return "Verifique a permissão de microfone no Safari. Você também pode tentar uma entrada MIDI em navegadores compatíveis.";
  if(audioStatus!=="listening"&&!session.midiEnabled)return "Toque em Ativar microfone para começar. O aplicativo vai escutar seu instrumento de verdade.";
  if(session.showHint)return "Dica ativada: acompanhe a posição destacada na referência visual do seu instrumento.";
  return session.index===0?"Acompanhe a partitura e toque a primeira nota.":"Ótimo! Agora encontre a próxima nota. Você está indo bem.";
}
function practice(){
  const s=session,l=s.lesson,total=s.steps.length,current=s.steps[s.index],progress=percent(s.index,total);
  return '<div class="lesson-screen"><header class="lesson-top"><button class="lesson-back" data-action="leave" aria-label="Fechar aula">✕</button><div class="lesson-title"><strong>'+esc(l.title)+'</strong><span>'+esc(l.subtitle)+'</span></div><div class="lesson-progress"><div class="progress-track"><div class="progress-fill" style="width:'+progress+'%"></div></div></div><div class="lesson-stats"><span class="pill">⚡ '+(s.hits*10)+' XP</span><span class="pill">'+(s.index+1)+'/'+total+'</span></div></header>'+
  '<div class="lesson-body"><div class="practice-modes" role="group" aria-label="Modo da aula"><button class="practice-mode '+(s.mode==="guided"?"active":"")+'" data-mode="guided">📖 Aprender sem pressa</button><button class="practice-mode '+(s.mode==="performance"?"active":"")+'" data-mode="performance">🎵 Tocar no ritmo</button></div>'+(s.mode==="performance"?performancePanel(s,noteName,bpm):"")+'<div class="instruction"><div><span class="difficulty">'+(s.mode==="performance"?"DESAFIO NO TEMPO":l.kind==="song"?"TOCANDO UMA MELODIA":"PRÁTICA GUIADA")+'</span><h1>Toque <span style="color:#6656e7">'+noteName(current.m)+'</span></h1><span class="muted">'+esc(s.sectionRange?"Treino focado nas notas "+(s.sectionRange.start+1)+" a "+s.sectionRange.end+".":l.tip)+'</span></div><button class="btn outline sm" data-action="demo" '+(demoBusy||s.mode==="performance"&&s.performance.phase!=="ready"?"disabled":"")+'>♫ Ouvir exemplo</button></div>'+
  '<section class="lesson-main"><div class="score-header"><strong>🎼 Sua partitura</strong><span>Nota '+(s.index+1)+' de '+total+'</span></div><div class="score-board">'+scoreSvg()+'</div><div class="keyboard-panel"><div class="keyboard-top"><strong>'+(currentInstrument().group==="strings"?"🎸 Onde tocar no "+esc(currentInstrument().name):"⌨ Onde tocar no teclado")+'</strong><span>'+(s.showHint?"Posição destacada em lilás":"Toque no instrumento físico") +'</span></div>'+(currentInstrument().group==="strings"?fretboard(currentInstrument().id,current,{showHint:s.showHint,heard:lastFrame?.note??null}):piano())+'</div></section>'+
  '<div class="lesson-bottom"><section class="listen-panel"><div class="listen-top"><div class="listen-indicator"><span class="audio-dot '+(audioStatus==="listening"?"on":audioStatus==="permission"?"wait":"")+'" id="audio-dot"></span><div><div class="audio-status" id="audio-status">'+esc(audioText())+'</div><div class="audio-sub" id="audio-sub">'+(audioStatus==="listening"?"Toque uma nota por vez e sustente por um instante.":"O acesso será solicitado pelo navegador.")+'</div></div></div><div class="row"><button class="btn sm '+(audio.listening?"ghost":"")+'" data-action="microphone" id="mic-btn">'+(audio.listening?"Desligar":"🎙 Ativar microfone")+'</button></div></div>'+
  '<div class="level"><div id="input-level" style="width:0%"></div></div><div class="audio-readings"><span id="heard">Nota: aguardando</span><span id="frequency">0 Hz</span><span id="tuning">Afinação: —</span></div>'+
  '<div class="row wrap" style="margin-top:14px"><button class="btn outline sm" data-action="midi">🎹 '+(s.midiEnabled?"MIDI conectado":"Conectar MIDI")+'</button><label class="row small muted" for="sensitivity">Sensibilidade <input id="sensitivity" type="range" min="0" max="100" value="'+s.sensitivity+'" style="width:90px" aria-label="Sensibilidade do microfone"></label></div></section>'+
  '<section class="coaching-panel"><div class="coach-head"><span class="coach-emoji">💡</span> Seu professor virtual</div><div class="coach-message" id="coach-message">'+esc(coachMessage())+'</div><div class="coach-actions"><button class="btn sm ghost" data-action="hint">'+(s.showHint?"Ocultar dica":"🔍 Mostrar dica")+'</button><button class="btn sm outline" data-action="hear-note">♫ Ouvir nota</button><button class="btn sm outline" data-action="restart">↻ Reiniciar</button><button class="btn sm outline" data-action="tempo">⏱ '+bpm+' BPM</button>'+(s.mode==="performance"?"":'<button class="btn sm outline" data-action="metronome">'+(metronome?"◼ Parar pulso":"♪ Metrônomo")+'</button>')+'</div></section></div>'+
  '<footer class="lesson-footer"><span class="muted">🎙 Use seu instrumento físico. A tela é apenas um guia visual.</span><span class="muted">Os acordes simultâneos ainda não são reconhecidos.</span><button class="btn dark sm" data-action="leave">Salvar e sair</button></footer></div></div>';
}
function result(){
  const r=session.result,stars="★".repeat(r.stars)+"☆".repeat(3-r.stars);
  return '<div class="result-wrap"><section class="result-card"><div class="result-icon">'+(r.passed?"🏆":"🎯")+'</div><span class="pill '+(r.passed?"green":"orange")+'">'+(r.passed?"AULA CONCLUÍDA":"TREINO CONCLUÍDO")+'</span><h1>'+(r.passed?"Você fez música!":"Você está evoluindo!")+'</h1><p>'+(r.passed?"Mais um passo para tocar cada vez melhor.":"Continue praticando para aumentar sua precisão.")+'</p><div class="result-stars" aria-label="'+r.stars+' de três estrelas">'+stars+'</div><div class="result-stats"><div class="result-stat"><strong>+'+r.xp+'</strong><span>XP conquistados</span></div><div class="result-stat"><strong>'+r.accuracy+'%</strong><span>Notas corretas</span></div><div class="result-stat"><strong>'+r.seconds+'s</strong><span>Tempo de aula</span></div></div>'+performanceResultExtra(r)+''+(r.awards?.badges?.length?'<div class="success-panel">🏅 Novas medalhas: '+r.awards.badges.map(id=>esc(BADGES.find(b=>b.id===id)?.name||id)).join(", ")+'</div>':"")+(r.awards?.levelUp?'<p class="success-text">⭐ Você alcançou o nível '+r.awards.level+'!</p>':"")+'<div class="row wrap" style="justify-content:center"><button class="btn ghost" data-action="repeat">↻ Praticar novamente</button>'+(r.performance&&r.performance.difficultRange?'<button class="btn ghost" data-action="difficult">🎯 Repetir trecho difícil</button>':"")+'<button class="btn" data-action="next">Próxima aula →</button></div></section></div>';
}
function render(){
  if(!db.users.some(u=>u.id===db.active))db.active=db.users[0].id;
  const content=page==="home"?home():page==="courses"?courses():page==="instruments"?instrumentsPage():page==="library"?library():page==="song-detail"?songDetail():page==="singing"?renderSingingHome(VOCAL_SONGS,active().personalLyrics||[],active().vocalCompleted||{}):page==="achievements"?renderAchievements(active(),{levelInfo,streakInfo,missionState,BADGES}):page==="lyrics-import"?renderImportLyrics((active().personalLyrics||[]).find(x=>x.id===editingSongId)):page==="diagnostics"?diagnostics():page==="workouts"?workouts():profiles();
  $("#app").innerHTML=page==="practice"&&session?practice():page==="result"&&session?result():page==="vocal-practice"&&vocal?renderVocalPractice(vocal,noteName,audioStatus,lastFrame):page==="vocal-result"&&vocal?renderVocalResult(vocal.summary(),vocalAward?.xp||0,vocalAward?.level||1,(vocalAward?.badges||[]).map(id=>BADGES.find(b=>b.id===id)?.name||id)):page==="personal-practice"&&personalSession?renderPersonalPractice(personalSession.song,{...personalSession,micActive:audio.listening},lastFrame,noteName):shell(content);
  document.title=(page==="practice"&&session?session.lesson.title+" | ":page==="vocal-practice"&&vocal?vocal.song.title+" | ":"")+"Musical Sense";
  updateAudioUI();
}
function stopTimers(){clearInterval(tipTimer);tipTimer=null;if(performanceRAF)cancelAnimationFrame(performanceRAF);performanceRAF=0;if(singingRAF)cancelAnimationFrame(singingRAF);singingRAF=0;player.stop();metronome=false;demoBusy=false}
function changePage(next){
  if(page==="song-detail"){player.stop();demoBusy=false}
  if(["practice","result","vocal-practice","vocal-result","personal-practice","diagnostics"].includes(page)){audio.stop();audio.disconnectMidi();stopTimers();session=null;vocal=null;personalSession=null}
  page=next;render();window.scrollTo(0,0);
}
async function startLesson(id,requestMicrophone=true,options={}){
  stopTimers();audio.stop();audio.disconnectMidi();
  const lesson=findInstrumentLesson(id,LESSONS);if(!lesson){toast("Esta aula não está disponível.");return}
  const allSteps=getSessionNotes(lesson),range=options.range&&options.range.end>options.range.start?options.range:null,steps=range?allSteps.slice(range.start,range.end):allSteps,mode=options.mode==="performance"?"performance":"guided";
  active().checkpoints=active().checkpoints||{};
  if(options.reset){delete active().checkpoints[id];save()}
  const checkpoint=mode==="guided"&&!range&&!options.reset?active().checkpoints[id]:null;
  session={lesson,steps,index:0,hits:0,misses:0,assisted:0,feedback:[],showHint:false,wrongFlashUntil:0,
    coach:"",stepStart:Date.now(),startedAt:Date.now(),lastPracticeEventAt:Date.now(),activePracticeMs:0,lastCorrect:null,sensitivity:70,midiEnabled:false,result:null,mode,sectionRange:range,
    sessionId:"instrument-"+Date.now()+"-"+Math.random().toString(36).slice(2),
    performance:mode==="performance"?new PerformanceSession(steps,{bpm,latencyMs:db.perfLatency??160}):null
  };
  if(checkpoint&&checkpoint.mode==="guided"&&checkpoint.index>0&&checkpoint.index<steps.length){
    session.index=checkpoint.index;session.hits=checkpoint.hits||checkpoint.index;session.misses=checkpoint.misses||0;
    session.assisted=checkpoint.assisted||0;session.activePracticeMs=checkpoint.activePracticeMs||0;session.feedback=Array(steps.length).fill(null).map((_,i)=>i<session.index?"correct":null);
  }
  page="practice";audioStatus="off";audioError="";lastFrame=null;audio.setSensitivity(.70);render();window.scrollTo(0,0);
  tipTimer=setInterval(()=>{if(page!=="practice"||!session||session.mode!=="guided")return;if(!session.showHint&&Date.now()-session.stepStart>9000){session.showHint=true;session.coach="Precisa de ajuda? A tecla lilás indica onde tocar.";render()}},1100);
  if(requestMicrophone)await enableMic();
}
async function enableMic(){
  if(audio.listening){audio.stop();updateAudioUI();render();return}
  try{await audio.start();updateAudioUI();render()}catch(e){audioError=e.message;audioStatus="error";render();toast("Microfone: "+e.message)}
}
function onFrame(frame){
  lastFrame=frame;
  if(page==="diagnostics"){
    const level=$("#diag-meter");if(level)level.style.width=Math.min(100,Math.round(frame.rms*1100))+"%";
    const note=$("#diag-note");if(note)note.textContent=frame.note==null?"—":noteName(frame.note);
    const hz=$("#diag-hz");if(hz)hz.textContent=frame.hz?.toFixed(1)||"0";
    const confidence=$("#diag-confidence");if(confidence)confidence.textContent=Math.round((frame.confidence||0)*100)+"%";
    return;
  }
  if(page==="vocal-practice"&&vocal){
    if(vocal.phase==="running")vocal.sample(frame,performance.now());
    const level=$("#vocal-meter");if(level)level.style.width=Math.min(100,Math.round(frame.rms*1100))+"%";
    const heard=$("#vocal-heard");if(heard)heard.textContent=frame.note==null?"Aguardando voz":noteName(frame.note);
    const cents=$("#vocal-cents");if(cents)cents.textContent=frame.note==null?"—":(frame.cents>0?"+":"")+frame.cents+" cents";
    const target=$("#vocal-target");if(target)target.textContent=noteName(vocal.song.steps[Math.min(vocal.index,vocal.song.steps.length-1)].m+vocal.transpose);
    return;
  }
  if(page==="personal-practice"&&personalSession){
    const p=personalSession;
    const level=$("#vocal-meter");if(level)level.style.width=Math.min(100,Math.round(frame.rms*1100))+"%";
    const heard=$("#vocal-heard");if(heard)heard.textContent=frame.note==null?"—":noteName(frame.note);
    if(p.playing&&frame.note!==null&&frame.rms>=.008&&frame.confidence>=.7){
      const now=performance.now(),dt=p.lastVoiceAt?Math.min(115,Math.max(0,now-p.lastVoiceAt)):65;
      p.voicedMs+=dt;p.lastVoiceAt=now;
      const counter=$("#personal-voice");if(counter)counter.textContent=Math.floor(p.voicedMs/1000)+"s";
    }else p.lastVoiceAt=0;
    return;
  }
  if(page!=="practice"||!session)return;
  const level=$("#input-level");if(level)level.style.width=Math.min(100,frame.rms*1100)+"%";
  const heard=$("#heard");if(heard)heard.textContent=frame.note===null?"Nota: aguardando":"Nota: "+noteName(frame.note);
  const frequency=$("#frequency");if(frequency)frequency.textContent=frame.hz?frame.hz.toFixed(1)+" Hz":"0 Hz";
  const tuning=$("#tuning");if(tuning)tuning.textContent=frame.note===null?"Afinação: —":"Desvio: "+(frame.cents>0?"+":"")+frame.cents+" cents";
  if(frame.note!==null&&!frame.ignored){
    const target=session.steps[session.index].m,match=frame.note===target;
    const status=$("#audio-sub");if(status)status.textContent=match?"Nota correta! Sustente por um instante.":"Ouvi "+noteName(frame.note)+". Procure "+noteName(target)+".";
    const keys=document.querySelectorAll(".white-key,.black-key");keys.forEach(k=>{k.classList.remove("heard","wrong");if(k.title===noteName(frame.note)&&frame.note!==target)k.classList.add("wrong");if(k.title===noteName(frame.note)&&frame.note===target)k.classList.add("heard")});
  }else{const status=$("#audio-sub");if(status)status.textContent=frame.rms<.008?"Aguardando o som do seu instrumento.":"Captando som. Toque uma nota isolada e sustentada.";}
}
function onNote(event){
  if(page!=="practice"||!session)return;
  const s=session,target=s.steps[s.index].m,m=event.note;
  if(s.mode==="performance"){const p=s.performance,rv=p.receive(event,performance.now());syncPerformanceState();if(p.phase==="finished"){finishLesson();return}if(rv.type==="hit"||rv.type==="wrong"){render()}else{const c=$("#performance-message");if(c)c.textContent=p.lastFeedback}return}
  const now=Date.now();s.activePracticeMs+=Math.min(15000,Math.max(0,now-s.lastPracticeEventAt));s.lastPracticeEventAt=now;
  if(m===target&&Math.abs(event.cents||0)<=45){
    const assisted=s.showHint;
    s.feedback[s.index]=assisted?"hint":"correct";s.hits++;if(assisted)s.assisted++;
    s.lastCorrect=m;s.index++;s.showHint=false;s.coach="✓ Muito bem! Próxima nota.";s.stepStart=Date.now();s.wrongFlashUntil=0;
    if(s.mode==="guided"&&!s.sectionRange){
      active().checkpoints=active().checkpoints||{};
      active().checkpoints[s.lesson.id]={mode:"guided",index:s.index,hits:s.hits,misses:s.misses,assisted:s.assisted,activePracticeMs:s.activePracticeMs,updatedAt:Date.now()};
      save();
    }
    if(s.index>=s.steps.length){finishLesson();return}
    if(s.steps[s.index].m===m)s.coach="Acertou! Solte a tecla e toque novamente para repetir a nota.";
    render();
  }else{
    s.misses++;s.wrongFlashUntil=Date.now()+650;
    s.coach="Tente outra vez: toque "+noteName(target)+". Eu reconheci "+noteName(m)+".";
    if(s.misses>=2&&s.misses%(Math.max(2,Math.floor(s.steps.length/3)))===0){s.showHint=true;s.coach="Sem problema! Procure a tecla lilás e tente novamente."}
    render();
    setTimeout(()=>{if(page==="practice"&&session===s&&s.wrongFlashUntil<Date.now())render()},750);
  }
}
function finishLesson(){
  const s=session,u=active(),performanceData=s.mode==="performance"?s.performance.summary():null;
  const accuracy=performanceData?performanceData.accuracy:percent(s.hits,s.hits+s.misses);
  const passed=!performanceData||accuracy>=65;
  const stars=accuracy>=92&&(!performanceData||performanceData.rhythmAccuracy>=80)&&s.assisted<=2?3:accuracy>=72?2:1;
  const seconds=Math.max(1,Math.round(s.mode==="performance"?(s.performance.totalBeats*s.performance.beatMs/1000):s.activePracticeMs/1000));
  const award=awardPractice(u,{
    sessionId:s.sessionId,kind:"instrument",mode:s.mode,lessonId:s.lesson.id,
    correct:s.hits,attempts:performanceData?performanceData.total:s.hits+s.misses,
    seconds,baseXp:s.lesson.xp,passed,full:!s.sectionRange,stars,
    song:s.lesson.kind==="song",assisted:s.assisted,rhythmAccuracy:performanceData?.rhythmAccuracy
  });
  s.result={accuracy,stars,xp:award.xp,seconds,passed,mode:s.mode,performance:performanceData,awards:award};
  if(!s.sectionRange&&passed&&u.checkpoints)delete u.checkpoints[s.lesson.id];
  if(!save())toast("Não foi possível salvar o progresso neste navegador.");
  audio.stop();audio.disconnectMidi();stopTimers();page="result";render();
}
function syncPerformanceState(){
  if(!session?.performance)return;
  const p=session.performance;
  session.index=Math.min(p.index,session.steps.length-1);
  session.hits=p.hits;
  session.misses=p.misses+p.wrong;
  session.feedback=p.events.map(e=>e?.status??null);
  session.coach=p.lastFeedback;
}
function animatePerformance(now){
  performanceRAF=0;
  if(page!=="practice"||!session?.performance)return;
  const p=session.performance;
  if(p.phase!=="running"&&p.phase!=="countin")return;
  const previous=p.index,phase=p.phase,frame=p.tick(now);
  if(frame.beat)player.metronomeClick(frame.beatNumber%4===0).catch(()=>{});
  syncPerformanceState();
  if(p.phase==="finished"){finishLesson();return}
  if(p.index!==previous||p.phase!==phase)render();
  if(now-lastVisualTick>=90){
    lastVisualTick=now;
    const roll=$("#performance-roll");if(roll)roll.innerHTML=performanceRollSvg(p,noteName,now);
    const clock=$("#perf-clock");if(clock)clock.textContent=p.phase==="countin"?"Contagem: "+p.countdown(now):p.index+" / "+p.total+" notas";
    const combo=$("#perf-combo");if(combo)combo.textContent=p.combo+"×";
    const perfect=$("#perf-perfect");if(perfect)perfect.textContent=p.perfect;
    const good=$("#perf-good");if(good)good.textContent=p.good;
    const misses=$("#perf-misses");if(misses)misses.textContent=p.misses;
    const message=$("#performance-message");if(message)message.textContent=p.phase==="countin"?"Prepare-se: "+p.countdown(now):p.lastFeedback;
  }
  performanceRAF=requestAnimationFrame(animatePerformance);
}
async function togglePerformance(){
  if(!session?.performance)return;
  const p=session.performance;
  if(p.phase==="finished"){resetPerformance();return}
  if(p.phase==="running"||p.phase==="countin"){
    p.pause(performance.now());if(performanceRAF)cancelAnimationFrame(performanceRAF);performanceRAF=0;render();return;
  }
  try{await player.context()}catch(e){toast("Sem áudio para a contagem. A partitura ainda pode avançar.")}
  const now=performance.now();
  if(p.phase==="paused")p.resume(now);else p.start(now);
  session.coach=p.lastFeedback;
  if(!audio.listening&&!session.midiEnabled)toast("Ative o microfone para registrar os acertos.");
  render();if(performanceRAF)cancelAnimationFrame(performanceRAF);
  performanceRAF=requestAnimationFrame(animatePerformance);
}
function resetPerformance(){
  if(!session?.performance)return;
  if(performanceRAF)cancelAnimationFrame(performanceRAF);performanceRAF=0;
  player.stop();metronome=false;
  session.performance=new PerformanceSession(session.steps,{bpm,latencyMs:db.perfLatency??160});
  session.index=0;session.hits=0;session.misses=0;session.feedback=[];session.coach="";
  session.startedAt=Date.now();session.stepStart=Date.now();render();
}
async function beginVocal(songId,{bpmOverride=null,transpose=0}={}){
  const song=vocalById(songId);if(!song){toast("Canção não encontrada.");return}
  audio.stop();audio.disconnectMidi();stopTimers();session=null;personalSession=null;
  vocal=new SingingSession(song,{bpm:bpmOverride||song.bpm,transpose,latencyMs:db.vocalLatency??130});
  vocal.sessionId="vocal-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  vocalAward=null;page="vocal-practice";audioStatus="off";audioError="";lastFrame=null;
  audio.setSensitivity(.90);render();window.scrollTo(0,0);
  await enableMic();
}
function animateVocal(now){
  singingRAF=0;
  if(page!=="vocal-practice"||!vocal||!["countin","running"].includes(vocal.phase))return;
  const p=vocal,previous=p.index,phase=p.phase,rv=p.tick(now);
  if(rv.beat)player.metronomeClick(rv.beatNumber%4===0).catch(()=>{});
  if(p.phase==="finished"){finishVocal();return}
  if(p.index!==previous||p.phase!==phase)render();
  if(now-singingLastTick>115){
    singingLastTick=now;
    const line=$("#vocal-countdown");if(line)line.textContent=p.phase==="countin"?"Prepare-se: "+p.countdown(now):"";
    const coach=$("#vocal-coach");if(coach)coach.textContent=p.lastFeedback;
    const syllable=$("#vocal-syllable");if(syllable)syllable.textContent=p.song.steps[Math.min(p.index,p.song.steps.length-1)].syllable;
  }
  singingRAF=requestAnimationFrame(animateVocal);
}
async function toggleVocal(){
  if(!vocal)return;
  if(demoBusy){player.stop();demoBusy=false;audio.muteFor(0)}
  if(vocal.phase==="finished"){await beginVocal(vocal.song.id,{bpmOverride:vocal.bpm,transpose:vocal.transpose});return}
  if(["running","countin"].includes(vocal.phase)){
    vocal.pause(performance.now());if(singingRAF)cancelAnimationFrame(singingRAF);singingRAF=0;
    render();return;
  }
  if(!audio.listening){
    toast("Ative o microfone antes de começar a cantar.");
    await enableMic();if(!audio.listening)return;
  }
  try{await player.context()}catch(e){toast("A contagem sonora pode estar indisponível neste navegador.")}
  const now=performance.now();if(vocal.phase==="paused")vocal.resume(now);else vocal.start(now);
  render();if(singingRAF)cancelAnimationFrame(singingRAF);
  singingRAF=requestAnimationFrame(animateVocal);
}
async function restartVocal(){
  if(!vocal)return;
  await beginVocal(vocal.song.id,{bpmOverride:vocal.bpm,transpose:vocal.transpose});
}
function finishVocal(){
  if(!vocal||page!=="vocal-practice")return;
  const p=vocal,summary=p.summary(),seconds=Math.max(1,Math.round(p.song.totalBeats*p.beatMs/1000));
  const passed=summary.accuracy>=60;
  vocalAward=awardPractice(active(),{
    sessionId:p.sessionId,kind:"vocal",mode:"singing",lessonId:p.song.id,
    correct:summary.accepted,attempts:summary.total,seconds,baseXp:85,passed,
    full:true,song:true,stars:summary.accuracy>=90?3:summary.accuracy>=70?2:1
  });
  if(!save())toast("Seu navegador não permitiu salvar o progresso.");
  audio.stop();stopTimers();page="vocal-result";render();
}
async function vocalDemo(){
  if(!vocal||demoBusy||["running","countin"].includes(vocal.phase))return;
  demoBusy=true;try{
    const notes=vocal.song.steps.slice(0,28).map(s=>({...s,m:s.m+vocal.transpose}));
    const milliseconds=await player.play(notes,vocal.bpm);
    audio.muteFor(milliseconds+200);toast("Melodia-guia iniciada. Use fones para evitar retorno no microfone.");
    render();
    setTimeout(()=>{demoBusy=false;if(page==="vocal-practice")render()},milliseconds);
  }catch(e){demoBusy=false;toast("Não foi possível reproduzir a melodia.");}
}
async function beginPersonal(id){
  const song=(active().personalLyrics||[]).find(s=>s.id===id);
  if(!song){toast("Letra não encontrada.");return}
  audio.stop();audio.disconnectMidi();stopTimers();session=null;vocal=null;vocalAward=null;
  personalSession={song,sessionId:"personal-"+Date.now()+"-"+Math.random().toString(36).slice(2),elapsedMs:0,voicedMs:0,playing:false,startedAt:0,lastVoiceAt:0,micActive:false,completed:false};
  page="personal-practice";audio.setSensitivity(.90);audioStatus="off";render();window.scrollTo(0,0);
  await enableMic();
}
function animatePersonal(now){
  singingRAF=0;
  if(page!=="personal-practice"||!personalSession?.playing)return;
  const p=personalSession;
  p.elapsedMs=p.baseElapsed+Math.max(0,now-p.startedAt);
  const line=p.song.lines;
  const index=Math.max(0,line.findLastIndex(l=>l.atMs<=p.elapsedMs));
  if(p.lastLine!==index){p.lastLine=index;render()}
  const timer=$("#personal-timer");if(timer)timer.textContent=Math.floor(p.elapsedMs/1000)+"s";
  if(p.elapsedMs>=p.song.durationMs){p.elapsedMs=p.song.durationMs;p.baseElapsed=p.elapsedMs;p.playing=false;render();return}
  singingRAF=requestAnimationFrame(animatePersonal);
}
function togglePersonal(){
  const p=personalSession;if(!p)return;
  if(p.playing){p.elapsedMs=p.baseElapsed+performance.now()-p.startedAt;p.baseElapsed=p.elapsedMs;p.playing=false;
    if(singingRAF)cancelAnimationFrame(singingRAF);singingRAF=0;render();return}
  if(p.elapsedMs>=p.song.durationMs){p.elapsedMs=0;p.baseElapsed=0;p.lastLine=-1}
  p.baseElapsed=p.elapsedMs;p.startedAt=performance.now();p.playing=true;
  render();singingRAF=requestAnimationFrame(animatePersonal);
}
function restartPersonal(){
  const p=personalSession;if(!p)return;
  if(singingRAF)cancelAnimationFrame(singingRAF);singingRAF=0;
  p.elapsedMs=0;p.baseElapsed=0;p.voicedMs=0;p.lastVoiceAt=0;p.playing=false;p.lastLine=-1;
  render();
}
function finishPersonal(){
  const p=personalSession;if(!p)return;
  if(p.completed){changePage("singing");return}
  if(p.playing){p.elapsedMs=p.baseElapsed+performance.now()-p.startedAt}
  p.completed=true;p.playing=false;
  const activeSeconds=Math.floor(p.voicedMs/1000);
  const reward=awardPractice(active(),{sessionId:p.sessionId,kind:"personal",mode:"lyrics-only",lessonId:p.song.id,
    correct:activeSeconds>=20?1:0,attempts:1,seconds:Math.floor(p.elapsedMs/1000),baseXp:0,passed:activeSeconds>=20,full:true});
  if(!save())toast("Seu navegador não permitiu salvar o progresso.");
  toast(activeSeconds>=20?"Prática registrada! +"+reward.xp+" XP por treinar a voz.":"Prática concluída. Cante por pelo menos 20 segundos para registrar XP.");
  changePage("singing");
}
function updateAudioUI(){
  if(page!=="practice"||!session)return;
  const dot=$("#audio-dot");if(dot)dot.className="audio-dot "+(audioStatus==="listening"?"on":audioStatus==="permission"?"wait":"");
  const status=$("#audio-status");if(status)status.textContent=audioText();
  const mic=$("#mic-btn");if(mic)mic.textContent=audio.listening?"Desligar":"🎙 Ativar microfone";
  const coach=$("#coach-message");if(coach)coach.textContent=coachMessage();
}
async function previewSong(){
  const item=selectedCatalogEntry();if(!item||!item.notes?.length||demoBusy)return;
  demoBusy=true;
  try{
    player.stop();
    const notes=item.notes.slice(0,12);
    const duration=await player.play(notes,item.bpm||80);
    toast("Reproduzindo uma prévia sintetizada da melodia.");
    setTimeout(()=>{demoBusy=false},duration+100);
  }catch(err){demoBusy=false;toast("A prévia não está disponível neste navegador.")}
}
async function hearDemo(){
  if(!session||demoBusy)return;
  demoBusy=true;const notes=session.steps.slice(session.index,Math.min(session.steps.length,session.index+8));
  try{
    const milliseconds=await player.play(notes,bpm);
    audio.muteFor(milliseconds+150);
    toast("Ouça a sequência e depois toque no seu instrumento.");
    render();
    setTimeout(()=>{demoBusy=false;if(page==="practice")render()},milliseconds);
  }catch(e){demoBusy=false;toast("Não foi possível reproduzir o exemplo.");render()}
}
async function hearSingleNote(){
  if(!session||demoBusy)return;
  demoBusy=true;
  try{const duration=await player.play([session.steps[session.index]],bpm);audio.muteFor(duration+150);toast("Ouça a nota e tente reproduzi-la.");render();setTimeout(()=>{demoBusy=false;if(page==="practice")render()},duration)}
  catch(e){demoBusy=false;toast("Não foi possível ouvir a nota.");render()}
}
async function connectMidi(){
  if(!session)return;
  try{
    const devices=await audio.enableMidi();session.midiEnabled=devices>0;
    if(devices){audio.stop();toast("MIDI conectado. "+devices+" entrada(s) disponível(is).")}else toast("Permissão MIDI concedida, mas nenhum instrumento conectado foi encontrado.");
    render();
  }catch(e){toast(e.message||"MIDI indisponível.");}
}
async function toggleMetro(){
  if(!session)return;
  if(metronome){player.stop();metronome=false;render();return}
  try{await player.metronome(bpm);metronome=true;render()}catch(e){toast("Não foi possível iniciar o metrônomo.")}
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("button");if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.route){changePage(d.route);return}
  if(d.instrument){
    const info=INSTRUMENTS.find(item=>item.id===d.instrument);if(!info)return;
    active().instrument=info.name;
    catalogScope="mine";catalogQuery="";catalogDifficulty="all";courseFilter="all";
    if(!save())toast("Não foi possível salvar a preferência.");
    changePage("home");toast("Instrumento selecionado: "+info.name+".");
    return;
  }
  if(d.catalogScope){catalogScope=d.catalogScope;render();return}
  if(d.openSong){songDetailId=d.openSong;changePage("song-detail");return}
  if(d.favorite){
    const item=catalogEntryById(d.favorite,catalogData());if(!item)return;
    const u=active(),favorites=new Set(u.favorites||[]);
    if(favorites.has(item.id))favorites.delete(item.id);else favorites.add(item.id);
    u.favorites=[...favorites];
    if(!save())toast("Não foi possível salvar seus favoritos.");
    render();return;
  }
  if(d.startSong){
    const item=catalogEntryById(d.startSong,catalogData());if(!item){toast("Música não encontrada.");return}
    if(item.kind==="instrument"){
      const target=instrumentInfo(item.instrument);
      if(!(target.id==="piano"&&currentInstrument().group==="keys")&&currentInstrument().id!==target.id){
        active().instrument=target.name;catalogScope="mine";save();
      }
      await startLesson(item.lessonId);return;
    }
    if(item.kind==="vocal"){await beginVocal(item.vocalId);return}
    if(item.kind==="personal"){await beginPersonal(item.personalId);return}
  }
  if(d.course){courseFilter=d.course;changePage("courses");return}
  if(d.filter){courseFilter=d.filter;render();return}
  if(d.genre){songFilter=d.genre;render();return}
  if(d.profileEdit){
    const p=db.users.find(x=>x.id===d.profileEdit);if(!p)return;
    const proposed=window.prompt("Novo nome do perfil:",p.name);if(proposed===null)return;
    const name=proposed.trim().slice(0,30);if(!name){toast("Informe um nome válido.");return}
    p.name=name;if(!save())toast("Não foi possível salvar o nome.");render();return;
  }
  if(d.profileDelete){
    if(db.users.length<=1){toast("Mantenha pelo menos um perfil.");return}
    const p=db.users.find(x=>x.id===d.profileDelete);if(!p)return;
    if(!window.confirm("Excluir o perfil "+p.name+"? O progresso e as letras locais deste aluno serão apagados."))return;
    db.users=db.users.filter(x=>x.id!==d.profileDelete);if(db.active===d.profileDelete)db.active=db.users[0].id;
    if(!save())toast("Não foi possível salvar a exclusão.");render();return;
  }
  if(d.profile){db.active=d.profile;save();changePage("home");return}
  if(d.lesson){await startLesson(d.lesson);return}
  if(d.vocal){await beginVocal(d.vocal);return}
  if(d.personal){await beginPersonal(d.personal);return}
  if(d.editPersonal){editingSongId=d.editPersonal;changePage("lyrics-import");return}
  if(d.removePersonal){
    const song=(active().personalLyrics||[]).find(x=>x.id===d.removePersonal);
    if(song&&window.confirm("Remover a letra “"+song.title+"” deste dispositivo?")){
      active().personalLyrics=active().personalLyrics.filter(x=>x.id!==d.removePersonal);
      if(!save())toast("Não foi possível salvar a alteração.");
      render();
    }
    return;
  }
  if(d.mode){if(!session||d.mode===session.mode)return;await startLesson(session.lesson.id,true,{mode:d.mode,range:session.sectionRange});return}
  if(d.performanceBpm){if(!session||session.mode!=="performance"||["running","countin"].includes(session.performance.phase))return;bpm=Number(d.performanceBpm);resetPerformance();return}
  const action=d.action;
  if(!action)return;
  if(action==="microphone"){await enableMic();return}
  if(action==="preview-song"){await previewSong();return}
  if(action==="catalog-reset"){catalogQuery="";catalogScope="all";catalogDifficulty="all";render();return}
  if(action==="diagnose-mic"){await enableMic();return}
  if(action==="backup-export"){
    try{
      const contents=makeBackup(db),blob=new Blob([contents],{type:"application/json"});
      const url=URL.createObjectURL(blob),anchor=document.createElement("a");
      anchor.href=url;anchor.download="musical-sense-backup-"+localDay()+".json";
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast("Backup preparado para download. Guarde-o em local seguro.");
    }catch(err){toast("Não foi possível exportar o backup.")}
    return;
  }
  if(action==="diagnose-copy"){try{await navigator.clipboard.writeText(diagnosticReport());toast("Diagnóstico copiado.");}catch(e){toast("Não foi possível copiar. Verifique as permissões da área de transferência.")}return}
  if(action==="diagnose-reload"){audio.stop();stopTimers();window.location.reload();return}
  if(action==="lyrics-import"){editingSongId=null;changePage("lyrics-import");return}
  if(action==="singing-leave"){changePage("singing");return}
  if(action==="vocal-mic"){await enableMic();return}
  if(action==="vocal-toggle"){await toggleVocal();return}
  if(action==="vocal-restart"){await restartVocal();return}
  if(action==="vocal-demo"){await vocalDemo();return}
  if(action==="vocal-repeat"){if(vocal)await beginVocal(vocal.song.id,{bpmOverride:vocal.bpm,transpose:vocal.transpose});return}
  if(action==="personal-toggle"){togglePersonal();return}
  if(action==="personal-restart"){restartPersonal();return}
  if(action==="personal-finish"){finishPersonal();return}
  if(action==="performance-toggle"){await togglePerformance();return}
  if(action==="performance-reset"){resetPerformance();return}
  if(action==="midi"){await connectMidi();return}
  if(action==="demo"){await hearDemo();return}
  if(action==="hear-note"){await hearSingleNote();return}
  if(action==="tempo"){if(session?.mode==="performance"&&["running","countin"].includes(session.performance.phase)){toast("Pause antes de mudar a velocidade.");return}bpm=bpm===60?80:bpm===80?100:60;if(session?.mode==="performance"){resetPerformance();return}if(metronome){await player.metronome(bpm)}render();return}
  if(action==="hint"){session.showHint=!session.showHint;session.coach=session.showHint?"Dica: procure a tecla destacada em lilás.":"";render();return}
  if(action==="restart"){await startLesson(session.lesson.id,true,{mode:session.mode,range:session.sectionRange,reset:true});return}
  if(action==="metronome"){await toggleMetro();return}
  if(action==="leave"){changePage("courses");return}
  if(action==="repeat"){await startLesson(session.lesson.id,true,{mode:session.mode,range:session.sectionRange});return}
  if(action==="difficult"){const range=session.result?.performance?.difficultRange;if(range)await startLesson(session.lesson.id,true,{mode:"performance",range:session.sectionRange?{start:session.sectionRange.start+range.start,end:session.sectionRange.start+range.end}:range});return}
  if(action==="next"){const lessons=currentLessons(),idx=lessons.findIndex(l=>l.id===session.lesson.id),next=lessons[idx+1];if(next)await startLesson(next.id);else changePage("courses");return}
});
document.addEventListener("submit",e=>{
  if(e.target.id==="lyrics-form"){
    e.preventDefault();const form=new FormData(e.target);
    try{
      const u=active(),list=u.personalLyrics||[],id=String(form.get("editingId")||"").trim();
      const index=id?list.findIndex(s=>s.id===id):-1;
      if(id&&index<0)throw Error("A letra original não foi encontrada para edição.");
      if(index<0&&list.length>=30)throw Error("Limite de 30 letras por perfil neste aparelho.");
      const song=createPersonalSong({title:form.get("title"),artist:form.get("artist"),lyrics:form.get("lyrics"),rightsConfirmed:form.get("rights")==="on"});
      if(index>=0){song.id=list[index].id;song.createdAt=list[index].createdAt}
      const previous=[...list];u.personalLyrics=list;
      if(index>=0)list[index]=song;else list.push(song);
      if(!save()){u.personalLyrics=previous;throw Error("Não foi possível salvar. Libere espaço ou habilite o armazenamento local.");}
      editingSongId=null;changePage("singing");toast(index>=0?"Letra atualizada no perfil "+u.name+".":"Letra salva no perfil "+u.name+".");
    }catch(err){toast(err.message||"Confira os campos da letra.");}
    return;
  }
  if(e.target.id!=="profile-form")return;
  e.preventDefault();
  const fd=new FormData(e.target),name=String(fd.get("name")||"").trim(),instrument=String(fd.get("instrument")||"Piano");
  if(!name){toast("Digite o nome do aluno.");return}
  if(db.users.length>=5){toast("O plano familiar permite até cinco perfis neste dispositivo.");return}
  const u=initialUser(name,instrument);db.users.push(u);db.active=u.id;save();changePage("home");toast("Perfil criado. Bons estudos!");
});
document.addEventListener("change",async e=>{
  if(e.target.id==="catalog-difficulty"){catalogDifficulty=e.target.value;render();return}
  if(e.target.id==="backup-file"){
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>2000000){toast("O backup deve ter no máximo 2 MB.");return}
    try{
      const restored=parseBackup(await file.text());
      if(!window.confirm("Restaurar "+restored.users.length+" perfil(is)? Isso substituirá o progresso e as letras pessoais atuais neste dispositivo."))return;
      const previous=db;db=restored;
      if(!save()){db=previous;throw Error("O armazenamento local não permitiu restaurar este backup.");}
      changePage("profiles");toast("Backup restaurado com sucesso.");
    }catch(err){toast(err.message||"Falha ao restaurar backup.");}
    return;
  }
  if(e.target.id!=="lyrics-file")return;
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>30000){toast("O arquivo deve ter até 30 KB.");return}
  if(!/\.(lrc|txt)$/i.test(file.name)){toast("Selecione um arquivo .lrc ou .txt.");return}
  try{
    const content=await file.text();
    const area=$("#lyrics-content");if(area)area.value=content;
    const title=$("#lyric-title");if(title&&!title.value)title.value=file.name.replace(/\.(lrc|txt)$/i,"").replace(/[_-]/g," ").slice(0,100);
    toast("Arquivo carregado. Confira a letra e a autorização de uso.");
  }catch(err){toast("Não foi possível abrir o arquivo de texto.")}
});
document.addEventListener("change",e=>{
  if(!vocal||page!=="vocal-practice")return;
  const id=e.target.id;
  if(id!=="vocal-bpm"&&id!=="vocal-register")return;
  if(["running","countin"].includes(vocal.phase)){toast("Pause para alterar os ajustes.");render();return}
  const bpmValue=id==="vocal-bpm"?Number(e.target.value):vocal.bpm;
  const registerValue=id==="vocal-register"?Number(e.target.value):vocal.transpose;
  const song=vocal.song;
  vocal=new SingingSession(song,{bpm:bpmValue,transpose:registerValue,latencyMs:db.vocalLatency??130});
  vocal.sessionId="vocal-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  if(singingRAF)cancelAnimationFrame(singingRAF);singingRAF=0;
  render();toast("Ajuste aplicado. Reinicie a música.");
});
document.addEventListener("input",e=>{
  if(e.target.id==="catalog-query"){
    catalogQuery=String(e.target.value||"");
    const entries=fullCatalog(),settings={query:catalogQuery,scope:catalogScope,difficulty:catalogDifficulty,
      favorites:active().favorites||[],instrument:active().instrument};
    const container=$("#catalog-results"),counter=$("#catalog-count");
    if(container)container.innerHTML=catalogResultsMarkup(entries,settings);
    if(counter)counter.textContent=catalogFilter(entries,settings).length+" opções";
    return;
  }
  if(!session)return;if(e.target.id==="sensitivity"){session.sensitivity=Number(e.target.value);audio.setSensitivity(session.sensitivity/100)}if(e.target.id==="latency"&&session.performance){session.performance.setLatency(e.target.value);db.perfLatency=session.performance.latencyMs;save();const label=$("#latency-value");if(label)label.textContent=session.performance.latencyMs+" ms"}});
document.addEventListener("visibilitychange",()=>{if(document.hidden){
  if(session?.performance&&["running","countin"].includes(session.performance.phase))session.performance.pause(performance.now());
  if(vocal&&["running","countin"].includes(vocal.phase))vocal.pause(performance.now());
  if(personalSession?.playing){personalSession.elapsedMs=personalSession.baseElapsed+performance.now()-personalSession.startedAt;personalSession.baseElapsed=personalSession.elapsedMs;personalSession.playing=false}
  if(performanceRAF)cancelAnimationFrame(performanceRAF);performanceRAF=0;
  if(singingRAF)cancelAnimationFrame(singingRAF);singingRAF=0;
  if(audio.listening)audio.stop();player.stop();metronome=false;
  if(["practice","vocal-practice","personal-practice"].includes(page)){audioError="";audioStatus="off";render()}
}});
window.addEventListener("pagehide",()=>{audio.stop();audio.disconnectMidi();stopTimers()});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
render();
