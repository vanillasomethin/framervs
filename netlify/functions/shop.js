// Storefront backend: customer accounts, checkout and orders.
//
// Products and prices come from the published public/content.json (the same
// file the admin edits), fetched fresh so a price can never be tampered with in
// the browser. Customers and orders live in Netlify Blobs (private, never in
// the repository).
//
// Payments: Cash on delivery works with no setup. Online payment (cards, UPI,
// netbanking) switches on when RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set
// in Netlify environment variables; the secret never reaches the browser.

const crypto = require("crypto");
const fs = require("fs");
const { json, sessionSecret, safeEqual, isAuthorized, parseBody } = require("./lib/auth");
const { getStudioStore, readDoc, mutate } = require("./lib/store");

const CUSTOMER_DAYS = 30;
const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const MAX_QTY = 20;

const secret = () => crypto.createHash("sha256").update(`${sessionSecret()}::shop-customer`).digest("hex");
const sign = (payload) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
const makeToken = (email) => {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + CUSTOMER_DAYS * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};
const customerEmail = (event) => {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const [payload, signature] = header.replace(/^Bearer\s+/i, "").split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data.email : null;
  } catch {
    return null;
  }
};

const normEmail = (v) => String(v || "").trim().toLowerCase();
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 120;
const clean = (v, max = 200) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const keyOf = (email) => `customer:${crypto.createHash("sha256").update(email).digest("hex").slice(0, 32)}`;
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString("hex");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// --- catalogue --------------------------------------------------------------
let cache = { at: 0, cms: null };
const loadCms = async (event) => {
  if (process.env.SHOP_CONTENT_FILE) return JSON.parse(fs.readFileSync(process.env.SHOP_CONTENT_FILE, "utf8")).cms || {};
  if (cache.cms && Date.now() - cache.at < 30000) return cache.cms;
  const host = (event.headers["x-forwarded-host"] || event.headers.host || "").split(",")[0];
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const response = await fetch(`${proto}://${host}/content.json`, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error("The product catalogue is unavailable right now.");
  cache = { at: Date.now(), cms: (await response.json()).cms || {} };
  return cache.cms;
};

const settingsOf = (cms) => {
  const s = cms.shop || {};
  return {
    shippingFlat: Number(s.shippingFlat) >= 0 && s.shippingFlat !== "" ? Number(s.shippingFlat) : 0,
    freeShippingOver: Number(s.freeShippingOver) > 0 ? Number(s.freeShippingOver) : 0,
    codEnabled: s.codEnabled !== "No",
    pincodes: clean(s.deliveryNote, 300),
  };
};
const razorpayOn = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const priceOf = (p) => Math.max(0, Math.round(Number(String(p.price || "").replace(/[^0-9.]/g, "")) || 0));

const buildOrderLines = (cms, items) => {
  if (!Array.isArray(items) || !items.length || items.length > 40) throw Object.assign(new Error("Your bag is empty."), { status: 400 });
  const lines = [];
  for (const raw of items) {
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(raw.qty) || 0)));
    const product = (cms.products || []).find((p) => p.status === "published" && p.id === raw.id);
    if (!product) throw Object.assign(new Error("An item in your bag is no longer available. Please review your bag."), { status: 409 });
    if (product.type === "Affiliate link") throw Object.assign(new Error(`${product.title} is bought from the partner store, not here.`), { status: 400 });
    if (product.inStock === "No") throw Object.assign(new Error(`${product.title} is out of stock.`), { status: 409 });
    const price = priceOf(product);
    if (!price) throw Object.assign(new Error(`${product.title} has no price yet.`), { status: 409 });
    lines.push({ id: product.id, slug: product.slug, title: product.title, image: product.gallery?.[0]?.src || "", option: clean(raw.option, 60), price, qty });
  }
  return lines;
};

const publicOrder = (o) => ({ id: o.id, createdAt: o.createdAt, status: o.status, payment: o.payment, lines: o.lines, subtotal: o.subtotal, shipping: o.shipping, total: o.total, address: o.address });

