// Public enquiry endpoint behind the Home Project Clarity Consultation form.
//
// Anyone on the internet can send an enquiry, so every field is trimmed and
// length-limited, unknown fields are dropped, and each connection is rate limited.
// It writes only to the private "enquiries" collection in Netlify Blobs, which the
// admin reads in Consultations. Nothing stored is ever returned to the visitor.

const crypto = require("crypto");
const { getStudioStore, mutate } = require("./lib/store");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  body: JSON.stringify(body),
});

const MAX_BODY_BYTES = 8192;
const MAX_PER_HOUR = 5;
const MAX_ITEMS = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+0-9 ()-]{7,20}$/;

// field -> max length. Anything not listed is dropped.
const FIELDS = { name: 120, phone: 40, email: 160, project: 60, location: 160, stage: 60, budgetRange: 60, timeline: 60, message: 1000, page: 200 };

const cleanText = (value, max) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const isPlain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const clientIp = (headers) => headers["x-nf-client-connection-ip"] || String(headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (Buffer.byteLength(event.body || "") > MAX_BODY_BYTES) return json(413, { error: "That's too much text. Please shorten your message." });

  try {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid request." });
    }
    if (!isPlain(body)) return json(400, { error: "Invalid request." });

    // Hidden "website" field: real people leave it empty, form-filling bots don't.
    if (typeof body.website === "string" && body.website.trim()) return json(200, { ok: true });

    const data = {};
    for (const [field, max] of Object.entries(FIELDS)) {
      const value = cleanText(body[field], max);
      if (value) data[field] = value;
    }
    if (!data.name) return json(400, { error: "Please add your name." });
    if (!data.phone && !data.email) return json(400, { error: "Please add a phone number or email so we can reach you." });
    if (data.email && !EMAIL.test(data.email)) return json(400, { error: "That email address doesn't look right." });
    if (data.phone && !PHONE.test(data.phone)) return json(400, { error: "That phone number doesn't look right." });
    if (body.consent !== true) return json(400, { error: "Please confirm we may contact you about this enquiry." });

    const store = getStudioStore(event);

    // Rate limit per connection. The raw IP is never stored, only a hash of it.
    const ipHash = crypto.createHash("sha256").update(clientIp(event.headers || {})).digest("hex").slice(0, 16);
    const hour = new Date().toISOString().slice(0, 13);
    let limited = false;
    await mutate(store, "ratelimit/enquiry", (doc) => {
      limited = false;
      const counts = !doc || doc.hour !== hour ? {} : doc.counts || {};
      const n = counts[ipHash] || 0;
      if (n >= MAX_PER_HOUR) {
        limited = true;
        return undefined;
      }
      return { hour, counts: { ...counts, [ipHash]: n + 1 } };
    });
    if (limited) return json(429, { error: "Too many enquiries from this connection. Please try again later or message us on WhatsApp." });

    const item = { id: "enq_" + crypto.randomBytes(5).toString("hex"), createdAt: new Date().toISOString(), source: "website", status: "new", consent: true, ...data };
    let full = false;
    await mutate(store, "c/enquiries", (doc) => {
      full = false;
      const items = doc ? doc.items : [];
      if (items.length >= MAX_ITEMS) {
        full = true;
        return undefined;
      }
      return { rev: (doc ? doc.rev : 0) + 1, items: [...items, item] };
    });
    if (full) return json(503, { error: "We can't take enquiries online right now. Please message us on WhatsApp." });

    return json(200, { ok: true });
  } catch (error) {
    console.error("enquiry function error", error);
    return json(500, { error: "Something went wrong on our side. Please try again or message us on WhatsApp." });
  }
};
