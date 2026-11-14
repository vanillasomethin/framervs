#!/usr/bin/env node
/**
 * Static SEO sanity checks for Vanilla & Somethin'.
 * Run after the Netlify CMS build: node scripts/audit-seo.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "public");
const errors = [];
const warnings = [];
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const required = [
  "index.html", "seo/index.html", "commercial-design/index.html", "nri-home-design/index.html",
  "locations/mangalore/index.html", "locations/kasaragod/index.html",
  "locations/coastal-karnataka/index.html", "locations/kerala/index.html",
  "sitemap.xml", "sitemap-pages.xml", "sitemap-locations.xml", "sitemap-projects.xml"
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: public/${file}`);
}

const sitemapFiles = ["sitemap.xml", "sitemap-pages.xml", "sitemap-locations.xml", "sitemap-projects.xml"];
for (const file of sitemapFiles) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const xml = read(file);
  if (!xml.startsWith('<?xml version="1.0"')) errors.push(`${file}: missing XML declaration`);
  if (!xml.includes("www.vanillasometh.in")) errors.push(`${file}: expected canonical host missing`);
  if (/canonical-url|https:\/\/vanillasometh\.in\//i.test(xml)) errors.push(`${file}: stale or non-canonical URL found`);
  if (file === "sitemap.xml" ? !xml.includes("<sitemapindex") : !xml.includes("<urlset")) {
    errors.push(`${file}: unexpected sitemap root element`);
  }
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  if (new Set(urls).size !== urls.length) errors.push(`${file}: duplicate loc entries`);
  for (const url of urls) {
    try { new URL(url); } catch { errors.push(`${file}: invalid URL ${url}`); }
  }
}

const htmlFiles = required.filter((p) => p.endsWith(".html"));
const canonicalMap = new Map();
for (const file of htmlFiles) {
  const html = read(file);
  const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (!title) errors.push(`${file}: missing title`);
  if (!description) errors.push(`${file}: missing meta description`);
  if (!canonical) errors.push(`${file}: missing canonical`);
  if (canonical) {
    if (!canonical.startsWith("https://www.vanillasometh.in/")) errors.push(`${file}: incorrect canonical ${canonical}`);
    if (canonicalMap.has(canonical)) errors.push(`${file}: canonical duplicates ${canonicalMap.get(canonical)}`);
    else canonicalMap.set(canonical, file);
  }
  const schemas = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi)];
  for (const [index, match] of schemas.entries()) {
    try { JSON.parse(match[1]); } catch (error) {
      errors.push(`${file}: JSON-LD #${index + 1} invalid: ${error.message}`);
    }
  }
  if (!/<h1\b/i.test(html)) warnings.push(`${file}: no H1 in server-rendered HTML`);
}

const estimatorHtml = path.resolve(process.cwd(), "vs-calculator/index.html");
if (!fs.existsSync(estimatorHtml)) errors.push("Missing estimator app entry: vs-calculator/index.html");
else {
  const html = fs.readFileSync(estimatorHtml, "utf8");
  if (!/<title>[^<]+<\/title>/i.test(html) || !/project cost estimator/i.test(html)) errors.push("Estimator app: descriptive project-cost title missing");
  if (!/name="description" content="[^"]{40,}"/i.test(html)) errors.push("Estimator app: descriptive meta description missing");
  if (!/rel="canonical"/i.test(html)) errors.push("Estimator app: canonical missing");
}

const rootSitemap = fs.existsSync(path.join(root, "sitemap.xml")) ? read("sitemap.xml") : "";
const locations = fs.existsSync(path.join(root, "sitemap-locations.xml")) ? read("sitemap-locations.xml") : "";
if (!rootSitemap.includes("sitemap-locations.xml")) errors.push("Sitemap index does not reference location sitemap");
const pages = fs.existsSync(path.join(root, "sitemap-pages.xml")) ? read("sitemap-pages.xml") : "";
if (!pages.includes("/commercial-design/")) errors.push("Pages sitemap missing commercial design landing page");
for (const slug of ["mangalore", "kasaragod", "coastal-karnataka", "kerala"]) {
  if (!locations.includes(`/locations/${slug}/`)) errors.push(`Location sitemap missing ${slug}`);
}

console.log(`SEO audit: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
