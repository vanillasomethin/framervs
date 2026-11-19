// Shared admin session handling for the CMS and studio functions.
// One password (ADMIN_PASSWORD) unlocks everything; a successful login returns
// a signed token that lasts SESSION_DAYS and is sent as "Authorization: Bearer".

const crypto = require("crypto");

const SESSION_DAYS = 7;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

// Must stay identical to how search-console.js and google-oauth-*.js derive the
// secret, so a single admin login is accepted by all of them. (With no
// GITHUB_TOKEN set, every function derives the same value, so login still works.)
const sessionSecret = () =>
  process.env.SESSION_SECRET ||
  crypto.createHash("sha256").update(`${process.env.ADMIN_PASSWORD}::${process.env.GITHUB_TOKEN}`).digest("hex");

const sign = (payload) => crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const createSession = () => {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const isAuthorized = (event) => {
  if (!process.env.ADMIN_PASSWORD) return false;
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch {
    return false;
  }
};

const parseBody = (event) => {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return null;
  }
};

module.exports = { SESSION_DAYS, json, safeEqual, createSession, isAuthorized, parseBody };
