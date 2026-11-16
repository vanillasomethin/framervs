#!/usr/bin/env node
// Generate CMS pages and Framer-native project showcase pages from content.json.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAllPages, sitemapPaths, SITE_URL } from "../public/cms/render.mjs";
import { transformFramerProjectHTML } from "../public/cms/framer-projects.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const content = JSON.parse(await readFile(join(publicDir, "content.json"), "utf8"));
const cms = content.cms || {};

for (const dir of ["blog", "projects", "updates"]) {
  await rm(join(publicDir, dir), { recursive: true, force: true });
}
const pages = renderAllPages(cms);
for (const [path, html] of pages) {
  const file = join(publicDir, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

// Framer project pages remain the source of truth for visual design. Existing
// projects use their own original page; new projects inherit a selected template.
const projects = (cms.projects || []).filter((item) => item.status === "published" && item.slug);
const safeSlug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
const templateCache = new Map();
const loadTemplate = async (slug) => {
  const key = safeSlug(slug) || "flutecase";
  if (!templateCache.has(key)) {
    let html;
    try { html = await readFile(join(publicDir, "project-showcase", key, "index.html"), "utf8"); }
    catch { html = await readFile(join(publicDir, "project-showcase", "flutecase", "index.html"), "utf8"); }
    templateCache.set(key, html);
  }
  return templateCache.get(key);
};
for (const item of projects) {
  const slug = safeSlug(item.slug);
  if (!slug) continue;
  const requestedTemplate = safeSlug(item.framerTemplateSlug || (item.legacyFramer ? slug : "flutecase"));
  const template = await loadTemplate(requestedTemplate || "flutecase");
  const html = transformFramerProjectHTML(template, { ...item, slug });
  const output = join(publicDir, "project-showcase", slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

// Add newly-created CMS projects to the existing Framer grid using a native
// Framer card cloned from its own markup. Legacy cards are already present.
const findDivEnd = (html, start) => {
  const token = /<\/?div\b[^>]*>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(html))) {
    if (/^<div\b/i.test(match[0])) depth += 1;
    else depth -= 1;
    if (depth === 0) return token.lastIndex;
  }
  return -1;
};
const makeCard = (templateCard, item) => {
  let card = templateCard;
  card = card.replace(/href="[^"]*"/i, 'href="/project-showcase/' + safeSlug(item.slug) + '/"');
  const cover = item.cover?.src || item.gallery?.find((entry) => entry.src)?.src || "";
  if (cover) card = card.replace(/<img\b[^>]*>/i, (tag) => {
    let image = tag.replace(/\s+srcset="[^"]*"/i, "");
    image = image.replace(/\ssrc="[^"]*"/i, ' src="' + String(cover).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"');
    return image;
  });
  const replaceText = (tag, value) => card = card.replace(new RegExp("(<" + tag + "\\b[^>]*>)[\\s\\S]*?(</" + tag + ">)", "i"), "$1" + String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "$2");
  replaceText("h5", item.title);
  replaceText("p", item.category);
  return card;
};
const appendFramerCards = async (file, newItems, allItems) => {
  let html;
  try { html = await readFile(file, "utf8"); } catch { return; }
  const bySlug = new Map(allItems.map((item) => [safeSlug(item.slug), item]));
  // Refresh cards for existing projects when title, category or cover changes.
  let cursor = 0;
  while (true) {
    const cardStart = html.indexOf('<div class="framer-50ol73-container">', cursor);
    if (cardStart < 0) break;
    const cardEnd = findDivEnd(html, cardStart);
    if (cardEnd < 0) break;
    const card = html.slice(cardStart, cardEnd);
    const href = card.match(/href="[^"]*project-showcase\/([^/"?]+)[^"]*"/i);
    const item = href && bySlug.get(safeSlug(href[1]));
    if (item) {
      const updated = makeCard(card, item);
      html = html.slice(0, cardStart) + updated + html.slice(cardEnd);
      cursor = cardStart + updated.length;
    } else if (href) {
      html = html.slice(0, cardStart) + html.slice(cardEnd);
      cursor = cardStart;
    } else cursor = cardEnd;
  }
  if (newItems.length) {
    const cardStart = html.indexOf('<div class="framer-50ol73-container">');
    const gridStart = html.indexOf('<div class="framer-1bgqte0"', cardStart);
    const gridEnd = gridStart >= 0 ? findDivEnd(html, gridStart) : -1;
    const cardEnd = cardStart >= 0 ? findDivEnd(html, cardStart) : -1;
    if (cardStart >= 0 && cardEnd >= 0 && gridEnd >= 0) {
      const templateCard = html.slice(cardStart, cardEnd);
      const cards = newItems.map((item) => makeCard(templateCard, item)).join("");
      const insertAt = gridEnd - "</div>".length;
      html = html.slice(0, insertAt) + cards + html.slice(insertAt);
    }
  }
  await writeFile(file, html);
};
// Remove any legacy page that was unpublished or deleted in the admin.
const legacyTemplateSlugs = ["flutecase", "fair-fly", "nord-terra", "mak", "bnb", "coco-meltdown", "artwist-salon", "seiko-hyper", "koan", "pipe-nova"];
const publishedSlugs = new Set(projects.map((item) => safeSlug(item.slug)));
for (const legacySlug of legacyTemplateSlugs) {
  if (!publishedSlugs.has(legacySlug)) {
    await rm(join(publicDir, "project-showcase", legacySlug), { recursive: true, force: true });
  }
}
const newFramerProjects = projects.filter((item) => !item.legacyFramer);
await appendFramerCards(join(publicDir, "project-showcase", "index.html"), newFramerProjects, projects);
await appendFramerCards(join(publicDir, "index.html"), newFramerProjects, projects);

// Sitemap includes both the CMS SEO route and the Framer-designed project route.
const today = new Date().toISOString().slice(0, 10);
const cmsPaths = [...new Set([...sitemapPaths(cms), ...projects.map((item) => "/project-showcase/" + safeSlug(item.slug) + "/")])];
const cmsEntries = cmsPaths.map((path) => '<url>\n<loc>' + SITE_URL + path + '</loc>\n<lastmod>' + today + '</lastmod>\n<changefreq>weekly</changefreq>\n<priority>0.7</priority>\n</url>').join("\n");
const cmsSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + cmsEntries + '\n</urlset>\n';
await writeFile(join(publicDir, "sitemap-cms.xml"), cmsSitemap);
const sitemapFile = join(publicDir, "sitemap.xml");
const sitemap = await readFile(sitemapFile, "utf8");
if (!sitemap.includes("sitemap-cms.xml")) {
  await writeFile(sitemapFile, sitemap.replace("</sitemapindex>", '  <sitemap><loc>' + SITE_URL + '/sitemap-cms.xml</loc></sitemap>\n</sitemapindex>'));
}
console.log('CMS: wrote ' + pages.length + ' CMS pages and ' + projects.length + ' Framer project pages');
