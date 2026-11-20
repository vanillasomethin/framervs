// Shop orders: every order placed on /shop, with status updates.
import { $, $$, shopApi, toast } from "../core.js";
import { esc, pill, mount, fmtDateTime } from "./ui.js";

const STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const TONE = { new: "warn", awaiting_payment: "mute", confirmed: "info", shipped: "info", delivered: "ok", cancelled: "bad" };
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export const renderOrders = async (view) => {
  const root = mount(view, `<div class="page-head"><div><h1>Orders</h1><p>Orders placed in the shop. Update the status as you confirm, ship and deliver; customers see it in their account.</p></div>
    <div class="head-actions"><button class="btn" data-refresh>Refresh</button></div></div><div data-body><p class="muted">Loading…</p></div>`);
  const body = $("[data-body]", root);
  const draw = (orders) => {
    if (!orders.length) {
      body.innerHTML = `<div class="empty-state"><h2>No orders yet</h2><p>When a customer checks out, the order appears here.</p></div>`;
      return;
    }
    body.innerHTML = orders
      .map(
        (o) => `<section class="panel order-card" data-id="${esc(o.id)}">
      <div class="panel-row"><div><b>${esc(o.id)}</b> <span class="muted">${fmtDateTime(o.createdAt)}</span></div><div>${pill(o.status.replace("_", " "), TONE[o.status] || "mute")} ${pill(o.payment.method === "cod" ? "Cash on delivery" : `Online · ${o.payment.status}`, o.payment.status === "paid" ? "ok" : "mute")}</div></div>
      <div class="order-grid">
        <div>${o.lines.map((l) => `<div class="order-line"><span>${esc(l.title)}${l.option ? ` <em>(${esc(l.option)})</em>` : ""} × ${l.qty}</span><span>${money(l.price * l.qty)}</span></div>`).join("")}
          <div class="order-line muted"><span>Delivery</span><span>${o.shipping ? money(o.shipping) : "Free"}</span></div>
          <div class="order-line"><b>Total</b><b>${money(o.total)}</b></div></div>
        <div class="muted small"><b style="color:var(--ink)">${esc(o.address.name)}</b><br>${esc(o.address.line1)}${o.address.line2 ? `, ${esc(o.address.line2)}` : ""}<br>${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.pincode)}<br>${esc(o.address.phone)} · ${esc(o.email)}${o.note ? `<br><i>“${esc(o.note)}”</i>` : ""}</div>
        <div><label class="field"><span>Status</span><select data-status>${["awaiting_payment", ...STATUSES].filter((s) => s !== "awaiting_payment" || o.status === s).map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          ${o.payment.method === "cod" && o.payment.status !== "paid" ? `<button class="btn small" style="margin-top:8px" data-paid>Mark cash received</button>` : ""}</div>
      </div></section>`
      )
      .join("");
    $$("[data-status]", body).forEach((sel) => sel.addEventListener("change", () => update(sel.closest("[data-id]").dataset.id, { status: sel.value })));
    $$("[data-paid]", body).forEach((b) => b.addEventListener("click", () => update(b.closest("[data-id]").dataset.id, { status: "delivered", markPaid: true })));
  };
  const update = async (id, patch) => {
    try {
      const res = await shopApi({ action: "admin-order-update", id, ...patch });
      draw(res.orders);
      toast("Order updated.");
    } catch (e) {
      toast(esc(e.message), { error: true });
    }
  };
  const load = async () => {
    try {
      draw((await shopApi({ action: "admin-orders" })).orders);
    } catch (e) {
      body.innerHTML = `<p class="muted">${esc(e.message)}</p>`;
    }
  };
  $("[data-refresh]", root).addEventListener("click", load);
  load();
};
