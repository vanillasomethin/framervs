#!/usr/bin/env node
// Builds the site's own pages (home, works, project pages, team, contact) from site/
// and installs them into public/, next to the CMS pages, the estimator and the functions.
//
//   node scripts/build-site.mjs            # npm ci + next build, then install
//   node scripts/build-site.mjs --no-build # install an existing site/out
//
// Each page keeps its production SEO head (title, description, canonical, Open Graph,
// JSON-LD, analytics), stored in site/seo/<page>.html: Next's own <title> and
// description are replaced with it.

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const out = join(site, "out");
const pub = join(root, "public");

if (!process.argv.includes("--no-build")) {
  execSync("npm ci --no-audit --no-fund", { cwd: site, stdio: "inherit" });
  execSync("npm run build", { cwd: site, stdio: "inherit" });
}
if (!existsSync(join(out, "index.html"))) throw new Error("site/out/index.html missing: the site build failed");

// out/ path -> public/ path. /team.html is the page's long-standing URL, so it stays.
const target = (rel) => {
  if (rel === "team/index.html") return "team.html";
  return rel;
};
// Next's own 404 page and favicon are not used: Netlify serves its 404, and the icons come from the SEO head.
const skip = (rel) => rel === "404.html" || rel.startsWith("404/") || rel.startsWith("_not-found/") || rel === "favicon.ico";

const seoFor = (rel) => {
  const page = rel === "index.html" ? "index" : rel.replace(/\/index\.html$/, "");
  const file = join(site, "seo", `${page}.html`);
  return existsSync(file) ? readFileSync(file, "utf8").trim() : null;
};

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// a fresh copy of the build's own folders, so files from an older build don't linger
for (const dir of ["_next", "sites", "icons"]) rmSync(join(pub, dir), { recursive: true, force: true });

let pages = 0;
const missingSeo = [];
for (const file of walk(out)) {
  const rel = relative(out, file).split("\\").join("/");
  if (skip(rel)) continue;
  const dest = join(pub, target(rel));
  mkdirSync(dirname(dest), { recursive: true });
  if (!rel.endsWith(".html")) {
    cpSync(file, dest);
    continue;
  }
  let html = readFileSync(file, "utf8");
  const seo = seoFor(rel);
  if (seo) {
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, "")
      .replace(/<meta name="description"[^>]*>/, "")
      .replace(/<link rel="icon"[^>]*>/g, "")
      .replace("</head>", `${seo}\n</head>`);
  } else {
    missingSeo.push(rel);
  }
  writeFileSync(dest, html);
  pages += 1;
}
console.log(`installed ${pages} pages from site/out into public/`);
if (missingSeo.length) console.log(`no SEO head in site/seo for: ${missingSeo.join(", ")}`);
