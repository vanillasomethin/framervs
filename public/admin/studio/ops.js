// Operations: an incident and escalation log with response targets, adapted
// from the ALIVE console's incident desk. Use it for site problems, client
// escalations, vendor delays, defects and IT issues. Each severity has an
// acknowledge-by and resolve-by time; the page flags what is late.

import { $, $$, uid, app } from "../core.js";
import { data, put, del, note, today, meId, meName, member, projectById } from "./data.js";
import { icon, esc, pill, timeAgo, optionsHTML, openDrawer, emptyState, mount } from "./ui.js";

const HOUR = 3600000;
export const SEVERITY = [
  { id: "P0", label: "P0 · Critical", tone: "bad", ack: 1, resolve: 8, hint: "Work stopped, safety risk or a major client escalation" },
  { id: "P1", label: "P1 · High", tone: "bad", ack: 4, resolve: 24, hint: "Serious delay or defect on a live project" },
  { id: "P2", label: "P2 · Medium", tone: "warn", ack: 24, resolve: 72, hint: "Needs fixing this week" },
  { id: "P3", label: "P3 · Low", tone: "mute", ack: 48, resolve: 168, hint: "Minor, can wait" },
];
const CATEGORIES = ["Site issue", "Quality / defect", "Client escalation", "Vendor / contractor delay", "Approvals / authority", "Safety", "IT / systems", "Other"];
const STATUS = [{ id: "open", label: "Open", tone: "warn" }, { id: "ack", label: "Acknowledged", tone: "info" }, { id: "resolved", label: "Resolved", tone: "ok" }];
const sev = (id) => SEVERITY.find((s) => s.id === id) || SEVERITY[2];
const ui = { show: "active", q: "" };

const dueTimes = (i) => {
  const t = Date.parse(i.loggedAt);
  return { ackDue: t + sev(i.severity).ack * HOUR, resolveDue: t + sev(i.severity).resolve * HOUR };
};
export const breach = (i, now = Date.now()) => {
  if (i.status === "resolved") return "";
  const { ackDue, resolveDue } = dueTimes(i);
  if (now > resolveDue) return "resolve";
  if (i.status === "open" && now > ackDue) return "ack";
  return "";
};
const left = (ms) => {
  const a = Math.abs(ms) / HOUR;
  return a >= 48 ? `${Math.round(a / 24)}d` : a >= 1 ? `${Math.round(a)}h` : `${Math.max(1, Math.round(a * 60))}m`;
};

export const openIncident = (id, defaults = {}) => {
  const existing = id ? data.incidents.find((i) => i.id === id) : null;
  openDrawer({
    title: existing ? `Incident ${existing.number || ""}` : "Log an incident",
    subtitle: existing ? `${esc(sev(existing.severity).label)} · logged ${timeAgo(existing.loggedAt)}` : "Pick the severity honestly: it sets the response targets.",
    spec: [
      { key: "symptom", label: "What happened", type: "text", required: true, placeholder: "e.g. Contractor stopped work, slab shuttering rejected" },
      { key: "severity", label: "Severity", type: "select", options: SEVERITY.map((s) => ({ id: s.id, label: `${s.label}: ${s.hint}` })) },
      { key: "category", label: "Category", type: "select", options: CATEGORIES, half: true },
      { key: "projectId", label: "Project", type: "select", options: data.projects.map((p) => ({ id: p.id, label: p.name })), blank: "Not project specific", half: true },
      { key: "owner", label: "Owner", type: "team", half: true },
      { key: "status", label: "Status", type: "select", options: STATUS, half: true },
      { key: "raisedBy", label: "Raised by (client / vendor / team)", type: "text" },
      { key: "resolution", label: "Resolution", type: "textarea", rows: 3, hint: "what fixed it" },
      { key: "rca", label: "Root cause and prevention", type: "textarea", rows: 3, hint: "expected for P0 and P1" },
    ],
    values: existing || { severity: "P2", status: "open", category: CATEGORIES[0], owner: meId(), ...defaults },
    saveLabel: existing ? "Save changes" : "Log incident",
    onSave: (out) => {
      const now = new Date().toISOString();
      const inc = { ...(existing || { id: uid("in_"), loggedAt: now, number: (Math.max(0, ...data.incidents.map((i) => i.number || 0)) || 0) + 1, loggedBy: meName() }), ...out };
      if (inc.status === "ack" && !inc.ackAt) inc.ackAt = now;
      if (inc.status === "resolved" && !inc.resolvedAt) inc.resolvedAt = now;
      if (inc.status !== "resolved") inc.resolvedAt = "";
      if (["P0", "P1"].includes(inc.severity) && inc.status === "resolved" && !String(inc.rca || "").trim()) {
        if (!window.confirm("P0/P1 incidents should have a root cause. Save without one?")) return false;
      }
      put("incidents", inc);
      if (!existing) note(`logged incident #${inc.number}: ${inc.symptom}`, { type: "incident", id: inc.id, projectId: inc.projectId });
      app.render();
    },
    onDelete: existing ? () => { del("incidents", existing.id); app.render(); } : null,
    deleteLabel: "Delete incident",
  });
};

