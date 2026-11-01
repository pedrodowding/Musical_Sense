/**
 * Biblioteca pessoal: apenas letras fornecidas por usuário com declaração de direitos.
 * Os dados são locais. Letras não são baixadas automaticamente de sites terceiros.
 */
export function parseLyrics(content,{maxChars=20000,maxLines=180}={}){
 const input=String(content??"").replace(/\r\n?/g,"\n").trim();
 if(!input||input.length>maxChars)throw Error("A letra deve conter de 1 a "+maxChars+" caracteres.");
 const raw=input.split("\n").map(s=>s.trim()).filter(Boolean);
 if(raw.length>maxLines)throw Error("A letra deve ter no máximo "+maxLines+" linhas.");
 const lines=[],metadata={},offsetMatch=input.match(/\[offset:([+-]?\d+)\]/i);
 const offset=offsetMatch?Math.max(-10000,Math.min(10000,Number(offsetMatch[1]))):0;
 let stamped=false;
 for(const line of raw){
   const meta=line.match(/^\[(ar|ti|al|by|length):([^\]]{1,200})\]$/i);
   if(meta){metadata[meta[1].toLowerCase()]=meta[2].trim();continue}
   if(/^\[offset:[^\]]+\]$/i.test(line))continue;
   const times=[...line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
   const text=line.replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g,"").trim();
   if(times.length&&text){
     stamped=true;
     for(const m of times){
       const mins=Number(m[1]),seconds=Number(m[2]);
       if(seconds>=60)continue;
       const frac=m[3]?Number(m[3].padEnd(3,"0").slice(0,3)):0;
       lines.push({atMs:Math.max(0,mins*60000+seconds*1000+frac+offset),text});
     }
   }else if(text&&!/^\[.+\]$/.test(text))lines.push({atMs:null,text});
 }
 if(lines.length===0)throw Error("Não encontrei linhas válidas na letra.");
 lines.sort((a,b)=>(a.atMs??Infinity)-(b.atMs??Infinity));
 if(stamped){
   // Preenche linhas sem marcação somente após a última marca registrada.
   let last=Math.max(...lines.filter(l=>l.atMs!==null).map(l=>l.atMs));
   for(const line of lines){if(line.atMs===null){last+=3000;line.atMs=last}}
   lines.sort((a,b)=>a.atMs-b.atMs);
 }else lines.forEach((line,i)=>{line.atMs=i*3500});
 return {lines,metadata,timed:stamped,durationMs:lines[lines.length-1].atMs+4000};
}
export function createPersonalSong({title,artist="",lyrics,rightsConfirmed=false}){
 if(!rightsConfirmed)throw Error("Confirme que você tem autorização para armazenar e utilizar esta letra.");
 const name=String(title||"").trim().slice(0,100);
 if(name.length<2)throw Error("Digite o título da música.");
 const result=parseLyrics(lyrics);
 return {
  id:"personal-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),title:name,artist:String(artist||"").trim().slice(0,100)||"Biblioteca pessoal",
  lines:result.lines,timed:result.timed,durationMs:result.durationMs,
  rights:{type:"user-attested",acknowledgedAt:Date.now(),source:"user-local"},
  createdAt:Date.now(),kind:"lyrics-only",metadata:result.metadata
 };
}
export function safeLibrary(songs){
 if(!Array.isArray(songs))return [];
 return songs.filter(song=>song&&typeof song.id==="string"&&song.kind==="lyrics-only"&&Array.isArray(song.lines))
 .slice(0,50).map(song=>({...song,lines:song.lines.slice(0,180).map(x=>({text:String(x.text||"").slice(0,300),atMs:Math.max(0,Number(x.atMs)||0)}))}));
}
