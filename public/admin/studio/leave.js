// Leave rules as pure functions, ported from the ALIVE console (leave-policy.ts).
// Days are calendar days written YYYY-MM-DD. Casual and sick leave have yearly
// allowances; earned leave accrues 1 day for every N days worked and carries
// forward up to a cap; employee choice days are a small fixed number.
// The policy numbers live in Settings and default to the ALIVE policy.

export const LEAVE_TYPES = [
  { id: "casual", label: "Casual leave" },
  { id: "sick", label: "Sick leave" },
  { id: "earned", label: "Earned leave" },
  { id: "choice", label: "Employee choice day" },
  { id: "lop", label: "Loss of pay" },
];
export const REQUESTABLE = ["casual", "sick", "earned", "choice"];
export const DEFAULT_POLICY = { casualPerYear: 8, casualMaxRun: 3, sickPerYear: 8, sickCertificateOver: 2, earnedPerDaysWorked: 20, earnedMaxPerYear: 12, earnedCarryCap: 30, choicePerYear: 2, workingSaturdays: [2, 4] };

const DAY = 86400000;
const utc = (k) => Date.parse(`${k}T00:00:00Z`);
export const addDay = (k, n) => new Date(utc(k) + n * DAY).toISOString().slice(0, 10);
export const isDayKey = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(utc(v)) && new Date(utc(v)).toISOString().startsWith(v);
const weekday = (k) => new Date(utc(k)).getUTCDay();

export const closedDays = (holidays) => new Set(holidays.filter((h) => h.kind !== "flexible" && h.date).map((h) => h.date));

export const isWorkingDay = (k, closed, policy = DEFAULT_POLICY) => {
  const w = weekday(k);
  if (w === 0 || closed.has(k)) return false;
  if (w !== 6) return true;
  return (policy.workingSaturdays || [2, 4]).includes(Math.ceil(Number(k.slice(8, 10)) / 7));
};

export const workingDays = (from, to, closed, policy) => {
  const out = [];
  for (let k = from; k <= to; k = addDay(k, 1)) if (isWorkingDay(k, closed, policy)) out.push(k);
  return out;
};

const step = (k, dir, closed, policy) => {
  let d = addDay(k, dir);
  for (let i = 0; i < 30 && !isWorkingDay(d, closed, policy); i++) d = addDay(d, dir);
  return d;
};
const live = (r) => r.status === "approved" || r.status === "pending";
const daysIn = (r, year, closed, policy) => {
  const a = r.start > `${year}-01-01` ? r.start : `${year}-01-01`;
  const b = r.end < `${year}-12-31` ? r.end : `${year}-12-31`;
  return a > b ? 0 : workingDays(a, b, closed, policy).length;
};

export const balances = (year, ctx, policy = DEFAULT_POLICY) => {
  const closed = closedDays(ctx.holidays);
  const sum = (type, y, status) => ctx.requests.filter((r) => r.type === type && r.status === status).reduce((n, r) => n + daysIn(r, y, closed, policy), 0);
  const worked = (y) => {
    const from = ctx.joinedOn > `${y}-01-01` ? ctx.joinedOn : `${y}-01-01`;
    const to = ctx.today < `${y}-12-31` ? ctx.today : `${y}-12-31`;
    if (from > to) return 0;
    const off = ctx.requests.filter((r) => r.status === "approved").reduce((n, r) => {
      const a = r.start > from ? r.start : from, b = r.end < to ? r.end : to;
      return a > b ? n : n + workingDays(a, b, closed, policy).length;
    }, 0);
    return Math.max(0, workingDays(from, to, closed, policy).length - off);
  };
  const accrued = (y) => Math.min(policy.earnedMaxPerYear, Math.floor(worked(y) / policy.earnedPerDaysWorked));
  let carried = 0;
  for (let y = Number(ctx.joinedOn.slice(0, 4)); y < year; y++) carried = Math.min(policy.earnedCarryCap, Math.max(0, carried + accrued(y) - sum("earned", y, "approved")));
  const used = sum("earned", year, "approved"), pending = sum("earned", year, "pending"), acc = accrued(year);
  return {
    year,
    casual: { used: sum("casual", year, "approved"), pending: sum("casual", year, "pending"), total: policy.casualPerYear },
    sick: { used: sum("sick", year, "approved"), pending: sum("sick", year, "pending"), total: policy.sickPerYear },
    choice: { used: sum("choice", year, "approved"), pending: sum("choice", year, "pending"), total: policy.choicePerYear },
    earned: { carried, accrued: acc, used, pending, available: Math.max(0, carried + acc - used - pending), daysWorked: worked(year) },
    lop: sum("lop", year, "approved"),
  };
};

