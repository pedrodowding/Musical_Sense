import {INSTRUMENTS,instrumentInfo,instrumentId,getInstrumentCourses} from "./instrument-data.js";
import {instrumentOptions} from "./instrument-ui.js";
import {catalogFilter} from "./catalog.js";
const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pc=(a,b)=>b?Math.round(100*a/b):0;
export function instrumentContext(instrument){
 const info=instrumentInfo(instrument);
 return '<div class="instrument-context"><div class="left"><span class="icon">'+info.icon+'</span><div><strong>Meu instrumento: '+e(info.name)+'</strong><span class="sub">Aulas e músicas recomendadas para você</span></div></div><button class="btn sm ghost" data-route="instruments">Trocar</button></div>';
}
export function instrumentPicker(current){
 const id=instrumentId(current);
 return '<div class="instrument-choice-head"><span class="pill">🎵 SEU CAMINHO MUSICAL</span><h1>Qual instrumento você quer aprender?</h1><p class="muted">Escolha o instrumento de agora. Você pode trocar quando quiser sem apagar as conquistas de nenhum deles.</p></div>'+instrumentOptions(id)+
 '<p class="instrument-explain">Piano e teclado usam a mesma trilha de notas. Violão, guitarra, ukulele e baixo têm exercícios iniciais próprios de corda única. Para acordes simultâneos, ainda estamos desenvolvendo um detector específico. A opção Voz abre o treinamento de canto.</p>';
}
export function learningPath({instrument,lessons,completed={},checkpoints={}}){
 const info=instrumentInfo(instrument);
 if(!lessons.length){
  return instrumentContext(instrument)+'<section class="path-summary"><div><span class="eyebrow" style="color:#c7c5ff">TRILHA DE CANTO</span><h2>Aprenda com a sua voz</h2><p>Vocalizes, afinação e letras sincronizadas</p></div><span style="font-size:48px">🎤</span></section>'+
   '<div class="card" style="margin-top:16px"><h3>Seu próximo passo</h3><p class="muted small">Comece com um aquecimento para reconhecer as notas da sua voz.</p><button class="btn" data-vocal="voice-warmup">🎙 Começar aquecimento</button></div>';
 }
 const done=lessons.filter(l=>completed[l.id]).length, next=lessons.find(l=>!completed[l.id])||lessons[0],sections=getInstrumentCourses(info.id);
 let lastCourse="";
 const nodes=lessons.map((l,index)=>{
  const complete=Boolean(completed[l.id]),current=l.id===next.id,resume=checkpoints[l.id]?.index>0;
  const status=complete?"complete":current?"current":"upcoming";
  const chapter=l.course!==lastCourse;lastCourse=l.course;
  const section=sections.find(s=>s.id===l.course);
  return (chapter?'<div class="path-stage">'+e(section?.name||"Nova etapa")+'</div>':"")+
    '<div class="path-unit '+status+'"><div class="path-node">'+(complete?"✓":l.icon||"♪")+'</div>'+
    '<div class="path-body"><h3>'+e(l.title)+'</h3><p>'+e(l.subtitle)+'</p><div class="path-meta">'+(complete?"✓ CONCLUÍDA":resume?"↻ CONTINUAR":"LIÇÃO "+(index+1))+' · '+l.minutes+' MIN · '+l.xp+' XP</div></div>'+
    '<button class="btn '+(current?"":"ghost")+' sm" data-lesson="'+e(l.id)+'">'+(complete?"Refazer":resume?"Continuar":current?"Começar":"Praticar")+'</button></div>';
 }).join("");
 return instrumentContext(instrument)+'<div class="path-summary"><div><span class="eyebrow" style="color:#d3ceff">TRILHA DE '+e(info.name.toUpperCase())+'</span><h2>Um passo de cada vez</h2><p>Escolha uma lição ou continue de onde parou.</p></div><div class="path-progress">'+done+' / '+lessons.length+' aulas ✓</div></div>'+
 '<div class="learning-path">'+nodes+'</div><p class="path-subtitle">As lições não são bloqueadas. Você pode rever qualquer etapa para praticar.</p>';
}
export function catalogResultsMarkup(entries,settings){
 const matches=catalogFilter(entries,settings),fav=new Set(settings.favorites||[]);
 if(!matches.length)return '<div class="catalog-empty"><span style="font-size:40px">🎼</span><strong>Nenhuma música encontrada</strong><p>Tente outro termo, remova filtros ou escolha Todos os instrumentos.</p><button class="btn sm ghost" data-action="catalog-reset">Limpar filtros</button></div>';
 return matches.map(entry=>{
  const info=instrumentInfo(entry.instrument),saved=fav.has(entry.id);
  const type=entry.kind==="vocal"?"Cantar":entry.kind==="personal"?"Ler letra":"Praticar";
  return '<article class="catalog-card"><div class="catalog-card-top"><span class="catalog-cover">'+entry.cover+'</span>'+
   '<button class="catalog-fav '+(saved?"active":"")+'" data-favorite="'+e(entry.id)+'" aria-label="'+(saved?"Remover dos favoritos":"Adicionar aos favoritos")+' '+e(entry.title)+'" aria-pressed="'+saved+'">'+(saved?"♥":"♡")+'</button></div>'+
   '<div class="catalog-card-body"><div class="catalog-card-meta"><span>'+info.icon+' '+e(info.name)+'</span><span>'+e(entry.level)+'</span></div><h3>'+e(entry.title)+'</h3><p>'+e(entry.artist)+'</p><button class="btn" data-open-song="'+e(entry.id)+'">'+type+' →</button></div></article>';
 }).join("");
}
export function catalogPage({entries,query,scope,difficulty,favorites,instrument}){
 const active=instrumentInfo(instrument),count=catalogFilter(entries,{query,scope,difficulty,favorites,instrument}).length;
 const scopes=[["mine","Meu instrumento"],["all","Todas"],["voice","Canto"],["favorites","♥ Favoritas"],["personal","Minhas letras"]];
 return instrumentContext(instrument)+'<div class="page-intro"><span class="eyebrow">EXPLORE A MÚSICA</span><h1>Qual música vamos aprender?</h1><p>Encontre exercícios e canções adequados ao seu nível. Use os favoritos para voltar rapidamente.</p></div>'+
 '<div class="catalog-tools"><label class="catalog-search"><span class="catalog-search-icon">⌕</span><input id="catalog-query" type="search" value="'+e(query)+'" placeholder="Buscar música, artista ou instrumento..." autocomplete="off" aria-label="Buscar músicas"></label>'+
 '<div class="catalog-filter-line"><div class="catalog-chips" role="group" aria-label="Filtrar biblioteca">'+scopes.map(([id,label])=>'<button class="catalog-chip '+(scope===id?"active":"")+'" data-catalog-scope="'+id+'" aria-pressed="'+(scope===id)+'">'+label+'</button>').join("")+'</div>'+
 '<select class="catalog-level" id="catalog-difficulty" aria-label="Nível"><option value="all" '+(difficulty==="all"?"selected":"")+'>Todos os níveis</option><option value="1" '+(difficulty==="1"?"selected":"")+'>Iniciante</option><option value="2" '+(difficulty==="2"?"selected":"")+'>Básico</option></select></div></div>'+
 '<div class="row between" style="margin:0 0 12px"><span class="muted small" id="catalog-count">'+count+' opções</span><button class="link-action" data-route="instruments">Meu instrumento: '+e(active.name)+' ▾</button></div>'+
 '<div class="catalog-results" id="catalog-results">'+catalogResultsMarkup(entries,{query,scope,difficulty,favorites,instrument})+'</div>'+
 '<p class="inline-tip">Catálogo inicial com melodias tradicionais, domínio público e materiais originais. Não distribuímos gravações comerciais ou letras sem licença.</p>';
}
export function songDetailPage(entry,{favorite=false,instrument}={}){
 if(!entry)return '<div class="card">Música não encontrada. <button class="btn sm" data-route="library">Voltar para músicas</button></div>';
 const info=instrumentInfo(entry.instrument),current=instrumentInfo(instrument),needSwitch=entry.kind==="instrument"&&current.group!=="keys"&&entry.instrument!==current.id||entry.kind==="instrument"&&current.group==="keys"&&entry.instrument!=="piano";
 const label=entry.kind==="vocal"?"🎤 Começar a cantar":entry.kind==="personal"?"📝 Praticar letra":needSwitch?"Trocar para "+info.name+" e começar":"▶ Começar prática";
 return '<section class="song-detail-layout"><button class="link-action" data-route="library">← Voltar para músicas</button>'+
 '<div class="song-detail-cover" style="margin-top:15px">'+entry.cover+'</div><span class="eyebrow">'+info.icon+' '+e(info.name)+' · '+e(entry.genre)+'</span><h1>'+e(entry.title)+'</h1><p class="muted">'+e(entry.artist)+' · '+e(entry.description)+'</p>'+
 '<div class="song-detail-facts"><div><strong>'+e(entry.level)+'</strong><span>Nível</span></div><div><strong>'+entry.minutes+' min</strong><span>Duração estimada</span></div><div><strong>'+info.name+'</strong><span>Modalidade</span></div></div>'+
 '<div class="song-detail-actions"><button class="btn" data-start-song="'+e(entry.id)+'">'+label+'</button>'+(entry.notes?.length?'<button class="btn outline" data-action="preview-song">♫ Ouvir trecho</button>':"")+'<button class="btn ghost" data-favorite="'+e(entry.id)+'" aria-pressed="'+favorite+'">'+(favorite?"♥ Favoritada":"♡ Favoritar")+'</button></div>'+
 '<div class="card"><h3>O que você vai praticar</h3><p class="muted small">'+e(entry.description)+'</p><p class="small muted">Conteúdo: '+e(entry.source)+'. '+(entry.kind==="personal"?"Exibição de letra autorizada sem melodia de referência.":entry.kind==="vocal"?"Canto com letra alinhada e afinação aproximada pelo microfone.":"Reconhecimento de notas individuais pelo microfone, com acompanhamento de partitura ou braço do instrumento.")+'</p></div>'+
 '<p class="song-detail-note">A detecção de notas não equivale a reconhecimento de acordes simultâneos. Para canto, a letra serve de guia e não há validação das palavras pronunciadas.</p></section>';
}
