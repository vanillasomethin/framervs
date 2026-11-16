// Shared by the Netlify build and admin live preview.
const esc = (value = "") => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plain = (value = "") => String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const imageList = (item) => (item.gallery || []).filter((entry) => entry && entry.src && entry.type !== "pdf").map((entry) => entry.src).filter(Boolean);
const textBlock = (html, className, tag, value) => {
  if (!value) return html;
  const re = new RegExp('(<div[^>]*class="[^"]*\\b' + className + '\\b[^"]*"[^>]*>[\\s\\S]*?<' + tag + '\\b[^>]*>)[\\s\\S]*?(</' + tag + '>)', "i");
  return html.replace(re, (_, before, after) => before + esc(value) + after);
};
const setMeta = (html, name, value) => {
  if (!value) return html;
  const safe = esc(value);
  const escapedName = name.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const re = new RegExp('(<meta\\s+[^>]*(?:name|property)="' + escapedName + '"[^>]*content=")[^"]*(")', "i");
  return re.test(html) ? html.replace(re, (_, before, after) => before + safe + after) : html;
};
const setImage = (tag, url, alt) => {
  if (!url) return tag;
  let out = tag.replace(/\s+srcset="[^"]*"/i, "").replace(/\s+data-framer-original-sizes="[^"]*"/i, "");
  out = out.replace(/\ssrc="[^"]*"/i, ' src="' + esc(url) + '"');
  if (!/\salt="/i.test(out)) out = out.replace(/<img\b/i, '<img alt="' + esc(alt || "") + '"');
  else out = out.replace(/\salt="[^"]*"/i, ' alt="' + esc(alt || "") + '"');
  return out;
};
const animatedHeading = (html, title) => html.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, (_, open, close) => {
  const chars = [...String(title || "Project")].map((char) => '<span style="display:inline-block;opacity:0.001;filter:blur(10px);transform:translateX(0px) translateY(10px) scale(1) rotate(0deg) skewX(0deg) skewY(0deg)">' + esc(char) + "</span>").join("");
  return open + '<span style="white-space:pre-wrap">' + chars + "</span>" + close;
});
const markdownToFramer = (body) => {
  const lines = String(body || "").split(/\r?\n/);
  const out = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) out.push('<p class="framer-text framer-styles-preset-122pj8j">' + esc(paragraph.join(" ")) + "</p>");
    paragraph = [];
  };
  for (const line of lines) {
    const value = line.trim();
    if (!value) { flush(); continue; }
    const heading = value.match(/^#{1,3}\s+(.+)$/);
    if (heading) { flush(); out.push('<h5 class="framer-text framer-styles-preset-152bc4">' + esc(heading[1]) + "</h5>"); }
    else if (/^[-*]\s+/.test(value)) { flush(); out.push('<p class="framer-text framer-styles-preset-122pj8j">• ' + esc(value.replace(/^[-*]\s+/, "")) + "</p>"); }
    else paragraph.push(value);
  }
  flush();
  return out.join("");
};
export function transformFramerProjectHTML(source, item) {
  let html = String(source || "");
  const title = item.title || "Project";
  const summary = item.summary || item.seoDescription || "";
  const cover = item.cover?.src || imageList(item)[0] || "";
  const gallery = imageList(item);
  const oldHeadingHTML = (html.match(/<h1\\b[^>]*>([\\s\\S]*?)<\\/h1>/i) || [,""])[1] || "";
  const oldProjectTitle = plain(oldHeadingHTML);
  const readClassText = (className, tag) => {
    const re = new RegExp('class="[^"]*\\\\b' + className + '\\\\b[^"]*"[^>]*>[\\\\s\\\\S]*?<' + tag + '\\\\b[^>]*>([\\\\s\\\\S]*?)<\\/' + tag + '>', "i");
    const match = html.match(re);
    return match ? plain(match[1]) : "";
  };
  const oldDescription = (html.match(/<meta name="description" content="([^"]*)"/i) || [,""])[1];
  const oldCover = (html.match(/class="framer-19f5tnp"[\\s\\S]*?<img\\b[^>]*src="([^"]+)"/i) || [,""])[1];
  const oldGalleryStart = html.indexOf('id="section-images-gallery"');
  const oldGalleryEnd = oldGalleryStart >= 0 ? html.indexOf('id="section-other-project"', oldGalleryStart) : -1;
  const oldGalleryBlock = oldGalleryStart >= 0 ? html.slice(oldGalleryStart, oldGalleryEnd > oldGalleryStart ? oldGalleryEnd : oldGalleryStart + 90000) : "";
  const oldGallerySources = [...new Set([...oldGalleryBlock.matchAll(/<img\\b[^>]*\\bsrc="([^"]+)"/gi)].map((match) => match[1]))];
  const oldFields = [
    [oldProjectTitle, title],
    [plain(oldDescription), summary],
    [readClassText("framer-1fqri61", "h5"), item.category],
    [readClassText("framer-ky5owd", "h5"), item.year],
    [readClassText("framer-1b8nbnx", "h5"), item.client],
    [readClassText("framer-1f881x7", "h5"), item.location],
    [oldCover, cover],
    ...oldGallerySources.map((src, index) => [src, gallery[Math.min(index, gallery.length - 1)]])
  ];
  for (const [before, after] of oldFields) {
    if (before && after && before !== after) html = html.split(before).join(esc(after));
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/i, "<title>" + esc(title) + " | Vanilla &amp; Somethin</title>");
  html = setMeta(html, "description", item.seoDescription || summary);
  html = setMeta(html, "og:title", title + " | Vanilla & Somethin");
  html = setMeta(html, "og:description", item.seoDescription || summary);
  html = setMeta(html, "twitter:title", title + " | Vanilla & Somethin");
  html = setMeta(html, "twitter:description", item.seoDescription || summary);
  if (cover) {
    html = setMeta(html, "og:image", cover);
    html = setMeta(html, "twitter:image", cover);
  }
  html = animatedHeading(html, title);
  html = html.replace(/(<div[^>]*class="[^"]*\bframer-1gm3be8\b[^"]*"[^>]*>[\s\S]*?<p\b[^>]*>)[\s\S]*?(<\/p>)/i, (_, a, b) => a + esc(summary) + b);
  html = textBlock(html, "framer-102qxfz", "p", summary);
  html = textBlock(html, "framer-ky5owd", "h5", item.year);
  html = textBlock(html, "framer-1fqri61", "h5", item.category);
  html = textBlock(html, "framer-1b8nbnx", "h5", item.client);
  html = textBlock(html, "framer-1f881x7", "h5", item.location);
  if (cover) html = html.replace(/(<div[^>]*class="[^"]*\bframer-19f5tnp\b[^"]*"[^>]*>[\s\S]*?<img\b)([^>]*>)/i, (_, a, b) => setImage(a + b, cover, item.cover?.alt || title));
  if (item.body && String(item.body).trim()) {
    const bodyHTML = markdownToFramer(item.body);
    html = html.replace(/(<div[^>]*class="[^"]*\bframer-m2lc1s\b[^"]*"[^>]*>)[\s\S]*?(<\/div>)/i, "$1" + bodyHTML + "$2");
  }
  if (gallery.length) {
    const start = html.indexOf('id="section-images-gallery"');
    const next = html.indexOf('id="section-other-project"', start);
    const end = next > start ? next : html.indexOf('id="section-contact"', start);
    if (start >= 0) {
      const stop = end > start ? end : Math.min(html.length, start + 90000);
      let section = html.slice(start, stop);
      const originals = [...new Set([...section.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1]))];
      const replacements = new Map(originals.map((src, i) => [src, gallery[Math.min(i, gallery.length - 1)]]));
      section = section.replace(/<img\b[^>]*>/gi, (tag) => {
        const match = tag.match(/\bsrc="([^"]+)"/i);
        const target = match && replacements.get(match[1]);
        return target ? setImage(tag, target, title + " — project image") : tag;
      });
      html = html.slice(0, start) + section + html.slice(stop);
    }
  }
  html = html.replace(/href="(?:\.\/)?project-showcase\/([^"]+)"/g, 'href="/project-showcase/$1/"');
  return html;
}
export async function renderFramerProjectPreview(item) {
  const template = String(item.framerTemplateSlug || "flutecase").replace(/[^a-z0-9-]/gi, "");
  const response = await fetch("/project-showcase/" + template + "/index.html", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the Framer project template.");
  return transformFramerProjectHTML(await response.text(), { ...item, slug: item.slug || "preview" });
}
