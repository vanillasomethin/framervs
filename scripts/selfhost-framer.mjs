#!/usr/bin/env node
// Makes the Framer pages run without framerusercontent.com.
//
// What it does (one-off; the results are committed):
//  1. copies the export's js/ folder (the Framer runtime and every page/component
//     module) to public/js/
//  2. downloads every image, font and file the pages and modules point at into
//     public/fr/ (same paths as on Framer's CDN)
//  3. rewrites the pages and modules to use those local copies
//  4. drops the editor bridge and Framer's analytics beacon
//
// The Framer runtime itself is kept, so every animation, scroll effect and
// interaction behaves exactly as before.
//
// Usage: node scripts/selfhost-framer.mjs <extracted-export-folder> [--dry]

import { mkdir, readFile, writeFile, readdir, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const exportDir = process.argv[2];
const dry = process.argv.includes("--dry");
if (!exportDir) { console.error("Usage: node scripts/selfhost-framer.mjs <export-folder> [--dry]"); process.exit(1); }
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const CDN = "https://framerusercontent.com/";

// 1. URL -> local file mapping the export was built with
const rerouter = await readFile(join(exportDir, "js", "rerouter.js"), "utf8");
const mapText = rerouter.match(/exflowUrlmapping=\{("https:.*?)\},c\.exflowSkipUrls/s)?.[1];
if (!mapText) throw new Error("Could not read the URL mapping from js/rerouter.js");
const mapping = JSON.parse(`{${mapText}}`);
const localFor = new Map();
for (const [url, file] of Object.entries(mapping)) {
  if (url.startsWith(CDN) || url.startsWith("https://framer.com/m/")) localFor.set(url, `/${file.replace(/^(js\/framer-module-[a-z]+)\.js-0\.0\.57$/, "$1.mjs")}`);
}
localFor.delete("https://framer.com/edit/init.mjs");
// CMS modules resolve their data files relative to their own URL, so they keep their CDN-shaped path under /fr/
for (const url of [...localFor.keys()]) if (url.startsWith(`${CDN}modules/`) || url.startsWith(`${CDN}cms/`)) localFor.delete(url);

// 2. copy js/
const jsFiles = (await readdir(join(exportDir, "js"))).filter((f) => f !== "rerouter.js" && f !== "init.mjs");
if (!dry) {
  await mkdir(join(pub, "js"), { recursive: true });
  for (const f of jsFiles) await copyFile(join(exportDir, "js", f), join(pub, "js", f.replace(/^(framer-module-[a-z]+)\.js-0\.0\.57$/, "$1.mjs")));
}
console.log(`copied ${jsFiles.length} files to public/js`);

// 3. find the pages and modules to rewrite
const walk = async (dir, out = []) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (["fr", "js", "estimator", "admin", "cms", "uploads", "node_modules", "brand", "blog", "projects", "updates", "shop"].includes(e.name) && dir === pub) continue;
      await walk(p, out);
    } else if (/\.(html|mjs|js|json|framercms)$/.test(e.name)) out.push(p);
  }
  return out;
};
const pages = (await walk(pub)).filter((f) => !f.endsWith("content.json") && !f.endsWith("content-loader.js"));
const modules = jsFiles.filter((f) => /\.(mjs|js|json)$/.test(f)).map((f) => join(pub, "js", f));
const frModules = [];
const walkFr = async (dir) => {
  if (!existsSync(dir)) return;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walkFr(p);
    else if (/\.m?js$/.test(e.name)) frModules.push(p);
  }
};
await walkFr(join(pub, "fr"));
const targets = [...new Set([...pages, ...modules, ...frModules])].filter((f) => existsSync(f));

