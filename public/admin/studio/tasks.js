// Tasks: the same data as a Board (drag between columns), a List grouped by
// due date, or a Calendar. Used on the Tasks page and inside each project.

import { $, $$, uid, app } from "../core.js";
import {
  data, put, del, note, today, addDays, isoDate, meId, member, team,
  TASK_STATUS, PRIORITY, isDone, isOverdue, projectById, activeProjects,
} from "./data.js";
import { icon, esc, avatar, pill, fmtDate, relDue, optionsHTML, openDrawer, emptyState, timeAgo } from "./ui.js";

const orderOf = (t) => (typeof t.order === "number" ? t.order : Date.parse(t.createdAt) || 0);
const priorityTone = (id) => (PRIORITY.find((p) => p.id === id) || {}).tone || "mute";

// ---------------------------------------------------------------------------
// Create / edit a task

export const openTask = (id, defaults = {}) => {
  const existing = id ? data.tasks.find((t) => t.id === id) : null;
  const values = existing || { status: "todo", priority: "med", checklist: [], labels: [], ...defaults };
  openDrawer({
    title: existing ? "Edit task" : "New task",
    subtitle: existing ? `Created ${timeAgo(existing.createdAt)}${existing.updatedAt ? ` · updated ${timeAgo(existing.updatedAt)}` : ""}` : "",
    spec: [
      { key: "title", label: "Task", type: "text", required: true, placeholder: "What needs to happen?" },
      { key: "description", label: "Notes", type: "textarea", rows: 3, placeholder: "Details, links, decisions…" },
      { key: "status", label: "Status", type: "select", options: TASK_STATUS, half: true },
      { key: "priority", label: "Priority", type: "select", options: PRIORITY, half: true },
      { key: "assignee", label: "Assigned to", type: "team", half: true },
      { key: "due", label: "Due date", type: "date", half: true },
      { key: "projectId", label: "Project", type: "select", options: activeProjects().concat(data.projects.filter((p) => p.id === values.projectId && !activeProjects().includes(p))).map((p) => ({ id: p.id, label: p.name })), blank: "No project" },
      { key: "labels", label: "Labels", type: "tags", placeholder: "e.g. drawings, client, site" },
      { key: "checklist", label: "Checklist", type: "checklist", addLabel: "Add a step" },
    ],
    values,
    saveLabel: existing ? "Save changes" : "Create task",
    onSave: (out) => {
      const now = new Date().toISOString();
      const task = {
        ...(existing || { id: uid("tk_"), order: Date.now() }),
        ...out,
        doneAt: out.status === "done" ? (existing && existing.doneAt) || now : null,
      };
      put("tasks", task);
      if (!existing) note(`added task “${task.title}”`, { type: "task", id: task.id });
      else if (existing.status !== "done" && task.status === "done") note(`completed “${task.title}”`, { type: "task", id: task.id });
      app.render();
    },
    onDelete: existing
      ? () => {
          del("tasks", existing.id);
          app.render();
        }
      : null,
  });
};

export const setTaskStatus = (task, status, order) => {
  if (task.status === status && order === undefined) return;
  const now = new Date().toISOString();
  put("tasks", { ...task, status, order: order ?? task.order, doneAt: status === "done" ? task.doneAt || now : null });
  if (task.status !== "done" && status === "done") note(`completed “${task.title}”`, { type: "task", id: task.id });
};

// ---------------------------------------------------------------------------
// Card pieces

const checklistChip = (t) => {
  const items = t.checklist || [];
  if (!items.length) return "";
  const done = items.filter((i) => i.done).length;
  return `<span class="chip ${done === items.length ? "ok" : ""}" title="Checklist">${icon("check", 12)} ${done}/${items.length}</span>`;
};

const dueChip = (t) => {
  const due = relDue(t.due, isDone(t));
  return due.text ? `<span class="chip ${due.tone}" title="Due ${esc(fmtDate(t.due, { year: true }))}">${icon("calendar", 12)} ${esc(due.text)}</span>` : "";
};

const projectChip = (t) => {
  const p = projectById(t.projectId);
  return p ? `<span class="chip proj" title="${esc(p.name)}">${esc(p.name)}</span>` : "";
};

