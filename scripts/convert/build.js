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
 * Click each accordion trigger and capture the closed/open HTML of its item.
 * Items are the direct children of the list container — found as the nearest
 * ancestor holding at least two triggers, taking the majority container so a
 * stray trigger elsewhere on the page can't widen the scope. Items are
 * addressed by child index, which stays stable across React re-renders.
 */
async function harvestAccordions(page, selector) {
  const childIdxs = await page.evaluate((sel) => {
    document.querySelectorAll("[data-vs-cont]").forEach((e) => e.removeAttribute("data-vs-cont"));
    const triggers = Array.from(document.querySelectorAll(sel));
    if (triggers.length < 2) return [];
    const contOf = (t) => {
      let p = t.parentElement;
      while (p && p !== document.body && p.querySelectorAll(sel).length < 2) p = p.parentElement;
      return p;
    };
    const counts = new Map();
    triggers.forEach((t) => {
      const c = contOf(t);
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    });
    let anc = null;
    let best = 0;
    counts.forEach((n, c) => {
      if (n > best) {
        best = n;
        anc = c;
      }
    });
    if (!anc) return [];
    anc.setAttribute("data-vs-cont", "1");
    const idxs = [];
    Array.from(anc.children).forEach((ch, ci) => {
      if ((ch.querySelector(sel) || ch.matches(sel)) && ch.outerHTML.length < 120000) idxs.push(ci);
    });
    return idxs;
  }, selector);

  const items = [];
  for (const ci of childIdxs) {
    const grab = () =>
      page.evaluate((ci) => {
        const it = document.querySelector("[data-vs-cont]")?.children[ci];
        return it ? it.outerHTML : null;
      }, ci);
    const closed = await grab();
    if (!closed) {
      items.push(null);
      continue;
    }
    await page.evaluate((ci) => {
      const it = document.querySelector("[data-vs-cont]")?.children[ci];
      it?.scrollIntoView({ block: "center" });
    }, ci);
    await sleep(250);
    const clickItem = async () => {
      const h = await page.evaluateHandle(
        ({ ci, sel }) => {
          const it = document.querySelector("[data-vs-cont]")?.children[ci];
          return it ? it.querySelector(sel) || it : null;
        },
        { ci, sel: selector }
      );
      const el = h.asElement();
      if (!el) throw new Error("item gone");
      await el.click({ force: true, timeout: 3000 });
    };
    try {
      await clickItem();
    } catch {
      items.push(null);
      continue;
    }
    await sleep(1000);
    const open = await grab();
    try {
      await clickItem();
      await sleep(600);
    } catch {}
    items.push(open && open !== closed && open.length < 200000 ? { closed, open } : null);
  }
  await page.evaluate(() =>
    document.querySelectorAll("[data-vs-cont]").forEach((e) => e.removeAttribute("data-vs-cont"))
  );
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
