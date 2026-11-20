// CRM: leads from first contact to won or lost, with a call/meeting/note log and
// next-action reminders. Ported from the ALIVE console CRM. A won lead becomes a
// client in the onboarding pipeline in one click.

import { $, $$, uid, app, toast } from "../core.js";
import { data, put, del, note, today, addDays, member, team, meName, meId, CLIENT_SOURCES, PROJECT_TYPES } from "./data.js";
import { icon, esc, avatar, pill, fmtDate, timeAgo, optionsHTML, openDrawer, openMenu, emptyState, mount } from "./ui.js";
import { inr } from "./finance.js";
import { openConsultation, consultationsOf, enquiryOf, FEE_STATUS, OUTCOMES } from "./consultations.js";

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
    stage: "enquiry", stageAt: new Date().toISOString(), checks: {}, notes: lead.notes || "",
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
      { key: "valueRupees", label: "Estimated fee (₹)", type: "number", half: true },
      { key: "source", label: "Source", type: "text", list: CLIENT_SOURCES, half: true },
      { key: "owner", label: "Owner", type: "team", half: true },
      { key: "stage", label: "Stage", type: "select", options: LEAD_STAGES, half: true },
      { key: "nextActionAt", label: "Next action on", type: "date", half: true },
      { key: "nextAction", label: "Next action", type: "text", half: true, placeholder: "e.g. Send proposal" },
      { key: "lostReason", label: "If lost, why", type: "select", options: LOST_REASONS, blank: "–", half: true },
      { key: "notes", label: "Notes", type: "textarea", rows: 3 },
    ],
    values,
    after: `${existing ? consultationsSection(existing) : ""}<section class="crm-log"><h3>Activity</h3>
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
      if (existing) {
        root.addEventListener("click", (e) => {
          const cons = e.target.closest("[data-cons]");
          if (cons) return openConsultation(cons.dataset.cons);
          if (e.target.closest("[data-cons-new]")) openConsultation(null, { leadId: existing.id });
        });
      }
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

const consultationsSection = (existing) => {
  const enq = enquiryOf(existing);
  const details = enq
    ? ["budgetRange", "timeline", "stage", "message"].map((k) => enq[k]).filter(Boolean).map((v) => esc(v)).join(" · ")
    : "";
  const cons = consultationsOf(existing.id);
  const labelOf = (list, id) => list.find((x) => x.id === id) || list[0] || { label: "", tone: "mute" };
  return `<section class="crm-log"><h3>Consultations</h3>
    ${enq ? `<p class="muted small">From a website enquiry on ${fmtDate(enq.createdAt, { year: true })}${details ? `<br>${details}` : ""}</p>` : ""}
    ${cons.length
      ? cons.map((c) => {
        const fee = labelOf(FEE_STATUS, c.feeStatus);
        const out = labelOf(OUTCOMES, c.outcome);
        return `<div class="crm-act" data-cons="${esc(c.id)}" style="cursor:pointer"><div>${esc(c.scheduledAt ? fmtDate(c.scheduledAt) : "No date")}</div><div>${pill(fee.label, fee.tone)} ${pill(out.label, out.tone)}</div></div>`;
      }).join("")
      : '<p class="muted small">No consultation yet.</p>'}
    <button type="button" class="btn small" data-cons-new>Start consultation</button></section>`;
};

const cardHTML = (l) => {
  const o = member(l.owner);
  return `<article class="card lead ${due(l) ? "due" : ""}" draggable="true" data-lead="${l.id}">
    <div class="lead-top"><b>${esc(l.company)}</b>${l.valuePaise ? `<span class="muted small">${inr(l.valuePaise)}</span>` : ""}</div>
    ${l.contactName ? `<div class="muted small">${esc(l.contactName)}${l.city ? ` · ${esc(l.city)}` : ""}</div>` : ""}
    ${l.nextActionAt ? `<div class="small ${due(l) ? "late" : "muted"}">${icon("clock", 12)} ${fmtDate(l.nextActionAt)}${l.nextAction ? ` · ${esc(l.nextAction)}` : ""}</div>` : ""}
    <div class="lead-foot">${o ? avatar(o.name, 22) : ""}<button class="icon-btn" data-lead-menu="${l.id}" aria-label="More">${icon("more", 15)}</button></div></article>`;
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
  const newEnquiries = (data.enquiries || []).filter((e) => e.status === "new").length;
  const root = mount(view, `
    <div class="page-head"><div><h1>CRM</h1><p>Leads from first contact to won. Log every call and meeting, set the next action, and turn a won lead into a client.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} New lead</button></div></div>
    <div class="kpis money">
      <div class="kpi"><span class="k">Open leads</span><b>${open.length}</b><span class="small muted">${data.leads.filter((l) => l.stage === "later").length} to revisit later</span></div>
      <div class="kpi"><span class="k">Pipeline value</span><b>${inr(open.reduce((n, l) => n + (l.valuePaise || 0), 0))}</b><span class="small muted">estimated fees, open leads</span></div>
      <div class="kpi ${dueNow.length ? "warn" : ""}"><span class="k">Actions due</span><b>${dueNow.length}</b><span class="small muted">today or overdue</span></div>
      <div class="kpi"><span class="k">Won this year</span><b>${wonYear.length}</b><span class="small muted">${inr(wonYear.reduce((n, l) => n + (l.valuePaise || 0), 0))}</span></div>
      <a class="kpi ${newEnquiries ? "warn" : ""}" href="#/consultations"><span class="k">Website enquiries</span><b>${newEnquiries}</b><span class="small muted">new, not yet reviewed</span></a>
    </div>
    <div class="toolbar"><div class="seg">${[["board", "Board"], ["today", "Follow-ups"], ["table", "All leads"]].map(([id, l]) => `<button type="button" data-view="${id}" class="${ui.view === id ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search leads" value="${esc(ui.q)}"></label>
      <select data-owner aria-label="Owner">${optionsHTML(team().map((m) => ({ id: m.id, label: m.name })), ui.owner, { blank: "Anyone" })}</select></div>
    <div data-body></div>`);
  const body = $("[data-body]", root);

  const draw = () => {
    const list = visible();
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
