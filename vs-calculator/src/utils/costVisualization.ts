import { ProjectEstimate } from "@/types/estimator";

// Subcategory distribution ratios
const CORE_DISTRIBUTION = {
  civilQuality: 0.20,
  plumbing: 0.25,
  electrical: 0.25,
  ac: 0.20,
  elevator: 0.10,
};

const FINISHES_DISTRIBUTION = {
  buildingEnvelope: 0.20,
  lighting: 0.15,
  windows: 0.30,
  ceiling: 0.10,
  surfaces: 0.25,
};

const INTERIORS_DISTRIBUTION = {
  fixedFurniture: 0.40,
  looseFurniture: 0.30,
  furnishings: 0.10,
  appliances: 0.15,
  artefacts: 0.05,
};

const CONSTRUCTION_PHASES_DISTRIBUTION = {
  foundation: 0.15,
  rccStructure: 0.45,
  masonry: 0.25,
  roofing: 0.10,
  finishing: 0.05,
};

interface CostBreakdownItem {
  name: string;
  size: number;
  percentage: number;
  description: string;
  duration?: number;
}

interface DetailedCostBreakdown {
  core: CostBreakdownItem[];
  finishes: CostBreakdownItem[];
  interiors: CostBreakdownItem[];
  constructionPhases: CostBreakdownItem[];
  totals: {
    core: number;
    finishes: number;
    interiors: number;
    construction: number;
  };
}

interface PhaseTimelineBreakdown {
  totalMonths: number;
  phases: Array<{
    name: string;
    duration: number;
    cost: number;
    percentage: number;
    activities: string[];
  }>;
}

interface CostPerSqFt {
  construction: number;
  core: number;
  finishes: number;
  interiors: number;
  total: number;
}

interface BenchmarkCategory {
  category: string;
  benchmarks: {
    [key: string]: {
      label: string;
      min: number;
      max: number;
    };
  };
  message: string;
}

/**
 * Get detailed cost breakdown with subcategories
 */
