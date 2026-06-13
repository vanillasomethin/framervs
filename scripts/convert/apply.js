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
    const fxPath = path.join(__dirname, `harvest/${key}-fx.json`);
    const fx = fs.existsSync(fxPath)
      ? JSON.parse(fs.readFileSync(fxPath, "utf8"))
      : { parallax: {}, trail: null };

    // Load the page with JS disabled: full static DOM, no hydration.
    const ctx = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      javaScriptEnabled: false,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${rel}`, { waitUntil: "load", timeout: 90000 });

    const html = await page.evaluate(
      ({ harvest, fx }) => {
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
        // The "Made in Framer" badge is server-rendered; drop it.
        doc
          .querySelectorAll(".__framer-badge, #__framer-badge-container")
          .forEach((el) => el.remove());

        // ---- 2. Bake final animation styles ---------------------------
        // The static inline style holds each element's animation *start*
        // state (opacity 0 + offset); the harvested styleMap holds the end
        // state. Bake the end state so the page is complete without JS, and
        // keep the start transform in --vs-fr so site.js can replay the
        // entrance animation on scroll.
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
          const fromT = (s.match(/(?:^|;)\s*transform:\s*([^;]+)/) || [])[1];
          const fromF = (s.match(/(?:^|;)\s*filter:\s*([^;]+)/) || [])[1];
          const k = uniq(el);
          let finalS;
          if (k && styleMap[k]) {
            finalS = styleMap[k];
          } else {
            // No harvested end state (e.g. classless text-reveal spans):
            // derive it by neutralising the entrance offsets — full
            // opacity, no blur, identity offsets (percentage translates
            // are layout, keep them).
            finalS = s
              .replace(/opacity:\s*0(\.\d+)?/g, "opacity:1")
              .replace(/filter:\s*blur\([\d.]+px\)/g, "filter: blur(0px)")
              .replace(/transform:\s*([^;]+)/, (m0, tval) => {
                if (/matrix|var\(/.test(tval)) return m0;
                const cleaned = tval
                  .replace(/(translate[XYZ]?\()(-?[\d.]+px)/g, "$10px")
                  .replace(/(rotate[XYZ]?\()(-?[\d.]+)(deg)/g, "$10$3")
                  .replace(/(skew[XY]?\()(-?[\d.]+)(deg)/g, "$10$3")
                  .replace(/scale\((?!1[,)])[\d.]+\)/g, "scale(1)");
                return "transform: " + cleaned;
              });
          }
          el.setAttribute("style", finalS);
          const m = finalS.match(/opacity:\s*([\d.]+)/);
          const visible = !m || parseFloat(m[1]) > 0.5;
          if (visible) {
            el.setAttribute("data-vs-reveal", "");
            if (fromT && fromT.trim() !== "none") el.style.setProperty("--vs-fr", fromT.trim());
            if (fromF && /blur\(\s*[1-9]/.test(fromF)) el.style.setProperty("--vs-ff", fromF.trim());
          }
        });
        // Gate the hidden start state behind a JS flag so the page is fully
        // visible without JavaScript.
        const flag = doc.createElement("script");
        flag.textContent = "document.documentElement.classList.add('vs-js')";
        doc.head.insertBefore(flag, doc.head.firstChild);

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
            // The quote ticker was captured mid-rotation with off-screen
            // clones hidden; rewind the track and unhide the slides so the
            // section is complete without JS and site.js can scroll it.
            wrap.querySelectorAll("ul").forEach((ul) => {
              if (!/translateX/.test(ul.getAttribute("style") || "")) return;
              ul.style.transform = "translateX(0px)";
              ul.querySelectorAll("*").forEach((el) => {
                if (el.style && el.style.visibility === "hidden") el.style.visibility = "";
                if (el.getAttribute("aria-hidden") === "true") el.removeAttribute("aria-hidden");
              });
            });
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
        // Static items are resolved exactly like the harvester did: the item
        // is the direct child, on the trigger's ancestor path, of the common
        // container of all same-viewport triggers. Each gets its two markup
        // states stored in <template>s for site.js to swap between.
        let accId = 0;
        for (const sel of Object.keys(harvest.desktop.accordions || {})) {
          const triggers = Array.from(doc.querySelectorAll(sel));
          if (!triggers.length) continue;
          const groups = { desktop: [], tablet: [], phone: [] };
          triggers.forEach((t) => groups[vpOf(t)].push(t));
          for (const vp of ["desktop", "tablet", "phone"]) {
            const group = groups[vp];
            if (!group.length) continue;
            // Majority container: nearest ancestor holding >=2 group
            // triggers, so a stray trigger can't widen the scope.
            const counts = new Map();
            const inGroup = (el) => group.filter((t) => el.contains(t)).length;
            group.forEach((t) => {
              let p = t.parentElement;
              while (p && p !== doc.body && inGroup(p) < 2) p = p.parentElement;
              if (p) counts.set(p, (counts.get(p) || 0) + 1);
            });
            let anc = null;
            let best = 0;
            counts.forEach((n, c) => {
              if (n > best) {
                best = n;
                anc = c;
              }
            });
            if (!anc) continue;
            const items = Array.from(anc.children).filter(
              (ch) =>
                (ch.querySelector(sel) || ch.matches(sel)) && ch.outerHTML.length < 120000
            );
            items.forEach((item, idx) => {
              const cap = (harvest[vp].accordions[sel] || [])[idx];
              if (!cap || !cap.open || !cap.closed) return;
              if (cap.closed.length > 120000 || cap.open.length > 200000) return;
              const holder = doc.createElement("div");
              holder.setAttribute("data-vs-acc", String(accId++));
              holder.setAttribute("data-vs-state", "closed");
              item.replaceWith(holder);
              holder.innerHTML = cap.closed;
              const tplC = doc.createElement("template");
              tplC.setAttribute("data-vs-closed", "");
              tplC.innerHTML = cap.closed;
              const tplO = doc.createElement("template");
              tplO.setAttribute("data-vs-open", "");
              tplO.innerHTML = cap.open;
              holder.appendChild(tplC);
              holder.appendChild(tplO);
            });
          }
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

        // ---- 6a. Scroll parallax + hero cursor trail ----------------------
        // Parallax entries are keyed by framer class + nth occurrence within
        // one breakpoint's DOM. Recreate the same numbering here: shared
        // (wrapper-less) elements count in every breakpoint, variant copies
        // only in their own.
        for (const vp of ["desktop", "tablet", "phone"]) {
          const entries = (fx.parallax && fx.parallax[vp]) || [];
          if (!entries.length) continue;
          const wanted = {};
          entries.forEach((e) => {
            wanted[e.key] = e;
          });
          const counts = {};
          doc.querySelectorAll('[style*="transform"]').forEach((el) => {
            const v = el.closest(".ssr-variant");
            if (v && vpOf(el) !== vp) return;
            const cls = Array.from(el.classList).find(
              (c) => /^framer-[a-z0-9]+$/i.test(c) && !/^framer-(text|body|page)$/i.test(c)
            );
            if (!cls) return;
            counts[cls] = (counts[cls] || 0) + 1;
            const key = cls + "|" + (counts[cls] - 1);
            const e = wanted[key];
            if (e && !el.hasAttribute("data-vs-px")) {
              el.setAttribute("data-vs-px", JSON.stringify({ t: e.t, pts: e.pts }));
            }
          });
        }
        if (fx.trail && fx.trail.length) {
          const hero = doc.querySelector('[data-framer-name="Section - Hero"]');
          if (hero) hero.setAttribute("data-vs-trail", JSON.stringify(fx.trail));
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
      { harvest, fx }
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