// 4. gather CDN URLs that are not in the mapping
const URL_RE = /https:\/\/framerusercontent\.com\/[A-Za-z0-9/_.%@~+=-]+/g;
const needed = new Set();
const texts = new Map();
for (const f of targets) {
  const t = await readFile(f, "utf8");
  texts.set(f, t);
  for (const m of t.matchAll(URL_RE)) if (!localFor.has(m[0])) needed.add(m[0]);
  // already rewritten on an earlier run: fetch anything under /fr/ that is missing
  for (const m of t.matchAll(/["'`(=,]\/fr\/((?:images|assets|sites|modules|cms|third-party-assets)\/[A-Za-z0-9/_.%@~+=-]+)/g)) needed.add(`${CDN}${m[1]}`);
}
console.log(`${needed.size} CDN files to download`);

const download = async (url) => {
  const path = new URL(url).pathname.replace(/^\//, "");
  const dest = join(pub, "fr", decodeURIComponent(path));
  if (existsSync(dest)) return "have";
  const response = await fetch(url);
  if (!response.ok) return `HTTP ${response.status}`;
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await response.arrayBuffer()));
  return "ok";
};
if (!dry) {
  const queue = [...needed];
  const failed = [];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      try { const r = await download(url); if (r !== "ok" && r !== "have") failed.push(`${url} ${r}`); } catch (e) { failed.push(`${url} ${e.message}`); }
    }
  }));
  console.log(failed.length ? `FAILED:\n${failed.join("\n")}` : "all downloaded");
}

// 4b. modules downloaded from the CDN import their siblings by relative path: fetch those too
if (!dry) {
  const REL = /(?:from\s*|import\s*\(\s*|import\s*)["'](\.\.?\/[^"']+)["']/g;
  for (let round = 0; round < 6; round += 1) {
    const found = new Set();
    const walkFr = async (dir) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) await walkFr(p);
        else if (/\.m?js$/.test(e.name)) {
          const text = await readFile(p, "utf8");
          for (const m of text.matchAll(REL)) {
            const target = new URL(m[1], `${CDN}${relative(join(pub, "fr"), p).split("\\").join("/")}`);
            const dest = join(pub, "fr", decodeURIComponent(target.pathname.replace(/^\//, "")));
            if (!existsSync(dest)) found.add(target.href);
          }
        }
      }
    };
    await walkFr(join(pub, "fr"));
    if (!found.size) break;
    console.log(`round ${round + 1}: ${found.size} imported modules`);
    for (const url of found) { try { await download(url); } catch (e) { console.log("failed", url, e.message); } }
  }
}

// 5. rewrite
let changed = 0;
for (const [f, original] of texts) {
  let t = original;
  for (const [url, local] of localFor) t = t.split(url).join(local);
  t = t.split(CDN).join("/fr/");
  // Phosphor icons are imported by name at runtime; the three this site uses are saved as /js/framer-module-<name>.js-0.0.57
  // new URL(relative, base): the base must be absolute
  t = t.replace(/new URL\((`[^`]*`|"[^"]*"),\s*(`\/(?:js|fr)\/[^`]*`|"\/(?:js|fr)\/[^"]*")\)/g, "new URL($1,location.origin+$2)");
  t = t.split("https://framer.com/edit/init.mjs").join("/js/vs-noop.mjs");
  t = t.split("fn=`https://framer.com/m/phosphor-icons/`").join("fn=`/js/framer-module-`");
  t = t.split("import(`${fn}${v}.js@0.0.57`)").join("import(`${fn}${v.toLowerCase()}.mjs`)");
  t = t.split("import(`${fn}${v.toLowerCase()}.js-0.0.57`)").join("import(`${fn}${v.toLowerCase()}.mjs`)");
  t = t.replace(/<script[^>]*cdn-cgi\/scripts\/[^>]*><\/script>/g, "");
  // editor bridge and Framer analytics
  t = t.replace(/<script>\s*try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)\)\{[^<]*<\/script>/g, "");
  t = t.replace(/<script[^>]*src="(?:https:\/\/events\.framer\.com|\/_noop)\/[^"]*"[^>]*><\/script>/g, "");
  t = t.split("https://events.framer.com/").join("/_noop/");
  if (f.endsWith(".html") && /\/js\/|\/fr\/sites\//.test(t) && !t.includes("/js/vs-framercms-range.js")) t = t.replace(/<head([^>]*)>/, '<head$1><script src="/js/vs-framercms-range.js"></script>');
  if (t !== original) {
    changed += 1;
    if (!dry) await writeFile(f, t);
  }
}
console.log(`rewrote ${changed} files`);
