/**
 * Início enxuto: foco em uma ação e um exemplo do instrumento ativo.
 * Atividades secundárias ficam em grupos expansíveis nativos.
 */
const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>Math.max(0,Math.floor(Number(v)||0));
const shortcut=(route,icon,title,description)=>'<button class="home-shortcut" data-route="'+e(route)+'">'+
 '<span class="home-shortcut-icon" aria-hidden="true">'+icon+'</span>'+
 '<span><strong>'+e(title)+'</strong><small>'+e(description)+'</small></span><span class="home-shortcut-arrow" aria-hidden="true">›</span></button>';
export function homeDashboard({instrument,level,completed=0,total=0,streak=0,xp=0,nextLesson=null,nextVocal=null,recommendation=null}){
 const voice=instrument.id==="voice",next=voice?nextVocal:nextLesson;
 const nextLabel=next?.title||"Escolha uma aula";
 const nextAction=next?(voice?'data-vocal="'+e(next.id)+'"':'data-lesson="'+e(next.id)+'"'):'data-route="instruments"';
 const nextButton=next?"Começar agora":"Escolher instrumento";
 const description=voice?"Aqueça sua voz, experimente canções e acompanhe sua afinação.":
  instrument.group==="strings"?"Treine notas reais na corda do seu "+instrument.name.toLowerCase()+", uma etapa por vez.":
  "Aprenda a reconhecer notas e tocar melodias no seu "+instrument.name.toLowerCase()+".";
 const completedText=voice?"Canções e vocalizes concluídos":"Aulas concluídas";
 const recommendationAction=recommendation?(recommendation.kind==="vocal"?
  'data-vocal="'+e(recommendation.vocalId)+'"':'data-open-song="'+e(recommendation.id)+'"'):"";
 return '<main class="home-focus"><header class="home-welcome"><div class="home-welcome-top">'+
 '<span class="home-instrument-icon" aria-hidden="true">'+e(instrument.icon)+'</span>'+
 '<div class="home-welcome-name"><span class="home-eyebrow">SEU INSTRUMENTO ATUAL</span><strong>'+e(instrument.name)+'</strong></div>'+
 '<button class="home-switch-instrument" data-route="instruments">Trocar instrumento <span aria-hidden="true">⌄</span></button></div>'+
 '<h1>'+(voice?"Sua voz merece ser ouvida.":"Vamos fazer música com "+e(instrument.name.toLowerCase())+"?")+'</h1>'+
 '<p>'+e(description)+'</p><div class="home-next"><span class="home-eyebrow">SEU PRÓXIMO PASSO</span>'+
 '<strong>'+e(nextLabel)+'</strong><span class="home-next-description">'+e(next?.subtitle||next?.description||"Escolha por onde começar.")+'</span>'+
 '<button class="btn home-main-cta" '+nextAction+'>▶ '+nextButton+'</button></div>'+
 '<div class="home-welcome-progress"><span>⭐ Nível '+n(level.level)+'</span><span>'+n(completed)+'/'+n(total)+' '+completedText+'</span></div>'+
 '<div class="home-progress-track"><div style="width:'+(total?Math.min(100,Math.round(100*completed/total)):0)+'%"></div></div></header>'+
 '<section class="home-recommend"><div class="home-section-heading"><div><span class="home-eyebrow">EXPERIMENTE UMA MÚSICA</span>'+
 '<h2>Para '+e(instrument.name.toLowerCase())+'</h2></div><button class="home-text-link" data-route="library">Ver todas ›</button></div>'+
 (recommendation?'<div class="home-music-card"><span class="home-music-art" aria-hidden="true">'+e(recommendation.cover)+'</span>'+
 '<div class="home-music-copy"><strong>'+e(recommendation.title)+'</strong><small>'+e(recommendation.artist)+' · '+e(recommendation.level)+'</small></div>'+
 '<button class="btn sm home-music-action" '+recommendationAction+'>'+(voice?"Cantar":"Ouvir e tocar")+' ›</button></div>':
 '<div class="home-music-empty">As músicas deste instrumento aparecem aqui quando disponíveis. <button class="home-text-link" data-route="library">Explorar biblioteca</button></div>')+'</section>'+
 '<div class="home-groups"><details class="home-group"><summary><span class="home-group-icon">🎯</span><span><strong>Mais atividades</strong><small>Treinos, trilha e outras modalidades</small></span><span class="home-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="home-group-body">'+shortcut("courses","🧭","Minha trilha","Todas as aulas do seu instrumento")+
 shortcut(voice?"singing":"workouts",voice?"🎤":"⏱","Treinos rápidos",voice?"Aquecimento e repertório vocal":"Sessões curtas para praticar")+
 shortcut("library","🎵","Biblioteca musical","Músicas e exercícios por nível")+
 (!voice?shortcut("singing","🎤","Explorar canto","Outra modalidade, sem mudar seu instrumento"):"")+
 '</div></details><details class="home-group"><summary><span class="home-group-icon">⭐</span>'+
 '<span><strong>Meu progresso e ajustes</strong><small>XP, conquistas e som do aplicativo</small></span><span class="home-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="home-group-body"><div class="home-mini-metrics"><span>⚡ '+n(xp)+' XP</span><span>🔥 '+n(streak)+' dias</span></div>'+
 shortcut("progress","📈","Minha evolução","Aulas e atividade recente")+
 shortcut("achievements","🏆","Conquistas","Missões e medalhas")+
 shortcut("sound","🔊","Som do instrumento","Volume e timbre de demonstração")+
 shortcut("profiles","👤","Meu perfil","Instrumentos, favoritos e família")+
 '</div></details></div></main>';
}
