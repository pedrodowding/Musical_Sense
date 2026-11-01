const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gradeColor={perfect:"#23bfa3",good:"#45c9a7",ok:"#f1b951",miss:"#f06c82"};
export function performanceRollSvg(p,noteName,now){
  const pos=p.positionBeats(now),scale=135,hitX=177,width=900;
  const minMidi=Math.min(...p.steps.map(s=>s.m)),maxMidi=Math.max(...p.steps.map(s=>s.m));
  const lane=m=>48+(1-(m-minMidi)/Math.max(1,maxMidi-minMidi))*95;
  let out='<svg viewBox="0 0 900 192" aria-label="Notas móveis de performance musical" role="img"><rect width="900" height="192" fill="#202444"/>';
  for(let b=Math.max(0,Math.floor(pos)-2);b<Math.min(p.totalBeats+1,Math.ceil(pos)+8);b++){
    const x=hitX+(b-pos)*scale;if(x<0||x>width)continue;
    out+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="24" y2="169" stroke="#4c5273" stroke-width="'+(b%4===0?"1.8":"1")+'" stroke-dasharray="3 5"/>';
    if(b%4===0)out+='<text x="'+(x+5).toFixed(1)+'" y="17" font-size="10" fill="#929ac7">♩ '+(b+1)+'</text>';
  }
  for(let i=0;i<p.total;i++){
    const step=p.steps[i],x=hitX+(p.beats[i]-pos)*scale,w=Math.max(35,step.beats*scale-9),y=lane(step.m);
    if(x+w<-50||x>width+50)continue;
    const entry=p.events[i],color=entry?gradeColor[entry.status]:i===p.index?"#a7a2ff":"#807deb";
    out+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="37" rx="11" fill="'+color+'" stroke="'+(i===p.index?"#fff":"#a6a9d0")+'" stroke-width="'+(i===p.index?"2.4":".6")+'"/>';
    out+='<text x="'+(x+Math.min(w-7,12)).toFixed(1)+'" y="'+(y+23).toFixed(1)+'" font-size="13" fill="#fff" font-weight="800">'+escapeHtml(noteName(step.m,false))+'</text>';
    if(entry)out+='<text x="'+(x+w-15).toFixed(1)+'" y="'+(y+23).toFixed(1)+'" font-size="14" fill="#fff">'+(entry.status==="miss"?"×":"✓")+'</text>';
  }
  out+='<rect x="'+(hitX-4)+'" y="17" width="8" height="158" rx="4" fill="#56e3c1"/><path d="M '+(hitX-14)+' 178 L '+(hitX+14)+' 178 L '+hitX+' 190 Z" fill="#56e3c1"/>';
  if(p.phase==="countin"){
    out+='<rect width="900" height="192" fill="#161a35" fill-opacity=".72"/><text x="450" y="73" text-anchor="middle" fill="#c2befc" font-size="16" font-weight="700">PREPARE-SE</text><text x="450" y="139" text-anchor="middle" fill="#fff" font-size="65" font-weight="900">'+p.countdown(now)+'</text>';
  }else if(p.phase==="paused"){
    out+='<rect width="900" height="192" fill="#161a35" fill-opacity=".72"/><text x="450" y="107" text-anchor="middle" fill="#fff" font-size="30" font-weight="900">PAUSADO</text>';
  }else if(p.phase==="ready"){
    out+='<rect width="900" height="192" fill="#161a35" fill-opacity=".48"/><text x="450" y="108" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">Pressione Começar para iniciar</text>';
  }
  return out+'</svg>';
}
export function performancePanel(s,noteName,bpm){
  const p=s.performance,ready=p.phase==="ready",paused=p.phase==="paused",countin=p.phase==="countin",running=p.phase==="running";
  const startLabel=ready?"▶ Começar performance":paused?"▶ Continuar":running||countin?"Ⅱ Pausar":"↻ Refazer";
  const current=p.phase==="countin"?"Preparando o pulso de quatro tempos":p.phase==="ready"?"Treine no tempo da música":p.phase==="paused"?"Performance pausada":p.lastFeedback;
  return '<section class="performance-area" aria-label="Modo performance musical">'+
   '<div class="performance-head"><div><span class="performance-kicker">🎵 MODO PERFORMANCE</span><h2>Toque no tempo da música</h2><p>As notas avançam até a linha verde. Toque quando chegarem nela.</p></div><div class="performance-pulse"><strong id="perf-combo">'+p.combo+'×</strong><span>sequência</span></div></div>'+
   '<div class="performance-roll" id="performance-roll">'+performanceRollSvg(p,noteName,performance.now())+'</div>'+
   '<div class="performance-stats"><span><i class="perf-dot success"></i><b id="perf-perfect">'+p.perfect+'</b> perfeito(s)</span><span><i class="perf-dot"></i><b id="perf-good">'+p.good+'</b> bom(ns)</span><span><i class="perf-dot error"></i><b id="perf-misses">'+p.misses+'</b> não tocada(s)</span><span class="perf-time" id="perf-clock">'+(countin?"Contagem: "+p.countdown(performance.now()):p.index+" / "+p.total+" notas")+'</span></div>'+
   '<div class="performance-controls"><button class="btn '+(running||countin?"outline":"")+'" data-action="performance-toggle" id="perf-toggle">'+startLabel+'</button><button class="btn ghost" data-action="performance-reset">↻ Recomeçar</button><div class="tempo-selector" role="group" aria-label="Velocidade da música"><span>Velocidade</span>'+[60,80,100].map(v=>'<button class="tempo-chip '+(bpm===v?"active":"")+'" data-performance-bpm="'+v+'" '+(running||countin?"disabled":"")+'>'+v+'</button>').join("")+'<span>BPM</span></div></div>'+
   '<div class="performance-coach"><span id="performance-message" class="performance-coach-text">'+escapeHtml(current)+'</span><label class="latency-control">Compensação do microfone <input type="range" id="latency" min="0" max="300" step="10" value="'+p.latencyMs+'" '+(running||countin?"disabled":"")+'><span id="latency-value">'+p.latencyMs+' ms</span></label></div>'+
   '<p class="performance-hint">O som pode chegar com atraso ao navegador. Ajuste a compensação caso as notas sejam avaliadas sempre como atrasadas. Use fones de ouvido para evitar que o microfone capte o metrônomo.</p></section>';
}
export function performanceResultExtra(r){
  if(!r.performance)return "";
  const p=r.performance;
  const label=r.passed?"Você acompanhou o ritmo!":"Desafio concluído. Repita para melhorar.";
  const offsets=p.events.filter(e=>typeof e.offsetMs==="number").map(e=>e.offsetMs);
  const early=offsets.filter(t=>t<-80).length,late=offsets.filter(t=>t>80).length;
  const bias=early>late?"Você tende a antecipar as notas. Escute mais um pulso antes de tocar.":late>early?"Você tende a tocar depois do pulso. Prepare os dedos para a próxima nota.":"Seu tempo ficou relativamente equilibrado entre antecipações e atrasos.";
  const bars=p.events.map((e,i)=>{
    const grade=e.status||"miss";
    const title="Nota "+(i+1)+": "+(grade==="perfect"?"perfeita":grade==="good"?"boa":grade==="ok"?"fora do centro do pulso":"não tocada")+(typeof e.offsetMs==="number"?" ("+(e.offsetMs>0?"+":"")+e.offsetMs+" ms)":"");
    return '<span class="rhythm-note '+grade+'" title="'+escapeHtml(title)+'" aria-label="'+escapeHtml(title)+'">'+(i+1)+'</span>';
  }).join("");
  return '<div class="performance-summary"><strong>🎯 '+label+'</strong><div class="performance-summary-grid"><div><b>'+p.rhythmAccuracy+'%</b><span>Precisão rítmica</span></div><div><b>'+p.perfect+'</b><span>Notas perfeitas</span></div><div><b>'+p.bestCombo+'×</b><span>Melhor sequência</span></div><div><b>'+p.misses+'</b><span>Notas perdidas</span></div></div><div class="rhythm-note-title">Resultado nota por nota</div><div class="rhythm-note-list">'+bars+'</div><p>'+escapeHtml(bias)+'</p><p>Estimativa temporal sujeita à latência e às limitações do microfone. Verde indica acerto próximo ao pulso, amarelo indica precisão menor e vermelho indica nota não tocada.</p></div>';
}
