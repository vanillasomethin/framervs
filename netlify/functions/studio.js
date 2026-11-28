// Private studio API behind /admin: clients, projects, tasks, site logs, snags,
// milestones, activity, onboarding links, site photos, and website controls.
//
// Auth: the same signed session as cms.js (login happens there).
// Data: Netlify Blobs via lib/store.js. Nothing here touches the public repo.
//
// Required: ADMIN_PASSWORD.
// Optional: NETLIFY_BUILD_HOOK (https://api.netlify.com/build_hooks/...) for the
// "Rebuild website" button; SITE_URL to override the address health checks use.

const crypto = require("crypto");
const { json, isAuthorized, parseBody } = require("./lib/auth");
const { getStudioStore, readDoc, mutate } = require("./lib/store");

// briefs are written only by the public onboarding form (onboard.js),
// reviews only by the estimator rating form (estimator-review.js)
const WRITABLE = ["clients", "projects", "tasks", "logs", "snags", "milestones", "activity", "leads", "docs", "proposals", "expenses", "leaves", "holidays", "incidents"];
const COLLECTIONS = [...WRITABLE, "briefs", "reviews"];
const MAX_ITEMS = 5000;
const MAX_ITEM_BYTES = 24 * 1024;
const MAX_PHOTO_CHARS = 1_400_000; // base64 of roughly 1 MB
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TOKEN_DAYS = 45;
const ID = /^[A-Za-z0-9_-]{4,40}$/;

const key = (name) => `c/${name}`;
const isPlain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
// An error the client should not retry (the same request can never succeed)
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const validItem = (item) =>
  item &&
  typeof item === "object" &&
  !Array.isArray(item) &&
  typeof item.id === "string" &&
  ID.test(item.id) &&
  Buffer.byteLength(JSON.stringify(item)) <= MAX_ITEM_BYTES;

const clean = (item) => {
  const out = {};
  for (const [k, v] of Object.entries(item)) if (k !== "__proto__" && k !== "constructor" && !k.startsWith("$")) out[k] = v;
  return out;
};

// ---------------------------------------------------------------------------

const load = async (store, since = {}) => {
  const revs = {};
  const collections = {};
  await Promise.all(
    COLLECTIONS.map(async (name) => {
      const doc = (await readDoc(store, key(name))) || { rev: 0, items: [] };
      revs[name] = doc.rev;
      if (since[name] !== doc.rev) collections[name] = doc.items;
    })
  );
  const settingsDoc = await readDoc(store, "settings");
  revs.settings = settingsDoc ? settingsDoc.rev : 0;
  const tokensDoc = (await readDoc(store, "tokens")) || {};
  const tokens = {};
  for (const [token, info] of Object.entries(tokensDoc)) tokens[info.clientId] = { token, created: info.created, expires: info.expires };
  return {
    revs,
    collections,
    settings: since.settings === revs.settings ? undefined : settingsDoc ? settingsDoc.value : null,
    tokens,
  };
};