const taskCard = (t, { showProject }) => {
  const a = member(t.assignee);
  const top = `${showProject ? projectChip(t) : ""}${t.priority === "urgent" || t.priority === "high" ? pill(t.priority === "urgent" ? "Urgent" : "High", priorityTone(t.priority)) : ""}`;
  return `<article class="card task ${isDone(t) ? "is-done" : ""}" draggable="true" data-id="${t.id}" tabindex="0">
    ${top ? `<div class="card-top">${top}</div>` : ""}
    <h4>${esc(t.title)}</h4>
    <div class="card-meta">${dueChip(t)}${checklistChip(t)}<span class="grow"></span>${a ? avatar(a.name, 24) : ""}</div>
  </article>`;
};

// ---------------------------------------------------------------------------
// Views

const boardHTML = (tasks, opts) => `<div class="board-scroll"><div class="board">${TASK_STATUS.map((s) => {
  const col = tasks.filter((t) => t.status === s.id).sort((a, b) => orderOf(a) - orderOf(b));
  return `<section class="col"><header><span class="dot s-${s.id}"></span><span class="col-title">${s.label}</span><b>${col.length}</b><button type="button" class="icon-btn small" data-add="${s.id}" aria-label="Add task to ${s.label}">${icon("plus", 15)}</button></header>
    <div class="col-body" data-status="${s.id}">${col.map((t) => taskCard(t, opts)).join("") || '<p class="col-empty">Drop tasks here</p>'}</div></section>`;
}).join("")}</div></div>`;

const bucketOf = (t) => {
  if (isDone(t)) return "done";
  if (!t.due) return "none";
  const d = t.due;
  if (d < today()) return "overdue";
  if (d === today()) return "today";
  if (d <= addDays(today(), 7)) return "week";
  return "later";
};

const BUCKETS = [
  ["overdue", "Overdue", "bad"],
  ["today", "Today", "warn"],
  ["week", "Next 7 days", ""],
  ["later", "Later", ""],
  ["none", "No date", ""],
  ["done", "Completed", ""],
];

const listHTML = (tasks, opts) => {
  if (!tasks.length) return "";
  return BUCKETS.map(([id, label, tone]) => {
    const rows = tasks
      .filter((t) => bucketOf(t) === id)
      .sort(id === "done" ? (a, b) => String(b.doneAt || "").localeCompare(String(a.doneAt || "")) : (a, b) => (a.due || "9").localeCompare(b.due || "9") || orderOf(a) - orderOf(b));
    if (!rows.length) return "";
    const collapsed = id === "done" && rows.length > 5 && !ui.showAllDone ? rows.slice(0, 5) : rows;
    return `<section class="group"><h3 class="${tone}">${label} <b>${rows.length}</b></h3><div class="rows">${collapsed
      .map((t) => {
        const a = member(t.assignee);
        return `<div class="trow ${isDone(t) ? "is-done" : ""}" data-id="${t.id}">
          <button type="button" class="check ${isDone(t) ? "on" : ""}" data-toggle="${t.id}" aria-label="${isDone(t) ? "Mark not done" : "Mark done"}">${icon("check", 13)}</button>
          <span class="t-title" data-open="${t.id}">${esc(t.title)}</span>
          ${opts.showProject ? projectChip(t) : ""}
          ${t.priority === "urgent" || t.priority === "high" ? pill(t.priority === "urgent" ? "Urgent" : "High", priorityTone(t.priority)) : ""}
          ${checklistChip(t)}${dueChip(t)}
          <span class="t-who">${a ? avatar(a.name, 24) : ""}</span>
        </div>`;
      })
      .join("")}${rows.length > collapsed.length ? `<button type="button" class="more-note link" data-show-done>Show ${rows.length - collapsed.length} more completed</button>` : ""}</div></section>`;
  }).join("");
};

const calendarHTML = (tasks, month) => {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const start = new Date(y, m - 1, 1 - offset);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = isoDate(d);
    const day = tasks.filter((t) => t.due === iso);
    cells.push(`<div class="day ${d.getMonth() !== m - 1 ? "dim" : ""} ${iso === today() ? "today" : ""}" data-date="${iso}">
      <span class="num">${d.getDate()}</span>
      ${day.slice(0, 3).map((t) => `<button type="button" class="cal-task ${isDone(t) ? "is-done" : ""} p-${t.priority}" data-open="${t.id}" title="${esc(t.title)}">${esc(t.title)}</button>`).join("")}
      ${day.length > 3 ? `<span class="more-note">+${day.length - 3} more</span>` : ""}
    </div>`);
  }
  const title = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return `<div class="cal"><div class="cal-head"><button type="button" class="icon-btn" data-month="-1" aria-label="Previous month">${icon("chevronLeft")}</button><h3>${title}</h3><button type="button" class="icon-btn" data-month="1" aria-label="Next month">${icon("chevronRight")}</button><button type="button" class="btn small ghost" data-month="0">Today</button></div>
    <div class="cal-grid"><div class="dow">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("")}</div>${cells.join("")}</div></div>`;
};

