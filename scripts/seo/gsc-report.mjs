#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const input = process.argv[2];
if (!input) { console.error("Usage: node scripts/seo/gsc-report.mjs <Search-Console-CSV-export>"); process.exit(2); }
const raw = await fs.readFile(input, "utf8");
function parseCsv(text) {
  const rows=[]; let row=[], field="", quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i], n=text[i+1];
    if(c === '"' && quoted && n === '"'){field+='"';i++;}
    else if(c === '"') quoted=!quoted;
    else if(c === ',' && !quoted){row.push(field);field="";}
    else if((c === "\n" || c === "\r") && !quoted){if(c==="\r"&&n==="\n")i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field="";}
    else field+=c;
  }
  row.push(field); if(row.some(v=>v.trim())) rows.push(row);
  return rows;
}
const parsed=parseCsv(raw);
const headers=parsed.shift().map(v=>v.trim().toLowerCase());
const qi=headers.findIndex(h=>["top queries","query","queries"].includes(h));
const ci=headers.indexOf("clicks"), ii=headers.indexOf("impressions"), ti=headers.indexOf("ctr"), pi=headers.findIndex(h=>["position","avg. position","average position"].includes(h));
if(qi<0 || ci<0 || ii<0) throw new Error("CSV must contain query, clicks and impressions columns. Export the Search Console Queries table.");
const data=parsed.map(r=>({query:r[qi]||"",clicks:Number((r[ci]||"0").replaceAll(",","")),impressions:Number((r[ii]||"0").replaceAll(",","")),ctr:ti>=0?r[ti]:null,position:pi>=0?r[pi]:null})).filter(r=>r.query);
const opportunities=data.filter(r=>r.impressions>=10).sort((a,b)=>b.impressions-a.impressions).slice(0,100);
const report={generatedAt:new Date().toISOString(),source:path.basename(input),rows:data.length,totalClicks:data.reduce((s,r)=>s+r.clicks,0),totalImpressions:data.reduce((s,r)=>s+r.impressions,0),opportunities};
await fs.mkdir("reports/seo",{recursive:true});
await fs.writeFile("reports/seo/keyword-opportunities.json",JSON.stringify(report,null,2));
const md=["# Search Console keyword opportunities","",`Generated: ${report.generatedAt}`,`Rows: ${report.rows}`,`Clicks: ${report.totalClicks}`,`Impressions: ${report.totalImpressions}`,"","| Query | Clicks | Impressions | CTR | Position |","|---|---:|---:|---:|---:|",...opportunities.map(r=>`| ${r.query.replaceAll("|","\\|")} | ${r.clicks} | ${r.impressions} | ${r.ctr??"n/a"} | ${r.position??"n/a"} |`)].join("\n");
await fs.writeFile("reports/seo/keyword-opportunities.md",md+"\n");
console.log(`Processed ${data.length} query rows. Reports saved to reports/seo/.`);
