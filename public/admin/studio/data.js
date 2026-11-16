// Studio data: one in-memory copy of everything, edited instantly and saved to
// the server in the background (batched, retried). Another device's changes
// are picked up by polling with per-collection revision numbers.

import { studioApi, uid, toast, clone } from "../core.js";

// ---------------------------------------------------------------------------
// Constants

export const PROJECT_STAGES = [
  { id: "briefing", label: "Briefing" },
  { id: "concept", label: "Concept" },
  { id: "design", label: "Design development" },
  { id: "approvals", label: "Approvals" },
  { id: "tender", label: "Tender" },
  { id: "construction", label: "Construction" },
  { id: "handover", label: "Handover" },
  { id: "completed", label: "Completed" },
];

export const HEALTH = [
  { id: "on_track", label: "On track", tone: "ok" },
  { id: "at_risk", label: "At risk", tone: "warn" },
  { id: "delayed", label: "Delayed", tone: "bad" },
  { id: "on_hold", label: "On hold", tone: "mute" },
];

export const TASK_STATUS = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "review", label: "In review" },
  { id: "done", label: "Done" },
];

export const PRIORITY = [
  { id: "low", label: "Low", tone: "mute" },
  { id: "med", label: "Medium", tone: "info" },
  { id: "high", label: "High", tone: "warn" },
  { id: "urgent", label: "Urgent", tone: "bad" },
];

export const SNAG_STATUS = [
  { id: "open", label: "Open" },
  { id: "progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "verified", label: "Verified" },
];

export const ONBOARDING = [
  { id: "enquiry", label: "Enquiry" },
  { id: "intro", label: "Intro call" },
  { id: "brief", label: "Brief" },
  { id: "proposal", label: "Proposal" },
  { id: "agreement", label: "Agreement" },
  { id: "advance", label: "Advance" },
  { id: "kickoff", label: "Kick-off" },
];

export const CLIENT_SOURCES = ["Instagram", "Referral", "Website", "Estimator", "Repeat client", "Builder / contractor", "Walk-in", "Other"];
export const PROJECT_TYPES = ["Residential", "Residential - Apartment", "Residential - Interiors", "Commercial - Office", "Commercial - Retail", "Commercial - Cafe", "Hospitality", "Landscape", "Interiors", "Urban Design"];

export const DEFAULT_CHECKLIST = [
  { id: "ack", label: "Enquiry acknowledged", stage: "enquiry" },
  { id: "intro_booked", label: "Intro call scheduled", stage: "intro" },
  { id: "intro_held", label: "Intro call held", stage: "intro" },
  { id: "brief_sent", label: "Brief form sent", stage: "brief" },
  { id: "brief_received", label: "Brief received", stage: "brief" },
  { id: "site_visit", label: "Site visited", stage: "brief" },
  { id: "proposal_sent", label: "Scope & fee proposal sent", stage: "proposal" },
  { id: "proposal_ok", label: "Proposal discussed & accepted", stage: "proposal" },
  { id: "agreement_signed", label: "Agreement signed", stage: "agreement" },
  { id: "invoice", label: "Advance invoice raised", stage: "advance" },
  { id: "advance_paid", label: "Advance received", stage: "advance" },
  { id: "kickoff_held", label: "Kick-off meeting held", stage: "kickoff" },
  { id: "folder", label: "Shared project folder created", stage: "kickoff" },
  { id: "project_created", label: "Project set up in the tracker", stage: "kickoff" },
];

export const DEFAULT_SETTINGS = {
  team: [],
  onboardingChecklist: DEFAULT_CHECKLIST,
  staleVisitDays: 14,
};

// ---------------------------------------------------------------------------
// State

export const data = {
  clients: [],
  projects: [],
  tasks: [],
  logs: [],
  snags: [],
  milestones: [],
  briefs: [],
  activity: [],
  settings: clone(DEFAULT_SETTINGS),
  tokens: {},
  revs: {},
  loaded: false,
};

const COLLECTIONS = ["clients", "projects", "tasks", "logs", "snags", "milestones", "briefs", "activity"];

const listeners = new Set();
export const onData = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = (kind) => listeners.forEach((fn) => fn(kind));

export const sync = { state: "saved", pending: 0, error: "" };

// ---------------------------------------------------------------------------
// Dates (local time: toISOString() would roll the date over at 5:30am in India)

export const isoDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => isoDate();
export const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
export const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);

// ---------------------------------------------------------------------------
// Loading and syncing

const applySettings = (value) => {
  data.settings = { ...clone(DEFAULT_SETTINGS), ...(value || {}) };
};

export const loadAll = async () => {
  const result = await studioApi({ action: "load" });
  for (const name of COLLECTIONS) data[name] = result.collections[name] || [];
  applySettings(result.settings);
  data.tokens = result.tokens || {};
  data.revs = result.revs;
  data.loaded = true;
  emit("load");
};

let queue = [];
let flushTimer = null;
let flushing = false;
let retryDelay = 1500;
let warned = false;

const setSync = (state, error = "") => {
  sync.state = state;
  sync.pending = queue.length;
  sync.error = error;
  emit("sync");
};

