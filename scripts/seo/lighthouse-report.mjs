#!/usr/bin/env node
/**
 * Lighthouse scores + Core Web Vitals lab metrics for key live URLs.
 *
 *   node scripts/seo/lighthouse-report.mjs --json reports/lighthouse.json [--desktop]
 *
 * Needs `lighthouse` and `playwright` (for its Chromium) installed, e.g.
 *   npm i --no-save lighthouse@12.8.2 playwright@1.55.0 && npx playwright install chromium
 */
import fs from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const out = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
const desktop = args.includes("--desktop");
const SITE = "https://www.vanillasometh.in";
const URLS = ["/", "/locations/mangalore/", "/project-showcase/", "/project-showcase/nord-terra/", "/house-construction-cost-karnataka/", "/contact/"];

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
const pages = [];
try {
  for (const p of URLS) {
    const url = SITE + p;
    try {
      const config = desktop ? (await import("lighthouse/core/config/desktop-config.js")).default : undefined;
      const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "seo", "accessibility", "best-practices"] }, config);
      const a = lhr.audits;
      const num = (k) => a[k]?.numericValue ?? null;
      pages.push({
        url,
        scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)])),
        metrics: { lcpMs: num("largest-contentful-paint"), cls: num("cumulative-layout-shift"), tbtMs: num("total-blocking-time"), fcpMs: num("first-contentful-paint"), speedIndexMs: num("speed-index"), bytes: num("total-byte-weight") },
        failing: Object.entries(a)
          .filter(([, v]) => v.score !== null && v.score < 0.9 && ["binary", "numeric", "metricSavings"].includes(v.scoreDisplayMode))
          .map(([id, v]) => ({ id, title: v.title, display: v.displayValue || "" }))
          .slice(0, 15),
      });
      console.log(`${url}  perf ${pages.at(-1).scores.performance}  seo ${pages.at(-1).scores.seo}  LCP ${Math.round(num("largest-contentful-paint"))}ms  TBT ${Math.round(num("total-blocking-time"))}ms`);
    } catch (e) {
      pages.push({ url, error: e.message });
      console.log(`${url}  ERROR ${e.message}`);
    }
  }
} finally {
  await chrome.kill();
}

const report = { generatedAt: new Date().toISOString(), formFactor: desktop ? "desktop" : "mobile", lighthouse: "12.8.2", pages };
if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, JSON.stringify(report, null, 2)); }
