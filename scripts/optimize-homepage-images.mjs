#!/usr/bin/env node
/**
 * Correct oversized mobile image candidates in the Framer homepage export.
 * Framer's original layout, effects and image crops are preserved. This only
 * fixes the responsive slot size and supplies a 720px candidate for 240px
 * cards on high-density mobile screens.
 *
 * Run after every Framer export and before deployment:
 *   node scripts/optimize-homepage-images.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../public/index.html", import.meta.url);
let html = await readFile(file, "utf8");

// These are the exact homepage image assets flagged by the Nov 23, 2026
// mobile PageSpeed report. The 720px candidate serves a 240 CSS-pixel slot
// at up to 3x device pixel ratio without downloading the 1280px original.
const targets = {
  fmDMsww9kNQtwrweYpGqgMtmkjk: { width: 720, height: 1058, slot: "240px" },
  Q8bmHzZaQIQyELQ0wK4xVmHx0I: { width: 720, height: 1079, slot: "240px" },
  utllKwemXVBHvKDDsgn8RNhB0: { width: 720, height: 900, slot: "240px" },
  "4ozF3bX5xrkGtsuXbDNpNTS7Bs": { width: 720, height: 1018, slot: "240px" },
};

const seen = new Set();
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const match = tag.match(/\/fr\/images\/([A-Za-z0-9_-]+)\.jpg/);
  if (!match || !targets[match[1]]) return tag;

  const id = match[1];
  const config = targets[id];
  seen.add(id);

  // The Framer export omits a mobile sizes clause on these cards. Without it,
  // browsers assume 100vw and select the 1280px candidate on mobile.
  const sizesMatch = tag.match(/\bsizes="([^"]*)"/);
  if (sizesMatch && !/max-width:\s*809\.98px/.test(sizesMatch[1])) {
    const nextSizes = `${sizesMatch[1]}, (max-width: 809.98px) ${config.slot}`;
    tag = tag.replace(sizesMatch[0], `sizes="${nextSizes}"`);
  }

  const srcsetMatch = tag.match(/\bsrcset="([^"]*)"/);
  if (srcsetMatch) {
    const entries = srcsetMatch[1].split(",").map((entry) => entry.trim()).filter(Boolean);
    const candidate = `/fr/images/${id}.jpg?width=${config.width}&amp;height=${config.height} ${config.width}w`;
    if (!entries.some((entry) => entry.endsWith(`${config.width}w`))) {
      entries.push(candidate);
      entries.sort((a, b) => Number(a.match(/([0-9]+)w$/)?.[1] || 0) - Number(b.match(/([0-9]+)w$/)?.[1] || 0));
      tag = tag.replace(srcsetMatch[0], `srcset="${entries.join(", ")}"`);
    }
  }

  // Keep a right-sized fallback for browsers that do not evaluate srcset.
  const srcMatch = tag.match(/\bsrc="([^"]*)"/);
  if (srcMatch) {
    tag = tag.replace(srcMatch[0], `src="/fr/images/${id}.jpg?width=${config.width}&amp;height=${config.height}"`);
  }
  return tag;
});

const missing = Object.keys(targets).filter((id) => !seen.has(id));
if (missing.length) {
  throw new Error(`Expected homepage image(s) not found: ${missing.join(", ")}`);
}
await writeFile(file, html);
console.log(`Homepage image delivery: optimized responsive candidates for ${seen.size} assets`);
