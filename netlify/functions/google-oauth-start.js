// Starts the Google Search Console OAuth flow for an authenticated site admin.
// Required Netlify environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
// GOOGLE_REDIRECT_URI, SESSION_SECRET (or ADMIN_PASSWORD + GITHUB_TOKEN).
const crypto = require("crypto");

const secret = () => process.env.SESSION_SECRET || crypto.createHash("sha256").update(`${process.env.ADMIN_PASSWORD}::${process.env.GITHUB_TOKEN}`).digest("hex");
const sign = (value) => crypto.createHmac("sha256", secret()).update(value).digest("base64url");
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const authorized = (event) => {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const [payload, signature] = header.replace(/^Bearer\s+/i, "").split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); } catch { return false; }
};
const json = (statusCode, body, headers = {}) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });
  if (!authorized(event)) return json(401, { error: "Log in to the site admin first." });
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return json(503, { error: "Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI to Netlify environment variables." });
  }
  const state = crypto.randomBytes(32).toString("base64url");
  const verifier = crypto.randomBytes(48).toString("base64url");
  const cookieValue = `${state}.${verifier}`;
  const cookie = `vsGoogleOAuth=${cookieValue}.${sign(cookieValue)}; Path=/.netlify/functions; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: crypto.createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  });
  return json(200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, { "Set-Cookie": cookie });
};
