/**
 * Conversion verification: load a converted page, capture console errors,
 * confirm no Framer runtime requests, exercise accordions/menu, and save
 * full-page screenshots for the three breakpoints.
 *
 * Usage: node scripts/convert/verify.js <pageKey> [--shots-only]
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const SERVE_PORT = process.env.SERVE_PORT || 8077;
const BASE = `http://localhost:${SERVE_PORT}`;
const EXE =
  process.env.CHROME_EXE ||
  "/opt/pw-browsers/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell";
const OUT = process.env.SHOT_DIR || "/tmp/shots";

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

const VIEWPORTS = [
  { name: "desktop", width: 1600, height: 1000 },
  { name: "tablet", width: 1100, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

(async () => {
  const key = process.argv[2] || "home";
  const rel = PAGES[key];
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ["--no-sandbox", "--ignore-certificate-errors"],
  });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    const framerJs = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 140));
    });
    page.on("request", (r) => {
      if (/framerusercontent\.com.*\.mjs|events\.framer\.com/.test(r.url())) framerJs.push(r.url());
    });
    await page.goto(`${BASE}/${rel}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);

    const checks = await page.evaluate(() => ({
      badge: !!document.querySelector("#__framer-badge-container, .__framer-badge"),
      hiddenOpacity: Array.from(document.querySelectorAll('[style*="opacity"]')).filter((el) => {
        const s = el.getAttribute("style");
        return /opacity:\s*0(\.0+\d*)?\s*(;|$)/.test(s) && el.getBoundingClientRect().width > 0;
      }).length,
      accordions: document.querySelectorAll("[data-vs-acc]").length,
      textLen: document.body.innerText.length,
    }));

    // exercise first accordion
    let accToggled = null;
    if (checks.accordions) {
      accToggled = await page.evaluate(() => {
        const acc = Array.from(document.querySelectorAll("[data-vs-acc]")).find(
          (a) => a.getBoundingClientRect().width > 0 || a.firstElementChild?.getBoundingClientRect().width > 0
        );
        if (!acc) return null;
        const before = acc.innerHTML.length;
        (acc.firstElementChild || acc).click();
        return new Promise((resolve) =>
          setTimeout(() => resolve(acc.innerHTML.length !== before), 300)
        );
      });
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${key}-${vp.name}.png`, fullPage: true });
    console.log(
      `${key}/${vp.name}: errors=${errors.length} framerJs=${framerJs.length} badge=${checks.badge} stuckOpacity=${checks.hiddenOpacity} acc=${checks.accordions} accToggled=${accToggled} textLen=${checks.textLen}`
    );
    if (errors.length) console.log("   first errors:", errors.slice(0, 3));
    await ctx.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
