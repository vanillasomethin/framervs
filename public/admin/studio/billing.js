// Billing: quotes, GST tax invoices and expenses.
// Ported from the ALIVE console: quote -> invoice, sequential numbers per
// financial year, CGST+SGST or IGST by place of supply, printable PDF.

import { $, $$, uid, app, studioApi, toast } from "../core.js";
import { data, put, del, note, today, addDays, member, projectById, clientById, team } from "./data.js";
import { icon, esc, pill, fmtDate, optionsHTML, openDrawer, openMenu, confirmBox, emptyState, mount } from "./ui.js";
import { docTotals, placeOfSupply, financialYear, docNumber, rupeesInWords, inr, printableDoc, STATE_OPTIONS, QUOTE_STATUS, INVOICE_STATUS, PAYMENT_METHODS, GSTIN_RE } from "./finance.js";

const company = () => data.settings.company || {};
const supplierState = () => company().stateCode || "29";
const GST_RATE = 18;
const ui = { tab: "invoices", q: "" };
const EXPENSE_CATEGORIES = ["Site / travel", "Printing & plotting", "Software & subscriptions", "Salaries & contractors", "Office & utilities", "Materials & samples", "Professional fees", "Marketing", "Other"];

const statusOf = (doc) => (doc.kind === "quote" ? QUOTE_STATUS : INVOICE_STATUS).find((s) => s.id === doc.status) || { label: doc.status, tone: "mute" };
const isOverdue = (d) => d.kind === "invoice" && d.status === "issued" && d.dueDate && d.dueDate < today();
const fyNow = () => financialYear(today());
const inFy = (day, fy = fyNow()) => day && financialYear(day) === fy;
const rupeesToPaise = (v) => Math.round((Number(v) || 0) * 100);
const paiseToRupees = (p) => (p ? Math.round(p) / 100 : "");

const seriesFor = (kind, day) => {
  const prefix = String((kind === "quote" ? company().quotePrefix : company().invoicePrefix) || (kind === "quote" ? "VSQ" : "VS")).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) || "VS";
  return { prefix, fy: financialYear(day), series: `${prefix}/${financialYear(day)}` };
};

// ---------------------------------------------------------------------------
// Document editor

const blankLine = () => ({ description: "", qty: 1, unit: "", ratePaise: 0 });

