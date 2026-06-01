"use client";

import type { AreaInputType } from "../../types/estimator";

const AREA_INPUT_TYPES: { id: AreaInputType; label: string; desc: string }[] = [
  { id: "builtup", label: "Built-up Area", desc: "Total floor area across all floors" },
  { id: "plinth", label: "Plinth Area", desc: "Ground floor footprint × number of floors" },
  { id: "plot", label: "Plot / Site Area", desc: "Land area (FSI rules apply)" },
];

interface Props {
  area: number;
  areaUnit: "sqft" | "sqm";
  areaInputType?: AreaInputType;
  fsiCompliant?: boolean;
  floorCount?: number;
  onAreaChange: (area: number) => void;
  onAreaUnitChange: (unit: "sqft" | "sqm") => void;
  onAreaInputTypeChange: (type: AreaInputType) => void;
  onFsiChange: (fsi: boolean) => void;
}

export default function AreaStep({
  area, areaUnit, areaInputType, fsiCompliant, floorCount,
  onAreaChange, onAreaUnitChange, onAreaInputTypeChange, onFsiChange,
}: Props) {
  const displayUnit = areaUnit === "sqft" ? "sq ft" : "sq m";
  const conversionHint = area > 0
    ? areaUnit === "sqft"
      ? `≈ ${(area * 0.0929).toFixed(1)} sq m`
      : `≈ ${(area / 0.0929).toFixed(0)} sq ft`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-1">Project area</h2>
        <p className="text-stone-500 text-sm">Enter the size of your project.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">Area type</p>
        <div className="space-y-2">
          {AREA_INPUT_TYPES.map(({ id, label, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => onAreaInputTypeChange(id)}
              className={`w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                areaInputType === id
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
              }`}
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 rounded-full border items-center justify-center ${
                areaInputType === id ? "bg-white border-white" : "border-stone-400"
              }`}>
                {areaInputType === id && <span className="block h-2 w-2 rounded-full bg-stone-900" />}
              </span>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className={`text-xs ${areaInputType === id ? "text-stone-300" : "text-stone-500"}`}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Area ({displayUnit})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={area || ""}
            onChange={(e) => onAreaChange(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 1200"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <div className="flex rounded-lg border border-stone-300 overflow-hidden">
            {(["sqft", "sqm"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => onAreaUnitChange(unit)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  areaUnit === unit ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {unit === "sqft" ? "sq ft" : "sq m"}
              </button>
            ))}
          </div>
        </div>
        {conversionHint && <p className="mt-1 text-xs text-stone-400">{conversionHint}</p>}
      </div>

      {areaInputType === "plot" && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">FSI compliance</p>
          <div className="flex gap-2">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => onFsiChange(val)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                  fsiCompliant === val
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                }`}
              >
                {val ? "FSI Compliant" : "Non-Compliant"}
              </button>
            ))}
          </div>
          {floorCount && (
            <p className="mt-2 text-xs text-stone-400">
              Effective built-up area: ~{(area * (fsiCompliant ? 1.5 : 2.0) * (areaUnit === "sqft" ? 1 : 10.764)).toFixed(0)} sq ft across {floorCount} floors
            </p>
          )}
        </div>
      )}
    </div>
  );
}
