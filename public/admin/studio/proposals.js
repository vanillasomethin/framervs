// Proposals: a written scope and fee proposal for a lead or client, built from a
// standard template so every proposal states the same things: deliverables by
// stage, three scope levels, exclusions, assumptions, client responsibilities,
// revisions, site visits, payment stages and terms.
//
// Fees are never calculated or suggested here. The studio enters a fee for each
// scope level; the payment schedule only splits that fee across the stages the
// level includes. Templates are starting points to edit per project, and the
// standard terms should be reviewed once by the studio's lawyer.
//
// Flow: CRM lead -> proposal -> "Mark as sent" (lead moves to Pitched, follow-up
// in 2 days) -> "Accepted" with a chosen level -> GST quote in Billing.

import { $, $$, uid, app, toast } from "../core.js";
import { data, put, del, note, today, addDays, clientById, meName } from "./data.js";
import { icon, esc, pill, fmtDate, optionsHTML, openDrawer, openMenu, emptyState, mount } from "./ui.js";
import { inr } from "./finance.js";
import { openDoc } from "./billing.js";

export const PROPOSAL_STATUS = [
  { id: "draft", label: "Draft", tone: "mute" },
  { id: "sent", label: "Sent", tone: "info" },
  { id: "accepted", label: "Accepted", tone: "ok" },
  { id: "lost", label: "Lost", tone: "bad" },
];
const statusOf = (p) => PROPOSAL_STATUS.find((s) => s.id === p.status) || PROPOSAL_STATUS[0];
const FOLLOW_UP_DAYS = 2;

// ---------------------------------------------------------------------------
// Templates. Weights set how a level's fee is split across the stages it includes;
// they are a starting point the studio edits, not a fee scale.

const COMMON_EXCLUSIONS = [
  "Structural design and certification, which a licensed structural engineer provides under a separate appointment.",
  "Mechanical, electrical, plumbing, HVAC and fire engineering design, unless listed in the deliverables.",
  "Statutory, authority and approval fees. We prepare drawings for submission; the approval decision rests with the authority.",
  "Soil investigation, topographic and other surveys.",
  "Contractor quotations, bills of quantities, procurement and purchasing.",
  "Full-time site supervision, project management (PMC) and quality certification of construction.",
  "Walkthrough videos and 3D views beyond those listed.",
  "Travel outside Mangaluru city limits, charged at actuals with prior approval.",
];
const COMMON_ASSUMPTIONS = [
  "The client provides title documents, a site survey where one exists, and accurate information about the property.",
  "The brief is frozen at the end of the concept stage. Later changes to the frozen brief are additional services.",
  "Timelines assume client decisions within 7 days of each submission.",
];
const COMMON_RESPONSIBILITIES = [
  "Name one person who gives decisions and approvals for the client.",
  "Give site access for measurements and visits.",
  "Appoint and pay the structural engineer, specialist consultants and contractor where needed.",
  "Review each submission and confirm approval in writing (email or message) before the next stage starts.",
];
const COMMON_TERMS = [
  "Fees are as listed for the chosen scope level and exclude GST, which is charged as applicable.",
  "Each stage is invoiced on completion and payable within 7 days. Work on the next stage begins once the invoice is paid.",
  "Two rounds of revisions are included per stage. Further revisions, or changes after a stage is approved, are billed as additional services after written agreement.",
  "Site visits are periodic design observation visits. They are not full-time supervision or quality certification; the contractor remains responsible for workmanship, materials and site safety.",
  "Drawings and designs remain the studio's intellectual property. The client may use them for this project at this site.",
  "The studio may photograph the completed project for its portfolio. The client's name and address are not published without consent.",
  "Either party may end the appointment with 14 days' written notice. Fees are payable for work completed up to that date.",
  "This proposal is valid for 30 days from the date shown.",
];

