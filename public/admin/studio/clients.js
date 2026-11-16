// Clients and onboarding: a pipeline from first enquiry to kick-off, a
// checklist per client, a private brief-form link the client fills in
// themselves, and one-click creation of a project from that brief.

import { $, $$, uid, app, studioApi, toast } from "../core.js";
import {
  data, put, del, note, today, daysBetween, meName, member, team,
  ONBOARDING, CLIENT_SOURCES, PROJECT_TYPES, checklistProgress, isCheckDone, hasNewBrief, briefOf, clientById, projectById,
} from "./data.js";
import { icon, esc, avatar, pill, ring, fmtDate, timeAgo, optionsHTML, openDrawer, openMenu, confirmBox, emptyState, mount, copyText } from "./ui.js";
import { openProject } from "./projects.js";

const STAGE_ALL = [...ONBOARDING, { id: "active", label: "Active client" }, { id: "lost", label: "Not proceeding" }];
const stageLabel = (id) => (STAGE_ALL.find((s) => s.id === id) || {}).label || id;
const inPipeline = (c) => ONBOARDING.some((s) => s.id === c.stage);

export const onboardingLink = (clientId) => {
  const info = data.tokens[clientId];
  return info ? `${location.origin}/onboard/?t=${info.token}` : "";
};

// ---------------------------------------------------------------------------
// Create / edit

