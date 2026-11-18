// Authenticated Search Console reporting proxy. Google credentials stay server-side.
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
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
async function accessToken() {
  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Add ${missing.join(", ")} to Netlify environment variables, then redeploy.`);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "Google token refresh failed.");
  return data.access_token;
}
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });
  if (!authorized(event)) return json(401, { error: "Your admin session has expired. Log in again." });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid request." }); }
  try {
    const token = await accessToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    if (body.action === "sites") {
      const response = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Could not list Search Console properties.");
      return json(200, { sites: (data.siteEntry || []).map((site) => ({ siteUrl: site.siteUrl, permissionLevel: site.permissionLevel })) });
    }
    if (body.action === "query") {
      const siteUrl = String(body.siteUrl || "");
      const startDate = String(body.startDate || "");
      const endDate = String(body.endDate || "");
      const allowedDimensions = ["date", "query", "page", "country", "device"];
      const dimensions = Array.isArray(body.dimensions) ? body.dimensions.filter((d) => allowedDimensions.includes(d)).slice(0, 2) : ["date"];
      if (!siteUrl || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !dimensions.length) return json(400, { error: "Choose a Search Console property and valid date range." });
      const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
      const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 250, dataState: "final" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Search Analytics query failed.");
      return json(200, { rows: data.rows || [], responseAggregationType: data.responseAggregationType || null });
    }
    return json(400, { error: "Unknown action." });
  } catch (error) {
    console.error("Search Console error:", error.message);
    return json(502, { error: error.message });
  }
};