export const TEMPLATES = [
  {
    id: "new_home",
    label: "New home (architecture)",
    stages: [
      { id: "brief", name: "Brief and site study", weight: 15, deliverables: "Site visit and photographs\nDetailed brief and area programme\nFeasibility notes on the site and local rules" },
      { id: "concept", name: "Concept design", weight: 20, deliverables: "Two layout options with massing\nOne concept presentation meeting\nConcept frozen on written approval" },
      { id: "dd", name: "Design development", weight: 20, deliverables: "Developed plans, elevations and sections\nMaterial and finish direction\n3D views of key spaces" },
      { id: "statutory", name: "Drawings for building permission", weight: 10, deliverables: "Drawings and forms for building permission submission\nResponses to authority queries on the drawings" },
      { id: "wd", name: "Working drawings", weight: 25, deliverables: "Good-for-construction architectural drawings\nDoor, window and finish schedules\nCoordination with structural and services consultants" },
      { id: "site", name: "Construction-stage design observation", weight: 10, deliverables: "Periodic design observation visits (number as agreed)\nDrawing clarifications for the contractor\nA short report after each visit" },
    ],
    levels: [
      { name: "Essential", stageIds: ["brief", "concept", "dd", "statutory"] },
      { name: "Standard", stageIds: ["brief", "concept", "dd", "statutory", "wd"] },
      { name: "Full", stageIds: ["brief", "concept", "dd", "statutory", "wd", "site"] },
    ],
  },
  {
    id: "home_interiors",
    label: "Home interiors",
    stages: [
      { id: "brief", name: "Brief and measurement", weight: 15, deliverables: "Site measurement\nRequirements and lifestyle brief\nBudget range discussion" },
      { id: "concept", name: "Concept and space planning", weight: 20, deliverables: "Furniture layouts\nMood and material board\nConcept frozen on written approval" },
      { id: "dd", name: "Design development and 3D views", weight: 25, deliverables: "3D views of key rooms\nFinish, material and colour selection\nLighting concept" },
      { id: "wd", name: "Working drawings and specifications", weight: 25, deliverables: "Joinery, ceiling, flooring and wall drawings\nElectrical and lighting layouts\nFinish schedule and a bill-of-quantities format for contractor pricing" },
      { id: "site", name: "Execution-stage design observation", weight: 15, deliverables: "Periodic design observation visits (number as agreed)\nClarifications for the contractor and vendors\nSnag list at handover" },
    ],
    levels: [
      { name: "Essential", stageIds: ["brief", "concept", "dd"] },
      { name: "Standard", stageIds: ["brief", "concept", "dd", "wd"] },
      { name: "Full", stageIds: ["brief", "concept", "dd", "wd", "site"] },
    ],
  },
  {
    id: "renovation",
    label: "Renovation",
    stages: [
      { id: "survey", name: "Existing condition survey and brief", weight: 15, deliverables: "Measured drawings of the existing building\nCondition notes and photographs\nBrief and priorities for the renovation" },
      { id: "concept", name: "Concept options", weight: 20, deliverables: "Two renovation options\nRetain, alter and remove plan\nConcept frozen on written approval" },
      { id: "dd", name: "Design development", weight: 25, deliverables: "Developed plans and elevations\nMaterial and finish selection\n3D views of key spaces" },
      { id: "wd", name: "Working drawings and specifications", weight: 25, deliverables: "Demolition and new-work drawings\nJoinery, electrical and plumbing layouts\nFinish schedule" },
      { id: "site", name: "Site-stage design observation", weight: 15, deliverables: "Periodic design observation visits (number as agreed)\nClarifications for the contractor\nSnag list at handover" },
    ],
    levels: [
      { name: "Essential", stageIds: ["survey", "concept", "dd"] },
      { name: "Standard", stageIds: ["survey", "concept", "dd", "wd"] },
      { name: "Full", stageIds: ["survey", "concept", "dd", "wd", "site"] },
    ],
  },
  {
    id: "commercial_interiors",
    label: "Commercial interiors (cafe, retail, office)",
    stages: [
      { id: "brief", name: "Brief, brand and site study", weight: 15, deliverables: "Site measurement\nOperations and customer flow brief\nBrand inputs review" },
      { id: "concept", name: "Concept and layout", weight: 20, deliverables: "Zoning and layout options\nMood and material direction\nConcept frozen on written approval" },
      { id: "dd", name: "Design development and 3D views", weight: 25, deliverables: "3D views of key areas\nFinishes, fixtures and signage direction\nLighting concept" },
      { id: "wd", name: "Working drawings and services coordination", weight: 25, deliverables: "Joinery, ceiling, flooring and wall drawings\nElectrical, lighting and plumbing layouts\nCoordination with kitchen, HVAC and other specialists" },
      { id: "site", name: "Fit-out design observation and handover", weight: 15, deliverables: "Periodic design observation visits (number as agreed)\nClarifications for the fit-out contractor\nSnag list at handover" },
    ],
    levels: [
      { name: "Essential", stageIds: ["brief", "concept", "dd"] },
      { name: "Standard", stageIds: ["brief", "concept", "dd", "wd"] },
      { name: "Full", stageIds: ["brief", "concept", "dd", "wd", "site"] },
    ],
  },
];
const templateById = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
const lines = (s) => String(s || "").split("\n").map((l) => l.trim()).filter(Boolean);

