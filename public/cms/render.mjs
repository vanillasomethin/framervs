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
:root{--bg:#0d0d0d;--fg:#fff;--muted:#adadad;--line:rgba(255,255,255,.12);--accent:#f21d2f;--card:#151515;--vs-ease:cubic-bezier(.22,1,.36,1)}
@media(prefers-reduced-motion:no-preference){
.vs-reveal{opacity:0;transform:translate3d(0,28px,0);filter:blur(5px);transition:opacity .75s var(--vs-ease),transform .85s var(--vs-ease),filter .75s ease;transition-delay:var(--vs-delay,0ms)}
.vs-reveal.vs-visible{opacity:1;transform:translate3d(0,0,0);filter:blur(0)}
.card .thumb img{transition:transform .9s var(--vs-ease)}
.card:hover .thumb img,.card:focus-visible .thumb img{transform:scale(1.045)}
.cover{overflow:hidden}.cover img.vs-parallax{transform:translate3d(0,var(--vs-parallax-y,0px),0) scale(1.06);will-change:transform}
.project-media-group .media-item img{transition:transform .65s var(--vs-ease),filter .65s ease}
.project-media-group .media-item:hover img{transform:scale(1.025);filter:brightness(1.05)}
.btn{transition:transform .25s var(--vs-ease),filter .25s ease}.btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.back{transition:color .2s ease,transform .2s var(--vs-ease)}.back:hover{transform:translateX(-4px)}
}
@media(prefers-reduced-motion:reduce){.vs-reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}.cover img.vs-parallax{transform:none!important}}
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
.brand{display:inline-flex;align-items:center;gap:10px}.brand img{width:30px;height:30px;border-radius:50%}
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
.gallery{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));margin-top:22px}
.gallery img{width:100%;border-radius:10px;aspect-ratio:4/3;object-fit:cover}
.project-media-group{margin-top:44px}
.project-media-group h2{font-size:22px;margin-bottom:14px}
.media-item{display:block;text-decoration:none;color:var(--fg)}
.media-item img{transition:transform .25s ease}
.media-item:hover img{transform:scale(1.01)}
.media-caption{display:block;color:var(--muted);font-size:13px;margin-top:7px}
.document-card{display:flex;flex-direction:column;justify-content:space-between;gap:14px;min-height:180px;padding:24px;border:1px solid var(--line);border-radius:10px;background:var(--panel);text-decoration:none;color:var(--fg)}
.document-card span{font-family:"Fragment Mono",monospace;font-size:11px;letter-spacing:.1em;color:var(--accent)}
.document-card strong{font-size:18px;font-weight:500;overflow-wrap:anywhere}
.document-card small{color:var(--muted)}
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