export const openClient = (id, defaults = {}) => {
  const existing = id ? clientById(id) : null;
  openDrawer({
    title: existing ? "Edit client" : "New client",
    spec: [
      { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Mr. Rahim K" },
      { key: "company", label: "Company (optional)", type: "text" },
      { key: "email", label: "Email", type: "text", half: true },
      { key: "phone", label: "Phone", type: "text", half: true },
      { key: "location", label: "Based in / project location", type: "text", half: true },
      { key: "source", label: "How they found us", type: "select", options: CLIENT_SOURCES, blank: "–", half: true },
      { key: "projectType", label: "Looking for", type: "text", list: PROJECT_TYPES, half: true },
      { key: "owner", label: "Handled by", type: "team", half: true },
      { key: "stage", label: "Stage", type: "select", options: STAGE_ALL },
      { key: "notes", label: "Notes", type: "textarea", rows: 4, placeholder: "First impressions, requirements, anything to remember" },
    ],
    values: existing || { stage: "enquiry", owner: "", ...defaults },
    saveLabel: existing ? "Save changes" : "Add client",
    onSave: (out) => {
      const client = { ...(existing || { id: uid("cl_"), checks: {} }), ...out };
      if (!existing || existing.stage !== client.stage) client.stageAt = new Date().toISOString();
      put("clients", client);
      if (!existing) {
        note(`added client ${client.name}`, { type: "client", id: client.id });
        location.hash = `#/clients/${client.id}`;
      }
      app.render();
    },
    onDelete: existing ? () => removeClient(existing) : null,
    deleteLabel: "Delete client",
  });
};

const removeClient = (client) => {
  del("clients", client.id);
  studioApi({ action: "token.revoke", clientId: client.id }).catch(() => {});
  studioApi({ action: "brief.del", clientId: client.id }).catch(() => {});
  delete data.tokens[client.id];
  data.briefs = data.briefs.filter((b) => b.id !== client.id);
  data.projects.filter((p) => p.clientId === client.id).forEach((p) => put("projects", { ...p, clientId: "" }));
  location.hash = "#/clients";
  app.render();
};

const setStage = (client, stage) => {
  if (client.stage === stage) return;
  put("clients", { ...client, stage, stageAt: new Date().toISOString() });
  note(`moved ${client.name} to ${stageLabel(stage)}`, { type: "client", id: client.id });
};

// ---------------------------------------------------------------------------
// List page: onboarding pipeline + everyone

const ui = { view: "pipeline", q: "", stage: "" };

const clientCard = (c) => {
  const p = checklistProgress(c);
  const owner = member(c.owner);
  const days = c.stageAt ? daysBetween(c.stageAt.slice(0, 10), today()) : null;
  return `<article class="card client" draggable="true" data-id="${c.id}" tabindex="0">
    ${hasNewBrief(c) ? `<div class="card-top">${pill("New brief", "ok")}</div>` : ""}
    <h4>${esc(c.name)}</h4>
    <p class="muted small">${[esc(c.projectType || ""), esc(c.location || "")].filter(Boolean).join(" · ") || "&nbsp;"}</p>
    <div class="card-meta">${p.total ? `<span class="chip ${p.done === p.total ? "ok" : ""}">${icon("check", 12)} ${p.done}/${p.total}</span>` : ""}${days !== null && days >= 7 ? `<span class="chip warn" title="Days in this stage">${icon("clock", 12)} ${days}d</span>` : ""}${c.source ? `<span class="chip">${esc(c.source)}</span>` : ""}<span class="grow"></span>${owner ? avatar(owner.name, 24) : ""}</div>
  </article>`;
};

const pipelineHTML = (list) => {
  const pipeline = list.filter(inPipeline);
  return `<div class="board-scroll"><div class="board stages" style="grid-template-columns:${ONBOARDING.map((s) => (pipeline.some((c) => c.stage === s.id) ? "262px" : "132px")).join(" ")}">${ONBOARDING.map((s) => {
    const col = pipeline.filter((c) => c.stage === s.id);
    return `<section class="col ${col.length ? "" : "slim"}"><header><span class="col-title">${s.label}</span><b>${col.length}</b></header><div class="col-body" data-stage="${s.id}">${col.map(clientCard).join("") || '<p class="col-empty">–</p>'}</div></section>`;
  }).join("")}</div></div>`;
};

const tableHTML = (list) =>
  `<section class="panel flush"><div class="table-wrap"><table class="table"><thead><tr><th>Client</th><th>Stage</th><th>Looking for</th><th>Onboarding</th><th>Source</th><th>Projects</th><th>Added</th></tr></thead><tbody>${list
    .map((c) => {
      const p = checklistProgress(c);
      const projects = data.projects.filter((x) => x.clientId === c.id);
      return `<tr data-go="#/clients/${c.id}"><td><b>${esc(c.name)}</b>${hasNewBrief(c) ? ` ${pill("New brief", "ok")}` : ""}<span class="muted small block">${esc(c.company || c.email || "")}</span></td><td>${esc(stageLabel(c.stage))}</td><td>${esc(c.projectType || "–")}</td><td>${p.total ? `${p.done}/${p.total}` : "–"}</td><td>${esc(c.source || "–")}</td><td>${projects.length || '<span class="muted">0</span>'}</td><td class="muted">${esc(fmtDate((c.createdAt || "").slice(0, 10)))}</td></tr>`;
    })
    .join("")}</tbody></table></div></section>`;

export const renderClients = (view) => {
  const visible = () => {
    const q = ui.q.trim().toLowerCase();
    return data.clients.filter((c) => (!ui.stage || c.stage === ui.stage) && (!q || `${c.name} ${c.company || ""} ${c.email || ""} ${c.location || ""}`.toLowerCase().includes(q)));
  };
  const counts = {
    pipeline: data.clients.filter(inPipeline).length,
    active: data.clients.filter((c) => c.stage === "active").length,
    lost: data.clients.filter((c) => c.stage === "lost").length,
  };

  const root = mount(view, `
    <div class="page-head"><div><h1>Clients</h1><p>${counts.pipeline} in onboarding · ${counts.active} active · ${counts.lost} not proceeding. Send a client their private brief link and watch them move through to kick-off.</p></div>
      <div class="head-actions"><button class="btn primary" data-new>${icon("plus", 16)} New client</button></div></div>
    <div class="toolbar">
      <div class="seg">${[["pipeline", "board", "Onboarding"], ["all", "table", "All clients"]].map(([id, ic, l]) => `<button type="button" data-view="${id}" class="${ui.view === id ? "on" : ""}">${icon(ic, 15)}<span>${l}</span></button>`).join("")}</div>
      <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search clients" value="${esc(ui.q)}"></label>
      <select data-stage-filter aria-label="Stage">${optionsHTML(STAGE_ALL, ui.stage, { blank: "Any stage" })}</select>
    </div>
    <div class="clients-body"></div>`);
  const body = $(".clients-body", root);

  const draw = () => {
    const list = visible();
    if (!data.clients.length) {
      body.innerHTML = emptyState({ iconName: "users", title: "No clients yet", text: "Add an enquiry to start the onboarding pipeline. You can then send the client a private brief form to fill in.", action: '<button class="btn primary" data-new>Add your first client</button>' });
    } else if (!list.length) {
      body.innerHTML = emptyState({ iconName: "search", title: "No clients match", text: "Try clearing the search or stage filter." });
    } else {
      body.innerHTML = ui.view === "all" ? tableHTML(list) : pipelineHTML(list);
    }
  };
  draw();

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new]")) return openClient(null);
    const v = t.closest("[data-view]");
    if (v) {
      ui.view = v.dataset.view;
      $$("[data-view]", root).forEach((b) => b.classList.toggle("on", b === v));
      return draw();
    }
    const card = t.closest(".card.client");
    if (card) location.hash = `#/clients/${card.dataset.id}`;
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
    if (e.target.matches("[data-stage-filter]")) {
      ui.stage = e.target.value;
      draw();
    }
  });
  root.addEventListener("keydown", (e) => {
    const card = e.target.closest(".card.client");
    if (card && e.key === "Enter") location.hash = `#/clients/${card.dataset.id}`;
  });

  let dragging = null;
  root.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card.client");
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
    setStage(clientById(dragging), col.dataset.stage);
    dragging = null;
    draw();
  });
};

