// Consultations: website enquiries (from the public contact page), paid clarity
// consultations with a client summary, and a print-ready summary for the client.
// Enquiry text is written by the public website, so every value goes through
// esc() before it reaches an HTML string, attribute or the print window.

import { $, $$, uid, app, toast } from "../core.js";
import { data, put, note, today, meId, meName } from "./data.js";
import { icon, esc, pill, fmtDate, timeAgo, optionsHTML, openDrawer, openMenu, emptyState, mount } from "./ui.js";
import { inr } from "./finance.js";

export const DELIVERABLES = [
  { id: "requirements", label: "Requirements and lifestyle discussion" },
  { id: "scope", label: "Preliminary project scope" },
  { id: "costDrivers", label: "Budget considerations and major cost drivers" },
  { id: "constraints", label: "Design opportunities and constraints" },
  { id: "nextSteps", label: "Recommended next steps, in sequence" },
  { id: "specialists", label: "Architecture, interiors or specialist input needed" },
];
export const FEE_STATUS = [
  { id: "not_set", label: "Fee not set", tone: "mute" },
  { id: "quoted", label: "Fee quoted", tone: "info" },
  { id: "paid", label: "Paid", tone: "ok" },
  { id: "waived", label: "Waived", tone: "mute" },
];
export const OUTCOMES = [
  { id: "", label: "Open", tone: "info" },
  { id: "proposal", label: "Proposal requested", tone: "ok" },
  { id: "not_proceeding", label: "Not proceeding", tone: "bad" },
  { id: "later", label: "Later", tone: "mute" },
];

const MODES = [
  { id: "online", label: "Online" },
  { id: "in_person", label: "In person, Mangalore" },
];
const ENQUIRY_STATUS = [
  { id: "new", label: "New", tone: "warn" },
  { id: "lead", label: "Lead created", tone: "ok" },
  { id: "not_fit", label: "Not a fit", tone: "mute" },
  { id: "duplicate", label: "Linked to lead", tone: "mute" },
];
const NOT_FIT_REASONS = ["Outside our service area", "Budget", "Scope we don't offer", "Spam", "Other"];
const MISSING_FIELDS = [
  ["location", "Location"],
  ["stage", "Stage"],
  ["budgetRange", "Budget"],
  ["timeline", "Timeline"],
];

const ui = { tab: "inbox", status: "new" };

const enquiries = () => data.enquiries || [];
const consultations = () => data.consultations || [];
const leads = () => data.leads || [];
// Looks up a label by id, falling back to the first option (the default)
const byId = (list, id) => list.find((o) => o.id === id) || list[0];
// Newest first; consultations without a date go last
const newestFirst = (list) => [
  ...list.filter((c) => c.scheduledAt).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
  ...list.filter((c) => !c.scheduledAt),
];

export const consultationsOf = (leadId) => newestFirst(consultations().filter((c) => c.leadId === leadId));

export const enquiryOf = (lead) =>
  (lead && enquiries().find((e) => e.id === lead.enquiryId || e.leadId === lead.id)) || null;

export const enquiryToLead = (enq) => {
  const notes = [
    enq.stage && `Stage: ${enq.stage}`,
    enq.budgetRange && `Budget: ${enq.budgetRange}`,
    enq.timeline && `Timeline: ${enq.timeline}`,
    enq.message && `Message: ${enq.message}`,
  ]
    .filter(Boolean)
    .join("\n");
  const lead = {
    id: uid("ld_"),
    company: enq.name,
    contactName: enq.name,
    phone: enq.phone || "",
    email: enq.email || "",
    city: enq.location || "",
    projectType: enq.project || "",
    source: "Website",
    stage: "new",
    stageAt: new Date().toISOString(),
    owner: meId(),
    enquiryId: enq.id,
    notes,
  };
  put("leads", lead);
  put("enquiries", { ...enq, status: "lead", leadId: lead.id });
  note(`created lead ${lead.company} from a website enquiry`, { type: "lead", id: lead.id });
  toast("Lead created in CRM.");
  return lead;
};

// ---------------------------------------------------------------------------

