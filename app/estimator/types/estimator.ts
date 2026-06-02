export type ComponentOption = "none" | "standard" | "premium" | "luxury";

export interface CategoryBreakdown {
  construction: number;
  core: number;
  finishes: number;
  interiors: number;
}

export interface PhaseBreakdown {
  planning: number;
  construction: number;
  interiors: number;
  landscape: number;
}

export interface Timeline {
  totalMonths: number;
  phases: {
    planning: number;
    construction: number;
    interiors: number;
    landscape: number;
  };
}

export type ProjectSubcategory = "interiors" | "construction" | "landscape";

export type RoomConfiguration =
  | "1BHK" | "2BHK" | "3BHK" | "4BHK" | "5BHK+" | "Studio" | "Penthouse";

export type LandscapeArea =
  | "Front Yard" | "Back Yard" | "Terrace Garden" | "Rooftop Garden" | "Full Compound" | "Courtyard";

export type ConstructionSubtype = "house" | "apartment";
export type AreaInputType = "plot" | "plinth" | "builtup";

export interface ProjectEstimate {
  state: string;
  city: string;
  projectType: string;
  workTypes: ProjectSubcategory[];
  roomConfiguration?: RoomConfiguration;
  landscapeAreas?: LandscapeArea[];
  constructionSubtype?: ConstructionSubtype;
  floorCount?: number;
  areaInputType?: AreaInputType;
  plotArea?: number;
  builtUpArea?: number;
  fsiCompliant?: boolean;
  area: number;
  areaUnit: "sqft" | "sqm";
  complexity: number;
  selectedMaterials: string[];
  budget?: number;
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
  totalCost: number;
  categoryBreakdown: CategoryBreakdown;
  phaseBreakdown: PhaseBreakdown;
  timeline: Timeline;
}