// ---------------------------------------------------------------------------
// Client page

const BRIEF_LABELS = [
  ["Contact", [["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["company", "Company"], ["location", "Based in"], ["preferredContact", "Prefers"]]],
  ["Project", [["projectType", "Type"], ["scope", "Services needed"], ["siteAddress", "Site address"], ["hasPlot", "Plot"], ["plotSize", "Plot size"], ["floors", "Floors"], ["household", "Who will use it"]]],
  ["Budget & timing", [["budget", "Budget"], ["timeline", "Timeline"]]],
  ["Vision", [["mustHaves", "Must-haves"], ["styleNotes", "Style & mood"], ["dislikes", "Doesn't like"], ["references", "References"], ["anythingElse", "Anything else"]]],
];

const briefHTML = (client, brief) => {
  const d = brief.data;
  return BRIEF_LABELS.map(([group, fields]) => {
    const rows = fields.filter(([k]) => (Array.isArray(d[k]) ? d[k].length : d[k])).map(([k, label]) => `<div><dt>${label}</dt><dd>${Array.isArray(d[k]) ? d[k].map(esc).join(", ") : esc(d[k]).replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</dd></div>`);
    return rows.length ? `<h4 class="subhead">${group}</h4><dl class="dl">${rows.join("")}</dl>` : "";
  }).join("");
};

const welcomeEmail = (client, link, expires) => {
  const first = String(client.name || "").replace(/^(ar\.|mr\.|mrs\.|ms\.|dr\.)\s*/i, "").split(/\s+/)[0] || "there";
  return `Hi ${first},

Thank you for getting in touch with Vanilla & Somethin. To help us understand your project, could you take 5–10 minutes to fill in this short brief?

${link}

It covers your plot, budget range, timeline and the kind of spaces you're imagining. There are no wrong answers, and you can come back and edit it any time until ${fmtDate(expires.slice(0, 10), { year: true })}.

Looking forward to working with you.

${meName() === "Someone" ? "" : `${meName()}\n`}Vanilla & Somethin`;
};

const generateLink = async (client) => {
  try {
    const info = await studioApi({ action: "token.create", clientId: client.id });
    data.tokens[client.id] = { token: info.token, created: info.created, expires: info.expires };
    if (!(client.checks || {}).brief_sent) put("clients", { ...client, checks: { ...(client.checks || {}), brief_sent: true } });
    app.render();
  } catch (error) {
    toast(esc(error.message), { error: true });
  }
};

export const renderClientDetail = (view, id) => {
  const c = clientById(id);
  if (!c) {
    mount(view, emptyState({ iconName: "users", title: "Client not found", text: "They may have been deleted.", action: '<a class="btn" href="#/clients">Back to clients</a>' }));
    return;
  }
  const items = data.settings.onboardingChecklist || [];
  const progress = checklistProgress(c);
  const brief = briefOf(c.id);
  const link = onboardingLink(c.id);
  const tokenInfo = data.tokens[c.id];
  const projects = data.projects.filter((p) => p.clientId === c.id);
  const owner = member(c.owner);
  const activity = data.activity.filter((a) => a.ref && a.ref.type === "client" && a.ref.id === c.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  const stageIndex = ONBOARDING.findIndex((s) => s.id === c.stage);

  const checklist = ONBOARDING.map((s) => {
    const group = items.filter((i) => i.stage === s.id);
    return group.length ? `<div class="check-group"><h4 class="subhead">${esc(s.label)}</h4>${group.map((i) => {
      const done = isCheckDone(c, i.id);
      const auto = i.id === "brief_received" && Boolean(brief);
      return `<label class="check-item ${done ? "is-done" : ""}"><input type="checkbox" data-check="${esc(i.id)}" ${done ? "checked" : ""} ${auto ? "disabled" : ""}><span>${esc(i.label)}</span>${auto ? '<span class="muted small">automatic</span>' : ""}</label>`;
    }).join("")}</div>` : "";
  }).join("");

  const checklistPanel = `<section class="panel"><div class="panel-row"><h2 class="panel-title">Onboarding checklist</h2>${progress.total ? ring(progress.done, progress.total) : ""}</div>${checklist || '<p class="muted">No checklist items. Add them under Settings.</p>'}</section>`;

  const root = mount(view, `
    <a class="back" href="#/clients">${icon("chevronLeft", 14)} Clients</a>
    <div class="page-head tight"><div class="title-block"><span class="code">${esc(stageLabel(c.stage))}</span><h1>${esc(c.name)}</h1><p>${[esc(c.company || ""), esc(c.projectType || ""), esc(c.location || "")].filter(Boolean).join(" · ")}</p></div>
      <div class="head-actions"><select class="select-pill" data-stage aria-label="Stage">${optionsHTML(STAGE_ALL, c.stage)}</select><button class="btn" data-edit>${icon("edit", 15)} Edit</button><button class="btn icon-only" data-more aria-label="More actions">${icon("more", 18)}</button></div></div>
    ${stageIndex >= 0 ? `<section class="panel"><div class="stepper">${ONBOARDING.map((s, i) => `<button type="button" class="step ${i < stageIndex ? "past" : ""} ${i === stageIndex ? "now" : ""}" data-set-stage="${s.id}"><i>${i < stageIndex ? icon("check", 12) : i + 1}</i><span>${esc(s.label)}</span></button>`).join("")}</div></section>` : ""}
    <div class="two-col">
      <div class="stack">
        ${brief ? "" : checklistPanel}
        <section class="panel"><div class="panel-row"><h2 class="panel-title">Client brief</h2>${brief ? `<span class="muted small">Submitted ${esc(timeAgo(brief.submittedAt))}${brief.version > 1 ? ` · edited ${brief.version - 1}×` : ""}</span>` : ""}</div>
          ${brief ? `${hasNewBrief(c) ? `<div class="banner ok">${icon("sparkle", 16)} New brief received. <button class="btn small" data-seen>Mark as reviewed</button></div>` : ""}${briefHTML(c, brief)}<div class="panel-actions"><button class="btn primary" data-from-brief>${icon("folder", 15)} Create project from brief</button></div>` : '<p class="muted">Nothing yet. Send the client their private link and their answers will appear here.</p>'}
        </section>
        ${brief ? checklistPanel : ""}
        <section class="panel"><h2 class="panel-title">Notes</h2><textarea class="notes" data-notes rows="4" placeholder="Add notes…">${esc(c.notes || "")}</textarea></section>
      </div>
      <div class="stack">
        <section class="panel"><h2 class="panel-title">Contact</h2><dl class="dl">
          ${c.email ? `<div><dt>Email</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>` : ""}${c.phone ? `<div><dt>Phone</dt><dd><a href="tel:${esc(c.phone.replace(/\s+/g, ""))}">${esc(c.phone)}</a></dd></div>` : ""}${c.location ? `<div><dt>Location</dt><dd>${esc(c.location)}</dd></div>` : ""}${c.source ? `<div><dt>Source</dt><dd>${esc(c.source)}</dd></div>` : ""}${owner ? `<div><dt>Handled by</dt><dd><span class="person">${avatar(owner.name, 22)}${esc(owner.name)}</span></dd></div>` : ""}<div><dt>Added</dt><dd>${esc(fmtDate((c.createdAt || "").slice(0, 10), { year: true }))}</dd></div>
        </dl></section>
        <section class="panel"><h2 class="panel-title">Brief form link</h2>
          <p class="muted">A private page where the client fills in their project brief themselves. Only people with this link can open it.</p>
          ${link ? `<div class="copy-field"><input type="text" readonly value="${esc(link)}" aria-label="Brief link"><button class="btn small" data-copy-link>${icon("copy", 14)} Copy</button></div>
            <p class="muted small">Expires ${esc(fmtDate(tokenInfo.expires.slice(0, 10), { year: true }))}${brief ? " · already submitted, they can still edit" : ""}</p>
            <div class="panel-actions"><button class="btn small" data-copy-email>${icon("mail", 14)} Copy welcome email</button>${c.email ? `<a class="btn small" data-mailto href="#">${icon("send", 14)} Open in mail</a>` : ""}<a class="btn small" href="${esc(link)}" target="_blank" rel="noopener">${icon("external", 14)} Preview</a><button class="btn small ghost danger" data-revoke>Revoke</button></div>`
          : `<button class="btn primary" data-gen-link>${icon("link", 15)} Generate private link</button>`}
        </section>
        <section class="panel"><div class="panel-row"><h2 class="panel-title">Projects</h2><button class="btn small" data-new-project>${icon("plus", 14)} Project</button></div>
          ${projects.length ? `<div class="mini-list">${projects.map((p) => `<a class="mini" href="#/projects/${p.id}"><span>${esc(p.name)}</span><span class="muted small">${esc(p.code || "")}</span></a>`).join("")}</div>` : '<p class="muted">No projects yet.</p>'}
        </section>
        <section class="panel"><h2 class="panel-title">Activity</h2>${activity.length ? `<ul class="feed">${activity.map((a) => `<li>${avatar(a.who, 24)}<div><p><b>${esc(a.who)}</b> ${esc(a.text)}</p><span class="muted small">${esc(timeAgo(a.at))}</span></div></li>`).join("")}</ul>` : '<p class="muted">Nothing yet.</p>'}</section>
      </div>
    </div>`);

  root.addEventListener("change", (e) => {
    const check = e.target.dataset.check;
    if (check) {
      put("clients", { ...c, checks: { ...(c.checks || {}), [check]: e.target.checked } });
      return app.render();
    }
    if (e.target.matches("[data-stage]")) {
      setStage(c, e.target.value);
      app.render();
    }
  });

  const notes = $("[data-notes]", root);
  notes.addEventListener("blur", () => {
    if (notes.value.trim() !== (c.notes || "")) put("clients", { ...clientById(c.id), notes: notes.value.trim() });
  });

  root.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("[data-edit]")) return openClient(c.id);
    const step = t.closest("[data-set-stage]");
    if (step) {
      setStage(c, step.dataset.setStage);
      return app.render();
    }
    if (t.closest("[data-gen-link]")) return generateLink(c);
    if (t.closest("[data-copy-link]")) return copyText(link, "Link copied");
    if (t.closest("[data-copy-email]")) return copyText(welcomeEmail(c, link, tokenInfo.expires), "Welcome email copied");
    const mailto = t.closest("[data-mailto]");
    if (mailto) {
      e.preventDefault();
      location.href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent("Your project brief for Vanilla & Somethin")}&body=${encodeURIComponent(welcomeEmail(c, link, tokenInfo.expires))}`;
      return;
    }
    if (t.closest("[data-revoke]")) {
      if (await confirmBox({ title: "Revoke this link?", message: "The client won't be able to open or edit the form with it. Their submitted brief is kept.", confirmLabel: "Revoke", danger: true })) {
        await studioApi({ action: "token.revoke", clientId: c.id });
        delete data.tokens[c.id];
        app.render();
      }
      return;
    }
    if (t.closest("[data-seen]")) {
      put("clients", { ...c, briefSeenAt: new Date().toISOString() });
      return app.render();
    }
    if (t.closest("[data-from-brief]")) {
      const d = brief.data;
      const summary = [d.mustHaves && `Must-haves: ${d.mustHaves}`, d.styleNotes && `Style: ${d.styleNotes}`, d.budget && `Budget: ${d.budget}`, d.timeline && `Timeline: ${d.timeline}`].filter(Boolean).join("\n");
      return openProject(null, {
        name: `${c.name.replace(/^(ar\.|mr\.|mrs\.|ms\.|dr\.)\s*/i, "")} – ${d.projectType || c.projectType || "Project"}`,
        clientId: c.id,
        type: d.projectType || c.projectType || "Residential",
        location: d.siteAddress || d.location || c.location || "",
        area: d.plotSize ? `${d.plotSize} plot` : "",
        lead: c.owner || "",
        summary,
      });
    }
    if (t.closest("[data-new-project]")) return openProject(null, { clientId: c.id, type: c.projectType || "Residential", location: c.location || "", lead: c.owner || "" });
    if (t.closest("[data-more]")) {
      openMenu(t.closest("[data-more]"), [
        { label: "Mark as active client", icon: "check", onClick: () => { setStage(c, "active"); app.render(); } },
        { label: "Not proceeding", icon: "x", onClick: () => { setStage(c, "lost"); app.render(); } },
        "-",
        { label: "Delete client…", icon: "trash", danger: true, onClick: async () => { if (await confirmBox({ title: `Delete ${c.name}?`, message: "Their brief and onboarding link are deleted too. Projects stay, but lose the client link.", confirmLabel: "Delete client", danger: true })) removeClient(c); } },
      ]);
    }
  });
};
