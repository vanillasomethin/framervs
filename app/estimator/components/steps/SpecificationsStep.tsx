"use client";

import type { ComponentOption, ProjectSubcategory } from "../../types/estimator";

type QualityKey = ComponentOption;

const QUALITY_OPTIONS: { value: QualityKey; label: string; desc: string }[] = [
  { value: "none", label: "Not required", desc: "Exclude from estimate" },
  { value: "standard", label: "Standard", desc: "Functional, good quality" },
  { value: "premium", label: "Premium", desc: "High-end specifications" },
  { value: "luxury", label: "Luxury", desc: "Top-tier, bespoke" },
];

interface ComponentSpec {
  key: string;
  label: string;
  desc: string;
  required?: boolean;
}

const CORE_COMPONENTS: ComponentSpec[] = [
  { key: "civilQuality", label: "Civil & Structure", desc: "RCC, masonry, foundation quality", required: true },
  { key: "plumbing", label: "Plumbing & Sanitary", desc: "Water supply, drainage, fixtures", required: true },
  { key: "electrical", label: "Electrical Systems", desc: "Wiring, panels, distribution", required: true },
  { key: "ac", label: "A/C & HVAC", desc: "Air conditioning, ventilation" },
  { key: "elevator", label: "Elevator / Lift", desc: "For multi-storey buildings" },
];

const FINISHES_COMPONENTS: ComponentSpec[] = [
  { key: "buildingEnvelope", label: "Building Envelope", desc: "Facade, cladding, external finish" },
  { key: "lighting", label: "Lighting", desc: "Fixtures, controls, ambience" },
  { key: "windows", label: "Windows & Glazing", desc: "Frames, glass, hardware" },
  { key: "ceiling", label: "Ceiling", desc: "False ceiling, finishes" },
  { key: "surfaces", label: "Floor & Wall Surfaces", desc: "Tiles, stone, paint finishes" },
];

const INTERIORS_COMPONENTS: ComponentSpec[] = [
  { key: "fixedFurniture", label: "Fixed Furniture", desc: "Wardrobes, cabinets, joinery" },
  { key: "looseFurniture", label: "Loose Furniture", desc: "Sofas, chairs, tables, beds" },
  { key: "furnishings", label: "Furnishings & Soft", desc: "Curtains, rugs, upholstery" },
  { key: "appliances", label: "Appliances", desc: "Kitchen, laundry, built-in" },
  { key: "artefacts", label: "Art & Décor", desc: "Art pieces, accessories" },
];

interface SpecValues {
  civilQuality: ComponentOption;
  plumbing: ComponentOption;
  electrical: ComponentOption;
  ac: ComponentOption;
  elevator: ComponentOption;
  buildingEnvelope: ComponentOption;
  lighting: ComponentOption;
  windows: ComponentOption;
  ceiling: ComponentOption;
  surfaces: ComponentOption;
  fixedFurniture: ComponentOption;
  looseFurniture: ComponentOption;
  furnishings: ComponentOption;
  appliances: ComponentOption;
  artefacts: ComponentOption;
}

interface Props extends SpecValues {
  workTypes: ProjectSubcategory[];
  onOptionChange: (key: keyof SpecValues, value: ComponentOption) => void;
}

function QualitySelector({ spec, value, onChange, disabled }: {
  spec: ComponentSpec;
  value: ComponentOption;
  onChange: (v: ComponentOption) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${disabled ? "opacity-40" : ""}`}>
      <div>
        <p className="text-sm font-medium text-stone-900">{spec.label}</p>
        <p className="text-xs text-stone-500">{spec.desc}</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {QUALITY_OPTIONS.map(({ value: qv, label, desc }) => {
          if (qv === "none" && spec.required) return null;
          return (
            <button
              key={qv}
              type="button"
              disabled={disabled}
              onClick={() => onChange(qv)}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors text-center ${
                value === qv
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
              title={desc}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SpecificationsStep({ workTypes, onOptionChange, ...values }: Props) {
  const hasConstruction = workTypes.includes("construction");
  const hasInteriors = workTypes.includes("interiors");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-1">Specifications</h2>
        <p className="text-stone-500 text-sm">Choose quality levels for each component.</p>
      </div>

      {hasConstruction && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Core & Structure</h3>
          {CORE_COMPONENTS.map((spec) => (
            <QualitySelector
              key={spec.key}
              spec={spec}
              value={values[spec.key as keyof SpecValues]}
              onChange={(v) => onOptionChange(spec.key as keyof SpecValues, v)}
            />
          ))}
        </section>
      )}

      {hasConstruction && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Finishes</h3>
          {FINISHES_COMPONENTS.map((spec) => (
            <QualitySelector
              key={spec.key}
              spec={spec}
              value={values[spec.key as keyof SpecValues]}
              onChange={(v) => onOptionChange(spec.key as keyof SpecValues, v)}
            />
          ))}
        </section>
      )}

      {hasInteriors && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Interiors</h3>
          {INTERIORS_COMPONENTS.map((spec) => (
            <QualitySelector
              key={spec.key}
              spec={spec}
              value={values[spec.key as keyof SpecValues]}
              onChange={(v) => onOptionChange(spec.key as keyof SpecValues, v)}
            />
          ))}
        </section>
      )}

      {!hasConstruction && !hasInteriors && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500">
          Select Construction or Interiors work types in the previous step to configure specifications.
        </div>
      )}
    </div>
  );
}
