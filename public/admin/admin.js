// Admin panel for vanillasometh.in.
//
// Edits public/content.json (cms.blog, cms.projects, cms.updates, contact and
// page intros) and publishes through /.netlify/functions/cms, which commits to
// GitHub. Changes are held locally until "Publish", so several edits go out as
// one commit / one deploy. Previews use the same renderer as the live pages.

import { escapeHTML, slugify, formatDate, renderBlogPost, renderProject, renderUpdates, renderShopProduct, renderShopList, AFFILIATE } from "/cms/render.mjs";
import { session, SESSION_KEY, app, $, $$, clone, uid, api, toast } from "./core.js";
import { data as studio, loadAll, refresh, sync, onData, hasPendingChanges, meId, team, setMe, isoDate } from "./studio/data.js";
import { icon, drawerIsOpen } from "./studio/ui.js";
import { renderDashboard as renderStudioDashboard } from "./studio/dashboard.js";
import { renderProjects, renderProjectDetail } from "./studio/projects.js";
import { renderTasksPage } from "./studio/tasks.js";
import { renderClients, renderClientDetail } from "./studio/clients.js";
import { renderSitesPage } from "./studio/sites.js";
import { renderWebsite } from "./studio/website.js";
import { renderOrders } from "./studio/orders.js";
import { renderBilling } from "./studio/billing.js";
import { renderCrm } from "./studio/crm.js";
import { renderHr } from "./studio/hr.js";
import { renderOps } from "./studio/ops.js";
import { animateAdminView, initAdminMotion } from "./motion.js";
import { renderStudioSettings } from "./studio/settings.js";
import { openPalette } from "./studio/palette.js";

const BACKUP_KEY = "vsAdminBackup";

const state = {
  content: null, // full content.json being edited (null until GitHub is connected)
  contentError: "", // why the website content couldn't be loaded
  savedJSON: "", // content.json as last loaded/published, for change tracking
  sha: "", // blob sha of content.json we are editing on top of
  pending: new Map(), // image url -> { path, sha } uploaded but not yet committed
  previews: new Map(), // image url -> local object URL (until the deploy is live)
  autoSlug: new Set(), // ids whose slug still follows the title
  justPublished: false,
};

const today = () => isoDate();
const cms = () => state.content.cms;

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------

const PROJECT_TYPES = ["Residential", "Residential - Apartment", "Residential - Interiors", "Residential - Renovation", "Hospitality - Airbnb / Short Stay", "Hospitality - Homestay / Serviced Villa", "Commercial - Office", "Commercial - Retail", "Commercial - Cafe", "Commercial - Healthcare", "Commercial - Restaurant", "Landscape", "Landscape & Public Realm", "Sports & Recreation", "Interiors", "Urban Design", "Building Permit / Compliance Documentation"];

