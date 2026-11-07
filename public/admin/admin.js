// Admin panel for vanillasometh.in.
//
// Edits public/content.json (cms.blog, cms.projects, cms.updates, contact and
// page intros) and publishes through /.netlify/functions/cms, which commits to
// GitHub. Changes are held locally until "Publish", so several edits go out as
// one commit / one deploy. Previews use the same renderer as the live pages.

import { escapeHTML, slugify, formatDate, renderBlogPost, renderProject, renderUpdates } from "/cms/render.mjs";

const API = "/.netlify/functions/cms";
const SESSION_KEY = "vsAdminSession";
const BACKUP_KEY = "vsAdminBackup";

const state = {
  token: localStorage.getItem(SESSION_KEY) || "",
  content: null, // full content.json being edited
  savedJSON: "", // content.json as last loaded/published, for change tracking
  sha: "", // blob sha of content.json we are editing on top of
  pending: new Map(), // image url -> { path, sha } uploaded but not yet committed
  previews: new Map(), // image url -> local object URL (until the deploy is live)
  autoSlug: new Set(), // ids whose slug still follows the title
  justPublished: false,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().slice(0, 10);
const cms = () => state.content.cms;
const clone = (value) => JSON.parse(JSON.stringify(value));

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------

const PROJECT_TYPES = ["Residential", "Residential - Apartment", "Residential - Interiors", "Commercial - Office", "Commercial - Retail", "Commercial - Cafe", "Hospitality", "Landscape", "Interiors", "Urban Design"];

const TYPES = {
  blog: {
    label: "Journal",
    singular: "story",
    blurb: "Long-form articles: ideas, process notes, design tips and studio stories.",
    livePath: (item) => `/blog/${item.slug}/`,
    indexPath: "/blog/",
    sortByDate: true,
    create: () => ({ id: uid(), title: "", slug: "", status: "draft", date: today(), author: "", cover: { src: "", alt: "" }, excerpt: "", body: "", tags: [], seoDescription: "" }),
    preview: (c, item) => renderBlogPost(c, item),
    fields: [
      { key: "title", type: "title", placeholder: "Story title" },
      { key: "slug", type: "slug", base: "/blog/" },
      { row: [
        { key: "date", type: "date", label: "Date" },
        { key: "author", type: "text", label: "Author", placeholder: "e.g. Ar. Zeba Ali Khan" },
      ] },
      { key: "cover", type: "image", label: "Cover image", hint: "Shown at the top of the story and on the journal cards. Landscape works best." },
      { key: "excerpt", type: "textarea", label: "Short summary", hint: "1–2 sentences shown under the title and on cards.", rows: 3 },
      { key: "body", type: "markdown", label: "Story" },
      { key: "tags", type: "tags", label: "Tags", hint: "Separate with commas, e.g. Interiors, Sustainability" },
      { key: "seoDescription", type: "textarea", label: "Google description (optional)", hint: "What shows under the link in Google. Uses the summary if left empty.", rows: 2 },
    ],
  },
  projects: {
    label: "Projects",
    singular: "project",
    blurb: "Built and ongoing work, each with its own page, photos and project facts.",
    livePath: (item) => `/projects/${item.slug}/`,
    indexPath: "/projects/",
    manualOrder: true,
    create: () => ({ id: uid(), title: "", slug: "", status: "draft", category: "", location: "", year: String(new Date().getFullYear()), client: "", area: "", projectStatus: "Completed", summary: "", cover: { src: "", alt: "" }, body: "", gallery: [] }),
    preview: (c, item) => renderProject(c, item),
    fields: [
      { key: "title", type: "title", placeholder: "Project name" },
      { key: "slug", type: "slug", base: "/projects/" },
      { row: [
        { key: "category", type: "text", label: "Type", placeholder: "e.g. Residential", list: PROJECT_TYPES },
        { key: "location", type: "text", label: "Location", placeholder: "e.g. Mangalore" },
      ] },
      { row: [
        { key: "year", type: "text", label: "Year" },
        { key: "area", type: "text", label: "Area", placeholder: "e.g. 3,200 sq ft" },
        { key: "projectStatus", type: "select", label: "Stage", options: ["Completed", "Under construction", "In design", "Concept"] },
      ] },
      { key: "client", type: "text", label: "Client (optional)" },
      { key: "summary", type: "textarea", label: "One-line summary", hint: "Shown on the project card and under the title.", rows: 2 },
      { key: "cover", type: "image", label: "Main photo" },
      { key: "body", type: "markdown", label: "Project story", hint: "The brief, the idea, materials, challenges — whatever tells the story." },
      { key: "gallery", type: "gallery", label: "Photo gallery", hint: "Add as many photos as you like. Use the arrows to reorder." },
    ],
  },
  updates: {
    label: "Updates",
    singular: "update",
    blurb: "Short studio news: awards, site visits, new hires, events, announcements.",
    livePath: (item) => `/updates/#${item.slug || slugify(item.title)}`,
    indexPath: "/updates/",
    sortByDate: true,
    create: () => ({ id: uid(), title: "", slug: "", status: "draft", date: today(), body: "", image: { src: "", alt: "" }, link: { label: "", url: "" } }),
    preview: (c) => renderUpdates(c),
    fields: [
      { key: "title", type: "title", placeholder: "What's new?" },
      { key: "date", type: "date", label: "Date" },
      { key: "body", type: "markdown", label: "Details", rows: 8 },
      { key: "image", type: "image", label: "Photo (optional)" },
      { row: [
        { key: "link.label", type: "text", label: "Button text (optional)", placeholder: "e.g. See the project" },
        { key: "link.url", type: "text", label: "Button link", placeholder: "/projects/... or https://..." },
      ] },
    ],
  },
};

const ensureShape = (content) => {
  content.cms = content.cms || {};
  const c = content.cms;
  c.blog = c.blog || [];
  c.projects = c.projects || [];
  c.updates = c.updates || [];
  c.contact = c.contact || { phone: "", email: "", locations: [], social: [] };
  c.pagesIntro = c.pagesIntro || {};
  for (const key of ["blog", "projects", "updates"]) c.pagesIntro[key] = c.pagesIntro[key] || { title: "", description: "" };
  return content;
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const api = async (body) => {
  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { error: response.status === 404 ? "The admin backend isn't deployed yet." : `Request failed (${response.status}).` };
  }
  if (response.status === 401 && body.action !== "login") {
    logout(false);
    throw new Error(data.error || "Please log in again.");
  }
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
};

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

let toastTimer;
const toast = (html, { error = false, duration = 4500 } = {}) => {
  const el = $("#toast");
  el.innerHTML = html;
  el.classList.toggle("error", error);
  el.classList.add("show");
  clearTimeout(toastTimer);
  if (duration) toastTimer = setTimeout(() => el.classList.remove("show"), duration);
};

const resolveSrc = (url) => state.previews.get(url) || url;

const swapPreviewUrls = (html) => {
  let out = html;
  for (const [url, local] of state.previews) out = out.split(url).join(local);
  return out;
};

const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
const setPath = (obj, path, value) => {
  const keys = path.split(".");
  let target = obj;
  keys.slice(0, -1).forEach((k) => {
    if (typeof target[k] !== "object" || target[k] === null) target[k] = {};
    target = target[k];
  });
  target[keys[keys.length - 1]] = value;
};

const savedCMS = () => (state.savedJSON ? JSON.parse(state.savedJSON).cms || {} : {});

const itemChanged = (type, item) => {
  const before = (savedCMS()[type] || []).find((i) => i.id === item.id);
  return !before || JSON.stringify(before) !== JSON.stringify(item);
};

const countChanges = () => {
  const saved = savedCMS();
  let count = 0;
  for (const type of Object.keys(TYPES)) {
    const now = cms()[type];
    const before = saved[type] || [];
    count += now.filter((item) => itemChanged(type, item)).length;
    count += before.filter((b) => !now.some((i) => i.id === b.id)).length;
    if (TYPES[type].manualOrder) {
      const kept = now.filter((i) => before.some((b) => b.id === i.id)).map((i) => i.id).join();
      if (kept !== before.filter((b) => now.some((i) => i.id === b.id)).map((b) => b.id).join()) count += 1;
    }
  }
  for (const key of ["contact", "pagesIntro"]) {
    if (JSON.stringify(cms()[key]) !== JSON.stringify(saved[key])) count += 1;
  }
  return count;
};

const updateSaveState = () => {
  const changes = countChanges();
  const el = $("#save-state");
  el.classList.toggle("dirty", changes > 0);
  if (changes > 0) {
    el.innerHTML = `<span class="dot"></span><span>${changes} unpublished change${changes === 1 ? "" : "s"}</span><span class="long muted">· publish to put them on the website</span>`;
  } else if (state.justPublished) {
    el.innerHTML = '<span class="dot"></span><span>Published — the website updates in about 1–2 minutes</span>';
  } else {
    el.innerHTML = '<span class="dot"></span><span>Everything is published</span>';
  }
  $("#publish-button").disabled = changes === 0;
  $("#publish-button").textContent = changes ? `Publish ${changes} change${changes === 1 ? "" : "s"}` : "Publish";
  $("#discard-button").hidden = changes === 0;
};

let backupTimer;
const changed = () => {
  updateSaveState();
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ sha: state.sha, content: state.content, pending: [...state.pending] }));
    } catch {
      /* storage full or unavailable: backup is best-effort */
    }
  }, 400);
};