const SHOP_STYLES = `
main.shop{padding-top:36px}
.wrap.wide{max-width:1480px}
input[type=radio],input[type=checkbox]{accent-color:#f21d2f}
.shop h1{font-size:clamp(28px,4vw,48px);letter-spacing:.01em}
.shop-bar{display:flex;flex-wrap:wrap;gap:8px 22px;margin:28px 0 8px;font-family:"Fragment Mono",monospace;font-size:12.5px;text-transform:uppercase;letter-spacing:.08em}
.shop-bar button,.shop-bar a{background:none;border:0;color:var(--muted);cursor:pointer;padding:6px 0;font:inherit;text-decoration:none;border-bottom:1px solid transparent}
.shop-bar button[aria-pressed=true],.shop-bar a:hover,.shop-bar button:hover{color:var(--fg);border-bottom-color:var(--accent)}
.lists{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:2px;margin:32px 0 8px}
.list-tile{position:relative;aspect-ratio:16/10;overflow:hidden;background:#1d1d1d;display:block;text-decoration:none}
.list-tile img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.list-tile:hover img{transform:scale(1.03)}
.list-tile span{position:absolute;left:16px;bottom:14px;font-family:"Space Grotesk",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.02em;font-size:18px;text-shadow:0 1px 12px rgba(0,0,0,.6)}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px 2px;margin-top:20px}
.pcard[hidden]{display:none}
.pcard{display:block;text-decoration:none;position:relative}
.pcard .pimg{aspect-ratio:3/4;background:#1a1a1a;overflow:hidden}
.pcard .pimg img{width:100%;height:100%;object-fit:cover;transition:opacity .35s,transform .6s}
.pcard .pimg img+img{position:absolute;inset:0;opacity:0}
.pcard:hover .pimg img+img{opacity:1}
.pcard .pinfo{display:flex;justify-content:space-between;gap:12px;padding:10px 12px 22px;font-size:12.5px;text-transform:uppercase;letter-spacing:.03em;line-height:1.4}
.pcard .pinfo b{font-weight:500}
.pcard .pinfo small{display:block;color:var(--muted);font-size:11px;letter-spacing:.06em;margin-top:2px}
.price s{color:var(--muted);margin-right:6px}
.tag-aff{position:absolute;top:10px;left:10px;font-family:"Fragment Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:rgba(13,13,13,.8);padding:3px 8px;border-radius:99px}
.pdp{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(320px,1fr);gap:48px;align-items:start}
.pdp .imgs{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.pdp .imgs img{width:100%;aspect-ratio:3/4;object-fit:cover;background:#1a1a1a}
.pdp .imgs img:first-child{grid-column:1/-1;aspect-ratio:4/5}
.pdp .info{position:sticky;top:96px;display:grid;gap:18px}
.pdp h1{font-size:clamp(22px,2.6vw,30px);margin:0}
.pdp .price{font-size:18px}
.pdp .desc{color:#dcdcdc;font-size:15px;line-height:1.7}
.pdp .desc p{margin:0 0 12px}
.opt{display:flex;flex-wrap:wrap;gap:8px}
.opt label{border:1px solid var(--line);padding:9px 14px;font-size:12.5px;text-transform:uppercase;letter-spacing:.05em;cursor:pointer}
.opt input{position:absolute;opacity:0}
.opt input:checked+span,.opt label:has(input:checked){border-color:var(--fg);background:var(--fg);color:#0d0d0d}
.opt label:has(input:checked){border-color:var(--fg)}
.sbtn{display:block;width:100%;text-align:center;background:var(--fg);color:#0d0d0d;border:1px solid var(--fg);padding:15px 18px;font:500 13px "Inter",sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;text-decoration:none}
.sbtn:hover{background:transparent;color:var(--fg)}
.sbtn.ghost{background:transparent;color:var(--fg);border-color:var(--line)}
.sbtn[disabled]{opacity:.4;cursor:not-allowed}
.note{font-size:12px;color:var(--muted);line-height:1.6}
.crumb{font-family:"Fragment Mono",monospace;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:20px}
.crumb a{text-decoration:none}
.sform{display:grid;gap:14px;max-width:460px}
.sform label{display:grid;gap:6px;font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.sform input,.sform select,.sform textarea{background:transparent;border:0;border-bottom:1px solid var(--line);color:var(--fg);font:400 16px "Inter",sans-serif;padding:9px 0;outline:none;border-radius:0}
.sform input:focus,.sform select:focus,.sform textarea:focus{border-bottom-color:var(--fg)}
.sform select option{background:#151515}
.sform .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.err{color:#ff7a80;font-size:14px;min-height:20px}
.ok{color:#6fe3a0}
.co{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:64px;align-items:start}
.bagline{display:grid;grid-template-columns:84px 1fr auto;gap:16px;padding:16px 0;border-bottom:1px solid var(--line);align-items:start;font-size:13px;text-transform:uppercase;letter-spacing:.03em}
.bagline img{width:84px;aspect-ratio:3/4;object-fit:cover;background:#1a1a1a}
.bagline .q{display:inline-flex;gap:12px;align-items:center;margin-top:8px}
.bagline .q button{background:none;border:1px solid var(--line);color:var(--fg);width:26px;height:26px;cursor:pointer}
.bagline .rm{background:none;border:0;color:var(--muted);cursor:pointer;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-top:8px;padding:0;display:block}
.sum{border:1px solid var(--line);padding:24px;display:grid;gap:12px;font-size:14px}
.sum div{display:flex;justify-content:space-between}
.sum .t{border-top:1px solid var(--line);padding-top:12px;font-weight:600;font-size:16px}
.tabs{display:flex;gap:24px;margin-bottom:28px;font-family:"Fragment Mono",monospace;font-size:12.5px;text-transform:uppercase;letter-spacing:.08em}
.tabs button{background:none;border:0;color:var(--muted);cursor:pointer;padding:6px 0;font:inherit;border-bottom:1px solid transparent}
.tabs button[aria-selected=true]{color:var(--fg);border-bottom-color:var(--accent)}
.orders .order{border:1px solid var(--line);padding:18px 20px;margin-bottom:12px;display:grid;gap:6px;font-size:14px}
.st{font-family:"Fragment Mono",monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent)}
@media (max-width:980px){.pgrid{grid-template-columns:repeat(2,1fr)}.pdp,.co{grid-template-columns:1fr;gap:28px}.pdp .info{position:static}}
@media (max-width:640px){.sform .two{grid-template-columns:1fr}}
`;

