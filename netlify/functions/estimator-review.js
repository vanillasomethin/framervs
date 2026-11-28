// Public endpoint: a visitor rates how useful the cost estimator was (1 to 5 stars)
// with an optional comment. Ratings land in the private "reviews" collection
// (Netlify Blobs), shown in the admin. Nothing is posted to Google from here: a
// Google review can only be written by the person themselves, so the estimator
// offers them the Google review link (see the Google review link in Admin >
// Website > Contact details) and copies their comment for them.

const crypto = require("crypto");
const { getStudioStore, mutate } = require("./lib/store");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  body: JSON.stringify(body),
});

const MAX_BODY_BYTES = 8 * 1024;
const MAX_REVIEWS = 5000;
const clean = (value, max) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (Buffer.byteLength(event.body || "") > MAX_BODY_BYTES) return json(413, { error: "That's too much text. Please shorten it a little." });
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request." });
  }
  // Hidden "website" field: people leave it empty, form-filling bots don't.
  if (body.website) return json(200, { ok: true });

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: "Please choose between 1 and 5 stars." });

  const e = body.estimate && typeof body.estimate === "object" ? body.estimate : {};
  const review = {
    id: `rv${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`,
    createdAt: new Date().toISOString(),
    rating,
    comment: clean(body.comment, 1000),
    name: clean(body.name, 80),
    estimate: {
      projectType: clean(e.projectType, 60),
      city: clean(e.city, 60),
      area: num(e.area),
      areaUnit: clean(e.areaUnit, 12),
      totalCost: num(e.totalCost),
    },
  };

  try {
    const store = getStudioStore(event);
    await mutate(store, "c/reviews", (doc) => {
      const items = doc ? doc.items : [];
      return { rev: (doc ? doc.rev : 0) + 1, items: [...items, review].slice(-MAX_REVIEWS) };
    });
    return json(200, { ok: true });
  } catch (error) {
    console.error("estimator-review function error", error);
    return json(500, { error: "Something went wrong on our side. Please try again in a moment." });
  }
};
