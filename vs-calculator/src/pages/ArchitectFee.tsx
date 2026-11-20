import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, FileText, Info, Printer } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedText from "@/components/AnimatedText";

type FeeModel = "percentage" | "perSqft" | "fixed";
type ServiceLevel = "drawings" | "design" | "comprehensive";

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(Number.isFinite(value) ? value : 0);

const serviceBands: Record<ServiceLevel, { label: string; range: string; low: number; high: number; summary: string }> = {
  drawings: { label: "Basic drawings", range: "₹15–₹40 / sq ft", low: 15, high: 40, summary: "Limited drawing package; confirm exactly which plans, elevations and details are supplied." },
  design: { label: "Complete design", range: "₹40–₹80 / sq ft", low: 40, high: 80, summary: "Design development and documentation; engineering, approvals and site services depend on the agreement." },
  comprehensive: { label: "Comprehensive services", range: "₹80–₹150+ / sq ft", low: 80, high: 150, summary: "A broader appointment with defined periodic construction-stage services—not continuous site supervision by default." },
};

const milestones = [
  ["Appointment and briefing", 10],
  ["Concept design", 15],
  ["Design development and freeze", 15],
  ["Statutory submission package", 10],
  ["Working drawings and coordination", 25],
  ["Construction-stage services", 20],
  ["Completion and handover", 5],
] as const;