const PRODUCT_CATEGORIES = ["Furniture", "Furnishing", "Accessories", "Lighting", "Decor"];

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
    create: () => ({ id: uid(), title: "", slug: "", status: "draft", category: "", location: "", year: "", client: "", area: "", projectStatus: "Scope to confirm", summary: "", seoDescription: "", cover: { src: "", alt: "" }, body: "", tags: [], gallery: [] }),
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
        { key: "projectStatus", type: "select", label: "Stage", options: ["Scope to confirm", "Completed", "Under construction", "In design", "Concept"] },
      ] },
      { key: "client", type: "text", label: "Client (optional)" },
      { key: "summary", type: "textarea", label: "One-line summary", hint: "Shown on the project card and under the title.", rows: 2 },
      { key: "seoDescription", type: "textarea", label: "Search description (optional)", hint: "A factual 150 to 160 character description for search results.", rows: 2 },
      { key: "tags", type: "tags", label: "Project keywords", hint: "Relevant services and project terms, separated by commas." },
      { key: "cover", type: "image", label: "Main photo" },
      { key: "body", type: "markdown", label: "Project story", hint: "Brief, design approach, materials, challenges, services and project outcome." },
      { key: "gallery", type: "gallery", label: "Project media", hint: "Upload multiple photos, renders, plans, technical drawings and PDF sheets. Choose a category for each item." },
    ],
  },
  products: {
    label: "Shop products",
    singular: "product",
    blurb: "Pieces you sell yourselves (with checkout) or recommend with an affiliate link to a partner store.",
    livePath: (item) => `/shop/${item.slug}/`,
    indexPath: "/shop/",
    manualOrder: true,
    create: () => ({ id: uid(), title: "", slug: "", status: "draft", type: "Sold by us", category: "", brand: "", price: "", comparePrice: "", inStock: "Yes", affiliateUrl: "", affiliateStore: "", options: [], summary: "", body: "", seoDescription: "", gallery: [] }),
    preview: (c, item) => renderShopProduct(c, item),
    fields: [
      { key: "title", type: "title", placeholder: "Product name" },
      { key: "slug", type: "slug", base: "/shop/" },
      { row: [
        { key: "type", type: "select", label: "How it is sold", options: ["Sold by us", AFFILIATE] },
        { key: "category", type: "text", label: "Category", placeholder: "e.g. Furniture", list: PRODUCT_CATEGORIES },
        { key: "brand", type: "text", label: "Brand / maker" },
      ] },
      { row: [
        { key: "price", type: "text", label: "Price (₹)", placeholder: "e.g. 18500" },
        { key: "comparePrice", type: "text", label: "Old price (₹, optional)", hint: "Shown struck through." },
        { key: "inStock", type: "select", label: "In stock", options: ["Yes", "No"] },
      ] },
      { row: [
        { key: "affiliateUrl", type: "text", label: "Affiliate link", placeholder: "https://… (for affiliate products)" },
        { key: "affiliateStore", type: "text", label: "Partner store", placeholder: "e.g. Pepperfry" },
      ] },
      { key: "options", type: "tags", label: "Options (optional)", hint: "e.g. sizes or finishes, separated by commas. Shoppers pick one." },
      { key: "summary", type: "textarea", label: "Short description", rows: 2 },
      { key: "gallery", type: "gallery", label: "Photos", hint: "The first photo is the main one; the second shows on hover." },
      { key: "body", type: "markdown", label: "Details", hint: "Materials, dimensions, care, why you picked it." },
      { key: "seoDescription", type: "textarea", label: "Search description (optional)", rows: 2 },
    ],
  },
  shopLists: {
    label: "Curated lists",
    singular: "list",
    blurb: "Hand-picked collections, like “Small living rooms” or “Under ₹10,000”. Each gets its own page in the shop.",
    livePath: (item) => `/shop/lists/${item.slug}/`,
    indexPath: "/shop/",
    manualOrder: true,
    create: () => ({ id: uid(), title: "", slug: "", status: "draft", description: "", cover: { src: "", alt: "" }, productIds: [] }),
    preview: (c, item) => renderShopList(c, item),
    fields: [
      { key: "title", type: "title", placeholder: "List name" },
      { key: "slug", type: "slug", base: "/shop/lists/" },
      { key: "description", type: "textarea", label: "Intro", rows: 3 },
      { key: "cover", type: "image", label: "Cover photo" },
      { key: "productIds", type: "productpick", label: "Products in this list" },
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

// The public portfolio lives under "Portfolio" in the admin so it isn't confused with studio Projects
const ROUTE_TYPE = { portfolio: "projects", shop: "products", lists: "shopLists" };
const TYPE_ROUTE = Object.fromEntries(Object.entries(ROUTE_TYPE).map(([r, t]) => [t, r]));
const routeOf = (type) => TYPE_ROUTE[type] || type;
const typeOf = (route) => ROUTE_TYPE[route] || route;
const WEBSITE_ROUTES = ["blog", "portfolio", "updates", "shop", "lists"];

const ensureShape = (content) => {
  content.cms = content.cms || {};
  const c = content.cms;
  c.blog = c.blog || [];
  c.projects = c.projects || [];
  c.updates = c.updates || [];
  c.products = c.products || [];
  c.shopLists = c.shopLists || [];
  c.shop = c.shop || { shippingFlat: "", freeShippingOver: "", codEnabled: "Yes", deliveryNote: "" };
  c.contact = c.contact || { phone: "", email: "", locations: [], social: [] };
  c.pagesIntro = c.pagesIntro || {};
  for (const key of ["blog", "projects", "updates", "shop"]) c.pagesIntro[key] = c.pagesIntro[key] || { title: "", description: "" };
  return content;
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

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
  for (const key of ["contact", "pagesIntro", "shop"]) {
    if (JSON.stringify(cms()[key]) !== JSON.stringify(saved[key])) count += 1;
  }
  return count;
};

let publishing = false;

const isWebsiteRoute = () => {
  const { section } = route();
  return WEBSITE_ROUTES.includes(section) || section === "settings";
};

// Left of the top bar: studio save status (always autosaved) or, on website
// pages, what's waiting to be published. Right: Publish, only when needed.
const updateSaveState = () => {
  const changes = state.content ? countChanges() : 0;
  const el = $("#save-state");
  const websiteView = isWebsiteRoute() && state.content;
  el.classList.toggle("dirty", websiteView ? changes > 0 : sync.state !== "saved" || changes > 0);
  el.classList.toggle("bad", sync.state === "error");
  if (websiteView && changes > 0) {
    el.innerHTML = `<span class="dot"></span><span>${changes} unpublished change${changes === 1 ? "" : "s"}</span><span class="long muted">· publish to put them on the website</span>`;
  } else if (websiteView && state.justPublished) {
    el.innerHTML = '<span class="dot"></span><span>Published — the website updates in about 1–2 minutes</span>';
  } else if (sync.state === "error") {
    el.innerHTML = `<span class="dot"></span><span>Couldn't save · retrying</span><span class="long muted">· ${escapeHTML(sync.error)}</span>`;
  } else if (sync.state === "saving") {
    el.innerHTML = '<span class="dot"></span><span>Saving…</span>';
  } else if (changes > 0) {
    el.innerHTML = `<span class="dot"></span><span>${changes} unpublished website change${changes === 1 ? "" : "s"}</span><span class="long muted">· press Publish</span>`;
  } else {
    el.innerHTML = '<span class="dot"></span><span>All changes saved</span>';
  }
  $("#publish-button").hidden = changes === 0;
  $("#publish-button").disabled = publishing;
  $("#publish-button").textContent = publishing ? "Publishing…" : changes ? `Publish ${changes} change${changes === 1 ? "" : "s"}` : "Publish";
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
const uploadBlob = async (file, blob, type) => {
  const result = await api({ action: "upload", name: file.name, type, data: await blobToBase64(blob) });
  state.pending.set(result.url, { path: result.path, sha: result.sha });
  state.previews.set(result.url, URL.createObjectURL(blob));
  return result.url;
};

const uploadImage = async (file) => {
  const { blob, type } = await prepareImage(file);
  return uploadBlob(file, blob, type);
};

const uploadPDF = async (file) => {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error(`${file.name} is not a PDF.`);
  if (file.size > 4 * 1024 * 1024) throw new Error(`${file.name} is larger than 4 MB. Please optimise the PDF first.`);
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...header) !== "%PDF-") throw new Error(`${file.name} is not a valid PDF file.`);
  return uploadBlob(file, file, "application/pdf");
};

const pickFiles = (multiple) =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,.pdf";
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
    const status = await (await fetch("/.netlify/functions/cms")).json();
    if (status.missing.includes("ADMIN_PASSWORD")) {
      $("#setup-notice").hidden = false;
      $("#setup-notice").innerHTML = `<strong>One-time setup needed.</strong> In Netlify → Site configuration → Environment variables, add:
        <ol><li><code>ADMIN_PASSWORD</code> — the password you want for this admin</li>
        <li><code>GITHUB_TOKEN</code> <em>(to publish website content)</em> — a GitHub fine-grained token with <em>Contents: read &amp; write</em> on <code>${escapeHTML(status.repo)}</code></li></ol>
        Then redeploy the site.`;
    }
  } catch {
    $("#setup-notice").hidden = false;
    $("#setup-notice").textContent = "The admin backend isn't reachable. It works on the deployed Netlify site, not when opening the file locally.";
  }
};

