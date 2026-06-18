import { Armchair, Sofa, Palette, Microwave, Frame, DoorOpen } from "lucide-react";
import { ComponentOption, ProjectSubcategory } from "@/types/estimator";
import QualityLevelSelector from "./QualityLevelSelector";

interface InteriorsStepProps {
  fixedFurniture: ComponentOption;
  looseFurniture: ComponentOption;
  furnishings: ComponentOption;
  appliances: ComponentOption;
  artefacts: ComponentOption;
  interiorDoorsWindows: ComponentOption;
  workTypes: ProjectSubcategory[];
  onOptionChange: (component: string, option: ComponentOption) => void;
}

const InteriorsStep = ({
  fixedFurniture,
  looseFurniture,
  furnishings,
  appliances,
  artefacts,
  interiorDoorsWindows,
  workTypes,
  onOptionChange,
}: InteriorsStepProps) => {
  // Interiors are typically for interiors work type
  // Show if interiors is selected as a work type
  const shouldShowInteriors = (): boolean => {
    if (!workTypes || workTypes.length === 0) return true;
    return workTypes.includes("interiors");
  };

  const interiors = [
    {
      key: "fixedFurniture",
      title: "Fixed Furniture & Cabinetry",
      icon: <Armchair className="size-6" />,
      value: fixedFurniture,
      description: "Built-in wardrobes, modular kitchen cabinets, vanity units, wall shelving, study tables, TV units, and custom carpentry with hardware and finishes",
    },
    {
      key: "interiorDoorsWindows",
      title: "Interior Doors & Windows",
      icon: <DoorOpen className="size-6" />,
      value: interiorDoorsWindows,
      description: "Bedroom doors, bathroom doors, kitchen doors, internal partitions, sliding doors, french doors, windows for internal rooms, door handles and locks, and interior glazing work",
    },
    {
      key: "looseFurniture",
      title: "Loose Furniture",
      icon: <Sofa className="size-6" />,
      value: looseFurniture,
      description: "Movable furniture including sofas, beds, dining tables, chairs, center tables, side tables, outdoor furniture, and upholstery work",
    },
    {
      key: "furnishings",
      title: "Furnishings & Soft Decor",
      icon: <Palette className="size-6" />,
      value: furnishings,
      description: "Soft furnishings including curtains, drapes, blinds, rugs, carpets, bedding, cushions, throws, table linens, and decorative textile elements",
    },
    {
      key: "appliances",
      title: "Appliances & Equipment",
      icon: <Microwave className="size-6" />,
      value: appliances,
      description: "Kitchen appliances (hob, chimney, oven, refrigerator), home electronics (TV, audio systems), water purifiers, and smart home devices",
    },
    {
      key: "artefacts",
      title: "Artefacts & Art Pieces",
      icon: <Frame className="size-6" />,
      value: artefacts,
      description: "Decorative artwork, paintings, sculptures, wall art, vases, showpieces, antiques, and curated decorative objects for aesthetic enhancement",
    },
  ];

  if (!shouldShowInteriors()) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-muted-foreground">
          Interior components are not typically included in {workTypes.join(", ")} work.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          If you need interiors, select "Interiors" in the Type of Work section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Interiors & Furnishings</h3>
        <p className="text-sm text-muted-foreground">
          Select the quality level for interior elements. All items are optional - choose "Not Required" to skip.
        </p>
      </div>

      {interiors.map((interior) => (
        <div key={interior.key} className="space-y-3 pb-6 border-b last:border-b-0">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-vs/10 text-vs">
              {interior.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-vs-dark mb-1">{interior.title}</h4>
              <p className="text-sm text-muted-foreground">{interior.description}</p>
            </div>
          </div>

          <QualityLevelSelector
            component={interior.key}
            currentValue={interior.value}
            onChange={(value) => onOptionChange(interior.key, value)}
          />
        </div>
      ))}
    </div>
  );
};

export default InteriorsStep;