export const openDoc = (id, defaults = {}) => {
  const existing = id ? data.docs.find((d) => d.id === id) : null;
  const kind = (existing || defaults).kind || "invoice";
  const readOnly = existing && (existing.status === "paid" || existing.status === "cancelled");
  const base = existing || {
    kind, status: kind === "quote" ? "draft" : "issued", issueDate: today(), buyerName: "", stateCode: supplierState(), lines: [blankLine()], discountPaise: 0,
    gstRate: GST_RATE, validUntil: kind === "quote" ? addDays(today(), 30) : "", dueDate: kind === "invoice" ? addDays(today(), 15) : "", ...defaults,
  };
  let lines = (base.lines || [blankLine()]).map((l) => ({ ...l }));

  const spec = [
    { key: "buyerName", label: "Billed to", type: "text", required: true, placeholder: "Client or company name" },
    { key: "contactName", label: "Contact person", type: "text", half: true },
    { key: "phone", label: "Phone", type: "text", half: true },
    { key: "email", label: "Email", type: "text", half: true },
    { key: "gstin", label: "Client GSTIN (if any)", type: "text", half: true, placeholder: "e.g. 29ABCDE1234F1Z5" },
    { key: "address", label: "Address", type: "textarea", rows: 2 },
    { key: "stateCode", label: "Place of supply", type: "select", options: STATE_OPTIONS, half: true },
    { key: "projectId", label: "Project", type: "select", options: data.projects.map((p) => ({ id: p.id, label: `${p.code ? `${p.code} · ` : ""}${p.name}` })), blank: "–", half: true },
    { key: "issueDate", label: "Date", type: "date", half: true },
    kind === "quote" ? { key: "validUntil", label: "Valid until", type: "date", half: true } : { key: "dueDate", label: "Due date", type: "date", half: true },
    { key: "discountRupees", label: "Discount (₹)", type: "number", half: true },
    { key: "discountLabel", label: "Discount label", type: "text", half: true, placeholder: "e.g. Early payment" },
    { key: "notes", label: "Notes on the document", type: "textarea", rows: 2 },
  ];
  const values = { ...base, discountRupees: paiseToRupees(base.discountPaise) };

  const clientPicker = data.clients.length
    ? `<label class="field"><span class="lbl">Fill from a client</span><select data-pick-client>${optionsHTML(data.clients.map((c) => ({ id: c.id, label: c.company ? `${c.name} · ${c.company}` : c.name })), "", { blank: "Choose a client…" })}</select></label>`
    : "";

  const totalsOf = (root) => {
    const val = (k) => ($(`[data-key="${k}"]`, root) || {}).value || "";
    const state = placeOfSupply(val("gstin"), val("stateCode"), supplierState());
    return { state, ...docTotals(lines, rupeesToPaise(val("discountRupees")), state, supplierState(), GST_RATE) };
  };

  openDrawer({
    title: existing ? `${kind === "quote" ? "Quote" : "Invoice"} ${existing.number}` : kind === "quote" ? "New quote" : "New invoice",
    subtitle: existing ? esc(statusOf(existing).label) : "Numbered automatically when you save",
    spec,
    values,
    before: clientPicker,
    after: `<section class="doc-lines" data-lines></section>`,
    saveLabel: existing ? "Save changes" : kind === "quote" ? "Create quote" : "Create invoice",
    bind: (root) => {
      const box = $("[data-lines]", root);
      const drawTotals = () => {
        const t = totalsOf(root);
        $("[data-totals]", box).innerHTML = `<div><span>Subtotal</span><b>${inr(t.subtotalPaise)}</b></div>${t.discountPaise ? `<div><span>Discount</span><b>− ${inr(t.discountPaise)}</b></div>` : ""}
          ${t.interState ? `<div><span>IGST ${GST_RATE}%</span><b>${inr(t.igstPaise)}</b></div>` : `<div><span>CGST ${GST_RATE / 2}%</span><b>${inr(t.cgstPaise)}</b></div><div><span>SGST ${GST_RATE / 2}%</span><b>${inr(t.sgstPaise)}</b></div>`}
          <div class="grand"><span>Total</span><b>${inr(t.totalPaise)}</b></div><p class="muted small">${esc(rupeesInWords(t.totalPaise / 100))} rupees only · place of supply ${esc(t.state)}</p>`;
        lines.forEach((l, i) => {
          const el = $(`[data-amt="${i}"]`, box);
          if (el) el.textContent = inr(t.lineAmounts[i] || 0);
        });
      };
      const draw = () => {
        box.innerHTML = `<h3>Items</h3><div class="doc-head muted small"><span>Description</span><span>Qty</span><span>Unit</span><span>Rate (₹)</span><span>Amount</span><span></span></div>
          ${lines.map((l, i) => `<div class="doc-line"><input type="text" data-f="description" data-i="${i}" value="${esc(l.description)}" placeholder="e.g. Concept design stage"><input type="number" min="0" step="any" data-f="qty" data-i="${i}" value="${esc(l.qty)}"><input type="text" data-f="unit" data-i="${i}" value="${esc(l.unit || "")}" placeholder="nos / sqft"><input type="number" min="0" step="any" data-f="rate" data-i="${i}" value="${esc(paiseToRupees(l.ratePaise))}"><span data-amt="${i}"></span><button type="button" class="icon-btn" data-rm="${i}" aria-label="Remove line">${icon("x", 15)}</button></div>`).join("")}
          <button type="button" class="btn small" data-add-line>${icon("plus", 14)} Add item</button><div class="doc-totals" data-totals></div>`;
        drawTotals();
      };
      draw();
      box.addEventListener("input", (e) => {
        const el = e.target.closest("[data-f]");
        if (!el) return;
        const l = lines[Number(el.dataset.i)];
        if (el.dataset.f === "rate") l.ratePaise = rupeesToPaise(el.value);
        else if (el.dataset.f === "qty") l.qty = Number(el.value);
        else l[el.dataset.f] = el.value;
        drawTotals();
      });
      box.addEventListener("click", (e) => {
        if (e.target.closest("[data-add-line]")) { lines.push(blankLine()); draw(); }
        const rm = e.target.closest("[data-rm]");
        if (rm && lines.length > 1) { lines.splice(Number(rm.dataset.rm), 1); draw(); }
      });
      root.addEventListener("input", (e) => {
        if (e.target.matches('[data-key="gstin"], [data-key="discountRupees"], [data-key="stateCode"]')) {
          if (e.target.matches('[data-key="gstin"]')) {
            const s = placeOfSupply(e.target.value, "", "");
            if (s) { const sel = $('[data-key="stateCode"]', root); if (sel) sel.value = s; }
          }
          drawTotals();
        }
      });
      const pick = $("[data-pick-client]", root);
      if (pick) pick.addEventListener("change", () => {
        const c = clientById(pick.value);
        if (!c) return;
        const set = (k, v) => { const el = $(`[data-key="${k}"]`, root); if (el && v) el.value = v; };
        set("buyerName", c.company || c.name); set("contactName", c.name); set("phone", c.phone); set("email", c.email); set("address", c.location);
        drawTotals();
      });
    },
    onSave: async (out) => {
      const gstin = String(out.gstin || "").trim().toUpperCase();
      if (gstin && !GSTIN_RE.test(gstin)) { toast("That GSTIN doesn't look right. It has 15 characters, like 29ABCDE1234F1Z5.", { error: true }); return false; }
      const cleaned = lines.filter((l) => l.description.trim()).map((l) => ({ description: l.description.trim().slice(0, 300), qty: Math.max(0, Number(l.qty) || 0), unit: (l.unit || "").trim().slice(0, 40), ratePaise: Math.max(0, Math.round(l.ratePaise || 0)) })).filter((l) => l.qty > 0);
      if (!cleaned.length) { toast("Add at least one item with a quantity.", { error: true }); return false; }
      const state = placeOfSupply(gstin, out.stateCode, supplierState());
      const t = docTotals(cleaned, rupeesToPaise(out.discountRupees), state, supplierState(), GST_RATE);
      const { discountRupees, ...rest } = out;
      const doc = {
        ...(existing || { id: uid("dc_"), kind, status: base.status }), ...rest, gstin, stateCode: state, lines: cleaned, gstRate: GST_RATE,
        discountPaise: t.discountPaise, subtotalPaise: t.subtotalPaise, taxablePaise: t.taxablePaise, cgstPaise: t.cgstPaise, sgstPaise: t.sgstPaise, igstPaise: t.igstPaise, totalPaise: t.totalPaise, lineAmounts: t.lineAmounts,
        projectName: out.projectId ? (projectById(out.projectId) || {}).name || "" : "",
      };
      if (!existing) {
        const s = seriesFor(kind, doc.issueDate || today());
        try {
          const { n } = await studioApi({ action: "number.next", series: s.series });
          doc.number = docNumber(s.prefix, s.fy, n);
        } catch (e) { toast(esc(e.message), { error: true }); return false; }
        note(`created ${kind} ${doc.number} for ${doc.buyerName}`, { type: "doc", id: doc.id });
      }
      put("docs", doc);
      ui.tab = kind === "quote" ? "quotes" : "invoices";
      app.render();
    },
    onDelete: existing && existing.status !== "paid" ? () => { del("docs", existing.id); app.render(); } : null,
    deleteLabel: "Delete (drafts only)",
  });
};