export const blankProposal = (templateId, from = {}) => {
  const t = templateById(templateId);
  return {
    template: t.id,
    status: "draft",
    issueDate: today(),
    validUntil: addDays(today(), 30),
    title: from.title || `${t.label} proposal`,
    stages: t.stages.map((s) => ({ ...s })),
    levels: t.levels.map((l) => ({ ...l, feeRupees: "", visits: "" })),
    exclusions: COMMON_EXCLUSIONS.join("\n"),
    assumptions: COMMON_ASSUMPTIONS.join("\n"),
    responsibilities: COMMON_RESPONSIBILITIES.join("\n"),
    terms: COMMON_TERMS.join("\n"),
    ...from,
  };
};

// Split a level's fee across the stages it includes, by stage weight. Shares are
// whole percentages that always total 100 (largest-remainder rounding), and the
// last stage takes any rupee rounding so the amounts add up to the fee exactly.
export const paymentSchedule = (proposal, level) => {
  const fee = Math.round(Number(level.feeRupees) || 0);
  const stages = proposal.stages.filter((s) => level.stageIds.includes(s.id));
  if (!stages.length) return [];
  const weights = stages.map((s) => Math.max(0, Number(s.weight) || 0));
  const total = weights.reduce((n, w) => n + w, 0);
  const raw = weights.map((w) => (total ? (w / total) * 100 : 100 / stages.length));
  const percents = raw.map(Math.floor);
  let left = 100 - percents.reduce((n, p) => n + p, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { percents[i] += 1; left -= 1; } });
  let allocated = 0;
  return stages.map((s, i) => {
    const amount = i === stages.length - 1 ? fee - allocated : Math.round((fee * percents[i]) / 100);
    allocated += amount;
    return { stage: s, percent: percents[i], amount };
  });
};

const pricedLevels = (p) => (p.levels || []).filter((l) => Number(l.feeRupees) > 0 && l.stageIds.length);

// ---------------------------------------------------------------------------
// Printable proposal

