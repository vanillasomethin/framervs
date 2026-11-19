// Shared UI kit for the studio views: icons, formatting, drawers, forms,
// menus, dialogs and photo handling.

import { $, $$, uid, studioApi, toast } from "../core.js";
import { today, daysBetween, team, member } from "./data.js";

// ---------------------------------------------------------------------------
// Basics

export const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tasks: '<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="m8 12.2 2.8 2.8L16 9.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.7 3.5 2.6 3.5 5.6"/>',
  site: '<path d="M4 16v-1a8 8 0 0 1 16 0v1"/><path d="M2 16h20v3.5H2z"/><path d="M12 7v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.8" cy="6" r=".6"/><circle cx="3.8" cy="12" r=".6"/><circle cx="3.8" cy="18" r=".6"/>',
  board: '<rect x="3" y="3" width="5.5" height="18" rx="1.6"/><rect x="9.8" y="3" width="5.5" height="12" rx="1.6"/><rect x="16.5" y="3" width="4.5" height="8" rx="1.6"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="M3 9.5h18M3 14.8h18M9 4v16"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m14 6 4 4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v5M12 17.4v.1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  send: '<path d="M21 3 3 10l7 3 3 7z"/><path d="m10 13 11-10"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M4 20h16"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="m21 16-5-4.5L7 20"/>',
  megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>',
};

export const icon = (name, size = 18) =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

// ---------------------------------------------------------------------------
// Formatting

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const fmtDate = (iso, { year = false } = {}) => {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y) return "";
  return `${d} ${MONTHS[m - 1]}${year || y !== new Date().getFullYear() ? ` ${y}` : ""}`;
};

export const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${fmtDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)}, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
};

export const timeAgo = (iso) => {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
  return fmtDate(iso.slice(0, 10));
};

// Due date as { text, tone } relative to today
export const relDue = (due, done = false) => {
  if (!due) return { text: "", tone: "" };
  const diff = daysBetween(today(), due);
  if (done) return { text: fmtDate(due), tone: "" };
  if (diff < 0) return { text: `${-diff}d overdue`, tone: "bad" };
  if (diff === 0) return { text: "Today", tone: "warn" };
  if (diff === 1) return { text: "Tomorrow", tone: "warn" };
  if (diff <= 7) return { text: `in ${diff}d`, tone: "" };
  return { text: fmtDate(due), tone: "" };
};

export const money = (n) => {
  const v = Number(n);
  if (!v) return "–";
  if (v >= 1e7) return `₹${+(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${+(v / 1e5).toFixed(1)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
};

export const initials = (name) =>
  String(name || "?")
    .replace(/^(ar\.|mr\.|mrs\.|ms\.|dr\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export const avatar = (name, size = 28) => {
  let hash = 0;
  for (const ch of String(name || "")) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `<span class="avatar" style="--s:${size}px;background:hsl(${hash} 42% 90%);color:hsl(${hash} 40% 26%)" title="${esc(name || "Unassigned")}">${esc(initials(name))}</span>`;
};

export const personChip = (id) => {
  const m = member(id);
  return m ? `<span class="person">${avatar(m.name, 22)}<span>${esc(m.name.split(" ")[0])}</span></span>` : "";
};

export const pill = (label, tone = "mute") => `<span class="pill ${tone}">${esc(label)}</span>`;

export const progressBar = (ratio, tone = "") =>
  `<span class="bar ${tone}" title="${ratio == null ? "No tasks yet" : `${Math.round(ratio * 100)}% complete`}"><i style="width:${ratio == null ? 0 : Math.round(ratio * 100)}%"></i></span>`;

export const ring = (done, total, size = 44) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  const ratio = total ? done / total : 0;
  return `<span class="ring" style="--s:${size}px"><svg viewBox="0 0 44 44" width="${size}" height="${size}"><circle cx="22" cy="22" r="${r}" class="ring-bg"/><circle cx="22" cy="22" r="${r}" class="ring-fg" stroke-dasharray="${(c * ratio).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/></svg><b>${done}/${total}</b></span>`;
};

