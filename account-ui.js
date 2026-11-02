/**
 * Musical Sense | Fase 1, experiência pessoal e familiar
 * Componente de apresentação independente. Nenhuma alteração de progresso
 * ou persistência acontece aqui.
 */
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));
const safeNumber=value=>Math.max(0,Math.floor(Number(value)||0));
const avatar=name=>escapeHtml(String(name||"M").trim().charAt(0).toLocaleUpperCase("pt-BR")||"M");
function accountLink({route,icon,title,description,detail=""}){
 return '<button class="account-link" type="button" data-route="'+escapeHtml(route)+'">'+
  '<span class="account-link-icon" aria-hidden="true">'+icon+'</span><span class="account-link-body"><strong>'+escapeHtml(title)+'</strong>'+
  '<small>'+escapeHtml(description)+'</small></span>'+(detail?'<span class="account-link-detail">'+escapeHtml(detail)+'</span>':"")+
  '<span class="account-link-chevron" aria-hidden="true">›</span></button>';
}
export function profileSwitcher(users,activeId){
 return '<dialog id="profile-dialog" class="profile-dialog" aria-labelledby="profile-dialog-title">'+
 '<div class="profile-dialog-body"><div class="account-dialog-head"><div><span class="account-eyebrow">SELECIONE O ALUNO</span>'+
 '<h2 id="profile-dialog-title">Quem vai fazer música?</h2></div><button type="button" class="account-icon-btn" data-action="close-profile-switch" aria-label="Fechar seleção de perfil">✕</button></div>'+
 '<div class="account-dialog-list">'+users.map(p=>{
  const selected=p.id===activeId;
  return '<button type="button" class="account-dialog-option '+(selected?"active":"")+'" data-profile="'+escapeHtml(p.id)+'" aria-current="'+(selected?"true":"false")+'">'+
  '<span class="account-avatar '+(selected?"active":"")+'">'+avatar(p.name)+'</span>'+
  '<span class="account-dialog-name"><strong>'+escapeHtml(p.name)+'</strong><small>'+escapeHtml(p.instrument||"Piano")+' · '+safeNumber(p.xp)+' XP</small></span>'+
  '<span class="account-dialog-indicator">'+(selected?"✓":"›")+'</span></button>';
 }).join("")+'</div>'+
 '<button type="button" class="account-dialog-manage" data-route="family">👨‍👩‍👧‍👦 Gerenciar perfis'+(users.length<5?" ou adicionar aluno":"")+' <span aria-hidden="true">›</span></button>'+
 '<p class="account-local-note">Os perfis e o progresso ficam salvos neste dispositivo.</p></div></dialog>';
}
export function profileHub({user,level,streak,completed,favoritesCount,accuracy,practiceMinutes,instrumentName}){
 const first=escapeHtml(user.name),pct=Math.max(0,Math.min(100,safeNumber(level.progress)));
 const accuracyDisplay=accuracy===null?"Sem práticas":accuracy+"%";
 return '<div class="account-page profile-hub">'+
 '<div class="account-page-title"><span class="account-eyebrow">MEU ESPAÇO MUSICAL</span>'+
 '<h1 id="account-heading" tabindex="-1">Meu perfil</h1><p>Seu progresso, suas músicas e sua família.</p></div>'+
 '<section class="account-hero"><div class="account-hero-identity">'+
 '<span class="account-avatar large">'+avatar(user.name)+'</span>'+
 '<div class="account-hero-name"><span class="account-eyebrow">ALUNO</span><h2>'+first+'</h2>'+
 '<span>'+escapeHtml(instrumentName)+' · Nível '+safeNumber(level.level)+'</span></div></div>'+
 '<div class="account-level-label"><strong>Rumo ao nível '+(safeNumber(level.level)+1)+'</strong><span>'+pct+'%</span></div>'+
 '<div class="account-track" role="progressbar" aria-label="Progresso até o próximo nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'">'+
 '<div style="width:'+pct+'%"></div></div>'+
 '<div class="account-hero-bottom"><span>⚡ '+safeNumber(user.xp)+' XP</span>'+
 '<span>🔥 '+safeNumber(streak.current)+' dia(s) de sequência</span></div></section>'+
 '<div class="account-section-title"><h2>Minha jornada</h2></div><div class="account-link-list">'+
 accountLink({route:"progress",icon:"📈",title:"Minha evolução",description:"Progresso, habilidades e missões",detail:"Nível "+safeNumber(level.level)})+
 accountLink({route:"instruments",icon:"🎹",title:"Meus instrumentos",description:"Aprender ou trocar de instrumento",detail:instrumentName})+
 accountLink({route:"my-music",icon:"♥",title:"Minhas músicas",description:"Favoritas e praticadas",detail:safeNumber(favoritesCount)+" favoritas"})+
 '</div>'+
 '<details class="profile-more"><summary><span class="profile-more-icon">📊</span>'+
 '<span class="profile-more-copy"><strong>Meu desempenho</strong><small>Aulas, precisão e tempo de prática</small></span>'+
 '<span class="profile-more-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="account-metrics" aria-label="Seus indicadores musicais">'+
 '<div class="account-metric"><strong>'+safeNumber(completed)+'</strong><span>Aulas concluídas</span></div>'+
 '<div class="account-metric"><strong>'+accuracyDisplay+'</strong><span>Precisão das notas</span></div>'+
 '<div class="account-metric"><strong>'+safeNumber(practiceMinutes)+' min</strong><span>Tempo praticado</span></div></div></details>'+
 '<details class="profile-more"><summary><span class="profile-more-icon">⚙️</span>'+
 '<span class="profile-more-copy"><strong>Conta e preferências</strong><small>Família, áudio e configurações</small></span>'+
 '<span class="profile-more-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="account-link-list inner">'+
 accountLink({route:"family",icon:"👨‍👩‍👧‍👦",title:"Perfis da família",description:"Trocar, adicionar ou editar alunos"})+
 accountLink({route:"settings",icon:"⚙️",title:"Configurações",description:"Som, microfone, backup e ajuda"})+
 '</div></details>'+
 '<p class="account-footnote">O progresso fica salvo neste aparelho. Para manter uma cópia, use Configurações e exporte um backup.</p></div>';
}
export function familyProfilesPage({users,activeId,instruments}){
 return '<div class="account-page family-page"><div class="account-page-title"><button class="account-back" data-route="profiles">‹ Meu perfil</button>'+
 '<span class="account-eyebrow">PERFIS NESTE APARELHO</span><h1 id="account-heading" tabindex="-1">Nossa família musical</h1>'+
 '<p>Cada pessoa tem aulas, músicas favoritas, XP e conquistas independentes.</p></div>'+
 '<section class="account-card"><div class="account-card-title"><h2>Escolha quem vai tocar</h2><span>'+users.length+' de 5 perfis</span></div>'+
 '<div class="family-profile-list">'+users.map(p=>{
  const selected=p.id===activeId;
  return '<div class="family-profile '+(selected?"active":"")+'"><span class="account-avatar">'+avatar(p.name)+'</span>'+
   '<div class="family-profile-info"><strong>'+escapeHtml(p.name)+'</strong><small>'+escapeHtml(p.instrument||"Piano")+' · '+safeNumber(p.xp)+' XP</small></div>'+
   '<button type="button" class="family-select '+(selected?"active":"")+'" data-profile="'+escapeHtml(p.id)+'">'+(selected?"✓ Ativo":"Entrar")+'</button>'+
   '<button type="button" class="account-icon-btn" data-profile-edit="'+escapeHtml(p.id)+'" aria-label="Renomear '+escapeHtml(p.name)+'" title="Renomear">✎</button>'+
   '<button type="button" class="account-icon-btn danger" data-profile-delete="'+escapeHtml(p.id)+'" aria-label="Excluir '+escapeHtml(p.name)+'" title="Excluir">×</button></div>';
 }).join("")+'</div></section>'+
 (users.length<5?'<section class="account-card"><div class="account-card-title"><h2>Adicionar aluno</h2><span>Máximo de 5</span></div>'+
 '<form id="profile-form" class="family-create"><label for="profile-name">Como devemos chamar o aluno?</label>'+
 '<input class="form-input" id="profile-name" name="name" maxlength="30" required placeholder="Nome ou apelido" autocomplete="off">'+
 '<label for="profile-instrument">Instrumento inicial</label><select class="form-input" id="profile-instrument" name="instrument">'+
 instruments.map(item=>'<option value="'+escapeHtml(item.name)+'">'+escapeHtml(item.icon+" "+item.name)+'</option>').join("")+'</select>'+
 '<button type="submit" class="btn">+ Criar perfil</button></form></section>':
 '<section class="account-card"><p class="account-local-note">O limite de cinco perfis neste dispositivo foi atingido.</p></section>')+
 '<p class="account-footnote">Excluir um perfil remove suas aulas, XP e letras pessoais locais. Faça um backup antes de excluir se quiser preservar esses dados.</p></div>';
}
export function progressPage({user,level,streak,instruments,weekly,missions,badges,historyCount}){
 const earned=badges.filter(b=>user.game?.badges?.[b.id]),max=Math.max(1,...weekly.map(d=>d.seconds||0));
 return '<div class="account-page progress-page"><div class="account-page-title"><button class="account-back" data-route="profiles">‹ Meu perfil</button>'+
 '<span class="account-eyebrow">SUA EVOLUÇÃO</span><h1 id="account-heading" tabindex="-1">Cada nota é um avanço</h1><p>Acompanhe seu ritmo de aprendizagem.</p></div>'+
 '<div class="account-metrics"><div class="account-metric"><strong>'+safeNumber(level.level)+'</strong><span>Nível musical</span></div>'+
 '<div class="account-metric"><strong>'+safeNumber(streak.current)+' 🔥</strong><span>Sequência atual</span></div>'+
 '<div class="account-metric"><strong>'+safeNumber(earned.length)+'</strong><span>Medalhas</span></div></div>'+
 '<section class="account-card"><div class="account-card-title"><h2>Prática nos últimos 7 dias</h2><span>'+safeNumber(historyCount)+' treinos registrados</span></div>'+
 '<div class="account-week" role="img" aria-label="Minutos de prática nos últimos sete dias">'+weekly.map(day=>
 '<div class="account-week-day"><div class="account-week-column"><div class="account-week-bar '+(day.seconds?"active":"")+'" style="height:'+(day.seconds?Math.max(8,Math.round(day.seconds/max*100)):3)+'%"></div></div>'+
 '<strong>'+escapeHtml(day.label)+'</strong><small>'+Math.round((day.seconds||0)/60)+'m</small></div>').join("")+'</div>'+
 '<p class="account-local-note">Tempo contabilizado nas práticas concluídas neste aparelho.</p></section>'+
 '<section class="account-card"><div class="account-card-title"><h2>Trilhas por instrumento</h2><button class="account-text-button" data-route="instruments">Trocar ›</button></div>'+
 '<div class="account-instruments">'+instruments.map(row=>
 '<div class="account-instrument"><div class="account-instrument-title"><span>'+escapeHtml(row.icon)+' '+escapeHtml(row.name)+'</span><small>'+safeNumber(row.done)+'/'+safeNumber(row.total)+' aulas</small></div>'+
 '<div class="account-track"><div style="width:'+(row.total?Math.min(100,Math.round(100*row.done/row.total)):0)+'%"></div></div></div>').join("")+'</div></section>'+
 '<section class="account-card"><div class="account-card-title"><h2>Missões de hoje</h2><button class="account-text-button" data-route="achievements">Ver medalhas ›</button></div>'+
 '<div class="account-missions">'+missions.map(m=>
 '<div class="account-mission"><span>'+escapeHtml(m.icon)+'</span><div><strong>'+escapeHtml(m.name)+'</strong><small>'+safeNumber(m.current)+' de '+safeNumber(m.goal)+(m.key==="seconds"?" segundos":"")+'</small></div><span class="account-mission-status">'+(m.done?"✓":"○")+'</span></div>').join("")+'</div></section>'+
 '<button type="button" class="btn account-bottom-cta" data-route="courses">Continuar minha trilha →</button></div>';
}
export function myMusicPage({favorites=[],otherFavorites=[],recent=[],otherRecent=[],instrumentName="Piano",personalCount=0}){
 function songCard(item,remove=false){
  return '<div class="account-music-row"><span class="account-music-cover">'+escapeHtml(item.cover||"♪")+'</span>'+
   '<div class="account-music-info"><strong>'+escapeHtml(item.title)+'</strong>'+
   '<small>'+escapeHtml(item.artist||"Musical Sense")+'</small></div>'+
   '<button class="account-music-play" data-open-song="'+escapeHtml(item.id)+'" aria-label="Abrir '+escapeHtml(item.title)+'">Abrir ›</button>'+
   (remove?'<button class="account-icon-btn" data-favorite="'+escapeHtml(item.id)+'" aria-label="Remover '+escapeHtml(item.title)+' dos favoritos">♥</button>':"")+
   '</div>';
 }
 const group=(title,list,emptyText,remove=false)=>'<section class="account-card"><div class="account-card-title"><h2>'+title+
 '</h2><span>'+list.length+' músicas</span></div>'+
 (list.length?list.map(x=>songCard(x,remove)).join(""):'<div class="account-empty"><span>♫</span>'+
 '<strong>'+escapeHtml(emptyText)+'</strong><p>Explore as músicas e comece sua próxima atividade.</p></div>')+'</section>';
 return '<div class="account-page my-music-page"><div class="account-page-title"><button class="account-back" data-route="profiles">‹ Meu perfil</button>'+
 '<span class="account-eyebrow">SEU REPERTÓRIO EM '+escapeHtml(instrumentName.toUpperCase())+'</span>'+
 '<h1 id="account-heading" tabindex="-1">Minhas músicas</h1>'+
 '<p>Seus favoritos e práticas recentes estão organizados para '+escapeHtml(instrumentName.toLowerCase())+'.</p></div>'+
 group("♥ Favoritas de "+escapeHtml(instrumentName),favorites,"Ainda não há favoritas deste instrumento",true)+
 group("Praticadas recentemente",recent,"Ainda não há práticas recentes deste instrumento")+
 '<button class="btn ghost account-bottom-cta" data-route="library">Encontrar músicas para '+escapeHtml(instrumentName)+' →</button>'+
 (otherFavorites.length||otherRecent.length?'<details class="home-group account-other-music" style="margin-top:15px"><summary>'+
 '<span class="home-group-icon">🎵</span><span><strong>Outros instrumentos</strong>'+
 '<small>Favoritos e histórico de outros estudos</small></span><span class="home-chevron">⌄</span></summary>'+
 '<div class="home-group-body">'+
 (otherFavorites.length?'<h3>Outras favoritas</h3>'+otherFavorites.map(x=>songCard(x,true)).join(""):"")+
 (otherRecent.length?'<h3>Outras práticas</h3>'+otherRecent.map(x=>songCard(x)).join(""):"")+
 '</div></details>':"")+
 '<button class="account-link standalone" data-route="singing"><span class="account-link-icon">📝</span>'+
 '<span class="account-link-body"><strong>Minhas letras</strong><small>'+safeNumber(personalCount)+
 ' letras guardadas neste dispositivo</small></span><span class="account-link-chevron">›</span></button></div>';
}
export function settingsPage(){
 return '<div class="account-page settings-page"><div class="account-page-title"><button class="account-back" data-route="profiles">‹ Meu perfil</button>'+
 '<span class="account-eyebrow">PREFERÊNCIAS</span><h1 id="account-heading" tabindex="-1">Configurações</h1><p>Personalize a experiência e cuide dos dados deste aparelho.</p></div>'+
 '<section class="account-card"><div class="account-card-title"><h2>Experiência musical</h2></div><div class="account-link-list inner">'+
 accountLink({route:"sound",icon:"🔊",title:"Som e reprodução",description:"Volume, metrônomo e timbre"})+
 accountLink({route:"diagnostics",icon:"🎙",title:"Microfone e diagnóstico",description:"Verificação de áudio e permissões"})+'</div></section>'+
 '<section class="account-card"><div class="account-card-title"><h2>Seus dados</h2></div><p class="account-settings-copy">O progresso e as letras pessoais ficam armazenados localmente neste navegador. Para proteger seus dados, exporte um backup e guarde-o em um local seguro.</p>'+
 '<div class="account-backup-actions"><button type="button" class="btn" data-action="backup-export">⬇ Exportar progresso</button>'+
 '<button type="button" class="btn outline" data-action="backup-import">⬆ Restaurar backup</button>'+
 '<input type="file" id="backup-file" class="account-file-input" accept=".json,application/json" aria-label="Selecionar arquivo JSON de backup"></div>'+
 '<p class="account-local-note">Restaurar um backup substituirá os perfis e o progresso atuais neste dispositivo após sua confirmação.</p></section>'+
 '<section class="account-card"><div class="account-card-title"><h2>Sobre o aplicativo</h2></div>'+
 '<p class="account-settings-copy">Musical Sense é uma plataforma de prática musical com feedback de notas por microfone. Não substitui aulas presenciais. Em instrumentos de cordas, o reconhecimento atual é de notas isoladas.</p></section></div>';
}