const statusBadge = (type, item) => {
  const badges = [`<span class="badge ${item.status === "published" ? "published" : "draft"}">${item.status === "published" ? "● Published" : "Draft"}</span>`];
  if (itemChanged(type, item)) badges.push('<span class="badge unsaved">Unpublished edits</span>');
  return badges.join(" ");
};

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const MAX_EDGE = 2200;

const prepareImage = async (file) => {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    if (file.type === "image/svg+xml") throw new Error("SVG files aren't supported. Please use JPG or PNG.");
    return { blob: file, type: file.type };
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Couldn't read ${file.name}. If it's a HEIC photo from an iPhone, export it as JPG first.`);
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const keepPng = file.type === "image/png" && file.size < 1.5 * 1024 * 1024 && scale === 1;
  if (keepPng) return { blob: file, type: "image/png" };
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
  return { blob, type: "image/jpeg" };
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Compresses, uploads and returns the public URL of an image
const uploadImage = async (file) => {
  const { blob, type } = await prepareImage(file);
  const result = await api({ action: "upload", name: file.name, type, data: await blobToBase64(blob) });
  state.pending.set(result.url, { path: result.path, sha: result.sha });
  state.previews.set(result.url, URL.createObjectURL(blob));
  return result.url;
};

const pickFiles = (multiple) =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
    input.multiple = multiple;
    input.onchange = () => resolve(Array.from(input.files || []));
    input.click();
  });

const altFromName = (name) => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

const showLogin = async () => {
  $("#loading").hidden = true;
  $("#app-view").hidden = true;
  $("#login-view").hidden = false;
  try {
    const status = await (await fetch(API)).json();
    if (!status.configured) {
      $("#setup-notice").hidden = false;
      $("#setup-notice").innerHTML = `<strong>One-time setup needed.</strong> In Netlify → Site configuration → Environment variables, add:
        <ol>${status.missing.map((m) => `<li><code>${escapeHTML(m)}</code>${m === "GITHUB_TOKEN" ? ` — a GitHub fine-grained token with <em>Contents: read &amp; write</em> on <code>${escapeHTML(status.repo)}</code>` : " — the password you want for this admin"}</li>`).join("")}</ol>
        Then redeploy the site.`;
    }
  } catch {
    $("#setup-notice").hidden = false;
    $("#setup-notice").textContent = "The admin backend isn't reachable. It works on the deployed Netlify site, not when opening the file locally.";
  }
};

const logout = (reload = true) => {
  state.token = "";
  localStorage.removeItem(SESSION_KEY);
  if (reload) location.reload();
  else showLogin();
};

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#login-button");
  button.disabled = true;
  button.textContent = "Checking…";
  $("#login-error").textContent = "";
  try {
    const { token } = await api({ action: "login", password: $("#login-password").value });
    state.token = token;
    localStorage.setItem(SESSION_KEY, token);
    $("#login-view").hidden = true;
    await start();
  } catch (error) {
    $("#login-error").textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Log in";
  }
});

$("#logout-button").addEventListener("click", () => {
  if (countChanges() && !confirm("You have unpublished changes. They'll be kept on this device for next time. Log out?")) return;
  logout();
});

// ---------------------------------------------------------------------------
// Load / publish
// ---------------------------------------------------------------------------

const start = async () => {
  $("#loading").hidden = false;
  try {
    const { content, sha } = await api({ action: "load" });
    state.content = ensureShape(content);
    state.sha = sha;
    state.savedJSON = JSON.stringify(state.content);

    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null");
    if (backup && backup.sha === sha && JSON.stringify(ensureShape(backup.content)) !== state.savedJSON) {
      if (confirm("You have unpublished changes from your last visit on this device. Restore them?")) {
        state.content = ensureShape(backup.content);
        state.pending = new Map(backup.pending || []);
      } else {
        localStorage.removeItem(BACKUP_KEY);
      }
    } else if (backup) {
      localStorage.removeItem(BACKUP_KEY);
    }

    $("#app-view").hidden = false;
    $("#loading").hidden = true;
    updateSaveState();
    render();
  } catch (error) {
    $("#loading").hidden = true;
    if (!state.token) return;
    $("#app-view").hidden = false;
    $("#view").innerHTML = `<div class="panel"><h2>Couldn't load the website content</h2><p class="muted">${escapeHTML(error.message)}</p><button class="btn" onclick="location.reload()">Try again</button></div>`;
  }
};

