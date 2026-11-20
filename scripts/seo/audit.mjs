#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const site = (process.env.SEO_SITE_URL || "https://www.vanillasometh.in").replace(/\/$/, "");
const out = path.resolve("reports/seo");
await fs.mkdir(out, { recursive: true });
const checks = [];
const visited = new Set();
const queue = [site + "/"];
const maxPages = Number(process.env.SEO_MAX_PAGES || 150);
const add = (level, url, message) => checks.push({ level, url, message });
const sameHost = (url) => new URL(url).hostname === new URL(site).hostname;
const canonicalHost = new URL(site).hostname;

while (queue.length && visited.size < maxPages) {
  const url = queue.shift();
  if (visited.has(url)) continue;
  visited.add(url);
  let response;
  try {
    response = await fetch(url, { redirect: "follow", headers: { "User-Agent": "VanillaSomethinFreeSEOAudit/1.0 (+https://www.vanillasometh.in)" }, signal: AbortSignal.timeout(20000) });
  } catch (error) {
    add("error", url, `Fetch failed: ${error.message}`);
    continue;
  }
  if (!response.ok) { add("error", url, `HTTP ${response.status}`); continue; }
  if (!(response.headers.get("content-type") || "").includes("text/html")) continue;
  const html = await response.text();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1];
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (!title) add("error", url, "Missing title");
  else if (title.length > 65) add("warning", url, `Title may be long (${title.length} characters)`);
  if (!description) add("error", url, "Missing meta description");
  else if (description.length < 70 || description.length > 170) add("warning", url, `Meta description length is ${description.length}`);
  if (!canonical) add("error", url, "Missing canonical");
  else {
    try {
      const canonicalUrl = new URL(canonical, url);
      if (canonicalUrl.hostname !== canonicalHost) add("error", url, `Canonical uses unexpected host: ${canonicalUrl.hostname}`);
      if (canonicalUrl.pathname !== new URL(url).pathname) add("warning", url, `Canonical path differs from crawled path: ${canonicalUrl.pathname}`);
    } catch { add("error", url, "Invalid canonical URL"); }
  }
  if (!h1.length) add("warning", url, "No server-rendered H1");
  if (h1.length > 1) add("warning", url, `Multiple H1 elements (${h1.length})`);
  if (!/<meta[^>]+property=["']og:title["']/i.test(html)) add("warning", url, "Missing Open Graph title");
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [i, match] of jsonLd.entries()) {
    try { JSON.parse(match[1]); } catch { add("error", url, `Invalid JSON-LD block ${i + 1}`); }
  }
  const links = [...html.matchAll(/<a\b[^>]+href=["']([^"'#]+)["']/gi)].map(m => m[1]);
  for (const href of links) {
    try {
      const next = new URL(href, url);
      if (next.protocol !== "http:" && next.protocol !== "https:") continue;
      if (sameHost(next.href) && !visited.has(next.href) && !queue.includes(next.href)) queue.push(next.href);
    } catch { add("warning", url, `Invalid link: ${href}`); }
  }
}
const summary = {
  site, generatedAt: new Date().toISOString(), pagesCrawled: visited.size,
  errors: checks.filter(c => c.level === "error").length,
  warnings: checks.filter(c => c.level === "warning").length, checks
};
await fs.writeFile(path.join(out, "technical-audit.json"), JSON.stringify(summary, null, 2));
const markdown = [
  "# Vanilla & Somethin' technical SEO audit", "",
  `- Site: ${site}`, `- Generated: ${summary.generatedAt}`,
  `- Pages crawled: ${summary.pagesCrawled}`, `- Errors: ${summary.errors}`,
  `- Warnings: ${summary.warnings}`, "",
  "| Severity | URL | Finding |", "|---|---|---|",
  ...checks.map(c => `| ${c.level} | ${c.url} | ${c.message.replaceAll("|", "\\|")} |`)
].join("\n");
await fs.writeFile(path.join(out, "technical-audit.md"), markdown + "\n");
console.log(`Crawled ${summary.pagesCrawled} pages: ${summary.errors} error(s), ${summary.warnings} warning(s). Reports: ${out}`);
if (summary.errors) process.exitCode = 1;
