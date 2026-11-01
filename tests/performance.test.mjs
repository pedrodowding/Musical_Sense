import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const path=new URL("../performance-engine.js",import.meta.url);
const src=readFileSync(path);
const {PerformanceSession}=await import("data:text/javascript;base64,"+src.toString("base64"));
const steps=[{m:60,beats:1},{m:62,beats:1},{m:64,beats:2},{m:65,beats:1}];
const make=(options={})=>new PerformanceSession(steps,options);

test("contagem inicial de quatro tempos precede a primeira nota",()=>{
 const p=make({bpm:80});p.start(1000);
 assert.equal(p.phase,"countin");assert.equal(p.countdown(1000),4);
 p.tick(3999);assert.equal(p.phase,"countin");
 p.tick(4000);assert.equal(p.phase,"running");
});
test("microfone tem compensação de latência ajustável",()=>{
 const p=make({latencyMs:160});p.start(0);p.tick(3000);
 const r=p.receive({note:60,source:"microphone",cents:1},3160);
 assert.equal(r.status,"perfect");assert.equal(p.index,1);assert.equal(p.hits,1);
 p.setLatency(350);assert.equal(p.latencyMs,350);
 p.setLatency(-20);assert.equal(p.latencyMs,0);
});
test("MIDI usa horário do evento sem a compensação do microfone",()=>{
 const p=make();p.start(0);p.tick(3000);
 const result=p.receive({note:60,source:"midi"},3000);
 assert.equal(result.status,"perfect");
});
test("nota errada não avança a linha de execução",()=>{
 const p=make();p.start(0);p.tick(3000);
 const result=p.receive({note:61,source:"midi"},3000);
 assert.equal(result.type,"wrong");assert.equal(p.index,0);assert.equal(p.wrongByNote[0],1);
});
test("notas perdidas avançam automaticamente",()=>{
 const p=make({bpm:80,latencyMs:160});p.start(0);p.tick(3000);
 p.tick(3000+p.windowMs+p.latencyMs+1);
 assert.equal(p.index,1);assert.equal(p.misses,1);
 assert.equal(p.events[0].status,"miss");
});
test("pausa e retomada preservam a janela de acerto",()=>{
 const p=make();p.start(0);p.tick(3000);
 const original=p.expectedAt(1);
 assert.equal(p.pause(3200),true);p.tick(100000);
 assert.equal(p.index,0);assert.equal(p.resume(100000),true);
 assert.equal(p.expectedAt(1),original+96800);
});
test("velocidade muda os intervalos da partitura",()=>{
 const slow=make({bpm:60}),fast=make({bpm:100});
 assert.equal(slow.beatMs,1000);assert.equal(fast.beatMs,600);
 assert.equal(slow.beats[3],4);assert.equal(fast.beats[3],4);
});
test("não aceita nota muito antecipada",()=>{
 const p=make({bpm:80});p.start(0);p.tick(3000);
 const r=p.receive({note:60,source:"midi"},2550);
 assert.equal(r.type,"early");assert.equal(p.index,0);
});
test("completar todas as notas produz resumo objetivo",()=>{
 const p=make({bpm:80});p.start(0);p.tick(3000);
 for(let i=0;i<steps.length;i++)p.receive({note:steps[i].m,source:"midi"},p.expectedAt(i));
 assert.equal(p.phase,"finished");
 const report=p.summary();
 assert.equal(report.hits,4);assert.equal(report.perfect,4);
 assert.equal(report.accuracy,100);assert.equal(report.rhythmAccuracy,100);
 assert.equal(report.difficultRange,null);
});
test("repete trecho com pior acerto incluindo erros corrigidos",()=>{
 const p=make({bpm:80});p.start(0);p.tick(3000);
 p.receive({note:66,source:"midi"},p.expectedAt(0));
 p.receive({note:60,source:"midi"},p.expectedAt(0));
 p.tick(p.expectedAt(1)+p.windowMs+p.latencyMs+1);
 const region=p.difficultRange();
 assert.ok(region);assert.ok(region.start<=1&&region.end>1);
 assert.equal(p.wrongByNote[0],1);
});
test("um toque correto repetido exige um novo evento",()=>{
 const repeated=new PerformanceSession([{m:60,beats:1},{m:60,beats:1}]);repeated.start(0);repeated.tick(3000);
 repeated.receive({note:60,source:"midi"},3000);
 assert.equal(repeated.index,1);
 assert.equal(repeated.receive({note:60,source:"midi"},3000).type,"early");
 assert.equal(repeated.index,1);
 repeated.receive({note:60,source:"midi"},3750);
 assert.equal(repeated.index,2);
});
