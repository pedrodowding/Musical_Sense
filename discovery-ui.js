import {INSTRUMENTS,instrumentInfo,instrumentId,getInstrumentCourses} from "./instrument-data.js";
import {instrumentOptions} from "./instrument-ui.js";
import {catalogFilter,availableGenres} from "./catalog.js";
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
/**
 * Trilha mobile em capítulos. Apenas o capítulo com a próxima aula fica aberto,
 * mas todos continuam acessíveis, sem alterar IDs nem bloquear conteúdo.
 */
export function learningPath({instrument,lessons,completed={},checkpoints={}}){
 const info=instrumentInfo(instrument);
 if(!lessons.length){
  return instrumentContext(instrument)+
   '<div class="journey-intro"><span class="eyebrow">TRILHA DE CANTO</span>'+
   '<h1>Seu próximo passo no canto</h1><p>Comece com aquecimento, afinação e canções originais.</p></div>'+
   '<section class="journey-focus"><span>COMECE POR AQUI</span><strong>Prepare sua voz</strong>'+
   '<p>Faça um aquecimento curto para reconhecer as notas.</p>'+
   '<button class="btn" data-vocal="voice-warmup">🎙 Começar aquecimento</button></section>';
 }
 const done=lessons.filter(l=>completed[l.id]).length;
 const next=lessons.find(l=>!completed[l.id])||lessons[0];
 const sections=getInstrumentCourses(info.id),chapters=[];
 const label=(l)=>l.id?.startsWith("curated-")?"extra":l.course||"fundamentals";
 for(let index=0;index<lessons.length;index++){
  const l=lessons[index],key=label(l);
  let chapter=chapters[chapters.length-1];
  if(!chapter||chapter.key!==key){
   const course=sections.find(x=>x.id===key);
   chapter={key,title:key==="extra"?"Mais melodias":course?.name||"Nova etapa",
    subtitle:key==="extra"?"Amplie seu repertório":course?.subtitle||"Pratique no seu ritmo",
    icon:key==="extra"?"🎼":course?.icon||"♪",items:[]};
   chapters.push(chapter);
  }
  chapter.items.push({lesson:l,index});
 }
 const currentChapter=chapters.findIndex(c=>c.items.some(item=>item.lesson.id===next.id));
 const stages=chapters.map((chapter,stageIndex)=>{
  const chapterDone=chapter.items.filter(item=>completed[item.lesson.id]).length;
  const isOpen=stageIndex===Math.max(currentChapter,0);
  const allDone=chapterDone===chapter.items.length;
  const nodes=chapter.items.map(({lesson:l,index})=>{
   const complete=!!completed[l.id],resume=Number(checkpoints[l.id]?.index)||0;
   const current=l.id===next.id;
   const status=complete?"complete":current?"current":"upcoming";
   const action=complete?"Refazer":resume>0?"Continuar":current?"Começar":"Praticar";
   const progress=resume>0&&!complete?" · "+resume+"/"+(l.steps?.length||"?")+" notas":"";
   return '<div class="journey-lesson path-unit '+status+'">'+
    '<span class="journey-lesson-number" aria-hidden="true">'+(complete?"✓":e(l.icon||String(index+1)))+'</span>'+
    '<div class="journey-lesson-copy"><strong>'+e(l.title)+'</strong>'+
    '<span>'+e(l.subtitle||"Aprenda uma melodia")+'</span>'+
    '<small>Aula '+(index+1)+' · '+(l.minutes||1)+' min'+progress+'</small></div>'+
    '<button class="btn sm '+(current?"":"ghost")+'" data-lesson="'+e(l.id)+'" aria-label="'+action+' '+e(l.title)+'">'+action+'</button></div>';
  }).join("");
  return '<details class="journey-chapter" '+(isOpen?"open":"")+'>'+
   '<summary class="journey-chapter-summary"><span class="journey-chapter-symbol" aria-hidden="true">'+chapter.icon+'</span>'+
   '<span class="journey-chapter-copy"><strong>'+e(chapter.title)+'</strong><small>'+e(chapter.subtitle)+'</small></span>'+
   '<span class="journey-chapter-count" aria-label="'+chapterDone+' de '+chapter.items.length+' aulas concluídas">'+
   (allDone?"✓ ":"")+chapterDone+"/"+chapter.items.length+'</span>'+
   '<span class="journey-chapter-chevron" aria-hidden="true">⌄</span></summary>'+
   '<div class="journey-chapter-lessons">'+nodes+'</div></details>';
 }).join("");
 const percentage=Math.round(100*done/lessons.length);
 return instrumentContext(instrument)+
  '<div class="journey-intro"><span class="eyebrow">SEU CAMINHO MUSICAL</span><h1>Sua trilha de '+e(info.name)+'</h1>'+
  '<p>Aprenda uma etapa por vez. Abra outros capítulos quando quiser.</p></div>'+
  '<section class="journey-focus"><div class="journey-focus-heading"><span>PRÓXIMA AULA</span>'+
  '<span>'+done+' de '+lessons.length+' concluídas</span></div>'+
  '<strong>'+e(next.title)+'</strong><p>'+e(next.subtitle||"Continue seu aprendizado")+'</p>'+
  '<button class="btn" data-lesson="'+e(next.id)+'">'+(checkpoints[next.id]?.index>0?"Continuar de onde parei":"▶ Começar agora")+'</button>'+
  '<div class="journey-focus-track" role="progressbar" aria-label="Progresso da trilha" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percentage+'">'+
  '<span style="width:'+percentage+'%"></span></div></section>'+
  '<div class="journey-sections-head"><h2>Capítulos</h2><span>'+chapters.length+' etapas</span></div>'+
  '<div class="journey-chapters">'+stages+'</div>'+
  '<p class="journey-footnote">Nenhuma aula está bloqueada. Seu progresso é preservado ao trocar de instrumento.</p>';
}
export function catalogResultsMarkup(entries,settings){
 const matches=catalogFilter(entries,settings),fav=new Set(settings.favorites||[]);
 if(!matches.length)return '<div class="catalog-empty"><span style="font-size:40px">🎼</span><strong>Nenhuma música encontrada</strong><p>Tente outro termo, remova filtros ou escolha Todos os instrumentos.</p><button class="btn sm ghost" data-action="catalog-reset">Limpar filtros</button></div>';
 return matches.map(entry=>{
  const info=instrumentInfo(entry.instrument),saved=fav.has(entry.id);
  const type=entry.kind==="vocal"?"Cantar":entry.kind==="personal"?"Ler letra":entry.contentType==="exercise"?"Exercitar":"Tocar";
  return '<article class="catalog-card"><div class="catalog-card-top"><span class="catalog-cover">'+e(entry.cover)+'</span>'+
   '<button class="catalog-fav '+(saved?"active":"")+'" data-favorite="'+e(entry.id)+'" aria-label="'+(saved?"Remover dos favoritos":"Adicionar aos favoritos")+' '+e(entry.title)+'" aria-pressed="'+saved+'">'+(saved?"♥":"♡")+'</button></div>'+
   '<div class="catalog-card-body"><div class="catalog-card-meta"><span>'+info.icon+' '+e(info.name)+'</span><span>'+e(entry.level)+'</span></div><h3>'+e(entry.title)+'</h3><p>'+e(entry.artist)+'</p><button class="btn" data-open-song="'+e(entry.id)+'">'+type+' →</button></div></article>';
 }).join("");
}
export function catalogPage({entries,query="",scope="mine",difficulty="all",favorites=[],instrument="piano",type="all",genre="all"}){
 const active=instrumentInfo(instrument),filters={query,scope,difficulty,favorites,instrument,type,genre},
  count=catalogFilter(entries,filters).length;
 const summary={songs:entries.filter(x=>x.contentType==="song").length,
  exercises:entries.filter(x=>x.contentType==="exercise").length,
  lyrics:entries.filter(x=>x.contentType==="lyrics").length};
 const scopes=[["mine","Meu instrumento"],["all","Todos"],["voice","Canto"],["favorites","♥ Favoritas"],["personal","Minhas letras"]];
 const types=[["all","Tudo"],["song","Músicas"],["exercise","Exercícios"],["lyrics","Letras"]];
 const genres=availableGenres(entries);
 return instrumentContext(instrument)+'<div class="page-intro"><span class="eyebrow">BIBLIOTECA 2.0</span><h1>Encontre o que quer aprender 🎵</h1>'+
 '<p>Músicas, exercícios e canto organizados de forma diferente. Busque um título, filtre por nível e descubra seu próximo desafio.</p></div>'+
 '<div class="catalog-overview"><div><strong>'+summary.songs+'</strong><span>Melodias e canções</span></div>'+
 '<div><strong>'+summary.exercises+'</strong><span>Exercícios</span></div>'+
 '<div><strong>'+summary.lyrics+'</strong><span>Minhas letras</span></div></div>'+
 '<div class="catalog-tools"><label class="catalog-search"><span class="catalog-search-icon" aria-hidden="true">⌕</span>'+
 '<input id="catalog-query" type="search" value="'+e(query)+'" placeholder="Buscar música, artista ou instrumento..." autocomplete="off" aria-label="Buscar músicas e exercícios"></label>'+
 '<div class="catalog-filter-line"><div class="catalog-chips" role="group" aria-label="Instrumentos e favoritos">'+scopes.map(([id,label])=>
 '<button class="catalog-chip '+(scope===id?"active":"")+'" data-catalog-scope="'+id+'" aria-pressed="'+(scope===id)+'">'+label+'</button>').join("")+'</div></div>'+
 '<div class="catalog-filter-line"><div class="catalog-chips" role="group" aria-label="Tipo de conteúdo">'+types.map(([id,label])=>
 '<button class="catalog-chip '+(type===id?"active":"")+'" data-catalog-type="'+id+'" aria-pressed="'+(type===id)+'">'+label+'</button>').join("")+'</div></div>'+
 '<div class="catalog-selects"><label>Gênero<select class="catalog-level" id="catalog-genre" aria-label="Gênero">'+
 '<option value="all" '+(genre==="all"?"selected":"")+'>Todos os gêneros</option>'+
 genres.map(g=>'<option value="'+e(g)+'" '+(genre===g?"selected":"")+'>'+e(g)+'</option>').join("")+'</select></label>'+
 '<label>Dificuldade<select class="catalog-level" id="catalog-difficulty" aria-label="Dificuldade">'+
 '<option value="all" '+(difficulty==="all"?"selected":"")+'>Todos os níveis</option>'+
 '<option value="1" '+(difficulty==="1"?"selected":"")+'>Iniciante</option>'+
 '<option value="2" '+(difficulty==="2"?"selected":"")+'>Básico</option>'+
 '<option value="3" '+(difficulty==="3"?"selected":"")+'>Intermediário</option></select></label></div></div>'+
 '<div class="catalog-header"><span class="muted small" id="catalog-count">'+count+' opções encontradas</span>'+
 '<button class="link-action" data-route="instruments">Meu instrumento: '+e(active.name)+' ▾</button></div>'+
 '<div class="catalog-results" id="catalog-results">'+catalogResultsMarkup(entries,filters)+'</div>'+
 '<div class="catalog-import-cta"><span class="catalog-import-emoji">🎼</span><div><strong>Tem uma partitura MIDI ou MusicXML?</strong>'+
 '<p>Importe uma melodia simples, ouça uma prévia e baixe um rascunho para revisão. Nada é publicado automaticamente.</p></div>'+
 '<button class="btn sm ghost" data-route="score-import">Importar partitura →</button></div>'+
 '<p class="inline-tip">Os materiais iniciais incluem exercícios próprios e melodias tradicionais. Novas obras públicas passam por revisão de arranjo e direitos antes de entrar no catálogo.</p>';
}
export function songDetailPage(entry,{favorite=false,instrument}={}){
 if(!entry)return '<div class="card">Música não encontrada. <button class="btn sm" data-route="library">Voltar para músicas</button></div>';
 const info=instrumentInfo(entry.instrument),current=instrumentInfo(instrument),needSwitch=entry.kind==="instrument"&&current.group!=="keys"&&entry.instrument!==current.id||entry.kind==="instrument"&&current.group==="keys"&&entry.instrument!=="piano";
 const label=entry.kind==="vocal"?"🎤 Começar a cantar":entry.kind==="personal"?"📝 Praticar letra":needSwitch?"Trocar para "+info.name+" e começar":"▶ Começar prática";
 return '<section class="song-detail-layout"><button class="link-action" data-route="library">← Voltar para músicas</button>'+
 '<div class="song-detail-cover" style="margin-top:15px">'+e(entry.cover)+'</div><span class="eyebrow">'+info.icon+' '+e(info.name)+' · '+e(entry.genre)+'</span><h1>'+e(entry.title)+'</h1><p class="muted">'+e(entry.artist)+' · '+e(entry.description)+'</p>'+
 '<div class="song-detail-facts"><div><strong>'+e(entry.level)+'</strong><span>Nível</span></div><div><strong>'+entry.minutes+' min</strong><span>Duração estimada</span></div><div><strong>'+info.name+'</strong><span>Modalidade</span></div></div>'+
 '<div class="song-detail-actions"><button class="btn" data-start-song="'+e(entry.id)+'">'+label+'</button>'+(entry.notes?.length?'<button class="btn outline" data-action="preview-song">♫ Ouvir trecho</button>':"")+'<button class="btn ghost" data-favorite="'+e(entry.id)+'" aria-pressed="'+favorite+'">'+(favorite?"♥ Favoritada":"♡ Favoritar")+'</button></div>'+
 '<div class="card"><h3>O que você vai praticar</h3><p class="muted small">'+e(entry.description)+'</p><p class="small muted">Conteúdo: '+e(entry.source)+'. '+(entry.kind==="personal"?"Exibição de letra autorizada sem melodia de referência.":entry.kind==="vocal"?"Canto com letra alinhada e afinação aproximada pelo microfone.":"Reconhecimento de notas individuais pelo microfone, com acompanhamento de partitura ou braço do instrumento.")+'</p></div>'+
 '<div class="song-rights-note"><strong>Origem e direitos</strong><p>'+e(entry.source||"Não informada")+' · '+(entry.catalogOrigin==="curated"?"Revisado editorialmente":"Acervo inicial ou conteúdo pessoal")+'</p></div>'+
 '<p class="song-detail-note">A detecção de notas não equivale a reconhecimento de acordes simultâneos. Para canto, a letra serve de guia e não há validação das palavras pronunciadas.</p></section>';
}
