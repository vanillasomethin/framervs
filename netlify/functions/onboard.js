// Public endpoint behind the client onboarding form at /onboard/?t=<token>.
//
// A client only gets in with the private link the studio generated for them
// (an unguessable token that expires and can be revoked). They can fill in and
// later edit their project brief; they see nothing about other clients or
// projects. Submissions land in their own "briefs" collection, so this endpoint
// never writes to anything the admin edits.

const { getStudioStore, readDoc, mutate } = require("./lib/store");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  body: JSON.stringify(body),
});

const MAX_BODY_BYTES = 24 * 1024;
const TOKEN = /^[a-f0-9]{32}$/;

// field -> max length. Anything not listed is dropped.
const TEXT_FIELDS = {
  name: 120,
  email: 160,
  phone: 40,
  company: 120,
  location: 160,
  preferredContact: 40,
  projectType: 60,
  siteAddress: 300,
  plotSize: 60,
  floors: 40,
  budget: 60,
  timeline: 60,
  hasPlot: 40,
  household: 600,
  mustHaves: 2000,
  styleNotes: 2000,
  dislikes: 1500,
  references: 1500,
  anythingElse: 2000,
};
const SCOPE_OPTIONS = ["Architecture", "Interior design", "Landscape", "Structural", "MEP / services", "3D visualisation", "Construction supervision", "Turnkey construction"];

const cleanText = (value, max) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);

const sanitize = (input) => {
  const data = {};
  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    const value = cleanText(input[field], max);
    if (value) data[field] = value;
  }
  if (Array.isArray(input.scope)) data.scope = input.scope.filter((s) => SCOPE_OPTIONS.includes(s)).slice(0, SCOPE_OPTIONS.length);
  return data;
};

const findToken = async (store, token) => {
  if (!TOKEN.test(token || "")) return null;
  const tokens = (await readDoc(store, "tokens")) || {};
  const info = tokens[token];
  if (!info || new Date(info.expires).getTime() < Date.now()) return null;
  return info;
};

exports.handler = async (event) => {
  const isGet = event.httpMethod === "GET";
  if (!isGet && event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body = {};
  if (!isGet) {
    if (Buffer.byteLength(event.body || "") > MAX_BODY_BYTES) return json(413, { error: "That's too much text. Please shorten it a little." });
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid request." });
    }
  }
  const token = isGet ? (event.queryStringParameters || {}).t : body.t;

  try {
    const store = getStudioStore(event);
    const info = await findToken(store, token);
    if (!info) return json(404, { error: "This link isn't valid any more. Please ask the studio to send you a new one." });

    const clients = ((await readDoc(store, "c/clients")) || { items: [] }).items;
    const client = clients.find((c) => c.id === info.clientId);
    if (!client) return json(404, { error: "This link isn't valid any more. Please ask the studio to send you a new one." });

    if (isGet) {
      const brief = (((await readDoc(store, "c/briefs")) || { items: [] }).items || []).find((b) => b.id === client.id);
      return json(200, {
        studio: "Vanilla & Somethin",
        firstName: String(client.name || "").split(/\s+/)[0] || "",
        prefill: { name: client.name || "", email: client.email || "", phone: client.phone || "", projectType: client.projectType || "", location: client.location || "" },
        submittedAt: brief ? brief.submittedAt : null,
        data: brief ? brief.data : null,
        expires: info.expires,
        scopeOptions: SCOPE_OPTIONS,
      });
    }

    // Hidden "website" field: real people leave it empty, form-filling bots don't.
    if (body.website) return json(200, { ok: true });
    const data = sanitize(body.data || {});
    if (!data.name || !data.email) return json(400, { error: "Please add your name and email so we can reach you." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json(400, { error: "That email address doesn't look right." });

    const submittedAt = new Date().toISOString();
    await mutate(store, "c/briefs", (doc) => {
      const items = doc ? doc.items : [];
      const existing = items.find((b) => b.id === client.id);
      const entry = { id: client.id, submittedAt, version: (existing ? existing.version : 0) + 1, data };
      return { rev: (doc ? doc.rev : 0) + 1, items: existing ? items.map((b) => (b.id === client.id ? entry : b)) : [...items, entry] };
    });
    return json(200, { ok: true, submittedAt });
  } catch (error) {
    console.error("onboard function error", error);
    return json(500, { error: "Something went wrong on our side. Please try again in a moment." });
  }
};