const flush = async () => {
  if (flushing || !queue.length) return;
  flushing = true;
  const batch = queue.splice(0, queue.length);
  setSync("saving");
  try {
    const result = await studioApi({ action: "save", ops: batch });
    Object.assign(data.revs, result.revs);
    retryDelay = 1500;
    warned = false;
    setSync(queue.length ? "saving" : "saved");
  } catch (error) {
    if (error.status === 401) return; // shell shows the login screen
    queue.unshift(...batch);
    setSync("error", error.message);
    if (!warned) {
      toast(`Couldn't save to the server: ${error.message} Your changes are kept and will retry.`, { error: true, duration: 7000 });
      warned = true;
    }
    flushTimer = setTimeout(flush, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  } finally {
    flushing = false;
    if (queue.length && !flushTimer) flushTimer = setTimeout(flush, 300);
  }
  flushTimer = null;
};

const enqueue = (op) => {
  // Keep only the latest write per item so quick successive edits stay small
  if (op.c === "settings") queue = queue.filter((q) => q.c !== "settings");
  else if (op.op === "set") queue = queue.filter((q) => !(q.c === op.c && q.op === "set" && q.item.id === op.item.id));
  else if (op.op === "del") queue = queue.filter((q) => !(q.c === op.c && q.op === "set" && q.item.id === op.id));
  queue.push(op);
  setSync("saving");
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 350);
};

export const hasPendingChanges = () => queue.length > 0 || flushing;

// Create or update an item; shows up everywhere immediately.
export const put = (collection, item) => {
  const next = { ...item, updatedAt: new Date().toISOString() };
  if (!next.createdAt) next.createdAt = next.updatedAt;
  const list = data[collection];
  const index = list.findIndex((i) => i.id === next.id);
  if (index === -1) list.push(next);
  else list[index] = next;
  enqueue({ c: collection, op: "set", item: next });
  return next;
};

export const del = (collection, id) => {
  data[collection] = data[collection].filter((i) => i.id !== id);
  enqueue({ c: collection, op: "del", id });
};

export const saveSettings = (value) => {
  data.settings = { ...data.settings, ...value };
  enqueue({ c: "settings", op: "set", value: data.settings });
};

// Log something to the activity feed. ref = { type, id, projectId? }
export const note = (text, ref) => {
  const r = ref ? { ...ref } : null;
  if (r && !r.projectId) {
    const source = { task: data.tasks, log: data.logs, snag: data.snags, milestone: data.milestones }[r.type];
    const item = source && source.find((i) => i.id === r.id);
    if (item && item.projectId) r.projectId = item.projectId;
    else if (r.type === "project") r.projectId = r.id;
  }
  put("activity", { id: uid("ac_"), at: new Date().toISOString(), who: meName(), text, ref: r });
};

// Pull in changes made on another device. Skipped while we have unsaved edits.
let polling = false;
export const refresh = async () => {
  if (polling || hasPendingChanges() || !data.loaded) return false;
  polling = true;
  try {
    const result = await studioApi({ action: "load", since: data.revs });
    if (hasPendingChanges()) return false;
    let changed = false;
    for (const name of COLLECTIONS) {
      if (result.collections[name]) {
        data[name] = result.collections[name];
        changed = true;
      }
    }
    if (result.settings !== undefined) {
      applySettings(result.settings);
      changed = true;
    }
    data.tokens = result.tokens || data.tokens;
    data.revs = result.revs;
    if (changed) emit("remote");
    return changed;
  } catch {
    return false;
  } finally {
    polling = false;
  }
};

// ---------------------------------------------------------------------------
// "Who am I" (this browser), used for activity and "My tasks"

export const meId = () => localStorage.getItem("vsMe") || "";
export const setMe = (id) => {
  localStorage.setItem("vsMe", id);
  emit("me");
};
export const team = () => data.settings.team || [];
export const member = (id) => team().find((m) => m.id === id);
export const meName = () => (member(meId()) || {}).name || "Someone";

// ---------------------------------------------------------------------------
// Selectors

export const clientById = (id) => data.clients.find((c) => c.id === id);
export const projectById = (id) => data.projects.find((p) => p.id === id);
export const briefOf = (clientId) => data.briefs.find((b) => b.id === clientId);

export const tasksOf = (projectId) => data.tasks.filter((t) => t.projectId === projectId);
export const logsOf = (projectId) => data.logs.filter((l) => l.projectId === projectId);
export const snagsOf = (projectId) => data.snags.filter((s) => s.projectId === projectId);
export const milestonesOf = (projectId) => data.milestones.filter((m) => m.projectId === projectId);

export const isDone = (t) => t.status === "done";
export const isOverdue = (t) => !isDone(t) && t.due && t.due < today();
export const activeProjects = () => data.projects.filter((p) => !p.archived && p.stage !== "completed");

// 0–1, or null when there is nothing to measure yet
export const progressOf = (project) => {
  const tasks = tasksOf(project.id);
  if (tasks.length) return tasks.filter(isDone).length / tasks.length;
  const ms = milestonesOf(project.id);
  if (ms.length) return ms.filter((m) => m.done).length / ms.length;
  return null;
};

export const checklistProgress = (client) => {
  const items = data.settings.onboardingChecklist || [];
  if (!items.length) return { done: 0, total: 0 };
  const done = items.filter((i) => isCheckDone(client, i.id)).length;
  return { done, total: items.length };
};

// "Brief received" is ticked automatically once the client submits the form
export const isCheckDone = (client, itemId) => Boolean((client.checks || {})[itemId]) || (itemId === "brief_received" && Boolean(briefOf(client.id)));

export const hasNewBrief = (client) => {
  const brief = briefOf(client.id);
  return Boolean(brief) && (!client.briefSeenAt || client.briefSeenAt < brief.submittedAt);
};

export const lastVisit = (projectId) => {
  const visits = logsOf(projectId).filter((l) => l.status !== "planned").map((l) => l.date).sort();
  return visits[visits.length - 1] || null;
};

export const nextProjectCode = () => {
  const year = String(new Date().getFullYear()).slice(2);
  const used = data.projects.map((p) => (p.code || "").match(new RegExp(`^VS-${year}-(\\d+)$`))).filter(Boolean).map((m) => Number(m[1]));
  return `VS-${year}-${String((used.length ? Math.max(...used) : 0) + 1).padStart(3, "0")}`;
};
