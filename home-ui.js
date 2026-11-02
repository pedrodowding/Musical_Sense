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
 const nextButton=next?"▶ Começar agora":"Escolher instrumento";
 const credit=String(recommendation?.artist||"Musical Sense");
 const artist=credit.startsWith("Musical Sense")?"Musical Sense":credit;
 const recommendationAction=recommendation?(recommendation.kind==="vocal"?
  'data-vocal="'+e(recommendation.vocalId)+'"':'data-open-song="'+e(recommendation.id)+'"'):"";
 const progress=total?Math.min(100,Math.round(100*n(completed)/n(total))):0;
 return '<main class="home-focus">'+
 '<header class="home-welcome"><div class="home-welcome-top">'+
 '<span class="home-instrument-icon" aria-hidden="true">'+e(instrument.icon)+'</span>'+
 '<div class="home-welcome-name"><span class="home-eyebrow">SEU INSTRUMENTO ATUAL</span>'+
 '<strong>'+e(instrument.name)+'</strong></div>'+
 '<button class="home-switch-mini" data-route="instruments" aria-label="Trocar instrumento">Trocar ›</button></div>'+
 '<h1>'+(voice?"Sua voz é o instrumento.":"Vamos tocar hoje?")+'</h1>'+
 '<p>'+(voice?"Aqueça a voz e pratique uma canção por vez.":"Você está aprendendo "+e(instrument.name.toLowerCase())+". Seu próximo desafio está pronto.")+'</p>'+
 '<div class="home-next"><div class="home-next-title"><span class="home-eyebrow">PRÓXIMA AULA</span>'+
 '<strong>'+e(nextLabel)+'</strong><span class="home-next-description">'+e(next?.subtitle||next?.description||"Escolha por onde começar.")+'</span></div>'+
 '<button class="btn home-main-cta" '+nextAction+'>'+nextButton+'</button></div>'+
 '<div class="home-welcome-progress"><span>⭐ Nível '+n(level.level)+' · '+n(completed)+' de '+n(total)+' aulas concluídas</span>'+
 '<button class="home-progress-link" data-route="courses">Ver trilha ›</button></div>'+
 '<div class="home-progress-track" role="progressbar" aria-label="Aulas concluídas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+progress+'"><div style="width:'+progress+'%"></div></div></header>'+
 '<section class="home-recommend"><div class="home-section-heading"><div><span class="home-eyebrow">MÚSICA RECOMENDADA</span>'+
 '<h2>Para '+e(instrument.name.toLowerCase())+'</h2></div><button class="home-text-link" data-route="library">Ver todas ›</button></div>'+
 (recommendation?'<div class="home-music-card"><span class="home-music-art" aria-hidden="true">'+e(recommendation.cover)+'</span>'+
 '<div class="home-music-copy"><strong>'+e(recommendation.title)+'</strong><small>'+e(artist)+' · '+e(recommendation.level)+'</small></div>'+
 '<button class="btn sm home-music-action" '+recommendationAction+' aria-label="'+(voice?"Cantar":"Tocar")+' '+e(recommendation.title)+'">'+(voice?"Cantar":"Tocar")+' ›</button></div>':
 '<div class="home-music-empty">Ainda não há músicas para este instrumento. <button class="home-text-link" data-route="library">Explorar biblioteca</button></div>')+'</section>'+
 '<div class="home-groups"><details class="home-group"><summary><span class="home-group-icon">🎯</span><span>'+
 '<strong>Mais atividades</strong><small>Treinos, biblioteca e canto</small></span><span class="home-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="home-group-body">'+shortcut("courses","🧭","Minha trilha","Continue suas aulas")+
 shortcut(voice?"singing":"workouts",voice?"🎤":"⏱","Treinos rápidos",voice?"Aquecimento e repertório":"Pratique alguns minutos")+
 shortcut("library","🎵","Biblioteca musical","Músicas para aprender")+
 (!voice?shortcut("singing","🎤","Explorar canto","Aprenda outra modalidade"):"")+
 '</div></details><details class="home-group"><summary><span class="home-group-icon">⭐</span>'+
 '<span><strong>Minha evolução</strong><small>XP, conquistas e ajustes</small></span><span class="home-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="home-group-body"><div class="home-mini-metrics"><span>⚡ '+n(xp)+' XP</span><span>🔥 '+n(streak)+' dias</span></div>'+
 shortcut("progress","📈","Meu progresso","Confira as últimas práticas")+
 shortcut("achievements","🏆","Conquistas","Missões e medalhas")+
 shortcut("settings","⚙️","Configurações","Som, microfone e família")+
 '</div></details></div></main>';
}