const NAV = [
  { href: "/project-showcase", label: "Work" },
  { href: "/projects/", label: "Projects", key: "projects" },
  { href: "/blog/", label: "Journal", key: "blog" },
  { href: "/updates/", label: "Updates", key: "updates" },
  { href: "/shop/", label: "Shop", key: "shop" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export const layout = ({ title, description, path, image, section, body, cms, jsonLd, noindex, shop }) => {
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
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ""}<link rel="icon" type="image/png" href="/brand/vs-mark-light.png">
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
<style>${STYLES}${shop ? SHOP_STYLES : ""}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
<script>(function(){var d=0;function l(){if(d)return;d=1;var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id=G-88SHPS1HB3";document.head.appendChild(s)}["pointerdown","keydown","scroll","touchstart"].forEach(function(e){addEventListener(e,l,{once:true,passive:true})});function t(){setTimeout(l,3500)}document.readyState==="complete"?t():addEventListener("load",t)})();</script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-88SHPS1HB3");</script>
</head>
<body>
<header class="site"><div class="wrap${shop ? " wide" : ""}">
<a class="brand" href="/"><img src="/brand/vs-mark-light.png" alt="" width="30" height="30">VANILLA <span>&amp;</span> SOMETHIN</a>
<nav class="site" aria-label="Main">${NAV.map(
    (n) => `<a href="${n.href}"${n.key && n.key === section ? ' aria-current="page"' : ""}>${n.label}</a>`
  ).join("")}${shop ? '<a href="/shop/account/" data-account-link>Account</a><a href="/shop/checkout/" data-bag-link>Bag (<span data-bag-count>0</span>)</a>' : ""}</nav>
</div></header>
<main${shop ? ' class="shop"' : ""}><div class="wrap${shop ? " wide" : ""}">
${body}
</div></main>
<footer class="site"><div class="wrap${shop ? " wide" : ""}">
<div><a class="brand" href="/"><img src="/brand/vs-mark-light.png" alt="" width="30" height="30">VANILLA <span>&amp;</span> SOMETHIN</a><p>${(contact.locations || []).map(escapeHTML).join(" · ")}</p></div>
<div class="cols">
<div>${contact.phone ? `<a href="tel:${escapeHTML(String(contact.phone).replace(/\s+/g, ""))}">${escapeHTML(contact.phone)}</a><br>` : ""}${contact.email ? `<a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a>` : ""}</div>
<div>${socials}</div>
</div>
</div></footer>
<script src="/cms/motion.js" defer></script>
${shop ? '<script src="/cms/shop.js" defer></script>' : ""}
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
${intro.body ? `<div class="narrow prose">${markdownToHTML(intro.body)}</div>` : ""}
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
${intro.body ? `<div class="narrow prose">${markdownToHTML(intro.body)}</div>` : ""}
${projects.length ? `<div class="grid">${projects.map(projectCard).join("\n")}</div>` : '<p class="empty">New projects are on the way.</p>'}
<p class="more"><a class="btn" href="/project-showcase">See the full showcase →</a></p>`,
  });
};

export const renderProject = (cms, project) => {
  const description = project.seoDescription || project.summary || plainText(project.body);
  const facts = [
    ["Client", project.client],
    ["Location", project.location],
    ["Year", project.year],
    ["Type", project.category],
    ["Area", project.area],
    ["Status", project.projectStatus],
  ].filter(([, v]) => v);
  const others = publishedProjects(cms).filter((p) => p.slug !== project.slug).slice(0, 3);
  const mediaGroups = [
    ["photo", "Project photography"],
    ["render", "3D visualisations"],
    ["plan", "Plans"],
    ["drawing", "Technical drawings"],
    ["document", "Project documents"],
  ].map(([kind, label]) => {
    const items = (project.gallery || []).filter((g) => g?.src && (g.kind || "photo") === kind && safeUrl(g.src));
    if (!items.length) return "";
    const content = items.map((g) => {
      const href = safeUrl(g.src);
      const isPDF = g.mediaType === "application/pdf" || href.toLowerCase().split("?")[0].endsWith(".pdf");
      return isPDF
        ? `<a class="document-card" href="${escapeHTML(href)}" target="_blank" rel="noopener"><span>PDF DOCUMENT</span><strong>${escapeHTML(g.alt || label)}</strong><small>Open drawing or document ↗</small></a>`
        : `<a class="media-item" href="${escapeHTML(href)}" target="_blank" rel="noopener">${img(g)}<span class="media-caption">${escapeHTML(g.alt || label)}</span></a>`;
    }).join("\n");
    return `<section class="project-media-group"><h2>${label}</h2><div class="gallery">${content}</div></section>`;
  }).join("\n");
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
      ...(project.tags?.length ? { keywords: project.tags.join(", ") } : {}),
    },
    body: `<a class="back" href="/projects/">← All projects</a>
<p class="eyebrow">[${escapeHTML(project.category || "Project")}]</p>
<h1>${escapeHTML(project.title)}</h1>
${project.summary ? `<p class="lede">${escapeHTML(project.summary)}</p>` : ""}
${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join("")}</dl>` : ""}
${project.cover?.src ? `<div class="cover">${img(project.cover)}</div>` : ""}
${project.body ? `<div class="narrow prose">${markdownToHTML(project.body)}</div>` : ""}
${mediaGroups}
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
${intro.body ? `<div class="narrow prose">${markdownToHTML(intro.body)}</div>` : ""}
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

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export const AFFILIATE = "Affiliate link";
export const publishedProducts = (cms) => (cms.products || []).filter(isPublished);
export const publishedLists = (cms) => (cms.shopLists || []).filter(isPublished);
export const priceNumber = (p) => Math.round(Number(String(p?.price ?? "").replace(/[^0-9.]/g, "")) || 0);
export const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const isAffiliate = (p) => p.type === AFFILIATE;
const productImg = (p, i = 0, cls = "") => (p.gallery?.[i]?.src ? img({ src: p.gallery[i].src, alt: p.gallery[i].alt || p.title }, cls) : "");
const priceHTML = (p) => {
  const price = priceNumber(p);
  const was = Math.round(Number(String(p.comparePrice || "").replace(/[^0-9.]/g, "")) || 0);
  if (!price) return isAffiliate(p) ? "See price" : "";
  return `<span class="price">${was > price ? `<s>${money(was)}</s>` : ""}${money(price)}</span>`;
};
const safeSlug = (v) => escapeHTML(String(v || "").replace(/[^a-z0-9-]/gi, ""));

const productCard = (p) => `<a class="pcard" href="/shop/${safeSlug(p.slug)}/" data-cat="${escapeHTML(p.category || "")}">
<div class="pimg">${productImg(p, 0)}${p.gallery?.[1]?.src ? productImg(p, 1) : ""}</div>
${isAffiliate(p) ? '<span class="tag-aff">Partner</span>' : ""}
<div class="pinfo"><div><b>${escapeHTML(p.title)}</b><small>${escapeHTML(p.brand || p.category || "")}</small></div>${priceHTML(p)}</div></a>`;

const SHOP_NOTE = "Some links on this page are affiliate links. If you buy through them we may earn a small commission at no extra cost to you. We only list pieces we would use in our own projects.";

export const renderShop = (cms) => {
  const products = publishedProducts(cms);
  const lists = publishedLists(cms);
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const intro = cms.pagesIntro?.shop || {};
  const title = intro.title || "Shop";
  const description = intro.description || "Furniture, furnishings and accessories chosen by the Vanilla & Somethin design studio.";
  return layout({
    cms, shop: true, section: "shop", path: "/shop/", title, description, image: products[0]?.gallery?.[0]?.src,
    body: `<p class="eyebrow">[Shop]</p><h1>${escapeHTML(title)}</h1><p class="lede">${escapeHTML(description)}</p>
${lists.length ? `<div class="lists">${lists.map((l) => `<a class="list-tile" href="/shop/lists/${safeSlug(l.slug)}/">${img(l.cover)}<span>${escapeHTML(l.title)}</span></a>`).join("")}</div>` : ""}
${cats.length ? `<div class="shop-bar" data-filter><button aria-pressed="true" data-cat="">All</button>${cats.map((c) => `<button aria-pressed="false" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("")}</div>` : ""}
${products.length ? `<div class="pgrid">${products.map(productCard).join("\n")}</div>` : '<p class="empty">The first pieces are arriving soon.</p>'}
<p class="note" style="margin-top:40px;max-width:70ch">${SHOP_NOTE}</p>`,
  });
};

export const renderShopProduct = (cms, p) => {
  const affiliate = isAffiliate(p);
  const price = priceNumber(p);
  const description = p.seoDescription || p.summary || plainText(p.body);
  const url = affiliate ? safeUrl(p.affiliateUrl) : "";
  const options = (p.options || []).filter(Boolean);
  const related = publishedProducts(cms).filter((o) => o.slug !== p.slug && o.category === p.category).slice(0, 4);
  const canBuy = !affiliate && price > 0 && p.inStock !== "No";
  return layout({
    cms, shop: true, section: "shop", path: `/shop/${p.slug}/`, title: p.title, description, image: p.gallery?.[0]?.src,
    jsonLd: {
      "@context": "https://schema.org", "@type": "Product", name: p.title, description,
      ...(p.gallery?.length ? { image: p.gallery.map((g) => g.src).filter(Boolean) } : {}),
      ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
      ...(price ? { offers: { "@type": "Offer", priceCurrency: "INR", price, availability: p.inStock === "No" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", ...(url ? { url } : { url: `${SITE_URL}/shop/${p.slug}/` }) } } : {}),
    },
    body: `<p class="crumb"><a href="/shop/">Shop</a>${p.category ? ` / ${escapeHTML(p.category)}` : ""}</p>
<div class="pdp"><div class="imgs">${(p.gallery || []).filter((g) => g?.src && safeUrl(g.src)).map((g) => img({ src: g.src, alt: g.alt || p.title })).join("") || '<div class="empty">Photos coming soon</div>'}</div>
<div class="info">
<div><h1>${escapeHTML(p.title)}</h1>${p.brand ? `<p class="note" style="margin:6px 0 0">${escapeHTML(p.brand)}</p>` : ""}</div>
<div class="price-line" style="font-size:18px">${priceHTML(p)}</div>
${p.summary ? `<p class="desc" style="margin:0">${escapeHTML(p.summary)}</p>` : ""}
${canBuy && options.length ? `<div class="opt" data-options>${options.map((o, i) => `<label><input type="radio" name="opt" value="${escapeHTML(o)}"${i === 0 ? " checked" : ""}>${escapeHTML(o)}</label>`).join("")}</div>` : ""}
${canBuy ? `<button class="sbtn" data-add data-id="${escapeHTML(p.id)}" data-slug="${safeSlug(p.slug)}" data-title="${escapeHTML(p.title)}" data-price="${price}" data-image="${escapeHTML(p.gallery?.[0]?.src || "")}">Add to bag</button>
<p class="note">Delivery and returns are confirmed at checkout. Pay by card, UPI or netbanking when online payment is on, or cash on delivery.</p>` : ""}
${affiliate ? `${url ? `<a class="sbtn" href="${escapeHTML(url)}" target="_blank" rel="sponsored nofollow noopener">Buy${p.affiliateStore ? ` at ${escapeHTML(p.affiliateStore)}` : ""} ↗</a>` : ""}<p class="note">${SHOP_NOTE} Price and stock are set by the partner store.</p>` : ""}
${!affiliate && p.inStock === "No" ? '<p class="note">Currently out of stock. <a href="/contact">Ask us when it returns</a>.</p>' : ""}
${p.body ? `<div class="desc prose" style="margin-top:0">${markdownToHTML(p.body)}</div>` : ""}
</div></div>
${related.length ? `<div class="more"><p class="eyebrow">[More ${escapeHTML(p.category)}]</p><div class="pgrid">${related.map(productCard).join("\n")}</div></div>` : ""}`,
  });
};

export const renderShopList = (cms, list) => {
  const items = (list.productIds || []).map((id) => publishedProducts(cms).find((p) => p.id === id)).filter(Boolean);
  return layout({
    cms, shop: true, section: "shop", path: `/shop/lists/${list.slug}/`, title: list.title, description: list.description || `${list.title}: a curated list from Vanilla & Somethin.`, image: list.cover?.src,
    body: `<p class="crumb"><a href="/shop/">Shop</a> / Curated lists</p><p class="eyebrow">[Curated list]</p><h1>${escapeHTML(list.title)}</h1>
${list.description ? `<p class="lede">${escapeHTML(list.description)}</p>` : ""}
${items.length ? `<div class="pgrid">${items.map(productCard).join("\n")}</div>` : '<p class="empty">This list is being put together.</p>'}
<p class="note" style="margin-top:40px;max-width:70ch">${SHOP_NOTE}</p>`,
  });
};

export const renderShopCheckout = (cms) => layout({
  cms, shop: true, noindex: true, section: "shop", path: "/shop/checkout/", title: "Your bag", description: "Review your bag and check out.",
  body: `<p class="eyebrow">[Bag]</p><h1>Your bag</h1><div id="checkout-root"><p class="note">Loading your bag…</p></div>`,
});
export const renderShopAccount = (cms) => layout({
  cms, shop: true, noindex: true, section: "shop", path: "/shop/account/", title: "Your account", description: "Sign in or create an account.",
  body: `<p class="eyebrow">[Account]</p><h1>Your account</h1><div id="account-root"><p class="note">Loading…</p></div>`,
});

// Every page the build should write, as [path relative to public/, html]
export const renderAllPages = (cms) => {
  const pages = [
    ["blog/index.html", renderBlogIndex(cms)],
    ["projects/index.html", renderProjectsIndex(cms)],
    ["updates/index.html", renderUpdates(cms)],
  ];
  pages.push(["shop/index.html", renderShop(cms)], ["shop/checkout/index.html", renderShopCheckout(cms)], ["shop/account/index.html", renderShopAccount(cms)]);
  for (const p of publishedProducts(cms)) pages.push([`shop/${p.slug}/index.html`, renderShopProduct(cms, p)]);
  for (const l of publishedLists(cms)) pages.push([`shop/lists/${l.slug}/index.html`, renderShopList(cms, l)]);
  for (const post of publishedPosts(cms)) pages.push([`blog/${post.slug}/index.html`, renderBlogPost(cms, post)]);
  for (const project of publishedProjects(cms)) pages.push([`projects/${project.slug}/index.html`, renderProject(cms, project)]);
  return pages;
};

export const sitemapPaths = (cms) => [
  "/blog/",
  "/projects/",
  "/updates/",
  "/shop/",
  ...publishedProducts(cms).map((p) => `/shop/${p.slug}/`),
  ...publishedLists(cms).map((l) => `/shop/lists/${l.slug}/`),
  ...publishedPosts(cms).map((p) => `/blog/${p.slug}/`),
  ...publishedProjects(cms).map((p) => `/projects/${p.slug}/`),
];
