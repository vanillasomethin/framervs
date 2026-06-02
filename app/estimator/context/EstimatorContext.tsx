"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  ProjectEstimate,
  ComponentOption,
  CategoryBreakdown,
  PhaseBreakdown,
  Timeline,
} from "../types/estimator";

// Location multipliers — city → factor. State-level tiers used as fallback.
const LOCATION_MULTIPLIERS: Record<string, number> = {
  // Tier 1 metros
  Mumbai: 1.30, Navi_Mumbai: 1.25, Thane: 1.22,
  Delhi: 1.25, "Delhi/NCR": 1.25, "New Delhi": 1.25,
  Noida: 1.18, Gurgaon: 1.20, Gurugram: 1.20, Ghaziabad: 1.12, Faridabad: 1.10, "Greater Noida": 1.15,
  Bangalore: 1.28, Bengaluru: 1.28,
  Hyderabad: 1.20,
  Chennai: 1.18,
  Pune: 1.15,
  Kolkata: 1.10, Howrah: 1.08,
  // Tier 2
  Ahmedabad: 1.08, Surat: 1.06, Vadodara: 1.04,
  Jaipur: 1.06, Jodhpur: 1.02,
  Lucknow: 1.04, Kanpur: 1.02, Varanasi: 1.00, Agra: 1.00,
  Kochi: 1.10, Thiruvananthapuram: 1.05, Kozhikode: 1.03,
  Chandigarh: 1.06, Mohali: 1.05,
  Goa: 1.12, Panaji: 1.12,
  Indore: 1.04, Bhopal: 1.02, Nagpur: 1.02,
  Visakhapatnam: 1.04, Vijayawada: 1.02,
  Coimbatore: 1.04, Madurai: 1.02, Tiruppur: 1.02,
  Mysore: 1.04, Mysuru: 1.04, Mangalore: 1.03, Hubli: 1.00,
  Patna: 1.02, Ranchi: 1.00, Bhubaneswar: 1.04,
  Shimla: 1.05, Dharamshala: 1.04,
  Siliguri: 1.02, Asansol: 1.00, Durgapur: 1.00,
  Ludhiana: 1.04, Amritsar: 1.03, Jalandhar: 1.02,
};

// State-level fallback multipliers
const STATE_MULTIPLIERS: Record<string, number> = {
  "Maharashtra": 1.15, "Delhi": 1.22, "Karnataka": 1.12, "Telangana": 1.12,
  "Tamil Nadu": 1.08, "Gujarat": 1.06, "Haryana": 1.08, "Punjab": 1.05,
  "Kerala": 1.08, "West Bengal": 1.06, "Goa": 1.10, "Rajasthan": 1.03,
  "Uttar Pradesh": 1.02, "Madhya Pradesh": 1.00, "Odisha": 1.00,
  "Chandigarh": 1.06, "Pondicherry": 1.04, "Himachal Pradesh": 1.03,
};

// Base construction cost per sqm (standard quality shell)
const BASE_COST_PER_SQM: Record<string, number> = {
  Residential: 15000,
  Commercial: 18000,
  "Mixed-Use": 21000,
};

// Quality multipliers applied to base construction (shell + structure upgrade)
const QUALITY_MULTIPLIERS: Record<string, number> = {
  standard: 1.0,
  premium: 1.6,
  luxury: 2.8,
};

