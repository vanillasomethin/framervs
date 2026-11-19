// Site management: visit logs (with photos), planned visits and snag lists.
// Shown per project (Site tab) and across projects on the Sites page.

import { uid, app } from "../core.js";
import {
  data, put, del, note, today, addDays, daysBetween, lastVisit, member,
  PRIORITY, SNAG_STATUS, projectById, snagsOf, logsOf, milestonesOf,
} from "./data.js";
import { icon, esc, pill, avatar, fmtDate, relDue, optionsHTML, openDrawer, emptyState, photoGrid, mount, hydratePhotos } from "./ui.js";
import { studioApi } from "../core.js";

const WEATHER = ["Clear", "Cloudy", "Light rain", "Heavy rain", "Hot", "Windy"];
const priorityTone = (id) => (PRIORITY.find((p) => p.id === id) || {}).tone || "mute";
const isOpenSnag = (s) => s.status === "open" || s.status === "progress";
const projectOptions = () => data.projects.filter((p) => !p.archived).map((p) => ({ id: p.id, label: p.name }));

const dropPhotos = (ids) => (ids && ids.length ? studioApi({ action: "photo.del", ids }).catch(() => {}) : null);

// ---------------------------------------------------------------------------
// Visit log

export const openLog = (id, defaults = {}) => {
  const existing = id ? data.logs.find((l) => l.id === id) : null;
  const values = existing || { date: today(), status: "done", photos: [], ...defaults };
  const planned = values.status === "planned";
  openDrawer({
    title: existing ? (planned ? "Planned site visit" : "Site visit") : defaults.status === "planned" ? "Plan a site visit" : "Log a site visit",
    subtitle: existing ? esc((projectById(existing.projectId) || {}).name || "") : "",
    spec: [
      { key: "projectId", label: "Project", type: "select", options: projectOptions(), required: true },
      { key: "date", label: "Date", type: "date", half: true, required: true },
      { key: "status", label: "Status", type: "select", options: [{ id: "done", label: "Visited" }, { id: "planned", label: "Planned" }], half: true },
      { key: "author", label: "Visited by", type: "team", half: true },
      { key: "weather", label: "Weather", type: "select", options: WEATHER, blank: "–", half: true },
      { key: "workers", label: "Workers on site", type: "number", half: true },
      { key: "summary", label: "Work done / agenda", type: "textarea", rows: 4, placeholder: "What was completed, what was checked, who was met…" },
      { key: "issues", label: "Issues & decisions", type: "textarea", rows: 3, placeholder: "Problems found, client or contractor decisions" },
      { key: "next", label: "Next steps", type: "textarea", rows: 2 },
      { key: "photos", label: "Photos", type: "photos" },
    ],
    values,
    saveLabel: existing ? "Save changes" : "Save",
    onSave: (out) => {
      const log = { ...(existing || { id: uid("lg_") }), ...out };
      const removed = (existing?.photos || []).filter((p) => !out.photos.includes(p));
      put("logs", log);
      dropPhotos(removed);
      const project = projectById(log.projectId);
      if (!existing) note(`${log.status === "planned" ? "planned a site visit for" : "logged a site visit at"} ${project ? project.name : "a project"}`, { type: "log", id: log.id });
      app.render();
    },
    onDelete: existing
      ? () => {
          del("logs", existing.id);
          dropPhotos(existing.photos);
          app.render();
        }
      : null,
  });
};

// ---------------------------------------------------------------------------
// Snags

