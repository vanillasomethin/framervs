// Website controls: live health checks, rebuild/redeploy, publishing status
// and quick links. Content itself is edited under Journal / Portfolio / Updates.

import { $, studioApi, toast } from "../core.js";
import { icon, esc, pill, mount, fmtDateTime } from "./ui.js";

const LINKS = [
  ["Live website", "https://www.vanillasometh.in/", "globe"],
  ["Cost estimator", "/estimator/", "tasks"],
  ["Sitemap", "/sitemap.xml", "file"],
  ["Netlify dashboard", "https://app.netlify.com/projects/vanillasomethin", "external"],
  ["GitHub repository", "https://github.com/vanillasomethin/framervs", "external"],
  ["Google Analytics", "https://analytics.google.com/", "pulse"],
  ["Search Console", "https://search.google.com/search-console", "search"],
  ["Framer (home, showcase, team, contact)", "https://framer.com/projects", "external"],
];

const statusPill = (r) => (r.ok ? pill(`${r.status} OK`, "ok") : pill(r.status ? `Error ${r.status}` : r.error || "Down", "bad"));
const speed = (ms) => (ms < 800 ? "" : ms < 2000 ? "warn" : "bad");

export const renderWebsite = async (view, ctx) => {
  const w = ctx.summary();
  const root = mount(view, `
    <div class="page-head"><div><h1>Website</h1><p>Check that the site is up, publish changes, and jump to the tools that run it.</p></div>
      <div class="head-actions"><a class="btn" href="https://www.vanillasometh.in/" target="_blank" rel="noopener">${icon("external", 15)} View site</a><button class="btn primary" data-rebuild>${icon("refresh", 15)} Rebuild website</button></div></div>
    <div class="two-col">
      <section class="panel"><div class="panel-row"><h2 class="panel-title">Site health</h2><button class="btn small" data-check>${icon("refresh", 14)} Check now</button></div>
        <div data-health><p class="muted">Checking…</p></div></section>
      <div class="stack">
        <section class="panel"><h2 class="panel-title">Publishing</h2>
          <div class="site-stats">${[["Journal", "blog", w.blog], ["Portfolio", "portfolio", w.projects], ["Updates", "updates", w.updates]].map(([label, route, c]) => `<a class="site-stat" href="#/${route}"><b>${c ? c.published : "–"}</b><span>${label}</span>${c && c.drafts ? `<em>${c.drafts} draft${c.drafts === 1 ? "" : "s"}</em>` : ""}</a>`).join("")}</div>
          <p class="muted small" data-pub>${w.pending ? `${w.pending} unpublished change${w.pending === 1 ? "" : "s"} waiting. Open Journal, Portfolio or Updates and press Publish.` : "Everything you've edited is published."}</p>
          <div class="conn" data-conn></div>
        </section>
        <section class="panel"><h2 class="panel-title">Quick links</h2><div class="link-cards compact">${LINKS.map(([label, url, ic]) => `<a class="link-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon(ic, 16)}<span><b>${esc(label)}</b></span>${icon("external", 13)}</a>`).join("")}</div></section>
      </div>
    </div>
    <section class="panel"><h2 class="panel-title">How the website works</h2>
      <p class="muted">The <b>Journal</b>, <b>Portfolio</b> and <b>Updates</b> pages are generated from what you publish here, and go live about 1–2 minutes after pressing Publish. The home, showcase, team and contact pages are designed in Framer, so their text and layout are changed there and re-exported.</p></section>`);

  const healthBox = $("[data-health]", root);
  const runHealth = async () => {
    healthBox.innerHTML = '<p class="muted">Checking…</p>';
    try {
      const r = await studioApi({ action: "health" });
      const bad = r.results.filter((x) => !x.ok).length;
      healthBox.innerHTML = `<div class="banner ${bad ? "warn" : "ok"}">${icon(bad ? "alert" : "check", 16)} ${bad ? `${bad} page${bad === 1 ? "" : "s"} not responding properly` : "All pages are up"}<span class="muted small">checked ${esc(fmtDateTime(r.checkedAt))}</span></div>
        <div class="table-wrap"><table class="table compact"><tbody>${r.results.map((x) => `<tr><td><b>${esc(x.label)}</b><span class="muted small block">${esc(x.path)}</span></td><td>${statusPill(x)}</td><td class="${speed(x.ms)} num">${x.ms} ms</td></tr>`).join("")}</tbody></table></div>`;
    } catch (error) {
      healthBox.innerHTML = `<p class="error">${esc(error.message)}</p>`;
    }
  };
  runHealth();

  // GitHub connection + rebuild hook status
  const connBox = $("[data-conn]", root);
  Promise.all([fetch("/.netlify/functions/cms").then((r) => r.json()).catch(() => null), fetch("/.netlify/functions/studio").then((r) => r.json()).catch(() => null)]).then(([cms, studio]) => {
    const rows = [];
    if (cms) rows.push(cms.configured ? `${pill("GitHub connected", "ok")} <span class="muted small">${esc(cms.repo)}@${esc(cms.branch)}</span>` : `${pill("GitHub not connected", "warn")} <span class="muted small">add ${cms.missing.map(esc).join(" and ")} in Netlify to publish</span>`);
    if (studio) rows.push(studio.rebuildHook ? `${pill("Rebuild hook set", "ok")}` : `${pill("Rebuild hook not set", "mute")} <span class="muted small">optional: set NETLIFY_BUILD_HOOK</span>`);
    connBox.innerHTML = rows.map((r) => `<p>${r}</p>`).join("");
  });

  root.addEventListener("click", async (e) => {
    if (e.target.closest("[data-check]")) return runHealth();
    if (e.target.closest("[data-rebuild]")) {
      const button = e.target.closest("[data-rebuild]");
      button.disabled = true;
      try {
        await studioApi({ action: "rebuild" });
        toast("Rebuild started. The website refreshes in about 1–2 minutes.");
      } catch (error) {
        toast(esc(error.message), { error: true, duration: 9000 });
      } finally {
        button.disabled = false;
      }
    }
  });
};