export const optionsHTML = (options, selected, { blank } = {}) =>
  `${blank !== undefined ? `<option value="">${esc(blank)}</option>` : ""}${options
    .map((o) => {
      const id = typeof o === "string" ? o : o.id;
      const label = typeof o === "string" ? o : o.label;
      return `<option value="${esc(id)}"${id === selected ? " selected" : ""}>${esc(label)}</option>`;
    })
    .join("")}`;

export const teamOptions = () => team().map((m) => ({ id: m.id, label: m.name }));

// ---------------------------------------------------------------------------
// Photos: resized in the browser, stored privately, loaded on demand

const photoCache = new Map();

export const loadPhoto = async (id) => {
  if (photoCache.has(id)) return photoCache.get(id);
  const result = await studioApi({ action: "photo.get", id });
  const url = `data:${result.type};base64,${result.data}`;
  photoCache.set(id, url);
  return url;
};

export const uploadPhoto = async (file) => {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Couldn't read ${file.name}. HEIC photos from an iPhone need exporting as JPG first.`);
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 1_300_000 && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  const id = `ph_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await studioApi({ action: "photo.put", id, type: "image/jpeg", data: dataUrl.split(",")[1] });
  photoCache.set(id, dataUrl);
  return id;
};

export const hydratePhotos = (root) => {
  $$("img[data-photo]", root).forEach((img) => {
    if (img.dataset.loaded) return;
    img.dataset.loaded = "1";
    loadPhoto(img.dataset.photo)
      .then((url) => (img.src = url))
      .catch(() => img.classList.add("broken"));
  });
};

export const photoGrid = (ids = []) =>
  ids.length ? `<div class="photo-grid">${ids.map((id) => `<button type="button" class="photo" data-lightbox="${esc(id)}"><img data-photo="${esc(id)}" alt="Site photo"></button>`).join("")}</div>` : "";

export const openLightbox = async (id) => {
  const el = document.createElement("div");
  el.className = "lightbox";
  el.innerHTML = '<button class="icon-btn light" aria-label="Close">' + icon("x", 22) + '</button><img alt="">';
  document.body.appendChild(el);
  const close = () => {
    el.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  document.addEventListener("keydown", onKey);
  el.addEventListener("click", close);
  try {
    $("img", el).src = await loadPhoto(id);
  } catch {
    close();
  }
};

export const bindLightbox = (root) =>
  root.addEventListener("click", (e) => {
    const target = e.target.closest("[data-lightbox]");
    if (target) openLightbox(target.dataset.lightbox);
  });

// ---------------------------------------------------------------------------
// Forms: described by a spec array, rendered, bound and read back generically
//
//   { key, label, type, options, placeholder, hint, half, required }
//   types: text, textarea, number, date, select, team, tags, checklist, photos, links

export const formHTML = (spec, values) => {
  const fields = spec
    .map((f) => {
      const v = values[f.key];
      const id = `f_${f.key}`;
      const label = f.label ? `<span class="lbl">${esc(f.label)}${f.required ? " *" : ""}${f.hint ? ` <em>${esc(f.hint)}</em>` : ""}</span>` : "";
      let control = "";
      switch (f.type) {
        case "textarea":
          control = `<textarea id="${id}" data-key="${f.key}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || "")}">${esc(v || "")}</textarea>`;
          break;
        case "number":
          control = `<input id="${id}" data-key="${f.key}" type="number" min="0" step="any" inputmode="decimal" value="${esc(v ?? "")}" placeholder="${esc(f.placeholder || "")}">`;
          break;
        case "date":
          control = `<input id="${id}" data-key="${f.key}" type="date" value="${esc(v || "")}">`;
          break;
        case "select":
          control = `<select id="${id}" data-key="${f.key}">${optionsHTML(f.options, v, { blank: f.blank })}</select>`;
          break;
        case "team":
          control = `<select id="${id}" data-key="${f.key}">${optionsHTML(teamOptions(), v, { blank: "Unassigned" })}</select>`;
          break;
        case "tags":
          control = `<input id="${id}" data-key="${f.key}" data-tags type="text" value="${esc((v || []).join(", "))}" placeholder="${esc(f.placeholder || "Comma separated")}">`;
          break;
        case "checklist":
          control = `<div class="cl" data-key="${f.key}" data-widget="checklist"></div>`;
          break;
        case "photos":
          control = `<div class="photos-field" data-key="${f.key}" data-widget="photos"></div>`;
          break;
        case "links":
          control = `<div class="links-field" data-key="${f.key}" data-widget="links"></div>`;
          break;
        default:
          control = `<input id="${id}" data-key="${f.key}" type="text" value="${esc(v ?? "")}" placeholder="${esc(f.placeholder || "")}"${f.list ? ` list="${id}_list"` : ""}>${
            f.list ? `<datalist id="${id}_list">${f.list.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>` : ""
          }`;
      }
      const widget = ["checklist", "photos", "links"].includes(f.type);
      return widget
        ? `<div class="field wide">${label}${control}</div>`
        : `<label class="field${f.half ? " half" : ""}" for="${id}">${label}${control}</label>`;
    })
    .join("");
  return `<div class="form-grid">${fields}</div>`;
};

const checklistWidget = (box, items, { addLabel = "Add an item" } = {}) => {
  const state = items.map((i) => ({ ...i }));
  const draw = () => {
    box.innerHTML = `${state
      .map(
        (i, n) => `<div class="cl-row"><input type="checkbox" ${i.done ? "checked" : ""} data-n="${n}" aria-label="Done"><input type="text" value="${esc(i.text)}" data-n="${n}" data-text placeholder="Item"><button type="button" class="icon-btn small" data-rm="${n}" aria-label="Remove">${icon("x", 14)}</button></div>`
      )
      .join("")}<div class="cl-add"><input type="text" placeholder="${esc(addLabel)} and press Enter"></div>`;
  };
  draw();
  box.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") state[Number(e.target.dataset.n)].done = e.target.checked;
  });
  box.addEventListener("input", (e) => {
    if (e.target.dataset.text !== undefined) state[Number(e.target.dataset.n)].text = e.target.value;
  });
  box.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) {
      state.splice(Number(rm.dataset.rm), 1);
      draw();
    }
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.closest(".cl-add")) {
      e.preventDefault();
      const text = e.target.value.trim();
      if (!text) return;
      state.push({ id: uid("ck_"), text, done: false });
      draw();
      $(".cl-add input", box).focus();
    }
  });
  box._read = () => state.filter((i) => i.text.trim()).map((i) => ({ id: i.id, text: i.text.trim(), done: Boolean(i.done) }));
};

const photosWidget = (box, ids) => {
  const state = [...ids];
  const draw = () => {
    box.innerHTML = `<div class="photo-grid">${state
      .map((id, n) => `<div class="photo"><img data-photo="${esc(id)}" alt="Site photo"><button type="button" class="photo-rm" data-rm="${n}" aria-label="Remove photo">${icon("x", 12)}</button></div>`)
      .join("")}<button type="button" class="photo add" data-add>${icon("camera", 22)}<span>Add photos</span></button></div>`;
    hydratePhotos(box);
  };
  draw();
  box.addEventListener("click", async (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) {
      state.splice(Number(rm.dataset.rm), 1);
      draw();
      return;
    }
    if (!e.target.closest("[data-add]")) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      box.classList.add("busy");
      for (const file of Array.from(input.files || []).slice(0, 12)) {
        try {
          state.push(await uploadPhoto(file));
          draw();
        } catch (error) {
          toast(esc(error.message), { error: true });
        }
      }
      box.classList.remove("busy");
    };
    input.click();
  });
  box._read = () => [...state];
};

const linksWidget = (box, items) => {
  const state = items.map((i) => ({ ...i }));
  const draw = () => {
    box.innerHTML = `${state
      .map(
        (l, n) => `<div class="link-row"><input type="text" value="${esc(l.label)}" data-n="${n}" data-f="label" placeholder="Label (e.g. Drawings folder)"><input type="url" value="${esc(l.url)}" data-n="${n}" data-f="url" placeholder="https://…"><button type="button" class="icon-btn small" data-rm="${n}" aria-label="Remove">${icon("x", 14)}</button></div>`
      )
      .join("")}<button type="button" class="btn small ghost" data-add>${icon("plus", 14)} Add link</button>`;
  };
  draw();
  box.addEventListener("input", (e) => {
    if (e.target.dataset.f) state[Number(e.target.dataset.n)][e.target.dataset.f] = e.target.value;
  });
  box.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) {
      state.splice(Number(rm.dataset.rm), 1);
      draw();
    } else if (e.target.closest("[data-add]")) {
      state.push({ id: uid("ln_"), label: "", url: "" });
      draw();
      $$(".link-row input", box).slice(-2)[0]?.focus();
    }
  });
  box._read = () => state.filter((l) => l.url.trim()).map((l) => ({ id: l.id, label: l.label.trim() || l.url.trim(), url: l.url.trim() }));
};

export const bindForm = (root, spec, values) => {
  for (const f of spec) {
    const box = $(`[data-widget][data-key="${f.key}"]`, root);
    if (!box) continue;
    if (f.type === "checklist") checklistWidget(box, values[f.key] || [], { addLabel: f.addLabel });
    if (f.type === "photos") photosWidget(box, values[f.key] || []);
    if (f.type === "links") linksWidget(box, values[f.key] || []);
  }
};

export const readForm = (root, spec) => {
  const out = {};
  for (const f of spec) {
    if (["checklist", "photos", "links"].includes(f.type)) {
      const box = $(`[data-widget][data-key="${f.key}"]`, root);
      out[f.key] = box && box._read ? box._read() : [];
      continue;
    }
    const el = $(`[data-key="${f.key}"]`, root);
    if (!el) continue;
    if (f.type === "tags") out[f.key] = el.value.split(",").map((t) => t.trim()).filter(Boolean);
    else if (f.type === "number") out[f.key] = el.value === "" ? "" : Number(el.value);
    else out[f.key] = el.value.trim();
  }
  return out;
};

// ---------------------------------------------------------------------------
// Drawer (side panel) with a form, used for creating and editing everything

let openDrawers = 0;
export const drawerIsOpen = () => openDrawers > 0;

export const openDrawer = ({ title, subtitle = "", spec, values = {}, saveLabel = "Save", onSave, onDelete, deleteLabel = "Delete", before = "", after = "", bind }) => {
  const backdrop = document.createElement("div");
  backdrop.className = "drawer-backdrop";
  backdrop.innerHTML = `<aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="drawer-head"><div><h2>${esc(title)}</h2>${subtitle ? `<p class="muted">${subtitle}</p>` : ""}</div><button type="button" class="icon-btn" data-close aria-label="Close">${icon("x", 20)}</button></header>
    <div class="drawer-body">${before}<form novalidate>${formHTML(spec, values)}</form>${after}</div>
    <footer class="drawer-foot">${onDelete ? `<button type="button" class="btn danger ghost" data-delete>${icon("trash", 16)} ${esc(deleteLabel)}</button>` : ""}<span class="grow"></span><button type="button" class="btn" data-close>Cancel</button><button type="button" class="btn primary" data-save>${esc(saveLabel)}</button></footer>
  </aside>`;
  document.body.appendChild(backdrop);
  openDrawers += 1;
  requestAnimationFrame(() => backdrop.classList.add("in"));

  const form = $("form", backdrop);
  bindForm(form, spec, values);
  hydratePhotos(backdrop);
  if (bind) bind(backdrop);
  const initial = JSON.stringify(readForm(form, spec));

  const finish = () => {
    openDrawers -= 1;
    document.removeEventListener("keydown", onKey);
    backdrop.classList.remove("in");
    setTimeout(() => backdrop.remove(), 180);
  };
  const close = async (force = false) => {
    if (!force && JSON.stringify(readForm(form, spec)) !== initial && !(await confirmBox({ title: "Discard changes?", message: "You have edits that haven't been saved.", confirmLabel: "Discard", danger: true }))) return;
    finish();
  };
  const onKey = (e) => {
    if (e.key === "Escape" && !$(".dialog-backdrop")) close();
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
  };
  const save = async () => {
    const out = readForm(form, spec);
    const missing = spec.find((f) => f.required && !String(out[f.key] ?? "").trim());
    if (missing) {
      const el = $(`[data-key="${missing.key}"]`, form);
      el?.classList.add("invalid");
      el?.focus();
      toast(`Please fill in “${esc(missing.label)}”.`, { error: true });
      return;
    }
    const button = $("[data-save]", backdrop);
    button.disabled = true;
    try {
      const result = await onSave(out);
      if (result !== false) finish();
    } finally {
      button.disabled = false;
    }
  };
  document.addEventListener("keydown", onKey);
  backdrop.addEventListener("mousedown", (e) => e.target === backdrop && close());
  backdrop.addEventListener("click", async (e) => {
    if (e.target.closest("[data-close]")) close();
    else if (e.target.closest("[data-save]")) save();
    else if (e.target.closest("[data-delete]")) {
      if (await confirmBox({ title: `${deleteLabel}?`, message: "This can't be undone.", confirmLabel: deleteLabel, danger: true })) {
        await onDelete();
        finish();
      }
    }
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  bindLightbox(backdrop);
  setTimeout(() => $("input[type=text], textarea", form)?.focus(), 60);
  return { el: backdrop, close: () => finish() };
};

// ---------------------------------------------------------------------------
// Dialogs and menus

export const confirmBox = ({ title, message = "", confirmLabel = "Confirm", danger = false }) =>
  new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "dialog-backdrop";
    el.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true"><h3>${esc(title)}</h3>${message ? `<p class="muted">${esc(message)}</p>` : ""}<div class="dialog-actions"><button class="btn" data-no>Cancel</button><button class="btn ${danger ? "danger-solid" : "primary"}" data-yes>${esc(confirmLabel)}</button></div></div>`;
    document.body.appendChild(el);
    const done = (answer) => {
      document.removeEventListener("keydown", onKey, true);
      el.remove();
      resolve(answer);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        done(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-yes]")) done(true);
      else if (e.target.closest("[data-no]") || e.target === el) done(false);
    });
    $("[data-yes]", el).focus();
  });