const save = async (store, ops) => {
  if (!Array.isArray(ops) || ops.length > 400) return json(400, { error: "Too many changes at once." });
  const byCollection = {};
  let settingsOp = null;
  for (const op of ops) {
    if (op && op.c === "settings" && op.op === "set") settingsOp = op;
    else if (op && WRITABLE.includes(op.c) && ["set", "del", "patch"].includes(op.op)) (byCollection[op.c] ||= []).push(op);
    else return json(400, { error: "Unknown change." });
  }
  const now = new Date().toISOString();
  const revs = {};
  const merged = {}; // records after field-level merging, so the client can adopt other devices' changes

  for (const [name, list] of Object.entries(byCollection)) {
    for (const op of list) {
      if (op.op === "set" && !validItem(op.item)) return json(400, { error: `An item in ${name} is invalid or too large.` });
      if (op.op === "patch" && !(typeof op.id === "string" && ID.test(op.id) && isPlain(op.fields) && validItem(op.item) && op.item.id === op.id)) {
        return json(400, { error: `An edit to ${name} is invalid or too large.` });
      }
    }
    let mergedItems = [];
    const result = await mutate(store, key(name), (doc) => {
      mergedItems = []; // reset: this callback reruns if another save lands first
      let items = doc ? doc.items : [];
      for (const op of list) {
        if (op.op === "del") {
          items = items.filter((i) => i.id !== op.id);
          continue;
        }
        if (op.op === "patch") {
          const index = items.findIndex((i) => i.id === op.id);
          if (index === -1) {
            // The record is gone (deleted elsewhere): keep this edit by recreating it from the full copy
            if (items.length >= MAX_ITEMS) throw badRequest(`Too many ${name}.`);
            items.push({ ...clean(op.item), createdAt: op.item.createdAt || now, updatedAt: now });
          } else {
            // Field-level merge: only the fields this device changed are applied, so edits other
            // devices made to other fields of the same record are kept.
            const next = { ...items[index] };
            for (const [field, value] of Object.entries(clean(op.fields))) {
              if (field === "id" || field === "createdAt" || field === "updatedAt") continue;
              if (value === null) delete next[field];
              else next[field] = value;
            }
            next.updatedAt = now;
            if (Buffer.byteLength(JSON.stringify(next)) > MAX_ITEM_BYTES) throw badRequest(`An item in ${name} is too large.`);
            items[index] = next;
          }
          mergedItems.push(items.find((i) => i.id === op.id));
          continue;
        }
        const incoming = clean(op.item);
        const index = items.findIndex((i) => i.id === incoming.id);
        if (index === -1) {
          if (items.length >= MAX_ITEMS) throw badRequest(`Too many ${name}.`);
          items.push({ ...incoming, createdAt: incoming.createdAt || now, updatedAt: now });
        } else {
          items[index] = { ...incoming, createdAt: items[index].createdAt || now, updatedAt: now };
        }
      }
      if (name === "activity") items = items.slice(-300);
      return { rev: (doc ? doc.rev : 0) + 1, items };
    });
    revs[name] = result.rev;
    if (mergedItems.length) merged[name] = mergedItems;
  }

  if (settingsOp) {
    if (!settingsOp.value || typeof settingsOp.value !== "object" || Buffer.byteLength(JSON.stringify(settingsOp.value)) > 40 * 1024) {
      return json(400, { error: "Settings are invalid or too large." });
    }
    const doc = await mutate(store, "settings", (current) => ({ rev: (current ? current.rev : 0) + 1, value: clean(settingsOp.value) }));
    revs.settings = doc.rev;
  }
  return json(200, { ok: true, revs, at: now, merged });
};

// ---------------------------------------------------------------------------

const putPhoto = async (store, { id, type, data }) => {
  if (!/^ph_[a-z0-9]{6,30}$/.test(id || "")) return json(400, { error: "Invalid photo id." });
  if (!PHOTO_TYPES.includes(type)) return json(400, { error: "Only JPG, PNG or WebP photos are supported." });
  if (typeof data !== "string" || !data || data.length > MAX_PHOTO_CHARS) return json(413, { error: "Photo is too large. Try a smaller one." });
  await store.setJSON(`photo/${id}`, { type, data, at: new Date().toISOString() });
  return json(200, { ok: true });
};

const getPhoto = async (store, { id }) => {
  if (!/^ph_[a-z0-9]{6,30}$/.test(id || "")) return json(400, { error: "Invalid photo id." });
  const photo = await readDoc(store, `photo/${id}`);
  return photo ? json(200, photo) : json(404, { error: "Photo not found." });
};

const deletePhotos = async (store, { ids }) => {
  for (const id of (Array.isArray(ids) ? ids : []).slice(0, 50)) {
    if (/^ph_[a-z0-9]{6,30}$/.test(id)) await store.delete(`photo/${id}`);
  }
  return json(200, { ok: true });
};

// ---------------------------------------------------------------------------
// Client onboarding links (the public form lives in onboard.js)

