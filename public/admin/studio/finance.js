// GST maths and document helpers for quotes and tax invoices.
// Ported from the ALIVE console (billing-docs.ts). Money is stored in paise;
// line amounts and each tax head are rounded to whole rupees so the printed rows
// always add up to the printed total.

export const GST_RATE_DEFAULT = 18;

export const STATES = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh",
  "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh",
};
export const STATE_OPTIONS = Object.entries(STATES).map(([id, label]) => ({ id, label: `${label} (${id})` }));

export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const rupee = (paise) => Math.round(paise / 100) * 100;

/** Totals for a document. `supplierState` is where the studio is registered (intra-state: CGST+SGST, otherwise IGST). */
export const docTotals = (lines, discountPaise, stateCode, supplierState = "29", ratePct = GST_RATE_DEFAULT) => {
  const lineAmounts = lines.map((l) => rupee((Number(l.qty) || 0) * (Number(l.ratePaise) || 0)));
  const subtotalPaise = lineAmounts.reduce((a, b) => a + b, 0);
  const discount = Math.min(Math.max(0, rupee(discountPaise || 0)), subtotalPaise);
  const taxablePaise = subtotalPaise - discount;
  const interState = stateCode !== supplierState;
  let cgstPaise = 0, sgstPaise = 0, igstPaise = 0;
  if (interState) igstPaise = rupee((taxablePaise * ratePct) / 100);
  else {
    cgstPaise = rupee((taxablePaise * ratePct) / 200);
    sgstPaise = cgstPaise;
  }
  return { lineAmounts, subtotalPaise, discountPaise: discount, taxablePaise, cgstPaise, sgstPaise, igstPaise, totalPaise: taxablePaise + cgstPaise + sgstPaise + igstPaise, interState };
};

/** Place of supply: the buyer's GSTIN state when valid, else the one picked, else the supplier's. */
export const placeOfSupply = (gstin, picked, supplierState = "29") => {
  const g = String(gstin || "").trim().toUpperCase();
  if (GSTIN_RE.test(g) && STATES[g.slice(0, 2)]) return g.slice(0, 2);
  return picked && STATES[picked] ? picked : supplierState;
};

/** Indian financial year of a day key: 2026-10-15 and 2027-03-31 are both "26-27". */
export const financialYear = (day) => {
  const y = Number(day.slice(0, 4)), m = Number(day.slice(5, 7));
  const start = m >= 4 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
};

export const docNumber = (prefix, fy, n) => `${prefix}/${fy}/${String(n).padStart(4, "0")}`;

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const upTo99 = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
const upTo999 = (n) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : "", n % 100 ? upTo99(n % 100) : ""].filter(Boolean).join(" ");

