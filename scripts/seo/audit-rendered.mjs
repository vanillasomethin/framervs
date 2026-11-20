#!/usr/bin/env node
/**
 * Rendered SEO audit. Static checks miss what Google actually indexes: the DOM
 * after JavaScript runs. The Framer runtime, for example, rewrites <title> on
 * hydration. This script serves public/ locally (Netlify-style URL handling),
 * renders every sitemap URL in Chromium and checks the rendered head.
 *
 *   node scripts/seo/audit-rendered.mjs            # audit local public/
 *   node scripts/seo/audit-rendered.mjs --live     # audit https://www.vanillasometh.in
 *   --json <file>   write a machine-readable report (used by the admin SEO panel)
 *
 * Requires Playwright (preinstalled in CI via `npx playwright install chromium`).
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = await import("playwright")); }

const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const SITE = "https://www.vanillasometh.in";
const root = path.resolve(process.cwd(), "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".txt": "text/plain" };

function resolveLocal(urlPath) {
  const p = decodeURIComponent(urlPath.split("?")[0]);
  const f = path.join(root, p);
  if (!f.startsWith(root)) return null;
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  if (fs.existsSync(path.join(f, "index.html"))) return path.join(f, "index.html");
  if (fs.existsSync(f + ".html")) return f + ".html";
  return null;
}

function sitemapUrls() {
  const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
  const index = read("sitemap.xml");
  const children = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname.slice(1));
  return children.flatMap((c) => fs.existsSync(path.join(root, c)) ? [...read(c).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]) : []);
}

async function main() {
  let server, base = SITE;
  if (!LIVE) {
    server = http.createServer((req, res) => {
      const f = resolveLocal(req.url);
      if (!f) { res.writeHead(404); return res.end("not found"); }
      // Mirror Netlify: directory URLs without a trailing slash redirect.
      const p = req.url.split("?")[0];
      if (f.endsWith("index.html") && !p.endsWith("/") && !p.endsWith(".html")) { res.writeHead(301, { Location: p + "/" }); return res.end(); }
      res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(res);
    });
    await new Promise((r) => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}`;
  }

  const urls = sitemapUrls().filter((u) => !/\/estimator\//.test(u) || LIVE || fs.existsSync(path.join(root, "estimator/index.html")));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (compatible; VS-SEO-Audit/1.0; +https://www.vanillasometh.in/)" });
  const results = [];
  const errors = [], warnings = [];

  for (const canonicalUrl of urls) {
    const target = base + new URL(canonicalUrl).pathname;
    const page = await ctx.newPage();
    const r = { url: canonicalUrl };
    try {
      const resp = await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
      r.status = resp?.status();
      r.redirected = resp?.request().redirectedFrom() ? true : false;
      await page.waitForTimeout(1500); // let hydration/head managers settle
      Object.assign(r, await page.evaluate(() => {
        const q = (s, a) => [...document.querySelectorAll(s)].map((e) => e.getAttribute(a));
        return {
          title: document.title,
          descriptions: q('meta[name="description"]', "content"),
          canonicals: q('link[rel="canonical"]', "href"),
          robots: q('meta[name="robots"]', "content").join(","),
          h1: [...document.querySelectorAll("h1")].filter((h) => h.offsetParent !== null || getComputedStyle(h).display !== "none").map((h) => h.textContent.trim()).filter(Boolean),
          jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } }),
          imgsNoAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
        };
      }));
    } catch (e) {
      r.error = e.message.split("\n")[0];
    }
    await page.close();

    const tag = new URL(canonicalUrl).pathname;
    const err = (m) => errors.push(`${tag}: ${m}`), warn = (m) => warnings.push(`${tag}: ${m}`);
    if (r.error) { err(`failed to render (${r.error})`); results.push(r); continue; }
    if (r.status !== 200) err(`HTTP ${r.status}`);
    if (r.redirected) err("sitemap URL redirects; list the final URL instead");
    if (!r.title || /^vanilla &(amp;)? somethin'?$/i.test(r.title.trim())) err(`generic or missing rendered title "${r.title}"`);
    if (r.title && r.title.length > 70) warn(`rendered title is ${r.title.length} chars`);
    if (!r.descriptions.length || !r.descriptions[0]) err("missing rendered meta description");
    if (new Set(r.descriptions).size > 1) err("conflicting meta descriptions after render");
    if (r.canonicals.length !== 1) err(`${r.canonicals.length} canonical tags after render`);
    else if (r.canonicals[0] !== canonicalUrl) err(`canonical ${r.canonicals[0]} != sitemap URL ${canonicalUrl}`);
    if (/noindex/i.test(r.robots)) err("noindex on a sitemap URL");
    if (!r.h1.length) warn("no visible H1 after render");
    if (r.jsonld.includes(false)) err("invalid JSON-LD after render");
    if (r.imgsNoAlt) warn(`${r.imgsNoAlt} <img> without alt`);
    results.push(r);
  }
  await browser.close();
  server?.close();

  const byTitle = new Map();
  for (const r of results) if (r.title) byTitle.set(r.title, [...(byTitle.get(r.title) || []), new URL(r.url).pathname]);
  for (const [t, ps] of byTitle) if (ps.length > 1) errors.push(`duplicate rendered title "${t}" on ${ps.join(", ")}`);
  const byDesc = new Map();
  for (const r of results) if (r.descriptions?.[0]) byDesc.set(r.descriptions[0], [...(byDesc.get(r.descriptions[0]) || []), new URL(r.url).pathname]);
  for (const [, ps] of byDesc) if (ps.length > 1) warnings.push(`duplicate rendered description on ${ps.join(", ")}`);

  const report = { generatedAt: new Date().toISOString(), target: LIVE ? SITE : "local public/", pages: results.length, errors, warnings, results };
  if (jsonOut) { fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true }); fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2)); }
  console.log(`Rendered SEO audit (${report.target}): ${results.length} page(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const e of errors) console.log(`ERROR ${e}`);
  for (const w of warnings) console.log(`WARN  ${w}`);
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