const createToken = async (store, { clientId }) => {
  if (!ID.test(clientId || "")) return json(400, { error: "Invalid client." });
  const token = crypto.randomBytes(16).toString("hex");
  const now = Date.now();
  const info = { clientId, created: new Date(now).toISOString(), expires: new Date(now + TOKEN_DAYS * 86400000).toISOString() };
  await mutate(store, "tokens", (doc) => {
    const next = {};
    for (const [t, i] of Object.entries(doc || {})) if (i.clientId !== clientId && new Date(i.expires).getTime() > now) next[t] = i;
    next[token] = info;
    return next;
  });
  return json(200, { token, ...info });
};

const revokeToken = async (store, { clientId }) => {
  await mutate(store, "tokens", (doc) => {
    if (!doc) return undefined;
    const next = {};
    for (const [t, i] of Object.entries(doc)) if (i.clientId !== clientId) next[t] = i;
    return next;
  });
  return json(200, { ok: true });
};

const deleteBrief = async (store, { clientId }) => {
  if (!ID.test(clientId || "")) return json(400, { error: "Invalid client." });
  await mutate(store, key("briefs"), (doc) => {
    if (!doc || !doc.items.some((b) => b.id === clientId)) return undefined;
    return { rev: doc.rev + 1, items: doc.items.filter((b) => b.id !== clientId) };
  });
  return json(200, { ok: true });
};

// ---------------------------------------------------------------------------
// Website controls

const siteBase = (event) => {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const proto = event.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
};

const HEALTH_PAGES = [
  ["Home", "/"],
  ["Showcase", "/project-showcase"],
  ["Contact", "/contact"],
  ["Estimator", "/estimator/"],
  ["Journal", "/blog/"],
  ["Portfolio", "/projects/"],
  ["Updates", "/updates/"],
  ["Sitemap", "/sitemap.xml"],
];

