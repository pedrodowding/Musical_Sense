/**
 * Importação privada de partitura para prévia e exportação de rascunho.
 * O formulário não possui capacidade de publicação no catálogo público.
 */
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const options=(values,selected)=>values.map(([value,label])=>'<option value="'+escape(value)+'" '+(selected===value?"selected":"")+'>'+escape(label)+'</option>').join("");
export function scoreImportPage({preview=null,error=""}={}){
 const instruments=[["piano","Piano"],["keyboard","Teclado"],["acoustic","Violão"],["electric","Guitarra"],["ukulele","Ukulele"],["bass-guitar","Baixo"]];
 const licenses=[["original","Composição/arranjo original"],["CC0","Creative Commons CC0"],["CC-BY","CC BY com atribuição"],["public-domain","Domínio público verificado"],["permission","Autorização formal do titular"]];
 const duration=preview?Math.ceil(preview.notes.reduce((sum,n)=>sum+n.beats,0)*60/preview.bpm):0;
 return '<section class="import-page"><button class="account-back" data-route="library">‹ Voltar para biblioteca</button>'+
 '<div class="page-intro"><span class="eyebrow">BIBLIOTECA MUSICAL 2.0</span><h1>Importar uma partitura 🎼</h1>'+
 '<p>Experimente localmente uma melodia simples em MIDI ou MusicXML. A importação cria apenas um rascunho, sem publicar conteúdo para outros alunos.</p></div>'+
 '<div class="import-steps"><div class="import-step active"><strong>1</strong> Escolher arquivo</div><div class="import-step '+(preview?"active":"")+'"><strong>2</strong> Conferir notas</div><div class="import-step '+(preview?"active":"")+'"><strong>3</strong> Exportar rascunho</div></div>'+
 '<section class="card import-card"><h2>1. Arquivo musical</h2><label class="import-file" for="score-file"><span>📁</span><strong>Selecionar MIDI ou MusicXML</strong><small>.mid, .midi, .xml e .musicxml (até 450 KB)</small></label>'+
 '<input id="score-file" class="import-file-hidden" type="file" accept=".mid,.midi,.xml,.musicxml,application/xml,audio/midi" aria-label="Selecionar arquivo musical">'+
 '<p class="muted small">Nesta versão, apenas melodias monofônicas, sem acordes, partes simultâneas, pausas longas ou mudanças de andamento. MusicXML compactado (.mxl) não é aceito.</p></section>'+
 (error?'<div class="import-error" role="alert"><strong>Não foi possível importar</strong><p>'+escape(error)+'</p></div>':"")+
 (preview?'<section class="card import-card"><div class="row between"><h2>2. Prévia local</h2><span class="pill green">Notas interpretadas</span></div>'+
 '<h3>'+escape(preview.title)+'</h3><p class="muted small">'+escape(preview.composer)+' · '+escape(preview.format)+'</p>'+
 '<div class="import-metrics"><div><strong>'+preview.notes.length+'</strong><span>Notas</span></div><div><strong>'+preview.bpm+' BPM</strong><span>Velocidade</span></div><div><strong>'+duration+'s</strong><span>Duração estimada</span></div></div>'+
 '<div class="import-notes" aria-label="Sequência de notas MIDI">'+preview.notes.slice(0,40).map(n=>'<span>'+n.m+' <small>×'+n.beats+'</small></span>').join("")+
 (preview.notes.length>40?'<span>+'+(preview.notes.length-40)+' notas</span>':"")+'</div>'+
 '<button type="button" class="btn outline" data-action="import-audition">♫ Ouvir a prévia sintetizada</button>'+
 '<p class="muted small">Os números representam alturas MIDI. A reprodução não equivale ao áudio original do arquivo.</p></section>'+
 '<section class="card import-card"><h2>3. Preparar revisão editorial</h2>'+
 '<form id="score-draft-form" class="import-form"><label for="import-title">Título da obra</label>'+
 '<input id="import-title" class="form-input" name="title" required maxlength="120" value="'+escape(preview.title)+'">'+
 '<label for="import-composer">Compositor ou responsável</label>'+
 '<input id="import-composer" class="form-input" name="composer" required maxlength="120" value="'+escape(preview.composer)+'">'+
 '<div class="import-form-grid"><div><label for="import-instrument">Instrumento deste arranjo</label>'+
 '<select id="import-instrument" name="instrument" class="form-input">'+options(instruments,"piano")+'</select></div>'+
 '<div><label for="import-genre">Categoria</label><select id="import-genre" name="genre" class="form-input">'+
 options([["Melodias","Melodias"],["Clássicas","Clássicas"],["Tradicionais","Tradicionais"],["Autorais","Autorais"],["Exercícios","Exercícios"]],"Melodias")+'</select></div></div>'+
 '<label for="import-license">Situação dos direitos da obra e do arranjo</label>'+
 '<select id="import-license" name="license" class="form-input">'+options(licenses,"original")+'</select>'+
 '<label for="import-source">Fonte da obra (URL HTTPS, quando existir)</label>'+
 '<input id="import-source" class="form-input" name="sourceUrl" inputmode="url" maxlength="400" placeholder="https://...">'+
 '<label for="import-evidence">Comprovação ou observações para revisão</label>'+
 '<textarea id="import-evidence" class="form-input" name="evidence" rows="3" maxlength="400" placeholder="Ex.: arquivo próprio, licença CC0, referência de edição"></textarea>'+
 '<label class="rights-check"><input type="checkbox" id="import-rights" name="rights" required>'+
 '<span>Confirmo que tenho direito de usar este arquivo para uma prévia local e que não vou publicar material de terceiros sem autorização.</span></label>'+
 '<button type="submit" class="btn">⬇ Baixar rascunho JSON</button>'+
 '<p class="muted small">O arquivo exportado ficará com status <strong>draft</strong>. Para aparecer no catálogo público, um revisor precisará validar arranjo, autoria, licença, fonte e aprovar a publicação no repositório.</p></form></section>':
 '<div class="import-pending"><span>🎵</span><strong>Seu arquivo será analisado apenas neste dispositivo</strong><p>Nenhuma música será publicada nem enviada automaticamente para servidores.</p></div>')+
 '</section>';
}