const fmtDay = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "");
const rupee = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const ul = (s) => `<ul>${lines(s).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;

export const printableProposal = (p, company = {}) => {
  const levels = pricedLevels(p);
  const tick = (level, stage) => (level.stageIds.includes(stage.id) ? "&#10003;" : "&ndash;");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Proposal · ${esc(p.title)}</title>
<style>
@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:13px/1.55 Inter,Helvetica,Arial,sans-serif;color:#1a1a1a;margin:0;padding:24px;max-width:860px}
.top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #380100;padding-bottom:14px;margin-bottom:18px}
.brand{display:flex;gap:12px;align-items:center}.brand img{width:54px;height:54px}.brand b{font:700 18px "Space Grotesk",Helvetica,sans-serif;letter-spacing:.04em}
h1{font:700 24px "Space Grotesk",Helvetica,sans-serif;margin:0 0 4px}h2{font:700 15px "Space Grotesk",Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#380100;margin:26px 0 8px;break-after:avoid}
h3{font-size:14px;margin:14px 0 4px}.muted{color:#666}ul{margin:4px 0 0;padding-left:18px}li{margin:2px 0}
table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#f4f0ec;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
th,td{padding:7px 10px;border-bottom:1px solid #e5e0da;vertical-align:top}td.c,th.c{text-align:center}td.n,th.n{text-align:right;white-space:nowrap}
.fee{font:700 15px "Space Grotesk",Helvetica,sans-serif}.sign{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:28px}.sign div{border-top:1px solid #999;padding-top:6px}
.choose{margin-top:10px}.choose span{display:inline-block;border:1px solid #999;width:14px;height:14px;vertical-align:-2px;margin:0 6px 0 14px}
@media print{body{padding:0}.noprint{display:none}h2{break-after:avoid}table,.sign{break-inside:avoid}}
</style></head><body>
<p class="noprint"><button onclick="print()" style="padding:8px 16px;font:inherit;cursor:pointer">Print / Save as PDF</button></p>
<div class="top"><div class="brand"><img src="${location.origin}/brand/vs-mark-maroon.png" alt=""><div><b>${esc(company.legalName || "VANILLA & SOMETHIN'")}</b><div class="muted">${esc(company.address || "")}</div>
<div class="muted">${[company.phone, company.email].filter(Boolean).map(esc).join(" · ")}</div></div></div>
<div style="text-align:right"><b>Proposal</b><br>${esc(fmtDay(p.issueDate))}${p.validUntil ? `<br><span class="muted">Valid until ${esc(fmtDay(p.validUntil))}</span>` : ""}</div></div>
<h1>${esc(p.title)}</h1>
<p><b>Prepared for:</b> ${esc(p.clientName || "")}${p.siteLocation ? ` · <b>Site:</b> ${esc(p.siteLocation)}` : ""}${p.timeline ? ` · <b>Indicative timeline:</b> ${esc(p.timeline)}` : ""}</p>
${p.summary ? `<p>${esc(p.summary).replace(/\n/g, "<br>")}</p>` : ""}

<h2>Scope levels</h2>
<p class="muted">Choose the level that fits your project. Each level includes the stages ticked below.</p>
<table><thead><tr><th>Stage</th>${levels.map((l) => `<th class="c">${esc(l.name)}</th>`).join("")}</tr></thead><tbody>
${p.stages.filter((s) => levels.some((l) => l.stageIds.includes(s.id))).map((s) => `<tr><td>${esc(s.name)}</td>${levels.map((l) => `<td class="c">${tick(l, s)}</td>`).join("")}</tr>`).join("")}
${levels.some((l) => l.visits) ? `<tr><td><b>Design observation site visits</b></td>${levels.map((l) => `<td class="c">${esc(l.visits || "–")}</td>`).join("")}</tr>` : ""}
<tr><td><b>Professional fee (excluding GST)</b></td>${levels.map((l) => `<td class="c fee">${rupee(l.feeRupees)}</td>`).join("")}</tr>
</tbody></table>

<h2>Deliverables by stage</h2>
${p.stages.filter((s) => levels.some((l) => l.stageIds.includes(s.id))).map((s) => `<h3>${esc(s.name)}</h3>${ul(s.deliverables)}`).join("")}

<h2>Payment schedule</h2>
${levels.map((l) => `<h3>${esc(l.name)} · ${rupee(l.feeRupees)} + GST</h3><table><thead><tr><th>Stage payment, due on completion of</th><th class="n">Share</th><th class="n">Amount (₹)</th></tr></thead><tbody>
${paymentSchedule(p, l).map((r, i) => `<tr><td>${i === 0 ? `${esc(r.stage.name)} (payable on appointment)` : esc(r.stage.name)}</td><td class="n">${r.percent}%</td><td class="n">${Math.round(r.amount).toLocaleString("en-IN")}</td></tr>`).join("")}
</tbody></table>`).join("")}

<h2>Not included</h2>${ul(p.exclusions)}
<h2>Assumptions</h2>${ul(p.assumptions)}
<h2>What we need from you</h2>${ul(p.responsibilities)}
<h2>Terms</h2>${ul(p.terms)}

<h2>Acceptance</h2>
<p>To appoint us, sign below, tick the scope level you choose and return a copy with the first stage payment.</p>
<p class="choose">Scope level:${levels.map((l) => `<span></span>${esc(l.name)}`).join("")}</p>
<div class="sign"><div>For ${esc(company.legalName || "Vanilla & Somethin'")}<br><span class="muted">Name, signature and date</span></div><div>Client: ${esc(p.clientName || "")}<br><span class="muted">Name, signature and date</span></div></div>
</body></html>`;
};

