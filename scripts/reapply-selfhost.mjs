#!/usr/bin/env node
// Re-applies the self-hosted asset rewrite to Framer HTML pages after main is merged into a branch
// whose Framer pages were self-hosted with scripts/selfhost-framer.mjs.
//
// Use it while a merge of origin/main is in progress and conflicts on those pages. For each file it
// takes main's version (:3:) and rewrites it the way the branch's version (:2:) was rewritten.
// The CDN-to-local URL map is derived from the files themselves, because rerouter.js from the Framer
// export is no longer available. Self-test: rewrite(base :1:) must equal ours :2:, otherwise nothing
// is written.
//
// Usage: node scripts/reapply-selfhost.mjs [--check] [paths...]
//   --check  verify only, write nothing
//   paths    default: every unmerged path ending in .html (git diff --name-only --diff-filter=U)

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://framerusercontent.com/";
const URL_RE = /https:\/\/framerusercontent\.com\/[A-Za-z0-9/_.%@~+=-]+/g;
const LOCAL_RE = /\/(?:fr|js)\/[A-Za-z0-9/_.%@~+=-]+/g;
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const check = process.argv.includes("--check");
const explicit = process.argv.slice(2).filter((a) => a !== "--check");
const paths = explicit.length ? explicit : git("diff", "--name-only", "--diff-filter=U").split("\n").filter((p) => p.endsWith(".html"));

// 1. read base (:1:), ours (:2:), theirs (:3:); by default skip unmerged HTML that holds no self-hosted
//    references in ours (e.g. a page edited by hand on the branch, which the rewrite does not cover)
const files = [];
for (const p of paths) {
  const ours = git("show", `:2:${p}`);
  if (!explicit.length && !/\/(?:fr|js)\//.test(ours)) { console.log(`skipped (not self-hosted in ours): ${p}`); continue; }
  files.push({ p, base: git("show", `:1:${p}`), ours, theirs: git("show", `:3:${p}`) });
}

// 2. one URL map from every CDN URL in base or theirs
const oursAll = files.map((f) => f.ours).join("\n");
const urls = new Set();
for (const f of files) for (const t of [f.base, f.theirs]) for (const m of t.matchAll(URL_RE)) urls.add(m[0]);
const localFor = new Map();
for (const u of urls) {
  const name = u.split("/").pop();
  const lower = name.toLowerCase();
  const hit = [lower, name, lower.replace(/[^a-z0-9._-]/g, "-")].map((c) => `/js/${c}`).find((c) => oursAll.includes(c));
  localFor.set(u, hit ?? `/fr/${u.slice(CDN.length)}`);
}
const sortedMap = [...localFor].sort((a, b) => b[0].length - a[0].length);

// 3. the other edits from section 5 of scripts/selfhost-framer.mjs
function rewrite(original, path) {
  let t = original;
  for (const [url, local] of sortedMap) t = t.split(url).join(local);
  t = t.split(CDN).join("/fr/");
  t = t.replace(/new URL\((`[^`]*`|"[^"]*"),\s*(`\/(?:js|fr)\/[^`]*`|"\/(?:js|fr)\/[^"]*")\)/g, "new URL($1,location.origin+$2)");
  t = t.split("https://framer.com/edit/init.mjs").join("/js/vs-noop.mjs");
  t = t.split("fn=`https://framer.com/m/phosphor-icons/`").join("fn=`/js/framer-module-`");
  t = t.split("import(`${fn}${v}.js@0.0.57`)").join("import(`${fn}${v.toLowerCase()}.mjs`)");
  t = t.split("import(`${fn}${v.toLowerCase()}.js-0.0.57`)").join("import(`${fn}${v.toLowerCase()}.mjs`)");
  t = t.replace(/<script[^>]*cdn-cgi\/scripts\/[^>]*><\/script>/g, "");
  t = t.replace(/<script>\s*try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)\)\{[^<]*<\/script>/g, "");
  t = t.replace(/<script[^>]*src="(?:https:\/\/events\.framer\.com|\/_noop)\/[^"]*"[^>]*><\/script>/g, "");
  t = t.split("https://events.framer.com/").join("/_noop/");
  if (path.endsWith(".html") && /\/js\/|\/fr\/sites\//.test(t) && !t.includes("/js/vs-framercms-range.js")) {
    t = t.replace(/<head([^>]*)>/, '<head$1><script src="/js/vs-framercms-range.js"></script>');
  }
  return t;
}

// 4. self-test: rewrite(base) must equal ours
let failed = 0;
for (const f of files) {
  const got = rewrite(f.base, f.p);
  if (got === f.ours) { console.log(`self-test ok: ${f.p}`); continue; }
  failed += 1;
  let i = 0;
  while (i < got.length && got[i] === f.ours[i]) i += 1;
  console.log(`self-test FAILED: ${f.p} first difference at index ${i}`);
  console.log(`  rewritten: ${JSON.stringify(got.slice(i, i + 120))}`);
  console.log(`  ours:      ${JSON.stringify(f.ours.slice(i, i + 120))}`);
}
if (failed) { console.log(`${failed} file(s) failed the self-test, nothing written`); process.exit(1); }
if (check) { console.log(`--check: all ${files.length} self-tests passed, nothing written`); process.exit(0); }

// 5. write rewrite(theirs) and report
for (const f of files) {
  const out = rewrite(f.theirs, f.p);
  writeFileSync(join(root, f.p), out);
  const cdnLeft = (out.match(URL_RE) ?? []).length + out.split(CDN).length - 1;
  const missing = new Set();
  for (const m of out.matchAll(LOCAL_RE)) {
    let path;
    try { path = decodeURIComponent(m[0].split(/[?#]/)[0]); } catch { path = m[0]; }
    if (!existsSync(join(root, "public", path))) missing.add(path);
  }
  console.log(`wrote ${f.p}: CDN URLs left ${cdnLeft}, missing local files ${missing.size}${missing.size ? `\n  ${[...missing].join("\n  ")}` : ""}`);
}
