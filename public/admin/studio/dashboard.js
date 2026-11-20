// The unified dashboard: what needs attention today, how every project is
// doing, the client pipeline, site status, team workload and recent activity,
// plus a summary of the public website.

import { $, $$, app } from "../core.js";
import {
  data, put, note, today, addDays, daysBetween, meId, meName, member, team, lastVisit,
  PROJECT_STAGES, HEALTH, ONBOARDING, isDone, isOverdue, activeProjects, progressOf, projectById, clientById, hasNewBrief,
} from "./data.js";
import { icon, esc, avatar, pill, progressBar, fmtDate, relDue, mount, emptyState } from "./ui.js";
import { openTask, setTaskStatus } from "./tasks.js";
import { breach } from "./ops.js";
import { openProject } from "./projects.js";
import { openClient } from "./clients.js";
import { openLog, openSnag } from "./sites.js";
import { activityList } from "./projects.js";
import { seedDemo, hasDemoData, clearDemo } from "./demo.js";

const HEALTH_RANK = { delayed: 0, at_risk: 1, on_hold: 2, on_track: 3 };
const healthMeta = (id) => HEALTH.find((h) => h.id === id) || HEALTH[0];
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const isOpenSnag = (s) => s.status === "open" || s.status === "progress";

const ui = { focus: "mine" };