const openPrint = (p) => {
  if (!pricedLevels(p).length) { toast("Enter a fee for at least one scope level before printing.", { error: true }); return; }
  const w = window.open("", "_blank");
  if (!w) { toast("Allow pop-ups to open the printable proposal.", { error: true }); return; }
  w.document.write(printableProposal(p, data.settings.company || {}));
  w.document.close();
};

// ---------------------------------------------------------------------------
// Lifecycle actions

const leadOf = (p) => (p.leadId ? data.leads.find((l) => l.id === p.leadId) : null);
const logOnLead = (p, text, extra = {}) => {
  const lead = leadOf(p);
  if (!lead) return;
  const activities = [...(lead.activities || []), { id: uid("ac_"), type: "proposal", notes: text.slice(0, 400), at: new Date().toISOString(), by: meName(), dueAt: extra.nextActionAt || "" }].slice(-40);
  put("leads", { ...lead, ...extra, activities, lastContactAt: new Date().toISOString() });
};

export const markSent = (p) => {
  if (!pricedLevels(p).length) { toast("Enter a fee for at least one scope level first.", { error: true }); return; }
  const followUp = addDays(today(), FOLLOW_UP_DAYS);
  put("proposals", { ...p, status: "sent", sentAt: today() });
  const lead = leadOf(p);
  logOnLead(p, `Proposal sent: ${p.title}`, {
    ...(lead && ["new", "contacted"].includes(lead.stage) ? { stage: "pitched", stageAt: new Date().toISOString() } : {}),
    nextActionAt: followUp, nextAction: "Follow up on proposal",
  });
  note(`sent proposal ${p.title}`, { type: "proposal", id: p.id });
  toast(`Marked as sent. Follow-up set for ${fmtDate(followUp)}.`);
  app.render();
};

const markAccepted = (p, level) => {
  put("proposals", { ...p, status: "accepted", acceptedLevel: level.name, acceptedAt: today() });
  logOnLead(p, `Proposal accepted: ${level.name} level, ${rupee(level.feeRupees)} + GST`, { nextActionAt: today(), nextAction: "Raise first stage invoice and appointment letter" });
  note(`proposal ${p.title} accepted (${level.name})`, { type: "proposal", id: p.id });
  toast("Accepted. Turn it into a GST quote from the proposal menu.");
  app.render();
};

const markLost = (p) => {
  put("proposals", { ...p, status: "lost" });
  logOnLead(p, `Proposal not accepted: ${p.title}`);
  app.render();
};

// A GST quote in Billing, one line per payment stage of the chosen level.
export const toQuote = (p) => {
  const level = (p.levels || []).find((l) => l.name === p.acceptedLevel) || pricedLevels(p)[0];
  if (!level) { toast("Enter a fee for a scope level first.", { error: true }); return; }
  const client = clientById(p.clientId);
  const lead = leadOf(p);
  openDoc(null, {
    kind: "quote",
    buyerName: client ? client.company || client.name : lead ? lead.company : p.clientName || "",
    contactName: client ? client.name : lead?.contactName || "",
    phone: client?.phone || lead?.phone || "",
    email: client?.email || lead?.email || "",
    notes: `${p.title}. ${level.name} scope level as per proposal dated ${fmtDay(p.issueDate)}. Each stage is invoiced on completion.`,
    lines: paymentSchedule(p, level).map((r) => ({ description: `${r.stage.name} (${r.percent}% of fee)`, qty: 1, unit: "stage", ratePaise: Math.round(r.amount * 100) })),
  });
};

// ---------------------------------------------------------------------------
// Editor

