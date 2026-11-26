#!/usr/bin/env node
// Builds the site's own pages (home, works, project pages, team, contact) from site/
// and installs them into public/, next to the CMS pages, the estimator and the functions.
//
//   node scripts/build-site.mjs            # npm ci + next build, then install
//   node scripts/build-site.mjs --no-build # install an existing site/out
//
// Each page keeps its production SEO head (title, description, canonical, Open Graph,
// JSON-LD, analytics), stored in site/seo/<page>.html. Next renders the title and
// description from that file (site/src/lib/seo.ts); this script adds the other tags.

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const out = join(site, "out");
const pub = join(root, "public");

if (!process.argv.includes("--no-build")) {
  execSync("npm ci --no-audit --no-fund", { cwd: site, stdio: "inherit" });
  execSync("npm run build", { cwd: site, stdio: "inherit" });
}
if (!existsSync(join(out, "index.html"))) throw new Error("site/out/index.html missing: the site build failed");

// out/ path -> public/ path. /team.html is the page's long-standing URL, so it stays.
const target = (rel) => {
  if (rel === "team/index.html") return "team.html";
  return rel;
};
// Next's own 404 page and favicon are not used: Netlify serves its 404, and the icons come from the SEO head.
const skip = (rel) => rel === "404.html" || rel.startsWith("404/") || rel.startsWith("_not-found/") || rel === "favicon.ico";

const seoFor = (rel) => {
  const page = rel === "index.html" ? "index" : rel.replace(/\/index\.html$/, "");
  const file = join(site, "seo", `${page}.html`);
  return existsSync(file) ? readFileSync(file, "utf8").trim() : null;
};

// Analytics and Search Console verification, shared by every page (taken from the home page's head)
const sharedHead = () => {
  const home = readFileSync(join(site, "seo", "index.html"), "utf8");
  return [...home.matchAll(/<script>[\s\S]*?<\/script>|<meta name="google-site-verification"[^>]*>|<link [^>]*rel="(?:icon|apple-touch-icon)"[^>]*>|<link rel="apple-touch-icon"[^>]*>/g)]
    .map((m) => m[0])
    .filter((t) => !/ld\+json/.test(t))
    .join("\n");
};
const cmsProjectHead = (rel, html) => {
  const SITE = "https://www.vanillasometh.in";
  const url = `${SITE}/${rel.replace(/index\.html$/, "")}`;
  const decode = (t) => (t || "").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1]);
  const name = title.split(/,| \| /)[0];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CreativeWork", name, description, url, creator: { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Vanilla & Somethin'" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/project-showcase/` },
        { "@type": "ListItem", position: 3, name, item: url },
      ] },
    ],
  };
  return [
    sharedHead(),
    `<link rel="canonical" href="${url}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="Vanilla &amp; Somethin'">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
};

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

// a fresh copy of the build's own folders, so files from an older build don't linger
for (const dir of ["_next", "sites", "icons"]) rmSync(join(pub, dir), { recursive: true, force: true });

let pages = 0;
const missingSeo = [];
for (const file of walk(out)) {
  const rel = relative(out, file).split("\\").join("/");
  if (skip(rel)) continue;
  const dest = join(pub, target(rel));
  mkdirSync(dirname(dest), { recursive: true });
  if (!rel.endsWith(".html")) {
    cpSync(file, dest);
    continue;
  }
  let html = readFileSync(file, "utf8");
  const seo = seoFor(rel);
  if (seo) {
    // The title and description already come from the same file through Next's
    // metadata (site/src/lib/seo.ts), so add only the rest; check they agree.
    const want = seo.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const got = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const norm = (t) => (t || "").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').trim();
    if (norm(want) !== norm(got)) throw new Error(`${rel}: built title "${got}" does not match site/seo ("${want}")`);
    const rest = seo
      .replace(/<title>[\s\S]*?<\/title>\n?/, "")
      .replace(/<meta name="description"[^>]*>\n?/, "");
    html = html.replace(/<link rel="icon"[^>]*>/g, "").replace("</head>", `${rest}\n</head>`);
  } else if (rel.startsWith("project-showcase/")) {
    // A project added in the admin ("Page design: Showcase"): Next rendered its title,
    // description and image; add the canonical, analytics and structured data the
    // designed case studies carry.
    html = html.replace(/<link rel="icon"[^>]*>/g, "").replace("</head>", `${cmsProjectHead(rel, html)}\n</head>`);
  } else {
    missingSeo.push(rel);
  }
  writeFileSync(dest, html);
  pages += 1;
}
console.log(`installed ${pages} pages from site/out into public/`);
if (missingSeo.length) console.log(`no SEO head in site/seo for: ${missingSeo.join(", ")}`);