const health = async (event) => {
  const base = siteBase(event);
  const results = await Promise.all(
    HEALTH_PAGES.map(async ([label, path]) => {
      const started = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${base}${path}`, { redirect: "follow", signal: controller.signal, headers: { "User-Agent": "vs-admin-health" } });
        return { label, path, status: response.status, ok: response.ok, ms: Date.now() - started };
      } catch (error) {
        return { label, path, status: 0, ok: false, ms: Date.now() - started, error: error.name === "AbortError" ? "Timed out" : "Unreachable" };
      } finally {
        clearTimeout(timer);
      }
    })
  );
  return json(200, { base, checkedAt: new Date().toISOString(), results });
};

const rebuild = async () => {
  const hook = process.env.NETLIFY_BUILD_HOOK;
  if (!hook) return json(400, { error: "Add a build hook first: Netlify → Site configuration → Build & deploy → Build hooks, then set NETLIFY_BUILD_HOOK to its URL.", setup: true });
  if (!/^https:\/\/api\.netlify\.com\/build_hooks\/[\w-]+/.test(hook)) return json(500, { error: "NETLIFY_BUILD_HOOK doesn't look like a Netlify build hook URL." });
  const response = await fetch(hook, { method: "POST" });
  if (!response.ok) return json(502, { error: `Netlify refused the rebuild (${response.status}).` });
  return json(200, { ok: true });
};

// Gapless document numbers (invoices must be sequential): one atomic counter per
// series and financial year, e.g. series "VS-INV/26-27".
const nextNumber = async (store, body) => {
  const series = String(body.series || "");
  if (!/^[A-Z0-9][A-Z0-9/-]{1,24}$/.test(series)) throw badRequest("Invalid number series.");
  const doc = await mutate(store, "counters", (current) => ({ rev: (current?.rev || 0) + 1, counts: { ...(current?.counts || {}), [series]: ((current?.counts || {})[series] || 0) + 1 } }));
  return json(200, { n: doc.counts[series] });
};

// ---------------------------------------------------------------------------
// Backup / restore (photos are not included: they can be large)

const exportAll = async (store) => {
  const data = { exportedAt: new Date().toISOString(), version: 1, collections: {}, settings: null, counters: null };
  for (const name of COLLECTIONS) data.collections[name] = ((await readDoc(store, key(name))) || { items: [] }).items;
  const settings = await readDoc(store, "settings");
  const counters = await readDoc(store, "counters");
  data.settings = settings ? settings.value : null;
  data.counters = counters ? { rev: counters.rev || 0, counts: counters.counts || {} } : { rev: 0, counts: {} };
  return json(200, data);
};

const importAll = async (store, { data }) => {
  if (!data || data.version !== 1 || typeof data.collections !== "object") return json(400, { error: "That file isn't a studio backup." });
  for (const name of COLLECTIONS) {
    const items = data.collections[name];
    if (items === undefined) continue;
    if (!Array.isArray(items) || items.length > MAX_ITEMS || !items.every(validItem)) return json(400, { error: `The backup's ${name} data is invalid.` });
  }
  if (data.counters !== undefined && (!data.counters || typeof data.counters !== "object" || !data.counters.counts || typeof data.counters.counts !== "object" || Array.isArray(data.counters.counts) || Object.entries(data.counters.counts).some(([series, n]) => !/^[A-Z0-9][A-Z0-9/-]{1,24}$/.test(series) || !Number.isSafeInteger(n) || n < 0))) {
    return json(400, { error: "The backup's numbering counters are invalid." });
  }
  for (const name of COLLECTIONS) {
    const items = data.collections[name];
    if (items !== undefined) await mutate(store, key(name), (doc) => ({ rev: (doc ? doc.rev : 0) + 1, items: items.map(clean) }));
  }
  if (data.counters) {
    await mutate(store, "counters", (doc) => ({ rev: (doc?.rev || 0) + 1, counts: { ...(doc?.counts || {}), ...data.counters.counts } }));
  } else {
    // Older v1 backups did not contain counters. Rebuild them from numbered documents.
    const counts = {};
    for (const doc of data.collections.docs || []) {
      const match = String(doc.number || "").match(/^([A-Z0-9-]+)\/(\d{2}-\d{2})\/(\d+)$/);
      if (!match) continue;
      const series = `${match[1]}/${match[2]}`;
      counts[series] = Math.max(counts[series] || 0, Number(match[3]));
    }
    if (Object.keys(counts).length) await mutate(store, "counters", (doc) => ({ rev: (doc?.rev || 0) + 1, counts: { ...(doc?.counts || {}), ...counts } }));
  }
  if (data.settings && typeof data.settings === "object") {
    await mutate(store, "settings", (doc) => ({ rev: (doc ? doc.rev : 0) + 1, value: clean(data.settings) }));
  }
  return json(200, { ok: true });
};

// ---------------------------------------------------------------------------

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return json(200, { ok: true, authenticated: isAuthorized(event), configured: Boolean(process.env.ADMIN_PASSWORD), rebuildHook: Boolean(process.env.NETLIFY_BUILD_HOOK) });
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!process.env.ADMIN_PASSWORD) return json(503, { error: "The admin isn't set up yet. Add ADMIN_PASSWORD in Netlify environment variables." });
  if (!isAuthorized(event)) return json(401, { error: "Your session has expired. Please log in again." });

  const body = parseBody(event);
  if (!body) return json(400, { error: "Invalid request." });

  try {
    if (body.action === "health") return await health(event);
    if (body.action === "rebuild") return await rebuild();
    const store = getStudioStore(event);
    switch (body.action) {
      case "load":
        return json(200, await load(store, body.since || {}));
      case "save":
        return await save(store, body.ops);
      case "photo.put":
        return await putPhoto(store, body);
      case "photo.get":
        return await getPhoto(store, body);
      case "photo.del":
        return await deletePhotos(store, body);
      case "token.create":
        return await createToken(store, body);
      case "token.revoke":
        return await revokeToken(store, body);
      case "brief.del":
        return await deleteBrief(store, body);
      case "number.next":
        return await nextNumber(store, body);
      case "export":
        return await exportAll(store);
      case "import":
        return await importAll(store, body);
      default:
        return json(400, { error: "Unknown action." });
    }
  } catch (error) {
    if (error.status !== 400) console.error("studio function error", error);
    return json(error.status === 400 ? 400 : 500, { error: error.message || "Something went wrong." });
  }
};