export const renderOps = (view) => {
  const active = data.incidents.filter((i) => i.status !== "resolved");
  const late = active.filter((i) => breach(i));
  const resolvedMonth = data.incidents.filter((i) => i.status === "resolved" && (i.resolvedAt || "").slice(0, 7) === today().slice(0, 7));
  const avg = resolvedMonth.length ? resolvedMonth.reduce((n, i) => n + (Date.parse(i.resolvedAt) - Date.parse(i.loggedAt)), 0) / resolvedMonth.length : 0;
  const root = mount(view, `
    <div class="page-head"><div><h1>Incidents</h1><p>Problems that need a response: site issues, escalations, delays and defects. Each severity has acknowledge and resolve targets.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} Log incident</button></div></div>
    <div class="kpis money">
      <div class="kpi"><span class="k">Open</span><b>${active.length}</b><span class="small muted">${active.filter((i) => ["P0", "P1"].includes(i.severity)).length} high severity</span></div>
      <div class="kpi ${late.length ? "warn" : ""}"><span class="k">Past target</span><b>${late.length}</b><span class="small muted">${late.length ? "needs attention now" : "all within target"}</span></div>
      <div class="kpi"><span class="k">Resolved this month</span><b>${resolvedMonth.length}</b><span class="small muted">${avg ? `avg ${left(avg)} to resolve` : "none yet"}</span></div>
    </div>
    <div class="toolbar"><div class="seg">${[["active", "Active"], ["resolved", "Resolved"], ["all", "All"]].map(([id, l]) => `<button type="button" data-show="${id}" class="${ui.show === id ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search incidents" value="${esc(ui.q)}"></label></div>
    <div data-body></div>
    <section class="panel" style="margin-top:18px"><h2 class="panel-title">Response targets</h2><div class="sla">${SEVERITY.map((s) => `<div>${pill(s.label, s.tone)}<p class="muted small">Acknowledge within ${s.ack}h · resolve within ${s.resolve >= 48 ? `${s.resolve / 24} days` : `${s.resolve}h`}</p></div>`).join("")}</div></section>`);
  const body = $("[data-body]", root);
  const draw = () => {
    const q = ui.q.trim().toLowerCase();
    const list = data.incidents.filter((i) => (ui.show === "all" || (ui.show === "resolved") === (i.status === "resolved")) && (!q || `${i.symptom} ${i.category || ""} ${i.raisedBy || ""}`.toLowerCase().includes(q)))
      .sort((a, b) => (a.severity === b.severity ? b.loggedAt.localeCompare(a.loggedAt) : a.severity.localeCompare(b.severity)));
    body.innerHTML = list.length ? `<table class="table"><thead><tr><th>#</th><th>Incident</th><th>Severity</th><th>Project</th><th>Owner</th><th>Clock</th><th>Status</th></tr></thead><tbody>${list.map((i) => {
      const b = breach(i), d = dueTimes(i), st = STATUS.find((s) => s.id === i.status) || STATUS[0];
      const clock = i.status === "resolved" ? `resolved in ${left(Date.parse(i.resolvedAt) - Date.parse(i.loggedAt))}` : b ? `<span class="late">${b === "ack" ? "acknowledge" : "resolve"} ${left(Date.now() - (b === "ack" ? d.ackDue : d.resolveDue))} overdue</span>` : i.status === "open" ? `ack in ${left(d.ackDue - Date.now())}` : `resolve in ${left(d.resolveDue - Date.now())}`;
      return `<tr class="clickable" data-inc="${i.id}"><td>${i.number}</td><td><b>${esc(i.symptom)}</b><div class="muted small">${esc(i.category || "")}</div></td><td>${pill(i.severity, sev(i.severity).tone)}</td><td>${esc((projectById(i.projectId) || {}).name || "–")}</td><td>${esc((member(i.owner) || {}).name || "Unassigned")}</td><td class="small">${clock}</td><td>${pill(st.label, st.tone)}</td></tr>`;
    }).join("")}</tbody></table>` : emptyState({ iconName: "shield", title: ui.show === "resolved" ? "Nothing resolved yet" : "No active incidents", text: "Log anything that needs a response so it is owned, timed and closed out." });
  };
  draw();
  root.addEventListener("input", (e) => { if (e.target.matches("[data-q]")) { ui.q = e.target.value; draw(); } });
  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) return openIncident(null);
    const s = t.closest("[data-show]");
    if (s) { ui.show = s.dataset.show; $$("[data-show]", root).forEach((b) => b.classList.toggle("on", b === s)); return draw(); }
    const r = t.closest("[data-inc]"); if (r) openIncident(r.dataset.inc);
  });
};
