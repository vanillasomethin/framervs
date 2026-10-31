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

// Append CMS URLs to the deployed sitemap (the committed file stays as-is)
const sitemapFile = join(publicDir, "sitemap.xml");
const sitemap = await readFile(sitemapFile, "utf8");
const today = new Date().toISOString().slice(0, 10);
const entries = sitemapPaths(cms)
  .map((path) => `<url>\n<loc>${SITE_URL}${path}</loc>\n<lastmod>${today}</lastmod>\n<changefreq>weekly</changefreq>\n<priority>0.7</priority>\n</url>`)
  .join("\n");
if (!sitemap.includes(`${SITE_URL}/blog/`)) {
  await writeFile(sitemapFile, sitemap.replace("</urlset>", `${entries}\n</urlset>`));
}

console.log(`CMS: wrote ${pages.length} pages`);
