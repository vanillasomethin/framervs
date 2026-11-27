import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

// Each page's production SEO head lives in site/seo/<page>.html. The title and
// description are read from there into Next's metadata (so the page never renders a
// different one); scripts/build-site.mjs adds the rest of the file (canonical, Open
// Graph, JSON-LD, analytics) to the built page.
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

export const hasSeoFile = (page: string) => existsSync(join(process.cwd(), "seo", `${page}.html`));

export function seoMetadata(page: string): Metadata {
  const html = readFileSync(join(process.cwd(), "seo", `${page}.html`), "utf8");
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!title || !description) throw new Error(`seo/${page}.html needs a <title> and a meta description`);
  return { title: { absolute: decode(title.trim()) }, description: decode(description) };
}