export const getDetailedCostBreakdown = (estimate: ProjectEstimate): DetailedCostBreakdown => {
  const { categoryBreakdown, totalCost } = estimate;

  // Core components breakdown
  const hasElevator = estimate.elevator !== "none";
  const coreDistribution = hasElevator
    ? CORE_DISTRIBUTION
    : {
        civilQuality: 0.22,
        plumbing: 0.28,
        electrical: 0.28,
        ac: 0.22,
        elevator: 0,
      };

  const core: CostBreakdownItem[] = [
    {
      name: "Civil Quality Materials",
      size: categoryBreakdown.core * coreDistribution.civilQuality,
      percentage: (categoryBreakdown.core * coreDistribution.civilQuality / totalCost) * 100,
      description: "Cement, steel, concrete, blocks, masonry work",
    },
    {
      name: "Plumbing & Sanitary",
      size: categoryBreakdown.core * coreDistribution.plumbing,
      percentage: (categoryBreakdown.core * coreDistribution.plumbing / totalCost) * 100,
      description: "Pipes, fixtures, drainage, water supply systems",
    },
    {
      name: "Electrical Systems",
      size: categoryBreakdown.core * coreDistribution.electrical,
      percentage: (categoryBreakdown.core * coreDistribution.electrical / totalCost) * 100,
      description: "Wiring, boards, switches, MCB, earthing",
    },
    {
      name: "AC & HVAC",
      size: categoryBreakdown.core * coreDistribution.ac,
      percentage: (categoryBreakdown.core * coreDistribution.ac / totalCost) * 100,
      description: "Air conditioning units, ducting, ventilation",
    },
  ];

  if (hasElevator) {
    core.push({
      name: "Elevator System",
      size: categoryBreakdown.core * coreDistribution.elevator,
      percentage: (categoryBreakdown.core * coreDistribution.elevator / totalCost) * 100,
      description: "Lift cabin, mechanism, controls, safety systems",
    });
  }

  // Finishes breakdown
  const finishes: CostBreakdownItem[] = [
    {
      name: "Building Envelope",
      size: categoryBreakdown.finishes * FINISHES_DISTRIBUTION.buildingEnvelope,
      percentage: (categoryBreakdown.finishes * FINISHES_DISTRIBUTION.buildingEnvelope / totalCost) * 100,
      description: "Facade, cladding, exterior finishes, insulation",
    },
    {
      name: "Lighting Fixtures",
      size: categoryBreakdown.finishes * FINISHES_DISTRIBUTION.lighting,
      percentage: (categoryBreakdown.finishes * FINISHES_DISTRIBUTION.lighting / totalCost) * 100,
      description: "Light fixtures, LED systems, outdoor lighting",
    },
    {
      name: "Windows & Doors",
      size: categoryBreakdown.finishes * FINISHES_DISTRIBUTION.windows,
      percentage: (categoryBreakdown.finishes * FINISHES_DISTRIBUTION.windows / totalCost) * 100,
      description: "Frames, glazing, main door, internal doors",
    },
    {
      name: "False Ceiling",
      size: categoryBreakdown.finishes * FINISHES_DISTRIBUTION.ceiling,
      percentage: (categoryBreakdown.finishes * FINISHES_DISTRIBUTION.ceiling / totalCost) * 100,
      description: "Gypsum, POP, acoustic panels, cove lighting",
    },
    {
      name: "Wall & Floor Surfaces",
      size: categoryBreakdown.finishes * FINISHES_DISTRIBUTION.surfaces,
      percentage: (categoryBreakdown.finishes * FINISHES_DISTRIBUTION.surfaces / totalCost) * 100,
      description: "Tiles, marble, granite, paint, finishes",
    },
  ];

  // Interiors breakdown
  const interiors: CostBreakdownItem[] = [
    {
      name: "Fixed Furniture",
      size: categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.fixedFurniture,
      percentage: (categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.fixedFurniture / totalCost) * 100,
      description: "Kitchen cabinets, wardrobes, vanities, shelving",
    },
    {
      name: "Loose Furniture",
      size: categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.looseFurniture,
      percentage: (categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.looseFurniture / totalCost) * 100,
      description: "Sofas, beds, dining sets, chairs, tables",
    },
    {
      name: "Soft Furnishings",
      size: categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.furnishings,
      percentage: (categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.furnishings / totalCost) * 100,
      description: "Curtains, rugs, bedding, cushions",
    },
    {
      name: "Appliances",
      size: categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.appliances,
      percentage: (categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.appliances / totalCost) * 100,
      description: "Kitchen appliances, electronics, smart devices",
    },
    {
      name: "Art & Artefacts",
      size: categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.artefacts,
      percentage: (categoryBreakdown.interiors * INTERIORS_DISTRIBUTION.artefacts / totalCost) * 100,
      description: "Artwork, sculptures, decorative pieces",
    },
  ];

  // Construction phases breakdown
  const constructionPhases: CostBreakdownItem[] = [
    {
      name: "Foundation & Earthwork",
      size: categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.foundation,
      percentage: (categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.foundation / totalCost) * 100,
      description: "Excavation, PCC, foundation, plinth",
      duration: Math.round(estimate.timeline.phases.construction * 0.15),
    },
    {
      name: "RCC Structure",
      size: categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.rccStructure,
      percentage: (categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.rccStructure / totalCost) * 100,
      description: "Columns, beams, slabs, reinforcement",
      duration: Math.round(estimate.timeline.phases.construction * 0.45),
    },
    {
      name: "Masonry Work",
      size: categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.masonry,
      percentage: (categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.masonry / totalCost) * 100,
      description: "Block work, brick work, internal walls",
      duration: Math.round(estimate.timeline.phases.construction * 0.25),
    },
    {
      name: "Roofing & Waterproofing",
      size: categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.roofing,
      percentage: (categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.roofing / totalCost) * 100,
      description: "Roof slab, waterproofing, terrace",
      duration: Math.round(estimate.timeline.phases.construction * 0.10),
    },
    {
      name: "Basic Finishes",
      size: categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.finishing,
      percentage: (categoryBreakdown.construction * CONSTRUCTION_PHASES_DISTRIBUTION.finishing / totalCost) * 100,
      description: "Plastering, basic electrical, plumbing rough-in",
      duration: Math.round(estimate.timeline.phases.construction * 0.05),
    },
  ];

  return {
    core,
    finishes,
    interiors,
    constructionPhases,
    totals: {
      core: categoryBreakdown.core,
      finishes: categoryBreakdown.finishes,
      interiors: categoryBreakdown.interiors,
      construction: categoryBreakdown.construction,
    },
  };
};

/**
 * Get phase timeline breakdown with activities
 */
export const getPhaseTimelineBreakdown = (estimate: ProjectEstimate): PhaseTimelineBreakdown => {
  const { timeline, phaseBreakdown } = estimate;

  const phases = [
    {
      name: "Planning & Approvals",
      duration: timeline.phases.planning,
      cost: phaseBreakdown.planning,
      percentage: (phaseBreakdown.planning / estimate.totalCost) * 100,
      activities: [
        "Architectural design & drawings",
        "Structural design",
        "BBMP/local authority approvals",
        "Contractor selection",
      ],
    },
    {
      name: "Construction Phase",
      duration: timeline.phases.construction,
      cost: phaseBreakdown.construction,
      percentage: (phaseBreakdown.construction / estimate.totalCost) * 100,
      activities: [
        "Foundation & earthwork",
        "RCC structure work",
        "Masonry & block work",
        "Roofing & waterproofing",
      ],
    },
    {
      name: "Finishing Work",
      duration: Math.round(timeline.phases.interiors * 0.6),
      cost: estimate.categoryBreakdown.finishes,
      percentage: (estimate.categoryBreakdown.finishes / estimate.totalCost) * 100,
      activities: [
        "Plastering & painting",
        "Flooring & tiling",
        "Windows & doors installation",
        "Electrical & plumbing finishing",
      ],
    },
    {
      name: "Interior Work",
      duration: Math.round(timeline.phases.interiors * 0.4),
      cost: estimate.categoryBreakdown.interiors,
      percentage: (estimate.categoryBreakdown.interiors / estimate.totalCost) * 100,
      activities: [
        "Modular kitchen installation",
        "Wardrobes & cabinetry",
        "Furniture & furnishings",
        "Final touch-ups & handover",
      ],
    },
  ];

  return {
    totalMonths: timeline.totalMonths,
    phases,
  };
};

