import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECTS, type GalleryImage, type Project, type RichNode } from "@/components/sites/vanillasomethin/data-projects";

// The showcase lists the ten designed case studies (data-projects.ts) plus every
// project added in the admin (Website > Projects) with "Page design: Showcase",
// rendered with the same template. Those come from public/content.json, which the
// admin publishes; Netlify rebuilds the site on every publish. Server-only (reads files).

type CmsImage = { src?: string; alt?: string; type?: string; category?: string };
type CmsProject = {
  slug?: string;
  title?: string;
  status?: string;
  layout?: string;
  category?: string;
  location?: string;
  year?: string;
  client?: string;
  summary?: string;
  seoDescription?: string;
  cover?: CmsImage;
  body?: string;
  gallery?: CmsImage[];
};

export type ShowcaseProject = Project & { fromCms?: { seoDescription: string } };

const IMAGE = /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i;

const cmsProjects = (): CmsProject[] => {
  const file = join(process.cwd(), "..", "public", "content.json");
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf8"))?.cms?.projects ?? [];
  } catch {
    return [];
  }
};

/** "## Heading" lines become headings, everything else paragraphs (markdown emphasis dropped). */
const storyNodes = (body: string): RichNode[] =>
  body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block): RichNode[] => {
      const lines = block.split("\n");
      const heading = lines[0].match(/^#{1,6}\s+(.*)$/);
      const clean = (s: string) => s.replace(/\*\*|__|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^[-*]\s+/gm, "").trim();
      const nodes: RichNode[] = [];
      if (heading) nodes.push({ type: "h5", text: clean(heading[1]) });
      const rest = clean((heading ? lines.slice(1) : lines).join("\n"));
      if (rest) nodes.push({ type: "p", text: rest });
      return nodes;
    });

const fromCms = (p: CmsProject): ShowcaseProject | null => {
  const slug = (p.slug || "").trim();
  const cover = p.cover?.src || "";
  if (!slug || !p.title || !cover) return null;
  const photos: GalleryImage[] = (p.gallery || [])
    .filter((g) => g.src && IMAGE.test(g.src) && g.type !== "pdf")
    .map((g) => ({ src: g.src as string }));
  const [behind, ...gallery] = photos;
  return {
    slug,
    name: p.title,
    client: p.client || "",
    category: p.category || "",
    location: p.location || "",
    year: p.year || "",
    description: p.summary || "",
    cover,
    coverPosition: "50% 50%",
    behindImage: behind?.src || cover,
    behind: storyNodes(p.body || ""),
    gallery: behind ? gallery : [],
    others: ["", ""],
    fromCms: { seoDescription: p.seoDescription || p.summary || "" },
  };
};

let cache: ShowcaseProject[] | null = null;

/** Admin-added showcase projects first (newest work), then the ten case studies. */
export function allProjects(): ShowcaseProject[] {
  if (cache) return cache;
  const designed = new Set(PROJECTS.map((p) => p.slug));
  const added = cmsProjects()
    .filter((p) => p.status === "published" && p.layout === "Showcase")
    .map(fromCms)
    .filter((p): p is ShowcaseProject => Boolean(p) && !designed.has((p as ShowcaseProject).slug));
  const list: ShowcaseProject[] = [...added, ...PROJECTS];
  // "Other project" cards: the designed pages keep their own; added ones show the next two.
  cache = list.map((p, i) =>
    p.fromCms ? { ...p, others: [list[(i + 1) % list.length].slug, list[(i + 2) % list.length].slug] } : p,
  );
  return cache;
}

export const findProject = (slug: string) => allProjects().find((p) => p.slug === slug);