export const openProposal = (id, defaults = {}) => {
  const existing = id ? data.proposals.find((p) => p.id === id) : null;
  let p = existing ? JSON.parse(JSON.stringify(existing)) : blankProposal(defaults.template, defaults);

  const leadOptions = data.leads.map((l) => ({ id: l.id, label: `${l.company}${l.contactName ? ` · ${l.contactName}` : ""}` }));
  const clientOptions = data.clients.map((c) => ({ id: c.id, label: c.company ? `${c.name} · ${c.company}` : c.name }));

  openDrawer({
    title: existing ? existing.title : "New proposal",
    subtitle: existing ? `${esc(statusOf(existing).label)}${existing.sentAt ? ` · sent ${fmtDate(existing.sentAt)}` : ""}` : "Fees are entered by you. Templates are a starting point to edit.",
    spec: [
      { key: "title", label: "Proposal title", type: "text", required: true },
      { key: "template", label: "Template", type: "select", options: TEMPLATES.map((t) => ({ id: t.id, label: t.label })), half: true },
      { key: "status", label: "Status", type: "select", options: PROPOSAL_STATUS, half: true },
      { key: "leadId", label: "CRM lead", type: "select", options: leadOptions, blank: "–", half: true },
      { key: "clientId", label: "Client", type: "select", options: clientOptions, blank: "–", half: true },
      { key: "clientName", label: "Prepared for (name on the proposal)", type: "text", half: true },
      { key: "siteLocation", label: "Site location", type: "text", half: true },
      { key: "issueDate", label: "Date", type: "date", half: true },
      { key: "validUntil", label: "Valid until", type: "date", half: true },
      { key: "timeline", label: "Indicative timeline", type: "text", placeholder: "e.g. 10 to 12 weeks to working drawings" },
      { key: "summary", label: "Project summary (from the discovery call)", type: "textarea", rows: 3, placeholder: "What the client wants, the site and the main constraints, in their words." },
      { key: "exclusions", label: "Not included (one per line)", type: "textarea", rows: 6 },
      { key: "assumptions", label: "Assumptions (one per line)", type: "textarea", rows: 3 },
      { key: "responsibilities", label: "What we need from the client (one per line)", type: "textarea", rows: 4 },
      { key: "terms", label: "Terms (one per line)", type: "textarea", rows: 7 },
    ],
    values: p,
    after: `<section class="proposal-scope" data-scope></section>`,
    bind: (root) => {
      const box = $("[data-scope]", root);
      const draw = () => {
        box.innerHTML = `<h3>Scope levels and fees</h3>
          <p class="muted small">Enter your fee for each level. Leave a level's fee empty to leave it out of the proposal. The payment schedule splits each fee by the stage weights below.</p>
          <div class="proposal-levels">${p.levels.map((l, li) => `<div class="proposal-level">
            <input type="text" data-level-name="${li}" value="${esc(l.name)}" aria-label="Level name">
            <label class="small">Fee (₹, excl. GST)<input type="number" min="0" step="1000" data-level-fee="${li}" value="${esc(l.feeRupees)}"></label>
            <label class="small">Site visits<input type="text" data-level-visits="${li}" value="${esc(l.visits || "")}" placeholder="e.g. 6 visits"></label>
            <div class="small">${p.stages.map((s) => `<label style="display:block"><input type="checkbox" data-level-stage="${li}" value="${esc(s.id)}" ${l.stageIds.includes(s.id) ? "checked" : ""}> ${esc(s.name)}</label>`).join("")}</div>
            <div class="muted small" data-sched="${li}"></div></div>`).join("")}</div>
          <h3>Stages and deliverables</h3>
          ${p.stages.map((s, si) => `<div class="proposal-stage"><div style="display:flex;gap:8px"><input type="text" data-stage-name="${si}" value="${esc(s.name)}" style="flex:1" aria-label="Stage name"><label class="small">Weight <input type="number" min="0" max="100" data-stage-weight="${si}" value="${esc(s.weight)}" style="width:64px"></label></div>
            <textarea rows="3" data-stage-del="${si}" aria-label="Deliverables for ${esc(s.name)}">${esc(s.deliverables)}</textarea></div>`).join("")}`;
        drawSchedules();
      };
      const drawSchedules = () => p.levels.forEach((l, li) => {
        const el = $(`[data-sched="${li}"]`, box);
        if (el) el.textContent = Number(l.feeRupees) > 0 ? paymentSchedule(p, l).map((r) => `${r.stage.name} ${r.percent}% = ${rupee(r.amount)}`).join(" · ") : "No fee entered: not included in the proposal.";
      });
      draw();
      box.addEventListener("input", (e) => {
        const t = e.target, d = t.dataset;
        if (d.levelName) p.levels[d.levelName].name = t.value;
        else if (d.levelFee) p.levels[d.levelFee].feeRupees = t.value;
        else if (d.levelVisits) p.levels[d.levelVisits].visits = t.value;
        else if (d.stageName) p.stages[d.stageName].name = t.value;
        else if (d.stageWeight) p.stages[d.stageWeight].weight = Number(t.value) || 0;
        else if (d.stageDel) p.stages[d.stageDel].deliverables = t.value;
        drawSchedules();
      });
      box.addEventListener("change", (e) => {
        const d = e.target.dataset;
        if (!d.levelStage) return;
        const l = p.levels[d.levelStage];
        l.stageIds = e.target.checked ? p.stages.map((s) => s.id).filter((sid) => sid === e.target.value || l.stageIds.includes(sid)) : l.stageIds.filter((sid) => sid !== e.target.value);
        drawSchedules();
      });
      const tpl = $('[data-key="template"]', root);
      tpl?.addEventListener("change", () => {
        const t = templateById(tpl.value);
        p.stages = t.stages.map((s) => ({ ...s }));
        p.levels = t.levels.map((l, i) => ({ ...l, feeRupees: p.levels[i]?.feeRupees || "", visits: p.levels[i]?.visits || "" }));
        draw();
      });
      const leadSel = $('[data-key="leadId"]', root);
      leadSel?.addEventListener("change", () => {
        const lead = data.leads.find((l) => l.id === leadSel.value);
        if (!lead) return;
        const set = (k, v) => { const el = $(`[data-key="${k}"]`, root); if (el && v && !el.value) el.value = v; };
        set("clientName", lead.contactName || lead.company); set("siteLocation", lead.city); set("summary", [lead.discoveryCallOutcome, lead.clientConcerns].filter(Boolean).join("\n"));
        if (lead.clientId) { const c = $('[data-key="clientId"]', root); if (c && !c.value) c.value = lead.clientId; }
      });
    },
    saveLabel: existing ? "Save changes" : "Create proposal",
    onSave: (out) => {
      const levels = p.levels.map((l) => ({ name: String(l.name || "").trim().slice(0, 40) || "Level", stageIds: l.stageIds, feeRupees: Number(l.feeRupees) > 0 ? Math.round(Number(l.feeRupees)) : "", visits: String(l.visits || "").slice(0, 40) }));
      const stages = p.stages.map((s) => ({ id: s.id, name: String(s.name || "").trim().slice(0, 80), weight: Math.max(0, Number(s.weight) || 0), deliverables: String(s.deliverables || "").slice(0, 1200) }));
      const proposal = { ...(existing || { id: uid("pr_") }), ...out, stages, levels };
      if (proposal.status === "sent" && !proposal.sentAt) proposal.sentAt = today();
      put("proposals", proposal);
      if (!existing) {
        note(`drafted proposal ${proposal.title}`, { type: "proposal", id: proposal.id });
        logOnLead(proposal, `Proposal drafted: ${proposal.title}`);
      }
      app.render();
    },
    onDelete: existing && existing.status === "draft" ? () => { del("proposals", existing.id); app.render(); } : null,
    deleteLabel: "Delete draft",
  });
};