const openPaid = (doc) => {
  openDrawer({
    title: `Record payment · ${doc.number}`,
    subtitle: `${inr(doc.totalPaise)} from ${esc(doc.buyerName)}`,
    spec: [
      { key: "paidOn", label: "Received on", type: "date", half: true },
      { key: "paymentMethod", label: "Method", type: "select", options: PAYMENT_METHODS, half: true },
      { key: "paymentRef", label: "Reference (UTR / cheque no.)", type: "text" },
    ],
    values: { paidOn: today(), paymentMethod: "bank_transfer", paymentRef: "" },
    saveLabel: "Mark as paid",
    onSave: (out) => {
      put("docs", { ...doc, status: "paid", ...out });
      note(`recorded payment for ${doc.number}`, { type: "doc", id: doc.id });
      app.render();
    },
  });
};

const convertToInvoice = async (quote) => {
  const s = seriesFor("invoice", today());
  let n;
  try { ({ n } = await studioApi({ action: "number.next", series: s.series })); } catch (e) { toast(esc(e.message), { error: true }); return; }
  const invoice = { ...quote, id: uid("dc_"), kind: "invoice", status: "issued", number: docNumber(s.prefix, s.fy, n), issueDate: today(), dueDate: addDays(today(), 15), validUntil: "", quoteId: quote.id, createdAt: undefined, updatedAt: undefined };
  delete invoice.createdAt; delete invoice.updatedAt;
  put("docs", invoice);
  put("docs", { ...quote, status: "converted", convertedToId: invoice.id });
  note(`turned quote ${quote.number} into invoice ${invoice.number}`, { type: "doc", id: invoice.id });
  ui.tab = "invoices";
  toast(`Invoice ${invoice.number} created.`);
  app.render();
};

