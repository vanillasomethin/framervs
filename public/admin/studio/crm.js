// CRM: leads from first contact to won or lost, with a call/meeting/note log and
// next-action reminders. Ported from the ALIVE console CRM. A won lead becomes a
// client in the onboarding pipeline in one click.

import { $, $$, uid, app, toast } from "../core.js";
import { data, put, del, note, today, addDays, member, team, meName, meId, CLIENT_SOURCES, PROJECT_TYPES } from "./data.js";
import { icon, esc, avatar, pill, fmtDate, timeAgo, optionsHTML, openDrawer, openMenu, emptyState, mount } from "./ui.js";
import { inr } from "./finance.js";

export const LEAD_STAGES = [
  { id: "new", label: "New", tone: "mute" },
  { id: "contacted", label: "Contacted", tone: "info" },
  { id: "pitched", label: "Pitched", tone: "info" },
  { id: "negotiating", label: "Negotiating", tone: "warn" },
  { id: "won", label: "Won", tone: "ok" },
  { id: "lost", label: "Lost", tone: "bad" },
  { id: "later", label: "Revisit later", tone: "mute" },
];
const OPEN = ["new", "contacted", "pitched", "negotiating"];
const KINDS = ["Client (home owner)", "Builder / developer", "Contractor", "Vendor / supplier", "Partner / consultant", "Other"];
const ACTIVITY = [
  { id: "call", label: "Call" },
  { id: "meeting", label: "Meeting" },
  { id: "email", label: "Email / message" },
  { id: "site", label: "Site visit" },
  { id: "discovery_call", label: "Complimentary discovery call" },
  { id: "proposal", label: "Proposal / scope" },
  { id: "decision", label: "Client decision" },
  { id: "note", label: "Note" },
];
const LOST_REASONS = ["Budget", "Went with someone else", "Timing", "Not a fit", "No response", "Other"];

const ui = { view: "board", q: "", owner: "" };
const stageOf = (id) => LEAD_STAGES.find((s) => s.id === id) || LEAD_STAGES[0];
const isOpen = (l) => OPEN.includes(l.stage);
const due = (l) => isOpen(l) && l.nextActionAt && l.nextActionAt <= today();
const rupees = (v) => Math.round((Number(v) || 0) * 100);

const setStage = (lead, stage, extra = {}) => {
  if (lead.stage === stage) return;
  const next = { ...lead, stage, stageAt: new Date().toISOString(), ...extra };
  if (stage === "won") next.closedAt = today();
  put("leads", next);
  note(`moved lead ${lead.company} to ${stageOf(stage).label}`, { type: "lead", id: lead.id });
};

export const leadToClient = (lead) => {
  if (lead.clientId && data.clients.some((c) => c.id === lead.clientId)) {
    location.hash = `#/clients/${lead.clientId}`;
    return;
  }
  const client = {
    id: uid("cl_"), name: lead.contactName || lead.company, company: lead.contactName ? lead.company : "", email: lead.email || "", phone: lead.phone || "",
    location: lead.city || "", source: CLIENT_SOURCES.includes(lead.source) ? lead.source : "", projectType: lead.projectType || "", owner: lead.owner || "",
    stage: "enquiry", stageAt: new Date().toISOString(), checks: {}, notes: lead.notes || "", qualification: { projectStage: lead.projectStage || "", propertyStatus: lead.propertyStatus || "", budgetRange: lead.budgetRange || "", timeline: lead.timeline || "", decisionMakers: lead.decisionMakers || "", clientConcerns: lead.clientConcerns || "", discoveryCallStatus: lead.discoveryCallStatus || "", discoveryCallAt: lead.discoveryCallAt || "", discoveryCallOutcome: lead.discoveryCallOutcome || "" },
  };
  put("clients", client);
  put("leads", { ...lead, clientId: client.id, stage: "won", closedAt: lead.closedAt || today() });
  note(`created client ${client.name} from lead ${lead.company}`, { type: "client", id: client.id });
  toast("Client created in Onboarding.");
  location.hash = `#/clients/${client.id}`;
};

// ---------------------------------------------------------------------------