// ---------------------------------------------------------------------------
// Component

const ui = {
  view: localStorage.getItem("vsTasksView") || "board",
  q: "",
  assignee: "",
  project: "",
  priority: "",
  mine: false,
  showAllDone: false,
  month: today().slice(0, 7),
};

export const mountTasks = (container, { projectId = null } = {}) => {
  const fixedProject = projectId;
  const showProject = !fixedProject;

  const visible = () => {
    const q = ui.q.trim().toLowerCase();
    return data.tasks.filter(
      (t) =>
        (!fixedProject || t.projectId === fixedProject) &&
        (!ui.project || t.projectId === ui.project) &&
        (!ui.assignee || t.assignee === ui.assignee) &&
        (!ui.priority || t.priority === ui.priority) &&
        (!ui.mine || t.assignee === meId()) &&
        (!q || `${t.title} ${t.description || ""} ${(t.labels || []).join(" ")}`.toLowerCase().includes(q))
    );
  };

  const filterBar = () => `<div class="toolbar tasks-toolbar">
    <div class="seg" role="tablist">${[["board", "board", "Board"], ["list", "list", "List"], ["calendar", "calendar", "Calendar"]]
      .map(([id, ic, label]) => `<button type="button" role="tab" data-view="${id}" class="${ui.view === id ? "on" : ""}">${icon(ic, 15)}<span>${label}</span></button>`)
      .join("")}</div>
    <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search tasks" value="${esc(ui.q)}"></label>
    ${team().length ? `<select data-filter="assignee" aria-label="Assignee">${optionsHTML(team().map((m) => ({ id: m.id, label: m.name })), ui.assignee, { blank: "Everyone" })}</select>` : ""}
    ${showProject ? `<select data-filter="project" aria-label="Project">${optionsHTML(activeProjects().map((p) => ({ id: p.id, label: p.name })), ui.project, { blank: "All projects" })}</select>` : ""}
    <select data-filter="priority" aria-label="Priority">${optionsHTML(PRIORITY, ui.priority, { blank: "Any priority" })}</select>
    ${meId() ? `<button type="button" class="btn small ${ui.mine ? "primary" : ""}" data-mine>${icon("users", 14)} Mine</button>` : ""}
    <span class="grow"></span>
    <button type="button" class="btn primary" data-new>${icon("plus", 16)} New task</button>
  </div>
  <form class="quick-add" data-quick><input type="text" placeholder="Quick add: type a task and press Enter" aria-label="Quick add task"></form>`;

  container.innerHTML = `${filterBar()}<div class="tasks-body"></div>`;
  const body = $(".tasks-body", container);

  const draw = () => {
    const tasks = visible();
    if (!data.tasks.length || (!tasks.length && ui.view !== "calendar")) {
      body.innerHTML = emptyState({
        iconName: "tasks",
        title: data.tasks.length ? "No tasks match" : "No tasks yet",
        text: data.tasks.length ? "Try clearing a filter." : "Add your first task above. Press Enter to create it.",
      });
      return;
    }
    const opts = { showProject };
    body.innerHTML = ui.view === "list" ? listHTML(tasks, opts) : ui.view === "calendar" ? calendarHTML(tasks, ui.month) : boardHTML(tasks, opts);
  };
  draw();

  const newTask = (extra = {}) => openTask(null, { projectId: fixedProject || ui.project || "", assignee: ui.mine ? meId() : "", ...extra });

  container.addEventListener("click", (e) => {
    const t = e.target;
    const view = t.closest("[data-view]");
    if (view) {
      ui.view = view.dataset.view;
      localStorage.setItem("vsTasksView", ui.view);
      $$("[data-view]", container).forEach((b) => b.classList.toggle("on", b === view));
      return draw();
    }
    if (t.closest("[data-show-done]")) {
      ui.showAllDone = true;
      return draw();
    }
    if (t.closest("[data-new]")) return newTask();
    const add = t.closest("[data-add]");
    if (add) return newTask({ status: add.dataset.add });
    if (t.closest("[data-mine]")) {
      ui.mine = !ui.mine;
      t.closest("[data-mine]").classList.toggle("primary", ui.mine);
      return draw();
    }
    const toggle = t.closest("[data-toggle]");
    if (toggle) {
      const task = data.tasks.find((x) => x.id === toggle.dataset.toggle);
      setTaskStatus(task, isDone(task) ? "todo" : "done");
      return draw();
    }
    const month = t.closest("[data-month]");
    if (month) {
      const step = Number(month.dataset.month);
      const [y, m] = ui.month.split("-").map(Number);
      ui.month = step === 0 ? today().slice(0, 7) : isoDate(new Date(y, m - 1 + step, 1)).slice(0, 7);
      return draw();
    }
    const open = t.closest("[data-open]");
    if (open) return openTask(open.dataset.open);
    const card = t.closest(".card.task");
    if (card) return openTask(card.dataset.id);
    const day = t.closest(".day");
    if (day && !t.closest(".cal-task")) return newTask({ due: day.dataset.date });
  });

  container.addEventListener("keydown", (e) => {
    const card = e.target.closest(".card.task");
    if (card && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openTask(card.dataset.id);
    }
  });

  container.addEventListener("input", (e) => {
    if (e.target.matches("[data-q]")) {
      ui.q = e.target.value;
      draw();
    }
  });
  container.addEventListener("change", (e) => {
    const f = e.target.dataset.filter;
    if (f) {
      ui[f] = e.target.value;
      draw();
    }
  });

  container.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-quick]")) return;
    e.preventDefault();
    const input = $("input", e.target);
    const title = input.value.trim();
    if (!title) return;
    const task = put("tasks", { id: uid("tk_"), title, status: "todo", priority: "med", projectId: fixedProject || ui.project || "", assignee: ui.mine ? meId() : "", checklist: [], labels: [], order: Date.now() });
    note(`added task “${task.title}”`, { type: "task", id: task.id });
    input.value = "";
    draw();
    input.focus();
  });

  // Drag a card between (or within) columns
  let dragging = null;
  container.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card.task");
    if (!card) return;
    dragging = card.dataset.id;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragging);
  });
  container.addEventListener("dragend", () => {
    dragging = null;
    $$(".dragging, .drop-over", container).forEach((el) => el.classList.remove("dragging", "drop-over"));
    $$(".drop-line", container).forEach((el) => el.remove());
  });
  const insertionIndex = (colBody, y) => {
    const cards = $$(".card.task:not(.dragging)", colBody);
    const index = cards.findIndex((c) => {
      const r = c.getBoundingClientRect();
      return y < r.top + r.height / 2;
    });
    return { cards, index: index === -1 ? cards.length : index };
  };
  container.addEventListener("dragover", (e) => {
    const colBody = e.target.closest(".col-body");
    if (!colBody || !dragging) return;
    e.preventDefault();
    $$(".drop-over", container).forEach((el) => el !== colBody && el.classList.remove("drop-over"));
    colBody.classList.add("drop-over");
    $$(".drop-line", container).forEach((el) => el.remove());
    const { cards, index } = insertionIndex(colBody, e.clientY);
    const line = document.createElement("div");
    line.className = "drop-line";
    if (cards[index]) colBody.insertBefore(line, cards[index]);
    else colBody.appendChild(line);
  });
  container.addEventListener("drop", (e) => {
    const colBody = e.target.closest(".col-body");
    if (!colBody || !dragging) return;
    e.preventDefault();
    const task = data.tasks.find((t) => t.id === dragging);
    const status = colBody.dataset.status;
    const siblings = data.tasks
      .filter((t) => t.status === status && t.id !== dragging && visible().includes(t))
      .sort((a, b) => orderOf(a) - orderOf(b));
    const { index } = insertionIndex(colBody, e.clientY);
    const prev = siblings[index - 1];
    const next = siblings[index];
    const order = prev && next ? (orderOf(prev) + orderOf(next)) / 2 : prev ? orderOf(prev) + 1000 : next ? orderOf(next) - 1000 : Date.now();
    setTaskStatus(task, status, order);
    dragging = null;
    draw();
  });
};

// The Tasks page
export const renderTasksPage = (root) => {
  root.innerHTML = `<div class="page-head"><div><h1>Tasks</h1><p>Everything the team needs to do, across all projects. Drag cards between columns, or switch to List or Calendar.</p></div></div><div class="tasks-host"></div>`;
  mountTasks($(".tasks-host", root));
};