const openPrint = (doc) => {
  const w = window.open("", "_blank");
  if (!w) { toast("Allow pop-ups to open the printable page.", { error: true }); return; }
  w.document.write(printableDoc(doc, company()));
  w.document.close();
};

// ---------------------------------------------------------------------------
// Expenses

export const openExpense = (id) => {
  const existing = id ? data.expenses.find((e) => e.id === id) : null;
  openDrawer({
    title: existing ? "Edit expense" : "New expense",
    spec: [
      { key: "vendor", label: "Paid to", type: "text", required: true, placeholder: "Vendor or person" },
      { key: "date", label: "Date", type: "date", half: true },
      { key: "amountRupees", label: "Amount (₹, incl. GST)", type: "number", half: true },
      { key: "gstRupees", label: "of which GST (₹)", type: "number", half: true },
      { key: "category", label: "Category", type: "text", list: EXPENSE_CATEGORIES, half: true },
      { key: "projectId", label: "Project (optional)", type: "select", options: data.projects.map((p) => ({ id: p.id, label: p.name })), blank: "Office / general", half: true },
      { key: "paidBy", label: "Paid by", type: "team", half: true },
      { key: "method", label: "Method", type: "select", options: PAYMENT_METHODS, half: true },
      { key: "reimbursed", label: "Reimbursement", type: "select", options: [{ id: "na", label: "Not needed" }, { id: "due", label: "Owed to staff" }, { id: "done", label: "Reimbursed" }], half: true },
      { key: "notes", label: "Notes", type: "textarea", rows: 2 },
      { key: "receipts", label: "Receipts", type: "photos" },
    ],
    values: existing ? { ...existing, amountRupees: paiseToRupees(existing.amountPaise), gstRupees: paiseToRupees(existing.gstPaise) } : { date: today(), method: "upi", reimbursed: "na", receipts: [] },
    saveLabel: existing ? "Save changes" : "Add expense",
    onSave: (out) => {
      const { amountRupees, gstRupees, ...rest } = out;
      put("expenses", { ...(existing || { id: uid("ex_") }), ...rest, amountPaise: rupeesToPaise(amountRupees), gstPaise: rupeesToPaise(gstRupees) });
      ui.tab = "expenses";
      app.render();
    },
    onDelete: existing ? () => { del("expenses", existing.id); app.render(); } : null,
    deleteLabel: "Delete expense",
  });
};