// Component pricing per sqm per quality level (source: vs-calculator)
const COMPONENT_PRICING: Record<string, Record<string, number>> = {
  // Core MEP
  plumbing:         { none: 0, standard: 500,  premium: 1500, luxury: 3500  },
  electrical:       { none: 0, standard: 400,  premium: 1200, luxury: 2800  },
  ac:               { none: 0, standard: 800,  premium: 2000, luxury: 5000  },
  elevator:         { none: 0, standard: 400,  premium: 900,  luxury: 2000  },
  civilQuality:     { none: 0, standard: 300,  premium: 800,  luxury: 1400  },
  // Finishes
  buildingEnvelope: { none: 0, standard: 500,  premium: 1200, luxury: 2800  },
  lighting:         { none: 0, standard: 300,  premium: 800,  luxury: 2000  },
  windows:          { none: 0, standard: 500,  premium: 1500, luxury: 3500  },
  ceiling:          { none: 0, standard: 400,  premium: 900,  luxury: 2200  },
  surfaces:         { none: 0, standard: 600,  premium: 1800, luxury: 4000  },
  // Interiors
  fixedFurniture:   { none: 0, standard: 3000, premium: 7000, luxury: 15000 },
  looseFurniture:   { none: 0, standard: 1500, premium: 4000, luxury: 9000  },
  furnishings:      { none: 0, standard: 500,  premium: 1500, luxury: 4000  },
  appliances:       { none: 0, standard: 1000, premium: 3000, luxury: 8000  },
  artefacts:        { none: 0, standard: 200,  premium: 600,  luxury: 1800  },
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

function getLocationMultiplier(city: string, state: string): number {
  // Normalize city name for lookup (replace spaces with underscores for Navi Mumbai etc.)
  if (LOCATION_MULTIPLIERS[city]) return LOCATION_MULTIPLIERS[city];
  // State-level fallback
  if (STATE_MULTIPLIERS[state]) return STATE_MULTIPLIERS[state];
  return 0.97; // Tier 3 default
}

function calculateEstimate(est: ProjectEstimate): ProjectEstimate {
  if (!est.area || !est.projectType || est.workTypes.length === 0) {
    return { ...est, totalCost: 0 };
  }

  const areaSqm = est.areaUnit === "sqft" ? est.area * 0.0929 : est.area;
  const sizeAdj = SIZE_ADJUSTMENT(areaSqm);
  const baseRate = BASE_COST_PER_SQM[est.projectType] ?? 15000;

  // Quality is driven by civilQuality for construction, otherwise by fixedFurniture for interiors-only
  const hasConstruction = est.workTypes.includes("construction");
  const hasInteriors = est.workTypes.includes("interiors");
  const hasLandscape = est.workTypes.includes("landscape");

  const dominantQuality = hasConstruction
    ? (est.civilQuality !== "none" ? est.civilQuality : "standard")
    : hasInteriors
    ? (est.fixedFurniture !== "none" ? est.fixedFurniture : "standard")
    : "standard";

  const qualityMult = hasConstruction ? (QUALITY_MULTIPLIERS[dominantQuality] ?? 1.0) : 1.0;
  const baseConstructionCost = hasConstruction ? areaSqm * baseRate * qualityMult * sizeAdj : 0;

  const sumComponents = (keys: readonly string[]) =>
    keys.reduce((sum, key) => {
      const val = est[key as keyof ProjectEstimate] as ComponentOption;
      return sum + (COMPONENT_PRICING[key]?.[val] ?? 0) * areaSqm * sizeAdj;
    }, 0);

  const coreComponents = ["plumbing", "electrical", "ac", "elevator", "civilQuality"] as const;
  const finishComponents = ["buildingEnvelope", "lighting", "windows", "ceiling", "surfaces"] as const;
  const interiorComponents = ["fixedFurniture", "looseFurniture", "furnishings", "appliances", "artefacts"] as const;

  const coreCost = hasConstruction ? sumComponents(coreComponents) : 0;
  const finishesCost = hasConstruction ? sumComponents(finishComponents) : 0;
  const interiorsCost = hasInteriors ? sumComponents(interiorComponents) : 0;
  // Landscape: flat rate per sqm based on quality selections; approximated as area-based
  const landscapeCost = hasLandscape ? areaSqm * 2500 * sizeAdj : 0;

  const locationMult = getLocationMultiplier(est.city, est.state);
  const projectTypeMult = est.projectType === "Commercial" ? 1.15 : est.projectType === "Mixed-Use" ? 1.25 : 1.0;
  const complexityAdj = 1 + ((est.complexity - 5) * 0.05);

  const rawSubtotal = baseConstructionCost + coreCost + finishesCost + interiorsCost + landscapeCost;
  const subtotal = rawSubtotal * locationMult * projectTypeMult * complexityAdj;

  const multiplierFactor = locationMult * projectTypeMult * complexityAdj;
  const professionalFees = 0.0825;
  const contingency = 0.05;
  const gst = 0.06;
  const overhead = 1 + professionalFees + contingency + gst;

  const totalCost = subtotal * overhead;

  const categoryBreakdown: CategoryBreakdown = {
    construction: Math.round(baseConstructionCost * multiplierFactor),
    core: Math.round(coreCost * multiplierFactor),
    finishes: Math.round(finishesCost * multiplierFactor),
    interiors: Math.round((interiorsCost + landscapeCost) * multiplierFactor),
  };

  // Phase cost breakdown — proportional to actual work-type costs
  const totalRaw = rawSubtotal || 1;
  const constructionShare = (baseConstructionCost + coreCost + finishesCost) / totalRaw;
  const interiorsShare = interiorsCost / totalRaw;
  const landscapeShare = landscapeCost / totalRaw;
  const planningShare = 0.08; // planning always ~8% overhead

  const phaseBreakdown: PhaseBreakdown = {
    planning: Math.round(totalCost * planningShare),
    construction: Math.round(totalCost * (hasConstruction ? constructionShare * (1 - planningShare) : 0)),
    interiors: Math.round(totalCost * (hasInteriors ? interiorsShare * (1 - planningShare) : 0)),
    landscape: Math.round(totalCost * (hasLandscape ? landscapeShare * (1 - planningShare) : 0)),
  };

  // Timeline (months)
  let planningMonths = hasConstruction ? 2 : 1;
  let constructionMonths = hasConstruction ? Math.max(6, Math.ceil(areaSqm / 60)) : 0;
  let interiorsMonths = hasInteriors ? Math.max(2, Math.ceil(areaSqm / 100)) : 0;
  let landscapeMonths = hasLandscape ? 2 : 0;

  const qualityTimeAdj = dominantQuality === "luxury" ? 1.35 : dominantQuality === "premium" ? 1.15 : 1.0;
  constructionMonths = Math.round(constructionMonths * qualityTimeAdj);
  interiorsMonths = Math.round(interiorsMonths * qualityTimeAdj);

  const totalMonths = planningMonths + constructionMonths + interiorsMonths + landscapeMonths;

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
