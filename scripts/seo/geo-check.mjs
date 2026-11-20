#!/usr/bin/env node
import fs from "node:fs/promises";
const base="https://www.vanillasometh.in", checks=[];
for(const [file,needles] of [["public/llms.txt",["Vanilla & Somethin'","/seo","/contact/"]],["public/robots.txt",["User-agent: *","Sitemap:"]],["public/sitemap.xml",["sitemap-pages.xml","sitemap-locations.xml","sitemap-cms.xml"]]]){
 const content=await fs.readFile(file,"utf8");
 for(const needle of needles)checks.push({file,needle,ok:content.includes(needle)});
}
const failures=checks.filter(c=>!c.ok);
console.log(JSON.stringify({site:base,checks,notice:"Crawlability/navigation checks only; no guarantee of AI citations or rankings."},null,2));
if(failures.length)process.exitCode=1;
