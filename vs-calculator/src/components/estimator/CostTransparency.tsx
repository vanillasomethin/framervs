import { motion } from "framer-motion";
import { TrendingUp, Info, Gauge } from "lucide-react";
import { ProjectEstimate } from "@/types/estimator";

interface CostTransparencyProps {
  estimate: ProjectEstimate;
}

// Indicative all-in ₹/sqft bands (inclusive of fees, contingency & GST) used only
// to position the user's estimate against the wider market. Sourced from 2026
// metro-India ranges (architects4design / InfraLens). Not a calculation input.
const BENCHMARK_BANDS: Record<string, { low: number; typical: number; high: number }> = {
  residential: { low: 1800, typical: 2600, high: 4000 },
  commercial: { low: 2200, typical: 3200, high: 5000 },
  "mixed-use": { low: 2500, typical: 3600, high: 5500 },
};

const CATEGORY_LABELS: Record<string, { label: string; hint: string }> = {
  construction: { label: "Structure & Shell", hint: "Foundation, framing, masonry, amenities" },
  core: { label: "MEP / Core Systems", hint: "Plumbing, electrical, HVAC, lift" },
  finishes: { label: "Finishes & Envelope", hint: "Facade, waterproofing, flooring, ceilings" },
  interiors: { label: "Interiors & FF&E", hint: "Furniture, furnishings, appliances" },
  fees: { label: "Fees, Contingency & GST", hint: "Professional fees + contingency + taxes" },
};

const CostTransparency = ({ estimate }: CostTransparencyProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const cb = estimate.categoryBreakdown;
  const total = estimate.totalCost || 1;

  // Rank the cost drivers descending so the user sees what moves the number most.
  const drivers = Object.entries(cb)
    .map(([key, value]) => ({
      key,
      value: value as number,
      pct: ((value as number) / total) * 100,
      ...CATEGORY_LABELS[key],
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const maxPct = drivers.length ? drivers[0].pct : 1;

  // ₹/sqft positioning against the market band.
  const areaInSqft = estimate.areaUnit === "sqft" ? estimate.area : estimate.area * 10.764;
  const perSqft = areaInSqft > 0 ? estimate.totalCost / areaInSqft : 0;
  const band = BENCHMARK_BANDS[estimate.projectType] || BENCHMARK_BANDS.residential;

  // Position the marker across a slightly padded band so values at/below low or
  // at/above high still render inside the track.
  const trackLow = band.low * 0.85;
  const trackHigh = band.high * 1.15;
  const markerPct = Math.min(100, Math.max(0, ((perSqft - trackLow) / (trackHigh - trackLow)) * 100));

  let verdict: { text: string; color: string };
  if (perSqft < band.low) {
    verdict = { text: "Below the typical market range — a lean, budget-conscious spec.", color: "text-blue-700" };
  } else if (perSqft <= band.typical) {
    verdict = { text: "In the value end of the market range for this project type.", color: "text-green-700" };
  } else if (perSqft <= band.high) {
    verdict = { text: "In the premium end of the typical market range.", color: "text-amber-700" };
  } else {
    verdict = { text: "Above the typical range — a high-spec / luxury configuration.", color: "text-vs" };
  }

  return (
    <div className="space-y-6">
      {/* Cost Drivers */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="size-5 text-vs" />
          <h3 className="text-base font-semibold text-vs-dark">What's driving your cost</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Ranked by share of the total. The biggest levers are at the top — adjust those first to move the number.
        </p>

        <div className="space-y-3">
          {drivers.map((d, i) => (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-vs/10 text-vs text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{d.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-vs-dark">{formatCurrency(d.value)}</span>
                  <span className="text-xs text-muted-foreground ml-2">{d.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden ml-7">
                <motion.div
                  className="h-full bg-vs rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.pct / maxPct) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground ml-7 mt-0.5">{d.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Market benchmark */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="size-5 text-vs" />
          <h3 className="text-base font-semibold text-vs-dark">How your ₹/sqft compares</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your all-in rate against typical 2026 market bands for {estimate.projectType} projects.
        </p>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-vs">₹{Math.round(perSqft).toLocaleString("en-IN")}</span>
          <span className="text-sm text-muted-foreground">/ sqft (all-in)</span>
        </div>

        {/* Band track */}
        <div className="relative h-3 rounded-full bg-gradient-to-r from-blue-200 via-green-200 to-amber-200 mb-2">
          <motion.div
            className="absolute -top-1 size-5 rounded-full bg-vs border-2 border-white shadow-md"
            initial={{ left: 0 }}
            animate={{ left: `calc(${markerPct}% - 10px)` }}
            transition={{ duration: 0.7 }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-3">
          <span>₹{band.low.toLocaleString("en-IN")} (lean)</span>
          <span>₹{band.typical.toLocaleString("en-IN")} (typical)</span>
          <span>₹{band.high.toLocaleString("en-IN")} (premium)</span>
        </div>

        <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
          <Info className="size-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className={`text-xs font-medium ${verdict.color}`}>{verdict.text}</p>
        </div>
      </div>
    </div>
  );
};

export default CostTransparency;
