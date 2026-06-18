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

// Location-based cost multipliers
const LOCATION_MULTIPLIERS: Record<string, number> = {
  // Tier 1 Cities - High cost
  "Mumbai": 1.30,
  "Navi Mumbai": 1.25,
  "Thane": 1.22,
  "Delhi": 1.25,
  "New Delhi": 1.25,
  "Gurgaon": 1.28,
  "Noida": 1.22,
  "Bangalore": 1.20,
  "Bengaluru": 1.20,
  "Hyderabad": 1.15,
  "Chennai": 1.15,
  "Pune": 1.15,
  
  // Tier 2 Cities - Medium cost
  "Ahmedabad": 1.10,
  "Surat": 1.08,
  "Jaipur": 1.10,
  "Kochi": 1.05,
  "Coimbatore": 1.05,
  "Indore": 1.05,
  "Chandigarh": 1.12,
  "Lucknow": 1.02,
  "Visakhapatnam": 1.00,
  "Nagpur": 1.00,
  "Vadodara": 1.05,
  
  // Tier 3 and others - Base cost
  "default": 0.95
};

// Component pricing per square meter (in INR)
// Updated based on 2025 market research: Premium interiors ₹1,500-3,000/sqft, Luxury ₹2,500-4,000/sqft
const COMPONENT_PRICING: Record<string, Record<ComponentOption, number>> = {
  // Core Construction Components (realistic market rates)
  civilQuality: { none: 0, standard: 300, premium: 700, luxury: 1400 },
  plumbing: { none: 0, standard: 500, premium: 1500, luxury: 3500 }, // Premium fixtures ₹140/sqft
  electrical: { none: 0, standard: 400, premium: 1200, luxury: 2800 }, // Premium wiring & switches ₹112/sqft
  ac: { none: 0, standard: 800, premium: 2200, luxury: 5000 }, // Split/VRV systems
  elevator: { none: 0, standard: 750, premium: 1300, luxury: 2300 },

  // Finishes & Envelope (updated to 2025 market rates)
  buildingEnvelope: { none: 0, standard: 150, premium: 400, luxury: 900 },
  lighting: { none: 0, standard: 400, premium: 1200, luxury: 3000 }, // Designer lighting ₹112/sqft premium
  windows: { none: 0, standard: 500, premium: 1500, luxury: 3500 }, // uPVC/aluminum premium ₹140/sqft
  ceiling: { none: 0, standard: 350, premium: 1000, luxury: 2500 }, // False ceiling ₹93/sqft premium
  surfaces: { none: 0, standard: 600, premium: 1800, luxury: 4000 }, // Premium tiles/marble ₹167/sqft

  // Interior Components (realistic 2025 rates - modular kitchen ₹2000-3500/sqft, wardrobes ₹65k+)
  fixedFurniture: { none: 0, standard: 3000, premium: 8000, luxury: 15000 }, // Kitchen, wardrobes, TV units ₹745/sqft
  looseFurniture: { none: 0, standard: 2000, premium: 5000, luxury: 12000 }, // Sofas, beds, dining ₹465/sqft
  furnishings: { none: 0, standard: 500, premium: 2000, luxury: 4000 }, // Curtains, blinds, soft furnishings ₹186/sqft
  appliances: { none: 0, standard: 1000, premium: 3500, luxury: 8000 }, // Built-in appliances, chimney, hob ₹325/sqft
  artefacts: { none: 0, standard: 300, premium: 1500, luxury: 3500 }, // Decor, art, lighting fixtures ₹140/sqft
};