export const openConsultation = (id, defaults = {}) => {
  const existing = id ? consultations().find((c) => c.id === id) : null;
  const lead = existing ? leads().find((l) => l.id === existing.leadId) : null;
  const leadName = lead ? lead.contactName || lead.company : "";
  const summary = existing?.clientSummary || {};
  const values = existing
    ? {
        ...existing,
        feeRupees: existing.feeQuotedPaise ? existing.feeQuotedPaise / 100 : "",
        ...Object.fromEntries(DELIVERABLES.map((d) => [`cs_${d.id}`, summary[d.id] || ""])),
      }
    : { mode: "online", feeStatus: "not_set", owner: meId(), scheduledAt: today(), ...defaults };
  const leadOptions = [...leads()]
    .sort((a, b) => (a.company || "").localeCompare(b.company || ""))
    .map((l) => ({ id: l.id, label: l.company }));
  const isChecked = (d) => ((existing?.deliverables || {})[d.id] ? "checked" : "");
  let drawerEl = null;

  openDrawer({
    title: existing ? `Consultation: ${leadName || "lead"}` : "New consultation",
    subtitle: existing
      ? `${esc(byId(FEE_STATUS, existing.feeStatus).label)} · ${esc(byId(OUTCOMES, existing.outcome || "").label)}`
      : "",
    spec: [
      { key: "leadId", label: "Client / lead", type: "select", options: leadOptions, blank: "Choose a lead", required: true },
      { key: "scheduledAt", label: "Date", type: "date", half: true },
      { key: "mode", label: "Mode", type: "select", options: MODES, half: true },
      { key: "feeStatus", label: "Fee", type: "select", options: FEE_STATUS, half: true },
      { key: "feeRupees", label: "Fee quoted (₹)", type: "number", half: true },
      { key: "owner", label: "Led by", type: "team", half: true },
      { key: "followUpAt", label: "Follow up on", type: "date", half: true },
      { key: "outcome", label: "Outcome", type: "select", options: OUTCOMES, half: true },
      { key: "agenda", label: "Agenda", type: "textarea", rows: 2 },
      { key: "notes", label: "Internal notes", type: "textarea", rows: 3, hint: "never printed" },
      ...DELIVERABLES.map((d) => ({ key: `cs_${d.id}`, label: `${d.label} (client summary)`, type: "textarea", rows: 2 })),
    ],
    values,
    after: `<section class="crm-log"><h3>Deliverables covered</h3>
      <div class="deliv">${DELIVERABLES.map(
        (d) => `<label class="check-item"><input type="checkbox" data-deliv="${d.id}" ${isChecked(d)}><span>${esc(d.label)}</span></label>`
      ).join("")}</div>
      ${existing ? '<button type="button" class="btn small" data-print>Print client summary</button>' : ""}</section>`,
    bind: (root) => {
      drawerEl = root;
      $("[data-print]", root)?.addEventListener("click", () => {
        // Print the saved record, not the form, so unsaved edits never leak into the summary
        printClientSummary(consultations().find((c) => c.id === existing.id) || existing);
      });
    },
    saveLabel: existing ? "Save changes" : "Add consultation",
    onSave: (out) => {
      const lead = leads().find((l) => l.id === out.leadId);
      const record = {
        ...(existing || { id: uid("cons_"), createdBy: meName() }),
        leadId: out.leadId,
        scheduledAt: out.scheduledAt,
        mode: out.mode,
        feeStatus: out.feeStatus,
        feeQuotedPaise: Math.round((Number(out.feeRupees) || 0) * 100),
        owner: out.owner,
        followUpAt: out.followUpAt,
        outcome: out.outcome,
        agenda: out.agenda,
        notes: out.notes,
        deliverables: Object.fromEntries(
          DELIVERABLES.map((d) => [d.id, Boolean($(`[data-deliv="${d.id}"]`, drawerEl)?.checked)])
        ),
        clientSummary: Object.fromEntries(DELIVERABLES.map((d) => [d.id, String(out[`cs_${d.id}`] || "")])),
      };
      put("consultations", record);
      if (!existing) {
        note(`scheduled a consultation with ${lead ? lead.contactName || lead.company : "a lead"}`, { type: "lead", id: out.leadId });
      }
      app.render();
    },
  });
};

// ---------------------------------------------------------------------------

const SUMMARY_CSS = `body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.55;color:#000;background:#fff}
h1{font-size:26px;margin:0 0 4px}
h2{font-size:17px;margin:24px 0 6px}
.meta{margin:0 0 20px}
.foot{margin-top:32px;font-size:12px;border-top:1px solid #999;padding-top:10px}
@media print{body{margin:0;max-width:none}}`;