const runLength = (type, start, end, others, closed, policy) => {
  const taken = new Set(others.filter((r) => r.type === type && live(r)).flatMap((r) => workingDays(r.start, r.end, closed, policy)));
  let n = workingDays(start, end, closed, policy).length;
  for (let d = step(start, -1, closed, policy); taken.has(d); d = step(d, -1, closed, policy)) n++;
  for (let d = step(end, 1, closed, policy); taken.has(d); d = step(d, 1, closed, policy)) n++;
  return n;
};

export const needsCertificate = (r, others, holidays, policy = DEFAULT_POLICY) =>
  r.type === "sick" && runLength("sick", r.start, r.end, others.filter((o) => o.id !== r.id), closedDays(holidays), policy) > policy.sickCertificateOver;

/** Whether a person may ask for this leave. */
export const checkRequest = (r, ctx, policy = DEFAULT_POLICY) => {
  if (!REQUESTABLE.includes(r.type)) return { ok: false, error: "Loss of pay is recorded by the approver, not requested." };
  if (!isDayKey(r.start) || !isDayKey(r.end)) return { ok: false, error: "Pick the first and last day." };
  if (r.end < r.start) return { ok: false, error: "The last day is before the first." };
  if (r.start.slice(0, 4) !== r.end.slice(0, 4)) return { ok: false, error: "Split leave across 31 December into two requests (balances are per calendar year)." };
  const closed = closedDays(ctx.holidays);
  const days = workingDays(r.start, r.end, closed, policy).length;
  if (!days) return { ok: false, error: "Those days are all non-working days, so no leave is needed." };
  if (r.start < ctx.today) return { ok: false, error: "Leave can't start in the past. The approver records an absence already taken." };
  if (r.start === ctx.today && !r.emergency) return { ok: false, error: "Leave starting today is an emergency absence: tick Emergency." };
  if (ctx.requests.some((o) => live(o) && o.start <= r.end && o.end >= r.start)) return { ok: false, error: "There is already leave on some of those days." };
  const year = Number(r.start.slice(0, 4));
  const b = balances(year, ctx, policy);
  if (r.type === "casual") {
    if (runLength("casual", r.start, r.end, ctx.requests, closed, policy) > policy.casualMaxRun) return { ok: false, error: `Casual leave is at most ${policy.casualMaxRun} consecutive days, including leave next to it.` };
    const left = b.casual.total - b.casual.used - b.casual.pending;
    if (days > left) return { ok: false, error: `Only ${left} casual day${left === 1 ? "" : "s"} left in ${year}.` };
  }
  if (r.type === "sick") {
    const left = b.sick.total - b.sick.used - b.sick.pending;
    if (days > left) return { ok: false, error: `Only ${left} sick day${left === 1 ? "" : "s"} left in ${year}.` };
  }
  if (r.type === "earned" && days > b.earned.available) return { ok: false, error: `Only ${b.earned.available} earned day${b.earned.available === 1 ? "" : "s"} available (1 per ${policy.earnedPerDaysWorked} days worked).` };
  if (r.type === "choice") {
    if (days !== 1 || r.start !== r.end) return { ok: false, error: "An employee choice day is a single day." };
    if (b.choice.total - b.choice.used - b.choice.pending <= 0) return { ok: false, error: `Both choice days for ${year} are already taken.` };
  }
  return { ok: true, days, needsCertificate: needsCertificate({ ...r, status: "pending" }, ctx.requests, ctx.holidays, policy) };
};
