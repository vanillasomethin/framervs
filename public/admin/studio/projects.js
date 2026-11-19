// Projects: board by stage, table, and the project page (overview, tasks,
// site, files, activity). Private studio data, separate from the public
// portfolio on the website (a project can be copied there as a draft).

import { $, $$, uid, app } from "../core.js";
import {
  data, put, del, note, today, daysBetween, member, team, nextProjectCode,
  PROJECT_STAGES, HEALTH, PROJECT_TYPES, isDone, isOverdue, progressOf, tasksOf, logsOf, snagsOf, milestonesOf,
  clientById, projectById, briefOf,
} from "./data.js";
import {
  icon, esc, avatar, pill, progressBar, fmtDate, fmtDateTime, relDue, money, timeAgo, optionsHTML, openDrawer, openMenu, confirmBox, emptyState, mount, copyText,
} from "./ui.js";
import { mountTasks, openTask } from "./tasks.js";
import { mountSite } from "./sites.js";
import { studioApi } from "../core.js";

const stageLabel = (id) => (PROJECT_STAGES.find((s) => s.id === id) || {}).label || id;
const healthOf = (id) => HEALTH.find((h) => h.id === id) || HEALTH[0];
const healthPill = (id) => pill(healthOf(id).label, healthOf(id).tone);
const openTasksOf = (p) => tasksOf(p.id).filter((t) => !isDone(t));

// ---------------------------------------------------------------------------
// Create / edit

export const openProject = (id, defaults = {}) => {
  const existing = id ? projectById(id) : null;
  const clients = [...data.clients].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ id: c.id, label: c.name }));
  openDrawer({
    title: existing ? "Edit project" : "New project",
    subtitle: existing ? esc(existing.code || "") : "",
    spec: [
      { key: "name", label: "Project name", type: "text", required: true, placeholder: "e.g. Laterite Courtyard House" },
      { key: "clientId", label: "Client", type: "select", options: clients, blank: "No client yet" },
      { key: "type", label: "Type", type: "text", list: PROJECT_TYPES, half: true },
      { key: "location", label: "Location", type: "text", half: true, placeholder: "Town / site address" },
      { key: "stage", label: "Stage", type: "select", options: PROJECT_STAGES, half: true },
      { key: "health", label: "Health", type: "select", options: HEALTH, half: true },
      { key: "start", label: "Start date", type: "date", half: true },
      { key: "due", label: "Target completion", type: "date", half: true },
      { key: "lead", label: "Project lead", type: "team", half: true },
      { key: "area", label: "Area", type: "text", half: true, placeholder: "e.g. 3,200 sq ft" },
      { key: "fee", label: "Our fee (₹)", type: "number", half: true },
      { key: "budget", label: "Construction budget (₹)", type: "number", half: true },
      { key: "summary", label: "Summary", type: "textarea", rows: 3, placeholder: "The brief in a few lines" },
    ],
    values: existing || { stage: "briefing", health: "on_track", start: today(), type: "Residential", ...defaults },
    saveLabel: existing ? "Save changes" : "Create project",
    onSave: (out) => {
      const project = { ...(existing || { id: uid("pj_"), code: nextProjectCode(), links: [] }), ...out };
      put("projects", project);
      if (!existing) {
        note(`created project “${project.name}”`, { type: "project", id: project.id });
        const client = clientById(project.clientId);
        if (client) put("clients", { ...client, checks: { ...(client.checks || {}), project_created: true } });
        location.hash = `#/projects/${project.id}`;
      } else if (existing.stage !== project.stage) {
        note(`moved “${project.name}” to ${stageLabel(project.stage)}`, { type: "project", id: project.id });
      }
      app.render();
    },
    onDelete: existing ? () => deleteProject(existing) : null,
    deleteLabel: "Delete project",
  });
};

const deleteProject = (project) => {
  const photoIds = [...logsOf(project.id), ...snagsOf(project.id)].flatMap((i) => i.photos || []);
  [...tasksOf(project.id)].forEach((t) => del("tasks", t.id));
  [...logsOf(project.id)].forEach((l) => del("logs", l.id));
  [...snagsOf(project.id)].forEach((s) => del("snags", s.id));
  [...milestonesOf(project.id)].forEach((m) => del("milestones", m.id));
  del("projects", project.id);
  if (photoIds.length) studioApi({ action: "photo.del", ids: photoIds }).catch(() => {});
  location.hash = "#/projects";
  app.render();
};

