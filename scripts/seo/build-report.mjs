#!/usr/bin/env node
/**
 * Combines the weekly monitor outputs into reports/latest.json and appends a
 * compact entry to reports/history.json (kept to the last 52 runs). The admin
 * SEO panel reads both from the `seo-reports` branch.
 *
 *   node scripts/seo/build-report.mjs reports/
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || "reports");
const load = (f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; } };
const rendered = load("rendered.json");
const mobile = load("lighthouse-mobile.json");
const desktop = load("lighthouse-desktop.json");
const avg = (r, k) => {
  const v = (r?.pages || []).filter((p) => p.scores).map((p) => p.scores[k]);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};

const latest = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  runUrl: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
  rendered: rendered && { pages: rendered.pages, errors: rendered.errors, warnings: rendered.warnings, results: rendered.results.map(({ url, status, title, descriptions, canonicals, h1 }) => ({ url, status, title, description: descriptions?.[0] || "", canonical: canonicals?.[0] || "", h1: h1?.[0] || "" })) },
  lighthouse: { mobile, desktop },
};
fs.writeFileSync(path.join(dir, "latest.json"), JSON.stringify(latest, null, 2));

const history = load("history.json") || [];
history.push({
  date: latest.generatedAt.slice(0, 10),
  renderedErrors: rendered?.errors.length ?? null,
  renderedWarnings: rendered?.warnings.length ?? null,
  mobilePerformance: avg(mobile, "performance"),
  mobileSeo: avg(mobile, "seo"),
  desktopPerformance: avg(desktop, "performance"),
  accessibility: avg(mobile, "accessibility"),
});
fs.writeFileSync(path.join(dir, "history.json"), JSON.stringify(history.slice(-52), null, 2));
console.log(`latest.json written; history has ${Math.min(history.length, 52)} entries`);
