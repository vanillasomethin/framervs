#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
const root=path.resolve("public"), results=[];
async function walk(dir){
 for(const e of await fs.readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){if(!["admin","cdn-cgi","uploads"].includes(e.name))await walk(p);}
  else if(e.isFile()&&e.name.endsWith(".html")){
   const html=await fs.readFile(p,"utf8");
   for(const [i,m] of [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].entries()){
    try{const value=JSON.parse(m[1]);const types=Array.isArray(value)?value.map(x=>x?.["@type"]).flat():[value?.["@type"]];results.push({file:path.relative(root,p),block:i+1,valid:true,types:types.filter(Boolean)});}
    catch(error){results.push({file:path.relative(root,p),block:i+1,valid:false,error:error.message});}
   }
  }
 }
}
await walk(root);
const invalid=results.filter(x=>!x.valid);
console.log(JSON.stringify({filesWithSchema:new Set(results.map(x=>x.file)).size,blocks:results.length,invalid},null,2));
if(invalid.length)process.exitCode=1;