export const openMilestone = (id, defaults = {}) => {
  const existing = id ? data.milestones.find((m) => m.id === id) : null;
  openDrawer({
    title: existing ? "Edit milestone" : "New milestone",
    spec: [
      { key: "title", label: "Milestone", type: "text", required: true, placeholder: "e.g. Plinth beam cast, Client approval, Handover" },
      { key: "date", label: "Date", type: "date", half: true },
      { key: "done", label: "Status", type: "select", options: [{ id: "no", label: "Upcoming" }, { id: "yes", label: "Completed" }], half: true },
    ],
    values: existing ? { ...existing, done: existing.done ? "yes" : "no" } : { done: "no", ...defaults },
    onSave: (out) => {
      const milestone = { ...(existing || { id: uid("ms_"), projectId: defaults.projectId }), ...out, done: out.done === "yes" };
      put("milestones", milestone);
      if (milestone.done && !(existing && existing.done)) note(`reached milestone “${milestone.title}”`, { type: "milestone", id: milestone.id });
      app.render();
    },
    onDelete: existing
      ? () => {
          del("milestones", existing.id);
          app.render();
        }
      : null,
  });
};

const changeStage = (project, stage) => {
  if (project.stage === stage) return;
  put("projects", { ...project, stage });
  note(`moved “${project.name}” to ${stageLabel(stage)}`, { type: "project", id: project.id });
};

// ---------------------------------------------------------------------------
// List page

const ui = {
  view: localStorage.getItem("vsProjectsView") || "board",
  q: "",
  health: "",
  lead: "",
  archived: false,
};

const projectCard = (p) => {
  const client = clientById(p.clientId);
  const ratio = progressOf(p);
  const open = openTasksOf(p);
  const overdue = open.filter(isOverdue).length;
  const due = relDue(p.due);
  const lead = member(p.lead);
  return `<article class="card project" draggable="true" data-id="${p.id}" tabindex="0">
    <div class="card-top"><span class="code">${esc(p.code || "")}</span>${healthPill(p.health)}</div>
    <h4>${esc(p.name)}</h4>
    <p class="muted small">${[client ? esc(client.name) : "", esc(p.location || "")].filter(Boolean).join(" · ") || "&nbsp;"}</p>
    <div class="card-progress">${progressBar(ratio, healthOf(p.health).tone)}<span class="muted small">${ratio == null ? "No tasks" : `${Math.round(ratio * 100)}%`}</span></div>
    <div class="card-meta">${p.due ? `<span class="chip ${due.tone}">${icon("calendar", 12)} ${esc(fmtDate(p.due))}</span>` : ""}${open.length ? `<span class="chip ${overdue ? "bad" : ""}">${icon("tasks", 12)} ${open.length}${overdue ? ` · ${overdue} late` : ""}</span>` : ""}<span class="grow"></span>${lead ? avatar(lead.name, 24) : ""}</div>
  </article>`;
};

const projectsBoard = (list) =>
  `<div class="board-scroll"><div class="board stages" style="grid-template-columns:${PROJECT_STAGES.map((s) => (list.some((p) => p.stage === s.id) ? "262px" : "132px")).join(" ")}">${PROJECT_STAGES.map((s) => {
    const col = list.filter((p) => p.stage === s.id);
    return `<section class="col ${col.length ? "" : "slim"}"><header><span class="col-title">${s.label}</span><b>${col.length}</b></header><div class="col-body" data-stage="${s.id}">${col.map(projectCard).join("") || '<p class="col-empty">–</p>'}</div></section>`;
  }).join("")}</div></div>`;