export const openLead = (id, defaults = {}) => {
  const existing = id ? data.leads.find((l) => l.id === id) : null;
  let activities = (existing?.activities || []).map((a) => ({ ...a }));
  const values = existing ? { ...existing, valueRupees: existing.valuePaise ? existing.valuePaise / 100 : "" } : { stage: "new", kind: KINDS[0], owner: meId(), ...defaults };
  openDrawer({
    title: existing ? existing.company : "New lead",
    subtitle: existing ? `${esc(stageOf(existing.stage).label)}${existing.lastContactAt ? ` · last contact ${timeAgo(existing.lastContactAt)}` : ""}` : "",
    spec: [
      { key: "company", label: "Company / name", type: "text", required: true, placeholder: "e.g. Coastal Builders" },
      { key: "contactName", label: "Contact person", type: "text", half: true },
      { key: "designation", label: "Role", type: "text", half: true },
      { key: "phone", label: "Phone", type: "text", half: true },
      { key: "email", label: "Email", type: "text", half: true },
      { key: "city", label: "City", type: "text", half: true },
      { key: "kind", label: "Type", type: "select", options: KINDS, half: true },
      { key: "projectType", label: "Looking for", type: "text", list: PROJECT_TYPES, half: true },
      { key: "projectStage", label: "Project stage", type: "select", options: ["Exploring ideas", "Own a plot / property", "Planning / design started", "Approvals", "Construction underway", "Renovation / interiors"], blank: "Not yet known", half: true },
      { key: "propertyStatus", label: "Property status", type: "select", options: ["Owned", "Under purchase / agreement", "Identified, not secured", "Still searching", "Not applicable"], blank: "Not yet known", half: true },
      { key: "budgetRange", label: "Client-stated budget range", type: "select", options: ["Below ₹25 lakh", "₹25–50 lakh", "₹50 lakh–₹1 crore", "₹1–2 crore", "Above ₹2 crore", "Not decided", "Prefer not to say"], blank: "Not discussed", half: true },
      { key: "timeline", label: "Target timeline", type: "select", options: ["Within 3 months", "3–6 months", "6–12 months", "12+ months", "Flexible / exploring"], blank: "Not discussed", half: true },
      { key: "decisionMakers", label: "Decision makers / participants", type: "text", half: true, placeholder: "e.g. Couple, family, business partners" },
      { key: "clientConcerns", label: "Main questions or concerns", type: "textarea", rows: 2, placeholder: "What feels unclear or risky to the client?" },
      { key: "discoveryCallStatus", label: "Complimentary discovery call", type: "select", options: [{ id: "not_booked", label: "Not booked" }, { id: "booked", label: "Booked" }, { id: "held", label: "Held" }, { id: "reschedule", label: "Needs rescheduling" }, { id: "declined", label: "Not proceeding" }], blank: "Not recorded", half: true },
      { key: "discoveryCallAt", label: "Discovery call date", type: "date", half: true },
      { key: "discoveryCallOutcome", label: "Call outcome / agreed next step", type: "textarea", rows: 2, placeholder: "Fit, open questions and next action. No technical deliverables implied." },
      { key: "valueRupees", label: "Estimated studio fee (internal)", type: "number", half: true },
      { key: "source", label: "Source", type: "text", list: CLIENT_SOURCES, half: true },
      { key: "owner", label: "Owner", type: "team", half: true },
      { key: "stage", label: "Stage", type: "select", options: LEAD_STAGES, half: true },
      { key: "nextActionAt", label: "Next action on", type: "date", half: true },
      { key: "nextAction", label: "Next action", type: "text", half: true, placeholder: "e.g. Send proposal" },
      { key: "lostReason", label: "If lost, why", type: "select", options: LOST_REASONS, blank: "–", half: true },
      { key: "notes", label: "Notes", type: "textarea", rows: 3 },
    ],
    values,
    after: `<section class="crm-log"><h3>Activity</h3>
      <div class="crm-add"><select data-act-type>${optionsHTML(ACTIVITY, "call")}</select><input type="text" data-act-note placeholder="What was discussed?"><input type="date" data-act-due title="Follow-up date (optional)"><button type="button" class="btn small" data-act-add>Log</button></div>
      <div data-acts></div></section>`,
    bind: (root) => {
      const list = $("[data-acts]", root);
      const draw = () => {
        list.innerHTML = activities.length
          ? activities.slice().sort((a, b) => b.at.localeCompare(a.at)).map((a) => `<div class="crm-act"><span class="pill mute">${esc((ACTIVITY.find((t) => t.id === a.type) || {}).label || a.type)}</span><div><div>${esc(a.notes || "")}</div><div class="muted small">${esc(a.by || "")} · ${timeAgo(a.at)}${a.dueAt ? ` · follow up ${fmtDate(a.dueAt)}` : ""}</div></div></div>`).join("")
          : '<p class="muted small">Nothing logged yet.</p>';
      };
      draw();
      $("[data-act-add]", root).addEventListener("click", () => {
        const text = $("[data-act-note]", root).value.trim();
        if (!text) return toast("Write a short note first.", { error: true });
        activities.push({ id: uid("ac_"), type: $("[data-act-type]", root).value, notes: text.slice(0, 400), at: new Date().toISOString(), by: meName(), dueAt: $("[data-act-due]", root).value || "" });
        activities = activities.slice(-40);
        $("[data-act-note]", root).value = "";
        const dueEl = $("[data-act-due]", root);
        if (dueEl.value) { const na = $('[data-key="nextActionAt"]', root); if (na) na.value = dueEl.value; dueEl.value = ""; }
        draw();
      });
    },
    saveLabel: existing ? "Save changes" : "Add lead",
    onSave: (out) => {
      const { valueRupees, ...rest } = out;
      const lead = { ...(existing || { id: uid("ld_") }), ...rest, valuePaise: rupees(valueRupees), activities };
      if (activities.length && (!existing || activities.length !== (existing.activities || []).length)) lead.lastContactAt = new Date().toISOString();
      if (!existing || existing.stage !== lead.stage) lead.stageAt = new Date().toISOString();
      if (lead.stage === "won" && !lead.closedAt) lead.closedAt = today();
      put("leads", lead);
      if (!existing) note(`added lead ${lead.company}`, { type: "lead", id: lead.id });
      app.render();
    },
    onDelete: existing ? () => { del("leads", existing.id); app.render(); } : null,
    deleteLabel: "Delete lead",
  });
};

