// Exchanges the Google authorization code and displays the refresh token once.
// The admin must copy it into Netlify as GOOGLE_REFRESH_TOKEN. It is never written
// to GitHub, localStorage, CMS content, or a database by this function.
const crypto = require("crypto");
const secret = () => process.env.SESSION_SECRET || crypto.createHash("sha256").update(`${process.env.ADMIN_PASSWORD}::${process.env.GITHUB_TOKEN}`).digest("hex");
const sign = (value) => crypto.createHmac("sha256", secret()).update(value).digest("base64url");
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const html = (statusCode, body, headers = {}) => ({ statusCode, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", ...headers }, body });
const clearCookie = "vsGoogleOAuth=; Path=/.netlify/functions; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
exports.handler = async (event) => {
  const params = new URLSearchParams(event.rawQuery || "");
  if (params.get("error")) return html(400, "<h1>Google connection cancelled</h1><p>Return to the admin and try again.</p>", { "Set-Cookie": clearCookie });
  const cookieHeader = event.headers.cookie || event.headers.Cookie || "";
  const raw = (cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("vsGoogleOAuth=")) || "").slice("vsGoogleOAuth=".length);
  const parts = raw.split(".");
  const state = params.get("state") || "";
  if (parts.length !== 3 || !state || !safeEqual(parts[0], state)) return html(400, "<h1>Connection could not be verified</h1><p>Close this page, return to the admin and start the connection again.</p>", { "Set-Cookie": clearCookie });
  const cookieValue = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], sign(cookieValue))) return html(400, "<h1>Connection could not be verified</h1><p>Please start again from the admin.</p>", { "Set-Cookie": clearCookie });
  const code = params.get("code");
  if (!code) return html(400, "<h1>Missing Google authorization code</h1>", { "Set-Cookie": clearCookie });
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
        code_verifier: parts[1],
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.refresh_token) throw new Error(data.error_description || data.error || "Google did not return a refresh token. Revoke the test connection in your Google Account and retry with consent.");
    const token = String(data.refresh_token).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    return html(200, `<!doctype html><meta name="viewport" content="width=device-width"><title>Search Console connection</title><main style="font:16px system-ui;max-width:760px;margin:48px auto;padding:20px"><h1>Google authorisation successful</h1><p>Copy this refresh token now. Add it to Netlify as an environment variable named <b>GOOGLE_REFRESH_TOKEN</b>, then trigger a redeploy. Do not share it or commit it to GitHub.</p><textarea readonly style="width:100%;min-height:110px;padding:12px">${token}</textarea><p><button onclick="navigator.clipboard.writeText(document.querySelector('textarea').value)">Copy token</button></p><p>After saving the variable in Netlify, redeploy the site and return to <a href="/admin">the site admin</a>.</p><p style="color:#8a4b00">This page displays the token once. Close it after copying.</p></main>`, { "Set-Cookie": clearCookie });
  } catch (error) {
    return html(502, `<h1>Google connection failed</h1><p>${String(error.message).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))}</p><p>Return to <a href="/admin">the admin</a> and try again.</p>`, { "Set-Cookie": clearCookie });
  }
};