// ---------------------------------------------------------------------------
// Page

const kpiHTML = () => {
  const invoices = data.docs.filter((d) => d.kind === "invoice" && d.status !== "cancelled");
  const outstanding = invoices.filter((d) => d.status === "issued");
  const overdue = outstanding.filter(isOverdue);
  const paidFy = invoices.filter((d) => d.status === "paid" && inFy(d.paidOn || d.issueDate));
  const billedFy = invoices.filter((d) => inFy(d.issueDate));
  const gst = billedFy.reduce((n, d) => n + d.cgstPaise + d.sgstPaise + d.igstPaise, 0);
  const spent = data.expenses.filter((e) => inFy(e.date)).reduce((n, e) => n + (e.amountPaise || 0), 0);
  const tile = (label, value, sub, tone = "") => `<div class="kpi ${tone}"><span class="k">${label}</span><b>${value}</b><span class="small muted">${sub}</span></div>`;
  return `<div class="kpis money">
    ${tile("Outstanding", inr(outstanding.reduce((n, d) => n + d.totalPaise, 0)), `${outstanding.length} unpaid invoice${outstanding.length === 1 ? "" : "s"}`)}
    ${tile("Overdue", inr(overdue.reduce((n, d) => n + d.totalPaise, 0)), overdue.length ? `${overdue.length} past due date` : "nothing overdue", overdue.length ? "warn" : "")}
    ${tile(`Received FY ${fyNow()}`, inr(paidFy.reduce((n, d) => n + d.totalPaise, 0)), `${paidFy.length} paid`)}
    ${tile("GST on invoices", inr(gst), `billed in FY ${fyNow()}`)}
    ${tile("Expenses", inr(spent), `FY ${fyNow()}`)}
  </div>`;
};

