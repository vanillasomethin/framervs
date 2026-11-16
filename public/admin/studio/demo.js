// Sample data so a new, empty studio can be explored. Every item is tagged
// `demo: true`, and "Remove sample data" deletes exactly those items.

import { uid } from "../core.js";
import { data, put, del, addDays, today, setMe, meId, saveSettings, DEFAULT_CHECKLIST } from "./data.js";

const DEMO_COLLECTIONS = ["clients", "projects", "tasks", "logs", "snags", "milestones", "activity"];

export const hasDemoData = () => DEMO_COLLECTIONS.some((c) => data[c].some((i) => i.demo)) || (data.settings.team || []).some((m) => m.demo);

export const seedDemo = () => {
  const d = (n) => addDays(today(), n);
  const at = (n) => new Date(Date.now() + n * 86400000).toISOString();
  const add = (collection, item) => put(collection, { demo: true, ...item });

  // Team
  const tm = { hisham: uid("tm_"), zeba: uid("tm_"), imran: uid("tm_"), fathima: uid("tm_") };
  if (!(data.settings.team || []).length) {
    saveSettings({
      team: [
        { id: tm.hisham, name: "Hisham Khalid", role: "Principal Architect", demo: true },
        { id: tm.zeba, name: "Zeba Ali Khan", role: "Principal Architect", demo: true },
        { id: tm.imran, name: "Imran S", role: "Site Engineer", demo: true },
        { id: tm.fathima, name: "Fathima R", role: "Interior Designer", demo: true },
      ],
      onboardingChecklist: data.settings.onboardingChecklist && data.settings.onboardingChecklist.length ? data.settings.onboardingChecklist : DEFAULT_CHECKLIST,
    });
    if (!meId()) setMe(tm.hisham);
  } else {
    const first = data.settings.team.map((m) => m.id);
    [tm.hisham, tm.zeba, tm.imran, tm.fathima] = [first[0], first[1] || first[0], first[2] || first[0], first[3] || first[0]];
  }

  const checks = (...ids) => Object.fromEntries(ids.map((i) => [i, true]));

  // Clients (the pipeline)
  const cl = { rahim: uid("cl_"), shabana: uid("cl_"), sorbete: uid("cl_"), nair: uid("cl_"), anwar: uid("cl_"), mak: uid("cl_") };
  add("clients", { id: cl.rahim, name: "Mr. Rahim K", email: "rahim@example.com", phone: "+91 98450 12345", location: "Kasaragod", source: "Referral", projectType: "Residential", owner: tm.hisham, stage: "active", stageAt: at(-60), checks: checks("ack", "intro_booked", "intro_held", "brief_sent", "site_visit", "proposal_sent", "proposal_ok", "agreement_signed", "invoice", "advance_paid", "kickoff_held", "folder", "project_created"), notes: "Wants a courtyard around the existing mango tree." });
  add("clients", { id: cl.shabana, name: "Mrs. Shabana", email: "shabana@example.com", phone: "+91 99000 22110", location: "Mangalore", source: "Instagram", projectType: "Residential - Interiors", owner: tm.fathima, stage: "agreement", stageAt: at(-4), checks: checks("ack", "intro_booked", "intro_held", "brief_sent", "site_visit", "proposal_sent", "proposal_ok") });
  add("clients", { id: cl.sorbete, name: "Sorbete Foods", company: "Sorbete", email: "hello@sorbete.example", phone: "+91 97400 55667", location: "Kochi", source: "Website", projectType: "Commercial - Cafe", owner: tm.zeba, stage: "brief", stageAt: at(-9), checks: checks("ack", "intro_booked", "intro_held", "brief_sent") });
  add("clients", { id: cl.mak, name: "MAK Builders", company: "MAK Builders", email: "projects@mak.example", location: "Mangalore", source: "Builder / contractor", projectType: "Residential - Apartment", owner: tm.hisham, stage: "proposal", stageAt: at(-2), checks: checks("ack", "intro_booked", "intro_held", "brief_sent", "site_visit", "proposal_sent") });
  add("clients", { id: cl.nair, name: "Mr. Nair", email: "nair@example.com", phone: "+91 94470 33221", location: "Thrissur", source: "Estimator", projectType: "Residential", owner: tm.zeba, stage: "enquiry", stageAt: at(-1), checks: checks("ack") });
  add("clients", { id: cl.anwar, name: "Dr. Anwar", phone: "+91 98860 77123", location: "Udupi", source: "Instagram", projectType: "Residential", owner: tm.hisham, stage: "intro", stageAt: at(-12), checks: checks("ack", "intro_booked") });

  // Projects
  const pj = { laterite: uid("pj_"), mak: uid("pj_"), nord: uid("pj_"), coco: uid("pj_"), bnb: uid("pj_"), flute: uid("pj_") };
  add("projects", { id: pj.laterite, code: "VS-26-001", name: "Laterite Courtyard House", clientId: cl.rahim, type: "Residential", location: "Kasaragod", stage: "construction", health: "at_risk", start: d(-120), due: d(75), lead: tm.hisham, area: "3,200 sq ft", fee: 1200000, budget: 14000000, summary: "A courtyard home built around an existing mango tree, in exposed laterite.", links: [{ id: uid("ln_"), label: "Project folder", url: "https://drive.google.com" }] });
  add("projects", { id: pj.mak, code: "VS-26-002", name: "MAK Park Square", clientId: cl.mak, type: "Residential - Apartment", location: "Mangalore", stage: "design", health: "on_track", start: d(-45), due: d(160), lead: tm.zeba, area: "42,000 sq ft", fee: 3800000, budget: 120000000, summary: "G+8 apartment block with shared terrace gardens.", links: [] });
  add("projects", { id: pj.nord, code: "VS-26-003", name: "Nord Terra House", clientId: "", type: "Residential", location: "Mangalore", stage: "handover", health: "on_track", start: d(-300), due: d(14), lead: tm.imran, area: "2,800 sq ft", fee: 900000, budget: 11000000, summary: "Compact family home with a double-height living room.", links: [] });
  add("projects", { id: pj.coco, code: "VS-26-004", name: "Coco Meltdown Café", clientId: "", type: "Commercial - Cafe", location: "Mangalore", stage: "construction", health: "delayed", start: d(-90), due: d(-6), lead: tm.imran, area: "1,100 sq ft", fee: 350000, budget: 4200000, summary: "Dessert café fit-out with a copper-clad counter.", links: [] });
  add("projects", { id: pj.bnb, code: "VS-26-005", name: "BNB House Interiors", clientId: cl.shabana, type: "Residential - Interiors", location: "Mangalore", stage: "concept", health: "on_track", start: d(-20), due: d(120), lead: tm.fathima, area: "2,400 sq ft", fee: 600000, budget: 5500000, summary: "Warm, material-led interiors for a 4BHK.", links: [] });
  add("projects", { id: pj.flute, code: "VS-26-006", name: "Flute-Case Office", clientId: "", type: "Commercial - Office", location: "Bengaluru", stage: "approvals", health: "on_hold", start: d(-70), due: d(200), lead: tm.zeba, area: "6,500 sq ft", fee: 1500000, budget: 18000000, summary: "Open-plan office; on hold pending lease sign-off.", links: [] });

  // Tasks
  const task = (projectId, title, status, priority, assignee, due, extra = {}) =>
    add("tasks", { id: uid("tk_"), projectId, title, status, priority, assignee, due: due === null ? "" : d(due), labels: [], checklist: [], order: Date.now() + Math.random() * 1000, doneAt: status === "done" ? at(-1) : null, ...extra });
  task(pj.laterite, "Confirm lintel level with contractor", "doing", "high", tm.imran, -2, { checklist: [{ id: uid("ck_"), text: "Check drawings", done: true }, { id: uid("ck_"), text: "Site measurement", done: false }] });
  task(pj.laterite, "Approve laterite sample batch", "todo", "urgent", tm.hisham, 0);
  task(pj.laterite, "Courtyard planting plan", "doing", "med", tm.zeba, 5);
  task(pj.laterite, "Electrical layout rev 3", "review", "med", tm.zeba, 3);
  task(pj.laterite, "Order main door timber", "todo", "med", tm.imran, 9);
  task(pj.laterite, "Foundation RCC drawings issued", "done", "high", tm.hisham, -30);
  task(pj.mak, "Basement parking layout", "doing", "high", tm.zeba, 2);
  task(pj.mak, "Façade options presentation", "todo", "med", tm.hisham, 8);
  task(pj.mak, "Submit plans to MCC", "todo", "high", tm.zeba, 15);
  task(pj.mak, "Structural coordination meeting", "done", "med", tm.zeba, -6);
  task(pj.nord, "Snag walk-through with client", "doing", "high", tm.imran, 1);
  task(pj.nord, "Landscape handover pack", "todo", "low", tm.fathima, 7);
  task(pj.nord, "Final billing statement", "todo", "med", tm.hisham, 10);
  task(pj.coco, "Counter fabrication drawings", "doing", "urgent", tm.fathima, -3);
  task(pj.coco, "Follow up on copper delivery", "todo", "urgent", tm.imran, -1);
  task(pj.coco, "Lighting fixtures sign-off", "review", "med", tm.fathima, 4);
  task(pj.bnb, "Moodboards v2", "doing", "med", tm.fathima, 3);
  task(pj.bnb, "Kitchen layout options", "todo", "med", tm.fathima, 6);
  task(pj.bnb, "Client presentation deck", "done", "med", tm.fathima, -5);
  task(pj.flute, "Reply to landlord on drawings", "todo", "low", tm.zeba, 12);
  task("", "Renew architecture council registration", "todo", "med", tm.hisham, 20);
  task("", "Update portfolio with Nord Terra photos", "todo", "low", tm.fathima, 14);
  task(pj.nord, "Site photography booking", "done", "low", tm.fathima, -2);
  task(pj.mak, "Fee proposal revision", "done", "med", tm.hisham, -9);

  // Milestones
  const ms = (projectId, title, date, done = false) => add("milestones", { id: uid("ms_"), projectId, title, date: d(date), done });
  ms(pj.laterite, "Plinth beam cast", -35, true);
  ms(pj.laterite, "Ground-floor slab", 6);
  ms(pj.laterite, "Roof slab", 38);
  ms(pj.laterite, "Handover", 75);
  ms(pj.mak, "Concept approval", -12, true);
  ms(pj.mak, "Municipal submission", 15);
  ms(pj.nord, "Painting complete", -3, true);
  ms(pj.nord, "Client handover", 14);
  ms(pj.coco, "Soft opening", -6);
  ms(pj.bnb, "Concept sign-off", 25);

  // Site logs and snags
  const log = (projectId, date, status, author, extra) => add("logs", { id: uid("lg_"), projectId, date: d(date), status, author, photos: [], ...extra });
  log(pj.laterite, -3, "done", tm.imran, { weather: "Light rain", workers: 14, summary: "Ground-floor column shuttering completed. Laterite masonry reached sill level on the north wall.", issues: "Rain delayed the pour by a day. Contractor to cover stacked bricks." });
  log(pj.laterite, -10, "done", tm.hisham, { weather: "Clear", workers: 18, summary: "Reviewed courtyard setting-out with the client. Mango tree protection fence installed." });
  log(pj.laterite, 4, "planned", tm.hisham, { summary: "Slab pour inspection and rebar check." });
  log(pj.coco, -21, "done", tm.imran, { weather: "Clear", workers: 8, summary: "False ceiling framing under way.", issues: "Copper sheet delivery delayed by two weeks." });
  log(pj.nord, -5, "done", tm.imran, { weather: "Cloudy", workers: 6, summary: "Painting touch-ups and fixture installation." });
  log(pj.nord, 1, "planned", tm.imran, { summary: "Client snag walk-through." });
  const snag = (projectId, title, area, priority, status, assignee, due) =>
    add("snags", { id: uid("sn_"), projectId, title, area, priority, status, assignee, due: due === null ? "" : d(due), photos: [] });
  snag(pj.nord, "Tile lippage in master bath", "Level 1, master bath", "high", "open", tm.imran, 2);
  snag(pj.nord, "Paint patches near staircase", "Staircase", "low", "progress", tm.imran, 3);
  snag(pj.nord, "Window latch loose", "Living room", "med", "open", tm.imran, 5);
  snag(pj.nord, "Clean grout haze", "Kitchen", "low", "resolved", tm.imran, -1);
  snag(pj.coco, "Counter edge misaligned", "Service counter", "urgent", "open", tm.fathima, -2);
  snag(pj.coco, "Switch plates not flush", "Seating area", "low", "open", tm.imran, 6);
  snag(pj.laterite, "Honeycombing on column C4", "Ground floor", "high", "progress", tm.imran, 4);
  snag(pj.laterite, "Sleeve missing for AC line", "Bedroom 2", "med", "open", tm.imran, 7);

  // Activity feed
  const act = (who, text, hours, ref) => add("activity", { id: uid("ac_"), at: new Date(Date.now() - hours * 3600000).toISOString(), who, text, ref });
  act("Imran S", "logged a site visit at Laterite Courtyard House", 20, { type: "log", projectId: pj.laterite });
  act("Hisham Khalid", "moved Mrs. Shabana to Agreement", 80, { type: "client", id: cl.shabana });
  act("Zeba Ali Khan", "completed “Structural coordination meeting”", 30, { type: "task", projectId: pj.mak });
  act("Fathima R", "added task “Counter fabrication drawings”", 50, { type: "task", projectId: pj.coco });
  act("Imran S", "raised snag “Counter edge misaligned”", 28, { type: "snag", projectId: pj.coco });
  act("Hisham Khalid", "moved Nord Terra House to Handover", 140, { type: "project", projectId: pj.nord });
  act("Zeba Ali Khan", "added client Mr. Nair", 22, { type: "client", id: cl.nair });
};

export const clearDemo = () => {
  for (const c of DEMO_COLLECTIONS) data[c].filter((i) => i.demo).forEach((i) => del(c, i.id));
  const team = (data.settings.team || []).filter((m) => !m.demo);
  if (team.length !== (data.settings.team || []).length) saveSettings({ team });
};