/** Whole rupees in words, Indian grouping: 1302700 → "Thirteen Lakh Two Thousand Seven Hundred". */
export const rupeesInWords = (rupees) => {
  let n = Math.round(Math.abs(rupees));
  if (n === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${upTo999(crore)} Crore`);
  if (lakh) parts.push(`${upTo99(lakh)} Lakh`);
  if (thousand) parts.push(`${upTo99(thousand)} Thousand`);
  if (n) parts.push(upTo999(n));
  return parts.join(" ");
};

export const inr = (paise) => `₹${(Math.round(paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const QUOTE_STATUS = [
  { id: "draft", label: "Draft", tone: "mute" },
  { id: "sent", label: "Sent", tone: "info" },
  { id: "accepted", label: "Accepted", tone: "ok" },
  { id: "lost", label: "Lost", tone: "bad" },
  { id: "converted", label: "Invoiced", tone: "ok" },
];
export const INVOICE_STATUS = [
  { id: "issued", label: "Unpaid", tone: "warn" },
  { id: "paid", label: "Paid", tone: "ok" },
  { id: "cancelled", label: "Cancelled", tone: "mute" },
];
export const PAYMENT_METHODS = [
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "upi", label: "UPI" },
  { id: "cheque", label: "Cheque" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
];

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtDay = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

/** A printable page (opens in a new tab; use Print / Save as PDF). */
export const printableDoc = (doc, company) => {
  const t = doc;
  const kind = doc.kind === "quote" ? "Quotation" : "Tax invoice";
  const intra = !t.igstPaise;
  const money = (p) => (p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(kind)} ${esc(doc.number)}</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}body{font:13px/1.5 Inter,Helvetica,Arial,sans-serif;color:#1a1a1a;margin:0;padding:24px}
.top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #380100;padding-bottom:14px}
.brand{display:flex;gap:12px;align-items:center}.brand img{width:54px;height:54px}.brand b{font:700 18px "Space Grotesk",Helvetica,sans-serif;letter-spacing:.04em}
.muted{color:#666}h1{font:700 22px "Space Grotesk",Helvetica,sans-serif;text-transform:uppercase;margin:0;text-align:right}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:18px 0}.meta h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888}
table{width:100%;border-collapse:collapse}th{background:#f4f0ec;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
th,td{padding:8px 10px;border-bottom:1px solid #e5e0da;vertical-align:top}td.n,th.n{text-align:right;white-space:nowrap}
.tot{margin:14px 0 0 auto;width:320px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.tot .g{border-top:2px solid #380100;font:700 15px "Space Grotesk",Helvetica,sans-serif;padding-top:8px;margin-top:4px}
.words{margin-top:12px;font-style:italic}.foot{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px;font-size:12px}
.stamp{display:inline-block;border:2px solid #1a7f4b;color:#1a7f4b;padding:2px 10px;border-radius:4px;font-weight:700;text-transform:uppercase;transform:rotate(-4deg)}
@media print{body{padding:0}.noprint{display:none}}
</style></head><body>
<p class="noprint"><button onclick="print()" style="padding:8px 16px;font:inherit;cursor:pointer">Print / Save as PDF</button></p>
<div class="top"><div class="brand"><img src="${location.origin}/brand/vs-mark-maroon.png" alt=""><div><b>${esc(company.legalName || "VANILLA & SOMETHIN'")}</b><div class="muted">${esc(company.address || "")}</div>
<div class="muted">${[company.gstin && `GSTIN ${company.gstin}`, company.pan && `PAN ${company.pan}`].filter(Boolean).map(esc).join(" · ")}</div>
<div class="muted">${[company.phone, company.email].filter(Boolean).map(esc).join(" · ")}</div></div></div>
<div><h1>${esc(kind)}</h1><div style="text-align:right"><b>${esc(doc.number)}</b><br>Date: ${esc(fmtDay(doc.issueDate))}<br>${doc.kind === "quote" ? (doc.validUntil ? `Valid until: ${esc(fmtDay(doc.validUntil))}` : "") : doc.dueDate ? `Due: ${esc(fmtDay(doc.dueDate))}` : ""}${doc.status === "paid" ? `<br><span class="stamp">Paid</span>` : ""}</div></div></div>
<div class="meta"><div><h4>Billed to</h4><b>${esc(doc.buyerName)}</b>${doc.contactName ? `<br>${esc(doc.contactName)}` : ""}<br>${esc(doc.address || "")}${doc.gstin ? `<br>GSTIN ${esc(doc.gstin)}` : ""}${doc.phone ? `<br>${esc(doc.phone)}` : ""}${doc.email ? `<br>${esc(doc.email)}` : ""}</div>
<div><h4>Place of supply</h4>${esc(STATES[doc.stateCode] || "")} (${esc(doc.stateCode)})${doc.projectName ? `<h4 style="margin-top:10px">Project</h4>${esc(doc.projectName)}` : ""}</div></div>
<table><thead><tr><th>#</th><th>Description</th><th class="n">Qty</th><th class="n">Rate (₹)</th><th class="n">Amount (₹)</th></tr></thead><tbody>
${doc.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.description)}</td><td class="n">${esc(l.qty)}${l.unit ? ` ${esc(l.unit)}` : ""}</td><td class="n">${money(l.ratePaise)}</td><td class="n">${money(t.lineAmounts?.[i] ?? l.qty * l.ratePaise)}</td></tr>`).join("")}
</tbody></table>
<div class="tot"><div><span>Subtotal</span><span>₹${money(t.subtotalPaise)}</span></div>
${t.discountPaise ? `<div><span>${esc(doc.discountLabel || "Discount")}</span><span>− ₹${money(t.discountPaise)}</span></div>` : ""}
<div><span>Taxable value</span><span>₹${money(t.taxablePaise)}</span></div>
${intra ? `<div><span>CGST ${doc.gstRate / 2}%</span><span>₹${money(t.cgstPaise)}</span></div><div><span>SGST ${doc.gstRate / 2}%</span><span>₹${money(t.sgstPaise)}</span></div>` : `<div><span>IGST ${doc.gstRate}%</span><span>₹${money(t.igstPaise)}</span></div>`}
<div class="g"><span>Total</span><span>₹${money(t.totalPaise)}</span></div></div>
<p class="words">Amount in words: Indian Rupees ${esc(rupeesInWords(t.totalPaise / 100))} Only</p>
<div class="foot"><div>${doc.notes ? `<b>Notes</b><br>${esc(doc.notes).replace(/\n/g, "<br>")}<br><br>` : ""}${company.terms ? `<b>Terms</b><br>${esc(company.terms).replace(/\n/g, "<br>")}` : ""}</div>
<div>${company.bank || company.upi ? `<b>Pay to</b><br>${esc(company.bank || "").replace(/\n/g, "<br>")}${company.upi ? `<br>UPI: ${esc(company.upi)}` : ""}` : ""}</div></div>
</body></html>`;
};