// From a CRM lead: prefill everything the discovery call captured.
export const proposalFromLead = (lead) => {
  const type = String(lead.projectType || "").toLowerCase();
  const template = /cafe|restaurant|retail|shop|office|commercial|salon|clinic|showroom/.test(type) ? "commercial_interiors"
    : /renovat/.test(type) ? "renovation" : /interior|apartment|flat/.test(type) ? "home_interiors" : "new_home";
  openProposal(null, {
    template,
    leadId: lead.id,
    clientId: lead.clientId || "",
    clientName: lead.contactName || lead.company,
    siteLocation: lead.city || "",
    title: `${templateById(template).label} proposal for ${lead.contactName || lead.company}`,
    summary: [lead.discoveryCallOutcome, lead.clientConcerns].filter(Boolean).join("\n"),
  });
};

// ---------------------------------------------------------------------------
// Page

const ui = { status: "" };

export const renderProposals = (view) => {
  const list = () => data.proposals.filter((p) => !ui.status || p.status === ui.status).sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""));
  const sent = data.proposals.filter((p) => ["sent", "accepted", "lost"].includes(p.status));
  const accepted = data.proposals.filter((p) => p.status === "accepted");
  const awaiting = data.proposals.filter((p) => p.status === "sent");
  const acceptedValue = accepted.reduce((n, p) => n + Number(((p.levels || []).find((l) => l.name === p.acceptedLevel) || {}).feeRupees || 0), 0);
  const root = mount(view, `
    <div class="page-head"><div><h1>Proposals</h1><p>Written scope and fee proposals from a standard template: deliverables, three scope levels, exclusions, payment stages and terms. You set every fee.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} New proposal</button></div></div>
    <div class="kpis money">
      <div class="kpi"><span class="k">Awaiting reply</span><b>${awaiting.length}</b><span class="small muted">sent, not yet decided</span></div>
      <div class="kpi"><span class="k">Acceptance rate</span><b>${sent.length ? `${Math.round((accepted.length / sent.length) * 100)}%` : "–"}</b><span class="small muted">${accepted.length} of ${sent.length} sent</span></div>
      <div class="kpi"><span class="k">Accepted fees</span><b>${inr(acceptedValue * 100)}</b><span class="small muted">excl. GST, all time</span></div>
    </div>
    <div class="toolbar"><select data-status aria-label="Status">${optionsHTML(PROPOSAL_STATUS, ui.status, { blank: "All statuses" })}</select></div>
    <div data-body></div>`);
  const body = $("[data-body]", root);
  const draw = () => {
    const rows = list();
    body.innerHTML = rows.length ? `<table class="table"><thead><tr><th>Proposal</th><th>For</th><th>Date</th><th>Levels</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((p) => {
      const st = statusOf(p);
      const lv = pricedLevels(p).map((l) => `${esc(l.name)} ${rupee(l.feeRupees)}`).join(" · ") || '<span class="muted">No fees yet</span>';
      return `<tr class="clickable" data-proposal="${p.id}"><td><b>${esc(p.title)}</b></td><td>${esc(p.clientName || "")}</td><td>${fmtDate(p.issueDate, { year: true })}</td><td class="small">${lv}</td><td>${pill(p.status === "accepted" && p.acceptedLevel ? `Accepted · ${p.acceptedLevel}` : st.label, st.tone)}</td><td><button class="icon-btn" data-menu="${p.id}" aria-label="Actions">${icon("more", 16)}</button></td></tr>`;
    }).join("")}</tbody></table>`
      : emptyState({ iconName: "file", title: "No proposals yet", text: "Create one from a CRM lead after the discovery call. The template fills in scope, exclusions and terms; you add the fees." });
  };
  draw();
  root.addEventListener("change", (e) => { if (e.target.matches("[data-status]")) { ui.status = e.target.value; draw(); } });
  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) {
      const open = data.leads.filter((l) => ["new", "contacted", "pitched", "negotiating"].includes(l.stage));
      if (!open.length) return openProposal(null);
      return openMenu(t.closest("[data-new]"), [
        ...open.slice(0, 12).map((l) => ({ label: `For lead: ${l.company}`, onClick: () => proposalFromLead(l) })),
        "-",
        { label: "Blank proposal", onClick: () => openProposal(null) },
      ]);
    }
    const menu = t.closest("[data-menu]");
    if (menu) {
      const p = data.proposals.find((x) => x.id === menu.dataset.menu);
      const items = [{ label: "Open / edit", onClick: () => openProposal(p.id) }, { label: "Print or save as PDF", onClick: () => openPrint(p) }];
      if (p.status === "draft") items.push({ label: "Mark as sent (sets a follow-up)", onClick: () => markSent(p) });
      if (["draft", "sent"].includes(p.status)) {
        items.push("-", ...pricedLevels(p).map((l) => ({ label: `Accepted: ${l.name}`, onClick: () => markAccepted(p, l) })), { label: "Not accepted", onClick: () => markLost(p) });
      }
      if (p.status === "accepted") items.push({ label: "Turn into GST quote", onClick: () => toQuote(p) });
      if (p.leadId) items.push("-", { label: "Open CRM lead", onClick: () => { location.hash = "#/crm"; } });
      return openMenu(menu, items);
    }
    const row = t.closest("[data-proposal]");
    if (row) openProposal(row.dataset.proposal);
  });
};