const validate = () => {
  for (const [type, config] of Object.entries(TYPES)) {
    const seen = new Set();
    for (const item of cms()[type]) {
      if (item.status !== "published") continue;
      const where = `#/${type}/${item.id}`;
      if (!item.title.trim()) return { message: `A published ${config.singular} has no title.`, where };
      if (type !== "updates") {
        if (!item.slug) return { message: `"${item.title}" needs a web address.`, where };
        if (seen.has(item.slug)) return { message: `Two ${config.label.toLowerCase()} items use the address "${item.slug}". Change one of them.`, where };
        seen.add(item.slug);
      }
    }
  }
  return null;
};

const describeChanges = () => {
  const saved = savedCMS();
  const parts = [];
  for (const [type, config] of Object.entries(TYPES)) {
    for (const item of cms()[type]) {
      if (!itemChanged(type, item)) continue;
      const isNew = !(saved[type] || []).some((i) => i.id === item.id);
      parts.push(`${isNew ? "Add" : "Update"} ${config.singular} "${item.title || "Untitled"}"`);
    }
    for (const b of saved[type] || []) {
      if (!cms()[type].some((i) => i.id === b.id)) parts.push(`Delete ${config.singular} "${b.title}"`);
    }
  }
  return parts;
};

$("#publish-button").addEventListener("click", async () => {
  const problem = validate();
  if (problem) {
    toast(`${escapeHTML(problem.message)} <a href="${problem.where}">Fix it</a>`, { error: true, duration: 8000 });
    return;
  }
  const button = $("#publish-button");
  button.disabled = true;
  button.textContent = "Publishing…";
  const parts = describeChanges();
  const message = parts.length === 1 ? parts[0] : `Update site content from admin${parts.length ? `\n\n${parts.map((p) => `- ${p}`).join("\n")}` : ""}`;
  const serialized = JSON.stringify(state.content);
  const uploads = [...state.pending].filter(([url]) => serialized.includes(url)).map(([, u]) => u);
  try {
    const result = await api({ action: "save", content: state.content, baseSha: state.sha, message, uploads });
    state.sha = result.sha;
    state.savedJSON = serialized;
    state.pending.clear();
    state.justPublished = true;
    localStorage.removeItem(BACKUP_KEY);
    updateSaveState();
    render();
    toast('Published! The website updates in about 1–2 minutes. <a href="/" target="_blank" rel="noopener">Open site ↗</a>', { duration: 9000 });
  } catch (error) {
    if (error.status === 409) {
      toast(`${escapeHTML(error.message)} <a href="#" onclick="location.reload();return false">Reload</a>`, { error: true, duration: 0 });
    } else {
      toast(`Couldn't publish: ${escapeHTML(error.message)}`, { error: true, duration: 10000 });
    }
    updateSaveState();
  }
});

$("#discard-button").addEventListener("click", () => {
  if (!confirm("Discard all unpublished changes? This can't be undone.")) return;
  state.content = ensureShape(JSON.parse(state.savedJSON));
  state.pending.clear();
  localStorage.removeItem(BACKUP_KEY);
  updateSaveState();
  render();
});

