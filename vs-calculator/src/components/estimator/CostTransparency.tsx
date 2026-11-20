import { motion } from "framer-motion";
import { TrendingUp, Info, Gauge } from "lucide-react";
import { ProjectEstimate } from "@/types/estimator";

interface CostTransparencyProps { estimate: ProjectEstimate; }

const CATEGORY_LABELS: Record<string, { label: string; hint: string }> = {
  construction: { label: "Structure & shell", hint: "Foundation, framing, masonry and selected amenities" },
  core: { label: "MEP / core systems", hint: "Plumbing, electrical, HVAC and lift" },
  finishes: { label: "Finishes & envelope", hint: "Facade, waterproofing, flooring and ceilings" },
  interiors: { label: "Interiors & FF&E", hint: "Furniture, furnishings and appliances" },
  fees: { label: "Contingency allowance", hint: "5% planning allowance; professional fees and GST excluded" },
};

const CostTransparency = ({ estimate }: CostTransparencyProps) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
  const total = estimate.totalCost || 1;
  const drivers = Object.entries(estimate.categoryBreakdown)
    .map(([key, value]) => ({
      key, value: value as number, pct: ((value as number) / total) * 100,
      ...(CATEGORY_LABELS[key] || { label: key, hint: "" }),
    }))
    .filter(item => item.value > 0)
    .sort((a,b) => b.value-a.value);
  const maxPct = drivers.length ? drivers[0].pct : 1;
  const areaInSqft = estimate.areaUnit === "sqft" ? estimate.area : estimate.area * 10.764;
  const perSqft = areaInSqft > 0 ? estimate.totalCost / areaInSqft : 0;

  return <div className="space-y-6">
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-1 flex items-center gap-2"><TrendingUp className="size-5 text-vs"/><h3 className="text-base font-semibold text-vs-dark">What's driving your estimate</h3></div>
      <p className="mb-4 text-xs text-muted-foreground">Ranked by share of this preliminary project-cost estimate.</p>
      <div className="space-y-3">
        {drivers.map((d,i)=><div key={d.key}>
          <div className="mb-1 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-medium text-gray-800"><span className="flex size-5 items-center justify-center rounded-full bg-vs/10 text-[11px] font-bold text-vs">{i+1}</span>{d.label}</span><span className="text-right text-sm font-semibold text-vs-dark">{formatCurrency(d.value)} <span className="ml-1 text-xs font-normal text-muted-foreground">{d.pct.toFixed(1)}%</span></span></div>
          <div className="ml-7 h-2 overflow-hidden rounded-full bg-gray-100"><motion.div className="h-full rounded-full bg-vs" initial={{width:0}} animate={{width:`${(d.pct/maxPct)*100}%`}} transition={{duration:.6,delay:i*.08}}/></div>
          <p className="ml-7 mt-0.5 text-[11px] text-muted-foreground">{d.hint}</p>
        </div>)}
      </div>
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-1 flex items-center gap-2"><Gauge className="size-5 text-vs"/><h3 className="text-base font-semibold text-vs-dark">Your estimated unit cost</h3></div>
      <p className="mb-3 text-xs text-muted-foreground">A simple division of this estimate by the entered area—not a local market average or contractor rate.</p>
      <div className="text-2xl font-bold text-vs">₹{Math.round(perSqft).toLocaleString("en-IN")} <span className="text-sm font-normal text-muted-foreground">/ sq ft</span></div>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3"><Info className="mt-0.5 size-4 shrink-0 text-gray-400"/><p className="text-xs text-muted-foreground">Compare this figure only with estimates using the same area basis, work scope, specifications, consultant fees and exclusions.</p></div>
    </div>
  </div>;
};

export default CostTransparency;
