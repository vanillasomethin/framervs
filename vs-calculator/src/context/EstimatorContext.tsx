import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ProjectEstimate, ComponentOption } from "@/types/estimator";
import { useToast } from "@/hooks/use-toast";

interface EstimatorContextType {
  step: number;
  totalSteps: number;
  estimate: ProjectEstimate;
  isCalculating: boolean;
  setStep: (step: number) => void;
  updateEstimate: (key: keyof ProjectEstimate, value: any) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleReset: () => void;
  handleSaveEstimate: () => void;
  handleOptionChange: (component: string, option: ComponentOption) => void;
}

const EstimatorContext = createContext<EstimatorContextType | undefined>(undefined);

// Location-based cost multipliers.
// Calibrated against InfraLens 2026 metro standard rates (₹/sqft): Mumbai 3150,
// Delhi 2835, Gurgaon 2730, Pune 2573, Bangalore 2520, Chennai 2363, Hyderabad
// 2205, Kolkata 2205, Ahmedabad 2153 — expressed relative to a national
// baseline of ~₹2,100/sqft (multiplier 1.0). Bangalore anchors at 1.20.
const LOCATION_MULTIPLIERS: Record<string, number> = {
  // Tier 1 Cities - High cost
  "Mumbai": 1.50,
  "Navi Mumbai": 1.42,
  "Thane": 1.40,
  "Delhi": 1.35,
  "New Delhi": 1.35,
  "Gurgaon": 1.30,
  "Noida": 1.28,
  "Bangalore": 1.20,
  "Bengaluru": 1.20,
  "Pune": 1.22,
  "Hyderabad": 1.05,
  "Chennai": 1.13,
  "Kolkata": 1.05,

  // Tier 2 Cities - Medium cost
  "Ahmedabad": 1.03,
  "Surat": 1.00,
  "Jaipur": 1.05,
  "Kochi": 1.05,
  "Coimbatore": 1.00,
  "Indore": 1.00,
  "Chandigarh": 1.15,
  "Lucknow": 0.98,
  "Visakhapatnam": 0.95,
  "Nagpur": 0.98,
  "Vadodara": 1.00,

  // Tier 3 and others - Base cost
  "default": 0.92
};

// Component pricing per square meter (in INR).
// Standard-tier rates reflect 2025-26 market research; premium and luxury tiers
// step up ~1.6x and ~2.6x of standard respectively. This intentionally moderate
// escalation (rather than the 6-7x of earlier versions) keeps the AGGREGATE
// quality jump in line with InfraLens 2026 grade factors — Premium ~1.35x and
// Luxury ~1.85x of a standard build — since in real projects finishes/MEP rise
// with quality while the structural shell barely does.
const COMPONENT_PRICING: Record<string, Record<ComponentOption, number>> = {
  // Core Construction Components (MEP + civil)
  civilQuality: { none: 0, standard: 300, premium: 480, luxury: 780 },
  plumbing: { none: 0, standard: 500, premium: 800, luxury: 1300 },
  electrical: { none: 0, standard: 400, premium: 640, luxury: 1040 },
  ac: { none: 0, standard: 800, premium: 1300, luxury: 2100 },
  elevator: { none: 0, standard: 750, premium: 1200, luxury: 1950 },

  // Finishes & Envelope
  buildingEnvelope: { none: 0, standard: 150, premium: 240, luxury: 390 },
  lighting: { none: 0, standard: 400, premium: 640, luxury: 1040 },
  windows: { none: 0, standard: 500, premium: 800, luxury: 1300 },
  ceiling: { none: 0, standard: 350, premium: 560, luxury: 910 },
  surfaces: { none: 0, standard: 600, premium: 1000, luxury: 1700 }, // marble/Italian genuinely jumps

  // Interior Components (FF&E — a separate budget line from construction; scales
  // steeper than construction since luxury bespoke interiors are open-ended).
  fixedFurniture: { none: 0, standard: 3000, premium: 5400, luxury: 9000 },
  looseFurniture: { none: 0, standard: 2000, premium: 3600, luxury: 6500 },
  furnishings: { none: 0, standard: 500, premium: 1000, luxury: 1800 },
  appliances: { none: 0, standard: 1000, premium: 2000, luxury: 3800 },
  artefacts: { none: 0, standard: 300, premium: 900, luxury: 2000 },
};

