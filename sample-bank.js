/**
 * Amostras instrumentais REAIS: gravações CC0, armazenadas localmente no site.
 * Nenhuma música ou gravação comercial é distribuída. Os arquivos são carregados
 * somente ao reproduzir um exemplo do instrumento correspondente.
 * Qualquer codec não suportado (especialmente FLAC/OGG em Safari antigo) deve
 * cair na síntese atual, sem impedir a prática.
 */
export const SAMPLE_BANKS=Object.freeze({
 piano:[
  {midi:60,url:"/assets/samples/piano/c4.ogg"},
  {midi:67,url:"/assets/samples/piano/g4.ogg"}
 ],
 acoustic:[
  {midi:64,url:"/assets/samples/acoustic/e4.ogg"},
  {midi:69,url:"/assets/samples/acoustic/a4.ogg"}
 ],
 electric:[
  {midi:64,url:"/assets/samples/electric/e4.flac"},
  {midi:67,url:"/assets/samples/electric/g4.flac"}
 ],
 ukulele:[
  {midi:69,url:"/assets/samples/ukulele/a4.flac"},
  {midi:73,url:"/assets/samples/ukulele/cs5.flac"},
  {midi:77,url:"/assets/samples/ukulele/f5.flac"}
 ],
 bass:[
  {midi:31,url:"/assets/samples/bass/g1.flac"},
  {midi:39,url:"/assets/samples/bass/ds2.flac"}
 ]
});
const validBuffer=x=>x&&typeof x.length==="number"&&x.length>0&&Number.isFinite(x.duration)&&x.duration>.03;
export function closestSample(instrument,midi,buffers){
 const samples=SAMPLE_BANKS[instrument]||[];
 if(!Number.isFinite(midi)||!buffers)return null;
 const choices=samples.filter(x=>buffers.has(x.url));
 if(!choices.length)return null;
 const target=choices.reduce((best,next)=>Math.abs(midi-next.midi)<Math.abs(midi-best.midi)?next:best);
 const playbackRate=2**((midi-target.midi)/12);
 if(playbackRate<.32||playbackRate>4)return null;
 return {...target,buffer:buffers.get(target.url),playbackRate};
}
export class RealSampleBank{
 constructor(){this.buffers=new Map();this.inflight=new Map();this.failed=new Set();this.lastStatus="not-loaded"}
 async load(ctx,instrument){
  const sounds=SAMPLE_BANKS[instrument];
  if(!sounds||!ctx||typeof ctx.decodeAudioData!=="function"||typeof fetch!=="function")return 0;
  const results=await Promise.all(sounds.map(async item=>{
   if(this.buffers.has(item.url))return true;
   if(this.failed.has(item.url))return false;
   if(this.inflight.has(item.url))return this.inflight.get(item.url);
   const task=(async()=>{
    try{
     // Same-origin paths only, never load arbitrary third-party URLs.
     const response=await fetch(item.url,{cache:"force-cache"});
     if(!response.ok)throw Error("HTTP "+response.status);
     const bytes=await response.arrayBuffer();
     if(!bytes||bytes.byteLength<200||bytes.byteLength>1800000)throw Error("Amostra ausente ou excessiva");
     const buffer=await ctx.decodeAudioData(bytes.slice(0));
     if(!validBuffer(buffer))throw Error("Amostra inválida");
     this.buffers.set(item.url,buffer);
     return true;
    }catch(error){
     this.failed.add(item.url);
     return false;
    }finally{this.inflight.delete(item.url)}
   })();
   this.inflight.set(item.url,task);
   return task;
  }));
  const count=results.filter(Boolean).length;
  this.lastStatus=count?"sampled":"fallback";
  return count;
 }
 choice(instrument,midi){return closestSample(instrument,midi,this.buffers)}
 clear(){this.buffers.clear();this.failed.clear();this.inflight.clear();this.lastStatus="not-loaded"}
}
