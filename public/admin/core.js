// Shared plumbing for the admin: session, API calls, toasts, tiny DOM helpers.
// Used by the website content manager (admin.js) and the studio modules.

export const SESSION_KEY = "vsAdminSession";

export const session = { token: localStorage.getItem(SESSION_KEY) || "" };

// Hooks the shell (admin.js) fills in so modules can ask it to redraw or
// handle an expired login without importing it (which would be circular).
export const app = {
  render() {},
  onExpired() {},
  addToPortfolio() {}, // create a draft website portfolio entry from a studio project
};

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
export const clone = (value) => JSON.parse(JSON.stringify(value));

// ids must match /^[A-Za-z0-9_-]{4,40}$/ on the server
export const uid = (prefix = "") => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const call = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}) },
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { error: response.status === 404 ? "The admin backend isn't deployed yet." : `Request failed (${response.status}).` };
  }
  if (response.status === 401 && body.action !== "login") {
    app.onExpired();
    throw Object.assign(new Error(data.error || "Please log in again."), { status: 401 });
  }
  if (!response.ok) throw Object.assign(new Error(data.error || `Request failed (${response.status}).`), { status: response.status, data });
  return data;
};

// Website content (journal, portfolio, updates) and login
export const api = (body) => call("/.netlify/functions/cms", body);
// Private studio data
export const studioApi = (body) => call("/.netlify/functions/studio", body);

let toastTimer;
export const toast = (html, { error = false, duration = 4500 } = {}) => {
  const el = $("#toast");
  el.innerHTML = html;
  el.classList.toggle("error", error);
  el.classList.add("show");
  clearTimeout(toastTimer);
  if (duration) toastTimer = setTimeout(() => el.classList.remove("show"), duration);
};