export default function ArchitectFee() {
  const [model, setModel] = useState<FeeModel>("perSqft");
  const [service, setService] = useState<ServiceLevel>("design");
  const [area, setArea] = useState("3000");
  const [constructionCost, setConstructionCost] = useState("7200000");
  const [rate, setRate] = useState("60");
  const [percentage, setPercentage] = useState("6");
  const [fixedFee, setFixedFee] = useState("180000");
  const [useCoaScale, setUseCoaScale] = useState(false);
  const [documentation, setDocumentation] = useState(true);
  const [addGst, setAddGst] = useState(false);
  const [gstRate, setGstRate] = useState("18");

  const result = useMemo(() => {
    const a = Math.max(0, Number(area) || 0);
    const cost = Math.max(0, Number(constructionCost) || 0);
    const professionalFee = useCoaScale
      ? cost * 0.075
      : model === "percentage"
        ? cost * Math.max(0, Number(percentage) || 0) / 100
        : model === "perSqft"
          ? a * Math.max(0, Number(rate) || 0)
          : Math.max(0, Number(fixedFee) || 0);
    const documentationFee = useCoaScale && documentation ? professionalFee * 0.10 : 0;
    const subtotal = professionalFee + documentationFee;
    const tax = addGst ? subtotal * Math.max(0, Number(gstRate) || 0) / 100 : 0;
    return { professionalFee, documentationFee, subtotal, tax, total: subtotal + tax };
  }, [area, constructionCost, model, percentage, rate, fixedFee, useCoaScale, documentation, addGst, gstRate]);

  const fmt = (n: number) => money(n);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-vs">← Estimator home</Link>
        <header className="mx-auto mb-10 mt-6 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.22em] text-vs">Homeowner fee guide · 2026</p>
          <AnimatedText text="Architect fee calculator" className="text-3xl font-display md:text-5xl" />
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Compare a percentage, per-square-foot or fixed-fee appointment. See the professional fee separately from documentation charges and GST.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border bg-card p-5 md:p-7">
            <div className="mb-6 flex items-center gap-2"><Calculator className="size-5 text-vs" /><h2 className="text-xl font-semibold">Your project inputs</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">Built-up area (sq ft)<input type="number" min="0" value={area} onChange={e=>setArea(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label>
              <label className="text-sm">Estimated cost of assigned works (₹)<input type="number" min="0" value={constructionCost} onChange={e=>setConstructionCost(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /><span className="mt-1 block text-xs text-muted-foreground">Exclude land. Use the cost basis stated in the proposed appointment.</span></label>
            </div>

            <div className="mt-7">
              <h3 className="mb-3 text-sm font-semibold">Choose a fee model</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {([["perSqft","Per sq ft"],["percentage","Percentage"],["fixed","Fixed fee"]] as const).map(([v,label])=><button key={v} onClick={()=>{setModel(v);setUseCoaScale(false)}} className={`rounded-lg border px-3 py-3 text-sm font-medium ${model===v&&!useCoaScale?"border-vs bg-vs/5 text-vs":"hover:border-vs/50"}`}>{label}</button>)}
              </div>
              {model==="perSqft"&&!useCoaScale&&<label className="mt-4 block text-sm">Architectural fee rate (₹ / sq ft)<input type="number" min="0" value={rate} onChange={e=>setRate(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /><span className="mt-1 block text-xs text-muted-foreground">Indicative guide: drawings ₹15–₹40; design and documentation ₹40–₹80; comprehensive services ₹80–₹150+ per sq ft.</span></label>}
              {model==="percentage"&&!useCoaScale&&<label className="mt-4 block text-sm">Agreed percentage (%)<input type="number" min="0" max="100" step=".1" value={percentage} onChange={e=>setPercentage(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /><span className="mt-1 block text-xs text-muted-foreground">Broad indicative market guide: 3%–10%+. Not an official rate or city-wide average.</span></label>}
              {model==="fixed"&&!useCoaScale&&<label className="mt-4 block text-sm">Agreed lump-sum professional fee (₹)<input type="number" min="0" value={fixedFee} onChange={e=>setFixedFee(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label>}
            </div>

            <div className="mt-7 rounded-xl border border-dashed p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={useCoaScale} onChange={e=>setUseCoaScale(e.target.checked)} className="mt-1 accent-vs" /><span><strong>Compare with COA-published individual-house scale (7.5%)</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">An official published scale of charges for comprehensive architectural services for an individual house—not a universally enforced statutory minimum or mandatory floor for every appointment.</span></span></label>
              {useCoaScale&&<label className="mt-4 flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={documentation} onChange={e=>setDocumentation(e.target.checked)} className="mt-1 accent-vs" /><span><strong>Include 10% documentation and communication charge</strong><span className="mt-1 block text-xs text-muted-foreground">Apply only where the engagement adopts or expressly incorporates that COA scale.</span></span></label>}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={addGst} onChange={e=>setAddGst(e.target.checked)} className="mt-1 accent-vs" /><span><strong>Add illustrative GST</strong><span className="block text-xs text-muted-foreground">Only where chargeable; verify supplier registration and tax treatment.</span></span></label>
              {addGst&&<label className="text-sm">GST rate (%)<input type="number" min="0" max="100" value={gstRate} onChange={e=>setGstRate(e.target.value)} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label>}
            </div>
          </section>

          <aside className="h-fit rounded-2xl bg-vs-dark p-5 text-white md:p-7">
            <p className="text-xs uppercase tracking-[.2em] text-white/60">Illustrative fee estimate</p>
            <p className="mt-3 text-3xl font-semibold md:text-4xl">{fmt(result.total)}</p>
            <p className="mt-1 text-xs text-white/60">Total based on the inputs above</p>
            <div className="my-6 space-y-3 border-y border-white/15 py-5 text-sm">
              <div className="flex justify-between gap-3"><span className="text-white/70">Professional fee</span><strong>{fmt(result.professionalFee)}</strong></div>
              {result.documentationFee>0&&<div className="flex justify-between gap-3"><span className="text-white/70">Documentation (10%)</span><strong>{fmt(result.documentationFee)}</strong></div>}
              <div className="flex justify-between gap-3"><span className="text-white/70">Fee subtotal</span><strong>{fmt(result.subtotal)}</strong></div>
              {addGst&&<div className="flex justify-between gap-3"><span className="text-white/70">Illustrative GST</span><strong>{fmt(result.tax)}</strong></div>}
            </div>
            <p className="text-xs leading-5 text-white/65">This is a comparison tool, not a fee quote. Final fees depend on the agreed scope, cost basis, deliverables, exclusions, revisions, schedule and appointment terms.</p>
            <button onClick={()=>window.print()} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-vs-dark"><Printer className="size-4"/> Print / save as PDF</button>
            <Link to="/contact/" className="mt-4 block text-sm text-white underline underline-offset-4">Discuss your project with the studio →</Link>
          </aside>
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-5 md:p-7">
            <h2 className="text-xl font-semibold">Indicative per-square-foot bands</h2>
            <div className="mt-5 space-y-4">
              {(Object.keys(serviceBands) as ServiceLevel[]).map(key=><button key={key} onClick={()=>{setService(key);setModel("perSqft");setUseCoaScale(false);setRate(String(serviceBands[key].low))}} className={`block w-full rounded-xl border p-4 text-left ${service===key?"border-vs bg-vs/5":"hover:border-vs/50"}`}><span className="flex items-center justify-between gap-3"><strong>{serviceBands[key].label}</strong><span className="text-sm font-semibold text-vs">{serviceBands[key].range}</span></span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{serviceBands[key].summary}</span></button>)}
            </div>
          </div>
          <div className="rounded-2xl border p-5 md:p-7">
            <h2 className="text-xl font-semibold">What changes the quote?</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>• Built-up area and the defined cost of assigned works.</li>
              <li>• Design complexity, number of options and revision limits.</li>
              <li>• Structural and MEP consultant scope and fees.</li>
              <li>• Approval drawings, submission coordination and statutory charges.</li>
              <li>• Number and type of scheduled construction-stage inspections.</li>
              <li>• Contractor coordination, BOQ, tender support and handover.</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border p-5 md:p-7">
          <h2 className="text-xl font-semibold">A sample payment schedule</h2>
          <p className="mt-2 text-sm text-muted-foreground">One suggested commercial schedule. It is not a mandatory COA schedule.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map(([label,pct],i)=><div key={label} className="rounded-xl bg-muted/50 p-4"><span className="text-xs text-muted-foreground">0{i+1}</span><strong className="mt-2 block text-2xl text-vs">{pct}%</strong><span className="mt-1 block text-sm">{label}</span></div>)}
          </div>
          <p className="mt-4 text-right text-sm font-semibold">Total · 100%</p>
        </section>

        <section className="mt-12 rounded-2xl border p-5 md:p-7">
          <div className="flex items-center gap-2"><FileText className="size-5 text-vs"/><h2 className="text-xl font-semibold">Before you compare quotations</h2></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["Deliverables and drawing list","Structural / MEP consultant responsibility","Approval scope and statutory fees","Revision rounds and change requests","Inspection count and written reports","Continuous site presence: included or excluded","BOQ, tender and contractor coordination","Taxes, reimbursables and exclusions","Completion records and handover"].map(item=><div key={item} className="rounded-lg bg-muted/50 p-3 text-sm">{item}</div>)}
          </div>
        </section>

        <div className="mt-10 flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0"/><p>Market bands shown here are indicative planning ranges, not official tariffs or a statistically representative survey. GST is not automatically added to every architect's quote. Construction contract rates are separate from architectural professional fees. Periodic inspection does not mean continuous day-to-day site supervision.</p></div>
        <p className="mt-6 text-center text-xs text-muted-foreground">For a homeowner-friendly explanation, read our <Link className="underline" to="/blog/architect-fees-india-2026/">architect fees guide</Link>.</p>
      </main>
    </div>
  );
}