const logout = (reload = true) => {
  session.token = "";
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
    session.token = token;
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
  if (hasPendingChanges()) return toast("Still saving your latest changes. Try again in a moment.");
  if (state.content && countChanges() && !confirm("You have unpublished website changes. They'll be kept on this device for next time. Log out?")) return;
  logout();
});

// ---------------------------------------------------------------------------
// Load / publish
// ---------------------------------------------------------------------------

const loadWebsiteContent = async () => {
  try {
    const { content, sha } = await api({ action: "load" });
    state.content = ensureShape(content);
    state.sha = sha;
    state.savedJSON = JSON.stringify(state.content);
    state.contentError = "";

    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null");
    if (backup && backup.sha === sha && JSON.stringify(ensureShape(backup.content)) !== state.savedJSON) {
      if (confirm("You have unpublished website changes from your last visit on this device. Restore them?")) {
        state.content = ensureShape(backup.content);
        state.pending = new Map(backup.pending || []);
      } else {
        localStorage.removeItem(BACKUP_KEY);
      }
    } else if (backup) {
      localStorage.removeItem(BACKUP_KEY);
    }
  } catch (error) {
    if (error.status === 401) throw error;
    // The studio works without GitHub; only publishing website content needs it
    state.content = null;
    state.contentError = error.message;
  }
};