export const renderBilling = (view) => {
  const missing = !company().legalName || !company().gstin;
  const root = mount(view, `
    <div class="page-head"><div><h1>Billing</h1><p>Quotes, GST tax invoices and expenses. Numbers run in sequence for each financial year.</p></div>
      <div class="head-actions"><button class="btn" data-new-expense>${icon("plus", 16)} Expense</button><button class="btn" data-new-quote>${icon("plus", 16)} Quote</button><button class="btn primary" data-new-invoice>${icon("plus", 16)} Invoice</button></div></div>
    ${missing ? `<div class="notice warn" style="margin-bottom:14px">Add your legal name, GSTIN and bank details in <a href="#/settings">Settings → Company</a> so they print on invoices.</div>` : ""}
    <div data-kpis>${kpiHTML()}</div>
    <div class="toolbar"><div class="seg">${[["invoices", "Invoices"], ["quotes", "Quotes"], ["expenses", "Expenses"]].map(([id, l]) => `<button type="button" data-tab="${id}" class="${ui.tab === id ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="search">${icon("search", 15)}<input type="search" data-q placeholder="Search" value="${esc(ui.q)}"></label></div>
    <div data-body></div>`);
  const body = $("[data-body]", root);

  const draw = () => {
    const q = ui.q.trim().toLowerCase();
    if (ui.tab === "expenses") {
      const list = data.expenses.filter((e) => !q || `${e.vendor} ${e.category || ""} ${e.notes || ""}`.toLowerCase().includes(q)).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      body.innerHTML = list.length ? `<table class="table"><thead><tr><th>Date</th><th>Paid to</th><th>Category</th><th>Project</th><th class="r">Amount</th><th></th></tr></thead><tbody>${list.map((e) => `<tr data-expense="${e.id}" class="clickable"><td>${fmtDate(e.date, { year: true })}</td><td>${esc(e.vendor)}</td><td>${esc(e.category || "")}</td><td>${esc((projectById(e.projectId) || {}).name || "Office")}</td><td class="r">${inr(e.amountPaise || 0)}</td><td>${e.reimbursed === "due" ? pill("Owed to staff", "warn") : ""}</td></tr>`).join("")}</tbody></table>`
        : emptyState({ iconName: "file", title: "No expenses yet", text: "Record site visits, printing, software and other costs against a project." });
      return;
    }
    const kind = ui.tab === "quotes" ? "quote" : "invoice";
    const list = data.docs.filter((d) => d.kind === kind && (!q || `${d.number} ${d.buyerName} ${d.projectName || ""}`.toLowerCase().includes(q))).sort((a, b) => (b.number || "").localeCompare(a.number || ""));
    body.innerHTML = list.length ? `<table class="table"><thead><tr><th>Number</th><th>Billed to</th><th>Date</th><th>${kind === "quote" ? "Valid until" : "Due"}</th><th class="r">Total</th><th>Status</th><th></th></tr></thead><tbody>${list.map((d) => {
      const st = statusOf(d);
      return `<tr data-doc="${d.id}" class="clickable"><td><b>${esc(d.number)}</b></td><td>${esc(d.buyerName)}${d.projectName ? `<div class="muted small">${esc(d.projectName)}</div>` : ""}</td><td>${fmtDate(d.issueDate, { year: true })}</td><td>${fmtDate(kind === "quote" ? d.validUntil : d.dueDate, { year: true })}</td><td class="r">${inr(d.totalPaise)}</td><td>${isOverdue(d) ? pill("Overdue", "bad") : pill(st.label, st.tone)}</td><td><button class="icon-btn" data-menu="${d.id}" aria-label="Actions">${icon("more", 16)}</button></td></tr>`;
    }).join("")}</tbody></table>`
      : emptyState({ iconName: "file", title: kind === "quote" ? "No quotes yet" : "No invoices yet", text: kind === "quote" ? "Make a fee proposal for a client, then turn it into an invoice once accepted." : "Create a GST invoice for a client. It prints as a PDF with your GSTIN and bank details." });
  };
  draw();

  root.addEventListener("input", (e) => { if (e.target.matches("[data-q]")) { ui.q = e.target.value; draw(); } });
  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-new-invoice]")) return openDoc(null, { kind: "invoice" });
    if (t.closest("[data-new-quote]")) return openDoc(null, { kind: "quote" });
    if (t.closest("[data-new-expense]")) return openExpense(null);
    const tab = t.closest("[data-tab]");
    if (tab) { ui.tab = tab.dataset.tab; $$("[data-tab]", root).forEach((b) => b.classList.toggle("on", b === tab)); return draw(); }
    const menu = t.closest("[data-menu]");
    if (menu) {
      const doc = data.docs.find((d) => d.id === menu.dataset.menu);
      const items = [{ label: "Open / edit", onClick: () => openDoc(doc.id) }, { label: "Print or save as PDF", onClick: () => openPrint(doc) }];
      if (doc.kind === "quote" && doc.status !== "converted") {
        items.push({ label: "Mark as sent", onClick: () => { put("docs", { ...doc, status: "sent" }); app.render(); } }, { label: "Mark as accepted", onClick: () => { put("docs", { ...doc, status: "accepted" }); app.render(); } }, { label: "Turn into invoice", onClick: () => convertToInvoice(doc) }, { label: "Mark as lost", onClick: () => { put("docs", { ...doc, status: "lost" }); app.render(); } });
      }
      if (doc.kind === "invoice" && doc.status === "issued") {
        items.push({ label: "Record payment", onClick: () => openPaid(doc) }, { label: "Cancel invoice", danger: true, onClick: async () => { if (await confirmBox({ title: "Cancel this invoice?", message: "The number stays on record as cancelled.", confirmLabel: "Cancel invoice", danger: true })) { put("docs", { ...doc, status: "cancelled" }); app.render(); } } });
      }
      return openMenu(menu, items);
    }
    const doc = t.closest("[data-doc]");
    if (doc) return openDoc(doc.dataset.doc);
    const ex = t.closest("[data-expense]");
    if (ex) return openExpense(ex.dataset.expense);
  });
};
