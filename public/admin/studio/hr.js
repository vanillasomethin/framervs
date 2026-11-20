// People: team directory, leave requests with approval, balances and the
// holiday calendar. Leave rules are ported from the ALIVE console.

import { $, $$, uid, app, toast } from "../core.js";
import { data, put, del, note, today, team, member, meId, meName, saveSettings } from "./data.js";
import { icon, esc, avatar, pill, fmtDate, timeAgo, optionsHTML, openDrawer, openMenu, emptyState, mount } from "./ui.js";
import { LEAVE_TYPES, REQUESTABLE, DEFAULT_POLICY, balances, checkRequest } from "./leave.js";

const ui = { tab: "team", year: new Date().getFullYear() };
const policy = () => ({ ...DEFAULT_POLICY, ...(data.settings.leavePolicy || {}) });
const typeLabel = (id) => (LEAVE_TYPES.find((t) => t.id === id) || {}).label || id;
const STATUS_TONE = { pending: "warn", approved: "ok", rejected: "bad", cancelled: "mute" };
const HOLIDAY_KINDS = [{ id: "mandatory", label: "Public holiday" }, { id: "fixed", label: "Company holiday" }, { id: "flexible", label: "Choice day (no fixed date)" }];

const joinedOf = (m) => m.joinedOn || (m.createdAt || "").slice(0, 10) || `${ui.year}-01-01`;
const ctxFor = (userId) => ({ joinedOn: joinedOf(member(userId) || {}), today: today(), holidays: data.holidays, requests: data.leaves.filter((l) => l.userId === userId) });

// ---------------------------------------------------------------------------

const openMember = (id) => {
  const m = member(id);
  if (!m) return;
  openDrawer({
    title: m.name,
    subtitle: m.role ? esc(m.role) : "",
    spec: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "role", label: "Role", type: "text", half: true },
      { key: "email", label: "Email", type: "text", half: true },
      { key: "phone", label: "Phone", type: "text", half: true },
      { key: "joinedOn", label: "Joined on", type: "date", half: true },
      { key: "managerId", label: "Reports to (approves leave)", type: "select", options: team().filter((t) => t.id !== id).map((t) => ({ id: t.id, label: t.name })), blank: "Nobody yet" },
      { key: "emergencyContact", label: "Emergency contact", type: "text" },
      { key: "notes", label: "HR notes (private)", type: "textarea", rows: 3 },
    ],
    values: m,
    onSave: (out) => {
      saveSettings({ team: team().map((t) => (t.id === id ? { ...t, ...out } : t)) });
      app.render();
    },
  });
};

export const openLeave = (id, defaults = {}) => {
  const existing = id ? data.leaves.find((l) => l.id === id) : null;
  const values = existing || { userId: meId() || (team()[0] || {}).id || "", type: "casual", start: today(), end: today(), emergency: false, ...defaults };
  openDrawer({
    title: existing ? `${typeLabel(existing.type)} · ${(member(existing.userId) || {}).name || ""}` : "Request leave",
    subtitle: existing ? `${esc(existing.status)} · ${existing.days} working day${existing.days === 1 ? "" : "s"}` : "Working days are counted using your holidays and the working-week rule.",
    spec: [
      { key: "userId", label: "Who", type: "select", options: team().map((t) => ({ id: t.id, label: t.name })), half: true },
      { key: "type", label: "Type", type: "select", options: LEAVE_TYPES.map((t) => ({ id: t.id, label: t.label })), half: true },
      { key: "start", label: "First day", type: "date", half: true },
      { key: "end", label: "Last day", type: "date", half: true },
      { key: "emergency", label: "Emergency (starts today)", type: "select", options: [{ id: "no", label: "No" }, { id: "yes", label: "Yes, reported today" }], half: true },
      { key: "certificateUrl", label: "Medical certificate link", type: "text", half: true, hint: "for sick leave over the limit" },
      { key: "reason", label: "Reason", type: "textarea", rows: 2 },
    ],
    values: { ...values, emergency: values.emergency ? "yes" : "no" },
    saveLabel: existing ? "Save changes" : "Submit request",
    onSave: (out) => {
      const request = { ...out, emergency: out.emergency === "yes" };
      if (!member(request.userId)) { toast("Choose who the leave is for.", { error: true }); return false; }
      const ctx = ctxFor(request.userId);
      ctx.requests = ctx.requests.filter((r) => r.id !== (existing || {}).id);
      let days;
      if (request.type === "lop") {
        days = Math.max(1, Math.round((Date.parse(request.end) - Date.parse(request.start)) / 86400000) + 1);
      } else {
        const check = checkRequest(request, ctx, policy());
        if (!check.ok) { toast(esc(check.error), { error: true }); return false; }
        if (check.needsCertificate && !request.certificateUrl) toast("This sick leave is long enough to need a medical certificate before approval.");
        days = check.days;
      }
      const approver = (member(request.userId) || {}).managerId || "";
      put("leaves", { ...(existing || { id: uid("lv_"), status: request.type === "lop" ? "approved" : "pending", createdBy: meId() }), ...request, days, approverId: approver });
      note(`${existing ? "updated" : "requested"} ${typeLabel(request.type).toLowerCase()} for ${(member(request.userId) || {}).name}`, { type: "leave", id: existing?.id });
      ui.tab = "leave";
      app.render();
    },
    onDelete: existing ? () => { del("leaves", existing.id); app.render(); } : null,
    deleteLabel: "Delete request",
  });
};

