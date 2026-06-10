/**
 * Framer-to-static conversion — apply pass.
 *
 * Takes the original Framer SSR HTML (fully responsive without JS) plus the
 * harvest data from build.js and produces a truly static page:
 *   - removes the Framer runtime, hydration data, telemetry and CMS loaders
 *   - bakes final animation styles so nothing is stuck at opacity:0
 *   - bakes counter end values
 *   - swaps in the client-rendered testimonial section per breakpoint
 *   - grafts accordion open states (FAQ / services) as <template>s
 *   - grafts the open mobile menu as a <template>
 *   - wires /site.css + /site.js (vanilla replacements for the interactions)
 *
 * Usage: node scripts/convert/apply.js [pageKey ...]
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "public");
const SERVE_PORT = process.env.SERVE_PORT || 8077;
const BASE = `http://localhost:${SERVE_PORT}`;
const EXE =
  process.env.CHROME_EXE ||
  "/opt/pw-browsers/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell";

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


async function run() {
  const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
  const browser = await chromium.launch({
    executablePath: EXE,
    args: ["--no-sandbox", "--ignore-certificate-errors"],
  });

  for (const key of keys) {
    const rel = PAGES[key];
    const harvestPath = path.join(__dirname, `harvest/${key}.json`);
    const harvest = JSON.parse(fs.readFileSync(harvestPath, "utf8"));

    // Load the page with JS disabled: full static DOM, no hydration.
    const ctx = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${rel}`, { waitUntil: "load", timeout: 90000 });

    const html = await page.evaluate(
      ({ harvest }) => {
        const doc = document;

        // Breakpoint hashes are page-specific; derive them from the
        // hydration metadata. Each hash's hidden-<hash> class hides an
        // element inside that hash's media query, so "desktop only" means
        // hidden under the tablet + phone hashes.
        const bps = JSON.parse(
          doc.querySelector("[data-framer-hydrate-v2]").getAttribute("data-framer-hydrate-v2")
        ).breakpoints;
        const byVp = { desktop: [], tablet: [], phone: [] };
        bps.forEach((b) => {
          const q = b.mediaQuery;
          if (/min-width:\s*1440px\)$/.test(q) || (!/max-width/.test(q) && /min-width/.test(q)))
            byVp.desktop.push(b.hash);
          else if (/min-width/.test(q) && /max-width/.test(q)) byVp.tablet.push(b.hash);
          else byVp.phone.push(b.hash);
        });
        const hiddenCls = (vps) => vps.map((v) => byVp[v].map((h) => `hidden-${h}`).join(" ")).join(" ");
        const WRAPS = {
          desktop: `ssr-variant ${hiddenCls(["tablet", "phone"])}`,
          tablet: `ssr-variant ${hiddenCls(["desktop", "phone"])}`,
          phone: `ssr-variant ${hiddenCls(["desktop", "tablet"])}`,
        };

        // ---- 1. Remove the Framer runtime & friends -------------------
        const kill = [
          'link[rel="modulepreload"]',
          "script[data-framer-bundle]",
          "#__framer__handoverData",
          'script[src*="events.framer.com"]',
          'script[src="/content-loader.js"]',
          'script[src="/admin/cms-loader.js"]',
          'meta[name="framer-search-index"]',
          'meta[name="framer-search-index-fallback"]',
        ];
        kill.forEach((sel) => doc.querySelectorAll(sel).forEach((el) => el.remove()));
        doc.querySelectorAll("script:not([src])").forEach((s) => {
          if (s.textContent.includes("__framer_force_showing_editorbar_since")) s.remove();
        });

        // ---- 2. Bake final animation styles ---------------------------
        const styleMap = Object.assign(
          {},
          harvest.phone.styleMap,
          harvest.tablet.styleMap,
          harvest.desktop.styleMap
        );
        const uniq = (el) =>
          Array.from(el.classList || []).find(
            (c) => /^framer-[a-z0-9]+$/i.test(c) && !/^framer-(text|body|page)$/i.test(c)
          ) || null;
        doc.querySelectorAll('[style*="opacity"]').forEach((el) => {
          const s = el.getAttribute("style") || "";
          if (!/opacity:\s*0(\.\d+)?\s*(;|$)/.test(s)) return;
          if (/opacity:\s*0\.[2-9]/.test(s)) return; // intentional partial opacity
          const k = uniq(el);
          if (k && styleMap[k]) {
            el.setAttribute("style", styleMap[k]);
          } else {
            el.setAttribute("style", s.replace(/opacity:\s*0(\.\d+)?/g, "opacity:1"));
          }
        });

        // ---- 3. Counter end values -------------------------------------
        const counters = harvest.desktop.counters || {};
        Object.entries(counters).forEach(([name, value]) => {
          doc.querySelectorAll(`[data-framer-name="${name}"]`).forEach((wrap) => {
            const leaves = Array.from(wrap.querySelectorAll("*")).filter(
              (e) => e.children.length === 0 && /^\s*\d+\s*[+%]?\s*$/.test(e.textContent)
            );
            const target = leaves[0];
            if (target) {
              target.textContent = value;
              target.setAttribute("data-countup", value);
            }
          });
        });

        // ---- 4. Testimonials section per breakpoint --------------------
        const staticSection = doc.querySelector('[data-framer-name="Section - Testimonials"]');
        if (staticSection && harvest.desktop.sections["Section - Testimonials"]) {
          const holder = doc.createElement("div");
          for (const vp of ["desktop", "tablet", "phone"]) {
            const wrap = doc.createElement("div");
            wrap.className = WRAPS[vp];
            wrap.innerHTML = harvest[vp].sections["Section - Testimonials"];
            holder.appendChild(wrap);
          }
          staticSection.replaceWith(...holder.childNodes);
        }

        // ---- 5. Accordions ---------------------------------------------
        // Map each static accordion item copy to the harvest of the viewport
        // it belongs to (determined by its ssr-variant ancestor).
        // Wrappers carry hidden- classes from one hash trio; the viewport a
        // wrapper is visible on is the trio member missing from its classes.
        const trios = byVp.desktop.map((_, i) => ({
          desktop: byVp.desktop[i],
          tablet: byVp.tablet[i],
          phone: byVp.phone[i],
        }));
        const vpOf = (el) => {
          const v = el.closest(".ssr-variant");
          if (!v) return "desktop";
          const present = new Set(
            Array.from(v.classList)
              .filter((c) => c.startsWith("hidden-"))
              .map((c) => c.slice(7))
          );
          for (const trio of trios) {
            const hits = Object.values(trio).filter((h) => present.has(h)).length;
            if (hits >= 2) {
              for (const vp of ["desktop", "tablet", "phone"]) {
                if (!present.has(trio[vp])) return vp;
              }
            }
          }
          return "desktop";
        };
        let accId = 0;
        for (const sel of Object.keys(harvest.desktop.accordions || {})) {
          const counts = { desktop: 0, tablet: 0, phone: 0 };
          doc.querySelectorAll(sel).forEach((trigger) => {
            const vp = vpOf(trigger);
            const idx = counts[vp]++;
            const item = (harvest[vp].accordions[sel] || [])[idx];
            if (!item || !item.open || !item.closed) return;
            let root = trigger;
            for (let d = 0; d < item.level && root.parentElement; d++) root = root.parentElement;
            const wrap = doc.createElement("div");
            wrap.setAttribute("data-vs-acc", String(accId++));
            wrap.setAttribute("data-vs-state", "closed");
            root.replaceWith(wrap);
            wrap.innerHTML = item.closed;
            const tplC = doc.createElement("template");
            tplC.setAttribute("data-vs-closed", "");
            tplC.innerHTML = item.closed;
            const tplO = doc.createElement("template");
            tplO.setAttribute("data-vs-open", "");
            tplO.innerHTML = item.open;
            wrap.appendChild(tplC);
            wrap.appendChild(tplO);
          });
        }

        // ---- 6. Mobile menu ----------------------------------------------
        const menu = harvest.phone.menu || harvest.tablet.menu;
        if (menu) {
          const nav = doc.querySelector('[data-framer-name="Navigation"]');
          if (nav) {
            const wrap = doc.createElement("div");
            wrap.setAttribute("data-vs-nav", "");
            wrap.setAttribute("data-vs-state", "closed");
            nav.replaceWith(wrap);
            wrap.appendChild(nav);
            const tplO = doc.createElement("template");
            tplO.setAttribute("data-vs-open", "");
            tplO.innerHTML = menu.open;
            wrap.appendChild(tplO);
          }
        }

        // ---- 6b. Contact form: post to a static-friendly backend ----------
        doc.querySelectorAll("form").forEach((form) => {
          form.setAttribute("action", "https://formsubmit.co/hello@vanillasometh.in");
          form.setAttribute("method", "POST");
          const honey = doc.createElement("input");
          honey.type = "hidden";
          honey.name = "_captcha";
          honey.value = "false";
          form.appendChild(honey);
          const next = doc.createElement("input");
          next.type = "hidden";
          next.name = "_next";
          next.value = "https://www.vanillasometh.in/contact?sent=1";
          form.appendChild(next);
        });

        // ---- 7. Static runtime assets -------------------------------------
        if (!doc.querySelector('link[href="/site.css"]')) {
          const l = doc.createElement("link");
          l.rel = "stylesheet";
          l.href = "/site.css";
          doc.head.appendChild(l);
        }
        if (!doc.querySelector('script[src="/site.js"]')) {
          const sc = doc.createElement("script");
          sc.src = "/site.js";
          sc.defer = true;
          doc.body.appendChild(sc);
        }

        return "<!doctype html>\n" + doc.documentElement.outerHTML;
      },
      { harvest }
    );

    const out = path.join(SRC, rel);
    fs.writeFileSync(out, html);
    console.log(`${key}: wrote ${out} (${html.length} bytes)`);
    await ctx.close();
  }
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
