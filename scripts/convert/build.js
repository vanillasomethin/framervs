/**
 * Framer-to-static conversion — harvest pass.
 *
 * Loads each page from the Framer SSR export in a headless browser, lets the
 * Framer runtime render everything, and records the pieces that only exist
 * client-side: final animation styles, counter end values, the testimonial
 * carousel, accordion open states (FAQ + services), and the mobile menu.
 * Results land in scripts/convert/harvest/<page>.json for apply.js.
 *
 * Usage: node scripts/convert/build.js [pageKey ...]
 * Requires chromium; set CHROME_EXE or install via
 * `npx playwright-core install chromium-headless-shell`.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
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

const ACCORDION_SELECTORS = [
  '[data-framer-name="Question"]',
  '[data-framer-name="Primary Closed"]',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
  });
  // Counters only animate while on screen — dwell on them until done.
  await page.evaluate(() =>
    document.querySelector('[data-framer-name="Counter Wrap"]')?.scrollIntoView({ block: "center" })
  );
  await sleep(5000);
  let prev = "";
  for (let i = 0; i < 15; i++) {
    await sleep(700);
    const cur = await page.evaluate(() => document.body.innerText);
    if (cur === prev) break;
    prev = cur;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
}

async function harvestBasics(page) {
  return page.evaluate(() => {
    const uniq = (el) =>
      Array.from(el.classList || []).find(
        (c) => /^framer-[a-z0-9]+$/i.test(c) && !/^framer-(text|body|page)$/i.test(c)
      ) || null;

    const styleMap = {};
    document.querySelectorAll("[style]").forEach((el) => {
      const k = uniq(el);
      if (!k) return;
      const s = el.getAttribute("style") || "";
      if (/opacity|transform/.test(s) && !(k in styleMap)) styleMap[k] = s;
    });

    const counters = {};
    ["Years Experience", "Satisfied Clients", "Awards Won", "Global Clients"].forEach((n) => {
      const el = document.querySelector(`[data-framer-name="${n}"]`);
      if (el) counters[n] = el.innerText.trim().split("\n")[0];
    });

    const sections = {};
    document.querySelectorAll('[data-framer-name="Section - Testimonials"]').forEach((el) => {
      sections["Section - Testimonials"] = el.outerHTML;
    });

    return { styleMap, counters, sections };
  });
}

/**
 * Click each accordion trigger and capture the pre/post HTML of whichever
 * ancestor actually expands (the trigger itself is often just the label).
 */
async function harvestAccordions(page, selector) {
  const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
  const items = [];
  for (let i = 0; i < count; i++) {
    const pre = await page.evaluate(
      ({ sel, i }) => {
        const el = document.querySelectorAll(sel)[i];
        if (!el) return null;
        el.scrollIntoView({ block: "center" });
        const chain = [];
        let p = el;
        for (let d = 0; d < 8 && p && p !== document.body; d++) {
          chain.push(p.outerHTML.length);
          p = p.parentElement;
        }
        return chain;
      },
      { sel: selector, i }
    );
    if (!pre) {
      items.push(null);
      continue;
    }
    await sleep(250);
    try {
      await page.locator(selector).nth(i).click({ timeout: 3000, force: true });
    } catch {
      items.push(null);
      continue;
    }
    await sleep(1000);
    const result = await page.evaluate(
      ({ sel, i, pre }) => {
        const el = document.querySelectorAll(sel)[i];
        if (!el) return null;
        let p = el;
        let best = null;
        for (let d = 0; d < 8 && p && p !== document.body; d++) {
          const grew = p.outerHTML.length - (pre[d] || 0);
          if (grew > 200) best = { level: d, open: p.outerHTML };
          p = p.parentElement;
        }
        return best;
      },
      { sel: selector, i, pre }
    );
    // Close it again so later items are captured against a clean state.
    try {
      await page.locator(selector).nth(i).click({ timeout: 3000, force: true });
      await sleep(600);
    } catch {}
    if (!result) {
      items.push(null);
      continue;
    }
    const closed = await page.evaluate(
      ({ sel, i, level }) => {
        let p = document.querySelectorAll(sel)[i];
        for (let d = 0; d < level && p; d++) p = p.parentElement;
        return p ? p.outerHTML : null;
      },
      { sel: selector, i, level: result.level }
    );
    items.push({ level: result.level, closed, open: result.open });
  }
  return items;
}

/** Capture the navigation in closed and open (mobile menu) states. */
async function harvestMenu(page) {
  const closed = await page.evaluate(() => {
    const btn = document.querySelector('[data-framer-name="Menu Button"]');
    const nav = btn?.closest('[data-framer-name="Navigation"]');
    return nav ? nav.outerHTML : null;
  });
  if (!closed) return null;
  try {
    await page
      .locator('[data-framer-name="Menu Button"]')
      .first()
      .click({ timeout: 4000, force: true });
  } catch {
    return null;
  }
  await sleep(1400);
  const open = await page.evaluate(() => {
    const nav =
      document.querySelector('[data-framer-name="Navigation"]') ||
      document.querySelector('[data-framer-name="Menu Button"]')?.closest("div");
    return nav ? nav.outerHTML : null;
  });
  return open && open !== closed ? { closed, open } : null;
}

async function run() {
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ["--no-sandbox", "--ignore-certificate-errors"],
  });

  for (const key of keys) {
    const rel = PAGES[key];
    if (!rel) throw new Error(`Unknown page key ${key}`);
    console.log(`=== ${key} ===`);
    const data = {};
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/${rel}`, { waitUntil: "networkidle", timeout: 90000 });
      await sleep(2000);
      await settle(page);
      const h = await harvestBasics(page);
      h.accordions = {};
      for (const sel of ACCORDION_SELECTORS) {
        h.accordions[sel] = await harvestAccordions(page, sel);
      }
      h.menu = vp.width < 1440 ? await harvestMenu(page) : null;
      data[vp.name] = h;
      const accSummary = Object.entries(h.accordions)
        .map(([s, a]) => `${s.match(/"(.+)"/)[1]}:${a.filter(Boolean).length}/${a.length}`)
        .join(" ");
      console.log(
        ` ${vp.name}: styles=${Object.keys(h.styleMap).length} counters=${JSON.stringify(h.counters)} ${accSummary} menu=${!!h.menu}`
      );
      await ctx.close();
    }
    fs.mkdirSync(path.join(__dirname, "harvest"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, `harvest/${key}.json`), JSON.stringify(data));
  }
  await browser.close();
  console.log("Harvest complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
