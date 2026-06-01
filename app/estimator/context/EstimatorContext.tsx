"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  ProjectEstimate,
  ComponentOption,
  ProjectSubcategory,
  CategoryBreakdown,
  PhaseBreakdown,
  Timeline,
} from "../types/estimator";

// Location multipliers (city → factor)
const LOCATION_MULTIPLIERS: Record<string, number> = {
  Mumbai: 1.30, Delhi: 1.25, "Delhi/NCR": 1.25, Bangalore: 1.28, Bengaluru: 1.28,
  Hyderabad: 1.20, Chennai: 1.18, Pune: 1.15, Kolkata: 1.10, Ahmedabad: 1.08,
  Surat: 1.05, Jaipur: 1.05, Lucknow: 1.03, Kochi: 1.08, Chandigarh: 1.05,
  Goa: 1.10, Indore: 1.02, Bhopal: 1.00, Nagpur: 1.00, Visakhapatnam: 1.02,
  Mangalore: 1.00, Mysore: 1.02, Mysuru: 1.02, Coimbatore: 1.02, Madurai: 1.00,
};

// Base construction cost per sqm by project type
const BASE_COST_PER_SQM: Record<string, number> = {
  Residential: 15000,
  Commercial: 18000,
  "Mixed-Use": 21000,
};

// Quality multipliers
const QUALITY_MULTIPLIERS: Record<string, number> = {
  standard: 1.0,
  premium: 1.6,
  luxury: 2.8,
};

// Component pricing per sqm per quality level
const COMPONENT_PRICING: Record<string, Record<string, number>> = {
  plumbing: { none: 0, standard: 800, premium: 1500, luxury: 3500 },
  electrical: { none: 0, standard: 700, premium: 1200, luxury: 2500 },
  ac: { none: 0, standard: 600, premium: 1200, luxury: 2800 },
  elevator: { none: 0, standard: 400, premium: 900, luxury: 2000 },
  civilQuality: { none: 0, standard: 0, premium: 800, luxury: 2000 },
  buildingEnvelope: { none: 0, standard: 600, premium: 1200, luxury: 2500 },
  lighting: { none: 0, standard: 300, premium: 700, luxury: 1800 },
  windows: { none: 0, standard: 500, premium: 1100, luxury: 2200 },
  ceiling: { none: 0, standard: 400, premium: 900, luxury: 2000 },
  surfaces: { none: 0, standard: 500, premium: 1000, luxury: 2500 },
  fixedFurniture: { none: 0, standard: 800, premium: 1800, luxury: 4000 },
  looseFurniture: { none: 0, standard: 500, premium: 1200, luxury: 3000 },
  furnishings: { none: 0, standard: 300, premium: 700, luxury: 1800 },
  appliances: { none: 0, standard: 400, premium: 900, luxury: 2200 },
  artefacts: { none: 0, standard: 200, premium: 500, luxury: 1400 },
};

const SIZE_ADJUSTMENT = (areaSqm: number): number => {
  if (areaSqm < 50) return 1.20;
  if (areaSqm < 100) return 1.10;
  if (areaSqm < 200) return 1.05;
  if (areaSqm < 500) return 1.00;
  return 0.95;
};

const initialEstimate: ProjectEstimate = {
  state: "",
  city: "",
  projectType: "",
  workTypes: [],
  area: 0,
  areaUnit: "sqft",
  complexity: 5,
  selectedMaterials: [],
  civilQuality: "standard",
  plumbing: "standard",
  electrical: "standard",
  ac: "none",
  elevator: "none",
  buildingEnvelope: "standard",
  lighting: "standard",
  windows: "standard",
  ceiling: "standard",
  surfaces: "standard",
  fixedFurniture: "none",
  looseFurniture: "none",
  furnishings: "none",
  appliances: "none",
  artefacts: "none",
  totalCost: 0,
  categoryBreakdown: { construction: 0, core: 0, finishes: 0, interiors: 0 },
  phaseBreakdown: { planning: 0, construction: 0, interiors: 0, landscape: 0 },
  timeline: { totalMonths: 0, phases: { planning: 0, construction: 0, interiors: 0, landscape: 0 } },
};

