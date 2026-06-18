// Component quality options
export type ComponentOption = "none" | "standard" | "premium" | "luxury";

// Category breakdown for cost visualization
export interface CategoryBreakdown {
  construction: number;
  core: number;
  finishes: number;
  interiors: number;
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

// Main project estimate interface
export interface ProjectEstimate {
  // Location
  state: string;
  city: string;

  // Project basics
  projectType: string;
  workTypes: ProjectSubcategory[]; // Multiple selection for type of work
  roomConfiguration?: RoomConfiguration; // For Residential projects
  landscapeAreas?: LandscapeArea[]; // For Landscape work

  // Construction specific fields
  constructionSubtype?: ConstructionSubtype; // House or apartment
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
  lighting: ComponentOption;
  windows: ComponentOption;
  ceiling: ComponentOption;
  surfaces: ComponentOption;
  
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
