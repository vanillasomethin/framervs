/**
 * Framer-to-static conversion — effects harvest.
 *
 * Measures runtime-driven animation behaviour on the original pages so
 * apply.js can bake it into the static site:
 *   - scroll parallax: samples inline transforms at several scroll
 *     positions and fits value = a * scrollY + b per element
 *   - hero cursor trail (home): collects the image URLs the runtime cycles
 *     through as the cursor moves
 *
 * Output: scripts/convert/harvest/<page>-fx.json
 * Usage: node scripts/convert/harvest-fx.js [pageKey ...]
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const SERVE_PORT = process.env.SERVE_PORT || 8077;
const BASE = `http://localhost:${SERVE_PORT}`;
const EXE =
  process.env.CHROME_EXE ||
  "/opt/pw-browsers/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell";

const VIEWPORTS = [
  { name: "desktop", width: 1600, height: 1000 },
  { name: "tablet", width: 1100, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

const PAGES = {
  home: "index.html",
  contact: "contact/index.html",
  estimator: "estimator/index.html",
  showcase: "project-showcase/index.html",
  "ps-artwist-salon": "project-showcase/artwist-salon/index.html",
  "ps-seiko-hyper": "project-showcase/seiko-hyper/index.html",
  "ps-coco-meltdown": "project-showcase/coco-meltdown/index.html",
  "ps-pipe-nova": "project-showcase/pipe-nova/index.html",
  "ps-fair-fly": "project-showcase/fair-fly/index.html",
  "ps-nord-terra": "project-showcase/nord-terra/index.html",
  "ps-bnb": "project-showcase/bnb/index.html",
  "ps-koan": "project-showcase/koan/index.html",
  "ps-mak": "project-showcase/mak/index.html",
  "ps-flutecase": "project-showcase/flutecase/index.html",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** key -> transform string for every element with an inline transform. */
const SNAPSHOT_FN = `(() => {
  const counts = {};
  const out = {};
  document.querySelectorAll('[style*="transform"]').forEach((el) => {
    const cls = Array.from(el.classList).find(
      (c) => /^framer-[a-z0-9]+$/i.test(c) && !/^framer-(text|body|page)$/i.test(c)
    );
    if (!cls) return;
    counts[cls] = (counts[cls] || 0) + 1;
    const t = (el.getAttribute("style").match(/transform:\\s*([^;]+)/) || [])[1];
    if (t) out[cls + "|" + (counts[cls] - 1)] = t.trim();
  });
  return out;
})()`;

function fitParallax(samples) {
  // samples: [{ y, map }]. Framer scroll effects are section-scoped (flat,
  // then a ramp while the section crosses the viewport, then flat), so we
  // keep the sampled points themselves and let site.js interpolate.
  const keys = Object.keys(samples[0].map).filter((k) =>
    samples.every((s) => k in s.map)
  );
  const entries = [];
  for (const key of keys) {
    const tokensPer = samples.map((s) => s.map[key].match(/-?\d+\.?\d*/g) || []);
    const n = tokensPer[0].length;
    if (!n || tokensPer.some((t) => t.length !== n)) continue;
    const varying = [];
    for (let i = 0; i < n; i++) {
      const vals = tokensPer.map((t) => parseFloat(t[i]));
      if (Math.max(...vals) - Math.min(...vals) > 15) varying.push(i);
    }
    if (!varying.length || varying.length > 2) continue;
    let idx = -1;
    const template = samples[0].map[key].replace(/-?\d+\.?\d*/g, (m) => {
      idx++;
      const vi = varying.indexOf(idx);
      return vi !== -1 ? "%v" + vi : m;
    });
    const pts = samples.map((s, si) => [
      s.y,
      ...varying.map((vi) => +parseFloat(tokensPer[si][vi]).toFixed(1)),
    ]);
    entries.push({ key, t: "transform: " + template, pts });
  }
  return entries;
}

async function harvestParallax(page) {
  // mount everything first
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await sleep(2500);
  const H = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight
  );
  const samples = [];
  for (let i = 0; i <= 9; i++) {
    const y = Math.round((H * i) / 9);
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await sleep(550);
    const map = await page.evaluate(SNAPSHOT_FN);
    samples.push({ y, map });
  }
  return fitParallax(samples);
}

async function harvestTrail(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(800);
  const urls = new Set();
  const spots = [];
  for (let i = 0; i < 16; i++) {
    spots.push([200 + ((i * 173) % 1200), 200 + ((i * 131) % 600)]);
  }
  for (const [x, y] of spots) {
    await page.mouse.move(x, y);
    await sleep(350);
    const found = await page.evaluate(() => {
      const hero = document.querySelector('[data-framer-name="Section - Hero"]');
      if (!hero) return [];
      return Array.from(hero.querySelectorAll('[style*="background-image"]'))
        .filter((el) => /translateX\(/.test(el.getAttribute("style") || ""))
        .map((el) => (el.getAttribute("style").match(/url\("?([^")]+)"?\)/) || [])[1])
        .filter(Boolean);
    });
    found.forEach((u) => urls.add(u));
  }
  return Array.from(urls);
}

async function run() {
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ["--no-sandbox", "--ignore-certificate-errors"],
  });
  for (const key of keys) {
    const rel = PAGES[key];
    const fx = { parallax: {}, trail: null };
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/${rel}`, { waitUntil: "networkidle", timeout: 90000 });
      await sleep(2500);
      fx.parallax[vp.name] = await harvestParallax(page);
      if (key === "home" && vp.name === "desktop") fx.trail = await harvestTrail(page);
      console.log(`${key}/${vp.name}: parallax=${fx.parallax[vp.name].length}${fx.trail ? " trail=" + fx.trail.length : ""}`);
      await ctx.close();
    }
    fs.mkdirSync(path.join(__dirname, "harvest"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, `harvest/${key}-fx.json`), JSON.stringify(fx));
  }
  await browser.close();
  console.log("FX harvest complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