function calculateEstimate(est: ProjectEstimate): ProjectEstimate {
  if (!est.area || !est.projectType || est.workTypes.length === 0) {
    return { ...est, totalCost: 0 };
  }

  const areaSqm = est.areaUnit === "sqft" ? est.area * 0.0929 : est.area;
  const sizeAdj = SIZE_ADJUSTMENT(areaSqm);
  const baseRate = BASE_COST_PER_SQM[est.projectType] ?? 15000;

  // Determine quality from majority components
  const qualities = [est.civilQuality, est.plumbing, est.electrical].filter(q => q !== "none");
  const dominantQuality = qualities[0] ?? "standard";
  const qualityMult = QUALITY_MULTIPLIERS[dominantQuality] ?? 1.0;

  const baseConstructionCost = areaSqm * baseRate * qualityMult * sizeAdj;

  // Component costs
  const coreComponents = ["plumbing", "electrical", "ac", "elevator", "civilQuality"] as const;
  const finishComponents = ["buildingEnvelope", "lighting", "windows", "ceiling", "surfaces"] as const;
  const interiorComponents = ["fixedFurniture", "looseFurniture", "furnishings", "appliances", "artefacts"] as const;

  const hasConstruction = est.workTypes.includes("construction");
  const hasInteriors = est.workTypes.includes("interiors");
  const hasLandscape = est.workTypes.includes("landscape");

  const sumComponents = (keys: readonly string[]) =>
    keys.reduce((sum, key) => {
      const val = est[key as keyof ProjectEstimate] as ComponentOption;
      return sum + (COMPONENT_PRICING[key]?.[val] ?? 0) * areaSqm * sizeAdj;
    }, 0);

  const coreCost = hasConstruction ? sumComponents(coreComponents) : 0;
  const finishesCost = hasConstruction ? sumComponents(finishComponents) : 0;
  const interiorsCost = hasInteriors ? sumComponents(interiorComponents) : 0;
  const landscapeCost = hasLandscape ? areaSqm * 2000 * sizeAdj : 0;

  const locationMult = LOCATION_MULTIPLIERS[est.city] ?? 1.0;
  const projectTypeMult = est.projectType === "Commercial" ? 1.15 : est.projectType === "Mixed-Use" ? 1.25 : 1.0;
  const complexityAdj = 1 + ((est.complexity - 5) * 0.05);

  const subtotal = (baseConstructionCost + coreCost + finishesCost + interiorsCost + landscapeCost)
    * locationMult * projectTypeMult * complexityAdj;

  const professionalFees = 0.0825;
  const contingency = 0.05;
  const gst = 0.06;

  const totalCost = subtotal * (1 + professionalFees + contingency + gst);

  const categoryBreakdown: CategoryBreakdown = {
    construction: Math.round(baseConstructionCost * locationMult * projectTypeMult * complexityAdj),
    core: Math.round(coreCost * locationMult * projectTypeMult * complexityAdj),
    finishes: Math.round(finishesCost * locationMult * projectTypeMult * complexityAdj),
    interiors: Math.round((interiorsCost + landscapeCost) * locationMult * projectTypeMult * complexityAdj),
  };

  // Timeline
  let planningMonths = 2;
  let constructionMonths = hasConstruction ? 6 : 0;
  let interiorsMonths = hasInteriors ? 2 : 0;
  let landscapeMonths = hasLandscape ? 2 : 0;

  if (areaSqm > 200) {
    constructionMonths += Math.floor(areaSqm / 200);
    interiorsMonths += Math.floor(areaSqm / 400);
  }
  if (dominantQuality === "luxury") {
    constructionMonths = Math.round(constructionMonths * 1.3);
    interiorsMonths = Math.round(interiorsMonths * 1.4);
  } else if (dominantQuality === "premium") {
    constructionMonths = Math.round(constructionMonths * 1.15);
    interiorsMonths = Math.round(interiorsMonths * 1.2);
  }

  const totalMonths = planningMonths + constructionMonths + interiorsMonths + landscapeMonths;

  const phaseBreakdown: PhaseBreakdown = {
    planning: Math.round(totalCost * 0.08),
    construction: Math.round(totalCost * (hasConstruction ? 0.55 : 0)),
    interiors: Math.round(totalCost * (hasInteriors ? 0.30 : 0)),
    landscape: Math.round(totalCost * (hasLandscape ? 0.07 : 0)),
  };

  const timeline: Timeline = {
    totalMonths,
    phases: {
      planning: planningMonths,
      construction: constructionMonths,
      interiors: interiorsMonths,
      landscape: landscapeMonths,
    },
  };

  return {
    ...est,
    totalCost: Math.round(totalCost),
    categoryBreakdown,
    phaseBreakdown,
    timeline,
  };
}

interface EstimatorContextValue {
  step: number;
  totalSteps: number;
  estimate: ProjectEstimate;
  updateEstimate: (updates: Partial<ProjectEstimate>) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const EstimatorContext = createContext<EstimatorContextValue | null>(null);

export function EstimatorProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(1);
  const [estimate, setEstimate] = useState<ProjectEstimate>(initialEstimate);
  const totalSteps = 5;

  const updateEstimate = useCallback((updates: Partial<ProjectEstimate>) => {
    setEstimate((prev) => {
      const next = { ...prev, ...updates };
      return calculateEstimate(next);
    });
  }, []);

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, totalSteps)), [totalSteps]);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);
  const reset = useCallback(() => {
    setEstimate(initialEstimate);
    setStep(1);
  }, []);

  return (
    <EstimatorContext.Provider value={{ step, totalSteps, estimate, updateEstimate, nextStep, prevStep, reset }}>
      {children}
    </EstimatorContext.Provider>
  );
}

export function useEstimator() {
  const ctx = useContext(EstimatorContext);
  if (!ctx) throw new Error("useEstimator must be used within EstimatorProvider");
  return ctx;
}