/**
 * Calculate cost per square foot breakdown
 */
export const getCostPerSqFt = (estimate: ProjectEstimate): CostPerSqFt => {
  const area = estimate.area;

  return {
    construction: Math.round(estimate.categoryBreakdown.construction / area),
    core: Math.round(estimate.categoryBreakdown.core / area),
    finishes: Math.round(estimate.categoryBreakdown.finishes / area),
    interiors: Math.round(estimate.categoryBreakdown.interiors / area),
    total: Math.round(estimate.totalCost / area),
  };
};

/**
 * Get benchmark comparison based on Bangalore 2025 rates
 */
export const getBenchmarkComparison = (estimate: ProjectEstimate): BenchmarkCategory => {
  const costPerSqFt = getCostPerSqFt(estimate);
  const perSqFt = costPerSqFt.total;

  const benchmarks = {
    standard: {
      label: "Standard Quality",
      min: 1750,
      max: 1800,
    },
    premium: {
      label: "Premium Quality",
      min: 1850,
      max: 1950,
    },
    luxury: {
      label: "Luxury Quality",
      min: 2000,
      max: 2500,
    },
  };

  let category = "Standard";
  let message = "Cost-effective construction with good quality materials";

  if (perSqFt >= 2000) {
    category = "Luxury";
    message = "High-end construction with premium imported materials and finishes";
  } else if (perSqFt >= 1850) {
    category = "Premium";
    message = "Above-average quality with branded materials and better finishes";
  }

  return {
    category,
    benchmarks,
    message,
  };
};

/**
 * Generate summary text for the estimate
 */
export const generateSummaryText = (estimate: ProjectEstimate) => {
  const costPerSqFt = getCostPerSqFt(estimate);
  const benchmark = getBenchmarkComparison(estimate);
  const breakdown = getDetailedCostBreakdown(estimate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount).replace('₹', '₹');
  };

  const overview = `Your ${estimate.projectType} project in ${estimate.city} spanning ${estimate.area.toLocaleString()} ${estimate.areaUnit} is estimated at ${formatCurrency(estimate.totalCost)} (${formatCurrency(costPerSqFt.total)} per ${estimate.areaUnit}). This falls into the ${benchmark.category} category based on current Bangalore 2025 market rates.`;

  const categoryBreakdown = `The cost is distributed as follows: Construction work (${formatCurrency(estimate.categoryBreakdown.construction)} - ${((estimate.categoryBreakdown.construction / estimate.totalCost) * 100).toFixed(1)}%), Core systems (${formatCurrency(estimate.categoryBreakdown.core)} - ${((estimate.categoryBreakdown.core / estimate.totalCost) * 100).toFixed(1)}%), Finishes (${formatCurrency(estimate.categoryBreakdown.finishes)} - ${((estimate.categoryBreakdown.finishes / estimate.totalCost) * 100).toFixed(1)}%), and Interiors (${formatCurrency(estimate.categoryBreakdown.interiors)} - ${((estimate.categoryBreakdown.interiors / estimate.totalCost) * 100).toFixed(1)}%).`;

  const timeline = `The project timeline is estimated at ${estimate.timeline.totalMonths} months, including ${estimate.timeline.phases.planning} months for planning & approvals, ${estimate.timeline.phases.construction} months for construction, and ${estimate.timeline.phases.interiors} months for interiors & finishing.`;

  const keyInsights = [
    `Your project is classified as ${benchmark.category} quality tier`,
    `Construction phase (${estimate.timeline.phases.construction} months) is the longest duration`,
    `Core systems account for ${formatCurrency(estimate.categoryBreakdown.core)}, ensuring reliable infrastructure`,
    `Premium finishes and interiors add significant value to your property`,
    `Estimated at ₹${costPerSqFt.total}/sqft, aligned with ${estimate.city} 2025 market rates`,
  ];

  return {
    overview,
    categoryBreakdown,
    timeline,
    keyInsights,
  };
};