export const openSnag = (id, defaults = {}) => {
  const existing = id ? data.snags.find((s) => s.id === id) : null;
  openDrawer({
    title: existing ? "Edit snag" : "Add a snag",
    subtitle: existing ? esc((projectById(existing.projectId) || {}).name || "") : "",
    spec: [
      { key: "projectId", label: "Project", type: "select", options: projectOptions(), required: true },
      { key: "title", label: "Issue", type: "text", required: true, placeholder: "e.g. Tile lippage in master bath" },
      { key: "area", label: "Location", type: "text", half: true, placeholder: "e.g. Level 1, kitchen" },
      { key: "priority", label: "Priority", type: "select", options: PRIORITY, half: true },
      { key: "status", label: "Status", type: "select", options: SNAG_STATUS, half: true },
      { key: "assignee", label: "Responsible", type: "team", half: true },
      { key: "due", label: "Fix by", type: "date", half: true },
      { key: "notes", label: "Notes", type: "textarea", rows: 3, placeholder: "What needs to be done, who to speak to" },
      { key: "photos", label: "Photos", type: "photos" },
    ],
    values: existing || { status: "open", priority: "med", photos: [], ...defaults },
    saveLabel: existing ? "Save changes" : "Add snag",
    onSave: (out) => {
      const snag = { ...(existing || { id: uid("sn_") }), ...out };
      const removed = (existing?.photos || []).filter((p) => !out.photos.includes(p));
      put("snags", snag);
      dropPhotos(removed);
      if (!existing) note(`raised snag “${snag.title}”`, { type: "snag", id: snag.id });
      else if (existing.status !== snag.status && (snag.status === "resolved" || snag.status === "verified")) note(`${snag.status} snag “${snag.title}”`, { type: "snag", id: snag.id });
      app.render();
    },
    onDelete: existing
      ? () => {
          del("snags", existing.id);
          dropPhotos(existing.photos);
          app.render();
        }
      : null,
  });
};

// ---------------------------------------------------------------------------
// Pieces

const visitCard = (l, { withProject }) => {
  const planned = l.status === "planned";
  const a = member(l.author);
  const project = projectById(l.projectId);
  return `<article class="visit ${planned ? "planned" : ""}" data-log="${l.id}" tabindex="0">
    <div class="visit-date"><b>${esc(fmtDate(l.date).split(" ")[0])}</b><span>${esc(fmtDate(l.date).split(" ").slice(1).join(" "))}</span></div>
    <div class="visit-main">
      <div class="visit-top">${withProject && project ? `<span class="chip proj">${esc(project.name)}</span>` : ""}${planned ? pill("Planned", "info") : pill("Visited", "ok")}${l.weather ? `<span class="muted small">${esc(l.weather)}</span>` : ""}${l.workers ? `<span class="muted small">${esc(l.workers)} on site</span>` : ""}<span class="grow"></span>${a ? avatar(a.name, 22) : ""}</div>
      ${l.summary ? `<p class="clamp">${esc(l.summary)}</p>` : ""}
      ${l.issues ? `<p class="issue">${icon("alert", 14)} <span class="clamp">${esc(l.issues)}</span></p>` : ""}
      ${(l.photos || []).length ? photoGrid(l.photos.slice(0, 4)) : ""}${(l.photos || []).length > 4 ? `<span class="muted small">+${l.photos.length - 4} more photos</span>` : ""}
    </div>
  </article>`;
};

const snagRow = (s, { withProject }) => {
  const due = relDue(s.due, !isOpenSnag(s));
  const a = member(s.assignee);
  const project = projectById(s.projectId);
  return `<div class="snag ${isOpenSnag(s) ? "" : "is-done"}" data-snag="${s.id}">
    <span class="prio ${priorityTone(s.priority)}" title="${esc((PRIORITY.find((p) => p.id === s.priority) || {}).label || "")} priority"></span>
    <div class="snag-main"><b>${esc(s.title)}</b><span class="muted small">${[withProject && project ? esc(project.name) : "", esc(s.area || "")].filter(Boolean).join(" · ")}</span></div>
    ${(s.photos || []).length ? `<span class="chip">${icon("camera", 12)} ${s.photos.length}</span>` : ""}
    ${due.text ? `<span class="chip ${due.tone}">${icon("calendar", 12)} ${esc(due.text)}</span>` : ""}
    ${a ? avatar(a.name, 22) : ""}
    <select class="snag-status" data-snag-status="${s.id}" aria-label="Status">${optionsHTML(SNAG_STATUS, s.status)}</select>
  </div>`;
};

const changeSnagStatus = (id, status) => {
  const snag = data.snags.find((s) => s.id === id);
  if (!snag || snag.status === status) return;
  put("snags", { ...snag, status });
  if (status === "resolved" || status === "verified") note(`${status} snag “${snag.title}”`, { type: "snag", id });
  app.render();
};

