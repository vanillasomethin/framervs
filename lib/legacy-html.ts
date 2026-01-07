import fs from "fs";
import path from "path";

const STYLE_SCRIPT_LINK_REGEX =
  /<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<link[^>]*?>/gi;

export type LegacyPageContent = {
  assets: string;
  body: string;
  title?: string;
};

function extractTagContent(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ?? "";
}

export function loadLegacyPage(relativePath: string): LegacyPageContent {
  const filePath = path.join(process.cwd(), relativePath);
  const html = fs.readFileSync(filePath, "utf-8");
  const headContent = extractTagContent(html, "head");
  const bodyContent = extractTagContent(html, "body");
  const assets = Array.from(headContent.matchAll(STYLE_SCRIPT_LINK_REGEX))
    .map((match) => match[0])
    .join("\n");
  const titleMatch = headContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return {
    assets,
    body: bodyContent || html,
    title: titleMatch?.[1]?.trim(),
  };
}
