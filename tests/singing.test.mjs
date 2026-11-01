import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=async name=>import("data:text/javascript;base64,"+readFileSync(new URL("../"+name,import.meta.url)).toString("base64"));
const {VOCAL_SONGS,vocalById}=await load("singing-data.js");
const {SingingSession}=await load("singing-engine.js");
const {parseLyrics,createPersonalSong,safeLibrary}=await load("lyrics-library.js");

test("conteúdos originais possuem letra alinhada, BPM e direitos distintos",()=>{
 assert.ok(VOCAL_SONGS.length>=3);
 for(const s of VOCAL_SONGS){
  assert.equal(s.source.type,"original");assert.equal(s.source.lyricsRights,true);
  assert.equal(s.source.recordingRights,false);assert.ok(s.bpm>=60);
  assert.equal(s.phrases.at(-1).endBeat,s.totalBeats);
  for(const step of s.steps){assert.ok(step.syllable&&Number.isInteger(step.m));assert.ok(step.beats>0)}
 }
 assert.equal(vocalById("inexistente"),null);
});
test("voz afinada e sustentada durante a nota marca acerto sem reconhecer palavras",()=>{
 const song=VOCAL_SONGS[0],s=new SingingSession(song,{latencyMs:130});
 s.start(100);s.tick(s.startAt);
 for(let i=0;i<song.steps.length;i++){
   const step=song.steps[i],begin=s.noteAt(i);
   for(let d=0;d<step.beats*s.beatMs-90;d+=65)
     s.sample({note:step.m,cents:0,rms:.12,confidence:.96},begin+s.latencyMs+d);
   s.tick(s.noteEnd(i)+s.latencyMs+1);
 }
 const r=s.summary();assert.equal(r.accuracy,100);assert.equal(r.accepted,r.total);
 assert.equal(r.validWords,false);
});
test("silêncio não gera nota afinada ou XP fictício",()=>{
 const s=new SingingSession(VOCAL_SONGS[0]);s.start(0);
 s.tick(s.startAt+s.totalBeats*s.beatMs+s.latencyMs+500);
 const r=s.summary();assert.equal(r.accepted,0);assert.equal(r.missed,r.total);
});
test("cantar outra nota diminui a precisão",()=>{
 const song=VOCAL_SONGS[0],s=new SingingSession(song);s.start(0);s.tick(s.startAt);
 const begin=s.noteAt(0);
 for(let d=0;d<750;d+=65)s.sample({note:song.steps[0].m+2,cents:0,rms:.12,confidence:.95},begin+s.latencyMs+d);
 s.tick(s.noteEnd(0)+s.latencyMs+1);
 assert.equal(s.events[0].status,"wrong");
});
test("registro vocal ajusta uma oitava sem mudar a música de origem",()=>{
 const song=VOCAL_SONGS[0],s=new SingingSession(song,{transpose:-12});s.start(0);s.tick(s.startAt);
 const start=s.noteAt(0);
 for(let d=0;d<750;d+=65)s.sample({note:song.steps[0].m-12,cents:0,rms:.12,confidence:.99},start+s.latencyMs+d);
 s.tick(s.noteEnd(0)+s.latencyMs+1);
 assert.ok(["good","perfect"].includes(s.events[0].status));
 assert.equal(song.steps[0].m,60);
});
test("pausa não consome notas",()=>{
 const s=new SingingSession(VOCAL_SONGS[0]);s.start(0);s.tick(s.startAt);
 assert.equal(s.pause(s.startAt+100),true);s.tick(1e7);assert.equal(s.index,0);
 assert.equal(s.resume(1e7),true);assert.equal(s.phase,"running");
});
test("letras LRC em ordem inversa são ordenadas e aceitam offset",()=>{
 const parsed=parseLyrics("[ar:Autora]\n[00:05.00]Segundo\n[offset:+100]\n[00:01.50]Primeiro");
 assert.equal(parsed.lines[0].text,"Primeiro");assert.equal(parsed.lines[0].atMs,1600);
 assert.equal(parsed.lines[1].atMs,5100);assert.equal(parsed.metadata.ar,"Autora");
});
test("texto simples recebe tempos estimados, mas não vira melodia",()=>{
 const parsed=parseLyrics("Linha um\nLinha dois\nLinha três");
 assert.equal(parsed.timed,false);assert.equal(parsed.lines[1].atMs,3500);
 const song=createPersonalSong({title:"Minha obra",lyrics:"Linha um\nLinha dois",rightsConfirmed:true});
 assert.equal(song.kind,"lyrics-only");assert.equal("steps" in song,false);
});
test("a declaração de direitos é obrigatória",()=>{
 assert.throws(()=>createPersonalSong({title:"Música",lyrics:"Linha",rightsConfirmed:false}),/autorização/);
});
test("biblioteca não aceita itens estruturados arbitrariamente",()=>{
 assert.equal(safeLibrary([{id:"x",kind:"unknown",lines:[]}]).length,0);
 const saved=createPersonalSong({title:"Minha",lyrics:"[00:01.00]Oi",rightsConfirmed:true});
 assert.equal(safeLibrary([saved]).length,1);
});
