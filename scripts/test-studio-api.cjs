// Tests for the studio and onboarding functions (auth, conflict-safe saves,
// photos, client brief links, backup/restore). No network or Netlify needed:
// data is kept in a temporary folder.
//
//   node scripts/test-studio-api.cjs

delete process.env.GITHUB_TOKEN; process.env.ADMIN_PASSWORD = "pw-test"; process.env.STUDIO_LOCAL_DIR = require("fs").mkdtempSync(require("os").tmpdir() + "/studio-");
const cms = require("../netlify/functions/cms.js").handler;
const studio = require("../netlify/functions/studio.js").handler;
const onboard = require("../netlify/functions/onboard.js").handler;
const searchConsole = require("../netlify/functions/search-console.js").handler;
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + JSON.stringify(extra)}`); };
const call = async (fn, body, token, method = "POST", qs) => { const r = await fn({ httpMethod: method, headers: token ? { authorization: "Bearer " + token } : {}, body: body ? JSON.stringify(body) : undefined, queryStringParameters: qs }); return { status: r.statusCode, body: JSON.parse(r.body) }; };
(async () => {
  let r = await call(studio, { action: "load" }); ok("load without login is rejected", r.status === 401, r);
  // One login must work everywhere: the Search Console functions verify sessions with their own copy of the check
  const interop = await call(cms, { action: "login", password: "pw-test" });
  r = await call(searchConsole, { action: "sites" }, interop.body.token); ok("a studio login is accepted by the Search Console function", r.status !== 401, r);
  r = await call(searchConsole, { action: "sites" }, interop.body.token + "x"); ok("...and a tampered token is still rejected there", r.status === 401, r);
  r = await call(cms, { action: "login", password: "bad" }); ok("wrong password rejected", r.status === 401, r);
  r = await call(cms, { action: "login", password: "pw-test" }); const T = r.body.token; ok("login works with only ADMIN_PASSWORD", r.status === 200 && T, r);
  r = await call(studio, { action: "load" }, T + "x"); ok("tampered token rejected", r.status === 401, r);
  r = await call(studio, { action: "load" }, T); ok("empty load", r.status === 200 && r.body.revs.clients === 0 && r.body.settings === null, r);
  r = await call(cms, { action: "load" }, T); ok("website content gives a clear message without GITHUB_TOKEN", r.status === 503 && r.body.needsGithub, r);

  r = await call(studio, { action: "save", ops: [{ c: "clients", op: "set", item: { id: "cl_alpha1", name: "Mr. Rahim", email: "r@example.com", stage: "enquiry" } }, { c: "tasks", op: "set", item: { id: "tk_one1", title: "Call client", status: "todo" } }] }, T);
  ok("save two collections", r.status === 200 && r.body.revs.clients === 1 && r.body.revs.tasks === 1, r);
  r = await call(studio, { action: "load", since: { clients: 1, tasks: 0 } }, T);
  ok("load honours 'since' (unchanged collection omitted)", !("clients" in r.body.collections) && r.body.collections.tasks.length === 1, r.body);
  r = await call(studio, { action: "save", ops: [{ c: "clients", op: "set", item: { id: "cl_alpha1", name: "Mr. Rahim K", email: "r@example.com", stage: "intro" } }] }, T);
  r = await call(studio, { action: "load" }, T); const c = r.body.collections.clients[0];
  ok("upsert keeps createdAt and updates fields", c.name === "Mr. Rahim K" && c.stage === "intro" && c.createdAt && c.updatedAt, c);

  // concurrency: 12 parallel writes to the same collection must all land
  await Promise.all(Array.from({ length: 12 }, (_, i) => call(studio, { action: "save", ops: [{ c: "tasks", op: "set", item: { id: "tk_par" + String(i).padStart(2, "0"), title: "Parallel " + i, status: "todo" } }] }, T)));
  r = await call(studio, { action: "load" }, T);
  ok("12 simultaneous saves all persisted (no lost updates)", r.body.collections.tasks.length === 13, r.body.collections.tasks.length);

  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "del", id: "tk_one1" }] }, T); r = await call(studio, { action: "load" }, T);
  ok("delete works", !r.body.collections.tasks.some((t) => t.id === "tk_one1"), r.body.collections.tasks.length);

  r = await call(studio, { action: "save", ops: [{ c: "briefs", op: "set", item: { id: "cl_alpha1" } }] }, T); ok("briefs are not writable from the admin API", r.status === 400, r);
  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "set", item: { id: "../etc", title: "x" } }] }, T); ok("bad ids rejected", r.status === 400, r);
  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "set", item: { id: "tk_big01", title: "x".repeat(30000) } }] }, T); ok("oversized item rejected", r.status === 400, r);
  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "set", item: { id: "tk_proto", title: "p", "__proto__": { polluted: 1 }, $x: 1 } }] }, T); r = await call(studio, { action: "load" }, T);
  ok("unsafe keys stripped", !("$x" in r.body.collections.tasks.find((t) => t.id === "tk_proto")) && ({}).polluted === undefined, 0);

  r = await call(studio, { action: "save", ops: [{ c: "settings", op: "set", value: { team: [{ id: "tm_a1b2", name: "Hisham" }] } }] }, T);
  r = await call(studio, { action: "load" }, T); ok("settings round trip", r.body.settings.team[0].name === "Hisham" && r.body.revs.settings === 1, r.body);

  // field-level merge: two devices edit DIFFERENT fields of the same task from the same starting point
  await call(studio, { action: "save", ops: [{ c: "tasks", op: "set", item: { id: "tk_merge1", title: "Shared task", status: "todo", due: "" } }] }, T);
  const patch = (id, fields, item) => call(studio, { action: "save", ops: [{ c: "tasks", op: "patch", id, fields, item }] }, T);
  await patch("tk_merge1", { due: "2026-12-01" }, { id: "tk_merge1", title: "Shared task", status: "todo", due: "2026-12-01" });
  r = await patch("tk_merge1", { status: "done" }, { id: "tk_merge1", title: "Shared task", status: "done", due: "" }); // stale copy: due is still ""
  const m = r.body.merged && r.body.merged.tasks && r.body.merged.tasks[0];
  ok("a stale device's edit keeps the other device's change (field-level merge)", r.status === 200 && m.status === "done" && m.due === "2026-12-01", r.body);
  r = await call(studio, { action: "load" }, T); const merged = r.body.collections.tasks.find((t) => t.id === "tk_merge1");
  ok("both edits are persisted", merged.status === "done" && merged.due === "2026-12-01" && merged.title === "Shared task", merged);
  await patch("tk_merge1", { due: null }, { id: "tk_merge1", title: "Shared task", status: "done" }); r = await call(studio, { action: "load" }, T);
  ok("clearing a field removes it", !("due" in r.body.collections.tasks.find((t) => t.id === "tk_merge1")));
  r = await patch("tk_gone01", { status: "done" }, { id: "tk_gone01", title: "Deleted elsewhere", status: "done" }); r = await call(studio, { action: "load" }, T);
  ok("an edit to a record deleted elsewhere recreates it instead of losing the edit", r.body.collections.tasks.some((t) => t.id === "tk_gone01"));
  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "patch", id: "tk_merge1", fields: ["x"], item: { id: "tk_merge1", title: "t" } }] }, T); ok("patch with non-object fields rejected", r.status === 400, r);
  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "patch", id: "tk_merge1", fields: { a: 1 }, item: { id: "tk_other1", title: "t" } }] }, T); ok("patch whose id doesn't match its item rejected", r.status === 400, r);
  r = await patch("tk_merge1", { notes: "x".repeat(30000) }, { id: "tk_merge1", title: "Shared task" }); ok("merge that would exceed the item size limit is a 400 (not retried forever)", r.status === 400, r);
  r = await call(studio, { action: "save", ops: [{ c: "tasks", op: "patch", id: "tk_merge1", fields: { id: "tk_hijack", createdAt: "1999", status: "todo" }, item: { id: "tk_merge1", title: "Shared task" } }] }, T); r = await call(studio, { action: "load" }, T);
  const kept = r.body.collections.tasks.find((t) => t.id === "tk_merge1");
  ok("patches can't change a record's id or creation date", Boolean(kept) && kept.createdAt !== "1999" && !r.body.collections.tasks.some((t) => t.id === "tk_hijack"), kept);

  // photos
  const jpg = Buffer.from("fakejpegdata").toString("base64");
  r = await call(studio, { action: "photo.put", id: "ph_abc123", type: "image/jpeg", data: jpg }, T); ok("photo upload", r.status === 200, r);
  r = await call(studio, { action: "photo.get", id: "ph_abc123" }, T); ok("photo fetch", r.body.data === jpg, r);
  r = await call(studio, { action: "photo.put", id: "ph_abc124", type: "image/svg+xml", data: jpg }, T); ok("svg photo rejected", r.status === 400, r);
  r = await call(studio, { action: "photo.get", id: "ph_abc123" }); ok("photo needs auth", r.status === 401, r);

  // onboarding link flow
  r = await call(studio, { action: "token.create", clientId: "cl_alpha1" }, T); const tok = r.body.token; ok("token created", /^[a-f0-9]{32}$/.test(tok), r);
  r = await call(onboard, null, null, "GET", { t: "0".repeat(32) }); ok("unknown token -> 404", r.status === 404, r);
  r = await call(onboard, null, null, "GET", { t: "../../x" }); ok("malformed token -> 404", r.status === 404, r);
  r = await call(onboard, null, null, "GET", { t: tok }); ok("valid token returns only client's own prefill", r.status === 200 && r.body.firstName === "Mr." && r.body.prefill.email === "r@example.com" && !JSON.stringify(r.body).includes("tk_par"), r.body);
  r = await call(onboard, { t: tok, data: { name: "Mr. Rahim K", email: "not-an-email" } }, null); ok("invalid email rejected", r.status === 400, r);
  r = await call(onboard, { t: tok, data: { name: "Rahim", email: "r@example.com", budget: "50L-1Cr", scope: ["Architecture", "Hacking"], evil: "x", mustHaves: "<script>alert(1)</script>" } }, null);
  ok("brief submitted", r.status === 200 && r.body.submittedAt, r);
  r = await call(onboard, { t: tok, website: "http://spam", data: { name: "Bot", email: "b@example.com" } }, null); ok("honeypot silently ignored", r.status === 200 && !r.body.submittedAt, r);
  r = await call(studio, { action: "load" }, T); const b = r.body.collections.briefs[0];
  ok("brief stored; unknown fields and invalid scope dropped", b.id === "cl_alpha1" && b.version === 1 && b.data.scope.length === 1 && !b.data.evil && b.data.name === "Rahim", b);
  r = await call(onboard, { t: tok, data: { name: "Rahim", email: "r@example.com", plotSize: "2400" } }, null); r = await call(studio, { action: "load" }, T);
  ok("resubmission updates same brief (version 2)", r.body.collections.briefs.length === 1 && r.body.collections.briefs[0].version === 2, r.body.collections.briefs);
  r = await call(onboard, { t: tok, data: { name: "x".repeat(30000), email: "a@b.co" } }, null); ok("oversized submission rejected", r.status === 413, r);
  r = await call(studio, { action: "brief.del", clientId: "cl_alpha1" }, T); r = await call(studio, { action: "load" }, T);
  ok("brief.del removes a client's submitted brief", r.body.collections.briefs.length === 0, r.body.collections.briefs);
  r = await call(studio, { action: "brief.del", clientId: "cl_alpha1" }); ok("brief.del needs auth", r.status === 401, r);
  r = await call(studio, { action: "token.revoke", clientId: "cl_alpha1" }, T); r = await call(onboard, null, null, "GET", { t: tok }); ok("revoked link stops working", r.status === 404, r);

  // backup / restore
  r = await call(studio, { action: "export" }, T); const dump = r.body; ok("export has data", dump.collections.clients.length === 1 && dump.collections.tasks.length > 5, Object.keys(dump.collections));
  await call(studio, { action: "save", ops: [{ c: "clients", op: "del", id: "cl_alpha1" }] }, T);
  r = await call(studio, { action: "import", data: dump }, T); r = await call(studio, { action: "load" }, T); ok("import restores deleted data", r.body.collections.clients.length === 1, r.body.collections.clients);
  r = await call(studio, { action: "import", data: { version: 1, collections: { tasks: [{ nope: 1 }] } } }, T); ok("bad backup rejected", r.status === 400, r);
  r = await call(studio, { action: "rebuild" }, T); ok("rebuild explains missing hook", r.status === 400 && r.body.setup, r);
  r = await call(studio, null, null, "GET"); ok("status endpoint", r.body.configured === true, r);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