// ---------------------------------------------------------------------------

const cardHTML = (l) => {
  const o = member(l.owner);
  return `<article class="card lead ${due(l) ? "due" : ""}" draggable="true" data-lead="${l.id}">
    <div class="lead-top"><b>${esc(l.company)}</b>${l.valuePaise ? `<span class="muted small">${inr(l.valuePaise)}</span>` : ""}</div>
    ${l.contactName ? `<div class="muted small">${esc(l.contactName)}${l.city ? ` · ${esc(l.city)}` : ""}</div>` : ""}
    ${l.nextActionAt ? `<div class="small ${due(l) ? "late" : "muted"}">${icon("clock", 12)} ${fmtDate(l.nextActionAt)}${l.nextAction ? ` · ${esc(l.nextAction)}` : ""}</div>` : ""}
    <div class="lead-foot">${o ? avatar(o.name, 22) : ""}<button class="icon-btn" data-lead-menu="${l.id}" aria-label="More">${icon("more", 15)}</button></div></article>`;
};

// Ratings visitors give the cost estimator (written by estimator-review.js). Read-only here.
const stars = (n) => `<span class="stars" aria-label="${n} of 5 stars" style="color:#b8860b;letter-spacing:1px">${"★".repeat(n)}<span style="opacity:.25">${"★".repeat(5 - n)}</span></span>`;
const reviewsHTML = () => {
  const list = [...data.reviews].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  if (!list.length) return emptyState({ iconName: "sparkle", title: "No estimator reviews yet", text: "Visitors can rate the estimator under their result. Every rater is then invited to review the studio on Google." });
  const avg = list.reduce((n, r) => n + r.rating, 0) / list.length;
  const happy = list.filter((r) => r.rating >= 4).length;
  const counts = [5, 4, 3, 2, 1].map((n) => [n, list.filter((r) => r.rating === n).length]);
  return `<div class="kpis"><div class="kpi"><span class="k">Average rating</span><b>${avg.toFixed(1)} / 5</b><span class="small muted">${list.length} ratings</span></div>
    <div class="kpi"><span class="k">Rated 4 or 5 stars</span><b>${happy}</b><span class="small muted">${Math.round((happy / list.length) * 100)}% of ratings</span></div>
    <div class="kpi"><span class="k">Spread</span><b style="font-size:14px;font-weight:500">${counts.map(([n, c]) => `${n}★ ${c}`).join(" · ")}</b></div></div>
    <table class="table"><thead><tr><th>When</th><th>Rating</th><th>Comment</th><th>Estimate</th></tr></thead><tbody>${list.map((r) => {
      const e = r.estimate || {};
      const est = [e.projectType, e.area ? `${e.area} ${e.areaUnit || ""}`.trim() : "", e.city, e.totalCost ? inr(Math.round(e.totalCost) * 100) : ""].filter(Boolean).join(" · ");
      return `<tr><td class="nowrap">${fmtDate((r.createdAt || "").slice(0, 10))}</td><td>${stars(r.rating)}</td><td>${esc(r.comment || "")}${r.name ? `<div class="muted small">${esc(r.name)}</div>` : ""}</td><td class="muted small">${esc(est)}</td></tr>`;
    }).join("")}</tbody></table>`;
};