export const printClientSummary = (c) => {
  const lead = leads().find((l) => l.id === c.leadId);
  const w = window.open("", "_blank");
  if (!w) return toast("Allow pop-ups to print the summary.", { error: true });
  const name = esc((lead && (lead.contactName || lead.company)) || "the client");
  const when = fmtDate(c.scheduledAt, { year: true });
  const textOf = (d) => String((c.clientSummary || {})[d.id] || "").trim();
  const sections =
    DELIVERABLES.filter((d) => textOf(d))
      .map((d) => `<h2>${esc(d.label)}</h2><p>${esc(textOf(d)).replace(/\r?\n/g, "<br>")}</p>`)
      .join("") || "<p>No summary has been written yet.</p>";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Project clarity summary</title>
<style>${SUMMARY_CSS}</style>
</head>
<body>
<h1>Project clarity summary</h1>
<p class="meta">Prepared for ${name}${when ? ` · ${esc(when)}` : ""}</p>
${sections}
<p class="foot">Vanilla &amp; Somethin', Mangalore. This summary records our consultation discussion. It is not a cost estimate, a contractor quotation, structural advice or an approval.</p>
</body>
</html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
};

// ---------------------------------------------------------------------------

const enquiryHTML = (e) => {
  const status = byId(ENQUIRY_STATUS, e.status);
  const place = [e.project, e.location, e.stage].filter(Boolean).map(esc).join(" · ");
  const terms = [e.budgetRange && `Budget: ${e.budgetRange}`, e.timeline && `Timeline: ${e.timeline}`]
    .filter(Boolean)
    .map(esc)
    .join(" · ");
  const missing = MISSING_FIELDS.filter(([key]) => !String(e[key] || "").trim()).map(([, label]) => label);
  const phone = String(e.phone || "").trim();
  const email = String(e.email || "").trim();
  const digits = phone.replace(/\D/g, "");
  const contacts = [
    phone && `<a href="tel:${esc(phone)}">${icon("phone", 14)} ${esc(phone)}</a>`,
    email && `<a href="mailto:${esc(email)}">${icon("mail", 14)} ${esc(email)}</a>`,
    digits && `<a href="https://wa.me/${esc(digits)}" target="_blank" rel="noopener">WhatsApp</a>`,
  ]
    .filter(Boolean)
    .join(" ");
  const actions = [
    ...(e.status === "new" ? [["lead", "Create lead"], ["notfit", "Not a fit"], ["link", "Link to existing lead"]] : []),
    ...(e.leadId ? [["open", "Open in CRM"]] : []),
  ]
    .map(([act, label]) => `<button type="button" class="btn small" data-act="${act}" data-id="${esc(e.id)}">${label}</button>`)
    .join(" ");
  return `<article class="card enquiry">
    <div class="lead-top"><b>${esc(e.name)}</b>${pill(status.label, status.tone)}</div>
    ${e.createdAt ? `<div class="muted small">${esc(timeAgo(e.createdAt))}</div>` : ""}
    ${place ? `<div class="small">${place}</div>` : ""}
    ${terms ? `<div class="small">${terms}</div>` : ""}
    ${e.message ? `<p class="muted">${esc(e.message)}</p>` : ""}
    ${missing.length ? pill(`Missing: ${missing.join(", ")}`, "warn") : ""}
    ${contacts ? `<div class="small">${contacts}</div>` : ""}
    <div class="lead-foot">${actions}</div>
  </article>`;
};

const enquiryAction = (button) => {
  const enq = enquiries().find((e) => e.id === button.dataset.id);
  if (!enq) return;
  const action = button.dataset.act;
  if (action === "lead") {
    enquiryToLead(enq);
    return app.render();
  }
  if (action === "notfit") {
    return openMenu(
      button,
      NOT_FIT_REASONS.map((reason) => ({
        label: reason,
        onClick: () => {
          put("enquiries", { ...enq, status: "not_fit", notFitReason: reason });
          app.render();
        },
      }))
    );
  }
  if (action === "link") {
    const pool = leads();
    if (!pool.length) return toast("No leads yet. Use Create lead.", { error: true });
    const phoneKey = (v) => String(v || "").replace(/\D/g, "").slice(-10);
    const phone = phoneKey(enq.phone);
    const email = String(enq.email || "").trim().toLowerCase();
    const matches = pool.filter(
      (l) => (phone && phoneKey(l.phone) === phone) || (email && String(l.email || "").trim().toLowerCase() === email)
    );
    const others = pool
      .filter((l) => !matches.includes(l))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 8);
    return openMenu(
      button,
      [...matches, ...others].slice(0, 10).map((l) => ({
        label: l.company,
        onClick: () => {
          put("enquiries", { ...enq, status: "duplicate", leadId: l.id });
          put("leads", { ...l, enquiryId: l.enquiryId || enq.id });
          toast("Linked.");
          app.render();
        },
      }))
    );
  }
  if (action === "open") location.hash = "#/crm";
};

