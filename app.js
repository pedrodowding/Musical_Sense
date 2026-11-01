
import {LESSONS,COURSES,SONGS,noteName,noteShort,lessonById,getSessionNotes,initialUser} from "./music-data.js";
import {AudioEngine,SoundPlayer} from "./audio-engine.js";
import {PerformanceSession} from "./performance-engine.js";
import {performanceRollSvg,performancePanel,performanceResultExtra} from "./performance-view.js";
const DBKEY="musical-sense-v3",OLDKEY="musical-sense-v1";
const routes=[["home","⌂","Início"],["courses","▤","Cursos"],["library","♫","Músicas"],["workouts","◷","Treinos"],["profiles","♙","Perfis"]];
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
let performanceRAF=0,lastVisualTick=0;
const player=new SoundPlayer();
const audio=new AudioEngine(frame=>onFrame(frame),ev=>onNote(ev),(status,error)=>{audioStatus=status;if(error)audioError=error;updateAudioUI()});
const active=()=>db.users.find(u=>u.id===db.active)||db.users[0];
const save=()=>{try{localStorage.setItem(DBKEY,JSON.stringify(db))}catch{}};
function toast(message){const prev=$("#toast");if(prev)prev.remove();const node=document.createElement("div");node.id="toast";node.className="toast";node.textContent=message;document.body.appendChild(node);clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.remove(),3500)}
function navButton(item){const [id,icon,label]=item;return '<button class="nav-btn '+(page===id?"active":"")+'" data-route="'+id+'"><span class="i">'+icon+'</span><span>'+label+'</span></button>'}
function mobileButton(item){const [id,icon,label]=item;return '<button class="'+(page===id?"active":"")+'" data-route="'+id+'"><span class="icon">'+icon+'</span><span>'+label+'</span></button>'}
function shell(content){
  const u=active(),complete=Object.keys(u.completed||{}).length;
  return '<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">♫</span> Musical Sense</div><div class="side-caption">EXPLORAR</div>'+
  routes.map(navButton).join("")+'<div class="sidebar-spacer"></div><div class="sidebar-panel"><strong>🎯 Seu progresso</strong><p>'+complete+' aulas concluídas · '+u.xp+' XP</p><div class="progress-track" style="margin-top:12px"><div class="progress-fill" style="width:'+percent(complete,LESSONS.length)+'%"></div></div></div></aside>'+
  '<div class="main"><div class="content"><div class="topbar"><span class="eyebrow">APRENDA NO SEU TEMPO</span><div class="top-actions"><span class="bubble">⚡ '+u.xp+' XP</span><button class="profile-switch" data-route="profiles" title="Trocar perfil"><span class="avatar">'+esc(u.name.trim().charAt(0).toUpperCase())+'</span>'+esc(u.name.split(" ")[0])+' ▾</button></div></div>'+
  content+'</div></div></div><nav class="mobile-nav" aria-label="Navegação principal">'+routes.map(mobileButton).join("")+'</nav>';
}
function metric(label,value,icon,color){return '<div class="card stat"><span class="stat-icon '+color+'">'+icon+'</span><div><b>'+esc(value)+'</b><span>'+esc(label)+'</span></div></div>'}
function home(){
  const u=active(),complete=Object.keys(u.completed||{}).length,next=LESSONS.find(l=>!u.completed[l.id])||LESSONS[0],accuracy=percent(u.totalCorrect,u.totalAttempts);
  let out='<div class="hero"><div class="hero-copy"><span class="pill dark">✨ SUA JORNADA MUSICAL</span><h1>Seu talento começa com uma nota.</h1><p>Toque no seu piano ou teclado. O Musical Sense escuta e guia você em cada conquista.</p><button class="btn white" data-lesson="'+next.id+'">▶ '+(complete?"Continuar aprendendo":"Começar minha primeira aula")+'</button></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit"></div><span class="big-note">♫</span><span class="spark">✦</span></div></div>';
  out+='<div class="grid three" style="margin-top:16px">'+metric("XP conquistados",u.xp,"⚡","purple")+metric("Aulas concluídas",complete,"🏆","green")+metric("Notas corretas",u.totalCorrect,"🎯","")+'</div>';
  out+='<div class="section-head"><h2>Continue sua jornada</h2><button class="link-action" data-route="courses">Ver todas as aulas →</button></div>';
  out+='<div class="lesson-row"><div class="lesson-icon">'+next.icon+'</div><div class="grow"><span class="eyebrow">'+(complete?"PRÓXIMA ETAPA":"COMECE AQUI")+'</span><h3>'+esc(next.title)+'</h3><p>'+esc(next.subtitle)+'</p><div class="lesson-foot"><span>⏱ '+next.minutes+' min</span><span>⚡ '+next.xp+' XP</span></div></div><button class="btn lesson-action" data-lesson="'+next.id+'">Aprender →</button></div>';
  out+='<div class="section-head"><h2>Explore seu universo musical</h2></div><div class="grid three">'+COURSES.map(courseCard).join("")+'</div>';
  out+='<div class="grid two" style="margin-top:17px"><div class="card workout"><div class="workout-deco" aria-hidden="true">♫</div><span class="pill dark">5 MINUTOS</span><h2 style="margin:14px 0 8px">Um treino rápido faz a diferença</h2><p>Exercite seu ouvido e a coordenação com desafios curtos.</p><button class="btn white" data-route="workouts">Treinar agora →</button></div><div class="card"><span class="pill green">📈 SEU DESENVOLVIMENTO</span><h2 style="margin:14px 0 13px">Cada nota conta</h2><p class="muted small">Progresso nas aulas disponíveis</p><div class="progress-track"><div class="progress-fill" style="width:'+percent(complete,LESSONS.length)+'%"></div></div><div class="row between" style="margin-top:12px"><span class="small muted">'+complete+'/'+LESSONS.length+' aulas</span><span class="small strong">'+accuracy+'% de acertos registrados</span></div></div></div>';
  return out;
}
function courseCard(c){
  const total=LESSONS.filter(l=>l.course===c.id),done=total.filter(l=>active().completed[l.id]).length;
  return '<div class="course-card"><div class="course-art '+c.theme+'"><span class="course-badge">'+done+'/'+total.length+' aulas</span><span aria-hidden="true">'+c.icon+'</span></div><div class="course-inner"><h3>'+esc(c.name)+'</h3><p>'+esc(c.subtitle)+'</p><div class="progress-track" style="margin-bottom:14px"><div class="progress-fill" style="width:'+percent(done,total.length)+'%"></div></div><div class="course-foot"><span>'+percent(done,total.length)+'% concluído</span><button class="btn sm ghost" data-course="'+c.id+'">Explorar →</button></div></div></div>';
}
function lessonCard(l){
  const done=active().completed[l.id],colored=l.course==="solo"?"teal":l.course==="harmony"?"gold":"sky";
  return '<div class="lesson-row"><span class="lesson-icon '+colored+'">'+l.icon+'</span><div class="grow"><div class="row wrap" style="gap:8px"><h3>'+esc(l.title)+'</h3>'+(done?'<span class="pill green">✓ Concluída</span>':'')+'</div><p>'+esc(l.subtitle)+'</p><div class="lesson-foot"><span>⏱ '+l.minutes+' min</span><span>⚡ '+l.xp+' XP</span><span>Nível '+l.level+'</span></div></div><button class="btn sm '+(done?"ghost":"")+' lesson-action" data-lesson="'+l.id+'">'+(done?"Refazer ↻":"Começar →")+'</button></div>';
}
function courses(){
  const filters=[["all","Todas"],["fundamentals","Fundamentos"],["solo","Melodias"],["harmony","Harmonia"]];
  const items=LESSONS.filter(l=>courseFilter==="all"||l.course===courseFilter);
  return '<div class="page-intro"><span class="eyebrow">UMA NOTA POR VEZ</span><h1>Uma jornada feita para você 🎹</h1><p>De sua primeira nota até pequenas melodias, com aulas curtas e retorno ao tocar seu instrumento de verdade.</p></div>'+
  '<div class="grid three">'+COURSES.map(courseCard).join("")+'</div>'+
  '<div class="section-head"><h2>Explore as aulas</h2><span class="muted small">'+items.length+' disponíveis</span></div><div class="taglist">'+filters.map(([id,label])=>'<button class="chip '+(courseFilter===id?"active":"")+'" data-filter="'+id+'">'+label+'</button>').join("")+'</div><div class="lesson-list">'+items.map(lessonCard).join("")+'</div>';
}
function library(){
  const genres=["Todas","Clássicas","Tradicionais","Exercícios"],items=SONGS.filter(s=>songFilter==="Todas"||s.genre===songFilter);
  return '<div class="page-intro"><span class="eyebrow">BIBLIOTECA MUSICAL</span><h1>Aprenda tocando músicas</h1><p>Comece com melodias tradicionais, obras em domínio público e exercícios originais. O catálogo cresce conforme adicionamos conteúdos licenciados.</p></div>'+
  '<div class="card" style="background:linear-gradient(120deg,#e9e3ff,#dff8f3);margin-bottom:20px"><span class="pill">🎵 REPERTÓRIO INICIAL</span><h2 style="margin:12px 0 7px">Da primeira nota à primeira música</h2><p class="muted small" style="margin:0">Toque cada melodia com feedback pelo microfone, nota por nota.</p></div>'+
  '<div class="taglist">'+genres.map(g=>'<button class="chip '+(songFilter===g?"active":"")+'" data-genre="'+esc(g)+'">'+esc(g)+'</button>').join("")+'</div>'+
  items.map(s=>'<div class="song-row"><span class="song-cover">'+s.cover+'</span><div class="grow"><h3>'+esc(s.name)+'</h3><p>'+esc(s.artist)+' · '+esc(s.level)+'</p></div><button class="btn sm" data-lesson="'+s.id+'">Praticar ▶</button></div>').join("")+
  '<p class="inline-tip">Músicas comerciais populares não estão incluídas sem a licença correspondente. O áudio de demonstração é sintetizado a partir das próprias notas dos exercícios.</p>';
}
function workouts(){
  const u=active(),today=new Date().toLocaleDateString("en-CA"),sessionsToday=(u.history||[]).filter(h=>h.day===today),minToday=Math.round(sessionsToday.reduce((acc,h)=>acc+(h.seconds||0),0)/60);
  const options=[LESSONS[0],LESSONS[2],LESSONS.find(l=>l.id==="rhythm")];
  return '<div class="page-intro"><span class="eyebrow">PEQUENAS VITÓRIAS, TODOS OS DIAS</span><h1>Treinos de 5 minutos ⏱</h1><p>Exercícios objetivos para melhorar leitura, precisão e coordenação. Você não precisa terminar uma aula longa para evoluir.</p></div>'+
  '<div class="card workout"><span class="pill dark">DESAFIO DO DIA</span><h2 style="margin:14px 0 8px">Sua meta: 5 minutos de música</h2><p>'+Math.min(5,minToday)+' de 5 minutos de prática hoje</p><div class="progress-track" style="background:#5a5a89;max-width:440px"><div class="progress-fill" style="width:'+Math.min(100,percent(minToday,5))+'%"></div></div><p class="small" style="margin:10px 0 0">O tempo registra aulas concluídas neste dispositivo.</p></div>'+
  '<div class="section-head"><h2>Escolha um treino</h2></div><div class="lesson-list">'+options.map(lessonCard).join("")+'</div>';
}
function profiles(){
  const u=active();
  return '<div class="page-intro"><span class="eyebrow">UM ESPAÇO PARA CADA MÚSICO</span><h1>Perfis da família</h1><p>Compartilhem o aparelho sem misturar pontos, aulas e conquistas. Os dados ficam salvos apenas neste navegador.</p></div>'+
  '<div class="grid two"><section class="card"><h2>Escolha quem vai tocar</h2>'+db.users.map(p=>'<div class="profile-row '+(p.id===u.id?"active":"")+'"><span class="avatar">'+esc(p.name[0].toUpperCase())+'</span><div class="grow"><b>'+esc(p.name)+'</b><div class="muted small">'+esc(p.instrument)+' · '+(p.xp||0)+' XP</div></div><button class="btn sm '+(p.id===u.id?"ghost":"")+'" data-profile="'+esc(p.id)+'">'+(p.id===u.id?"✓ Ativo":"Entrar")+'</button></div>').join("")+'</section>'+
  '<section class="card"><h2>Adicionar músico</h2><form id="profile-form"><label class="form-field" for="profile-name">Nome</label><input class="form-input" id="profile-name" name="name" maxlength="30" required placeholder="Ex.: Ana"><label class="form-field" for="profile-instrument">Instrumento</label><select class="form-input" id="profile-instrument" name="instrument">'+["Piano","Teclado","Violão","Guitarra","Ukulele","Baixo"].map(v=>'<option>'+v+'</option>').join("")+'</select><button class="btn" type="submit">+ Criar perfil</button></form><p class="inline-tip">Nesta fase, as trilhas práticas estão preparadas para piano e teclado. Outros instrumentos terão conteúdos próprios em versões futuras.</p></section></div>'+
  '<div class="card" style="margin-top:18px"><h3>Seus números</h3><div class="grid three">'+metric("Experiência",u.xp+" XP","⚡","purple")+metric("Lições",Object.keys(u.completed||{}).length,"🏆","green")+metric("Precisão",percent(u.totalCorrect,u.totalAttempts)+"%","🎯","")+'</div></div>';
}
const degree=[0,0,1,1,2,3,3,4,4,5,5,6];
function diatonic(m){return Math.floor(m/12)*7+degree[((m%12)+12)%12]}
function noteY(m,bass){return 138-(diatonic(m)-(bass?diatonic(43):diatonic(64)))*8.5}
function scoreSvg(){
  const steps=session.steps,start=Math.floor(session.index/8)*8,windowSteps=steps.slice(start,start+8),bass=session.lesson.id==="bass";
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
  if(session.showHint)return "Dica ativada: procure a tecla lilás no teclado visual e toque-a no instrumento físico.";
  return session.index===0?"Acompanhe a partitura e toque a primeira nota.":"Ótimo! Agora encontre a próxima nota. Você está indo bem.";
}
function practice(){
  const s=session,l=s.lesson,total=s.steps.length,current=s.steps[s.index],progress=percent(s.index,total);
  return '<div class="lesson-screen"><header class="lesson-top"><button class="lesson-back" data-action="leave" aria-label="Fechar aula">✕</button><div class="lesson-title"><strong>'+esc(l.title)+'</strong><span>'+esc(l.subtitle)+'</span></div><div class="lesson-progress"><div class="progress-track"><div class="progress-fill" style="width:'+progress+'%"></div></div></div><div class="lesson-stats"><span class="pill">⚡ '+(s.hits*10)+' XP</span><span class="pill">'+(s.index+1)+'/'+total+'</span></div></header>'+
  '<div class="lesson-body"><div class="practice-modes" role="group" aria-label="Modo da aula"><button class="practice-mode '+(s.mode==="guided"?"active":"")+'" data-mode="guided">📖 Aprender sem pressa</button><button class="practice-mode '+(s.mode==="performance"?"active":"")+'" data-mode="performance">🎵 Tocar no ritmo</button></div>'+(s.mode==="performance"?performancePanel(s,noteName,bpm):"")+'<div class="instruction"><div><span class="difficulty">'+(s.mode==="performance"?"DESAFIO NO TEMPO":l.kind==="song"?"TOCANDO UMA MELODIA":"PRÁTICA GUIADA")+'</span><h1>Toque <span style="color:#6656e7">'+noteName(current.m)+'</span></h1><span class="muted">'+esc(s.sectionRange?"Treino focado nas notas "+(s.sectionRange.start+1)+" a "+s.sectionRange.end+".":l.tip)+'</span></div><button class="btn outline sm" data-action="demo" '+(demoBusy||s.mode==="performance"&&s.performance.phase!=="ready"?"disabled":"")+'>♫ Ouvir exemplo</button></div>'+
  '<section class="lesson-main"><div class="score-header"><strong>🎼 Sua partitura</strong><span>Nota '+(s.index+1)+' de '+total+'</span></div><div class="score-board">'+scoreSvg()+'</div><div class="keyboard-panel"><div class="keyboard-top"><strong>⌨ Onde tocar no piano</strong><span>'+((s.showHint)?"A tecla lilás mostra a dica":"Peça uma dica quando precisar")+'</span></div>'+piano()+'</div></section>'+
  '<div class="lesson-bottom"><section class="listen-panel"><div class="listen-top"><div class="listen-indicator"><span class="audio-dot '+(audioStatus==="listening"?"on":audioStatus==="permission"?"wait":"")+'" id="audio-dot"></span><div><div class="audio-status" id="audio-status">'+esc(audioText())+'</div><div class="audio-sub" id="audio-sub">'+(audioStatus==="listening"?"Toque uma nota por vez e sustente por um instante.":"O acesso será solicitado pelo navegador.")+'</div></div></div><div class="row"><button class="btn sm '+(audio.listening?"ghost":"")+'" data-action="microphone" id="mic-btn">'+(audio.listening?"Desligar":"🎙 Ativar microfone")+'</button></div></div>'+
  '<div class="level"><div id="input-level" style="width:0%"></div></div><div class="audio-readings"><span id="heard">Nota: aguardando</span><span id="frequency">0 Hz</span><span id="tuning">Afinação: —</span></div>'+
  '<div class="row wrap" style="margin-top:14px"><button class="btn outline sm" data-action="midi">🎹 '+(s.midiEnabled?"MIDI conectado":"Conectar MIDI")+'</button><label class="row small muted" for="sensitivity">Sensibilidade <input id="sensitivity" type="range" min="0" max="100" value="'+s.sensitivity+'" style="width:90px" aria-label="Sensibilidade do microfone"></label></div></section>'+
  '<section class="coaching-panel"><div class="coach-head"><span class="coach-emoji">💡</span> Seu professor virtual</div><div class="coach-message" id="coach-message">'+esc(coachMessage())+'</div><div class="coach-actions"><button class="btn sm ghost" data-action="hint">'+(s.showHint?"Ocultar dica":"🔍 Mostrar dica")+'</button><button class="btn sm outline" data-action="hear-note">♫ Ouvir nota</button><button class="btn sm outline" data-action="restart">↻ Reiniciar</button><button class="btn sm outline" data-action="tempo">⏱ '+bpm+' BPM</button>'+(s.mode==="performance"?"":'<button class="btn sm outline" data-action="metronome">'+(metronome?"◼ Parar pulso":"♪ Metrônomo")+'</button>')+'</div></section></div>'+
  '<footer class="lesson-footer"><span class="muted">🎙 Use um instrumento físico. O teclado na tela é apenas um guia visual.</span><span class="muted">Os acordes simultâneos ainda não são reconhecidos.</span><button class="btn dark sm" data-action="leave">Salvar e sair</button></footer></div></div>';
}
function result(){
  const r=session.result,stars="★".repeat(r.stars)+"☆".repeat(3-r.stars);
  return '<div class="result-wrap"><section class="result-card"><div class="result-icon">'+(r.passed?"🏆":"🎯")+'</div><span class="pill '+(r.passed?"green":"orange")+'">'+(r.passed?"AULA CONCLUÍDA":"TREINO CONCLUÍDO")+'</span><h1>'+(r.passed?"Você fez música!":"Você está evoluindo!")+'</h1><p>'+(r.passed?"Mais um passo para tocar cada vez melhor.":"Continue praticando para aumentar sua precisão.")+'</p><div class="result-stars" aria-label="'+r.stars+' de três estrelas">'+stars+'</div><div class="result-stats"><div class="result-stat"><strong>+'+r.xp+'</strong><span>XP conquistados</span></div><div class="result-stat"><strong>'+r.accuracy+'%</strong><span>Notas corretas</span></div><div class="result-stat"><strong>'+r.seconds+'s</strong><span>Tempo de aula</span></div></div>'+performanceResultExtra(r)+'<div class="row wrap" style="justify-content:center"><button class="btn ghost" data-action="repeat">↻ Praticar novamente</button>'+(r.performance&&r.performance.difficultRange?'<button class="btn ghost" data-action="difficult">🎯 Repetir trecho difícil</button>':"")+'<button class="btn" data-action="next">Próxima aula →</button></div></section></div>';
}
function render(){
  if(!db.users.some(u=>u.id===db.active))db.active=db.users[0].id;
  const content=page==="home"?home():page==="courses"?courses():page==="library"?library():page==="workouts"?workouts():profiles();
  $("#app").innerHTML=page==="practice"&&session?practice():page==="result"&&session?result():shell(content);
  document.title=(page==="practice"&&session?session.lesson.title+" | ":"")+"Musical Sense";
  updateAudioUI();
}
function stopTimers(){clearInterval(tipTimer);tipTimer=null;if(performanceRAF)cancelAnimationFrame(performanceRAF);performanceRAF=0;player.stop();metronome=false;demoBusy=false}
function changePage(next){
  if(page==="practice"||page==="result"){audio.stop();audio.disconnectMidi();stopTimers();session=null}
  page=next;render();window.scrollTo(0,0);
}
async function startLesson(id,requestMicrophone=true,options={}){
  stopTimers();audio.stop();audio.disconnectMidi();
  const lesson=lessonById(id),allSteps=getSessionNotes(lesson),range=options.range&&options.range.end>options.range.start?options.range:null,steps=range?allSteps.slice(range.start,range.end):allSteps,mode=options.mode==="performance"?"performance":"guided";
  session={lesson,steps,index:0,hits:0,misses:0,assisted:0,feedback:[],showHint:false,wrongFlashUntil:0,
    coach:"",stepStart:Date.now(),startedAt:Date.now(),lastCorrect:null,sensitivity:70,midiEnabled:false,result:null,mode,sectionRange:range,
    performance:mode==="performance"?new PerformanceSession(steps,{bpm,latencyMs:db.perfLatency??160}):null
  };
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
  if(m===target&&Math.abs(event.cents||0)<=45){
    const assisted=s.showHint;
    s.feedback[s.index]=assisted?"hint":"correct";s.hits++;if(assisted)s.assisted++;
    s.lastCorrect=m;s.index++;s.showHint=false;s.coach="✓ Muito bem! Próxima nota.";s.stepStart=Date.now();s.wrongFlashUntil=0;
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
  const s=session,u=active(),accuracy=percent(s.hits,s.hits+s.misses),stars=accuracy>=92&&s.assisted<=2?3:accuracy>=72?2:1;
  const seconds=Math.max(1,Math.round((Date.now()-s.startedAt)/1000));
  const xp=Math.max(15,Math.round(s.lesson.xp*(.5+.5*accuracy/100)*(s.assisted?0.85:1)));
  s.result={accuracy,stars,xp,seconds};
  u.xp=(u.xp||0)+xp;u.totalCorrect=(u.totalCorrect||0)+s.hits;u.totalAttempts=(u.totalAttempts||0)+s.hits+s.misses;u.practiceSeconds=(u.practiceSeconds||0)+seconds;
  u.completed=u.completed||{};const prior=u.completed[s.lesson.id];
  u.completed[s.lesson.id]={at:Date.now(),stars:Math.max(stars,prior?.stars||0)};
  u.history=u.history||[];u.history.push({id:s.lesson.id,day:new Date().toLocaleDateString("en-CA"),seconds,xp,accuracy});u.history=u.history.slice(-200);
  save();audio.stop();audio.disconnectMidi();stopTimers();page="result";render();
}
function updateAudioUI(){
  if(page!=="practice"||!session)return;
  const dot=$("#audio-dot");if(dot)dot.className="audio-dot "+(audioStatus==="listening"?"on":audioStatus==="permission"?"wait":"");
  const status=$("#audio-status");if(status)status.textContent=audioText();
  const mic=$("#mic-btn");if(mic)mic.textContent=audio.listening?"Desligar":"🎙 Ativar microfone";
  const coach=$("#coach-message");if(coach)coach.textContent=coachMessage();
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
  if(d.course){courseFilter=d.course;changePage("courses");return}
  if(d.filter){courseFilter=d.filter;render();return}
  if(d.genre){songFilter=d.genre;render();return}
  if(d.profile){db.active=d.profile;save();changePage("home");return}
  if(d.lesson){await startLesson(d.lesson);return}
  const action=d.action;
  if(!action)return;
  if(action==="microphone"){await enableMic();return}
  if(action==="midi"){await connectMidi();return}
  if(action==="demo"){await hearDemo();return}
  if(action==="hear-note"){await hearSingleNote();return}
  if(action==="tempo"){bpm=bpm===60?80:bpm===80?100:60;if(metronome){await player.metronome(bpm)}render();return}
  if(action==="hint"){session.showHint=!session.showHint;session.coach=session.showHint?"Dica: procure a tecla destacada em lilás.":"";render();return}
  if(action==="restart"){await startLesson(session.lesson.id,false);return}
  if(action==="metronome"){await toggleMetro();return}
  if(action==="leave"){changePage("courses");return}
  if(action==="repeat"){await startLesson(session.lesson.id);return}
  if(action==="next"){const idx=LESSONS.findIndex(l=>l.id===session.lesson.id);await startLesson(LESSONS[(idx+1)%LESSONS.length].id);return}
});
document.addEventListener("submit",e=>{
  if(e.target.id!=="profile-form")return;
  e.preventDefault();
  const fd=new FormData(e.target),name=String(fd.get("name")||"").trim(),instrument=String(fd.get("instrument")||"Piano");
  if(!name){toast("Digite o nome do aluno.");return}
  if(db.users.length>=8){toast("O limite desta versão é de oito perfis.");return}
  const u=initialUser(name,instrument);db.users.push(u);db.active=u.id;save();changePage("home");toast("Perfil criado. Bons estudos!");
});
document.addEventListener("input",e=>{if(e.target.id==="sensitivity"&&session){session.sensitivity=Number(e.target.value);audio.setSensitivity(session.sensitivity/100)}});
document.addEventListener("visibilitychange",()=>{if(document.hidden){if(audio.listening)audio.stop();player.stop();metronome=false;if(page==="practice"){audioError="";audioStatus="off";render()}}});
window.addEventListener("pagehide",()=>{audio.stop();audio.disconnectMidi();stopTimers()});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
render();