const projectsTable = (list) =>
  `<section class="panel flush"><div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Client</th><th>Stage</th><th>Health</th><th>Progress</th><th>Open tasks</th><th>Due</th><th>Lead</th></tr></thead><tbody>${list
    .map((p) => {
      const client = clientById(p.clientId);
      const ratio = progressOf(p);
      const due = relDue(p.due);
      const lead = member(p.lead);
      return `<tr data-go="#/projects/${p.id}"><td><b>${esc(p.name)}</b><span class="muted small block">${esc(p.code || "")}${p.location ? ` · ${esc(p.location)}` : ""}</span></td><td>${client ? esc(client.name) : '<span class="muted">–</span>'}</td><td>${esc(stageLabel(p.stage))}</td><td>${healthPill(p.health)}</td><td class="w-progress">${progressBar(ratio, healthOf(p.health).tone)}<span class="muted small">${ratio == null ? "–" : `${Math.round(ratio * 100)}%`}</span></td><td>${openTasksOf(p).length || '<span class="muted">0</span>'}</td><td>${p.due ? `<span class="${due.tone}">${esc(fmtDate(p.due))}</span>` : '<span class="muted">–</span>'}</td><td>${lead ? `<span class="person">${avatar(lead.name, 22)}<span>${esc(lead.name.split(" ")[0])}</span></span>` : ""}</td></tr>`;
    })
    .join("")}</tbody></table></div></section>`;

export const renderProjects = (view) => {
  const visible = () => {
    const q = ui.q.trim().toLowerCase();
    return data.projects.filter(
      (p) =>
        (ui.archived ? p.archived : !p.archived) &&
        (!ui.health || p.health === ui.health) &&
        (!ui.lead || p.lead === ui.lead) &&
        (!q || `${p.name} ${p.code} ${p.location || ""} ${(clientById(p.clientId) || {}).name || ""}`.toLowerCase().includes(q))
    );
  };

  const root = mount(view, `
    <div class="page-head"><div><h1>Projects</h1><p>The studio's live work: where each project is, how healthy it is, and what's next. Drag a card to change its stage.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} New project</button></div></div>
    <div class="toolbar">
      <div class="seg">${[["board", "board", "Board"], ["table", "table", "Table"]].map(([id, ic, l]) => `<button type="button" data-view="${id}" class="${ui.view === id ? "on" : ""}">${icon(ic, 15)}<span>${l}</span></button>`).join("")}</div>
      <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search projects" value="${esc(ui.q)}"></label>
      <select data-filter="health" aria-label="Health">${optionsHTML(HEALTH, ui.health, { blank: "Any health" })}</select>
      ${team().length ? `<select data-filter="lead" aria-label="Lead">${optionsHTML(team().map((m) => ({ id: m.id, label: m.name })), ui.lead, { blank: "Any lead" })}</select>` : ""}
      <label class="check-inline"><input type="checkbox" data-archived ${ui.archived ? "checked" : ""}> Archived</label>
    </div>
    <div class="projects-body"></div>`);
  const body = $(".projects-body", root);

  const draw = () => {
    const list = visible();
    if (!data.projects.length) {
      body.innerHTML = emptyState({ iconName: "folder", title: "No projects yet", text: "Create your first project, or onboard a client and turn their brief into one.", action: '<button class="btn primary" data-new>New project</button>' });
    } else if (!list.length) {
      body.innerHTML = emptyState({ iconName: "search", title: "No projects match", text: "Try clearing a filter." });
    } else {
      body.innerHTML = ui.view === "table" ? projectsTable(list) : projectsBoard(list);
    }
  };
  draw();

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) return openProject(null);
    const v = t.closest("[data-view]");
    if (v) {
      ui.view = v.dataset.view;
      localStorage.setItem("vsProjectsView", ui.view);
      $$("[data-view]", root).forEach((b) => b.classList.toggle("on", b === v));
      return draw();
    }
    const card = t.closest(".card.project");
    if (card) location.hash = `#/projects/${card.dataset.id}`;
    const go = t.closest("[data-go]");
    if (go) location.hash = go.dataset.go;
  });
  root.addEventListener("input", (e) => {
    if (e.target.matches("[data-q]")) {
      ui.q = e.target.value;
      draw();
    }
  });
  root.addEventListener("change", (e) => {
    if (e.target.dataset.filter) ui[e.target.dataset.filter] = e.target.value;
    else if (e.target.matches("[data-archived]")) ui.archived = e.target.checked;
    else return;
    draw();
  });
  root.addEventListener("keydown", (e) => {
    const card = e.target.closest(".card.project");
    if (card && e.key === "Enter") location.hash = `#/projects/${card.dataset.id}`;
  });

  // Drag a project card to another stage
  let dragging = null;
  root.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card.project");
    if (!card) return;
    dragging = card.dataset.id;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragging);
  });
  root.addEventListener("dragend", () => {
    dragging = null;
    $$(".dragging, .drop-over", root).forEach((el) => el.classList.remove("dragging", "drop-over"));
  });
  root.addEventListener("dragover", (e) => {
    const col = e.target.closest(".col-body");
    if (!col || !dragging) return;
    e.preventDefault();
    $$(".drop-over", root).forEach((el) => el !== col && el.classList.remove("drop-over"));
    col.classList.add("drop-over");
  });
  root.addEventListener("drop", (e) => {
    const col = e.target.closest(".col-body");
    if (!col || !dragging) return;
    e.preventDefault();
    changeStage(projectById(dragging), col.dataset.stage);
    dragging = null;
    draw();
  });
};

