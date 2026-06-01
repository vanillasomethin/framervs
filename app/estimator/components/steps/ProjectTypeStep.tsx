"use client";

import type { ProjectSubcategory, RoomConfiguration, LandscapeArea, ConstructionSubtype } from "../../types/estimator";

const PROJECT_TYPES = ["Residential", "Commercial", "Mixed-Use"] as const;
const WORK_TYPES: { id: ProjectSubcategory; label: string; desc: string }[] = [
  { id: "construction", label: "Construction", desc: "New build or structural work" },
  { id: "interiors", label: "Interiors", desc: "Interior design & fit-out" },
  { id: "landscape", label: "Landscape", desc: "Outdoor & garden design" },
];
const ROOM_CONFIGS: RoomConfiguration[] = ["Studio", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK+", "Penthouse"];
const LANDSCAPE_AREAS: LandscapeArea[] = ["Front Yard", "Back Yard", "Terrace Garden", "Rooftop Garden", "Full Compound", "Courtyard"];

interface Props {
  projectType: string;
  workTypes: ProjectSubcategory[];
  roomConfiguration?: RoomConfiguration;
  landscapeAreas?: LandscapeArea[];
  constructionSubtype?: ConstructionSubtype;
  floorCount?: number;
  onProjectTypeChange: (type: string) => void;
  onWorkTypesChange: (types: ProjectSubcategory[]) => void;
  onRoomConfigChange: (config: RoomConfiguration) => void;
  onLandscapeAreasChange: (areas: LandscapeArea[]) => void;
  onConstructionSubtypeChange: (subtype: ConstructionSubtype) => void;
  onFloorCountChange: (count: number) => void;
}

export default function ProjectTypeStep({
  projectType, workTypes, roomConfiguration, landscapeAreas, constructionSubtype, floorCount,
  onProjectTypeChange, onWorkTypesChange, onRoomConfigChange, onLandscapeAreasChange,
  onConstructionSubtypeChange, onFloorCountChange,
}: Props) {
  const toggleWorkType = (type: ProjectSubcategory) => {
    const next = workTypes.includes(type) ? workTypes.filter(t => t !== type) : [...workTypes, type];
    onWorkTypesChange(next);
  };

  const toggleLandscape = (area: LandscapeArea) => {
    const current = landscapeAreas ?? [];
    const next = current.includes(area) ? current.filter(a => a !== area) : [...current, area];
    onLandscapeAreasChange(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-1">Project type</h2>
        <p className="text-stone-500 text-sm">Select all that apply to your project.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">Category</p>
        <div className="grid grid-cols-3 gap-2">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onProjectTypeChange(type)}
              className={`rounded-lg border py-3 text-sm font-medium transition-colors ${
                projectType === type
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">Type of work</p>
        <div className="space-y-2">
          {WORK_TYPES.map(({ id, label, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleWorkType(id)}
              className={`w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                workTypes.includes(id)
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
              }`}
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 rounded border items-center justify-center ${
                workTypes.includes(id) ? "bg-white border-white" : "border-stone-400"
              }`}>
                {workTypes.includes(id) && <span className="block h-2 w-2 rounded bg-stone-900" />}
              </span>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className={`text-xs ${workTypes.includes(id) ? "text-stone-300" : "text-stone-500"}`}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {projectType === "Residential" && workTypes.includes("construction") && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Construction type</p>
          <div className="grid grid-cols-2 gap-2">
            {(["house", "apartment"] as ConstructionSubtype[]).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => onConstructionSubtypeChange(sub)}
                className={`rounded-lg border py-3 text-sm font-medium capitalize transition-colors ${
                  constructionSubtype === sub
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {projectType === "Residential" && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Room configuration</p>
          <div className="grid grid-cols-4 gap-2">
            {ROOM_CONFIGS.map((config) => (
              <button
                key={config}
                type="button"
                onClick={() => onRoomConfigChange(config)}
                className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                  roomConfiguration === config
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                }`}
              >
                {config}
              </button>
            ))}
          </div>
        </div>
      )}

      {workTypes.includes("construction") && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Number of floors</p>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onFloorCountChange(n)}
                  className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                    floorCount === n
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={50}
              value={floorCount ?? ""}
              onChange={(e) => onFloorCountChange(parseInt(e.target.value) || 1)}
              placeholder="Custom"
              className="w-20 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>
      )}

      {workTypes.includes("landscape") && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Landscape areas</p>
          <div className="grid grid-cols-2 gap-2">
            {LANDSCAPE_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleLandscape(area)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors ${
                  (landscapeAreas ?? []).includes(area)
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
