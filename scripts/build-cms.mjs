#!/usr/bin/env node
// Generates the CMS-managed pages (blog, projects, updates) from
// public/content.json into public/ at Netlify build time, and adds them to
// the deployed sitemap. The admin panel (/admin) edits content.json; each save
// commits to GitHub, which triggers a deploy that runs this script.
//
// Usage: node scripts/build-cms.mjs

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAllPages, sitemapPaths, SITE_URL } from "../public/cms/render.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const content = JSON.parse(await readFile(join(publicDir, "content.json"), "utf8"));
const cms = content.cms || {};

// Start clean so deleted or unpublished items disappear from the site
for (const dir of ["blog", "projects", "updates"]) {
  await rm(join(publicDir, dir), { recursive: true, force: true });
}

const pages = renderAllPages(cms);
for (const [path, html] of pages) {
  const file = join(publicDir, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

// Generate a dedicated sitemap for CMS-managed content. The public sitemap.xml
// is a sitemap index, so project/blog/update URLs belong in a child urlset.
const today = new Date().toISOString().slice(0, 10);
const cmsUrls = sitemapPaths(cms);
const cmsEntries = cmsUrls
  .map((path) => `<url>\n<loc>${SITE_URL}${path}</loc>\n<lastmod>${today}</lastmod>\n<changefreq>weekly</changefreq>\n<priority>0.7</priority>\n</url>`)
  .join("\n");
const cmsSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${cmsEntries}\n</urlset>\n`;
await writeFile(join(publicDir, "sitemap-cms.xml"), cmsSitemap);

const sitemapFile = join(publicDir, "sitemap.xml");
const sitemap = await readFile(sitemapFile, "utf8");
if (!sitemap.includes("sitemap-cms.xml")) {
  await writeFile(sitemapFile, sitemap.replace("</sitemapindex>", `  <sitemap><loc>${SITE_URL}/sitemap-cms.xml</loc></sitemap>\n</sitemapindex>`));
}

console.log(`CMS: wrote ${pages.length} pages`);