const bindSiteActions = (root, defaults = {}) =>
  root.addEventListener("click", (e) => {
    const t = e.target;
    const newLog = t.closest("[data-new-log]");
    if (newLog) return openLog(null, { ...defaults, ...(newLog.dataset.pid ? { projectId: newLog.dataset.pid } : {}), ...(newLog.dataset.planned ? { status: "planned" } : {}) });
    if (t.closest("[data-new-snag]")) return openSnag(null, defaults);
    const log = t.closest("[data-log]");
    if (log && !t.closest("[data-lightbox]")) return openLog(log.dataset.log);
    const snag = t.closest("[data-snag]");
    if (snag && !t.closest("select")) return openSnag(snag.dataset.snag);
  });

// ---------------------------------------------------------------------------
// Inside a project

export const mountSite = (container, projectId) => {
  const logs = logsOf(projectId).sort((a, b) => b.date.localeCompare(a.date));
  const planned = logs.filter((l) => l.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
  const visited = logs.filter((l) => l.status !== "planned");
  const snags = snagsOf(projectId);
  const open = snags.filter(isOpenSnag).sort((a, b) => PRIORITY.findIndex((p) => p.id === b.priority) - PRIORITY.findIndex((p) => p.id === a.priority));
  const closed = snags.filter((s) => !isOpenSnag(s));
  const last = lastVisit(projectId);

  container.innerHTML = `
    <div class="site-summary">
      <div><span class="k">Last visit</span><b>${last ? esc(fmtDate(last)) : "None yet"}</b><span class="muted small">${last ? `${daysBetween(last, today())} days ago` : "Log the first visit"}</span></div>
      <div><span class="k">Open snags</span><b>${open.length}</b><span class="muted small">${open.filter((s) => s.priority === "high" || s.priority === "urgent").length} high priority</span></div>
      <div><span class="k">Next visit</span><b>${planned[0] ? esc(fmtDate(planned[0].date)) : "Not planned"}</b><span class="muted small">${planned[0] ? esc(relDue(planned[0].date).text) : ""}</span></div>
      <div class="actions"><button class="btn primary" data-new-log>${icon("plus", 16)} Log visit</button><button class="btn" data-new-log data-planned="1">${icon("calendar", 16)} Plan visit</button><button class="btn" data-new-snag>${icon("alert", 16)} Add snag</button></div>
    </div>
    <div class="two-col">
      <section><h3 class="section-title">Site visits</h3>${planned.map((l) => visitCard(l, {})).join("")}${visited.map((l) => visitCard(l, {})).join("") || (planned.length ? "" : emptyState({ iconName: "site", title: "No site visits yet", text: "Log a visit with photos, weather and what was done on site." }))}</section>
      <section><h3 class="section-title">Snag list</h3>${open.map((s) => snagRow(s, {})).join("") || emptyState({ iconName: "check", title: "No open snags", text: "Raise a snag when you spot something that needs fixing." })}${closed.length ? `<h4 class="subhead">Resolved (${closed.length})</h4>${closed.map((s) => snagRow(s, {})).join("")}` : ""}</section>
    </div>`;
  hydratePhotos(container);
  bindSiteActions(container, { projectId });
  container.addEventListener("change", (e) => {
    if (e.target.dataset.snagStatus) changeSnagStatus(e.target.dataset.snagStatus, e.target.value);
  });
};

// ---------------------------------------------------------------------------
// Sites page: every live site at a glance

const isLiveSite = (p) => !p.archived && (p.stage === "construction" || p.stage === "handover");

export const renderSitesPage = (view) => {
  const stale = Number(data.settings.staleVisitDays) || 14;
  const sites = data.projects.filter(isLiveSite);
  const openSnags = data.snags.filter(isOpenSnag);
  const plannedWeek = data.logs.filter((l) => l.status === "planned" && l.date >= today() && l.date <= addDays(today(), 7));
  const rows = sites.map((p) => {
    const last = lastVisit(p.id);
    const gap = last ? daysBetween(last, today()) : null;
    const open = snagsOf(p.id).filter(isOpenSnag);
    const nextMs = milestonesOf(p.id).filter((m) => !m.done && m.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
    const nextVisit = logsOf(p.id).filter((l) => l.status === "planned" && l.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
    return { p, last, gap, open, nextMs, nextVisit, overdue: gap === null || gap > stale };
  }).sort((a, b) => Number(b.overdue) - Number(a.overdue) || (b.gap ?? 999) - (a.gap ?? 999));

  const root = mount(view, `
    <div class="page-head"><div><h1>Site management</h1><p>Every project under construction: when it was last visited, what's outstanding and what's coming up.</p></div>
      <div class="head-actions"><button class="btn" data-new-log data-planned="1">${icon("calendar", 16)} Plan visit</button><button class="btn" data-new-snag>${icon("alert", 16)} Add snag</button><button class="btn primary" data-new-log>${icon("plus", 16)} Log site visit</button></div></div>
    <div class="kpis">
      <div class="kpi"><span class="k">Live sites</span><b>${sites.length}</b><span class="muted small">in construction or handover</span></div>
      <div class="kpi ${rows.some((r) => r.overdue) ? "warn" : ""}"><span class="k">Need a visit</span><b>${rows.filter((r) => r.overdue).length}</b><span class="muted small">no visit in ${stale}+ days</span></div>
      <div class="kpi"><span class="k">Open snags</span><b>${openSnags.length}</b><span class="muted small">${openSnags.filter((s) => s.priority === "urgent" || s.priority === "high").length} high priority</span></div>
      <div class="kpi"><span class="k">Visits this week</span><b>${plannedWeek.length}</b><span class="muted small">planned</span></div>
    </div>
    <section class="panel flush"><h2 class="panel-title">Live sites</h2>${
      rows.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Last visit</th><th>Open snags</th><th>Next milestone</th><th>Next visit</th><th></th></tr></thead><tbody>${rows
            .map(
              ({ p, last, gap, open, nextMs, nextVisit, overdue }) => `<tr data-go="#/projects/${p.id}/site">
              <td><b>${esc(p.name)}</b><span class="muted small block">${esc(p.location || "")}${p.location && p.code ? " · " : ""}${esc(p.code || "")}</span></td>
              <td>${last ? `${esc(fmtDate(last))} ${overdue ? pill(`${gap}d ago`, "warn") : `<span class="muted small">${gap}d ago</span>`}` : pill("Never visited", "bad")}</td>
              <td>${open.length ? `<b>${open.length}</b>${open.some((s) => s.priority === "urgent" || s.priority === "high") ? ` ${pill("high", "bad")}` : ""}` : '<span class="muted">0</span>'}</td>
              <td>${nextMs ? `${esc(nextMs.title)} <span class="muted small">${esc(fmtDate(nextMs.date))}</span>` : '<span class="muted">–</span>'}</td>
              <td>${nextVisit ? esc(fmtDate(nextVisit.date)) : '<span class="muted">–</span>'}</td>
              <td class="row-actions"><button class="btn small" data-new-log data-pid="${p.id}">${icon("plus", 14)} Log visit</button></td></tr>`
            )
            .join("")}</tbody></table></div>`
        : emptyState({ iconName: "site", title: "No sites under construction", text: "Projects in the Construction or Handover stage appear here automatically. Move a project to Construction to start tracking its site." })
    }</section>
    <div class="two-col">
      <section class="panel"><h2 class="panel-title">Open snags</h2>${[...openSnags].sort((a, b) => PRIORITY.findIndex((x) => x.id === b.priority) - PRIORITY.findIndex((x) => x.id === a.priority)).slice(0, 12).map((s) => snagRow(s, { withProject: true })).join("") || '<p class="muted">Nothing outstanding.</p>'}</section>
      <section class="panel"><h2 class="panel-title">Recent visits</h2>${[...data.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((l) => visitCard(l, { withProject: true })).join("") || '<p class="muted">No visits logged yet.</p>'}</section>
    </div>`);

  bindSiteActions(root);
  root.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go && !e.target.closest("button, select, a")) location.hash = go.dataset.go;
  });
  root.addEventListener("change", (e) => {
    if (e.target.dataset.snagStatus) changeSnagStatus(e.target.dataset.snagStatus, e.target.value);
  });
};