const start = async () => {
  $("#loading").hidden = false;
  try {
    await loadAll();
    await loadWebsiteContent();
  } catch (error) {
    $("#loading").hidden = true;
    if (!session.token) return;
    $("#app-view").hidden = false;
    $("#view").innerHTML = `<div class="page"><div class="panel"><h2>Couldn't load the studio data</h2><p class="muted">${escapeHTML(error.message)}</p><button class="btn" onclick="location.reload()">Try again</button></div></div>`;
    return;
  }
  $("#app-view").hidden = false;
  $("#loading").hidden = true;
  render();
  startPolling();
};

const validate = () => {
  for (const [type, config] of Object.entries(TYPES)) {
    const seen = new Set();
    for (const item of cms()[type]) {
      if (item.status !== "published") continue;
      const where = `#/${routeOf(type)}/${item.id}`;
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
  if (publishing) return;
  const problem = validate();
  if (problem) {
    toast(`${escapeHTML(problem.message)} <a href="${problem.where}">Fix it</a>`, { error: true, duration: 8000 });
    return;
  }
  publishing = true;
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
  } finally {
    publishing = false;
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
  if (hasPendingChanges() || (state.content && countChanges())) {
    event.preventDefault();
    event.returnValue = "";
  }
});

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

const route = () => {
  const [, section = "", id = "", tab = ""] = location.hash.replace(/^#/, "").split("/");
  return { section: section || "dashboard", id, tab };
};

// Counts shown on the dashboard and the Website page
const websiteSummary = () => {
  const count = (type) => {
    if (!state.content) return undefined;
    const items = cms()[type];
    const published = items.filter((i) => i.status === "published").length;
    return { published, drafts: items.length - published };
  };
  return { blog: count("blog"), projects: count("projects"), updates: count("updates"), pending: state.content ? countChanges() : 0, available: Boolean(state.content) };
};

const needsGithub = (view) => {
  view.innerHTML = `<div class="page"><div class="page-head"><div><h1>Website content</h1><p>Journal, Portfolio and Updates are published through GitHub.</p></div></div>
    <div class="panel"><h2>Connect GitHub to manage website content</h2>
    <p class="muted">${escapeHTML(state.contentError || "The website content couldn't be loaded.")}</p>
    <p class="muted">In Netlify → Site configuration → Environment variables, add <code>GITHUB_TOKEN</code> (a fine-grained token with <em>Contents: read &amp; write</em> on the repository), then redeploy. The studio tools (projects, tasks, clients, sites) work without it.</p>
    <button class="btn" onclick="location.reload()">Check again</button></div></div>`;
};

const render = ({ keepScroll = false } = {}) => {
  if (!studio.loaded) return;
  const { section, id, tab } = route();
  const scrollY = window.scrollY;
  const boardX = $(".board-scroll")?.scrollLeft || 0;
  $$("#main-nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === section));
  document.body.classList.remove("nav-open");
  const view = $("#view");
  // Only Journal / Portfolio / Updates are website content. The studio's own
  // "projects" route must not be mistaken for the website's "projects" type.
  const type = WEBSITE_ROUTES.includes(section) ? typeOf(section) : "";

  if (!keepScroll) window.scrollTo(0, 0);
  if (TYPES[type] && !state.content) needsGithub(view);
  else if (TYPES[type] && id) renderEditor(view, type, id);
  else if (TYPES[type]) renderList(view, type);
  else if (section === "orders") renderOrders(view);
  else if (section === "billing") renderBilling(view);
  else if (section === "crm") renderCrm(view);
  else if (section === "people") renderHr(view);
  else if (section === "incidents") renderOps(view);
  else if (section === "settings") renderSettings(view);
  else if (section === "seo") renderSEO(view);
  else if (section === "projects") (id ? renderProjectDetail(view, id, tab) : renderProjects(view));
  else if (section === "tasks") {
    view.innerHTML = "";
    const root = document.createElement("div");
    root.className = "page";
    view.appendChild(root);
    renderTasksPage(root);
  } else if (section === "clients") (id ? renderClientDetail(view, id) : renderClients(view));
  else if (section === "sites") renderSitesPage(view);
  else if (section === "website") renderWebsite(view, { summary: websiteSummary });
  else renderStudioDashboard(view, websiteSummary());

  if (keepScroll) {
    window.scrollTo(0, scrollY);
    const board = $(".board-scroll");
    if (board) board.scrollLeft = boardX;
  }
  animateAdminView(view);
  updateSaveState();
};

initAdminMotion();
app.render = () => render({ keepScroll: true });
app.onExpired = () => logout(false);
window.addEventListener("hashchange", () => render());

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
  location.hash = `#/${routeOf(type)}/${item.id}`;
};

// Studio project -> draft portfolio entry on the website. Only the public-safe
// facts are copied (not client name, fees or budget).
app.addToPortfolio = (project) => {
  if (!state.content) {
    toast("Connect GitHub first: website content isn't available yet.", { error: true });
    return;
  }
  const item = { ...TYPES.projects.create(), title: project.name, category: project.type || "", location: project.location || "", area: project.area || "", summary: project.summary || "", year: String((project.start || "").slice(0, 4) || new Date().getFullYear()) };
  item.slug = uniqueSlug("projects", item.title, item.id);
  cms().projects.unshift(item);
  changed();
  toast("Draft created in Portfolio. Add photos and a story, then publish.");
  location.hash = `#/portfolio/${item.id}`;
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
    type === "products" ? `<span>${item.type === AFFILIATE ? "Affiliate" : "Sold by us"}${item.price ? ` · ₹${escapeHTML(String(item.price))}` : ""}</span>` : "",
    type === "shopLists" ? `<span>${(item.productIds || []).length} products</span>` : "",
    item.location ? `<span>${escapeHTML(item.location)}</span>` : "",
  ].join("");
  const live = JSON.parse(state.savedJSON).cms?.[type]?.find((i) => i.id === item.id && i.status === "published");
  return `<div class="row" data-open="#/${routeOf(type)}/${item.id}">
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

const shopSettingsPanel = () => {
  const s = cms().shop;
  return `<section class="showcase" id="shop-settings"><div class="showcase-head"><span class="eyebrow">Shop settings</span><p class="muted">Delivery and payment rules used at checkout. Orders appear under <a href="#/orders">Orders</a>. Online payment (cards, UPI) turns on when Razorpay keys are added in Netlify; until then customers pay on delivery.</p></div>
  <div class="shop-set panel">
    <label class="field"><span>Delivery charge (₹)</span><input type="text" data-shop="shippingFlat" value="${escapeHTML(s.shippingFlat)}" placeholder="0 = free"></label>
    <label class="field"><span>Free delivery over (₹)</span><input type="text" data-shop="freeShippingOver" value="${escapeHTML(s.freeShippingOver)}" placeholder="e.g. 15000"></label>
    <label class="field"><span>Cash on delivery</span><select data-shop="codEnabled"><option ${s.codEnabled !== "No" ? "selected" : ""}>Yes</option><option ${s.codEnabled === "No" ? "selected" : ""}>No</option></select></label>
  </div></section>`;
};

const showcasePanel = () => {
  const cards = (cms().caseStudies || []).filter((c) => c && c.title);
  if (!cards.length) return "";
  const href = (u) => String(u || "").replace(/^\.\//, "/");
  return `<section class="showcase">
    <div class="showcase-head"><span class="eyebrow">Framer showcase</span><p class="muted">These ${cards.length} projects are the designed pages on the homepage. They are edited in Framer (the site's design tool), so they show here for reference only. Projects you add above get their own page under <code>/projects</code>.</p></div>
    <div class="showcase-grid">${cards
      .map((c) => `<a class="showcase-card" href="${escapeHTML(href(c.url))}" target="_blank" rel="noopener">
        <div class="showcase-img" style="background-image:url('${escapeHTML((c.image && c.image.src) || "")}')"></div>
        <div class="showcase-meta"><strong>${escapeHTML(c.title)}</strong><span>${escapeHTML(c.client || "")}</span><em>${escapeHTML(c.category || "")}</em></div></a>`)
      .join("")}</div>
  </section>`;
};

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
    <div id="list-body"></div>
    ${type === "projects" ? showcasePanel() : ""}${type === "products" ? shopSettingsPanel() : ""}`;

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

  $$("[data-shop]", view).forEach((input) => input.addEventListener("input", () => { cms().shop[input.dataset.shop] = input.value; changed(); }));
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
    case "productpick":
      return `<div class="field">${label(field.label)}<div class="pick" data-pick="${field.key}">${cms().products.length ? cms().products.map((p) => `<label><input type="checkbox" value="${escapeHTML(p.id)}" ${(value || []).includes(p.id) ? "checked" : ""}> ${escapeHTML(p.title || "Untitled")} <em>${p.status === "published" ? "" : "draft"}</em></label>`).join("") : '<p class="muted">Add products first.</p>'}</div></div>`;
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
    ${gallery.map((g, i) => {
      const isPDF = g.mediaType === "application/pdf" || (g.src || "").toLowerCase().split("?")[0].endsWith(".pdf");
      const preview = isPDF
        ? `<a class="gallery-document" href="${escapeHTML(resolveSrc(g.src))}" target="_blank" rel="noopener"><strong>PDF</strong><span>${escapeHTML(g.alt || "Open drawing")}</span></a>`
        : `<img src="${escapeHTML(resolveSrc(g.src))}" alt="${escapeHTML(g.alt || "")}">`;
      return `<div class="gallery-item">${preview}
        <label class="gallery-kind-label">Media type<select data-gallery-kind="${i}">${[["photo","Photo"],["render","3D render"],["plan","Plan"],["drawing","Technical drawing"],["document","Document"]].map(([v,l]) => `<option value="${v}" ${(g.kind || "photo") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="gallery-alt-label">Caption / alt text<input type="text" data-gallery-alt="${i}" value="${escapeHTML(g.alt || "")}" placeholder="Describe this image or drawing"></label>
        <div class="gallery-actions"><span><button type="button" title="Move left" data-gallery-move="-1" data-index="${i}">←</button> <button type="button" title="Move right" data-gallery-move="1" data-index="${i}">→</button></span><button type="button" title="Remove" data-gallery-remove="${i}">✕</button></div></div>`;
    }).join("")}
    <div class="gallery-add" data-gallery-add>＋ Add photos or PDFs<br>or drag them here</div>
  </div>`;

const renderEditor = (view, type, id) => {
  const config = TYPES[type];
  const item = cms()[type].find((i) => i.id === id);
  if (!item) {
    view.innerHTML = `<div class="panel"><h2>Not found</h2><p class="muted">This ${config.singular} may have been deleted.</p><a class="btn" href="#/${routeOf(type)}">Back to ${config.label}</a></div>`;
    return;
  }
  const live = JSON.parse(state.savedJSON).cms?.[type]?.find((i) => i.id === item.id && i.status === "published");

  view.innerHTML = `
    <div class="editor-head">
      <div class="left"><a class="btn small ghost" href="#/${routeOf(type)}">← ${config.label}</a></div>
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
    location.hash = `#/${routeOf(type)}`;
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

  $$("[data-pick]", view).forEach((box) =>
    box.addEventListener("change", () => {
      setPath(item, box.dataset.pick, $$("input:checked", box).map((i) => i.value));
      touch();
    })
  );

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
          const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
          const url = isPDF ? await uploadPDF(file) : await uploadImage(file);
          list().push({ src: url, alt: altFromName(file.name), kind: isPDF ? "drawing" : "photo", mediaType: isPDF ? "application/pdf" : file.type });
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
      $$("[data-gallery-kind]", box).forEach((select) => select.addEventListener("change", () => { list()[Number(select.dataset.galleryKind)].kind = select.value; touch(); }));
      $$("[data-gallery-alt]", box).forEach((input) => input.addEventListener("input", () => { list()[Number(input.dataset.galleryAlt)].alt = input.value; touch(); }));
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


const seoApi = async (body) => {
  const response = await fetch("/.netlify/functions/search-console", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};

const renderSEO = (view) => {
  const end = new Date(Date.now() - 3 * 86400000);
  const start = new Date(end);
  start.setDate(start.getDate() - 27);
  const iso = (d) => d.toISOString().slice(0, 10);
  view.innerHTML = `
    <div class="page-head"><div><h1>Search performance</h1><p>Google Search Console · Organic search visibility for the studio website.</p></div></div>
    <div class="panel seo-connect">
      <div><h2>Google Search Console</h2><p class="muted" id="seo-status">Checking connection…</p></div>
      <button type="button" class="btn primary" id="seo-connect">Connect Google</button>
    </div>
    <div class="panel" style="margin-top:18px">
      <div class="grid-2">
        <label class="field"><span>Search Console property</span><select id="seo-property"><option value="">Loading properties…</option></select></label>
        <label class="field"><span>Report</span><select id="seo-dimension"><option value="date">Daily trend</option><option value="query">Search queries</option><option value="page">Top pages</option><option value="country">Countries</option><option value="device">Devices</option></select></label>
        <label class="field"><span>Start date</span><input id="seo-start" type="date" value="${iso(start)}"></label>
        <label class="field"><span>End date</span><input id="seo-end" type="date" value="${iso(end)}"></label>
      </div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:16px"><button type="button" class="btn primary" id="seo-load">Load report</button><span class="muted" id="seo-message" role="status"></span></div>
    </div>
    <div class="stats seo-stats" id="seo-stats" style="margin-top:18px">
      <div class="panel stat"><span class="label">Clicks</span><span class="num">—</span><span class="sub">Select a property and load data</span></div>
      <div class="panel stat"><span class="label">Impressions</span><span class="num">—</span><span class="sub">Google organic results</span></div>
      <div class="panel stat"><span class="label">CTR</span><span class="num">—</span><span class="sub">Click-through rate</span></div>
      <div class="panel stat"><span class="label">Average position</span><span class="num">—</span><span class="sub">Lower is better</span></div>
    </div>
    <div class="panel" style="margin-top:18px"><h2 id="seo-table-title">Search data</h2><p class="muted" id="seo-table-note">Search Console data will appear here. Recent dates may be delayed by Google.</p><div class="table-wrap" id="seo-table"></div></div>
    <div class="notice warn" style="margin-top:18px">This is Google Search Console data only. Business Profile metrics are not connected. Your Google OAuth app is currently in Testing; its refresh token may expire after 7 days.</div>`;
  const status = $("#seo-status", view);
  const property = $("#seo-property", view);
  const message = $("#seo-message", view);
  const connect = $("#seo-connect", view);
  const load = $("#seo-load", view);
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const showError = (error) => { message.textContent = error.message; message.style.color = "var(--danger)"; };
  const loadSites = async () => {
    status.textContent = "Checking Google authorisation…";
    const data = await seoApi({ action: "sites" });
    property.innerHTML = data.sites.length ? data.sites.map((s) => `<option value="${escapeHTML(s.siteUrl)}">${escapeHTML(s.siteUrl)} · ${escapeHTML(s.permissionLevel)}</option>`).join("") : '<option value="">No accessible properties found</option>';
    status.textContent = data.sites.length ? `Connected · ${data.sites.length} Search Console propert${data.sites.length === 1 ? "y" : "ies"} available` : "Google connected, but no Search Console properties are accessible to this account.";
  };
  connect.addEventListener("click", async () => {
    connect.disabled = true;
    try {
      const response = await fetch("/.netlify/functions/google-oauth-start", { method: "POST", headers: { Authorization: `Bearer ${session.token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start Google connection.");
      location.href = data.url;
    } catch (error) { showError(error); connect.disabled = false; }
  });
  load.addEventListener("click", async () => {
    if (!property.value) { message.textContent = "Choose a property first."; return; }
    load.disabled = true; message.textContent = "Loading report…"; message.style.color = "var(--muted)";
    try {
      const dimension = $("#seo-dimension", view).value;
      const data = await seoApi({ action: "query", siteUrl: property.value, startDate: $("#seo-start", view).value, endDate: $("#seo-end", view).value, dimensions: [dimension] });
      const rows = data.rows || [];
      const totals = rows.reduce((a, r) => ({ clicks:a.clicks+r.clicks, impressions:a.impressions+r.impressions, positionWeighted:a.positionWeighted+r.position*r.impressions }), { clicks:0, impressions:0, positionWeighted:0 });
      const ctr = totals.impressions ? totals.clicks / totals.impressions : 0;
      const position = totals.impressions ? totals.positionWeighted / totals.impressions : 0;
      $("#seo-stats", view).innerHTML = [
        ["Clicks",fmt(totals.clicks),"Organic visits from Google"],
        ["Impressions",fmt(totals.impressions),"Appearances in Google results"],
        ["CTR",`${(ctr*100).toFixed(2)}%`,"Clicks ÷ impressions"],
        ["Average position",position ? position.toFixed(1) : "—","Impression-weighted average"]
      ].map(([label,num,sub]) => `<div class="panel stat"><span class="label">${label}</span><span class="num">${num}</span><span class="sub">${sub}</span></div>`).join("");
      $("#seo-table-title", view).textContent = dimension === "date" ? "Daily search performance" : `Performance by ${dimension}`;
      $("#seo-table-note", view).textContent = `${rows.length} rows · ${$("#seo-start",view).value} to ${$("#seo-end",view).value}`;
      const heading = dimension === "date" ? "Date" : dimension[0].toUpperCase()+dimension.slice(1);
      $("#seo-table", view).innerHTML = rows.length ? `<table class="data-table"><thead><tr><th>${heading}</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escapeHTML(r.keys?.[0] || "")}</td><td>${fmt(r.clicks)}</td><td>${fmt(r.impressions)}</td><td>${(r.ctr*100).toFixed(2)}%</td><td>${Number(r.position || 0).toFixed(1)}</td></tr>`).join("")}</tbody></table>` : '<p class="muted">No rows returned for this property and date range.</p>';
      message.textContent = "Report loaded."; message.style.color = "var(--ok)";
    } catch (error) { showError(error); }
    finally { load.disabled = false; }
  });
  loadSites().catch((error) => {
    status.textContent = "Not connected or connection expired.";
    connect.textContent = "Connect / reconnect Google";
    showError(error);
  });
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const renderSettings = (view) => {
  view.innerHTML = `<div class="page"><div class="page-head"><div><h1>Settings</h1><p>Your team, onboarding checklist and backups save automatically. Website details are published with the Publish button.</p></div></div><div class="settings-body"></div></div>`;
  const body = $(".settings-body", view);
  if (state.content) renderWebsiteSettings(body);
  else body.innerHTML = `<div class="panel"><h2>Website details</h2><p class="muted">Connect GitHub to edit the website's contact details and page headings. ${escapeHTML(state.contentError)}</p></div>`;
  renderStudioSettings(body);
};

const renderWebsiteSettings = (view) => {
  const c = cms();
  const intro = (key, label) => `
    <div class="grid-2">
      <label class="field"><span>${label} page title</span><input type="text" data-intro="${key}.title" value="${escapeHTML(c.pagesIntro[key].title || "")}" placeholder="${escapeHTML({ blog: "Journal", projects: "Projects", updates: "Studio Updates" }[key])}"></label>
      <label class="field"><span>${label} page intro</span><input type="text" data-intro="${key}.description" value="${escapeHTML(c.pagesIntro[key].description || "")}"></label>
    </div>`;

  view.innerHTML = `
    <div class="panel">
      <h2>Website contact details</h2>
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
// Shell: sidebar, search, live refresh
// ---------------------------------------------------------------------------

$$("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon, 18)));
$("#search-button").insertAdjacentHTML("afterbegin", icon("search", 16));
$("#menu-button").innerHTML = icon("menu", 20);

const renderMe = () => {
  const box = $("#me-box");
  if (!team().length) {
    box.innerHTML = '<a href="#/settings">Add your team →</a>';
    return;
  }
  box.innerHTML = `<label><span>Signed in as</span><select aria-label="Who are you?"><option value="">Choose…</option>${team().map((m) => `<option value="${escapeHTML(m.id)}"${m.id === meId() ? " selected" : ""}>${escapeHTML(m.name)}</option>`).join("")}</select></label>`;
  $("select", box).addEventListener("change", (e) => setMe(e.target.value));
};

onData((kind) => {
  if (kind === "sync") updateSaveState();
  if (kind === "me" || kind === "load" || kind === "remote") renderMe();
});

$("#search-button").addEventListener("click", openPalette);
$("#menu-button").addEventListener("click", () => document.body.classList.toggle("nav-open"));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && studio.loaded) {
    event.preventDefault();
    openPalette();
  }
});

// Pick up changes made on another device (checked every 45s and when the tab regains focus)
let pollTimer;
const startPolling = () => {
  if (pollTimer) return;
  const tick = async () => {
    if (document.hidden || !studio.loaded) return;
    const changedRemotely = await refresh();
    if (changedRemotely && !drawerIsOpen() && !isWebsiteRoute()) app.render();
  };
  pollTimer = setInterval(tick, 45000);
  document.addEventListener("visibilitychange", () => !document.hidden && tick());
};

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

renderMe();
if (session.token) start();
else showLogin();