export const renderConsultations = (view) => {
  const all = enquiries();
  const cons = consultations();
  const newCount = all.filter((e) => e.status === "new").length;
  const monthPrefix = today().slice(0, 7);
  const thisMonth = all.filter((e) => (e.createdAt || "").startsWith(monthPrefix)).length;
  const paid = cons.filter((c) => c.feeStatus === "paid").length;
  const quoted = cons.filter((c) => c.feeStatus === "quoted").length;
  const decided = cons.filter((c) => c.outcome);
  const proposals = decided.filter((c) => c.outcome === "proposal").length;
  const rate = decided.length ? `${Math.round((proposals / decided.length) * 100)}%` : "–";

  const root = mount(view, `
    <div class="page-head"><div><h1>Consultations</h1><p>Website enquiries, paid clarity consultations and what came out of them.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} New consultation</button></div></div>
    <div class="kpis">
      <div class="kpi ${newCount ? "warn" : ""}"><span class="k">New enquiries</span><b>${newCount}</b><span class="small muted">from the contact page</span></div>
      <div class="kpi"><span class="k">Enquiries this month</span><b>${thisMonth}</b><span class="small muted">since the 1st</span></div>
      <div class="kpi"><span class="k">Paid consultations</span><b>${paid}</b><span class="small muted">${quoted} fee quoted</span></div>
      <div class="kpi"><span class="k">Consultation to proposal</span><b>${rate}</b><span class="small muted">of decided consultations</span></div>
    </div>
    <div class="toolbar"><div class="seg">${[["inbox", "Website enquiries"], ["list", "Consultations"]]
      .map(([id, l]) => `<button type="button" data-tab="${id}" class="${ui.tab === id ? "on" : ""}">${l}</button>`)
      .join("")}</div>
      <select data-status aria-label="Enquiry status" style="${ui.tab === "inbox" ? "" : "display:none"}">${optionsHTML(
        [{ id: "new", label: "New" }, { id: "all", label: "All" }],
        ui.status
      )}</select></div>
    <div data-body></div>`);
  const body = $("[data-body]", root);
  const statusSelect = $("[data-status]", root);

  const draw = () => {
    if (ui.tab === "inbox") {
      const list = enquiries()
        .filter((e) => ui.status === "all" || e.status === "new")
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      body.innerHTML = list.length
        ? list.map(enquiryHTML).join("")
        : emptyState({
            iconName: "mail",
            title: ui.status === "new" ? "No new enquiries" : "No website enquiries",
            text: "Enquiries sent from the contact page appear here.",
          });
    } else {
      const rows = newestFirst(consultations())
        .map((c) => {
          const lead = leads().find((l) => l.id === c.leadId);
          const fee = byId(FEE_STATUS, c.feeStatus);
          const outcome = byId(OUTCOMES, c.outcome || "");
          const mode = byId(MODES, c.mode);
          const paise = Number(c.feeQuotedPaise || 0);
          return `<tr class="clickable" data-cons="${esc(c.id)}"><td>${esc(fmtDate(c.scheduledAt))}</td><td><b>${esc(
            lead ? lead.contactName || lead.company : "Unknown lead"
          )}</b></td><td>${esc(mode.label)}</td><td>${pill(fee.label, fee.tone)}${
            paise > 0 ? ` <span class="muted small">${inr(paise)}</span>` : ""
          }</td><td>${pill(outcome.label, outcome.tone)}</td><td>${esc(fmtDate(c.followUpAt))}</td></tr>`;
        })
        .join("");
      body.innerHTML = cons.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Client</th><th>Mode</th><th>Fee</th><th>Outcome</th><th>Follow up</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : emptyState({
            iconName: "calendar",
            title: "No consultations yet",
            text: "Create one from a lead, or with New consultation.",
          });
    }
  };
  draw();

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) return openConsultation(null);
    const tab = t.closest("[data-tab]");
    if (tab) {
      ui.tab = tab.dataset.tab;
      $$("[data-tab]", root).forEach((b) => b.classList.toggle("on", b === tab));
      statusSelect.style.display = ui.tab === "inbox" ? "" : "none";
      return draw();
    }
    const act = t.closest("[data-act]");
    if (act) return enquiryAction(act);
    const row = t.closest("[data-cons]");
    if (row) openConsultation(row.dataset.cons);
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-status]")) {
      ui.status = e.target.value;
      draw();
    }
  });
};