window.addEventListener("beforeunload", (event) => {
  if (state.content && countChanges()) {
    event.preventDefault();
    event.returnValue = "";
  }
});

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

const route = () => {
  const [, section = "", id = ""] = location.hash.replace(/^#/, "").split("/");
  return { section: section || "dashboard", id };
};

const render = () => {
  if (!state.content) return;
  const { section, id } = route();
  $$("#main-nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === section));
  const view = $("#view");
  window.scrollTo(0, 0);
  if (TYPES[section] && id) return renderEditor(view, section, id);
  if (TYPES[section]) return renderList(view, section);
  if (section === "settings") return renderSettings(view);
  return renderDashboard(view);
};

window.addEventListener("hashchange", render);

// Web address from a title, with -2, -3… added if another item already uses it
const uniqueSlug = (type, title, id) => {
  const base = slugify(title);
  if (!base) return "";
  const taken = new Set(cms()[type].filter((i) => i.id !== id).map((i) => i.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
};

const createItem = (type) => {
  const item = TYPES[type].create();
  cms()[type].unshift(item);
  state.autoSlug.add(item.id);
  changed();
  location.hash = `#/${type}/${item.id}`;
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const renderDashboard = (view) => {
  const stats = Object.entries(TYPES)
    .map(([type, config]) => {
      const items = cms()[type];
      const published = items.filter((i) => i.status === "published").length;
      return `<a class="panel stat" href="#/${type}">
        <span class="label">${config.label}</span>
        <span class="num">${published}</span>
        <span class="sub">published${items.length - published ? ` · ${items.length - published} draft${items.length - published === 1 ? "" : "s"}` : ""}</span>
      </a>`;
    })
    .join("");

  const recent = Object.keys(TYPES)
    .flatMap((type) => cms()[type].map((item) => ({ type, item })))
    .sort((a, b) => String(b.item.updatedAt || b.item.date || "").localeCompare(String(a.item.updatedAt || a.item.date || "")))
    .slice(0, 6);

  view.innerHTML = `
    <div class="page-head"><div><h1>Welcome back</h1><p>What would you like to add to the website?</p></div></div>
    <div class="quick panel" style="margin-bottom:24px">
      <button type="button" data-new="blog"><strong>✎ Write a journal story</strong><span>Articles, design tips, behind the scenes</span></button>
      <button type="button" data-new="projects"><strong>▦ Add a project</strong><span>Photos, facts and the project story</span></button>
      <button type="button" data-new="updates"><strong>◉ Post an update</strong><span>Short news: awards, events, milestones</span></button>
    </div>
    <div class="stats">${stats}</div>
    <div class="panel">
      <h2>Recent</h2>
      <p class="muted">Pick up where you left off.</p>
      ${recent.length ? `<div class="list">${recent.map(({ type, item }) => listRow(type, item, { compact: true })).join("")}</div>` : '<p class="muted">Nothing yet — start with one of the buttons above.</p>'}
    </div>
    <div class="panel">
      <h2>How publishing works</h2>
      <p class="muted" style="margin:0">Edits are kept on this device until you press <strong>Publish</strong> (top right). Publishing updates the website in about 1–2 minutes. Items marked <strong>Draft</strong> are never shown on the website.
      Pages: <a href="/blog/" target="_blank" rel="noopener">/blog</a> · <a href="/projects/" target="_blank" rel="noopener">/projects</a> · <a href="/updates/" target="_blank" rel="noopener">/updates</a></p>
    </div>`;

  $$("[data-new]", view).forEach((b) => b.addEventListener("click", () => createItem(b.dataset.new)));
  bindRows(view);
};

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

const listRow = (type, item, { compact = false, index = 0, total = 0 } = {}) => {
  const config = TYPES[type];
  const image = item.cover?.src || item.image?.src || item.gallery?.[0]?.src;
  const meta = [
    statusBadge(type, item),
    compact ? `<span>${config.label}</span>` : "",
    item.date ? `<span>${escapeHTML(formatDate(item.date))}</span>` : "",
    item.category ? `<span>${escapeHTML(item.category)}</span>` : "",
    item.location ? `<span>${escapeHTML(item.location)}</span>` : "",
  ].join("");
  const live = JSON.parse(state.savedJSON).cms?.[type]?.find((i) => i.id === item.id && i.status === "published");
  return `<div class="row" data-open="#/${type}/${item.id}">
    <div class="thumb" style="${image ? `background-image:url('${escapeHTML(resolveSrc(image))}')` : ""}">${image ? "" : "▢"}</div>
    <div style="min-width:0"><div class="row-title">${escapeHTML(item.title || "Untitled")}</div><div class="row-meta">${meta}</div></div>
    ${compact ? "" : `<div class="row-actions">
      ${config.manualOrder ? `<button class="icon-btn" title="Move up" data-move="-1" data-id="${item.id}" ${index === 0 ? "disabled" : ""}>↑</button><button class="icon-btn" title="Move down" data-move="1" data-id="${item.id}" ${index === total - 1 ? "disabled" : ""}>↓</button>` : ""}
      ${live ? `<a class="icon-btn" title="View on website" href="${escapeHTML(config.livePath(live))}" target="_blank" rel="noopener">↗</a>` : ""}
      <button class="icon-btn" title="Duplicate" data-duplicate="${item.id}">⧉</button>
      <button class="icon-btn" title="Delete" data-delete="${item.id}">🗑</button>
    </div>`}
  </div>`;
};

const bindRows = (root, type) => {
  $$("[data-open]", root).forEach((row) =>
    row.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      location.hash = row.dataset.open;
    })
  );
  if (!type) return;
  const items = cms()[type];
  $$("[data-delete]", root).forEach((b) =>
    b.addEventListener("click", () => {
      const item = items.find((i) => i.id === b.dataset.delete);
      if (!confirm(`Delete "${item.title || "Untitled"}"? It will be removed from the website when you publish.`)) return;
      items.splice(items.indexOf(item), 1);
      changed();
      render();
    })
  );
  $$("[data-duplicate]", root).forEach((b) =>
    b.addEventListener("click", () => {
      const original = items.find((i) => i.id === b.dataset.duplicate);
      const copy = { ...clone(original), id: uid(), title: `${original.title} (copy)`, status: "draft" };
      copy.slug = uniqueSlug(type, copy.title, copy.id);
      items.splice(items.indexOf(original) + 1, 0, copy);
      changed();
      render();
    })
  );
  $$("[data-move]", root).forEach((b) =>
    b.addEventListener("click", () => {
      const from = items.findIndex((i) => i.id === b.dataset.id);
      const to = from + Number(b.dataset.move);
      if (to < 0 || to >= items.length) return;
      [items[from], items[to]] = [items[to], items[from]];
      changed();
      render();
    })
  );
};

const listFilters = {};

const renderList = (view, type) => {
  const config = TYPES[type];
  const filters = (listFilters[type] = listFilters[type] || { q: "", status: "all" });

  view.innerHTML = `
    <div class="page-head">
      <div><h1>${config.label}</h1><p>${config.blurb} <a href="${config.indexPath}" target="_blank" rel="noopener">View page ↗</a></p></div>
      <button class="btn primary" id="new-item">+ New ${config.singular}</button>
    </div>
    <div class="toolbar">
      <input type="search" id="list-search" placeholder="Search ${config.label.toLowerCase()}…" value="${escapeHTML(filters.q)}">
      <select id="list-status">
        <option value="all">All</option>
        <option value="published">Published</option>
        <option value="draft">Drafts</option>
      </select>
    </div>
    <div id="list-body"></div>`;

  $("#list-status", view).value = filters.status;

  const draw = () => {
    const q = filters.q.toLowerCase();
    let items = cms()[type];
    if (config.sortByDate) items = [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const filtered = items.filter(
      (i) => (filters.status === "all" || (i.status || "draft") === filters.status) && (!q || JSON.stringify([i.title, i.category, i.location, i.tags]).toLowerCase().includes(q))
    );
    const body = $("#list-body", view);
    if (!cms()[type].length) {
      body.innerHTML = `<div class="empty-state"><h2>No ${config.label.toLowerCase()} yet</h2><p>${config.blurb}</p><button class="btn primary" id="empty-new">+ Add your first ${config.singular}</button></div>`;
      $("#empty-new", body).addEventListener("click", () => createItem(type));
      return;
    }
    const canReorder = config.manualOrder && !q && filters.status === "all";
    body.innerHTML = filtered.length
      ? `${config.manualOrder ? `<p class="muted" style="margin:0 0 10px;font-size:13px">${canReorder ? "The order here is the order on the website. Use ↑ ↓ to rearrange." : "Clear the search and filter to rearrange."}</p>` : ""}<div class="list">${filtered
          .map((item, index) => listRow(type, item, { index: canReorder ? index : -1, total: canReorder ? filtered.length : -1 }))
          .join("")}</div>`
      : '<p class="muted">Nothing matches your search.</p>';
    if (!canReorder) $$("[data-move]", body).forEach((b) => b.remove());
    bindRows(body, type);
  };

  $("#new-item", view).addEventListener("click", () => createItem(type));
  $("#list-search", view).addEventListener("input", (e) => {
    filters.q = e.target.value;
    draw();
  });
  $("#list-status", view).addEventListener("change", (e) => {
    filters.status = e.target.value;
    draw();
  });
  draw();
};

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

const fieldHTML = (field, item) => {
  if (field.row) return `<div class="grid-${field.row.length}">${field.row.map((f) => fieldHTML(f, item)).join("")}</div>`;
  const value = getPath(item, field.key);
  const id = `f-${field.key.replace(/\./g, "-")}`;
  const label = (text) => `<span>${escapeHTML(text)}${field.hint ? ` <span class="hint">— ${escapeHTML(field.hint)}</span>` : ""}</span>`;

  switch (field.type) {
    case "title":
      return `<input id="${id}" class="title-input" type="text" data-field="${field.key}" placeholder="${escapeHTML(field.placeholder || "Title")}" value="${escapeHTML(value || "")}">`;
    case "slug":
      return `<label class="url-preview" for="${id}">Web address: <span>vanillasometh.in${field.base}</span><input id="${id}" type="text" data-field="slug" value="${escapeHTML(value || "")}" placeholder="auto from title"><span>/</span></label>`;
    case "text":
      return `<label class="field">${label(field.label)}<input id="${id}" type="text" data-field="${field.key}" value="${escapeHTML(value || "")}" placeholder="${escapeHTML(field.placeholder || "")}"${field.list ? ` list="${id}-list"` : ""}>${field.list ? `<datalist id="${id}-list">${field.list.map((o) => `<option value="${escapeHTML(o)}">`).join("")}</datalist>` : ""}</label>`;
    case "date":
      return `<label class="field">${label(field.label)}<input id="${id}" type="date" data-field="${field.key}" value="${escapeHTML(value || "")}"></label>`;
    case "select":
      return `<label class="field">${label(field.label)}<select id="${id}" data-field="${field.key}">${field.options.map((o) => `<option ${o === value ? "selected" : ""}>${escapeHTML(o)}</option>`).join("")}</select></label>`;
    case "textarea":
      return `<label class="field">${label(field.label)}<textarea id="${id}" data-field="${field.key}" rows="${field.rows || 3}">${escapeHTML(value || "")}</textarea></label>`;
    case "tags":
      return `<label class="field">${label(field.label)}<input id="${id}" type="text" data-field="${field.key}" data-tags value="${escapeHTML((value || []).join(", "))}"></label>`;
    case "markdown":
      return `<div class="field">${label(field.label)}
        <div>
          <div class="md-toolbar" data-md-for="${id}">
            <button type="button" data-md="h2" title="Big heading">H1</button>
            <button type="button" data-md="h3" title="Small heading">H2</button>
            <span class="sep"></span>
            <button type="button" data-md="bold" title="Bold"><b>B</b></button>
            <button type="button" data-md="italic" title="Italic"><i>I</i></button>
            <button type="button" data-md="link" title="Link">Link</button>
            <span class="sep"></span>
            <button type="button" data-md="ul" title="Bullet list">• List</button>
            <button type="button" data-md="ol" title="Numbered list">1. List</button>
            <button type="button" data-md="quote" title="Quote">“ Quote</button>
            <span class="sep"></span>
            <button type="button" data-md="image" title="Insert photo">＋ Photo</button>
          </div>
          <textarea id="${id}" class="body-input" data-field="${field.key}" rows="${field.rows || 16}" placeholder="Start writing… Use the buttons above for headings, lists, links and photos.">${escapeHTML(value || "")}</textarea>
        </div></div>`;
    case "image":
      return `<div class="field">${label(field.label)}<div class="image-field" data-image="${field.key}">${imageInner(value)}</div></div>`;
    case "gallery":
      return `<div class="field">${label(field.label)}<div class="image-field" data-gallery="${field.key}">${galleryInner(value || [])}</div></div>`;
    default:
      return "";
  }
};

const imageInner = (image) =>
  image?.src
    ? `<div class="image-filled">
        <img src="${escapeHTML(resolveSrc(image.src))}" alt="">
        <div class="image-side">
          <label class="field"><span>Describe the photo <span class="hint">— for Google and screen readers</span></span><input type="text" data-image-alt value="${escapeHTML(image.alt || "")}" placeholder="e.g. Living room with oak slats and skylight"></label>
          <div class="image-actions"><button type="button" class="btn small" data-image-replace>Replace</button><button type="button" class="btn small danger" data-image-remove>Remove</button></div>
        </div>
      </div>`
    : `<div class="image-drop" data-image-pick><strong>Click to upload</strong> or drag a photo here<span>JPG, PNG or WebP — large photos are resized automatically</span></div>`;

const galleryInner = (gallery) => `<div class="gallery-grid">
    ${gallery
      .map(
        (g, i) => `<div class="gallery-item"><img src="${escapeHTML(resolveSrc(g.src))}" alt="${escapeHTML(g.alt || "")}">
          <div class="gallery-actions"><span><button type="button" title="Move left" data-gallery-move="-1" data-index="${i}">←</button> <button type="button" title="Move right" data-gallery-move="1" data-index="${i}">→</button></span><button type="button" title="Remove" data-gallery-remove="${i}">✕</button></div></div>`
      )
      .join("")}
    <div class="gallery-add" data-gallery-add>＋ Add photos<br>or drag them here</div>
  </div>`;

const renderEditor = (view, type, id) => {
  const config = TYPES[type];
  const item = cms()[type].find((i) => i.id === id);
  if (!item) {
    view.innerHTML = `<div class="panel"><h2>Not found</h2><p class="muted">This ${config.singular} may have been deleted.</p><a class="btn" href="#/${type}">Back to ${config.label}</a></div>`;
    return;
  }
  const live = JSON.parse(state.savedJSON).cms?.[type]?.find((i) => i.id === item.id && i.status === "published");

  view.innerHTML = `
    <div class="editor-head">
      <div class="left"><a class="btn small ghost" href="#/${type}">← ${config.label}</a></div>
      <div class="left">
        <div class="editor-tabs status-toggle" id="editor-tabs"><button type="button" data-tab="edit" class="on">Edit</button><button type="button" data-tab="preview">Preview</button></div>
        <div class="status-toggle" id="status-toggle">
          <button type="button" data-status="draft">Draft</button>
          <button type="button" data-status="published">Published</button>
        </div>
        ${live ? `<a class="btn small" href="${escapeHTML(config.livePath(live))}" target="_blank" rel="noopener">View live ↗</a>` : ""}
        <button type="button" class="icon-btn" id="delete-item" title="Delete">🗑</button>
      </div>
    </div>
    <div class="editor" data-tab="edit">
      <div class="editor-form panel">${config.fields.map((f) => fieldHTML(f, item)).join("")}</div>
      <div class="preview-pane">
        <div class="preview-frame-wrap">
          <div class="preview-bar"><span class="dots"><i></i><i></i><i></i></span><span>Preview — how it will look on the website</span><span></span></div>
          <iframe class="preview-frame" id="preview" title="Preview"></iframe>
        </div>
      </div>
    </div>`;

  const editor = $(".editor", view);
  const touch = () => {
    item.updatedAt = new Date().toISOString();
    changed();
    schedulePreview();
  };

  // Preview -----------------------------------------------------------------
  let previewTimer;
  const drawPreview = () => {
    const previewCMS = clone(cms());
    const previewItem = { ...clone(item), status: "published", slug: item.slug || "preview" };
    const list = previewCMS[type];
    const index = list.findIndex((i) => i.id === item.id);
    list[index] = previewItem;
    const frame = $("#preview", view);
    if (!frame) return;
    const scrollY = frame.contentWindow?.scrollY || 0;
    frame.srcdoc = swapPreviewUrls(config.preview(previewCMS, previewItem)).replace("<head>", '<head><base target="_blank">');
    frame.onload = () => frame.contentWindow?.scrollTo(0, scrollY);
  };
  const schedulePreview = () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(drawPreview, 300);
  };
  drawPreview();

  // Status ------------------------------------------------------------------
  const drawStatus = () => $$("#status-toggle button", view).forEach((b) => b.classList.toggle("on", b.dataset.status === (item.status || "draft")));
  drawStatus();
  $$("#status-toggle button", view).forEach((b) =>
    b.addEventListener("click", () => {
      item.status = b.dataset.status;
      if (item.status === "published" && !item.slug) item.slug = uniqueSlug(type, item.title || item.id, item.id);
      drawStatus();
      touch();
      if (item.status === "published") toast("Marked as published — press <strong>Publish</strong> (top right) to put it on the website.");
    })
  );

  $$("#editor-tabs button", view).forEach((b) =>
    b.addEventListener("click", () => {
      editor.dataset.tab = b.dataset.tab;
      $$("#editor-tabs button", view).forEach((x) => x.classList.toggle("on", x === b));
      if (b.dataset.tab === "preview") drawPreview();
    })
  );

  $("#delete-item", view).addEventListener("click", () => {
    if (!confirm(`Delete "${item.title || "Untitled"}"? It will be removed from the website when you publish.`)) return;
    cms()[type].splice(cms()[type].indexOf(item), 1);
    changed();
    location.hash = `#/${type}`;
  });

  // Text fields ---------------------------------------------------------------
  const slugInput = $('[data-field="slug"]', view);

  $$("[data-field]", view).forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.field;
      if (input.hasAttribute("data-tags")) {
        setPath(item, key, input.value.split(",").map((t) => t.trim()).filter(Boolean));
      } else if (key === "slug") {
        state.autoSlug.delete(item.id);
        item.slug = slugify(input.value);
      } else {
        setPath(item, key, input.value);
      }
      if (key === "title") {
        if (type === "updates") item.slug = uniqueSlug(type, input.value, item.id);
        else if (state.autoSlug.has(item.id) || !item.slug) {
          state.autoSlug.add(item.id);
          item.slug = uniqueSlug(type, input.value, item.id);
          if (slugInput) slugInput.value = item.slug;
        }
      }
      touch();
    });
  });
  slugInput?.addEventListener("blur", () => (slugInput.value = item.slug));

  // Markdown toolbar ---------------------------------------------------------
  $$(".md-toolbar", view).forEach((bar) => {
    const textarea = $(`#${bar.dataset.mdFor}`, view);
    const key = textarea.dataset.field;
    const apply = (before, after = "", placeholder = "") => {
      const { selectionStart: s, selectionEnd: e, value } = textarea;
      const selected = value.slice(s, e) || placeholder;
      textarea.value = value.slice(0, s) + before + selected + after + value.slice(e);
      textarea.focus();
      textarea.setSelectionRange(s + before.length, s + before.length + selected.length);
      setPath(item, key, textarea.value);
      touch();
    };
    const prefixLines = (prefix) => {
      const { selectionStart: s, selectionEnd: e, value } = textarea;
      const start = value.lastIndexOf("\n", s - 1) + 1;
      const block = value.slice(start, e) || "";
      const lines = (block || "List item").split("\n").map((line, i) => `${typeof prefix === "function" ? prefix(i) : prefix}${line.replace(/^(#{1,3}\s|[-*]\s|\d+\.\s|>\s?)/, "")}`);
      textarea.value = value.slice(0, start) + lines.join("\n") + value.slice(e);
      textarea.focus();
      setPath(item, key, textarea.value);
      touch();
    };
    bar.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-md]");
      if (!button) return;
      switch (button.dataset.md) {
        case "h2": return prefixLines("# ");
        case "h3": return prefixLines("## ");
        case "bold": return apply("**", "**", "bold text");
        case "italic": return apply("*", "*", "italic text");
        case "ul": return prefixLines("- ");
        case "ol": return prefixLines((i) => `${i + 1}. `);
        case "quote": return prefixLines("> ");
        case "link": {
          const url = prompt("Link address (e.g. https://… or /projects/…)");
          if (url) apply("[", `](${url.trim()})`, "link text");
          return;
        }
        case "image": {
          const [file] = await pickFiles(false);
          if (!file) return;
          button.textContent = "Uploading…";
          try {
            const url = await uploadImage(file);
            const caption = prompt("Caption for this photo (optional)", "") || "";
            const { selectionStart: s, value } = textarea;
            const insert = `${s && value[s - 1] !== "\n" ? "\n\n" : ""}![${caption.replace(/[[\]]/g, "")}](${url})\n\n`;
            textarea.value = value.slice(0, s) + insert + value.slice(s);
            setPath(item, key, textarea.value);
            touch();
          } catch (error) {
            toast(escapeHTML(error.message), { error: true });
          } finally {
            button.textContent = "＋ Photo";
          }
        }
      }
    });
  });

  // Single images ----------------------------------------------------------
  $$("[data-image]", view).forEach((box) => {
    const key = box.dataset.image;
    const set = async (file) => {
      box.classList.add("uploading");
      try {
        const url = await uploadImage(file);
        const previous = getPath(item, key) || {};
        setPath(item, key, { src: url, alt: previous.alt || altFromName(file.name) });
        touch();
      } catch (error) {
        toast(escapeHTML(error.message), { error: true });
      }
      box.classList.remove("uploading");
      draw();
    };
    const draw = () => {
      box.innerHTML = imageInner(getPath(item, key));
      $("[data-image-pick]", box)?.addEventListener("click", async () => {
        const [file] = await pickFiles(false);
        if (file) set(file);
      });
      $("[data-image-replace]", box)?.addEventListener("click", async () => {
        const [file] = await pickFiles(false);
        if (file) set(file);
      });
      $("[data-image-remove]", box)?.addEventListener("click", () => {
        setPath(item, key, { src: "", alt: "" });
        touch();
        draw();
      });
      $("[data-image-alt]", box)?.addEventListener("input", (e) => {
        setPath(item, `${key}.alt`, e.target.value);
        touch();
      });
    };
    enableDrop(box, (files) => files[0] && set(files[0]));
    draw();
  });

  // Galleries ---------------------------------------------------------------
  $$("[data-gallery]", view).forEach((box) => {
    const key = box.dataset.gallery;
    const list = () => {
      if (!Array.isArray(getPath(item, key))) setPath(item, key, []);
      return getPath(item, key);
    };
    const add = async (files) => {
      box.classList.add("uploading");
      for (const file of files) {
        try {
          const url = await uploadImage(file);
          list().push({ src: url, alt: altFromName(file.name) });
          touch();
          draw();
        } catch (error) {
          toast(escapeHTML(error.message), { error: true });
        }
      }
      box.classList.remove("uploading");
    };
    const draw = () => {
      box.innerHTML = galleryInner(list());
      $("[data-gallery-add]", box).addEventListener("click", async () => add(await pickFiles(true)));
      $$("[data-gallery-remove]", box).forEach((b) =>
        b.addEventListener("click", () => {
          list().splice(Number(b.dataset.galleryRemove), 1);
          touch();
          draw();
        })
      );
      $$("[data-gallery-move]", box).forEach((b) =>
        b.addEventListener("click", () => {
          const from = Number(b.dataset.index);
          const to = from + Number(b.dataset.galleryMove);
          const items = list();
          if (to < 0 || to >= items.length) return;
          [items[from], items[to]] = [items[to], items[from]];
          touch();
          draw();
        })
      );
    };
    enableDrop(box, add);
    draw();
  });
};