// Base construction cost per square meter - aligned with market rates
// Based on architects4design.com: ₹1,300-₹1,900/sqft = ₹13,993-₹20,451/sqm
// This represents COMPLETE construction at each quality level (shell + finishes + basic MEP)
const BASE_CONSTRUCTION_COST: Record<string, number> = {
  residential: 15000,   // ₹15,000/sqm (₹1,393/sqft) - standard complete construction
  commercial: 18000,    // ₹18,000/sqm for commercial projects
  "mixed-use": 21000,   // ₹21,000/sqm for mixed-use developments
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
    let baseMultiplier = 1.0;
    
    if (projectType === "commercial") {
      baseMultiplier = 1.15;
    } else if (projectType === "mixed-use") {
      baseMultiplier = 1.25;
    }
    
    // Add complexity adjustment
    const complexityAdjustment = (complexity - 5) * 0.05;
    return baseMultiplier * (1 + complexityAdjustment);
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

    // Quality multiplier for construction
    let qualityMultiplier = 1.0;
    if (civilQuality === "premium") qualityMultiplier = 1.6;
    else if (civilQuality === "luxury") qualityMultiplier = 2.8;
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
    if (currentEstimate.areaInputType === "plot" && currentEstimate.builtUpArea) {
      // For plot area, use the calculated built-up area from FSI validation (already in sqm)
      areaInSqM = currentEstimate.builtUpArea;
    } else if (currentEstimate.areaInputType === "plinth" && currentEstimate.floorCount) {
      // For plinth area, multiply by floor count to get total built-up area
      areaInSqM = baseAreaInSqM * currentEstimate.floorCount;
    } else {
      // For built-up area or default, use as-is (area is already total across all floors)
      areaInSqM = baseAreaInSqM;
    }

    // 1. Calculate base construction cost
    const constructionCost = calculateConstructionCost(
      currentEstimate.projectType,
      areaInSqM,
      currentEstimate.civilQuality
    );

    // 2. Calculate component costs
    const { core, finishes, interiors } = calculateComponentCosts(currentEstimate, areaInSqM);

    // 3. Calculate subtotal before adjustments
    let subtotal = constructionCost + core + finishes + interiors;

    // 4. Apply location multiplier
    const locationMultiplier = getLocationMultiplier(currentEstimate.city);
    subtotal *= locationMultiplier;

    // 5. Apply project type and complexity multiplier
    const projectMultiplier = getProjectTypeMultiplier(
      currentEstimate.projectType,
      currentEstimate.complexity
    );
    subtotal *= projectMultiplier;

    // 6. Add professional fees - aligned with COA (Council of Architecture) guidelines
    // For Individual Houses: 7.5% architectural services + 0.75% documentation (10% of 7.5%)
    const architecturalFees = subtotal * 0.075; // 7.5% COA standard for individual houses
    const documentationFees = architecturalFees * 0.10; // 10% of architectural fees
    const professionalFees = architecturalFees + documentationFees; // Total: 8.25%

    // 7. Add contingency - aligned with architects4design.com
    const contingency = subtotal * 0.05; // 5% (they recommend 5-10%)

    // 8. Calculate total before tax
    const totalBeforeTax = subtotal + professionalFees + contingency;

    // 9. Add GST (effective rate after deductions and exemptions)
    const gst = totalBeforeTax * 0.06; // 6% effective (lower than statutory 12% due to input credits)

    // 10. Final total cost
    const totalCost = totalBeforeTax + gst;

    // 11. Calculate phase breakdown
    // Check project work types
    const isInteriorsOnly = currentEstimate.workTypes?.includes("interiors") &&
                           !currentEstimate.workTypes?.includes("construction") &&
                           !currentEstimate.workTypes?.includes("landscape");
    const isLandscapeOnly = currentEstimate.workTypes?.includes("landscape") &&
                           !currentEstimate.workTypes?.includes("construction") &&
                           !currentEstimate.workTypes?.includes("interiors");
    const hasConstruction = currentEstimate.workTypes?.includes("construction");
    const hasLandscape = currentEstimate.workTypes?.includes("landscape");

    const planningCost = totalCost * 0.08;

    // Distribute remaining cost proportionally across phases
    const remainingCost = totalCost - planningCost;

    // Count active work types
    const workTypeCount = [hasConstruction, currentEstimate.workTypes?.includes("interiors"), hasLandscape].filter(Boolean).length;

    const constructionPhaseCost = hasConstruction
      ? constructionCost + (core * 0.6) + (professionalFees * 0.5 / workTypeCount)
      : 0;

    const landscapePhaseCost = hasLandscape
      ? (isLandscapeOnly ? remainingCost : (totalCost * 0.15)) // 15% of total for landscape when combined
      : 0;

    const interiorsPhaseCost = isInteriorsOnly
      ? totalCost - planningCost
      : (currentEstimate.workTypes?.includes("interiors")
          ? interiors + finishes + (core * 0.4) + (professionalFees * 0.5 / workTypeCount) + (hasLandscape ? 0 : contingency + gst)
          : 0);

    // 12. Calculate timeline
    const timeline = calculateTimeline(currentEstimate);

    return {
      ...currentEstimate,
      totalCost: Math.round(totalCost),
      categoryBreakdown: {
        construction: hasConstruction ? Math.round(constructionCost) : 0,
        core: Math.round(core),
        finishes: Math.round(finishes),
        interiors: Math.round(interiors),
      },
      phaseBreakdown: {
        planning: Math.round(planningCost),
        construction: hasConstruction ? Math.round(constructionPhaseCost) : 0,
        interiors: Math.round(interiorsPhaseCost),
        landscape: hasLandscape ? Math.round(landscapePhaseCost) : 0,
      },
      timeline,
    };
  }, [calculateConstructionCost, calculateComponentCosts, getLocationMultiplier, getProjectTypeMultiplier, calculateTimeline]);

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
      } else if (hasInteriors && estimate.fixedFurniture === undefined) {
        // If interiors is newly added and components are not set, set sensible defaults
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