export const renderCrm = (view) => {
  const visible = () => {
    const q = ui.q.trim().toLowerCase();
    return data.leads.filter((l) => (!ui.owner || l.owner === ui.owner) && (!q || `${l.company} ${l.contactName || ""} ${l.city || ""} ${l.email || ""} ${l.phone || ""}`.toLowerCase().includes(q)));
  };
  const open = data.leads.filter(isOpen);
  const dueNow = open.filter(due);
  const fy = today().slice(0, 4);
  const wonYear = data.leads.filter((l) => l.stage === "won" && (l.closedAt || "").startsWith(fy));
  const callsBooked = data.leads.filter((l) => l.discoveryCallStatus === "booked").length;
  const callsHeld = data.leads.filter((l) => l.discoveryCallStatus === "held").length;
  const heldLeads = data.leads.filter((l) => l.discoveryCallStatus === "held");
  const appointedAfterCall = heldLeads.filter((l) => l.stage === "won").length;
  const callToAppointment = heldLeads.length ? `${Math.round((appointedAfterCall / heldLeads.length) * 100)}%` : "–";
  const root = mount(view, `
    <div class="page-head"><div><h1>CRM</h1><p>Leads from first contact to won. Log every call and meeting, set the next action, and turn a won lead into a client.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} New lead</button></div></div>
    <div class="kpis money">
      <div class="kpi"><span class="k">Open leads</span><b>${open.length}</b><span class="small muted">${data.leads.filter((l) => l.stage === "later").length} to revisit later</span></div>
      <div class="kpi"><span class="k">Pipeline value</span><b>${inr(open.reduce((n, l) => n + (l.valuePaise || 0), 0))}</b><span class="small muted">estimated fees, open leads</span></div>
      <div class="kpi ${dueNow.length ? "warn" : ""}"><span class="k">Actions due</span><b>${dueNow.length}</b><span class="small muted">today or overdue</span></div>
      <div class="kpi"><span class="k">Won this year</span><b>${wonYear.length}</b><span class="small muted">${inr(wonYear.reduce((n, l) => n + (l.valuePaise || 0), 0))}</span></div>
      <div class="kpi"><span class="k">Discovery calls booked</span><b>${callsBooked}</b><span class="small muted">Complimentary · no fee</span></div>
      <div class="kpi"><span class="k">Discovery calls held</span><b>${callsHeld}</b><span class="small muted">Recorded in lead qualification</span></div>
      <div class="kpi"><span class="k">Held call → appointment</span><b>${callToAppointment}</b><span class="small muted">${appointedAfterCall} of ${heldLeads.length} held calls</span></div>
    </div>
    <div class="toolbar"><div class="seg">${[["board", "Board"], ["today", "Follow-ups"], ["table", "All leads"], ["reviews", `Estimator reviews${data.reviews.length ? ` (${data.reviews.length})` : ""}`]].map(([id, l]) => `<button type="button" data-view="${id}" class="${ui.view === id ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search leads" value="${esc(ui.q)}"></label>
      <select data-owner aria-label="Owner">${optionsHTML(team().map((m) => ({ id: m.id, label: m.name })), ui.owner, { blank: "Anyone" })}</select></div>
    <div data-body></div>`);
  const body = $("[data-body]", root);

  const draw = () => {
    const list = visible();
    if (ui.view === "reviews") {
      body.innerHTML = reviewsHTML();
      return;
    }
    if (!data.leads.length) {
      body.innerHTML = emptyState({ iconName: "users", title: "No leads yet", text: "Add builders, developers, past clients and referrals you want to win work from." });
    } else if (ui.view === "board") {
      body.innerHTML = `<div class="board-scroll"><div class="board stages" style="grid-template-columns:repeat(${LEAD_STAGES.length},250px)">${LEAD_STAGES.map((s) => {
        const col = list.filter((l) => l.stage === s.id);
        return `<section class="col" data-stage="${s.id}"><header><span class="col-title">${esc(s.label)}</span><b>${col.length}</b></header><div class="col-body">${col.map(cardHTML).join("") || '<p class="muted small" style="padding:6px">Empty</p>'}</div></section>`;
      }).join("")}</div></div>`;
    } else if (ui.view === "today") {
      const rows = list.filter((l) => isOpen(l) && l.nextActionAt).sort((a, b) => a.nextActionAt.localeCompare(b.nextActionAt));
      body.innerHTML = rows.length ? `<div class="rows">${rows.map((l) => `<div class="trow clickable" data-lead="${l.id}"><span class="${due(l) ? "late" : ""}" style="width:92px">${fmtDate(l.nextActionAt)}</span><b>${esc(l.company)}</b><span class="muted">${esc(l.nextAction || "Follow up")}</span><span class="grow"></span>${pill(stageOf(l.stage).label, stageOf(l.stage).tone)}</div>`).join("")}</div>` : emptyState({ iconName: "calendar", title: "No follow-ups scheduled", text: "Set a next action date on a lead and it appears here." });
    } else {
      body.innerHTML = `<table class="table"><thead><tr><th>Company</th><th>Contact</th><th>City</th><th>Stage</th><th>Next action</th><th class="r">Est. fee</th></tr></thead><tbody>${list.map((l) => `<tr class="clickable" data-lead="${l.id}"><td><b>${esc(l.company)}</b></td><td>${esc(l.contactName || "")}${l.phone ? `<div class="muted small">${esc(l.phone)}</div>` : ""}</td><td>${esc(l.city || "")}</td><td>${pill(stageOf(l.stage).label, stageOf(l.stage).tone)}</td><td class="${due(l) ? "late" : ""}">${l.nextActionAt ? fmtDate(l.nextActionAt) : ""}</td><td class="r">${l.valuePaise ? inr(l.valuePaise) : ""}</td></tr>`).join("")}</tbody></table>`;
    }
  };
  draw();

  root.addEventListener("input", (e) => { if (e.target.matches("[data-q]")) { ui.q = e.target.value; draw(); } });
  root.addEventListener("change", (e) => { if (e.target.matches("[data-owner]")) { ui.owner = e.target.value; draw(); } });
  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) return openLead(null);
    const v = t.closest("[data-view]");
    if (v) { ui.view = v.dataset.view; $$("[data-view]", root).forEach((b) => b.classList.toggle("on", b === v)); return draw(); }
    const m = t.closest("[data-lead-menu]");
    if (m) {
      const lead = data.leads.find((l) => l.id === m.dataset.leadMenu);
      return openMenu(m, [
        ...LEAD_STAGES.filter((s) => s.id !== lead.stage).map((s) => ({ label: `Move to ${s.label}`, onClick: () => { setStage(lead, s.id); app.render(); } })),
        "-",
        { label: lead.clientId ? "Open client" : "Create client from lead", onClick: () => leadToClient(lead) },
      ]);
    }
    const card = t.closest("[data-lead]");
    if (card) openLead(card.dataset.lead);
  });

  let dragId = "";
  root.addEventListener("dragstart", (e) => { const c = e.target.closest("[data-lead]"); if (c) { dragId = c.dataset.lead; e.dataTransfer.effectAllowed = "move"; } });
  root.addEventListener("dragover", (e) => { if (e.target.closest("[data-stage]")) e.preventDefault(); });
  root.addEventListener("drop", (e) => {
    const col = e.target.closest("[data-stage]");
    if (!col || !dragId) return;
    e.preventDefault();
    const lead = data.leads.find((l) => l.id === dragId);
    dragId = "";
    if (lead && lead.stage !== col.dataset.stage) { setStage(lead, col.dataset.stage); app.render(); }
  });
};
