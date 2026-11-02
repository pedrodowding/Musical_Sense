#!/usr/bin/env node
/**
 * Validador editorial e gerador do catálogo público.
 * Nunca publica conteúdo sem obra, arranjo e direitos aprovados.
 * Executar: node scripts/build-catalog.mjs [--check]
 */
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(resolve(root,"catalog-model.js"),"utf8");
const esm=source.replace(/^export /gm,"");
const {validateEditorialCatalog}=new Function(esm+";return {validateEditorialCatalog};")();
const filename=resolve(root,"data/catalog.json");
const output=resolve(root,"catalog-published.js");
const input=JSON.parse(readFileSync(filename,"utf8"));
const validated=validateEditorialCatalog(input);
if(!validated.valid){
 console.error("Catálogo rejeitado:\n"+validated.errors.map(e=>"• "+e).join("\n"));
 process.exit(1);
}
const result="// Gerado por scripts/build-catalog.mjs. Não editar diretamente.\n"+
 "export const PUBLISHED_CATALOG = "+JSON.stringify(validated.published,null,2)+";\n";
if(process.argv.includes("--check")){
 const actual=readFileSync(output,"utf8");
 if(actual!==result){console.error("Catálogo gerado desatualizado. Execute node scripts/build-catalog.mjs");process.exit(1)}
 console.log("Catálogo válido e sincronizado: "+validated.published.arrangements.length+" arranjos publicados.");
}else{
 writeFileSync(output,result,"utf8");
 console.log("Catálogo editorial validado. Obras: "+validated.worksCount+
 ", arranjos: "+validated.count+", publicados: "+validated.published.arrangements.length+".");
}
