"use client";

import { useEstimator } from "../context/EstimatorContext";
import LocationStep from "./steps/LocationStep";
import ProjectTypeStep from "./steps/ProjectTypeStep";
import AreaStep from "./steps/AreaStep";
import SpecificationsStep from "./steps/SpecificationsStep";
import ResultsStep from "./steps/ResultsStep";
import type { ComponentOption } from "../types/estimator";

const STEP_LABELS = ["Location", "Project", "Area", "Specs", "Results"];

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium shrink-0 ${
              done ? "bg-stone-900 text-white" : active ? "bg-stone-900 text-white ring-2 ring-stone-300" : "bg-stone-100 text-stone-400"
            }`}>
              {done ? "✓" : num}
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 ${done ? "bg-stone-900" : "bg-stone-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveCost({ cost }: { cost: number }) {
  if (cost === 0) return null;
  const formatted = cost >= 10000000
    ? `₹${(cost / 10000000).toFixed(2)} Cr`
    : cost >= 100000
    ? `₹${(cost / 100000).toFixed(2)} L`
    : `₹${cost.toLocaleString("en-IN")}`;

  return (
    <div className="mb-6 rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 flex items-center justify-between">
      <span className="text-xs text-stone-500">Running estimate</span>
      <span className="text-sm font-bold text-stone-900">{formatted}</span>
    </div>
  );
}

export default function EstimatorWizard() {
  const { step, totalSteps, estimate, updateEstimate, nextStep, prevStep, reset } = useEstimator();

  const canAdvance = (): boolean => {
    if (step === 1) return Boolean(estimate.city);
    if (step === 2) return Boolean(estimate.projectType && estimate.workTypes.length > 0);
    if (step === 3) return estimate.area > 0;
    return true;
  };

  return (
    <div className="max-w-xl mx-auto">
      <StepIndicator step={step} total={totalSteps} />

      {step < totalSteps && estimate.totalCost > 0 && <LiveCost cost={estimate.totalCost} />}

      <div className="min-h-[400px]">
        {step === 1 && (
          <LocationStep
            selectedState={estimate.state}
            selectedCity={estimate.city}
            onStateChange={(state) => updateEstimate({ state })}
            onCityChange={(city) => updateEstimate({ city })}
          />
        )}
        {step === 2 && (
          <ProjectTypeStep
            projectType={estimate.projectType}
            workTypes={estimate.workTypes}
            roomConfiguration={estimate.roomConfiguration}
            landscapeAreas={estimate.landscapeAreas}
            constructionSubtype={estimate.constructionSubtype}
            floorCount={estimate.floorCount}
            onProjectTypeChange={(projectType) => updateEstimate({ projectType })}
            onWorkTypesChange={(workTypes) => updateEstimate({ workTypes })}
            onRoomConfigChange={(roomConfiguration) => updateEstimate({ roomConfiguration })}
            onLandscapeAreasChange={(landscapeAreas) => updateEstimate({ landscapeAreas })}
            onConstructionSubtypeChange={(constructionSubtype) => updateEstimate({ constructionSubtype })}
            onFloorCountChange={(floorCount) => updateEstimate({ floorCount })}
          />
        )}
        {step === 3 && (
          <AreaStep
            area={estimate.area}
            areaUnit={estimate.areaUnit}
            areaInputType={estimate.areaInputType}
            fsiCompliant={estimate.fsiCompliant}
            floorCount={estimate.floorCount}
            onAreaChange={(area) => updateEstimate({ area })}
            onAreaUnitChange={(areaUnit) => updateEstimate({ areaUnit })}
            onAreaInputTypeChange={(areaInputType) => updateEstimate({ areaInputType })}
            onFsiChange={(fsiCompliant) => updateEstimate({ fsiCompliant })}
          />
        )}
        {step === 4 && (
          <SpecificationsStep
            workTypes={estimate.workTypes}
            civilQuality={estimate.civilQuality}
            plumbing={estimate.plumbing}
            electrical={estimate.electrical}
            ac={estimate.ac}
            elevator={estimate.elevator}
            buildingEnvelope={estimate.buildingEnvelope}
            lighting={estimate.lighting}
            windows={estimate.windows}
            ceiling={estimate.ceiling}
            surfaces={estimate.surfaces}
            fixedFurniture={estimate.fixedFurniture}
            looseFurniture={estimate.looseFurniture}
            furnishings={estimate.furnishings}
            appliances={estimate.appliances}
            artefacts={estimate.artefacts}
            onOptionChange={(key, value) => updateEstimate({ [key]: value } as Record<string, ComponentOption>)}
          />
        )}
        {step === 5 && <ResultsStep estimate={estimate} onReset={reset} />}
      </div>

      {step < totalSteps && (
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 rounded-lg border border-stone-300 text-stone-700 px-4 py-2.5 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={!canAdvance()}
            className="flex-1 rounded-lg bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {step === 4 ? "Calculate" : "Continue"}
          </button>
        </div>
      )}

      <div className="mt-4 text-center">
        <span className="text-xs text-stone-400">{STEP_LABELS[step - 1]} — Step {step} of {totalSteps}</span>
      </div>
    </div>
  );
}
