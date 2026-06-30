// Component quality options
export type ComponentOption = "none" | "standard" | "premium" | "luxury";

// Category breakdown for cost visualization.
// All five fields are post-multiplier rupee amounts and sum to the headline
// totalCost, so charts/percentages derived from them reconcile to the total.
export interface CategoryBreakdown {
  construction: number;
  core: number;
  finishes: number;
  interiors: number;
  fees: number; // professional fees + contingency + GST
}

// Phase breakdown for project timeline
export interface PhaseBreakdown {
  planning: number;
  construction: number;
  interiors: number;
  landscape: number;
}

// Timeline information
export interface Timeline {
  totalMonths: number;
  phases: {
    planning: number;
    construction: number;
    interiors: number;
    landscape: number;
  };
}

// Project subcategory types (now called "Type of Work")
export type ProjectSubcategory = "interiors" | "construction" | "landscape";

// Room configuration types for Residential projects
export type RoomConfiguration =
  | "1BHK"
  | "2BHK"
  | "3BHK"
  | "4BHK"
  | "5BHK+"
  | "Studio"
  | "Penthouse";

// Granular room counts, set via sliders, that the RoomConfiguration label
// above is derived from.
export interface RoomCounts {
  bedrooms: number;
  hall: number;
  kitchen: number;
  washrooms: number;
}

// Landscape area types
export type LandscapeArea =
  | "Front Yard"
  | "Back Yard"
  | "Terrace Garden"
  | "Rooftop Garden"
  | "Full Compound"
  | "Courtyard";

// Construction subtype for houses and apartments
export type ConstructionSubtype = "house" | "apartment";

// Area input type for construction
export type AreaInputType = "plot" | "plinth" | "builtup";

// Whether the project is a fresh build or a renovation of an existing structure.
// Renovations skip the new foundation/shell, add selective demolition, and keep
// MEP/finishes/interiors at full scope.
export type ProjectMode = "new" | "renovation";

// Foundation/soil condition. Drives the structural shell cost — poor or
// difficult ground needs deeper/stronger foundations, soil replacement, piling,
// or retaining work. Only relevant to new construction.
export type FoundationType = "normal" | "blackcotton" | "rocky" | "sloped";

// Premium lifestyle amenities (priced as fixed lump sums, not per-sqft, since a
// pool or home theatre is a discrete installation). Mostly relevant to villas,
// independent houses and high-end residential.
export type AmenityOption =
  | "swimmingPool"
  | "homeGym"
  | "saunaSteam"
  | "homeTheater"
  | "homeAutomation"
  | "solarPower"
  | "outdoorKitchen"
  | "jacuzziSpa"
  | "wineCellar"
  | "borewell";

// Main project estimate interface
export interface ProjectEstimate {
  // Location
  state: string;
  city: string;

  // Project basics
  projectType: string;
  workTypes: ProjectSubcategory[]; // Multiple selection for type of work
  roomConfiguration?: RoomConfiguration; // For Residential projects — derived from roomCounts
  roomCounts?: RoomCounts; // Bedroom/hall/kitchen/washroom counts, set via sliders
  landscapeAreas?: LandscapeArea[]; // For Landscape work

  // Construction specific fields
  constructionSubtype?: ConstructionSubtype; // House or apartment
  projectMode?: ProjectMode; // New build vs renovation (default "new")
  foundationType?: FoundationType; // Soil/foundation condition (new construction)
  floorCount?: number; // Number of floors
  areaInputType?: AreaInputType; // Plot area or plinth area
  plotArea?: number; // Plot/site area (if selected)
  builtUpArea?: number; // Calculated built-up area based on FSI
  fsiCompliant?: boolean; // Whether the floor count is FSI compliant

  area: number;
  areaUnit: "sqft" | "sqm";
  complexity: number;
  selectedMaterials: string[];
  budget?: number; // User's budget for budget matching

  // Legacy field for backward compatibility
  projectSubcategory?: ProjectSubcategory | "";
  
  // Core building components
  civilQuality: ComponentOption;
  plumbing: ComponentOption;
  electrical: ComponentOption;
  ac: ComponentOption;
  elevator: ComponentOption;
  
  // Finishes
  buildingEnvelope: ComponentOption;
  waterproofing: ComponentOption;
  lighting: ComponentOption;
  windows: ComponentOption;
  ceiling: ComponentOption;
  surfaces: ComponentOption;

  // Premium amenities (lump-sum installations, multi-select)
  amenities?: AmenityOption[];
  
  // Interiors
  fixedFurniture: ComponentOption;
  looseFurniture: ComponentOption;
  furnishings: ComponentOption;
  appliances: ComponentOption;
  artefacts: ComponentOption;
  
  // Calculated values
  totalCost: number;
  categoryBreakdown: CategoryBreakdown;
  phaseBreakdown: PhaseBreakdown;
  timeline: Timeline;
  
  // Architect Fee related fields (optional)
  architectFee?: {
    baseFee: number;
    ffeFee: number;
    landscapeFee: number;
    vizFee: number;
    overheadAllocation: number;
    profit: number;
    tax: number;
    totalFee: number;
    currency: string;
  };
}

// For saved estimates
export interface SavedEstimate extends ProjectEstimate {
  id: string;
  savedAt: string;
}

// User form data
export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
}