export const openMenu = (anchor, items) => {
  $$(".menu").forEach((m) => m.remove());
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.innerHTML = items
    .map((item, n) => (item === "-" ? '<hr>' : `<button type="button" data-n="${n}" class="${item.danger ? "danger" : ""}">${item.icon ? icon(item.icon, 16) : ""}<span>${esc(item.label)}</span></button>`))
    .join("");
  document.body.appendChild(menu);
  const rect = anchor.getBoundingClientRect();
  const width = menu.offsetWidth;
  menu.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - menu.offsetHeight - 8) + window.scrollY}px`;
  menu.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)) + window.scrollX}px`;
  const close = () => {
    menu.remove();
    document.removeEventListener("mousedown", onDown, true);
    document.removeEventListener("keydown", onKey, true);
  };
  const onDown = (e) => !menu.contains(e.target) && close();
  const onKey = (e) => e.key === "Escape" && close();
  setTimeout(() => document.addEventListener("mousedown", onDown, true));
  document.addEventListener("keydown", onKey, true);
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-n]");
    if (!b) return;
    close();
    items[Number(b.dataset.n)].onClick();
  });
};

export const copyText = async (text, message = "Copied to clipboard") => {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    window.prompt("Copy this:", text);
  }
};

export const emptyState = ({ iconName = "sparkle", title, text, action = "" }) =>
  `<div class="empty-state">${icon(iconName, 28)}<h3>${esc(title)}</h3><p>${text}</p>${action}</div>`;

// Mount new HTML into the view with fresh listeners (no handler build-up on re-render)
export const mount = (view, html) => {
  view.innerHTML = "";
  const root = document.createElement("div");
  root.className = "page";
  root.innerHTML = html;
  view.appendChild(root);
  hydratePhotos(root);
  bindLightbox(root);
  return root;
};
