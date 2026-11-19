// Command palette (Ctrl/Cmd + K): jump to any project, client or task, or run
// a quick action, without touching the mouse.

import { $, $$ } from "../core.js";
import { data, projectById, clientById } from "./data.js";
import { icon, esc } from "./ui.js";
import { openTask } from "./tasks.js";
import { openProject } from "./projects.js";
import { openClient } from "./clients.js";
import { openLog, openSnag } from "./sites.js";

const PAGES = [
  ["Dashboard", "#/", "dashboard"],
  ["Projects", "#/projects", "folder"],
  ["Tasks", "#/tasks", "tasks"],
  ["Clients & onboarding", "#/clients", "users"],
  ["Site management", "#/sites", "site"],
  ["Website controls", "#/website", "globe"],
  ["Journal", "#/blog", "book"],
  ["Portfolio", "#/portfolio", "image"],
  ["Updates", "#/updates", "megaphone"],
  ["Search performance (SEO)", "#/seo", "search"],
  ["Settings", "#/settings", "settings"],
];

const ACTIONS = [
  ["New task", "plus", () => openTask(null)],
  ["New project", "plus", () => openProject(null)],
  ["New client", "plus", () => openClient(null)],
  ["Log a site visit", "site", () => openLog(null)],
  ["Add a snag", "alert", () => openSnag(null)],
];

let open = false;

export const openPalette = () => {
  if (open) return;
  open = true;
  const el = document.createElement("div");
  el.className = "palette-backdrop";
  el.innerHTML = `<div class="palette" role="dialog" aria-modal="true" aria-label="Search">
    <div class="palette-input">${icon("search", 18)}<input type="text" placeholder="Search projects, clients, tasks… or type a command" aria-label="Search" autocomplete="off"><kbd>esc</kbd></div>
    <div class="palette-list" role="listbox"></div></div>`;
  document.body.appendChild(el);
  const input = $("input", el);
  const list = $(".palette-list", el);
  let results = [];
  let active = 0;

  const compute = (q) => {
    q = q.trim().toLowerCase();
    const has = (s) => String(s || "").toLowerCase().includes(q);
    const out = [];
    for (const [label, ic, run] of ACTIONS) if (!q || has(label)) out.push({ group: "Actions", label, icon: ic, run });
    if (q) {
      for (const p of data.projects.filter((p) => has(`${p.name} ${p.code} ${p.location}`)).slice(0, 5)) out.push({ group: "Projects", label: p.name, sub: [p.code, (clientById(p.clientId) || {}).name].filter(Boolean).join(" · "), icon: "folder", run: () => (location.hash = `#/projects/${p.id}`) });
      for (const c of data.clients.filter((c) => has(`${c.name} ${c.company} ${c.email} ${c.location}`)).slice(0, 5)) out.push({ group: "Clients", label: c.name, sub: [c.company, c.location].filter(Boolean).join(" · "), icon: "users", run: () => (location.hash = `#/clients/${c.id}`) });
      for (const t of data.tasks.filter((t) => has(t.title)).slice(0, 6)) out.push({ group: "Tasks", label: t.title, sub: (projectById(t.projectId) || {}).name || "", icon: "tasks", run: () => openTask(t.id) });
    }
    for (const [label, hash, ic] of PAGES) if (!q || has(label)) out.push({ group: "Go to", label, icon: ic, run: () => (location.hash = hash) });
    return out.slice(0, 14);
  };

  const draw = () => {
    let group = "";
    list.innerHTML = results.length
      ? results
          .map((r, i) => {
            const head = r.group !== group ? `<div class="palette-group">${esc(r.group)}</div>` : "";
            group = r.group;
            return `${head}<button type="button" role="option" class="palette-item ${i === active ? "on" : ""}" data-i="${i}">${icon(r.icon, 16)}<span>${esc(r.label)}</span>${r.sub ? `<em>${esc(r.sub)}</em>` : ""}</button>`;
          })
          .join("")
      : '<p class="palette-empty">Nothing found</p>';
    $(".on", list)?.scrollIntoView({ block: "nearest" });
  };
  const update = () => {
    results = compute(input.value);
    active = 0;
    draw();
  };

  const close = () => {
    open = false;
    document.removeEventListener("keydown", onKey, true);
    el.remove();
  };
  const run = (i) => {
    const r = results[i];
    if (!r) return;
    close();
    r.run();
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + results.length) % Math.max(1, results.length);
      draw();
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(active);
    }
  };
  document.addEventListener("keydown", onKey, true);
  input.addEventListener("input", update);
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) run(Number(b.dataset.i));
  });
  list.addEventListener("mousemove", (e) => {
    const b = e.target.closest("[data-i]");
    if (b && Number(b.dataset.i) !== active) {
      active = Number(b.dataset.i);
      $$(".palette-item", list).forEach((x, n) => x.classList.toggle("on", n === active));
    }
  });
  el.addEventListener("mousedown", (e) => e.target === el && close());
  update();
  input.focus();
};