const orderId = () => `VS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const razorpay = async (path, body) => {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.description || "The payment provider could not start the payment.");
  return data;
};

const addOrder = (store, order) => mutate(store, "shop-orders", (doc) => ({ rev: (doc?.rev || 0) + 1, items: [order, ...(doc?.items || [])] }));
const patchOrder = (store, id, fn) =>
  mutate(store, "shop-orders", (doc) => {
    if (!doc || !doc.items.some((o) => o.id === id)) return undefined;
    return { rev: doc.rev + 1, items: doc.items.map((o) => (o.id === id ? fn(o) : o)) };
  });

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const body = parseBody(event);
  if (!body) return json(400, { error: "Invalid request" });
  const store = getStudioStore(event);

  try {
    switch (body.action) {
      case "config": {
        const cms = await loadCms(event);
        return json(200, { ...settingsOf(cms), onlinePayment: razorpayOn(), razorpayKey: razorpayOn() ? process.env.RAZORPAY_KEY_ID : "" });
      }

      case "signup": {
        if (body.website) return json(200, { ok: true }); // honeypot
        const email = normEmail(body.email);
        const name = clean(body.name, 80);
        const password = String(body.password || "");
        if (!name) return json(400, { error: "Please enter your name." });
        if (!validEmail(email)) return json(400, { error: "Please enter a valid email address." });
        if (password.length < 8 || password.length > 100) return json(400, { error: "Choose a password of at least 8 characters." });
        const salt = crypto.randomBytes(16).toString("hex");
        const record = { email, name, phone: clean(body.phone, 20), salt, hash: hashPassword(password, salt), createdAt: new Date().toISOString() };
        const result = await store.setJSON(keyOf(email), record, { onlyIfNew: true });
        if (!result.modified) return json(409, { error: "An account with this email already exists. Please sign in." });
        return json(200, { token: makeToken(email), customer: { email, name, phone: record.phone } });
      }

      case "login": {
        const email = normEmail(body.email);
        const found = await store.getWithMetadata(keyOf(email), { type: "json" });
        const record = found && found.data;
        const ok = record && safeEqual(hashPassword(String(body.password || ""), record.salt), record.hash);
        if (!ok) {
          await pause(500);
          return json(401, { error: "Email or password is incorrect." });
        }
        return json(200, { token: makeToken(email), customer: { email, name: record.name, phone: record.phone } });
      }

      case "me": {
        const email = customerEmail(event);
        if (!email) return json(401, { error: "Please sign in." });
        const found = await store.getWithMetadata(keyOf(email), { type: "json" });
        if (!found) return json(401, { error: "Please sign in." });
        const orders = ((await readDoc(store, "shop-orders")) || { items: [] }).items.filter((o) => o.email === email).map(publicOrder);
        return json(200, { customer: { email, name: found.data.name, phone: found.data.phone }, orders });
      }

      case "checkout": {
        const email = customerEmail(event);
        if (!email) return json(401, { error: "Please sign in to place your order." });
        const cms = await loadCms(event);
        const settings = settingsOf(cms);
        const lines = buildOrderLines(cms, body.items);
        const a = body.address || {};
        const address = { name: clean(a.name, 80), phone: clean(a.phone, 20), line1: clean(a.line1, 120), line2: clean(a.line2, 120), city: clean(a.city, 60), state: clean(a.state, 60), pincode: clean(a.pincode, 10) };
        if (!address.name || !address.line1 || !address.city || !address.state) return json(400, { error: "Please complete your delivery address." });
        if (!/^\+?[0-9 ()-]{8,16}$/.test(address.phone)) return json(400, { error: "Please enter a valid phone number." });
        if (!/^[0-9]{6}$/.test(address.pincode)) return json(400, { error: "Please enter a 6 digit pincode." });
        const method = body.method === "razorpay" ? "razorpay" : "cod";
        if (method === "razorpay" && !razorpayOn()) return json(400, { error: "Online payment is not available yet." });
        if (method === "cod" && !settings.codEnabled) return json(400, { error: "Cash on delivery is not available." });

        const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
        const shipping = settings.freeShippingOver && subtotal >= settings.freeShippingOver ? 0 : settings.shippingFlat;
        const total = subtotal + shipping;
        const order = { id: orderId(), email, createdAt: new Date().toISOString(), status: "new", lines, subtotal, shipping, total, address, note: clean(body.note, 300), payment: { method, status: "pending" } };
        if (method === "razorpay") {
          const rz = await razorpay("/orders", { amount: total * 100, currency: "INR", receipt: order.id });
          order.payment.razorpayOrderId = rz.id;
          order.status = "awaiting_payment";
        }
        await addOrder(store, order);
        return json(200, { order: publicOrder(order), razorpay: method === "razorpay" ? { orderId: order.payment.razorpayOrderId, amount: total * 100, key: process.env.RAZORPAY_KEY_ID } : null });
      }

      case "verify-payment": {
        const email = customerEmail(event);
        if (!email) return json(401, { error: "Please sign in." });
        if (!razorpayOn()) return json(400, { error: "Online payment is not available." });
        const orders = ((await readDoc(store, "shop-orders")) || { items: [] }).items;
        const order = orders.find((o) => o.email === email && o.payment?.razorpayOrderId === body.razorpay_order_id);
        if (!order) return json(404, { error: "Order not found." });
        const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest("hex");
        if (!safeEqual(expected, String(body.razorpay_signature || ""))) return json(400, { error: "The payment could not be verified." });
        const updated = await patchOrder(store, order.id, (o) => {
          // Payment callbacks may be replayed after fulfilment has advanced. Record
          // the first verified payment, but never roll a shipped/delivered/cancelled
          // order back to "new" or replace the original payment reference.
          if (o.payment?.status === "paid") return o;
          return {
            ...o,
            status: o.status === "awaiting_payment" ? "new" : o.status,
            payment: { ...o.payment, status: "paid", paymentId: clean(body.razorpay_payment_id, 60) },
          };
        });
        const verifiedOrder = updated?.items?.find((o) => o.id === order.id);
        if (!verifiedOrder) return json(404, { error: "Order not found." });
        return json(200, { order: publicOrder(verifiedOrder) });
      }

      case "admin-orders": {
        if (!isAuthorized(event)) return json(401, { error: "Your session has expired." });
        const doc = (await readDoc(store, "shop-orders")) || { items: [] };
        return json(200, { orders: doc.items });
      }

      case "admin-order-update": {
        if (!isAuthorized(event)) return json(401, { error: "Your session has expired." });
        if (!STATUSES.includes(body.status)) return json(400, { error: "Unknown status." });
        const doc = await patchOrder(store, String(body.id), (o) => ({ ...o, status: body.status, payment: body.markPaid ? { ...o.payment, status: "paid" } : o.payment }));
        if (!doc || !doc.items.some((o) => o.id === String(body.id))) return json(404, { error: "Order not found." });
        return json(200, { orders: doc.items });
      }

      default:
        return json(400, { error: "Unknown action" });
    }
  } catch (error) {
    return json(error.status || 500, { error: error.message || "Something went wrong." });
  }
};
