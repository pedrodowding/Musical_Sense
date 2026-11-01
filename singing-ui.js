const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct=(a,b)=>b?Math.round(a/b*100):0;
export function renderSingingHome(catalog,personal,completed){
 return '<div class="page-intro"><span class="eyebrow">CANTO E AFINAÇÃO</span><h1>Solte a voz, conquiste cada nota 🎤</h1><p>Cante com o microfone do iPad. Acompanhe letras, ritmo e afinação de canções originais. Você não precisa de um instrumento.</p></div>'+
 '<section class="card vocal-intro"><div><span class="pill">✨ NOVA EXPERIÊNCIA</span><h2 style="margin:13px 0 5px">Seu professor de canto, passo a passo</h2><p class="muted">Faça aquecimentos, cante a melodia e acompanhe sua evolução. A avaliação mede a afinação, não o reconhecimento das palavras.</p><button class="btn" data-vocal="voice-warmup">🎙 Começar aquecimento</button></div><span class="vocal-intro-art" aria-hidden="true">🎤</span></section>'+
 '<div class="section-head"><h2>Canções para cantar</h2><span class="pill green">Letras originais</span></div>'+
 '<div class="grid three">'+catalog.map(song=>{
 const done=completed?.[song.id],progress=done?"✓ Concluída":"Pronta para começar";
 return '<article class="course-card vocal-song"><div class="vocal-cover"><span>'+song.icon+'</span></div><div class="course-inner"><span class="eyebrow">'+e(song.genre)+' · '+song.bpm+' BPM</span><h3>'+e(song.title)+'</h3><p>'+e(song.description)+'</p><div class="course-foot"><span>'+e(progress)+'</span><button class="btn sm" data-vocal="'+e(song.id)+'">Cantar →</button></div></div></article>';
 }).join("")+'</div>'+
 '<div class="section-head"><h2>Minhas letras</h2><button class="btn sm ghost" data-action="lyrics-import">+ Adicionar letra</button></div>'+
 '<div class="card"><p class="muted small">Salve letras que você possui ou tem autorização para utilizar. Aceitamos letras com marcação LRC ou texto simples. Elas ficam neste dispositivo. Sem melodia de referência, o aplicativo acompanha o texto e sua voz, mas não calcula a precisão da afinação.</p>'+
 (personal.length?personal.map(song=>'<div class="song-row"><span class="song-cover">📝</span><div class="grow"><h3>'+e(song.title)+'</h3><p>'+e(song.artist)+' · '+(song.timed?"LRC sincronizado":"Texto com duração aproximada")+'</p></div><button class="btn sm" data-personal="'+e(song.id)+'">Praticar</button><button class="btn sm outline" data-edit-personal="'+e(song.id)+'">Editar</button><button class="btn sm outline" data-remove-personal="'+e(song.id)+'" aria-label="Remover '+e(song.title)+'">✕</button></div>').join(""):'<div class="blank">Você ainda não adicionou letras. Comece com um exercício de canto ou cadastre uma letra autorizada.</div>')+
 '<button class="btn ghost" data-action="lyrics-import">Adicionar letra minha →</button></div>';
}
export function renderImportLyrics(song=null){
 const editing=Boolean(song),content=song?song.lines.map(line=>{
  if(!song.timed)return line.text;
  const m=Math.floor(line.atMs/60000),sec=Math.floor(line.atMs%60000/1000),cent=Math.floor(line.atMs%1000/10);
  return "["+String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")+"."+String(cent).padStart(2,"0")+"]"+line.text;
 }).join("\n"):"";
 return '<div class="page-intro"><button class="link-action" data-route="singing">← Voltar para Cantar</button><h1>'+(editing?"Editar letra":"Adicionar letra à biblioteca")+'</h1><p>Para usar suas próprias músicas no treino vocal. O conteúdo fica salvo apenas neste navegador.</p></div>'+
 '<div class="card" style="max-width:780px"><form id="lyrics-form"><input type="hidden" name="editingId" value="'+e(song?.id||"")+'"><label class="form-field" for="lyric-title">Título da música</label><input class="form-input" id="lyric-title" name="title" maxlength="100" required placeholder="Nome da canção" value="'+e(song?.title||"")+'">'+
 '<label class="form-field" for="lyric-artist">Artista / compositor</label><input class="form-input" id="lyric-artist" name="artist" maxlength="100" value="'+e(song?.artist||"")+'" placeholder="Nome do autor ou artista">'+
 '<label class="form-field" for="lyrics-file">Importar arquivo .lrc ou .txt do dispositivo</label><input class="form-input" type="file" id="lyrics-file" accept=".lrc,.txt,text/plain" aria-label="Selecionar arquivo de letra"><label class="form-field" for="lyrics-content">Letra da canção (TXT ou LRC)</label><textarea class="form-input lyrics-textarea" id="lyrics-content" name="lyrics" maxlength="20000" required placeholder="[00:00.00]Primeira linha da letra&#10;[00:04.00]Segunda linha da letra&#10;[00:08.00]Terceira linha...">'+e(content)+'</textarea>'+
 '<p class="small muted">LRC: use <code>[00:12.50]Frase cantada</code>. Texto simples também funciona, com linhas exibidas a cada 3,5 segundos. Sem a melodia original, não há avaliação de afinação.</p>'+
 '<label class="rights-check"><input type="checkbox" name="rights" '+(editing?"checked":"")+' required><span>Confirmo que tenho os direitos ou autorização para armazenar e usar esta letra. Não vou cadastrar conteúdo de terceiros sem permissão.</span></label>'+
 '<div class="row wrap"><button class="btn" type="submit">'+(editing?"Salvar alterações":"Salvar letra localmente")+'</button><button class="btn outline" type="button" data-route="singing">Cancelar</button></div></form></div>';
}
function vocalPitches(s,noteName){
 const steps=s.song.steps,idx=Math.min(s.index,steps.length-1),from=Math.max(0,idx-2),to=Math.min(steps.length,idx+7);
 return '<div class="vocal-note-ribbon">'+steps.slice(from,to).map((step,j)=>{
 const i=from+j,prev=s.events[i],active=i===idx;
 return '<span class="vocal-note '+(active?"active":prev?.status||"")+'"><span>'+e(noteName(step.m+s.transpose))+'</span><small>'+e(step.syllable)+'</small></span>';
 }).join("")+'</div>';
}
export function renderVocalPractice(s,noteName,micState,frame){
 const song=s.song,index=Math.min(s.index,song.steps.length-1),step=song.steps[index],phraseIndex=s.currentPhrase();
 const rows=song.phrases.map((phrase,i)=>{
  const current=i===phraseIndex;
  return '<p class="karaoke-line '+(current?"active":i<phraseIndex?"done":"")+'">'+e(phrase.text)+'</p>';
 }).join("");
 const playLabel=s.phase==="ready"?"▶ Começar a cantar":s.phase==="paused"?"▶ Continuar":s.phase==="running"||s.phase==="countin"?"Ⅱ Pausar":"↻ Tentar outra vez";
 const heard=frame?.note===null||!frame?"Aguardando voz":noteName(frame.note);
 return '<div class="vocal-screen"><header class="lesson-top"><button class="lesson-back" data-action="singing-leave" aria-label="Sair da aula de canto">✕</button><div class="lesson-title"><strong>'+e(song.title)+'</strong><span>🎤 Canto · '+song.bpm+' BPM original</span></div><div class="lesson-progress"><div class="progress-track"><div class="progress-fill" style="width:'+pct(s.index,song.steps.length)+'%"></div></div></div><span class="pill">'+(s.index+1)+'/'+song.steps.length+'</span></header>'+
 '<main class="vocal-main"><div class="vocal-head"><span class="eyebrow">SUA AULA DE CANTO</span><h1>Acompanhe a letra e encontre o tom</h1><p>Escute os quatro pulsos e cante cada sílaba na nota indicada.</p></div>'+
 '<section class="vocal-karaoke"><div class="vocal-karaoke-top"><span>♫ '+e(song.title)+'</span><span>♪ '+s.bpm+' BPM</span></div><div class="vocal-lyrics" id="vocal-lyrics">'+rows+'</div>'+
 '<div class="vocal-live-word">Agora: <strong id="vocal-syllable">'+e(step.syllable)+'</strong> <span id="vocal-countdown">'+(s.phase==="countin"?"Prepare-se: "+s.countdown(performance.now()):"")+'</span></div>'+
 vocalPitches(s,noteName)+'</section>'+
 '<div class="grid two vocal-bottom"><section class="card"><div class="row between"><h3>🎙 Sua voz</h3><span class="pill '+(micState==="listening"?"green":"orange")+'">'+(micState==="listening"?"Microfone ativo":"Microfone desligado")+'</span></div><div class="vocal-meter"><div id="vocal-meter" style="width:0"></div></div>'+
 '<div class="vocal-readings"><div><b id="vocal-heard">'+e(heard)+'</b><span>Nota cantada</span></div><div><b id="vocal-target">'+e(noteName(step.m+s.transpose))+'</b><span>Nota esperada</span></div><div><b id="vocal-cents">—</b><span>Desvio</span></div></div>'+
 '<button class="btn '+(micState==="listening"?"ghost":"")+' sm" data-action="vocal-mic">'+(micState==="listening"?"Desligar microfone":"🎙 Ativar microfone")+'</button></section>'+
 '<section class="card"><h3>💡 Orientação</h3><p id="vocal-coach" class="muted small">'+e(s.lastFeedback)+'</p><div class="vocal-options"><label>Velocidade<select class="form-input" id="vocal-bpm" '+(["running","countin"].includes(s.phase)?"disabled":"")+'>'+[60,72,80,90,100].map(n=>'<option value="'+n+'" '+(s.bpm===n?"selected":"")+'>'+n+' BPM</option>').join("")+'</select></label><label>Registro vocal<select class="form-input" id="vocal-register" '+(["running","countin"].includes(s.phase)?"disabled":"")+'><option value="-12" '+(s.transpose===-12?"selected":"")+'>Uma oitava abaixo</option><option value="0" '+(s.transpose===0?"selected":"")+'>Original</option><option value="12" '+(s.transpose===12?"selected":"")+'>Uma oitava acima</option></select></label></div></section></div>'+
 '<div class="vocal-controls"><button class="btn" data-action="vocal-toggle">'+playLabel+'</button><button class="btn ghost" data-action="vocal-demo">♫ Ouvir melodia</button><button class="btn outline" data-action="vocal-restart">↻ Reiniciar</button></div>'+
 '<p class="inline-tip">A análise avalia a frequência da voz e seu alinhamento com a melodia. Ela não reconhece nem certifica que você pronunciou cada palavra. Use fones para que a voz-guia não seja captada pelo microfone.</p></main></div>';
}
export function renderVocalResult(summary,xp,level,awards=[]){
 const success=summary.accuracy>=60;
 return '<div class="result-wrap"><section class="result-card"><div class="result-icon">'+(success?"🎤":"🎯")+'</div><span class="pill '+(success?"green":"orange")+'">TREINO VOCAL FINALIZADO</span><h1>'+(success?"Sua voz ganhou espaço!":"Continue soltando a voz!")+'</h1><p>Você praticou afinação acompanhando a melodia original.</p><div class="result-stats"><div class="result-stat"><strong>'+summary.accuracy+'%</strong><span>Notas afinadas</span></div><div class="result-stat"><strong>'+summary.intonation+'%</strong><span>Qualidade vocal estimada</span></div><div class="result-stat"><strong>+'+xp+'</strong><span>XP conquistados</span></div></div><div class="vocal-result-stats">⭐ '+summary.perfect+' excelente(s) · '+summary.good+' boa(s) · '+summary.wrong+' fora de tom · '+summary.missed+' sem voz</div>'+
 (awards.length?'<p class="success-text">🏅 Novas conquistas: '+awards.map(e).join(", ")+'</p>':"")+
 '<p class="inline-tip">Pontuação baseada em frequência e duração das notas detectadas, não na letra cantada. Não substitui a avaliação de um professor de canto.</p><div class="row wrap" style="justify-content:center;margin-top:18px"><button class="btn ghost" data-action="vocal-repeat">↻ Cantar novamente</button><button class="btn" data-route="singing">Ver outras músicas →</button></div></section></div>';
}
export function renderPersonalPractice(song,state,frame,noteName){
 const elapsed=state.elapsedMs||0,idx=Math.max(0,song.lines.findLastIndex(l=>l.atMs<=elapsed)),active=song.lines[idx]||song.lines[0],next=song.lines[idx+1];
 return '<div class="vocal-screen"><header class="lesson-top"><button class="lesson-back" data-action="singing-leave">✕</button><div class="lesson-title"><strong>'+e(song.title)+'</strong><span>Letra pessoal · '+(song.timed?"LRC":"TXT")+'</span></div></header><main class="vocal-main">'+
 '<div class="vocal-head"><span class="eyebrow">BIBLIOTECA PESSOAL</span><h1>Cante com sua própria letra</h1><p>As linhas avançam por marcação LRC ou temporização aproximada. Não temos a melodia nem o áudio original desta música.</p></div>'+
 '<section class="vocal-karaoke"><div class="vocal-karaoke-top"><span>'+e(song.artist)+'</span><span id="personal-timer">'+Math.floor(elapsed/1000)+'s</span></div><div class="vocal-lyrics" id="personal-lyrics">'+
 (idx>0?'<p class="karaoke-line done">'+e(song.lines[idx-1].text)+'</p>':"")+
 '<p class="karaoke-line active">'+e(active.text)+'</p>'+(next?'<p class="karaoke-line">'+e(next.text)+'</p>':"")+'</div></section>'+
 '<div class="grid two vocal-bottom"><div class="card"><h3>🎙 Monitor de voz</h3><div class="vocal-meter"><div id="vocal-meter"></div></div><p class="muted">Nota detectada: <b id="vocal-heard">'+(frame?.note==null?"—":e(noteName(frame.note)))+'</b></p><p class="small muted">Tempo de voz captada: <b id="personal-voice">'+Math.floor(state.voicedMs/1000)+'s</b></p></div>'+
 '<div class="card"><h3>📝 Sobre este modo</h3><p class="small muted">A letra é exibida conforme seu próprio tempo. Sem melodia-alvo, não calculamos afinação correta, nem reconhecemos as palavras.</p><button class="btn sm ghost" data-action="vocal-mic">🎙 '+(state.micActive?"Desligar":"Ativar")+' microfone</button></div></div>'+
 '<div class="vocal-controls"><button class="btn" data-action="personal-toggle">'+(state.playing?"Ⅱ Pausar":"▶ "+(state.elapsedMs?"Continuar":"Começar"))+'</button><button class="btn outline" data-action="personal-restart">↻ Reiniciar</button><button class="btn outline" data-action="personal-finish">Concluir prática</button></div></main></div>';
}
export function renderAchievements(user,game){
 const info=game.levelInfo(user.xp),streak=game.streakInfo(user),missions=game.missionState(user);
 return '<div class="page-intro"><span class="eyebrow">SUAS CONQUISTAS</span><h1>Seu crescimento musical 🏆</h1><p>Acompanhe níveis, hábitos e conquistas conquistadas por você.</p></div>'+
 '<div class="grid three">'+
 '<div class="card stat"><span class="stat-icon purple">⚡</span><div><b>Nível '+info.level+'</b><span>'+info.xp+' XP acumulados</span></div></div>'+
 '<div class="card stat"><span class="stat-icon">🔥</span><div><b>'+streak.current+' dia(s)</b><span>Sequência atual</span></div></div>'+
 '<div class="card stat"><span class="stat-icon green">🏆</span><div><b>'+Object.keys(user.game.badges).length+' medalhas</b><span>Conquistas desbloqueadas</span></div></div></div>'+
 '<section class="card" style="margin-top:17px"><div class="row between"><h2 style="margin:0">Progresso para o nível '+(info.level+1)+'</h2><span class="pill">'+info.progress+'%</span></div><div class="progress-track" style="margin:18px 0 10px"><div class="progress-fill" style="width:'+info.progress+'%"></div></div><p class="small muted">'+(info.to-info.xp)+' XP restantes para o próximo nível.</p></section>'+
 '<div class="section-head"><h2>Missões do dia</h2><span class="pill">Reiniciam diariamente</span></div><div class="grid two">'+missions.map(m=>'<div class="card mission-card"><div class="row between"><strong>'+m.icon+' '+e(m.name)+'</strong><span class="pill '+(m.done?"green":"")+'">+'+m.xp+' XP</span></div><div class="progress-track" style="margin:14px 0 8px"><div class="progress-fill" style="width:'+pct(m.current,m.goal)+'%"></div></div><span class="small muted">'+(m.key==="seconds"?Math.floor(m.current/60)+" de "+(m.goal/60)+" min":m.current+" de "+m.goal)+(m.done?" · Concluída ✓":"")+'</span></div>').join("")+'</div>'+
 '<div class="section-head"><h2>Medalhas</h2></div><div class="grid three">'+game.BADGES.map(b=>{const done=Boolean(user.game.badges[b.id]);return '<div class="card achievement '+(done?"earned":"locked")+'"><div class="achievement-icon">'+b.icon+'</div><h3>'+e(b.name)+'</h3><p class="small muted">'+e(b.description)+'</p><span class="pill '+(done?"green":"")+'">'+(done?"✓ Desbloqueada":"🔒 +"+b.xp+" XP")+'</span></div>'}).join("")+'</div>';
}
