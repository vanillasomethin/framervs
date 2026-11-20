// Tests for the public enquiry endpoint (netlify/functions/enquiry.js): validation,
// honeypot, size and rate limits, storage in the studio "enquiries" collection and
// admin follow-up. No network or Netlify needed: data is kept in a temporary folder.
//
//   node scripts/test-enquiry-api.cjs

delete process.env.GITHUB_TOKEN; process.env.ADMIN_PASSWORD = "pw-test"; process.env.STUDIO_LOCAL_DIR = require("fs").mkdtempSync(require("os").tmpdir() + "/studio-");
const cms = require("../netlify/functions/cms.js").handler;
const studio = require("../netlify/functions/studio.js").handler;
const enq = require("../netlify/functions/enquiry.js").handler;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + JSON.stringify(extra)}`); };
const call = async (fn, body, token, method = "POST", qs, headers = {}) => {
  const r = await fn({ httpMethod: method, headers: { ...(token ? { authorization: "Bearer " + token } : {}), ...headers }, body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body), queryStringParameters: qs });
  let parsed; try { parsed = JSON.parse(r.body); } catch { parsed = r.body; }
  return { status: r.statusCode, body: parsed };
};
const ip = (a) => ({ "x-nf-client-connection-ip": a });
const post = (body, a = "1.1.1.1") => call(enq, body, null, "POST", undefined, ip(a));
const bad = (x) => x.status === 400 && typeof x.body.error === "string";
const good = { project: "Villa refit", location: "Mangalore", stage: "Design", name: "Rahim", phone: "+91 98450 12345", email: "rahim@example.com", budgetRange: "50L-1Cr", timeline: "6 months", message: "M".repeat(1500), consent: true, website: "", page: "/contact" };
(async () => {
  let r = await call(enq, null, null, "GET"); ok("GET is 405", r.status === 405, r);
  const T = (await call(cms, { action: "login", password: "pw-test" })).body.token;
  const coll = async () => (await call(studio, { action: "load" }, T)).body.collections;

  r = await post("not json"); ok("raw body 'not json' -> 400", bad(r), r);
  r = await post({ ...good, name: undefined }); ok("missing name -> 400", bad(r), r);
  r = await post({ ...good, phone: undefined, email: undefined }); ok("no phone and no email -> 400", bad(r), r);
  r = await post({ ...good, email: "a@b" }); ok("bad email 'a@b' -> 400", bad(r), r);
  r = await post({ ...good, phone: "12" }); ok("bad phone '12' -> 400", bad(r), r);
  const c1 = await post({ ...good, consent: undefined }), c2 = await post({ ...good, consent: "true" });
  ok("consent missing or string 'true' -> 400", bad(c1) && bad(c2), [c1.body, c2.body]);

  r = await post({ ...good, website: "http://spam" });
  ok("honeypot filled -> 200 and nothing stored", r.status === 200 && (((await coll()).enquiries) || []).length === 0, r);

  const v = await post({ ...good, evil: "x" });
  ok("valid submission -> 200 with body exactly {ok:true}", v.status === 200 && JSON.stringify(Object.keys(v.body)) === '["ok"]' && v.body.ok === true, v.body);

  const list = ((await coll()).enquiries) || [];
  const stored = list[0] || {};
  ok("stored once with clean fields (id, status, source, consent, message cap)", list.length === 1 && /^enq_[a-f0-9]{10}$/.test(stored.id) && stored.status === "new" && stored.source === "website" && stored.consent === true && stored.name === "Rahim" && !("evil" in stored) && !("website" in stored) && String(stored.message).length === 1000, list);

  r = await post({ ...good, pad: "p".repeat(9000) }); ok("body over 8192 bytes -> 413", r.status === 413, r);

  const five = []; for (let i = 0; i < 5; i++) five.push((await post({ ...good, name: "R" + i }, "9.9.9.9")).status);
  const sixth = await post(good, "9.9.9.9"), other = await post(good, "8.8.8.8");
  ok("rate limit: 5 per IP per hour, 6th -> 429 with error, other IP still 200", five.every((s) => s === 200) && sixth.status === 429 && typeof sixth.body.error === "string" && other.status === 200, [five, sixth.body, other.status]);

  const inv = []; for (let i = 0; i < 6; i++) inv.push((await post({ ...good, name: undefined }, "7.7.7.7")).status);
  const after = await post(good, "7.7.7.7");
  ok("invalid submissions don't use up the limit", inv.every((s) => s === 400) && after.status === 200, [inv, after.body]);

  r = await call(studio, { action: "load" }); ok("studio load without token -> 401", r.status === 401, r);

  r = await call(studio, { action: "save", ops: [{ c: "enquiries", op: "patch", id: stored.id, fields: { status: "lead", leadId: "ld_test1" }, item: { ...stored, status: "lead", leadId: "ld_test1" } }] }, T);
  const moved = ((await coll()).enquiries || []).find((x) => x.id === stored.id) || {};
  ok("admin patch moves enquiry to status 'lead' and reload shows it", r.status === 200 && moved.status === "lead", r);

  r = await call(studio, { action: "save", ops: [{ c: "consultations", op: "set", item: { id: "cons_test1", leadId: "ld_test1", feeStatus: "quoted", feeQuotedPaise: 250000 } }] }, T);
  const cons = ((await coll()).consultations || []).find((x) => x.id === "cons_test1") || {};
  ok("consultations collection accepts a set and loads it back", r.status === 200 && cons.feeStatus === "quoted" && cons.feeQuotedPaise === 250000, r);

  const exp = await call(studio, { action: "export" }, T); const ec = exp.body.collections || {};
  ok("export includes collections.enquiries and collections.consultations arrays", Array.isArray(ec.enquiries) && Array.isArray(ec.consultations), Object.keys(ec));
  ok("stored data never contains the raw IP 9.9.9.9", (ec.enquiries || []).length > 0 && !JSON.stringify(exp.body).includes("9.9.9.9"), (ec.enquiries || []).length);

  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
