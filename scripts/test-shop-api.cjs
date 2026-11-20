// Tests for the storefront function: accounts, server-side pricing, checkout,
// Razorpay signature verification and admin order management. No network.
//
//   node scripts/test-shop-api.cjs

const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const dir = fs.mkdtempSync(os.tmpdir() + "/shop-");
delete process.env.GITHUB_TOKEN;
process.env.ADMIN_PASSWORD = "pw-test";
process.env.STUDIO_LOCAL_DIR = dir + "/blobs";
process.env.SHOP_CONTENT_FILE = dir + "/content.json";
fs.writeFileSync(process.env.SHOP_CONTENT_FILE, JSON.stringify({ cms: {
  shop: { shippingFlat: "500", freeShippingOver: "20000", codEnabled: "Yes" },
  products: [
    { id: "p1", slug: "oak-chair", title: "Oak chair", status: "published", type: "Sold by us", price: "8,500", inStock: "Yes", gallery: [{ src: "/uploads/a.jpg" }] },
    { id: "p2", slug: "lamp", title: "Lamp", status: "published", type: "Affiliate link", price: "3000", affiliateUrl: "https://example.com/x" },
    { id: "p3", slug: "draft", title: "Draft sofa", status: "draft", type: "Sold by us", price: "50000" },
    { id: "p4", slug: "gone", title: "Sold out table", status: "published", type: "Sold by us", price: "9000", inStock: "No" },
  ],
} }));

const shop = require("../netlify/functions/shop.js").handler;
const cms = require("../netlify/functions/cms.js").handler;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + JSON.stringify(extra)}`); };
const call = async (fn, body, token) => {
  const r = await fn({ httpMethod: "POST", headers: token ? { authorization: "Bearer " + token } : {}, body: JSON.stringify(body) });
  return { status: r.statusCode, body: JSON.parse(r.body || "{}") };
};
const addr = { name: "Asha", phone: "9876543210", line1: "12 MG Road", city: "Mangalore", state: "Karnataka", pincode: "575001" };

(async () => {
  let r = await call(shop, { action: "config" });
  ok("config is public and reports no online payment without keys", r.status === 200 && r.body.onlinePayment === false && r.body.shippingFlat === 500, r);

  r = await call(shop, { action: "signup", name: "Asha", email: "ASHA@Example.com", password: "short" });
  ok("short password rejected", r.status === 400, r);
  r = await call(shop, { action: "signup", name: "Asha", email: "bad", password: "longenough1" });
  ok("invalid email rejected", r.status === 400, r);
  r = await call(shop, { action: "signup", name: "Asha", email: "ASHA@Example.com", password: "longenough1" });
  const T = r.body.token;
  ok("signup returns a token", r.status === 200 && T && r.body.customer.email === "asha@example.com", r);
  r = await call(shop, { action: "signup", name: "Other", email: "asha@example.com", password: "longenough1" });
  ok("duplicate email rejected", r.status === 409, r);
  r = await call(shop, { action: "login", email: "asha@example.com", password: "wrongpass1" });
  ok("wrong password rejected", r.status === 401, r);
  r = await call(shop, { action: "login", email: "asha@example.com", password: "longenough1" });
  ok("login works", r.status === 200 && r.body.token, r);
  r = await call(shop, { action: "me" }, T + "x");
  ok("tampered customer token rejected", r.status === 401, r);
  r = await call(shop, { action: "me" }, T);
  ok("me returns the customer", r.status === 200 && r.body.customer.name === "Asha" && r.body.orders.length === 0, r);

  const checkout = (items, extra = {}, token = T) => call(shop, { action: "checkout", items, address: addr, method: "cod", ...extra }, token);
  r = await checkout([{ id: "p1", qty: 1 }], {}, null);
  ok("checkout needs a login", r.status === 401, r);
  r = await checkout([{ id: "p2", qty: 1 }]);
  ok("affiliate products cannot be ordered here", r.status === 400, r);
  r = await checkout([{ id: "p3", qty: 1 }]);
  ok("draft products cannot be ordered", r.status === 409, r);
  r = await checkout([{ id: "p4", qty: 1 }]);
  ok("out of stock products cannot be ordered", r.status === 409, r);
  r = await checkout([{ id: "p1", qty: 1, price: 1 }], { address: { ...addr, pincode: "12" } });
  ok("bad pincode rejected", r.status === 400, r);
  r = await checkout([{ id: "p1", qty: 1, price: 1 }], { method: "razorpay" });
  ok("online payment refused while not configured", r.status === 400, r);

  r = await checkout([{ id: "p1", qty: 2, price: 1 }]);
  ok("price is taken from the catalogue, not the browser (2 × 8500 + 500 delivery)", r.status === 200 && r.body.order.subtotal === 17000 && r.body.order.shipping === 500 && r.body.order.total === 17500, r.body);
  r = await checkout([{ id: "p1", qty: 3 }]);
  ok("free delivery over the threshold", r.status === 200 && r.body.order.shipping === 0 && r.body.order.total === 25500, r.body);
  r = await call(shop, { action: "me" }, T);
  ok("orders show in the customer's account", r.body.orders.length === 2, r.body);

  const admin = (await call(cms, { action: "login", password: "pw-test" })).body.token;
  r = await call(shop, { action: "admin-orders" }, T);
  ok("a customer token cannot read all orders", r.status === 401, r);
  r = await call(shop, { action: "admin-orders" }, admin);
  ok("admin sees every order", r.status === 200 && r.body.orders.length === 2, r);
  const id = r.body.orders[0].id;
  r = await call(shop, { action: "admin-order-update", id, status: "shipped" }, admin);
  ok("admin can update status", r.status === 200 && r.body.orders.find((o) => o.id === id).status === "shipped", r);
  r = await call(shop, { action: "admin-order-update", id: "nope", status: "shipped" }, admin);
  ok("unknown order is a 404", r.status === 404, r);
  r = await call(shop, { action: "admin-order-update", id, status: "bogus" }, admin);
  ok("unknown status is rejected", r.status === 400, r);

  // Razorpay: stub the provider and check the signature handling
  process.env.RAZORPAY_KEY_ID = "rzp_test_x";
  process.env.RAZORPAY_KEY_SECRET = "sekrit";
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => (String(url).startsWith("https://api.razorpay.com/") ? new Response(JSON.stringify({ id: "order_ABC" }), { status: 200 }) : realFetch(url, opts));
  r = await call(shop, { action: "config" });
  ok("config reports online payment once keys exist (key id only)", r.body.onlinePayment === true && r.body.razorpayKey === "rzp_test_x" && !JSON.stringify(r.body).includes("sekrit"), r.body);
  r = await checkout([{ id: "p1", qty: 1 }], { method: "razorpay" });
  ok("online checkout creates a provider order and waits for payment", r.status === 200 && r.body.razorpay.orderId === "order_ABC" && r.body.razorpay.amount === 900000 && r.body.order.status === "awaiting_payment", r.body);
  r = await call(shop, { action: "verify-payment", razorpay_order_id: "order_ABC", razorpay_payment_id: "pay_1", razorpay_signature: "0".repeat(64) }, T);
  ok("a forged payment signature is rejected", r.status === 400, r);
  const sig = crypto.createHmac("sha256", "sekrit").update("order_ABC|pay_1").digest("hex");
  r = await call(shop, { action: "verify-payment", razorpay_order_id: "order_ABC", razorpay_payment_id: "pay_1", razorpay_signature: sig }, T);
  ok("a genuine signature marks the order paid", r.status === 200 && r.body.order.payment.status === "paid" && r.body.order.status === "new", r);
  global.fetch = realFetch;

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
