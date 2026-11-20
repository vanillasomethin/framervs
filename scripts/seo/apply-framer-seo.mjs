#!/usr/bin/env node
/**
 * Applies scripts/seo/framer-pages.mjs to the Framer-exported HTML in public/
 * and generates public/seo-meta.js. Idempotent: safe to re-run after a new
 * Framer export.
 *
 *   node scripts/seo/apply-framer-seo.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { PAGES, PROJECTS, SITE, BRAND, ORG } from "./framer-pages.mjs";

const root = path.resolve(process.cwd(), "public");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c");
const START = "<!-- vs-seo:start -->";
const END = "<!-- vs-seo:end -->";

function schemaFor(page) {
  const url = SITE + page.path;
  const crumbs = [{ name: "Home", url: `${SITE}/` }];
  if (page.project) crumbs.push({ name: "Projects", url: `${SITE}/project-showcase/` });
  if (page.path !== "/") crumbs.push({ name: page.project ? page.project.name : page.title.split(" | ")[0], url });
  const graph = [];
  if (page.project) {
    const p = page.project;
    graph.push({
      "@type": "CreativeWork",
      "@id": `${url}#project`,
      name: p.name,
      headline: page.title,
      description: page.description,
      url,
      genre: p.category,
      dateCreated: p.year,
      locationCreated: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: p.locality, addressRegion: p.region, addressCountry: p.country } },
      creator: ORG,
      ...(page.image ? { image: page.image } : {}),
    });
  } else if (page.collection) {
    const { PROJECTS } = page;
    graph.push({
      "@type": "CollectionPage", "@id": `${url}#page`, name: page.title, description: page.description, url, isPartOf: { "@id": `${SITE}/#website` }, about: ORG,
      mainEntity: { "@type": "ItemList", itemListElement: PROJECTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/project-showcase/${p.slug}/`, name: p.name })) },
    });
  } else if (page.contact) {
    graph.push({ "@type": "ContactPage", "@id": `${url}#page`, name: page.title, description: page.description, url, about: ORG });
  }
  if (crumbs.length > 1) {
    graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) });
  }
  return graph.length ? { "@context": "https://schema.org", "@graph": graph } : null;
}

// Tags that must appear once. Value setters run on the first occurrence; later duplicates are removed.
const SINGLE = [
  ["title", /<title>[\s\S]*?<\/title>\s*/gi],
  ["description", /<meta\s+name="description"[^>]*>\s*/gi],
  ["canonical", /<link\s+rel="canonical"[^>]*>\s*/gi],
  ["og:url", /<meta\s+property="og:url"[^>]*>\s*/gi],
  ["og:title", /<meta\s+property="og:title"[^>]*>\s*/gi],
  ["og:description", /<meta\s+property="og:description"[^>]*>\s*/gi],
  ["og:type", /<meta\s+property="og:type"[^>]*>\s*/gi],
  ["og:site_name", /<meta\s+property="og:site_name"[^>]*>\s*/gi],
  ["og:image", /<meta\s+property="og:image"[^>]*>\s*/gi],
  ["twitter:card", /<meta\s+name="twitter:card"[^>]*>\s*/gi],
  ["twitter:title", /<meta\s+name="twitter:title"[^>]*>\s*/gi],
  ["twitter:description", /<meta\s+name="twitter:description"[^>]*>\s*/gi],
  ["twitter:image", /<meta\s+name="twitter:image"[^>]*>\s*/gi],
  ["robots-index", /<meta\s+name="robots"\s+content="index,follow">\s*/gi],
];

function dedupe(head) {
  for (const [, re] of SINGLE) {
    let seen = false;
    head = head.replace(re, (m) => { if (seen) return ""; seen = true; return m; });
  }
  return head;
}