const enableDrop = (box, onFiles) => {
  box.addEventListener("dragover", (e) => {
    e.preventDefault();
    box.classList.add("drag");
  });
  box.addEventListener("dragleave", () => box.classList.remove("drag"));
  box.addEventListener("drop", (e) => {
    e.preventDefault();
    box.classList.remove("drag");
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  });
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const renderSettings = (view) => {
  const c = cms();
  const intro = (key, label) => `
    <div class="grid-2">
      <label class="field"><span>${label} page title</span><input type="text" data-intro="${key}.title" value="${escapeHTML(c.pagesIntro[key].title || "")}" placeholder="${escapeHTML({ blog: "Journal", projects: "Projects", updates: "Studio Updates" }[key])}"></label>
      <label class="field"><span>${label} page intro</span><input type="text" data-intro="${key}.description" value="${escapeHTML(c.pagesIntro[key].description || "")}"></label>
    </div>`;

  view.innerHTML = `
    <div class="page-head"><div><h1>Settings</h1><p>Details shown on the journal, project and update pages.</p></div></div>
    <div class="panel">
      <h2>Contact details</h2>
      <p class="muted">Shown in the footer of the journal, projects and updates pages.</p>
      <div class="editor-form">
        <div class="grid-2">
          <label class="field"><span>Phone</span><input type="text" data-contact="phone" value="${escapeHTML(c.contact.phone || "")}"></label>
          <label class="field"><span>Email</span><input type="email" data-contact="email" value="${escapeHTML(c.contact.email || "")}"></label>
        </div>
        <label class="field"><span>Studio locations <span class="hint">— one per line</span></span><textarea data-contact="locations" rows="3">${escapeHTML((c.contact.locations || []).join("\n"))}</textarea></label>
        <label class="field"><span>Social links <span class="hint">— one per line, as Name | link</span></span><textarea data-contact="social" rows="4" placeholder="Instagram | https://instagram.com/...">${escapeHTML((c.contact.social || []).map((s) => `${s.label} | ${s.url}`).join("\n"))}</textarea></label>
      </div>
    </div>
    <div class="panel">
      <h2>Page headings</h2>
      <p class="muted">The big title and intro line at the top of each page. Leave empty to use the default.</p>
      <div class="editor-form">${intro("blog", "Journal")}${intro("projects", "Projects")}${intro("updates", "Updates")}</div>
    </div>
    <div class="panel">
      <h2>Other website pages</h2>
      <p class="muted" style="margin:0">The home, showcase, team and contact pages are designed in Framer, so their text and layout are changed in Framer and re-exported. Everything in Journal, Projects and Updates is managed here.</p>
    </div>`;

  $$("[data-contact]", view).forEach((input) =>
    input.addEventListener("input", () => {
      const key = input.dataset.contact;
      if (key === "locations") c.contact.locations = input.value.split("\n").map((l) => l.trim()).filter(Boolean);
      else if (key === "social")
        c.contact.social = input.value
          .split("\n")
          .map((line) => line.split("|").map((p) => p.trim()))
          .filter(([label, url]) => label && url)
          .map(([label, url]) => ({ label, url }));
      else c.contact[key] = input.value.trim();
      changed();
    })
  );
  $$("[data-intro]", view).forEach((input) =>
    input.addEventListener("input", () => {
      setPath(c.pagesIntro, input.dataset.intro, input.value.trim());
      changed();
    })
  );
};

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

if (state.token) start();
else showLogin();
