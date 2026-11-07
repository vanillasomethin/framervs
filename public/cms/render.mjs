// Shared renderer for CMS-managed pages (blog, projects, updates).
//
// Used in two places so the admin preview matches the live site exactly:
//   - scripts/build-cms.mjs (Node, at Netlify build time) writes static HTML
//     into public/blog, public/projects and public/updates
//   - public/admin/admin.js (browser) renders live previews while editing
//
// Keep this file dependency-free and environment-agnostic (no DOM, no fs).

export const SITE_URL = "https://www.vanillasometh.in";
export const SITE_NAME = "Vanilla & Somethin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const escapeHTML = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

// Only allow safe URL schemes in links and images written by editors.
export const safeUrl = (url) => {
  const value = String(url ?? "").trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (/^[/#.]/.test(value)) return value;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(value)) return `https://${value}`;
  return "";
};

export const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

export const isPublished = (item) => item && item.status === "published";

const byDateDesc = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));

export const publishedPosts = (cms) => (cms.blog || []).filter(isPublished).sort(byDateDesc);
export const publishedProjects = (cms) => (cms.projects || []).filter(isPublished);
export const publishedUpdates = (cms) => (cms.updates || []).filter(isPublished).sort(byDateDesc);

const readingTime = (markdown) => {
  const words = String(markdown || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

// ---------------------------------------------------------------------------
// Markdown (small, safe subset: headings, paragraphs, lists, quotes, images,
// horizontal rules, bold, italic, inline code, links). All text is escaped.
// ---------------------------------------------------------------------------

const renderInline = (text) => {
  let out = escapeHTML(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_\w])_([^_\s][^_]*)_(?=[^\w]|$)/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
    // href was escaped above; undo &amp; so the URL survives, then re-escape
    const url = safeUrl(href.replace(/&amp;/g, "&"));
    if (!url) return label;
    const external = /^https?:/i.test(url) && !url.startsWith(SITE_URL);
    return `<a href="${escapeHTML(url)}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  });
  return out;
};

export const markdownToHTML = (markdown) => {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = null;
  let quote = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((i) => `<li>${renderInline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) html.push(`<blockquote><p>${quote.map(renderInline).join("<br>")}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      const level = heading[1].length + 1; // # → h2 (page title is the h1)
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushAll();
      html.push("<hr>");
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      flushAll();
      const src = safeUrl(image[2]);
      if (src) {
        const caption = image[1] ? `<figcaption>${escapeHTML(image[1])}</figcaption>` : "";
        html.push(`<figure><img src="${escapeHTML(src)}" alt="${escapeHTML(image[1])}" loading="lazy">${caption}</figure>`);
      }
      continue;
    }

    const quoteLine = trimmed.match(/^>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1]);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }
  flushAll();
  return html.join("\n");
};

// Plain-text summary for meta descriptions and cards
export const plainText = (markdown, max = 160) => {
  const text = String(markdown || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const STYLES = `
:root{--bg:#0d0d0d;--fg:#fff;--muted:#adadad;--line:rgba(255,255,255,.12);--accent:#f21d2f;--card:#151515}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-family:"Inter",system-ui,-apple-system,sans-serif;font-size:17px;line-height:1.65}
a{color:inherit}
img{max-width:100%;display:block}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.narrow{max-width:760px}
header.site{position:sticky;top:0;z-index:10;background:rgba(13,13,13,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;height:68px}
.brand{font-family:"Space Grotesk",sans-serif;font-weight:700;letter-spacing:.02em;text-decoration:none;font-size:18px;white-space:nowrap}
.brand span{color:var(--accent)}
nav.site{display:flex;gap:22px;overflow-x:auto;scrollbar-width:none}
nav.site::-webkit-scrollbar{display:none}
nav.site a{font-family:"Fragment Mono",monospace;font-size:13px;text-transform:uppercase;letter-spacing:.06em;text-decoration:none;color:var(--muted);white-space:nowrap}
nav.site a:hover,nav.site a[aria-current]{color:var(--fg)}
main{padding:56px 0 96px}
.eyebrow{font-family:"Fragment Mono",monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 14px}
h1,h2,h3,h4{font-family:"Space Grotesk",sans-serif;line-height:1.15;letter-spacing:-.01em}
h1{font-size:clamp(36px,6vw,72px);margin:0 0 20px;text-transform:uppercase}
.lede{color:var(--muted);font-size:clamp(17px,2vw,20px);max-width:720px;margin:0}
.meta{font-family:"Fragment Mono",monospace;font-size:13px;color:var(--muted);letter-spacing:.04em;text-transform:uppercase;display:flex;flex-wrap:wrap;gap:6px 18px}
.grid{display:grid;gap:28px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));margin-top:48px}
.card{display:flex;flex-direction:column;text-decoration:none;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card);transition:border-color .2s,transform .2s}
.card:hover{border-color:rgba(255,255,255,.35);transform:translateY(-2px)}
.card .thumb{aspect-ratio:4/3;background:#1d1d1d;overflow:hidden}
.card .thumb img{width:100%;height:100%;object-fit:cover}
.card .body{padding:20px 22px 24px;display:flex;flex-direction:column;gap:8px}
.card h2,.card h3{font-size:22px;margin:0}
.card p{margin:0;color:var(--muted);font-size:15px}
.cover{margin:40px 0 0;border-radius:14px;overflow:hidden;background:#1d1d1d}
.cover img{width:100%;max-height:72vh;object-fit:cover}
.prose{margin-top:44px}
.prose p,.prose li{color:#e6e6e6}
.prose h2{font-size:30px;margin:48px 0 12px}
.prose h3{font-size:23px;margin:36px 0 10px}
.prose h4{font-size:19px;margin:28px 0 8px}
.prose a{color:var(--fg);text-decoration-color:var(--accent);text-underline-offset:3px}
.prose blockquote{margin:28px 0;padding:4px 0 4px 22px;border-left:3px solid var(--accent);font-size:21px;font-family:"Space Grotesk",sans-serif}
.prose figure{margin:32px 0}
.prose figure img{border-radius:10px;width:100%}
.prose figcaption{font-size:14px;color:var(--muted);margin-top:8px}
.prose hr{border:0;border-top:1px solid var(--line);margin:40px 0}
.prose code{font-family:"Fragment Mono",monospace;background:#1d1d1d;padding:2px 6px;border-radius:4px;font-size:.9em}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-top:36px}
.facts div{background:var(--bg);padding:16px 18px}
.facts dt{font-family:"Fragment Mono",monospace;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.facts dd{margin:4px 0 0;font-family:"Space Grotesk",sans-serif;font-size:18px}
.gallery{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));margin-top:48px}
.gallery img{width:100%;border-radius:10px;aspect-ratio:4/3;object-fit:cover}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px}
.tags span{border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:13px;color:var(--muted)}
.timeline{margin-top:48px;border-left:1px solid var(--line);padding-left:28px;display:grid;gap:44px}
.timeline article{position:relative}
.timeline article::before{content:"";position:absolute;left:-34px;top:9px;width:11px;height:11px;border-radius:50%;background:var(--accent)}
.timeline h2{font-size:26px;margin:6px 0 10px}
.timeline img{border-radius:10px;margin-top:16px;max-height:420px;object-fit:cover;width:100%}
.timeline .prose{margin-top:0}
.btn{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:10px 18px;border-radius:999px;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;font-size:15px}
.back{display:inline-block;margin-bottom:28px;font-family:"Fragment Mono",monospace;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);text-decoration:none}
.back:hover{color:var(--fg)}
.empty{margin-top:48px;color:var(--muted);border:1px dashed var(--line);border-radius:14px;padding:40px;text-align:center}
.more{margin-top:56px}
footer.site{border-top:1px solid var(--line);padding:48px 0;color:var(--muted);font-size:14px}
footer.site .wrap{display:flex;flex-wrap:wrap;gap:24px 48px;justify-content:space-between}
footer.site a{text-decoration:none}
footer.site a:hover{color:var(--fg)}
footer.site .cols{display:flex;flex-wrap:wrap;gap:24px 48px}
@media (max-width:640px){.wrap{padding:0 16px}main{padding:36px 0 72px}.grid,.gallery{grid-template-columns:1fr}header.site .wrap{height:auto;padding-top:14px;padding-bottom:14px;flex-direction:column;align-items:flex-start;gap:10px}nav.site{width:100%;gap:18px}}
`;

const NAV = [
  { href: "/project-showcase", label: "Work" },
  { href: "/projects/", label: "Projects", key: "projects" },
  { href: "/blog/", label: "Journal", key: "blog" },
  { href: "/updates/", label: "Updates", key: "updates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export const layout = ({ title, description, path, image, section, body, cms, jsonLd }) => {
  const contact = cms?.contact || {};
  const url = `${SITE_URL}${path}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const ogImage = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : "";
  const socials = (contact.social || [])
    .filter((s) => safeUrl(s.url))
    .map((s) => `<a href="${escapeHTML(safeUrl(s.url))}" target="_blank" rel="noopener">${escapeHTML(s.label)}</a>`)
    .join("<br>");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(fullTitle)}</title>
<meta name="description" content="${escapeHTML(description || "")}">
<link rel="canonical" href="${escapeHTML(url)}">
<meta property="og:type" content="${section === "blog" && path !== "/blog/" ? "article" : "website"}">
<meta property="og:site_name" content="${escapeHTML(SITE_NAME)}">
<meta property="og:title" content="${escapeHTML(title || SITE_NAME)}">
<meta property="og:description" content="${escapeHTML(description || "")}">
<meta property="og:url" content="${escapeHTML(url)}">
${ogImage ? `<meta property="og:image" content="${escapeHTML(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>${STYLES}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-88SHPS1HB3"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-88SHPS1HB3");</script>
</head>
<body>
<header class="site"><div class="wrap">
<a class="brand" href="/">VANILLA <span>&amp;</span> SOMETHIN</a>
<nav class="site" aria-label="Main">${NAV.map(
    (n) => `<a href="${n.href}"${n.key && n.key === section ? ' aria-current="page"' : ""}>${n.label}</a>`
  ).join("")}</nav>
</div></header>
<main><div class="wrap">
${body}
</div></main>
<footer class="site"><div class="wrap">
<div><a class="brand" href="/">VANILLA <span>&amp;</span> SOMETHIN</a><p>${(contact.locations || []).map(escapeHTML).join(" · ")}</p></div>
<div class="cols">
<div>${contact.phone ? `<a href="tel:${escapeHTML(String(contact.phone).replace(/\s+/g, ""))}">${escapeHTML(contact.phone)}</a><br>` : ""}${contact.email ? `<a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a>` : ""}</div>
<div>${socials}</div>
</div>
</div></footer>
</body>
</html>
`;
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const img = (image, cls = "") =>
  image?.src && safeUrl(image.src)
    ? `<img${cls ? ` class="${cls}"` : ""} src="${escapeHTML(safeUrl(image.src))}" alt="${escapeHTML(image.alt || "")}" loading="lazy">`
    : "";

const postCard = (post) => `<a class="card" href="/blog/${escapeHTML(post.slug)}/">
<div class="thumb">${img(post.cover)}</div>
<div class="body">
<div class="meta"><span>${escapeHTML(formatDate(post.date))}</span><span>${readingTime(post.body)} min read</span></div>
<h2>${escapeHTML(post.title)}</h2>
<p>${escapeHTML(post.excerpt || plainText(post.body, 140))}</p>
</div></a>`;

const projectCard = (project) => `<a class="card" href="/projects/${escapeHTML(project.slug)}/">
<div class="thumb">${img(project.cover)}</div>
<div class="body">
<div class="meta">${[project.category, project.location, project.year].filter(Boolean).map((v) => `<span>${escapeHTML(v)}</span>`).join("")}</div>
<h2>${escapeHTML(project.title)}</h2>
<p>${escapeHTML(project.summary || plainText(project.body, 140))}</p>
</div></a>`;

export const renderBlogIndex = (cms) => {
  const posts = publishedPosts(cms);
  const intro = cms.pagesIntro?.blog || {};
  return layout({
    cms,
    section: "blog",
    path: "/blog/",
    title: intro.title || "Journal",
    description: intro.description || "Ideas, process notes and stories from the Vanilla & Somethin studio.",
    image: posts[0]?.cover?.src,
    body: `<p class="eyebrow">[Journal]</p>
<h1>${escapeHTML(intro.title || "Journal")}</h1>
<p class="lede">${escapeHTML(intro.description || "Ideas, process notes and stories from the Vanilla & Somethin studio.")}</p>
${posts.length ? `<div class="grid">${posts.map(postCard).join("\n")}</div>` : '<p class="empty">New stories are on the way.</p>'}`,
  });
};

export const renderBlogPost = (cms, post) => {
  const description = post.seoDescription || post.excerpt || plainText(post.body);
  const related = publishedPosts(cms).filter((p) => p.slug !== post.slug).slice(0, 3);
  return layout({
    cms,
    section: "blog",
    path: `/blog/${post.slug}/`,
    title: post.title,
    description,
    image: post.cover?.src,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      datePublished: post.date,
      description,
      author: { "@type": "Organization", name: post.author || SITE_NAME },
      ...(post.cover?.src ? { image: post.cover.src } : {}),
    },
    body: `<div class="narrow" style="margin:0 auto">
<a class="back" href="/blog/">← All stories</a>
<div class="meta"><span>${escapeHTML(formatDate(post.date))}</span>${post.author ? `<span>${escapeHTML(post.author)}</span>` : ""}<span>${readingTime(post.body)} min read</span></div>
<h1 style="margin-top:14px">${escapeHTML(post.title)}</h1>
${post.excerpt ? `<p class="lede">${escapeHTML(post.excerpt)}</p>` : ""}
</div>
${post.cover?.src ? `<div class="cover">${img(post.cover)}</div>` : ""}
<div class="narrow" style="margin:0 auto">
<div class="prose">${markdownToHTML(post.body)}</div>
${(post.tags || []).length ? `<div class="tags">${post.tags.map((t) => `<span>${escapeHTML(t)}</span>`).join("")}</div>` : ""}
</div>
${related.length ? `<div class="more"><p class="eyebrow">[More from the journal]</p><div class="grid" style="margin-top:20px">${related.map(postCard).join("\n")}</div></div>` : ""}`,
  });
};

export const renderProjectsIndex = (cms) => {
  const projects = publishedProjects(cms);
  const intro = cms.pagesIntro?.projects || {};
  return layout({
    cms,
    section: "projects",
    path: "/projects/",
    title: intro.title || "Projects",
    description: intro.description || "Architecture, interiors and landscape projects by Vanilla & Somethin.",
    image: projects[0]?.cover?.src,
    body: `<p class="eyebrow">[Projects]</p>
<h1>${escapeHTML(intro.title || "Projects")}</h1>
<p class="lede">${escapeHTML(intro.description || "Architecture, interiors and landscape projects by Vanilla & Somethin.")}</p>
${projects.length ? `<div class="grid">${projects.map(projectCard).join("\n")}</div>` : '<p class="empty">New projects are on the way.</p>'}
<p class="more"><a class="btn" href="/project-showcase">See the full showcase →</a></p>`,
  });
};

export const renderProject = (cms, project) => {
  const description = project.summary || plainText(project.body);
  const facts = [
    ["Client", project.client],
    ["Location", project.location],
    ["Year", project.year],
    ["Type", project.category],
    ["Area", project.area],
    ["Status", project.projectStatus],
  ].filter(([, v]) => v);
  const others = publishedProjects(cms).filter((p) => p.slug !== project.slug).slice(0, 3);
  return layout({
    cms,
    section: "projects",
    path: `/projects/${project.slug}/`,
    title: project.title,
    description,
    image: project.cover?.src,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.title,
      description,
      creator: { "@type": "Organization", name: SITE_NAME },
      ...(project.cover?.src ? { image: project.cover.src } : {}),
    },
    body: `<a class="back" href="/projects/">← All projects</a>
<p class="eyebrow">[${escapeHTML(project.category || "Project")}]</p>
<h1>${escapeHTML(project.title)}</h1>
${project.summary ? `<p class="lede">${escapeHTML(project.summary)}</p>` : ""}
${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join("")}</dl>` : ""}
${project.cover?.src ? `<div class="cover">${img(project.cover)}</div>` : ""}
${project.body ? `<div class="narrow prose">${markdownToHTML(project.body)}</div>` : ""}
${(project.gallery || []).filter((g) => g?.src).length ? `<div class="gallery">${project.gallery.filter((g) => g?.src).map((g) => img(g)).join("")}</div>` : ""}
<p class="more"><a class="btn" href="/contact">Start a project with us →</a></p>
${others.length ? `<div class="more"><p class="eyebrow">[More projects]</p><div class="grid" style="margin-top:20px">${others.map(projectCard).join("\n")}</div></div>` : ""}`,
  });
};

export const renderUpdates = (cms) => {
  const updates = publishedUpdates(cms);
  const intro = cms.pagesIntro?.updates || {};
  return layout({
    cms,
    section: "updates",
    path: "/updates/",
    title: intro.title || "Studio Updates",
    description: intro.description || "News, milestones and announcements from the Vanilla & Somethin studio.",
    body: `<p class="eyebrow">[Updates]</p>
<h1>${escapeHTML(intro.title || "Studio Updates")}</h1>
<p class="lede">${escapeHTML(intro.description || "News, milestones and announcements from the Vanilla & Somethin studio.")}</p>
${updates.length ? `<div class="timeline">${updates
      .map(
        (u) => `<article id="${escapeHTML(u.slug || slugify(u.title))}">
<div class="meta"><span>${escapeHTML(formatDate(u.date))}</span></div>
<h2>${escapeHTML(u.title)}</h2>
<div class="prose">${markdownToHTML(u.body)}</div>
${img(u.image)}
${u.link?.url && safeUrl(u.link.url) ? `<a class="btn" href="${escapeHTML(safeUrl(u.link.url))}">${escapeHTML(u.link.label || "Learn more")} →</a>` : ""}
</article>`
      )
      .join("\n")}</div>` : '<p class="empty">No updates yet.</p>'}`,
  });
};

// Every page the build should write, as [path relative to public/, html]
export const renderAllPages = (cms) => {
  const pages = [
    ["blog/index.html", renderBlogIndex(cms)],
    ["projects/index.html", renderProjectsIndex(cms)],
    ["updates/index.html", renderUpdates(cms)],
  ];
  for (const post of publishedPosts(cms)) pages.push([`blog/${post.slug}/index.html`, renderBlogPost(cms, post)]);
  for (const project of publishedProjects(cms)) pages.push([`projects/${project.slug}/index.html`, renderProject(cms, project)]);
  return pages;
};

export const sitemapPaths = (cms) => [
  "/blog/",
  "/projects/",
  "/updates/",
  ...publishedPosts(cms).map((p) => `/blog/${p.slug}/`),
  ...publishedProjects(cms).map((p) => `/projects/${p.slug}/`),
];
