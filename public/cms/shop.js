// Storefront behaviour: bag, filters, account, checkout. Prices shown here are
// only for display: the server re-reads the catalogue and recomputes totals.
(() => {
  const API = "/.netlify/functions/shop";
  const BAG = "vsBag";
  const TOKEN = "vsShopToken";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const bag = () => store.get(BAG, []);
  const saveBag = (b) => { store.set(BAG, b); count(); };
  const count = () => $$("[data-bag-count]").forEach((el) => (el.textContent = bag().reduce((n, l) => n + l.qty, 0)));
  const token = () => store.get(TOKEN, "");
  const call = async (action, body = {}, auth = false) => {
    const headers = { "Content-Type": "application/json" };
    if (auth && token()) headers.Authorization = `Bearer ${token()}`;
    const r = await fetch(API, { method: "POST", headers, body: JSON.stringify({ action, ...body }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || "Something went wrong. Please try again."), { status: r.status });
    return data;
  };
  const nextUrl = () => { const n = new URLSearchParams(location.search).get("next"); return n && /^\/shop\/[a-z0-9/-]*$/i.test(n) ? n : "/shop/account/"; };

  // --- product page + listing ------------------------------------------------
  $$("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const option = ($("[data-options] input:checked") || {}).value || "";
      const b = bag();
      const line = b.find((l) => l.id === btn.dataset.id && l.option === option);
      if (line) line.qty = Math.min(20, line.qty + 1);
      else b.push({ id: btn.dataset.id, slug: btn.dataset.slug, title: btn.dataset.title, price: Number(btn.dataset.price), image: btn.dataset.image, option, qty: 1 });
      saveBag(b);
      btn.textContent = "Added ✓";
      setTimeout(() => { btn.textContent = "Add to bag"; }, 1400);
    })
  );
  $$("[data-filter] button").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$("[data-filter] button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      $$(".pgrid .pcard").forEach((c) => (c.hidden = btn.dataset.cat && c.dataset.cat !== btn.dataset.cat));
    })
  );

  // --- account ---------------------------------------------------------------
  const accountRoot = $("#account-root");
  const renderAccount = async () => {
    if (token()) {
      try {
        const { customer, orders } = await call("me", {}, true);
        accountRoot.innerHTML = `<p>Signed in as <b>${esc(customer.name)}</b> (${esc(customer.email)})</p>
          <p><button class="sbtn ghost" style="max-width:200px" data-logout>Sign out</button></p>
          <h2 style="margin-top:40px">Your orders</h2><div class="orders">${orders.length ? orders.map((o) => `<div class="order"><div class="st">${esc(o.status.replace("_", " "))} · ${esc(o.payment.method === "cod" ? "Cash on delivery" : o.payment.status)}</div><b>${esc(o.id)}</b><span>${new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${money(o.total)}</span><span class="note">${o.lines.map((l) => `${esc(l.title)} × ${l.qty}`).join(", ")}</span></div>`).join("") : '<p class="note">No orders yet. <a href="/shop/">Start shopping</a>.</p>'}</div>`;
        $("[data-logout]").addEventListener("click", () => { store.del(TOKEN); renderAccount(); });
        return;
      } catch (e) { store.del(TOKEN); }
    }
    let mode = "login";
    const draw = () => {
      accountRoot.innerHTML = `<div class="tabs"><button data-m="login" aria-selected="${mode === "login"}">Sign in</button><button data-m="signup" aria-selected="${mode === "signup"}">Create account</button></div>
      <form class="sform" novalidate>
        ${mode === "signup" ? '<label>Full name<input name="name" autocomplete="name" required></label>' : ""}
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        ${mode === "signup" ? '<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel"></label>' : ""}
        <label>Password<input name="password" type="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" minlength="8" required></label>
        <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <p class="err" role="alert"></p>
        <button class="sbtn" type="submit">${mode === "signup" ? "Create account" : "Sign in"}</button>
      </form>`;
      $$("[data-m]", accountRoot).forEach((b) => b.addEventListener("click", () => { mode = b.dataset.m; draw(); }));
      $("form", accountRoot).addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        const btn = $(".sbtn", e.target); btn.disabled = true;
        try {
          const res = await call(mode, f);
          store.set(TOKEN, res.token);
          location.href = nextUrl();
        } catch (err) { $(".err", e.target).textContent = err.message; btn.disabled = false; }
      });
    };
    draw();
  };

  // --- checkout --------------------------------------------------------------
  const checkoutRoot = $("#checkout-root");
  const renderCheckout = async () => {
    const lines = bag();
    if (!lines.length) { checkoutRoot.innerHTML = '<p class="lede">Your bag is empty.</p><p><a class="sbtn" style="max-width:240px" href="/shop/">Continue shopping</a></p>'; return; }
    let config = { shippingFlat: 0, freeShippingOver: 0, codEnabled: true, onlinePayment: false };
    try { config = await call("config"); } catch { /* use defaults */ }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping = config.freeShippingOver && subtotal >= config.freeShippingOver ? 0 : config.shippingFlat;
    let customer = null;
    if (token()) { try { customer = (await call("me", {}, true)).customer; } catch { store.del(TOKEN); } }
    const saved = store.get("vsAddress", {});
    const methods = [config.onlinePayment && ["razorpay", "Pay online (card, UPI, netbanking)"], config.codEnabled && ["cod", "Cash on delivery"]].filter(Boolean);
    const summary = `<aside class="sum"><h2 style="font-size:16px;margin:0">Summary</h2><div><span>Subtotal</span><span>${money(subtotal)}</span></div><div><span>Delivery</span><span>${shipping ? money(shipping) : "Free"}</span></div><div class="t"><span>Total</span><span>${money(subtotal + shipping)}</span></div>${config.freeShippingOver && shipping ? `<p class="note" style="margin:0">Free delivery over ${money(config.freeShippingOver)}.</p>` : ""}</aside>`;
    const bagHTML = lines.map((l, i) => `<div class="bagline"><a href="/shop/${esc(l.slug)}/">${l.image ? `<img src="${esc(l.image)}" alt="">` : "<span></span>"}</a><div><b>${esc(l.title)}</b>${l.option ? `<div class="note">${esc(l.option)}</div>` : ""}<div class="q"><button data-q="-1" data-i="${i}" aria-label="Less">−</button>${l.qty}<button data-q="1" data-i="${i}" aria-label="More">+</button></div><button class="rm" data-rm="${i}">Remove</button></div><div>${money(l.price * l.qty)}</div></div>`).join("");
    const form = !customer
      ? `<div style="margin-top:32px"><p class="note">Sign in or create an account to place your order.</p><a class="sbtn" style="max-width:320px" href="/shop/account/?next=/shop/checkout/">Sign in / Create account</a></div>`
      : `<form class="sform" style="margin-top:32px;max-width:none" novalidate><h2 style="font-size:16px;margin:0">Delivery address</h2>
        <label>Full name<input name="name" autocomplete="name" value="${esc(saved.name || customer.name)}" required></label>
        <div class="two"><label>Phone<input name="phone" type="tel" autocomplete="tel" value="${esc(saved.phone || customer.phone || "")}" required></label><label>Pincode<input name="pincode" inputmode="numeric" maxlength="6" autocomplete="postal-code" value="${esc(saved.pincode || "")}" required></label></div>
        <label>Address<input name="line1" autocomplete="address-line1" value="${esc(saved.line1 || "")}" required></label>
        <label>Apartment, landmark (optional)<input name="line2" autocomplete="address-line2" value="${esc(saved.line2 || "")}"></label>
        <div class="two"><label>City<input name="city" autocomplete="address-level2" value="${esc(saved.city || "")}" required></label><label>State<input name="state" autocomplete="address-level1" value="${esc(saved.state || "")}" required></label></div>
        <label>Note for us (optional)<textarea name="note" rows="2"></textarea></label>
        <h2 style="font-size:16px;margin:12px 0 0">Payment</h2>
        ${methods.length ? methods.map(([v, t], i) => `<label style="display:flex;gap:10px;align-items:center;text-transform:none;letter-spacing:0;font-size:15px;color:var(--fg)"><input type="radio" name="method" value="${v}" ${i === 0 ? "checked" : ""} style="width:auto"> ${t}</label>`).join("") : '<p class="err">No payment method is available right now. Please contact us.</p>'}
        <p class="err" role="alert"></p>
        <button class="sbtn" type="submit" ${methods.length ? "" : "disabled"}>Place order · ${money(subtotal + shipping)}</button>
        <p class="note">Signed in as ${esc(customer.email)}. <a href="#" data-signout>Not you?</a></p></form>`;
    checkoutRoot.innerHTML = `<div class="co"><div>${bagHTML}${form}</div>${summary}</div>`;
    $$("[data-q]", checkoutRoot).forEach((b) => b.addEventListener("click", () => { const x = bag(); const l = x[b.dataset.i]; l.qty = Math.max(1, Math.min(20, l.qty + Number(b.dataset.q))); saveBag(x); renderCheckout(); }));
    $$("[data-rm]", checkoutRoot).forEach((b) => b.addEventListener("click", () => { const x = bag(); x.splice(Number(b.dataset.rm), 1); saveBag(x); renderCheckout(); }));
    const out = $("[data-signout]", checkoutRoot); if (out) out.addEventListener("click", (e) => { e.preventDefault(); store.del(TOKEN); renderCheckout(); });
    const f = $("form", checkoutRoot);
    if (!f) return;
    const done = (order) => {
      saveBag([]);
      checkoutRoot.innerHTML = `<h2>Thank you</h2><p class="lede">Order <b>${esc(order.id)}</b> is placed. We will confirm delivery details on ${esc(order.address.phone)}.</p><p><a class="sbtn" style="max-width:240px" href="/shop/account/">View your orders</a></p>`;
    };
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const btn = $(".sbtn", f); const err = $(".err", f); err.textContent = ""; btn.disabled = true;
      try {
        const address = { name: v.name, phone: v.phone, pincode: v.pincode, line1: v.line1, line2: v.line2, city: v.city, state: v.state };
        store.set("vsAddress", address);
        const res = await call("checkout", { items: bag().map((l) => ({ id: l.id, qty: l.qty, option: l.option })), address, method: v.method, note: v.note }, true);
        if (res.razorpay) {
          await new Promise((ok, fail) => { const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = ok; s.onerror = () => fail(new Error("Could not load the payment window.")); document.head.appendChild(s); });
          await new Promise((ok, fail) => {
            const rz = new window.Razorpay({ key: res.razorpay.key, amount: res.razorpay.amount, currency: "INR", name: "Vanilla & Somethin", order_id: res.razorpay.orderId, prefill: { name: v.name, contact: v.phone, email: customer.email }, theme: { color: "#f21d2f" },
              handler: async (p) => { try { ok(await call("verify-payment", p, true)); } catch (x) { fail(x); } },
              modal: { ondismiss: () => fail(new Error("Payment was not completed. Your order is saved; you can try again from your account or contact us.")) } });
            rz.open();
          }).then((r) => done(r.order));
        } else done(res.order);
      } catch (x) {
        if (x.status === 401) { store.del(TOKEN); renderCheckout(); return; }
        err.textContent = x.message; btn.disabled = false;
      }
    });
  };

  count();
  if (accountRoot) renderAccount();
  if (checkoutRoot) renderCheckout();
})();