// Base construction cost per square meter (structural shell + basic finishes +
// basic MEP, at the STANDARD tier). Components above are added on top.
// Calibrated so a standard construction-only build lands near reference rates:
// e.g. residential standard in Bangalore (location 1.20) ≈ ₹2,300/sqft pre-fee,
// between architects4design (₹1,750-1,900) and InfraLens 2026 (₹2,520).
const BASE_CONSTRUCTION_COST: Record<string, number> = {
  residential: 17000,   // ₹17,000/sqm (₹1,579/sqft)
  commercial: 20000,    // ₹20,000/sqm for commercial projects
  "mixed-use": 23000,   // ₹23,000/sqm for mixed-use developments
};

const initialEstimate: ProjectEstimate = {
  state: "",
  city: "",
  projectType: "",
  workTypes: [],
  roomConfiguration: undefined,
  landscapeAreas: undefined,
  constructionSubtype: undefined,
  floorCount: 1,
  areaInputType: undefined,
  plotArea: undefined,
  builtUpArea: undefined,
  fsiCompliant: true,
  projectSubcategory: "", // Legacy field
  area: 0,
  areaUnit: "sqft",
  complexity: 5,
  selectedMaterials: [],
  civilQuality: "standard",
  plumbing: "standard",
  ac: "standard",
  electrical: "standard",
  elevator: "none",
  buildingEnvelope: "standard",
  lighting: "standard",
  windows: "standard",
  ceiling: "standard",
  surfaces: "standard",
  fixedFurniture: "standard",
  looseFurniture: "standard",
  furnishings: "standard",
  appliances: "standard",
  artefacts: "none",
  totalCost: 0,
  categoryBreakdown: {
    construction: 0,
    core: 0,
    finishes: 0,
    interiors: 0,
    fees: 0,
  },
  phaseBreakdown: {
    planning: 0,
    construction: 0,
    interiors: 0,
    landscape: 0,
  },
  timeline: {
    totalMonths: 0,
    phases: {
      planning: 0,
      construction: 0,
      interiors: 0,
      landscape: 0,
    },
  },
};