function applyPage(page) {
  const file = path.join(root, page.file);
  let html = fs.readFileSync(file, "utf8");
  const headEnd = html.indexOf("</head>");
  let head = html.slice(0, headEnd);
  const rest = html.slice(headEnd);
  const url = SITE + page.path;

  // Remember the project's own social image from Framer's tags before rewriting.
  const framerImage = head.match(/<meta\s+property="og:image"\s+content="(https:\/\/framerusercontent\.com\/[^"]+)"/i)?.[1];
  if (page.project && framerImage && !framerImage.includes("GfGHsUHib7Hu45pcUoEfLk9Fkk")) page.image = framerImage; // skip the generic site image

  // Drop our previous block (re-runs) and the legacy Framer "OPTIMIZED SEO HEAD" snippet, which
  // duplicated every tag and carried unverified NAP data (phone, postcode, hours, coordinates).
  head = head.replace(new RegExp(`${START}[\\s\\S]*?${END}\\s*`, "g"), "");
  head = head.replace(/<!-- Snippet: nnXbnDc1w -->[\s\S]*?<!-- SnippetEnd: nnXbnDc1w -->/g, "");
  head = head.replace(/<meta\s+name="(geo\.region|geo\.placename|geo\.position|ICBM)"[^>]*>\s*/gi, "");
  head = head.replace(/<meta\s+name="robots"\s+content="max-image-preview:large">\s*/gi, "");
  head = head.replace(/<script\s+src="\/seo-meta\.js"[^>]*><\/script>\s*/gi, "");
  if (!page.keepExistingSchema) head = head.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
  head = dedupe(head);

  const set = (re, tag) => { head = re.test(head) ? head.replace(re, tag) : head; };
  set(/<title>[\s\S]*?<\/title>/i, `<title>${esc(page.title)}</title>`);
  set(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${esc(page.description)}">`);
  set(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${esc(page.title)}">`);
  set(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${esc(page.description)}">`);
  set(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${esc(page.title)}">`);
  set(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${esc(page.description)}">`);
  head = head.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "").replace(/<meta\s+property="og:(url|site_name)"[^>]*>\s*/gi, "");
  if (page.project) head = head.replace(/<meta\s+property="og:type"[^>]*>/i, '<meta property="og:type" content="article">');

  // Team page keeps its AboutPage schema; correct its URL.
  head = head.replace(/("url":\s*")https:\/\/www\.vanillasometh\.in\/team\.html(")/, `$1${url}$2`);

  const schema = page.keepExistingSchema ? null : schemaFor({ ...page, PROJECTS });
  const block = [
    START,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="${esc(BRAND)}">`,
    schema ? `<script type="application/ld+json">\n${json(schema)}\n</script>` : "",
    `<script src="/seo-meta.js" defer></script>`,
    END,
  ].filter(Boolean).join("\n");

  head = head.replace(/\s*$/, "\n") + block + "\n";
  fs.writeFileSync(file, head + rest);
  return page;
}

const applied = PAGES.map(applyPage);

// Runtime guard: Framer re-applies its own head values after hydration and on client-side
// navigation; this restores the intended values for the current path whenever <head> changes.
const map = {};
for (const p of applied) {
  const entry = { t: p.title, d: p.description, c: SITE + p.path };
  for (const k of [p.path, ...(p.altPaths || [])]) map[k] = entry;
}
const runtime = `/* Generated by scripts/seo/apply-framer-seo.mjs. Do not edit by hand. */
(function () {
  var M = ${JSON.stringify(map)};
  function key() { var p = location.pathname; if (M[p]) return p; if (p.slice(-1) !== "/" && M[p + "/"]) return p + "/"; return null; }
  function meta(attr, name, val) {
    var els = document.head.querySelectorAll("meta[" + attr + '="' + name + '"]');
    if (!els.length) { var m = document.createElement("meta"); m.setAttribute(attr, name); document.head.appendChild(m); els = [m]; }
    for (var i = 0; i < els.length; i++) if (els[i].getAttribute("content") !== val) els[i].setAttribute("content", val);
  }
  var busy = false;
  function apply() {
    var k = key(); if (!k || busy) return; var e = M[k]; busy = true;
    try {
      if (document.title !== e.t) document.title = e.t;
      meta("name", "description", e.d); meta("property", "og:title", e.t); meta("property", "og:description", e.d);
      meta("name", "twitter:title", e.t); meta("name", "twitter:description", e.d); meta("property", "og:url", e.c);
      var links = document.head.querySelectorAll('link[rel="canonical"]');
      if (!links.length) { var l = document.createElement("link"); l.rel = "canonical"; document.head.appendChild(l); links = [l]; }
      for (var i = 0; i < links.length; i++) if (links[i].getAttribute("href") !== e.c) links[i].setAttribute("href", e.c);
    } finally { busy = false; }
  }
  apply();
  new MutationObserver(apply).observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["content", "href"] });
})();
`;
fs.writeFileSync(path.join(root, "seo-meta.js"), runtime);

for (const p of applied) {
  const warn = [p.title.length > 70 && `title ${p.title.length} chars`, p.description.length > 160 && `description ${p.description.length} chars`].filter(Boolean);
  console.log(`${p.path.padEnd(34)} ${warn.length ? "WARN " + warn.join(", ") : "ok"}`);
}
