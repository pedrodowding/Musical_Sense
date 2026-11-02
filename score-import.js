/**
 * Importação local, limitada a peças monofônicas simples.
 * A análise nunca publica, envia a servidores ou licencia conteúdo.
 * MIDI SMF 0/1 e MusicXML partwise não comprimido (.xml/.musicxml).
 */
const validNumber=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const MAX_BYTES=450000;
const MAX_NOTES=512;
function finalize(notes,{title="Sem título",composer="Autor não informado",bpm=80,format}={}){
 if(!notes.length||notes.length<3)throw Error("São necessárias pelo menos três notas válidas.");
 if(notes.length>MAX_NOTES)throw Error("Limite de 512 notas por arranjo nesta versão.");
 for(const [index,n] of notes.entries()){
  if(!Number.isInteger(n.m)||n.m<24||n.m>96)throw Error("Nota fora do registro suportado, na posição "+(index+1)+".");
  if(!validNumber(n.beats,.25,8))throw Error("Duração fora do intervalo suportado (¼ a 8 batidas), na nota "+(index+1)+".");
 }
 return {title:String(title).trim().slice(0,120)||"Sem título",
  composer:String(composer).trim().slice(0,120)||"Autor não informado",
  bpm:Math.max(35,Math.min(220,Math.round(Number(bpm)||80))),
  notes:notes.map(n=>({m:n.m,beats:Math.round(n.beats*1000)/1000})),
  format,polyphonic:false,importedCount:notes.length};
}
const elementText=(root,selector)=>root?.querySelector?.(selector)?.textContent?.trim()||"";
const nodeChildren=(element,tag)=>Array.from(element?.children||[]).filter(n=>n.localName===tag);
export function parseMusicXML(source){
 if(typeof source!=="string"||!source.trim())throw Error("Partitura MusicXML vazia.");
 if(source.length>MAX_BYTES)throw Error("Arquivo MusicXML maior que 450 KB.");
 if(/<!DOCTYPE|<!ENTITY/i.test(source))throw Error("Importação XML não aceita DTD ou entidades externas.");
 if(typeof DOMParser!=="function")throw Error("Este navegador não oferece o leitor de partituras XML.");
 const doc=new DOMParser().parseFromString(source,"application/xml");
 if(doc.querySelector("parsererror")||doc.documentElement?.localName!=="score-partwise")
  throw Error("MusicXML inválido ou formato não suportado. Use score-partwise não comprimido.");
 const parts=Array.from(doc.getElementsByTagName("part"));
 if(parts.length!==1)throw Error("Escolha uma partitura MusicXML de apenas uma parte. Arranjos com vários instrumentos exigem edição.");
 const measures=nodeChildren(parts[0],"measure");
 if(!measures.length)throw Error("A partitura não possui compassos.");
 if(measures.length>256)throw Error("A partitura excede 256 compassos.");
 let divisions=1,tempo=80;
 const tempoNode=doc.querySelector("direction sound[tempo], sound[tempo]");
 if(tempoNode)tempo=Number(tempoNode.getAttribute("tempo"))||80;
 else{
  const metronome=doc.querySelector("direction metronome per-minute");
  if(metronome)tempo=Number(metronome.textContent)||80;
 }
 const notes=[];
 let ongoingTie=null;
 for(const measure of measures){
  for(const child of Array.from(measure.children||[])){
   const tag=child.localName;
   if(tag==="attributes"){
    const d=Number(elementText(child,"divisions")||divisions);
    if(!validNumber(d,1,16383))throw Error("Divisões rítmicas inválidas.");divisions=d;
   }
   if(tag==="backup"||tag==="forward")throw Error("Partitura com múltiplas vozes não suportada na importação inicial.");
   if(tag==="direction"){
    const t=child.querySelector?.("sound[tempo]");
    if(t&&Number(t.getAttribute("tempo"))!==tempo)throw Error("Mudanças de andamento exigem edição musical antes da publicação.");
   }
   if(tag!=="note")continue;
   if(child.querySelector?.("chord"))throw Error("Acordes simultâneos não são suportados. Importe uma melodia monofônica.");
   if(child.querySelector?.("rest"))throw Error("Compassos com pausas exigem adaptação editorial antes da prática.");
   if(child.querySelector?.("grace"))throw Error("Notas de ornamento precisam de adaptação editorial.");
   const voice=elementText(child,"voice");if(voice&&voice!=="1")throw Error("Apenas a voz 1 é suportada.");
   const duration=Number(elementText(child,"duration"));
   const step=elementText(child,"pitch step").toUpperCase();
   const octave=Number(elementText(child,"pitch octave"));
   const alter=Number(elementText(child,"pitch alter")||0);
   const base={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[step];
   if(base===undefined||!Number.isInteger(octave)||!Number.isInteger(alter)||!validNumber(duration,1,131064))
    throw Error("Notas ou duração inválidas no MusicXML.");
   const m=(octave+1)*12+base+alter,beats=duration/divisions;
   const ties=Array.from(child.querySelectorAll?.("tie")||[]).map(t=>t.getAttribute("type"));
   if(ties.includes("stop")){
    if(!ongoingTie||ongoingTie.m!==m)throw Error("Ligadura sem início correspondente.");
    ongoingTie.beats+=beats;
    if(!ties.includes("start"))ongoingTie=null;
    continue;
   }
   if(ongoingTie)throw Error("Ligadura não finalizada na partitura.");
   const n={m,beats};notes.push(n);
   if(ties.includes("start"))ongoingTie=n;
  }
 }
 if(ongoingTie)throw Error("Ligadura não finalizada.");
 return finalize(notes,{
  title:elementText(doc,"work work-title")||elementText(doc,"movement-title")||"Partitura importada",
  composer:elementText(doc,"identification creator[type='composer']")||"Autor não informado",
  bpm:tempo,format:"MusicXML"
 });
}
const uint16=(bytes,p)=>(bytes[p]<<8)|bytes[p+1];
const uint32=(bytes,p)=>((bytes[p]*16777216)+(bytes[p+1]<<16)+(bytes[p+2]<<8)+bytes[p+3])>>>0;
function vlq(bytes,state,end){
 let out=0;
 for(let i=0;i<4;i++){
  if(state.pos>=end)throw Error("MIDI incompleto.");
  const b=bytes[state.pos++];out=(out<<7)|(b&127);
  if(!(b&128))return out;
 }
 throw Error("Delta time MIDI inválido.");
}
export function parseMIDI(raw){
 const b=raw instanceof Uint8Array?raw:raw instanceof ArrayBuffer?new Uint8Array(raw):null;
 if(!b||b.length<22||b.length>MAX_BYTES)throw Error("Arquivo MIDI inválido ou maior que 450 KB.");
 if(String.fromCharCode(...b.slice(0,4))!=="MThd")throw Error("Cabeçalho MIDI ausente.");
 const hsize=uint32(b,4),format=uint16(b,8),trackCount=uint16(b,10),ppq=uint16(b,12);
 if(hsize<6||hsize>256||![0,1].includes(format)||trackCount<1||trackCount>16||ppq===0||(ppq&0x8000))
  throw Error("Formato MIDI não suportado. Envie SMF 0/1 com tempo em PPQN.");
 if(format===0&&trackCount!==1)throw Error("MIDI tipo 0 com múltiplas trilhas inválido.");
 let ptr=8+hsize;const events=[],tempos=[];
 for(let track=0;track<trackCount;track++){
  if(ptr+8>b.length||String.fromCharCode(...b.slice(ptr,ptr+4))!=="MTrk")
   throw Error("Estrutura de trilha MIDI inválida.");
  const len=uint32(b,ptr+4),end=ptr+8+len;if(end>b.length)throw Error("Trilha MIDI truncada.");
  const st={pos:ptr+8};let tick=0,running=0;
  while(st.pos<end){
   tick+=vlq(b,st,end);
   let status=b[st.pos];if(status<0x80){if(!running)throw Error("Running status MIDI inválido.");status=running}
   else{st.pos++;if(status<0xf0)running=status;else running=0}
   if(status===0xff){
    if(st.pos>=end)throw Error("Evento de metadados truncado.");
    const type=b[st.pos++],size=vlq(b,st,end);
    if(st.pos+size>end)throw Error("Metadados MIDI inválidos.");
    if(type===0x51&&size===3){
     const micro=(b[st.pos]<<16)|(b[st.pos+1]<<8)|b[st.pos+2];if(micro>0)tempos.push({tick,bpm:60000000/micro});
    }
    st.pos+=size;
    if(type===0x2f)break;
   }else if(status===0xf0||status===0xf7){
    const size=vlq(b,st,end);st.pos+=size;
    if(st.pos>end)throw Error("Evento SysEx truncado.");
   }else{
    const kind=status&0xf0,channel=status&0xf;
    const size=(kind===0xc0||kind===0xd0)?1:2;
    if(st.pos+size>end)throw Error("Evento MIDI truncado.");
    const key=b[st.pos++],value=size===2?b[st.pos++]:0;
    if(key>=128||value>=128)throw Error("Byte de dados MIDI inválido.");
    if(kind===0x90&&value>0)events.push({tick,type:"on",key,channel,track});
    if(kind===0x80||(kind===0x90&&value===0))events.push({tick,type:"off",key,channel,track});
   }
  }
  ptr=end;
 }
 if(tempos.some(t=>t.tick>0))throw Error("MIDI com mudanças de BPM exige adaptação antes da publicação.");
 const bpm=tempos.length?tempos[0].bpm:120;
 if(!validNumber(bpm,35,220))throw Error("BPM do MIDI fora da faixa de 35 a 220.");
 events.sort((a,b)=>a.tick-b.tick||(a.type==="off"?-1:1));
 const active=new Map(),notes=[];
 for(const e of events){
  const id=e.track+":"+e.channel+":"+e.key;
  if(e.type==="on"){
   if(active.size)throw Error("O MIDI possui notas simultâneas. Selecione uma trilha monofônica antes de importar.");
   active.set(id,e);
  }else{
   const start=active.get(id);if(!start)continue;active.delete(id);
   if(e.tick<=start.tick)continue;
   notes.push({m:e.key,tick:start.tick,end:e.tick});
  }
 }
 if(active.size)throw Error("Há notas MIDI sem término.");
 notes.sort((a,b)=>a.tick-b.tick);
 if(notes.length<3)throw Error("O MIDI não contém uma melodia com ao menos três notas.");
 const result=[];
 for(let i=0;i<notes.length;i++){
  const n=notes[i],next=notes[i+1];
  const gap=next?(next.tick-n.end)/ppq:0;
  if(gap>.25)throw Error("MIDI com pausas longas exige adaptação antes de publicar.");
  const beats=(n.end-n.tick)/ppq;
  result.push({m:n.m,beats:Math.max(.25,beats+Math.max(0,gap))});
 }
 return finalize(result,{bpm,title:"Melodia MIDI importada",format:"MIDI"});
}
export function draftFromImport(preview,{title,composer,genre="Melodias",instrument="piano",license="original",sourceUrl="",evidence=""}={}){
 const names=["piano","keyboard","acoustic","electric","ukulele","bass-guitar"];
 if(!names.includes(instrument))throw Error("Instrumento não suportado para publicação de melodias.");
 if(!["original","CC0","CC-BY","public-domain","permission"].includes(license))throw Error("Tipo de licença inválido.");
 const label=String(title||preview.title||"Melodia").trim().slice(0,120);
 const who=String(composer||preview.composer||"Autor não informado").trim().slice(0,120);
 if(!label||!who)throw Error("Informe o título e o compositor.");
 const id="import-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
 return {schema:"musical-sense-catalog",version:1,works:[{
  id,title:label,composer:who,genre:String(genre||"Melodias").slice(0,45),license,
  sourceUrl:String(sourceUrl||"").trim(),evidence:String(evidence||"").trim().slice(0,400),
  status:"draft",rightsVerified:false
 }],arrangements:[{
  id:id+"-arr",workId:id,instrument,kind:"song",difficulty:1,
  bpm:preview.bpm,notes:preview.notes,description:"Melodia monofônica importada de "+preview.format,
  status:"draft"
 }]};
}