export const EstimatorProvider = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = useState(1);
  const [estimate, setEstimate] = useState<ProjectEstimate>(initialEstimate);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const totalSteps = 5;

  // Get location multiplier
  const getLocationMultiplier = useCallback((city: string): number => {
    return LOCATION_MULTIPLIERS[city] || LOCATION_MULTIPLIERS["default"];
  }, []);

  // Get project type multiplier
  const getProjectTypeMultiplier = useCallback((projectType: string, complexity: number): number => {
    // Kept modest because the typology cost difference is mostly already carried
    // by BASE_CONSTRUCTION_COST (residential 17k vs commercial 20k vs mixed-use
    // 23k per sqm). This is the residual premium for commercial/mixed-use
    // systems & compliance, not the whole gap, to avoid double-counting.
    let baseMultiplier = 1.0;

    if (projectType === "commercial") {
      baseMultiplier = 1.08;
    } else if (projectType === "mixed-use") {
      baseMultiplier = 1.15;
    }

    // Add complexity adjustment
    const complexityAdjustment = (complexity - 5) * 0.05;
    return baseMultiplier * (1 + complexityAdjustment);
  }, []);

  // COA (Council of Architecture) minimum scale of professional charges, per the
  // Architects (Professional Conduct) Regulations, 1989:
  //   - Individual residential house & interior architecture: 7.5% of cost of works
  //   - Housing blocks (single block / sites up to 0.5 ha), commercial &
  //     other non-housing buildings: 5.0%
  // Documentation & communication charges (a further 10% of the professional
  // fee) are added separately in the main calculation, also per COA.
  const getArchitectFeeRate = useCallback((
    projectType: string,
    constructionSubtype?: string
  ): number => {
    if (projectType === "commercial" || projectType === "mixed-use") return 0.05;
    if (projectType === "residential" && constructionSubtype === "apartment") return 0.05;
    return 0.075; // individual house / interior architecture
  }, []);

  // Get size-based cost multiplier
  const getSizeMultiplier = useCallback((areaInSqM: number): number => {
    if (areaInSqM < 50) return 1.20; // Very small projects - high fixed costs
    if (areaInSqM < 100) return 1.12; // Small projects - limited economies
    if (areaInSqM < 200) return 1.05; // Medium projects - moderate scale
    if (areaInSqM >= 500) return 0.95; // Large projects - economies of scale
    return 1.0; // Standard size (200-500 sqm)
  }, []);

  // Calculate construction cost
  const calculateConstructionCost = useCallback((
    projectType: string,
    areaInSqM: number,
    civilQuality: ComponentOption
  ): number => {
    const baseCost = BASE_CONSTRUCTION_COST[projectType] || BASE_CONSTRUCTION_COST.residential;

    // Quality multiplier for the structural shell. Deliberately gentle: per
    // architects4design's BOQ split, structure (RCC/steel/masonry) is ~48% of
    // construction cost and rises only modestly with quality (better concrete
    // grade, a little more steel). The dramatic luxury premium lives in the
    // finishes/MEP components, not the shell — so this stays near 1x.
    let qualityMultiplier = 1.0;
    if (civilQuality === "premium") qualityMultiplier = 1.25;
    else if (civilQuality === "luxury") qualityMultiplier = 1.5;
    else if (civilQuality === "none") qualityMultiplier = 0; // Interior-only projects

    // Size-based adjustment
    const sizeMultiplier = getSizeMultiplier(areaInSqM);

    return baseCost * areaInSqM * qualityMultiplier * sizeMultiplier;
  }, [getSizeMultiplier]);

  // Calculate component costs
  const calculateComponentCosts = useCallback((
    estimate: ProjectEstimate,
    areaInSqM: number
  ): { core: number; finishes: number; interiors: number } => {
    // Get size multiplier for accurate pricing
    const sizeMultiplier = getSizeMultiplier(areaInSqM);

    // Check work types to determine which components should be included
    const hasConstruction = estimate.workTypes?.includes("construction") ?? false;
    const hasInteriors = estimate.workTypes?.includes("interiors") ?? false;

    // Calculate core costs - civil quality only for construction projects
    const civilQualityCost = hasConstruction
      ? COMPONENT_PRICING.civilQuality[estimate.civilQuality] * areaInSqM * 0.15
      : 0;

    const core = [
      civilQualityCost,
      COMPONENT_PRICING.plumbing[estimate.plumbing] * areaInSqM,
      COMPONENT_PRICING.electrical[estimate.electrical] * areaInSqM,
      COMPONENT_PRICING.ac[estimate.ac] * areaInSqM,
      COMPONENT_PRICING.elevator[estimate.elevator] * areaInSqM,
    ].reduce((sum, cost) => sum + cost, 0);

    // Calculate finishes - building envelope only for construction projects
    const buildingEnvelopeCost = hasConstruction
      ? COMPONENT_PRICING.buildingEnvelope[estimate.buildingEnvelope] * areaInSqM
      : 0;

    const windowsCost = hasConstruction
      ? COMPONENT_PRICING.windows[estimate.windows] * areaInSqM
      : 0;

    const finishes = [
      buildingEnvelopeCost,
      COMPONENT_PRICING.lighting[estimate.lighting] * areaInSqM,
      windowsCost,
      COMPONENT_PRICING.ceiling[estimate.ceiling] * areaInSqM,
      COMPONENT_PRICING.surfaces[estimate.surfaces] * areaInSqM,
    ].reduce((sum, cost) => sum + cost, 0);

    // Only include interior costs if "interiors" work type is selected
    const interiors = hasInteriors ? [
      COMPONENT_PRICING.fixedFurniture[estimate.fixedFurniture] * areaInSqM,
      COMPONENT_PRICING.looseFurniture[estimate.looseFurniture] * areaInSqM,
      COMPONENT_PRICING.furnishings[estimate.furnishings] * areaInSqM,
      COMPONENT_PRICING.appliances[estimate.appliances] * areaInSqM,
      COMPONENT_PRICING.artefacts[estimate.artefacts] * areaInSqM,
    ].reduce((sum, cost) => sum + cost, 0) : 0;

    // Apply size multiplier to all components
    return {
      core: core * sizeMultiplier,
      finishes: finishes * sizeMultiplier,
      interiors: interiors * sizeMultiplier
    };
  }, [getSizeMultiplier]);

  // Calculate timeline
  const calculateTimeline = useCallback((
    estimate: ProjectEstimate
  ) => {
    // Convert to approximate building size units
    const sizeUnits = estimate.area / (estimate.areaUnit === "sqft" ? 1000 : 100);

    // Check if this is an interior-only project
    const isInteriorOnly = estimate.workTypes?.includes("interiors") &&
                          !estimate.workTypes?.includes("construction") &&
                          !estimate.workTypes?.includes("landscape");
    const isLandscapeOnly = estimate.workTypes?.includes("landscape") &&
                            !estimate.workTypes?.includes("construction") &&
                            !estimate.workTypes?.includes("interiors");
    const hasConstruction = estimate.workTypes?.includes("construction");
    const hasInteriors = estimate.workTypes?.includes("interiors");
    const hasLandscape = estimate.workTypes?.includes("landscape");

    // Base timeline in months
    let planningMonths = 2;
    let constructionMonths = hasConstruction ? 6 : 0;
    let interiorsMonths = hasInteriors ? 2 : 0;
    let landscapeMonths = hasLandscape ? 3 : 0;

    // For interior-only projects, reduce planning time
    if (isInteriorOnly) {
      planningMonths = 1;
      constructionMonths = 0;
      interiorsMonths = 3; // More time for detailed interior work
      landscapeMonths = 0;
    }

    // For landscape-only projects, adjust timeline
    if (isLandscapeOnly) {
      planningMonths = 1;
      constructionMonths = 0;
      interiorsMonths = 0;
      landscapeMonths = 3; // Base landscape work duration
    }

    // Project type adjustment (only if construction is involved)
    if (hasConstruction) {
      if (estimate.projectType === "commercial") {
        planningMonths += 1;
        constructionMonths += 2;
        interiorsMonths += hasInteriors ? 1 : 0;
      } else if (estimate.projectType === "mixed-use") {
        planningMonths += 2;
        constructionMonths += 4;
        interiorsMonths += hasInteriors ? 1 : 0;
      }
    }

    // Area adjustment (add time for larger projects)
    const areaAddition = Math.floor(sizeUnits / 2);
    if (hasConstruction) {
      constructionMonths += areaAddition;
    }
    if (hasInteriors) {
      interiorsMonths += Math.floor(areaAddition / 2);
    }
    if (hasLandscape) {
      landscapeMonths += Math.floor(areaAddition / 3);
    }

    // Quality level adjustments - premium and luxury projects take longer
    const qualityMultiplier = (() => {
      const components = [
        estimate.civilQuality,
        estimate.plumbing,
        estimate.electrical,
        estimate.ac,
        estimate.buildingEnvelope,
        estimate.lighting,
        estimate.windows,
        estimate.ceiling,
        estimate.surfaces,
        estimate.fixedFurniture,
        estimate.looseFurniture,
        estimate.furnishings,
        estimate.appliances,
      ];

      const luxuryCount = components.filter(c => c === 'luxury').length;
      const premiumCount = components.filter(c => c === 'premium').length;

      // Each luxury component adds 3% to timeline, premium adds 1.5%
      return 1 + (luxuryCount * 0.03) + (premiumCount * 0.015);
    })();

    // Apply quality multiplier
    if (hasConstruction) {
      constructionMonths = constructionMonths * qualityMultiplier;
    }
    if (hasInteriors) {
      interiorsMonths = interiorsMonths * qualityMultiplier;
    }
    if (hasLandscape) {
      landscapeMonths = landscapeMonths * qualityMultiplier;
    }

    // Complexity adjustment
    const complexityFactor = 1 + ((estimate.complexity - 5) * 0.1);
    if (hasConstruction) {
      constructionMonths = Math.ceil(constructionMonths * complexityFactor);
    }
    if (hasInteriors) {
      interiorsMonths = Math.ceil(interiorsMonths * complexityFactor);
    }
    if (hasLandscape) {
      landscapeMonths = Math.ceil(landscapeMonths * complexityFactor);
    }

    // Ensure minimum values
    planningMonths = Math.max(1, Math.round(planningMonths));
    constructionMonths = hasConstruction ? Math.max(3, Math.round(constructionMonths)) : 0;
    interiorsMonths = hasInteriors ? Math.max(1, Math.round(interiorsMonths)) : 0;
    landscapeMonths = hasLandscape ? Math.max(2, Math.round(landscapeMonths)) : 0;

    return {
      totalMonths: planningMonths + constructionMonths + interiorsMonths + landscapeMonths,
      phases: {
        planning: planningMonths,
        construction: constructionMonths,
        interiors: interiorsMonths,
        landscape: landscapeMonths,
      },
    };
  }, []);

  // Main calculation function
  const calculateFullEstimate = useCallback((currentEstimate: ProjectEstimate): ProjectEstimate => {
    // Convert area to square meters for calculation
    let baseAreaInSqM = currentEstimate.areaUnit === "sqft"
      ? currentEstimate.area * 0.092903
      : currentEstimate.area;

    // Calculate effective area for cost estimation based on area input type
    let areaInSqM: number;
    if (currentEstimate.areaInputType === "plot") {
      // Plot area must be converted to built-up area before pricing. Prefer the
      // FSI-derived built-up value; if it hasn't been computed yet, fall back to
      // plot × floorCount rather than pricing the raw plot area (which would be
      // wildly low — a plot is not the same as built-up space).
      areaInSqM = currentEstimate.builtUpArea
        ? currentEstimate.builtUpArea
        : baseAreaInSqM * (currentEstimate.floorCount || 1);
    } else if (currentEstimate.areaInputType === "plinth" && currentEstimate.floorCount) {
      // For plinth area, multiply by floor count to get total built-up area
      areaInSqM = baseAreaInSqM * currentEstimate.floorCount;
    } else {
      // For built-up area or default, use as-is (area is already total across all floors)
      areaInSqM = baseAreaInSqM;
    }

    // Work-type flags
    const hasConstruction = currentEstimate.workTypes?.includes("construction") ?? false;
    const hasInteriors = currentEstimate.workTypes?.includes("interiors") ?? false;
    const hasLandscape = currentEstimate.workTypes?.includes("landscape") ?? false;
    const isInteriorsOnly = hasInteriors && !hasConstruction && !hasLandscape;
    const isLandscapeOnly = hasLandscape && !hasConstruction && !hasInteriors;

    // 1. Base construction cost — only when construction is in scope (otherwise an
    //    interior-only project would be charged a full shell it isn't building).
    const constructionCost = hasConstruction
      ? calculateConstructionCost(
          currentEstimate.projectType,
          areaInSqM,
          currentEstimate.civilQuality
        )
      : 0;

    // 2. Component costs
    const { core, finishes, interiors } = calculateComponentCosts(currentEstimate, areaInSqM);

    // 3. Subtotal before adjustments
    const baseSubtotal = constructionCost + core + finishes + interiors;

    // 4. Location + project-type/complexity multipliers
    const locationMultiplier = getLocationMultiplier(currentEstimate.city);
    const projectMultiplier = getProjectTypeMultiplier(
      currentEstimate.projectType,
      currentEstimate.complexity
    );
    const combinedMultiplier = locationMultiplier * projectMultiplier;
    const subtotal = baseSubtotal * combinedMultiplier;

    // 5. Professional fees — COA minimum scale of charges. The architectural fee
    //    rate varies by project type (7.5% individual house / interiors, 5% for
    //    apartment blocks, commercial & mixed-use), plus COA's documentation &
    //    communication charge of a further 10% of the professional fee.
    const architectFeeRate = getArchitectFeeRate(
      currentEstimate.projectType,
      currentEstimate.constructionSubtype
    );
    const architecturalFees = subtotal * architectFeeRate;
    const documentationFees = architecturalFees * 0.10;
    const professionalFees = architecturalFees + documentationFees;

    // 6. Contingency (5%)
    const contingency = subtotal * 0.05;

    // 7. GST — per COA, professional fees get 18% GST, construction/contingency get 6%
    const feeGst = professionalFees * 0.18;
    const constructionGst = (subtotal + contingency) * 0.06;
    const totalGst = feeGst + constructionGst;

    // 8. Final total cost
    const totalCost = subtotal + professionalFees + contingency + totalGst;

    // 9. Category breakdown. Scale each work category by the same multiplier so
    //     the four categories sum to `subtotal`, then add a fifth "fees" bucket
    //     (professional fees + contingency + GST). All five sum to totalCost, so
    //     every chart/percentage derived from them reconciles to the headline.
    const overheads = professionalFees + contingency + totalGst; // = totalCost - subtotal
    const constructionScaled = constructionCost * combinedMultiplier;
    const coreScaled = core * combinedMultiplier;
    const finishesScaled = finishes * combinedMultiplier;
    const interiorsScaled = interiors * combinedMultiplier;

    // 11. Phase breakdown. Distribute the whole total across active phases so
    //     planning + construction + interiors + landscape === totalCost exactly.
    const planningCost = totalCost * 0.08;
    const buildBudget = totalCost - planningCost;
    const wConstruction = hasConstruction ? constructionScaled + coreScaled + finishesScaled : 0;
    const wInteriors = hasInteriors ? interiorsScaled : 0;
    // Landscape isn't priced as its own category; weight it so the phase shows a
    // share when combined with other work, or the whole build budget when alone.
    const wLandscape = hasLandscape
      ? (isLandscapeOnly ? Math.max(subtotal, 1) : subtotal * 0.15)
      : 0;
    const wSum = wConstruction + wInteriors + wLandscape;
    const constructionPhaseCost = wSum ? (buildBudget * wConstruction) / wSum : 0;
    const interiorsPhaseCost = wSum ? (buildBudget * wInteriors) / wSum : 0;
    const landscapePhaseCost = wSum ? (buildBudget * wLandscape) / wSum : 0;

    // 12. Timeline
    const timeline = calculateTimeline(currentEstimate);

    return {
      ...currentEstimate,
      totalCost: Math.round(totalCost),
      categoryBreakdown: {
        construction: Math.round(constructionScaled),
        core: Math.round(coreScaled),
        finishes: Math.round(finishesScaled),
        interiors: Math.round(interiorsScaled),
        fees: Math.round(overheads),
      },
      phaseBreakdown: {
        planning: Math.round(planningCost),
        construction: Math.round(constructionPhaseCost),
        interiors: Math.round(interiorsPhaseCost),
        landscape: Math.round(landscapePhaseCost),
      },
      timeline,
    };
  }, [calculateConstructionCost, calculateComponentCosts, getLocationMultiplier, getProjectTypeMultiplier, getArchitectFeeRate, calculateTimeline]);

  // Auto-adjust component selections based on work types
  useEffect(() => {
    if (estimate.workTypes && estimate.workTypes.length > 0) {
      const hasInteriors = estimate.workTypes.includes("interiors");
      const hasConstruction = estimate.workTypes.includes("construction");

      // If interiors is not selected, set all interior components to "none"
      if (!hasInteriors) {
        setEstimate(prev => ({
          ...prev,
          fixedFurniture: "none",
          looseFurniture: "none",
          furnishings: "none",
          appliances: "none",
          artefacts: "none",
        }));
      } else if (hasInteriors) {
        // Interiors is selected — restore any components that a previous
        // "no interiors" pass had forced to "none" (e.g. when construction was
        // picked before interiors). Without this, adding interiors after
        // construction leaves them at "none" and interiors cost stays ₹0.
        setEstimate(prev => ({
          ...prev,
          fixedFurniture: prev.fixedFurniture === "none" ? "standard" : prev.fixedFurniture,
          looseFurniture: prev.looseFurniture === "none" ? "standard" : prev.looseFurniture,
          furnishings: prev.furnishings === "none" ? "standard" : prev.furnishings,
          appliances: prev.appliances === "none" ? "standard" : prev.appliances,
        }));
      }

      // If construction is not selected, set civil quality to "none"
      if (!hasConstruction) {
        setEstimate(prev => ({
          ...prev,
          civilQuality: "none",
          buildingEnvelope: "none",
          windows: "none",
        }));
      } else if (hasConstruction && estimate.civilQuality === "none") {
        // If construction is newly added and civil quality is "none", restore to standard
        setEstimate(prev => ({
          ...prev,
          civilQuality: "standard",
          buildingEnvelope: prev.buildingEnvelope === "none" ? "standard" : prev.buildingEnvelope,
          windows: prev.windows === "none" ? "standard" : prev.windows,
          plumbing: prev.plumbing === "none" ? "standard" : prev.plumbing,
          electrical: prev.electrical === "none" ? "standard" : prev.electrical,
        }));
      }
    }
  }, [estimate.workTypes]);

  // Recalculate whenever relevant fields change
  useEffect(() => {
    if (estimate.area > 0 && estimate.projectType && estimate.city) {
      const updatedEstimate = calculateFullEstimate(estimate);
      setEstimate(updatedEstimate);
    }
  }, [
    estimate.area,
    estimate.areaUnit,
    estimate.projectType,
    estimate.city,
    estimate.complexity,
    estimate.civilQuality,
    estimate.plumbing,
    estimate.electrical,
    estimate.ac,
    estimate.elevator,
    estimate.buildingEnvelope,
    estimate.lighting,
    estimate.windows,
    estimate.ceiling,
    estimate.surfaces,
    estimate.fixedFurniture,
    estimate.looseFurniture,
    estimate.furnishings,
    estimate.appliances,
    estimate.artefacts,
  ]);

  const updateEstimate = useCallback((key: keyof ProjectEstimate, value: any) => {
    setEstimate((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleOptionChange = useCallback((component: string, option: ComponentOption) => {
    updateEstimate(component as keyof ProjectEstimate, option);
  }, [updateEstimate]);

  const validateStep = useCallback((currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!estimate.state || !estimate.city) {
          toast({
            title: "Location Required",
            description: "Please select your project location.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 2:
        if (!estimate.projectType) {
          toast({
            title: "Project Type Required",
            description: "Please select your project type.",
            variant: "destructive",
          });
          return false;
        }
        if (!estimate.workTypes || estimate.workTypes.length === 0) {
          toast({
            title: "Work Type Required",
            description: "Please select at least one type of work for your project.",
            variant: "destructive",
          });
          return false;
        }
        // Validate conditional fields
        if (estimate.projectType === "residential" && !estimate.roomConfiguration) {
          toast({
            title: "Room Configuration Required",
            description: "Please select the room configuration for your residential project.",
            variant: "destructive",
          });
          return false;
        }
        if (estimate.workTypes.includes("landscape") && (!estimate.landscapeAreas || estimate.landscapeAreas.length === 0)) {
          toast({
            title: "Landscape Area Required",
            description: "Please select at least one landscape area.",
            variant: "destructive",
          });
          return false;
        }
        // Validate construction-specific fields
        if (estimate.projectType === "residential" && estimate.workTypes.includes("construction")) {
          if (!estimate.constructionSubtype) {
            toast({
              title: "Construction Type Required",
              description: "Please select whether you're building a house or apartment.",
              variant: "destructive",
            });
            return false;
          }
          if (!estimate.floorCount || estimate.floorCount < 1) {
            toast({
              title: "Floor Count Required",
              description: "Please specify the number of floors.",
              variant: "destructive",
            });
            return false;
          }
          if (!estimate.areaInputType) {
            toast({
              title: "Area Type Required",
              description: "Please select the type of area you'll provide (plot area, plinth area, or built-up area).",
              variant: "destructive",
            });
            return false;
          }
        }
        // Validate interiors-specific fields (only for interiors-only projects)
        if (estimate.workTypes.includes("interiors") && !estimate.workTypes.includes("construction")) {
          if (!estimate.floorCount || estimate.floorCount < 1) {
            toast({
              title: "Floor Count Required",
              description: "Please specify the number of floors in your building.",
              variant: "destructive",
            });
            return false;
          }
          if (!estimate.areaInputType) {
            toast({
              title: "Area Input Type Required",
              description: "Please select whether you'll provide plinth area (ground floor) or built-up area (total across all floors).",
              variant: "destructive",
            });
            return false;
          }
        }
        break;
      case 3:
        if (estimate.area <= 0) {
          toast({
            title: "Area Required",
            description: "Please enter a valid project area.",
            variant: "destructive",
          });
          return false;
        }
        // Validate reasonable area ranges
        const maxArea = estimate.areaUnit === "sqft" ? 50000 : 4645;
        if (estimate.area > maxArea) {
          toast({
            title: "Large Project",
            description: "Very large projects may require custom estimation. Please contact us for accurate pricing.",
          });
        }
        // Validate FSI compliance for houses with plot area
        if (estimate.constructionSubtype === "house" &&
            estimate.areaInputType === "plot" &&
            estimate.fsiCompliant === false) {
          toast({
            title: "FSI Violation",
            description: "The number of floors exceeds the FSI limit for your city. Please reduce floors or increase plot area.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 4:
        // Validate components based on work types
        const hasConstruction = estimate.workTypes?.includes("construction");
        const hasInteriors = estimate.workTypes?.includes("interiors");

        // For construction projects, require civil quality
        if (hasConstruction && (!estimate.civilQuality || estimate.civilQuality === 'none')) {
          toast({
            title: "Civil Quality Required",
            description: "Please select civil materials quality for construction projects.",
            variant: "destructive",
          });
          return false;
        }

        // For interiors-only projects, require at least some selection
        // (plumbing and electrical are optional for pure interior design)
        const isInteriorsOnly = hasInteriors && !hasConstruction && !estimate.workTypes?.includes("landscape");
        if (isInteriorsOnly) {
          // Check if at least some interior components are selected
          const hasAnyInteriorSelection = [
            estimate.fixedFurniture,
            estimate.looseFurniture,
            estimate.furnishings,
            estimate.appliances
          ].some(c => c && c !== 'none');

          if (!hasAnyInteriorSelection) {
            toast({
              title: "Interior Components Required",
              description: "Please select at least one interior component for your interiors-only project.",
              variant: "destructive",
            });
            return false;
          }
        }

        // Warn about quality mismatches for construction projects
        if (hasConstruction && estimate.civilQuality === "luxury" &&
            (estimate.plumbing === "standard" || estimate.electrical === "standard")) {
          toast({
            title: "Quality Mismatch",
            description: "Consider upgrading other components to match luxury civil quality for consistency.",
          });
        }
        break;
    }
    return true;
  }, [estimate, toast]);

  const handleNext = useCallback(() => {
    if (!validateStep(step)) return;

    if (step < totalSteps) {
      if (step === 4) {
        // Calculate final estimate before showing results
        setIsCalculating(true);
        setTimeout(() => {
          const finalEstimate = calculateFullEstimate(estimate);
          setEstimate(finalEstimate);
          setIsCalculating(false);
          setStep(5);
        }, 1000);
      } else {
        setStep(step + 1);
      }
    }
  }, [step, estimate, validateStep, calculateFullEstimate]);

  const handlePrevious = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleReset = useCallback(() => {
    setEstimate(initialEstimate);
    setStep(1);
    toast({
      title: "Estimate Reset",
      description: "Starting a new estimate.",
    });
  }, [toast]);

  const handleSaveEstimate = useCallback(() => {
    // Save to localStorage
    const savedEstimates = JSON.parse(localStorage.getItem("savedEstimates") || "[]");
    const newEstimate = {
      ...estimate,
      savedAt: new Date().toISOString(),
      id: Date.now().toString(),
    };
    savedEstimates.push(newEstimate);
    localStorage.setItem("savedEstimates", JSON.stringify(savedEstimates));
    
    toast({
      title: "Estimate Saved",
      description: "Your estimate has been saved successfully.",
    });
  }, [estimate, toast]);

  return (
    <EstimatorContext.Provider
      value={{
        step,
        totalSteps,
        estimate,
        isCalculating,
        setStep,
        updateEstimate,
        handleNext,
        handlePrevious,
        handleReset,
        handleSaveEstimate,
        handleOptionChange,
      }}
    >
      {children}
    </EstimatorContext.Provider>
  );
};

export const useEstimator = () => {
  const context = useContext(EstimatorContext);
  if (!context) {
    throw new Error("useEstimator must be used within EstimatorProvider");
  }
  return context;
};
