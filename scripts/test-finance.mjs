// Checks the GST and leave rules ported from the ALIVE console.
//   node scripts/test-finance.mjs
import { docTotals, placeOfSupply, financialYear, docNumber, rupeesInWords } from "../public/admin/studio/finance.js";
import { checkRequest, balances, workingDays, closedDays, DEFAULT_POLICY } from "../public/admin/studio/leave.js";

let pass = 0, fail = 0;
const ok = (n, c, x) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${c ? "" : "  -> " + JSON.stringify(x)}`); };

// GST
let t = docTotals([{ qty: 1, ratePaise: 1000000 }], 0, "29");
ok("intra-state: CGST 9% + SGST 9%", t.cgstPaise === 90000 && t.sgstPaise === 90000 && t.igstPaise === 0 && t.totalPaise === 1180000, t);
t = docTotals([{ qty: 1, ratePaise: 1000000 }], 0, "32");
ok("inter-state: IGST 18%", t.igstPaise === 180000 && t.cgstPaise === 0 && t.totalPaise === 1180000, t);
t = docTotals([{ qty: 2, ratePaise: 500050 }, { qty: 1, ratePaise: 12345 }], 100000, "29");
ok("rows add up to the total (whole-rupee rounding)", t.lineAmounts.reduce((a, b) => a + b, 0) === t.subtotalPaise && t.totalPaise === t.taxablePaise + t.cgstPaise + t.sgstPaise + t.igstPaise && t.subtotalPaise % 100 === 0, t);
t = docTotals([{ qty: 1, ratePaise: 100000 }], 99999999, "29");
ok("a discount can never exceed the subtotal", t.taxablePaise === 0 && t.totalPaise === 0, t);
ok("place of supply follows a valid GSTIN", placeOfSupply("32ABCDE1234F1Z5", "29") === "32");
ok("an invalid GSTIN falls back to the picked state", placeOfSupply("nonsense", "27") === "27");
ok("financial year spans April to March", financialYear("2026-10-15") === "26-27" && financialYear("2027-03-31") === "26-27" && financialYear("2027-04-01") === "27-28");
ok("document number format", docNumber("VS", "26-27", 7) === "VS/26-27/0007");
ok("amount in words uses lakh and crore", rupeesInWords(1302700) === "Thirteen Lakh Two Thousand Seven Hundred" && rupeesInWords(25000000) === "Two Crore Fifty Lakh" && rupeesInWords(0) === "Zero");

// Leave
const closed = closedDays([{ date: "2027-01-26", kind: "mandatory" }]);
ok("Sundays and holidays are not working days", workingDays("2027-01-24", "2027-01-27", closed).join() === "2027-01-25,2027-01-27");
ok("only the 2nd and 4th Saturdays work", workingDays("2027-01-02", "2027-01-30", new Set()).filter((d) => new Date(`${d}T00:00:00Z`).getUTCDay() === 6).join() === "2027-01-09,2027-01-23");
const base = { joinedOn: "2026-01-01", today: "2026-12-01", holidays: [], requests: [] };
let r = checkRequest({ type: "casual", start: "2027-02-01", end: "2027-02-03", emergency: false }, base);
ok("3 casual days in a row are fine", r.ok && r.days === 3, r);
r = checkRequest({ type: "casual", start: "2027-02-01", end: "2027-02-04", emergency: false }, base);
ok("4 casual days in a row are refused", !r.ok && /at most 3/.test(r.error), r);
r = checkRequest({ type: "casual", start: "2026-11-01", end: "2026-11-01", emergency: false }, base);
ok("leave cannot start in the past", !r.ok, r);
r = checkRequest({ type: "casual", start: "2026-12-01", end: "2026-12-01", emergency: false }, base);
ok("leave starting today must be marked emergency", !r.ok && /Emergency/.test(r.error), r);
r = checkRequest({ type: "sick", start: "2027-02-01", end: "2027-02-03", emergency: false }, base);
ok("sick leave over 2 days needs a certificate", r.ok && r.needsCertificate === true, r);
r = checkRequest({ type: "lop", start: "2027-02-01", end: "2027-02-01", emergency: false }, base);
ok("loss of pay cannot be requested", !r.ok, r);
r = checkRequest({ type: "casual", start: "2027-02-02", end: "2027-02-02", emergency: false }, { ...base, requests: [{ id: "a", type: "casual", start: "2027-02-01", end: "2027-02-03", status: "approved" }] });
ok("overlapping leave is refused", !r.ok, r);
const used = ["01", "02", "03", "04", "05", "08", "09", "10"].map((d, i) => ({ id: `u${i}`, type: "casual", start: `2027-03-${d}`, end: `2027-03-${d}`, status: "approved" }));
r = checkRequest({ type: "casual", start: "2027-05-03", end: "2027-05-03", emergency: false }, { ...base, requests: used });
ok("casual leave stops at the yearly allowance", !r.ok && /Only 0/.test(r.error), r);
let b = balances(2026, { ...base, today: "2026-12-31" });
ok("earned leave accrues 1 per 20 days worked, capped", b.earned.accrued >= 11 && b.earned.accrued <= DEFAULT_POLICY.earnedMaxPerYear, b.earned);
b = balances(2027, { ...base, today: "2027-01-02" });
ok("earned leave carries into the next year", b.earned.carried === 12, b.earned);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