export const renderDashboard = (view, website = {}) => {
  const t0 = today();
  const mine = ui.focus === "mine" && meId();
  const openTasks = data.tasks.filter((t) => !isDone(t));
  const overdue = openTasks.filter(isOverdue);
  const projects = activeProjects();
  const dueLeads = data.leads.filter((l) => ["new", "contacted", "pitched", "negotiating"].includes(l.stage) && l.nextActionAt && l.nextActionAt <= today()).length;
  const unpaid = data.docs.filter((d) => d.kind === "invoice" && d.status === "issued");
  const lateIncidents = data.incidents.filter((i) => i.status !== "resolved" && breach(i)).length;
  const inrShort = (paise) => { const r = paise / 100; return r >= 1e7 ? `₹${(r / 1e7).toFixed(2)}Cr` : r >= 1e5 ? `₹${(r / 1e5).toFixed(1)}L` : `₹${Math.round(r).toLocaleString("en-IN")}`; };
  const atRisk = projects.filter((p) => p.health === "at_risk" || p.health === "delayed");
  const pipeline = data.clients.filter((c) => ONBOARDING.some((s) => s.id === c.stage));
  const newBriefs = data.clients.filter(hasNewBrief);
  const snags = data.snags.filter(isOpenSnag);
  const stale = Number(data.settings.staleVisitDays) || 14;
  const liveSites = data.projects.filter((p) => !p.archived && (p.stage === "construction" || p.stage === "handover"));
  const needVisit = liveSites.filter((p) => {
    const last = lastVisit(p.id);
    return !last || daysBetween(last, t0) > stale;
  });

  const isEmpty = !data.projects.length && !data.clients.length && !data.tasks.length;
  const name = meName() === "Someone" ? "" : `, ${meName().split(" ")[0]}`;

  // Today & overdue
  const focusTasks = openTasks
    .filter((t) => t.due && t.due <= t0 && (!mine || t.assignee === meId()))
    .sort((a, b) => a.due.localeCompare(b.due));

  // Coming up (next 14 days): tasks, milestones, planned visits
  const horizon = addDays(t0, 14);
  const upcoming = [
    ...openTasks.filter((t) => t.due > t0 && t.due <= horizon && (!mine || t.assignee === meId())).map((t) => ({ date: t.due, kind: "task", title: t.title, project: projectById(t.projectId), id: t.id })),
    ...data.milestones.filter((m) => !m.done && m.date >= t0 && m.date <= horizon).map((m) => ({ date: m.date, kind: "milestone", title: m.title, project: projectById(m.projectId) })),
    ...data.logs.filter((l) => l.status === "planned" && l.date >= t0 && l.date <= horizon).map((l) => ({ date: l.date, kind: "visit", title: "Site visit", project: projectById(l.projectId), id: l.id })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 9);
  const upIcon = { task: "tasks", milestone: "flag", visit: "site" };

  // Project health list
  const healthRows = [...projects].sort((a, b) => HEALTH_RANK[a.health] - HEALTH_RANK[b.health] || (a.due || "9").localeCompare(b.due || "9")).slice(0, 8);

  // Distribution of projects by stage
  const stageCounts = PROJECT_STAGES.filter((s) => s.id !== "completed").map((s) => ({ ...s, n: projects.filter((p) => p.stage === s.id).length }));
  const stageMax = Math.max(1, ...stageCounts.map((s) => s.n));

  // Onboarding funnel
  const funnel = ONBOARDING.map((s) => ({ ...s, n: pipeline.filter((c) => c.stage === s.id).length }));
  const funnelMax = Math.max(1, ...funnel.map((s) => s.n));

  // Workload per person
  const workload = team().map((m) => {
    const own = openTasks.filter((t) => t.assignee === m.id);
    return { m, open: own.length, late: own.filter(isOverdue).length };
  });
  const unassigned = openTasks.filter((t) => !t.assignee || !member(t.assignee)).length;
  const workMax = Math.max(1, unassigned, ...workload.map((w) => w.open));

  // Tasks completed per day, last 14 days
  const days = Array.from({ length: 14 }, (_, i) => addDays(t0, i - 13));
  const doneByDay = days.map((d) => data.tasks.filter((t) => t.doneAt && t.doneAt.slice(0, 10) === d).length);
  const doneMax = Math.max(1, ...doneByDay);
  const doneTotal = doneByDay.reduce((a, b) => a + b, 0);

  const recent = [...data.activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  const w = website;
  const sectionCounts = [["Journal", "blog", w.blog], ["Portfolio", "portfolio", w.projects], ["Updates", "updates", w.updates]]
    .map(([label, route, c]) => `<a class="site-stat" href="#/${route}"><b>${c ? c.published : "–"}</b><span>${label}</span>${c && c.drafts ? `<em>${c.drafts} draft${c.drafts === 1 ? "" : "s"}</em>` : ""}</a>`)
    .join("");

  const root = mount(view, `
    <div class="dash-head">
      <div><h1>${greeting()}${esc(name)}</h1><p>${isEmpty ? "Let's get the studio set up." : `${overdue.length ? `${overdue.length} task${overdue.length === 1 ? " is" : "s are"} overdue` : "Nothing overdue"} · ${projects.length} active project${projects.length === 1 ? "" : "s"} · ${data.logs.filter((l) => l.status === "planned" && l.date === t0).length ? "site visit today" : "no site visits today"}`}</p></div>
      <div class="quick-actions">
        <button class="btn primary" data-do="task">${icon("plus", 16)} Task</button>
        <button class="btn" data-do="project">${icon("folder", 16)} Project</button>
        <button class="btn" data-do="client">${icon("users", 16)} Client</button>
        <button class="btn" data-do="visit">${icon("site", 16)} Site visit</button>
      </div>
    </div>

    ${isEmpty ? `<section class="panel getting-started"><h2 class="panel-title">Get started</h2>
      <p class="muted">Everything here is private to the studio. Start with the basics, or load sample data to explore (you can remove it later).</p>
      <ol class="steps"><li><a href="#/settings">Add your team</a> so tasks and site visits can be assigned.</li><li><a href="#/clients">Add a client</a> and send them their private brief link.</li><li><a href="#/projects">Create a project</a> from the brief and plan its tasks and milestones.</li><li>Log <a href="#/sites">site visits and snags</a> as work progresses.</li></ol>
      <div class="panel-actions"><button class="btn primary" data-seed>${icon("sparkle", 15)} Load sample data</button></div></section>` : ""}

    <div class="kpis">
      <a class="kpi" href="#/projects"><span class="k">Active projects</span><b>${projects.length}</b><span class="muted small">${atRisk.length ? `<i class="tone bad"></i>${atRisk.length} at risk or delayed` : "all on track"}</span></a>
      <a class="kpi ${overdue.length ? "warn" : ""}" href="#/tasks"><span class="k">Open tasks</span><b>${openTasks.length}</b><span class="muted small">${overdue.length ? `<i class="tone bad"></i>${overdue.length} overdue` : "none overdue"}</span></a>
      <a class="kpi" href="#/clients"><span class="k">In onboarding</span><b>${pipeline.length}</b><span class="muted small">${newBriefs.length ? `<i class="tone ok"></i>${newBriefs.length} new brief${newBriefs.length === 1 ? "" : "s"}` : "client pipeline"}</span></a>
      <a class="kpi ${needVisit.length ? "warn" : ""}" href="#/sites"><span class="k">Open snags</span><b>${snags.length}</b><span class="muted small">${needVisit.length ? `<i class="tone warn"></i>${needVisit.length} site${needVisit.length === 1 ? " needs" : "s need"} a visit` : `${liveSites.length} live site${liveSites.length === 1 ? "" : "s"}`}</span></a>
      <a class="kpi ${dueLeads ? "warn" : ""}" href="#/crm"><span class="k">Open leads</span><b>${data.leads.filter((l) => ["new", "contacted", "pitched", "negotiating"].includes(l.stage)).length}</b><span class="muted small">${dueLeads ? `${dueLeads} follow-up${dueLeads === 1 ? "" : "s"} due` : "no follow-ups due"}</span></a>
      <a class="kpi ${unpaid.some((d) => d.dueDate && d.dueDate < today()) ? "warn" : ""}" href="#/billing"><span class="k">Unpaid invoices</span><b>${inrShort(unpaid.reduce((n, d) => n + d.totalPaise, 0))}</b><span class="muted small">${unpaid.length} outstanding</span></a>
      <a class="kpi ${data.leaves.some((l) => l.status === "pending") ? "warn" : ""}" href="#/people"><span class="k">Leave to approve</span><b>${data.leaves.filter((l) => l.status === "pending").length}</b><span class="muted small">${data.leaves.filter((l) => l.status === "approved" && l.start <= today() && l.end >= today()).length} away today</span></a>
      <a class="kpi ${lateIncidents ? "warn" : ""}" href="#/incidents"><span class="k">Open incidents</span><b>${data.incidents.filter((i) => i.status !== "resolved").length}</b><span class="muted small">${lateIncidents ? `${lateIncidents} past target` : "within target"}</span></a>
    </div>

    <div class="grid-main">
      <section class="panel"><div class="panel-row"><h2 class="panel-title">${mine ? "My focus today" : "Today & overdue"}</h2>
        ${meId() ? `<div class="seg small"><button type="button" data-focus="mine" class="${mine ? "on" : ""}">Mine</button><button type="button" data-focus="all" class="${mine ? "" : "on"}">Everyone</button></div>` : ""}</div>
        ${focusTasks.length ? `<div class="mini-list">${focusTasks.slice(0, 8).map((t) => {
          const due = relDue(t.due);
          const p = projectById(t.projectId);
          const a = member(t.assignee);
          return `<div class="mini"><button type="button" class="check" data-done="${t.id}" aria-label="Mark done">${icon("check", 13)}</button><span class="grow-text" data-open-task="${t.id}">${esc(t.title)}${p ? `<em class="muted"> · ${esc(p.name)}</em>` : ""}</span><span class="chip ${due.tone}">${esc(due.text)}</span>${a && !mine ? avatar(a.name, 22) : ""}</div>`;
        }).join("")}</div>${focusTasks.length > 8 ? `<a class="link-more" href="#/tasks">${focusTasks.length - 8} more ${icon("chevronRight", 14)}</a>` : ""}`
        : `<div class="all-clear">${icon("check", 22)}<b>All clear</b><span class="muted">Nothing due today or overdue${mine ? " for you" : ""}.</span></div>`}
      </section>
      <section class="panel"><h2 class="panel-title">Coming up <span class="muted small">next 14 days</span></h2>
        ${upcoming.length ? `<div class="mini-list">${upcoming.map((u) => `<div class="mini" ${u.kind === "task" ? `data-open-task="${u.id}"` : u.kind === "visit" ? `data-open-log="${u.id}"` : ""}><span class="up-ic ${u.kind}">${icon(upIcon[u.kind], 14)}</span><span class="grow-text">${esc(u.title)}${u.project ? `<em class="muted"> · ${esc(u.project.name)}</em>` : ""}</span><span class="chip ${relDue(u.date).tone}">${esc(fmtDate(u.date))}</span></div>`).join("")}</div>` : '<p class="muted">Nothing scheduled. Add milestones to projects and plan site visits.</p>'}
      </section>
    </div>

    <section class="panel flush"><div class="panel-row pad"><h2 class="panel-title">Project health</h2><a class="link-more inline" href="#/projects">All projects ${icon("chevronRight", 14)}</a></div>
      ${healthRows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Stage</th><th>Health</th><th>Progress</th><th>Due</th><th>Open tasks</th></tr></thead><tbody>${healthRows.map((p) => {
        const ratio = progressOf(p);
        const due = relDue(p.due);
        const open = openTasks.filter((t) => t.projectId === p.id);
        return `<tr data-go="#/projects/${p.id}"><td><b>${esc(p.name)}</b><span class="muted small block">${esc((clientById(p.clientId) || {}).name || p.location || "")}</span></td><td>${esc((PROJECT_STAGES.find((s) => s.id === p.stage) || {}).label || "")}</td><td>${pill(healthMeta(p.health).label, healthMeta(p.health).tone)}</td><td class="w-progress">${progressBar(ratio, healthMeta(p.health).tone)}<span class="muted small">${ratio == null ? "–" : `${Math.round(ratio * 100)}%`}</span></td><td>${p.due ? `<span class="${due.tone}">${esc(fmtDate(p.due))}</span>` : '<span class="muted">–</span>'}</td><td>${open.length}${open.some(isOverdue) ? ` <span class="pill bad">late</span>` : ""}</td></tr>`;
      }).join("")}</tbody></table></div>` : emptyState({ iconName: "folder", title: "No active projects", text: "Create a project to see its health here.", action: '<button class="btn primary" data-do="project">New project</button>' })}
    </section>

    <div class="grid-3">
      <section class="panel"><div class="panel-row"><h2 class="panel-title">Client onboarding</h2><a class="link-more inline" href="#/clients">Open ${icon("chevronRight", 14)}</a></div>
        <div class="hbars">${funnel.map((s) => `<div class="hbar"><span>${s.label}</span><span class="track"><i style="width:${Math.round((s.n / funnelMax) * 100)}%"></i></span><b>${s.n}</b></div>`).join("")}</div>
        ${newBriefs.length ? `<div class="banner ok">${icon("sparkle", 16)} New brief from <a href="#/clients/${newBriefs[0].id}">${esc(newBriefs[0].name)}</a>${newBriefs.length > 1 ? ` and ${newBriefs.length - 1} more` : ""}</div>` : ""}
      </section>
      <section class="panel"><div class="panel-row"><h2 class="panel-title">Projects by stage</h2></div>
        <div class="hbars">${stageCounts.map((s) => `<div class="hbar"><span>${s.label}</span><span class="track"><i style="width:${Math.round((s.n / stageMax) * 100)}%"></i></span><b>${s.n}</b></div>`).join("")}</div>
      </section>
      <section class="panel"><div class="panel-row"><h2 class="panel-title">Team workload</h2><span class="muted small">open tasks</span></div>
        ${team().length || unassigned ? `<div class="hbars">${workload.map(({ m, open, late }) => `<div class="hbar"><span class="who">${avatar(m.name, 20)}${esc(m.name.split(" ")[0])}</span><span class="track"><i class="${late ? "late" : ""}" style="width:${Math.round((open / workMax) * 100)}%"></i></span><b>${open}</b></div>`).join("")}${unassigned ? `<div class="hbar"><span class="who muted">Unassigned</span><span class="track"><i class="mute" style="width:${Math.round((unassigned / workMax) * 100)}%"></i></span><b>${unassigned}</b></div>` : ""}</div>` : '<p class="muted">Add team members in <a href="#/settings">Settings</a> to assign work.</p>'}
      </section>
    </div>

    <div class="grid-main">
      <section class="panel"><div class="panel-row"><h2 class="panel-title">Completed tasks <span class="muted small">last 14 days</span></h2><b class="big">${doneTotal}</b></div>
        <div class="spark" role="img" aria-label="Tasks completed per day">${doneByDay.map((n, i) => `<span title="${esc(fmtDate(days[i]))}: ${n}"><i style="height:${n ? Math.max(8, Math.round((n / doneMax) * 100)) : 3}%" class="${n ? "" : "zero"} ${days[i] === t0 ? "today" : ""}"></i></span>`).join("")}</div>
        <div class="spark-axis"><span>${esc(fmtDate(days[0]))}</span><span>Today</span></div>
      </section>
      <section class="panel"><div class="panel-row"><h2 class="panel-title">Website</h2><a class="link-more inline" href="#/website">Controls ${icon("chevronRight", 14)}</a></div>
        <div class="site-stats">${sectionCounts}</div>
        <p class="muted small">${w.pending ? `${w.pending} unpublished change${w.pending === 1 ? "" : "s"} in the website editor.` : w.available === false ? "Connect GitHub to publish website content." : "Website content is up to date."}</p>
        <div class="panel-actions"><a class="btn small" href="/" target="_blank" rel="noopener">${icon("external", 14)} View site</a><a class="btn small" href="#/website">${icon("pulse", 14)} Check health</a></div>
      </section>
    </div>

    <section class="panel"><div class="panel-row"><h2 class="panel-title">Recent activity</h2></div>${activityList(recent, { withProject: true })}</section>
    ${!isEmpty && hasDemoData() ? `<p class="demo-note muted">You're looking at sample data. <button class="link" data-clear-demo>Remove sample data</button></p>` : ""}
  `);

  root.addEventListener("click", async (e) => {
    const t = e.target;
    const doit = t.closest("[data-do]");
    if (doit) {
      const what = doit.dataset.do;
      if (what === "task") return openTask(null, { assignee: meId() });
      if (what === "project") return openProject(null);
      if (what === "client") return openClient(null);
      if (what === "visit") return openLog(null);
    }
    const focus = t.closest("[data-focus]");
    if (focus) {
      ui.focus = focus.dataset.focus;
      return app.render();
    }
    const done = t.closest("[data-done]");
    if (done) {
      setTaskStatus(data.tasks.find((x) => x.id === done.dataset.done), "done");
      return app.render();
    }
    const ot = t.closest("[data-open-task]");
    if (ot) return openTask(ot.dataset.openTask);
    const ol = t.closest("[data-open-log]");
    if (ol) return openLog(ol.dataset.openLog);
    const go = t.closest("[data-go]");
    if (go) location.hash = go.dataset.go;
    if (t.closest("[data-seed]")) {
      seedDemo();
      return app.render();
    }
    if (t.closest("[data-clear-demo]")) {
      clearDemo();
      return app.render();
    }
  });
};
