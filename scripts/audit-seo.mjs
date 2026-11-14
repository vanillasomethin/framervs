#!/usr/bin/env node
/**
 * Static SEO sanity checks for the exported Vanilla & Somethin' site.
 * Run with: node scripts/audit-seo.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "public");
const required = [
  "index.html",
  "seo/index.html",
  "locations/mangalore/index.html",
  "locations/kasaragod/index.html",
  "locations/coastal-karnataka/index.html",
  "locations/kerala/index.html",
  "sitemap.xml",
  "sitemap-pages.xml",
  "sitemap-locations.xml",
  "sitemap-projects.xml",
];
const errors = [];
const warnings = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: public/${file}`);
}

const xmlFiles = ["sitemap.xml","sitemap-pages.xml","sitemap-locations.xml","sitemap-projects.xml"];
for (const file of xmlFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const xml = read(file);
  if (!xml.startsWith('<?xml version="1.0"')) errors.push(`${file}: missing XML declaration`);
  if (!xml.includes("www.vanillasometh.in")) errors.push(`${file}: expected canonical host missing`);
  if (/canonical-url|https:\/\/vanillasometh\.in\//i.test(xml)) errors.push(`${file}: stale or non-canonical URL found`);
  if (file !== "sitemap.xml" && !xml.includes("<urlset")) errors.push(`${file}: expected urlset root`);
  if (file === "sitemap.xml" && !xml.includes("<sitemapindex")) errors.push("sitemap.xml: expected sitemapindex root");
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  if (new Set(locs).size !== locs.length) errors.push(`${file}: duplicate loc entries`);
  for (const loc of locs) {
    try { new URL(loc); } catch { errors.push(`${file}: invalid URL: ${loc}`); }
  }
}

const htmlFiles = required.filter((f) => f.endsWith(".html"));
const canonicals = new Map();
for (const file of htmlFiles) {
  const html = read(file);
  const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim()
    ?? html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (!title) errors.push(`${file}: missing title`);
  if (!description) errors.push(`${file}: missing meta description`);
  if (!canonical) errors.push(`${file}: missing canonical`);
  if (canonical) {
    if (!canonical.startsWith("https://www.vanillasometh.in/")) errors.push(`${file}: non-canonical host or scheme: ${canonical}`);
    if (canonicals.has(canonical)) errors.push(`${file}: canonical duplicates ${canonicals.get(canonical)}`);
    else canonicals.set(canonical, file);
  }
  const jsonLd = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi)];
  for (const [index, match] of jsonLd.entries()) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${file}: JSON-LD #${index + 1} is invalid: ${error.message}`); }
  }
  if (!/<h1\b/i.test(html)) warnings.push(`${file}: no H1 found in server HTML`);
}

const sitemap = fs.existsSync(path.join(root,"sitemap.xml")) ? read("sitemap.xml") : "";
for (const slug of ["mangalore","kasaragod","coastal-karnataka","kerala"]) {
  if (!sitemap.includes(`sitemap-locations.xml`)) errors.push("Sitemap index does not reference the location sitemap");
  const locationXml = fs.existsSync(path.join(root,"sitemap-locations.xml")) ? read("sitemap-locations.xml") : "";
  if (!locationXml.includes(`/locations/${slug}/`)) errors.push(`Location sitemap missing ${slug}`);
}

console.log(`SEO audit: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
