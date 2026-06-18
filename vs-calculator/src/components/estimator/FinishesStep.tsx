import { Lightbulb, DoorOpen, Layers, Brush, Building2 } from "lucide-react";
import { ComponentOption, ProjectSubcategory } from "@/types/estimator";
import QualityLevelSelector from "./QualityLevelSelector";

interface FinishesStepProps {
  lighting: ComponentOption;
  windows: ComponentOption;
  ceiling: ComponentOption;
  surfaces: ComponentOption;
  buildingEnvelope: ComponentOption;
  workTypes: ProjectSubcategory[];
  onOptionChange: (component: string, option: ComponentOption) => void;
}

const FinishesStep = ({
  lighting,
  windows,
  ceiling,
  surfaces,
  buildingEnvelope,
  workTypes,
  onOptionChange,
}: FinishesStepProps) => {
  // Define which finishes are available for each work type
  const shouldShowFinish = (finishKey: string): boolean => {
    if (!workTypes || workTypes.length === 0) {
      return true;
    }

    const finishAvailability: Record<ProjectSubcategory, string[]> = {
      interiors: ["lighting", "windows", "ceiling", "surfaces"], // Interior finishes including door/window upgrades
      construction: ["buildingEnvelope", "lighting", "windows", "ceiling", "surfaces"],
      landscape: ["lighting"], // Outdoor lighting only
    };

    // Show finish if ANY selected work type requires it
    return workTypes.some(workType =>
      finishAvailability[workType]?.includes(finishKey) ?? false
    );
  };

  const finishes = [
    {
      key: "buildingEnvelope",
      title: "Building Envelope & Facade Development",
      icon: <Building2 className="size-6" />,
      value: buildingEnvelope,
      description: "Exterior wall systems, facade cladding (ACP/stone/glass), weather protection, thermal/acoustic insulation, and architectural features for building exterior",
    },
    {
      key: "lighting",
      title: "Lighting Systems & Fixtures",
      icon: <Lightbulb className="size-6" />,
      value: lighting,
      description: "Decorative light fittings, ambient/task/accent lighting, LED/designer fixtures, smart lighting controls, and landscape/outdoor lighting solutions",
    },
    {
      key: "windows",
      title: "Windows, Doors & Glazing",
      icon: <DoorOpen className="size-6" />,
      value: windows,
      description: "Main entrance doors, bedroom/bathroom doors, window frames (aluminum/uPVC/wood), glass types (single/double glazed), sliding/casement systems, door hardware & locks, and security grills",
    },
    {
      key: "ceiling",
      title: "Ceiling Design & Finishes",
      icon: <Layers className="size-6" />,
      value: ceiling,
      description: "False ceiling systems (gypsum/POP/grid), ceiling treatments, coffers, cove lighting, acoustic panels, and decorative ceiling finishes",
    },
    {
      key: "surfaces",
      title: "Wall & Floor Finishes",
      icon: <Brush className="size-6" />,
      value: surfaces,
      description: "Flooring materials (tiles/marble/wood/vinyl), wall finishes (paint/wallpaper/cladding/textures), skirting, dado treatments, and protective coatings",
    },
  ].filter(finish => shouldShowFinish(finish.key));

  if (finishes.length === 0) {
    return null; // Don't show section if no finishes are available
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Finishes & Surfaces</h3>
        <p className="text-sm text-muted-foreground">
          Select the quality level for finishes. All items are optional - choose "Not Required" to skip.
          {workTypes && workTypes.length > 0 && (
            <span className="block mt-2 text-xs text-vs">
              Showing finishes for: {workTypes.join(", ")}
            </span>
          )}
        </p>
      </div>

      {finishes.map((finish) => (
        <div key={finish.key} className="space-y-3 pb-6 border-b last:border-b-0">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-vs/10 text-vs">
              {finish.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-vs-dark mb-1">{finish.title}</h4>
              <p className="text-sm text-muted-foreground">{finish.description}</p>
            </div>
          </div>

          <QualityLevelSelector
            component={finish.key}
            currentValue={finish.value}
            onChange={(value) => onOptionChange(finish.key, value)}
          />
        </div>
      ))}
    </div>
  );
};

export default FinishesStep;
