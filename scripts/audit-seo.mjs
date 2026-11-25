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

// ---------------------------------------------------------------------------
// Site-wide checks across every public HTML page (not just the required list).
// ---------------------------------------------------------------------------
const SITE = "https://www.vanillasometh.in";
const PRIVATE = /^(admin|onboard|cdn-cgi|estimator)\//;
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((d) => {
  const rel = dir ? `${dir}/${d.name}` : d.name;
  return d.isDirectory() ? walk(rel) : rel.endsWith(".html") ? [rel] : [];
});
const allPages = walk("").filter((f) => !PRIVATE.test(f) && !f.startsWith("uploads/"));
const urlFor = (f) => `${SITE}/${f === "index.html" ? "" : f.endsWith("/index.html") ? f.slice(0, -"index.html".length) : f}`;
const fileFor = (url) => {
  const p = new URL(url).pathname.slice(1);
  if (!p) return "index.html";
  if (p.endsWith("/")) return `${p}index.html`;
  return p.endsWith(".html") ? p : null; // slashless directory URLs 301 on Netlify
};

const sitemapLocs = sitemapFiles.flatMap((f) => (fs.existsSync(path.join(root, f)) && f !== "sitemap.xml" ? [...read(f).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]) : []));
const titles = new Map();
for (const file of allPages) {
  const html = read(file);
  const count = (re) => (html.match(re) || []).length;
  if (count(/<title>/gi) !== 1) errors.push(`${file}: ${count(/<title>/gi)} <title> tags`);
  if (count(/<link\s+rel=["']canonical["']/gi) > 1) errors.push(`${file}: multiple canonical tags`);
  if (count(/<meta\s+name=["']description["']/gi) > 1) errors.push(`${file}: multiple meta descriptions`);
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  const noindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
  if (!canonical && !noindex) errors.push(`${file}: missing canonical`);
  if (canonical && !noindex && canonical !== urlFor(file)) errors.push(`${file}: canonical ${canonical} should be ${urlFor(file)} (the URL Netlify serves with 200)`);
  if (canonical && !noindex && !sitemapLocs.includes(canonical)) errors.push(`${file}: indexable page missing from sitemaps (${canonical})`);
  const decode = (v) => v?.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
  const title = decode(html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim());
  if (title) titles.set(title, [...(titles.get(title) || []), file]);
  if (title && title.length > 70) warnings.push(`${file}: title is ${title.length} chars`);
  const desc = decode(html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]);
  if (desc && desc.length > 165) warnings.push(`${file}: description is ${desc.length} chars`);
  if (!html.includes("G-88SHPS1HB3")) errors.push(`${file}: Google Analytics tag missing`);
  if (/<!-- Snippet: nnXbnDc1w -->/.test(html)) errors.push(`${file}: legacy Framer SEO snippet present; run node scripts/seo/apply-framer-seo.mjs`);
  if (/"telephone"\s*:/.test(html)) warnings.push(`${file}: telephone in structured data; confirm it matches the verified public number`);

  // Internal links must resolve to a file in public/ (or a known app/redirect route).
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"#?]+)[^"]*"/gi)) {
    if (/^(https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(href)) {
      if (!href.startsWith(SITE)) continue;
    }
    const abs = new URL(href, urlFor(file));
    if (abs.origin !== SITE) continue;
    let p = decodeURIComponent(abs.pathname).replace(/^\//, "");
    if (/^(estimator|pricing|admin|blog|projects|updates)(\/|$)/.test(p)) continue; // built at deploy or redirected
    const exists = [p, `${p}index.html`, `${p}/index.html`, `${p}.html`].some((c) => c === "" ? true : fs.existsSync(path.join(root, c)) && fs.statSync(path.join(root, c)).isFile());
    if (!exists) errors.push(`${file}: broken internal link ${href}`);
  }
}
for (const [title, files] of titles) if (files.length > 1) errors.push(`duplicate <title> "${title}" on ${files.join(", ")}`);
for (const loc of sitemapLocs) {
  const f = fileFor(loc);
  if (f === null) errors.push(`sitemap URL ${loc} redirects (directory without trailing slash)`);
  else if (!/^(estimator|blog|projects|updates)\//.test(f) && !fs.existsSync(path.join(root, f))) errors.push(`sitemap URL ${loc} has no file (public/${f})`);
}

const robots = read("robots.txt");
if (!/^Sitemap:\s*https:\/\/www\.vanillasometh\.in\/sitemap\.xml\s*$/m.test(robots)) errors.push("robots.txt: Sitemap line missing or wrong");
if (/^Disallow:\s*\/\s*$/m.test(robots)) errors.push("robots.txt: site-wide Disallow");
for (const p of ["/admin/", "/onboard/"]) if (!robots.includes(`Disallow: ${p}`)) errors.push(`robots.txt: should disallow ${p}`);

const seoMeta = fs.existsSync(path.join(root, "seo-meta.js")) ? read("seo-meta.js") : "";
if (!seoMeta.includes("MutationObserver")) errors.push("public/seo-meta.js missing; run node scripts/seo/apply-framer-seo.mjs");
for (const file of allPages) {
  if (/data-framer-hydrate/.test(read(file)) && !read(file).includes('src="/seo-meta.js"')) errors.push(`${file}: Framer page without /seo-meta.js (rendered title will be generic)`);
}

// Template placeholder copy must never return (e.g. after a fresh Framer export).
const { FORBIDDEN } = await import("./seo/framer-cms-copy.mjs");
const activeCms = new Set(walk("js").filter((f) => f.endsWith(".mjs")).flatMap((f) => [...read(f).matchAll(/new URL\("js\/([^"]+\.framercms)"/g)].map((m) => `js/${m[1]}`)));
for (const file of [...allPages, ...activeCms, ...walk("").filter((f) => /searchindex[^/]*\.json$/i.test(f))]) {
  const text = fs.readFileSync(path.join(root, file), "latin1").toLowerCase();
  for (const phrase of FORBIDDEN) if (text.includes(phrase)) errors.push(`${file}: template placeholder copy "${phrase}"; run node scripts/seo/patch-framer-cms.mjs`);
}

console.log(`SEO audit: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
