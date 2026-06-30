import { ProjectEstimate, ComponentOption } from "@/types/estimator";
import { ChevronDown, ChevronUp, Info, IndianRupee } from "lucide-react";
import { useState } from "react";

interface DetailedBreakdownSectionProps {
  estimate: ProjectEstimate;
}

// Category colours match the donut in ImprovedCostVisualization for consistency.
const CATEGORY_COLOR: Record<string, string> = {
  construction: "#8B0000",
  core: "#B22222",
  finishes: "#CD5C5C",
  interiors: "#F08080",
  fees: "#C9A9A9",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);

const levelLabel = (level?: ComponentOption) =>
  level && level !== "none" ? level.charAt(0).toUpperCase() + level.slice(1) : null;

const DetailedBreakdownSection = ({ estimate }: DetailedBreakdownSectionProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const toggleSection = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  const total = estimate.totalCost || 1;
  const cb = estimate.categoryBreakdown;

  // Sections are built straight from the reconciled category breakdown, so the
  // section totals sum exactly to the headline total and the percentages add to
  // 100%. Items list what each category actually covers (with the quality level
  // the user selected) rather than fabricated rupee splits.
  const sections = [
    {
      key: "construction",
      category: "Base Construction",
      value: cb.construction,
      items: [
        { name: "Structure, shell & civil works", level: estimate.civilQuality },
      ],
    },
    {
      key: "core",
      category: "Core Services (MEP)",
      value: cb.core,
      items: [
        { name: "Plumbing & sanitation", level: estimate.plumbing },
        { name: "Electrical & wiring", level: estimate.electrical },
        { name: "Air conditioning", level: estimate.ac },
        { name: "Elevator", level: estimate.elevator },
      ],
    },
    {
      key: "finishes",
      category: "Finishes & Surfaces",
      value: cb.finishes,
      items: [
        { name: "Building envelope", level: estimate.buildingEnvelope },
        { name: "Lighting", level: estimate.lighting },
        { name: "Windows & glazing", level: estimate.windows },
        { name: "Ceiling", level: estimate.ceiling },
        { name: "Surfaces (flooring, tiling, paint)", level: estimate.surfaces },
      ],
    },
    {
      key: "interiors",
      category: "Interiors & Furnishings",
      value: cb.interiors,
      items: [
        { name: "Fixed furniture & cabinetry", level: estimate.fixedFurniture },
        { name: "Loose furniture", level: estimate.looseFurniture },
        { name: "Furnishings (curtains, soft goods)", level: estimate.furnishings },
        { name: "Appliances", level: estimate.appliances },
        { name: "Decor & artefacts", level: estimate.artefacts },
      ],
    },
    {
      key: "fees",
      category: "Professional Fees & Taxes",
      value: cb.fees,
      items: [
        { name: "Architectural & documentation fees (8.25%)", level: undefined },
        { name: "Contingency (5%)", level: undefined },
        { name: "GST (6%)", level: undefined },
      ],
    },
  ]
    .filter((s) => s.value >= 1)
    .map((s) => ({
      ...s,
      percentage: Math.round((s.value / total) * 100),
      // only show items the user actually selected (level !== none), plus fee lines
      items: s.items.filter((it) => it.level === undefined || levelLabel(it.level)),
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-start gap-2 mb-6">
        <Info className="size-5 text-vs mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Detailed Cost Breakdown</h3>
          <p className="text-sm text-gray-600">
            How your estimate is distributed across major work categories.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Category totals add up to the headline estimate. Actual costs may vary
            with final specifications and site conditions.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.key;
          return (
            <div key={section.key} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between gap-2 p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span
                    className="size-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLOR[section.key] }}
                  />
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[40vw] sm:max-w-none">
                      {section.category}
                    </span>
                    <span className="text-xs text-gray-500">{section.percentage}% of total</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="font-bold text-vs text-sm sm:text-base whitespace-nowrap">{formatCurrency(section.value)}</span>
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="size-5 text-gray-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="bg-white border-t border-gray-200">
                  <div className="p-3 sm:p-4 space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700 break-words">{item.name}</span>
                        {levelLabel(item.level) && (
                          <span className="text-xs font-medium text-vs bg-vs/5 px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                            {levelLabel(item.level)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 p-3 sm:p-4 bg-vs/5 rounded-lg border border-vs/20">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-600 mb-1">Total Project Cost</p>
            <p className="text-xs text-gray-500 hidden sm:block">Tap a category above to see what it covers</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <IndianRupee className="size-4 sm:size-5 text-vs" />
            <span className="text-xl sm:text-2xl font-bold text-vs whitespace-nowrap">{formatCurrency(estimate.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Distribution bar — widths are the real category shares */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Cost Distribution</p>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {sections.map((section) => (
            <div
              key={section.key}
              className="relative group"
              style={{ width: `${section.percentage}%`, backgroundColor: CATEGORY_COLOR[section.key] }}
              title={`${section.category}: ${section.percentage}%`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {section.percentage}%
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {sections.map((section) => (
            <div key={section.key} className="flex items-center gap-2">
              <div
                className="size-3 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLOR[section.key] }}
              />
              <span className="text-gray-600">{section.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedBreakdownSection;
