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
  "index.html", "team.html", "seo/index.html", "commercial-design/index.html", "landscape-design/index.html", "project-management/index.html", "renovation-and-short-stay-design/index.html", "permits-and-licensing-support/index.html", "nri-home-design/index.html",
  "locations/mangalore/index.html", "locations/kasaragod/index.html",
  "locations/coastal-karnataka/index.html", "locations/kerala/index.html",
  "sitemap.xml", "sitemap-pages.xml", "sitemap-locations.xml", "sitemap-projects.xml", "sitemap-cms.xml"
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: public/${file}`);
}

const sitemapFiles = ["sitemap.xml", "sitemap-pages.xml", "sitemap-locations.xml", "sitemap-projects.xml", "sitemap-cms.xml"];
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
    try { if (new URL(url).hostname !== "www.vanillasometh.in") errors.push(`${file}: non-primary hostname in sitemap URL ${url}`); } catch { /* invalid URL already reported above */ }
  }
}

const htmlFiles = required.filter((p) => p.endsWith(".html"));
const canonicalMap = new Map();
for (const file of htmlFiles) {
  const html = read(file);
  if (html.includes("—")) errors.push(`${file}: em dash found in published page copy`);
  const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (!title) errors.push(`${file}: missing title`);
  if (!description) errors.push(`${file}: missing meta description`);
  if (!canonical) errors.push(`${file}: missing canonical`);
  const ogUrl = html.match(/property="og:url" content="([^"]+)"/i)?.[1];
  if (ogUrl && canonical && ogUrl !== canonical) errors.push(`${file}: og:url does not match canonical`);
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
  if (file === "index.html") {
    const organizationSchema = schemas.map((match) => {
      try { return JSON.parse(match[1]); } catch { return null; }
    }).find((schema) => schema?.["@type"] === "Organization");
    if (!organizationSchema) errors.push("index.html: Organization JSON-LD missing");
    else if (organizationSchema.url !== "https://www.vanillasometh.in/") errors.push("index.html: Organization schema URL must use the primary www domain");
  }
  if (!/<h1\b/i.test(html)) warnings.push(`${file}: no H1 in server-rendered HTML`);
}

const cmsContent = JSON.parse(read("content.json"));
const cmsProjects = cmsContent.cms?.projects || [];
for (const title of ["King Abdullah Park", "Aestra Clinic", "Mezze Cafe"]) {
  if (!cmsProjects.some((project) => project.title === title)) errors.push(`CMS project draft missing: ${title}`);
}
const adminSource = read("admin/admin.js");
if (!adminSource.includes("uploadPDF") || !adminSource.includes("data-gallery-kind")) errors.push("Project editor is missing PDF upload or media categorisation controls");
const projectRenderer = read("cms/render.mjs");
for (const kind of ["Project photography", "3D visualisations", "Plans", "Technical drawings", "Project documents"]) {
  if (!projectRenderer.includes(kind)) errors.push(`Project renderer missing media group: ${kind}`);
}
const locationSource = fs.readFileSync(path.resolve(process.cwd(), "vs-calculator/src/components/estimator/LocationStep.tsx"), "utf8");
const locationCostSource = fs.readFileSync(path.resolve(process.cwd(), "vs-calculator/src/utils/locationCost.ts"), "utf8");
const cpwdSource = fs.readFileSync(path.resolve(process.cwd(), "vs-calculator/src/data/cpwdCostIndex.ts"), "utf8");
if (!locationSource.includes('"Kasaragod"')) errors.push("Estimator location picker missing Kasaragod");
if (!cpwdSource.includes('"Kasaragod": 134')) errors.push("CPWD location index missing Kasaragod");
if (!locationCostSource.includes('"Kanhangad": "Kasaragod"')) errors.push("Kasaragod district town mapping missing");
if (locationSource.includes("max-h-60 overflow-auto")) errors.push("Location suggestions create an inner scroll region");
if (read("../vs-calculator/src/components/estimator/ResultsStep.tsx").includes("max-h-[90vh] overflow-y-auto")) errors.push("Consultation modal creates an inner scroll region");
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
if (!rootSitemap.includes("sitemap-cms.xml")) errors.push("Sitemap index does not reference CMS sitemap");
const pages = fs.existsSync(path.join(root, "sitemap-pages.xml")) ? read("sitemap-pages.xml") : "";
if (!pages.includes("/commercial-design/")) errors.push("Pages sitemap missing commercial design landing page");
for (const slug of ["landscape-design", "project-management", "renovation-and-short-stay-design", "permits-and-licensing-support"]) {
  if (!pages.includes(`/${slug}/`)) errors.push(`Pages sitemap missing ${slug}`);
}
for (const slug of ["mangalore", "kasaragod", "coastal-karnataka", "kerala"]) {
  if (!locations.includes(`/locations/${slug}/`)) errors.push(`Location sitemap missing ${slug}`);
}

console.log(`SEO audit: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