const decide = (leave, status) => {
  const dialogNote = status === "rejected" ? window.prompt("Reason for declining (shown on the request):", "") : "";
  if (status === "rejected" && dialogNote === null) return;
  put("leaves", { ...leave, status, decidedBy: meName(), decidedAt: new Date().toISOString(), decisionNote: dialogNote || "" });
  note(`${status} ${(member(leave.userId) || {}).name}'s ${typeLabel(leave.type).toLowerCase()}`, { type: "leave", id: leave.id });
  app.render();
};

const openHoliday = (id) => {
  const existing = id ? data.holidays.find((h) => h.id === id) : null;
  openDrawer({
    title: existing ? "Edit holiday" : "Add holiday",
    spec: [
      { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Independence Day" },
      { key: "date", label: "Date", type: "date", half: true },
      { key: "kind", label: "Kind", type: "select", options: HOLIDAY_KINDS, half: true },
    ],
    values: existing || { kind: "mandatory", date: today() },
    onSave: (out) => {
      put("holidays", { ...(existing || { id: uid("hd_") }), ...out, year: Number((out.date || today()).slice(0, 4)) });
      ui.tab = "holidays";
      app.render();
    },
    onDelete: existing ? () => { del("holidays", existing.id); app.render(); } : null,
    deleteLabel: "Delete holiday",
  });
};

const bulkHolidays = () => {
  openDrawer({
    title: "Paste a holiday list",
    subtitle: "One per line: date, name. Example: 2027-01-26, Republic Day",
    spec: [{ key: "text", label: "Holidays", type: "textarea", rows: 10, placeholder: "2027-01-26, Republic Day\n2027-08-15, Independence Day" }],
    values: {},
    saveLabel: "Add holidays",
    onSave: ({ text }) => {
      let n = 0;
      for (const line of String(text || "").split("\n")) {
        const m = line.trim().match(/^(\d{4}-\d{2}-\d{2})\s*[,;-]\s*(.+)$/);
        if (!m || data.holidays.some((h) => h.date === m[1] && h.name === m[2].trim())) continue;
        put("holidays", { id: uid("hd_"), date: m[1], name: m[2].trim().slice(0, 80), kind: "mandatory", year: Number(m[1].slice(0, 4)) });
        n += 1;
      }
      if (!n) { toast("No valid lines found. Use: 2027-01-26, Republic Day", { error: true }); return false; }
      toast(`${n} holiday${n === 1 ? "" : "s"} added.`);
      ui.tab = "holidays";
      app.render();
    },
  });
};

// ---------------------------------------------------------------------------

const balanceCells = (m) => {
  const b = balances(ui.year, ctxFor(m.id), policy());
  const left = (x) => Math.max(0, x.total - x.used - x.pending);
  return `<span title="Casual">CL ${left(b.casual)}</span><span title="Sick">SL ${left(b.sick)}</span><span title="Earned">EL ${b.earned.available}</span><span title="Choice">CH ${left(b.choice)}</span>`;
};

export const renderHr = (view) => {
  const pending = data.leaves.filter((l) => l.status === "pending");
  const away = data.leaves.filter((l) => l.status === "approved" && l.start <= today() && l.end >= today());
  const root = mount(view, `
    <div class="page-head"><div><h1>People</h1><p>Team directory, leave requests and the holiday calendar.</p></div>
      <div class="head-actions"><button class="btn primary" data-new-leave>${icon("plus", 16)} Request leave</button></div></div>
    <div class="kpis money">
      <div class="kpi"><span class="k">Team</span><b>${team().length}</b><span class="small muted">members</span></div>
      <div class="kpi ${pending.length ? "warn" : ""}"><span class="k">Leave to approve</span><b>${pending.length}</b><span class="small muted">pending requests</span></div>
      <div class="kpi"><span class="k">Away today</span><b>${away.length}</b><span class="small muted">${away.map((l) => esc((member(l.userId) || {}).name || "")).join(", ") || "everyone is in"}</span></div>
      <div class="kpi"><span class="k">Holidays ${ui.year}</span><b>${data.holidays.filter((h) => h.year === ui.year).length}</b><span class="small muted">on the calendar</span></div>
    </div>
    <div class="toolbar"><div class="seg">${[["team", "Team"], ["leave", "Leave"], ["holidays", "Holidays"]].map(([id, l]) => `<button type="button" data-tab="${id}" class="${ui.tab === id ? "on" : ""}">${l}</button>`).join("")}</div>
      <span class="grow"></span>${ui.tab === "holidays" ? `<button class="btn small" data-bulk>Paste a list</button><button class="btn small" data-new-holiday>${icon("plus", 14)} Holiday</button>` : ""}</div>
    <div data-body></div>`);
  const body = $("[data-body]", root);

  const draw = () => {
    if (ui.tab === "team") {
      body.innerHTML = team().length ? `<table class="table"><thead><tr><th>Person</th><th>Role</th><th>Contact</th><th>Joined</th><th>Leave left ${ui.year}</th></tr></thead><tbody>${team().map((m) => `<tr class="clickable" data-member="${m.id}"><td><span class="who">${avatar(m.name, 28)} <b>${esc(m.name)}</b></span></td><td>${esc(m.role || "")}</td><td>${esc(m.email || "")}${m.phone ? `<div class="muted small">${esc(m.phone)}</div>` : ""}</td><td>${m.joinedOn ? fmtDate(m.joinedOn, { year: true }) : '<span class="muted">not set</span>'}</td><td class="bal">${balanceCells(m)}</td></tr>`).join("")}</tbody></table><p class="muted small" style="margin-top:10px">CL casual · SL sick · EL earned · CH choice day. Add people in Settings → Team, then fill in their details here.</p>`
        : emptyState({ iconName: "users", title: "No team members yet", text: "Add your team in Settings first. They then appear here and in task assignment." });
    } else if (ui.tab === "leave") {
      const list = data.leaves.slice().sort((a, b) => b.start.localeCompare(a.start));
      body.innerHTML = list.length ? `<table class="table"><thead><tr><th>Person</th><th>Type</th><th>Dates</th><th class="r">Days</th><th>Status</th><th></th></tr></thead><tbody>${list.map((l) => `<tr class="clickable" data-leave="${l.id}"><td>${esc((member(l.userId) || {}).name || "Former member")}</td><td>${esc(typeLabel(l.type))}${l.emergency ? ' <span class="pill bad">Emergency</span>' : ""}</td><td>${fmtDate(l.start)}${l.end !== l.start ? ` – ${fmtDate(l.end, { year: true })}` : ` ${l.start.slice(0, 4)}`}</td><td class="r">${l.days}</td><td>${pill(l.status, STATUS_TONE[l.status])}${l.decidedBy ? `<div class="muted small">by ${esc(l.decidedBy)} ${timeAgo(l.decidedAt)}</div>` : ""}</td><td>${l.status === "pending" ? `<button class="icon-btn" data-decide="${l.id}" aria-label="Decide">${icon("more", 16)}</button>` : ""}</td></tr>`).join("")}</tbody></table>`
        : emptyState({ iconName: "calendar", title: "No leave requests", text: "Requests appear here for approval." });
    } else {
      const list = data.holidays.filter((h) => h.year === ui.year).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      body.innerHTML = list.length ? `<div class="rows">${list.map((h) => `<div class="trow clickable" data-holiday="${h.id}"><span style="width:110px">${h.date ? fmtDate(h.date, { year: true }) : "Flexible"}</span><b>${esc(h.name)}</b><span class="grow"></span>${pill((HOLIDAY_KINDS.find((k) => k.id === h.kind) || {}).label || h.kind, "mute")}</div>`).join("")}</div>`
        : emptyState({ iconName: "calendar", title: `No holidays for ${ui.year}`, text: "Add public and company holidays. They are excluded when leave days are counted. Nothing is pre-filled." });
    }
  };
  draw();

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new-leave]")) return openLeave(null);
    if (t.closest("[data-new-holiday]")) return openHoliday(null);
    if (t.closest("[data-bulk]")) return bulkHolidays();
    const tab = t.closest("[data-tab]");
    if (tab) { ui.tab = tab.dataset.tab; return app.render(); }
    const dec = t.closest("[data-decide]");
    if (dec) {
      const l = data.leaves.find((x) => x.id === dec.dataset.decide);
      return openMenu(dec, [{ label: "Approve", onClick: () => decide(l, "approved") }, { label: "Decline", danger: true, onClick: () => decide(l, "rejected") }, { label: "Cancel request", onClick: () => decide(l, "cancelled") }]);
    }
    const m = t.closest("[data-member]"); if (m) return openMember(m.dataset.member);
    const l = t.closest("[data-leave]"); if (l) return openLeave(l.dataset.leave);
    const h = t.closest("[data-holiday]"); if (h) return openHoliday(h.dataset.holiday);
  });
};
