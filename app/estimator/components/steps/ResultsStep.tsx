"use client";

import type { ProjectEstimate } from "../../types/estimator";
import Link from "next/link";

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

interface Props {
  estimate: ProjectEstimate;
  onReset: () => void;
}

export default function ResultsStep({ estimate, onReset }: Props) {
  const { totalCost, categoryBreakdown, phaseBreakdown, timeline } = estimate;
  const low = Math.round(totalCost * 0.9);
  const high = Math.round(totalCost * 1.1);

  const categoryItems = [
    { label: "Base Construction", value: categoryBreakdown.construction, color: "bg-stone-800" },
    { label: "Core & Services", value: categoryBreakdown.core, color: "bg-stone-600" },
    { label: "Finishes", value: categoryBreakdown.finishes, color: "bg-stone-400" },
    { label: "Interiors & Landscape", value: categoryBreakdown.interiors, color: "bg-stone-300" },
  ].filter(c => c.value > 0);

  const phaseItems = [
    { label: "Planning & Design", months: timeline.phases.planning, cost: phaseBreakdown.planning },
    { label: "Construction", months: timeline.phases.construction, cost: phaseBreakdown.construction },
    { label: "Interiors", months: timeline.phases.interiors, cost: phaseBreakdown.interiors },
    { label: "Landscape", months: timeline.phases.landscape, cost: phaseBreakdown.landscape },
  ].filter(p => p.months > 0);

  if (totalCost === 0) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-stone-500">Unable to calculate estimate. Please ensure you&apos;ve filled in project type, work types, and area.</p>
        <button onClick={onReset} className="rounded-lg bg-stone-900 text-white px-6 py-2.5 text-sm font-medium">
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-1">Your estimate</h2>
        <p className="text-stone-500 text-sm">
          {estimate.projectType} project in {estimate.city || "India"}
        </p>
      </div>

      {/* Total cost */}
      <div className="rounded-xl bg-stone-900 text-white p-6 space-y-1">
        <p className="text-sm text-stone-400">Total Estimated Project Cost</p>
        <p className="text-4xl font-bold">{formatINR(totalCost)}</p>
        <p className="text-sm text-stone-400">Range: {formatINR(low)} – {formatINR(high)}</p>
        <p className="text-xs text-stone-500 mt-2">Inclusive of professional fees (8.25%), contingency (5%) & GST (6%). ±10% variation expected.</p>
      </div>

      {/* Category breakdown */}
      {categoryItems.length > 0 && (
        <div className="rounded-xl border border-stone-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-stone-700">Cost breakdown</h3>
          <div className="flex rounded-lg overflow-hidden h-3">
            {categoryItems.map((item) => (
              <div
                key={item.label}
                className={item.color}
                style={{ width: `${(item.value / totalCost) * 100}%` }}
              />
            ))}
          </div>
          <div className="space-y-2">
            {categoryItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                  <span className="text-stone-700">{item.label}</span>
                </div>
                <span className="font-medium text-stone-900">{formatINR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.totalMonths > 0 && (
        <div className="rounded-xl border border-stone-200 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-stone-700">Estimated timeline</h3>
            <span className="text-sm font-bold text-stone-900">{timeline.totalMonths} months</span>
          </div>
          <div className="space-y-2">
            {phaseItems.map((phase) => (
              <div key={phase.label} className="flex items-center justify-between text-sm">
                <span className="text-stone-600">{phase.label}</span>
                <div className="text-right">
                  <span className="text-stone-900 font-medium">{phase.months} mo</span>
                  <span className="text-stone-400 text-xs ml-2">{formatINR(phase.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-6 space-y-3">
        <h3 className="font-semibold text-stone-900">Ready to get started?</h3>
        <p className="text-sm text-stone-600">
          This estimate is a starting point. Book a consultation with our team to get a precise quote tailored to your project.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/contact"
            className="flex-1 rounded-lg bg-stone-900 text-white text-center px-4 py-2.5 text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Book a Consultation
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-lg border border-stone-300 text-stone-700 px-4 py-2.5 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>

      <p className="text-xs text-stone-400 text-center">
        Estimates are indicative and subject to site assessment, contractor quotes, and market conditions.
        COA professional fee standards applied.
      </p>
    </div>
  );
}