// ---------------------------------------------------------------------------
// Project page

const TABS = [
  ["overview", "Overview", "dashboard"],
  ["tasks", "Tasks", "tasks"],
  ["site", "Site", "site"],
  ["files", "Files & links", "link"],
  ["activity", "Activity", "pulse"],
];

const kv = (k, v) => (v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "");

export const activityList = (items, { withProject = false } = {}) =>
  items.length
    ? `<ul class="feed">${items
        .map((a) => {
          const project = withProject && a.ref && a.ref.projectId ? projectById(a.ref.projectId) : null;
          return `<li>${avatar(a.who, 24)}<div><p><b>${esc(a.who)}</b> ${esc(a.text)}${project ? ` <a href="#/projects/${project.id}" class="muted">· ${esc(project.name)}</a>` : ""}</p><span class="muted small" title="${esc(fmtDateTime(a.at))}">${esc(timeAgo(a.at))}</span></div></li>`;
        })
        .join("")}</ul>`
    : '<p class="muted">Nothing yet.</p>';

const overviewHTML = (p) => {
  const ratio = progressOf(p);
  const tasks = tasksOf(p.id);
  const open = tasks.filter((t) => !isDone(t));
  const overdue = open.filter(isOverdue);
  const next = [...open].sort((a, b) => (a.due || "9").localeCompare(b.due || "9")).slice(0, 6);
  const milestones = [...milestonesOf(p.id)].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  const client = clientById(p.clientId);
  const lead = member(p.lead);
  const stageIndex = PROJECT_STAGES.findIndex((s) => s.id === p.stage);
  const daysLeft = p.due ? daysBetween(today(), p.due) : null;
  const activity = data.activity.filter((a) => a.ref && a.ref.projectId === p.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return `
    <section class="panel"><div class="stepper">${PROJECT_STAGES.map((s, i) => `<button type="button" class="step ${i < stageIndex ? "past" : ""} ${i === stageIndex ? "now" : ""}" data-stage="${s.id}" title="Set stage to ${esc(s.label)}"><i>${i < stageIndex ? icon("check", 12) : i + 1}</i><span>${esc(s.label)}</span></button>`).join("")}</div></section>
    <div class="kpis">
      <div class="kpi"><span class="k">Progress</span><b>${ratio == null ? "–" : `${Math.round(ratio * 100)}%`}</b>${progressBar(ratio, healthOf(p.health).tone)}</div>
      <div class="kpi ${overdue.length ? "warn" : ""}"><span class="k">Open tasks</span><b>${open.length}</b><span class="muted small">${overdue.length ? `${overdue.length} overdue` : "none overdue"}</span></div>
      <div class="kpi ${daysLeft !== null && daysLeft < 0 ? "warn" : ""}"><span class="k">Target date</span><b>${p.due ? esc(fmtDate(p.due)) : "–"}</b><span class="muted small">${daysLeft === null ? "Not set" : daysLeft < 0 ? `${-daysLeft} days past` : daysLeft === 0 ? "Today" : `${daysLeft} days to go`}</span></div>
      <div class="kpi"><span class="k">Fee · budget</span><b>${esc(money(p.fee))}</b><span class="muted small">Budget ${esc(money(p.budget))}</span></div>
    </div>
    <div class="two-col">
      <div class="stack">
        <section class="panel"><div class="panel-row"><h2 class="panel-title">Next up</h2><button class="btn small" data-new-task>${icon("plus", 14)} Task</button></div>
          ${next.length ? `<div class="mini-list">${next.map((t) => {
            const due = relDue(t.due);
            return `<div class="mini" data-open-task="${t.id}"><span>${esc(t.title)}</span>${due.text ? `<span class="chip ${due.tone}">${esc(due.text)}</span>` : ""}${t.assignee && member(t.assignee) ? avatar(member(t.assignee).name, 22) : ""}</div>`;
          }).join("")}</div><a class="link-more" href="#/projects/${p.id}/tasks">All ${tasks.length} tasks ${icon("chevronRight", 14)}</a>` : '<p class="muted">No open tasks. Add the next step.</p>'}
        </section>
        <section class="panel"><div class="panel-row"><h2 class="panel-title">Milestones</h2><button class="btn small" data-new-milestone>${icon("plus", 14)} Milestone</button></div>
          ${milestones.length ? `<div class="mini-list">${milestones.map((m) => `<div class="mini ${m.done ? "is-done" : ""}"><button type="button" class="check ${m.done ? "on" : ""}" data-ms-toggle="${m.id}" aria-label="Toggle milestone">${icon("check", 13)}</button><span data-open-ms="${m.id}">${esc(m.title)}</span>${m.date ? `<span class="chip ${m.done ? "" : relDue(m.date).tone}">${esc(fmtDate(m.date))}</span>` : ""}</div>`).join("")}</div>` : '<p class="muted">Add key dates: approvals, tender, site milestones, handover.</p>'}
        </section>
      </div>
      <div class="stack">
        <section class="panel"><h2 class="panel-title">Details</h2><dl class="dl">
          ${kv("Client", client ? `<a href="#/clients/${client.id}">${esc(client.name)}</a>` : "")}${kv("Type", esc(p.type || ""))}${kv("Location", esc(p.location || ""))}${kv("Area", esc(p.area || ""))}${kv("Lead", lead ? `<span class="person">${avatar(lead.name, 22)}${esc(lead.name)}</span>` : "")}${kv("Started", p.start ? esc(fmtDate(p.start, { year: true })) : "")}
        </dl>${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ""}</section>
        <section class="panel"><h2 class="panel-title">Recent activity</h2>${activityList(activity)}</section>
      </div>
    </div>`;
};

const filesHTML = (p) => {
  const links = p.links || [];
  const brief = briefOf(p.clientId);
  return `<section class="panel"><div class="panel-row"><h2 class="panel-title">Files & links</h2><button class="btn small" data-edit-links>${icon("edit", 14)} Edit links</button></div>
    <p class="muted">Keep the project's Drive folders, drawing sets, BOQs and ERP pages one click away. Files themselves stay in their own place; only the links are stored here.</p>
    ${links.length ? `<div class="link-cards">${links.map((l) => `<a class="link-card" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${icon("link", 18)}<span><b>${esc(l.label)}</b><span class="muted small block">${esc(l.url.replace(/^https?:\/\//, "").slice(0, 60))}</span></span>${icon("external", 14)}</a>`).join("")}</div>` : emptyState({ iconName: "link", title: "No links yet", text: "Add the project folder, drawing sets and the ERP project.", action: '<button class="btn primary" data-edit-links>Add links</button>' })}
  </section>
  ${brief ? `<section class="panel"><div class="panel-row"><h2 class="panel-title">Client brief</h2><a class="btn small" href="#/clients/${p.clientId}">Open brief</a></div><p class="muted">Submitted ${esc(timeAgo(brief.submittedAt))}${brief.data.budget ? ` · budget ${esc(brief.data.budget)}` : ""}${brief.data.timeline ? ` · timeline ${esc(brief.data.timeline)}` : ""}.</p></section>` : ""}`;
};

const editLinks = (p) =>
  openDrawer({
    title: "Files & links",
    spec: [{ key: "links", type: "links" }],
    values: { links: p.links || [] },
    onSave: (out) => {
      put("projects", { ...p, links: out.links });
      app.render();
    },
  });

export const renderProjectDetail = (view, id, tab = "overview") => {
  const p = projectById(id);
  if (!p) {
    mount(view, emptyState({ iconName: "folder", title: "Project not found", text: "It may have been deleted.", action: '<a class="btn" href="#/projects">Back to projects</a>' }));
    return;
  }
  if (!TABS.some(([t]) => t === tab)) tab = "overview";
  const client = clientById(p.clientId);
  const root = mount(view, `
    <a class="back" href="#/projects">${icon("chevronLeft", 14)} Projects</a>
    <div class="page-head tight"><div class="title-block"><span class="code">${esc(p.code || "")}${p.archived ? " · Archived" : ""}</span><h1>${esc(p.name)}</h1>
      <p>${[client ? `<a href="#/clients/${client.id}">${esc(client.name)}</a>` : "", esc(p.type || ""), esc(p.location || "")].filter(Boolean).join(" · ")}</p></div>
      <div class="head-actions">
        <select class="select-pill" data-stage aria-label="Stage">${optionsHTML(PROJECT_STAGES, p.stage)}</select>
        <select class="select-pill tone-${healthOf(p.health).tone}" data-health aria-label="Health">${optionsHTML(HEALTH, p.health)}</select>
        <button class="btn" data-edit>${icon("edit", 15)} Edit</button>
        <button class="btn icon-only" data-more aria-label="More actions">${icon("more", 18)}</button>
      </div></div>
    <nav class="tabs" role="tablist">${TABS.map(([t, label, ic]) => `<a role="tab" href="#/projects/${p.id}${t === "overview" ? "" : `/${t}`}" class="${t === tab ? "on" : ""}">${icon(ic, 15)}<span>${label}</span></a>`).join("")}</nav>
    <div class="tab-body"></div>`);

  const body = $(".tab-body", root);
  if (tab === "tasks") mountTasks(body, { projectId: p.id });
  else if (tab === "site") mountSite(body, p.id);
  else if (tab === "files") body.innerHTML = filesHTML(p);
  else if (tab === "activity") body.innerHTML = `<section class="panel"><h2 class="panel-title">Activity</h2>${activityList(data.activity.filter((a) => a.ref && a.ref.projectId === p.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60))}</section>`;
  else body.innerHTML = overviewHTML(p);

  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-stage]")) {
      changeStage(p, e.target.value);
      app.render();
    } else if (e.target.matches("[data-health]")) {
      put("projects", { ...p, health: e.target.value });
      note(`marked “${p.name}” as ${healthOf(e.target.value).label.toLowerCase()}`, { type: "project", id: p.id });
      app.render();
    }
  });

  root.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("[data-edit]")) return openProject(p.id);
    if (t.closest("[data-edit-links]")) return editLinks(p);
    if (t.closest("[data-new-task]")) return openTask(null, { projectId: p.id });
    if (t.closest("[data-new-milestone]")) return openMilestone(null, { projectId: p.id });
    const step = t.closest("[data-stage].step");
    if (step) {
      changeStage(p, step.dataset.stage);
      return app.render();
    }
    const ot = t.closest("[data-open-task]");
    if (ot) return openTask(ot.dataset.openTask);
    const om = t.closest("[data-open-ms]");
    if (om) return openMilestone(om.dataset.openMs);
    const mt = t.closest("[data-ms-toggle]");
    if (mt) {
      const m = data.milestones.find((x) => x.id === mt.dataset.msToggle);
      put("milestones", { ...m, done: !m.done });
      if (!m.done) note(`reached milestone “${m.title}”`, { type: "milestone", id: m.id });
      return app.render();
    }
    if (t.closest("[data-more]")) {
      openMenu(t.closest("[data-more]"), [
        { label: "Add to website portfolio", icon: "globe", onClick: () => app.addToPortfolio(p) },
        { label: "Copy project code", icon: "copy", onClick: () => copyText(p.code || p.id, "Project code copied") },
        "-",
        { label: p.archived ? "Unarchive" : "Archive project", icon: "folder", onClick: () => { put("projects", { ...p, archived: !p.archived }); app.render(); } },
        { label: "Delete project…", icon: "trash", danger: true, onClick: async () => { if (await confirmBox({ title: `Delete “${p.name}”?`, message: "Its tasks, site logs, snags and milestones are deleted too. This can't be undone.", confirmLabel: "Delete project", danger: true })) deleteProject(p); } },
      ]);
    }
  });
};
