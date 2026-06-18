
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Building2, Home, Building, Paintbrush, HardHat, Trees, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedText from "@/components/AnimatedText";
import { ProjectSubcategory, RoomConfiguration, LandscapeArea, ConstructionSubtype, AreaInputType } from "@/types/estimator";

type ProjectType = "residential" | "commercial" | "mixed-use";

interface ProjectOption {
  id: ProjectType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface WorkTypeOption {
  id: ProjectSubcategory;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface RoomConfigOption {
  id: RoomConfiguration;
  title: string;
  description: string;
}

interface LandscapeAreaOption {
  id: LandscapeArea;
  title: string;
}

interface ProjectTypeStepProps {
  selectedType: string;
  selectedWorkTypes: ProjectSubcategory[];
  selectedRoomConfig?: RoomConfiguration;
  selectedLandscapeAreas?: LandscapeArea[];
  selectedConstructionSubtype?: ConstructionSubtype;
  selectedFloorCount?: number;
  selectedAreaInputType?: AreaInputType;
  onSelectType: (type: ProjectType) => void;
  onSelectWorkTypes: (workTypes: ProjectSubcategory[]) => void;
  onSelectRoomConfig: (config: RoomConfiguration) => void;
  onSelectLandscapeAreas: (areas: LandscapeArea[]) => void;
  onSelectConstructionSubtype: (subtype: ConstructionSubtype) => void;
  onSelectFloorCount: (count: number) => void;
  onSelectAreaInputType: (type: AreaInputType) => void;
}

const ProjectTypeStep = ({
  selectedType,
  selectedWorkTypes,
  selectedRoomConfig,
  selectedLandscapeAreas = [],
  selectedConstructionSubtype,
  selectedFloorCount,
  selectedAreaInputType,
  onSelectType,
  onSelectWorkTypes,
  onSelectRoomConfig,
  onSelectLandscapeAreas,
  onSelectConstructionSubtype,
  onSelectFloorCount,
  onSelectAreaInputType,
}: ProjectTypeStepProps) => {
  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // Auto-set default area input type for interiors-only projects
  useEffect(() => {
    const isInteriorsOnly = selectedWorkTypes.includes("interiors") && !selectedWorkTypes.includes("construction");
    // For interiors-only projects without construction subtype, default to "builtup"
    if (isInteriorsOnly && !selectedConstructionSubtype && !selectedAreaInputType) {
      onSelectAreaInputType("builtup");
    }
  }, [selectedWorkTypes, selectedConstructionSubtype, selectedAreaInputType, onSelectAreaInputType]);

  const projectOptions: ProjectOption[] = [
    {
      id: "residential",
      title: "Residential",
      description: "Houses, apartments, and living spaces",
      icon: <Home className="size-6" />
    },
    {
      id: "commercial",
      title: "Commercial",
      description: "Offices, retail, and business spaces",
      icon: <Building className="size-6" />
    },
    {
      id: "mixed-use",
      title: "Mixed-Use",
      description: "Combined residential and commercial spaces",
      icon: <Building2 className="size-6" />
    }
  ];

  const workTypeOptions: WorkTypeOption[] = [
    {
      id: "construction",
      title: "Construction",
      description: "Complete building construction from foundation",
      icon: <HardHat className="size-5" />
    },
    {
      id: "interiors",
      title: "Interiors",
      description: "Interior design and furnishing for existing spaces",
      icon: <Paintbrush className="size-5" />
    },
    {
      id: "landscape",
      title: "Landscape",
      description: "Outdoor spaces, gardens, and landscaping",
      icon: <Trees className="size-5" />
    },
  ];

  const roomConfigOptions: RoomConfigOption[] = [
    { id: "Studio", title: "Studio", description: "Open plan living space" },
    { id: "1BHK", title: "1 BHK", description: "1 Bedroom, Hall, Kitchen" },
    { id: "2BHK", title: "2 BHK", description: "2 Bedrooms, Hall, Kitchen" },
    { id: "3BHK", title: "3 BHK", description: "3 Bedrooms, Hall, Kitchen" },
    { id: "4BHK", title: "4 BHK", description: "4 Bedrooms, Hall, Kitchen" },
    { id: "5BHK+", title: "5+ BHK", description: "5 or more Bedrooms" },
    { id: "Penthouse", title: "Penthouse", description: "Luxury top-floor residence" },
  ];

  const landscapeAreaOptions: LandscapeAreaOption[] = [
    { id: "Front Yard", title: "Front Yard" },
    { id: "Back Yard", title: "Back Yard" },
    { id: "Terrace Garden", title: "Terrace Garden" },
    { id: "Rooftop Garden", title: "Rooftop Garden" },
    { id: "Full Compound", title: "Full Compound" },
    { id: "Courtyard", title: "Courtyard" },
  ];

  const toggleWorkType = (workType: ProjectSubcategory) => {
    const newWorkTypes = selectedWorkTypes.includes(workType)
      ? selectedWorkTypes.filter(t => t !== workType)
      : [...selectedWorkTypes, workType];
    onSelectWorkTypes(newWorkTypes);
  };

  const toggleLandscapeArea = (area: LandscapeArea) => {
    const newAreas = selectedLandscapeAreas.includes(area)
      ? selectedLandscapeAreas.filter(a => a !== area)
      : [...selectedLandscapeAreas, area];
    onSelectLandscapeAreas(newAreas);
  };

  return (
    <div className="space-y-8">
      {/* Project Type Selection */}
      <div>
        <AnimatedText
          text="What type of project are you planning?"
          className="text-2xl font-display mb-8 text-center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {projectOptions.map((option) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: projectOptions.findIndex(o => o.id === option.id) * 0.1 }}
              className={cn(
                "group flex flex-col justify-between border rounded-xl p-6 cursor-pointer transition-all duration-300",
                selectedType === option.id
                  ? "border-vs bg-vs/5"
                  : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => onSelectType(option.id as ProjectType)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 flex items-center justify-center size-12 rounded-lg transition-colors",
                  selectedType === option.id
                    ? "bg-vs text-white"
                    : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
                )}>
                  {option.icon}
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-[#4f090c]">{option.title}</h3>
                  <p className="text-[#4f090c]/80">{option.description}</p>
                </div>
              </div>

              <div className={cn(
                "mt-4 h-1 rounded-full bg-vs/20 overflow-hidden",
                selectedType === option.id ? "opacity-100" : "opacity-0 group-hover:opacity-50"
              )}>
                <motion.div
                  className="h-full bg-vs"
                  initial={{ width: "0%" }}
                  animate={{ width: selectedType === option.id ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Type of Work Selection (Multiple) */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedText
            text="Type of Work (Select all that apply)"
            className="text-xl font-display mb-6 text-center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {workTypeOptions.map((option, index) => {
              const isSelected = selectedWorkTypes.includes(option.id);
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "group relative flex flex-col items-start border rounded-lg p-5 cursor-pointer transition-all duration-300 hover:shadow-md",
                    isSelected
                      ? "border-vs bg-vs/5 shadow-sm"
                      : "border-primary/10 hover:border-primary/30"
                  )}
                  onClick={() => toggleWorkType(option.id)}
                >
                  {/* Checkmark indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 size-6 bg-vs rounded-full flex items-center justify-center"
                    >
                      <Check className="size-4 text-white" />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "flex-shrink-0 flex items-center justify-center size-10 rounded-lg transition-colors",
                      isSelected
                        ? "bg-vs text-white"
                        : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
                    )}>
                      {option.icon}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-lg font-medium mb-1 text-[#4f090c]">{option.title}</h4>
                      <p className="text-sm text-[#4f090c]/70">{option.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Room Configuration (Conditional - for Residential) */}
      {selectedType === "residential" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedText
            text="Room Configuration / Typology"
            className="text-xl font-display mb-6 text-center"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roomConfigOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className={cn(
                  "group flex flex-col items-center justify-center border rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-md",
                  selectedRoomConfig === option.id
                    ? "border-vs bg-vs/5 shadow-sm"
                    : "border-primary/10 hover:border-primary/30"
                )}
                onClick={() => onSelectRoomConfig(option.id)}
              >
                <div className={cn(
                  "w-full text-center py-2 px-3 rounded-md transition-colors mb-2",
                  selectedRoomConfig === option.id
                    ? "bg-vs text-white"
                    : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
                )}>
                  <h4 className="text-base font-semibold">{option.title}</h4>
                </div>
                <p className="text-xs text-[#4f090c]/70 text-center">{option.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Construction Subtype Selection (Conditional - for Residential Construction) */}
      {selectedType === "residential" && selectedWorkTypes.includes("construction") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedText
            text="Type of Construction"
            className="text-xl font-display mb-6 text-center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "group flex flex-col items-center justify-center border rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-md",
                selectedConstructionSubtype === "house"
                  ? "border-vs bg-vs/5 shadow-sm"
                  : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => onSelectConstructionSubtype("house")}
            >
              <div className={cn(
                "flex items-center justify-center size-16 rounded-lg transition-colors mb-3",
                selectedConstructionSubtype === "house"
                  ? "bg-vs text-white"
                  : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
              )}>
                <Home className="size-8" />
              </div>
              <h4 className="text-lg font-semibold text-[#4f090c]">House</h4>
              <p className="text-sm text-[#4f090c]/70 text-center mt-2">
                Independent house with own plot
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className={cn(
                "group flex flex-col items-center justify-center border rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-md",
                selectedConstructionSubtype === "apartment"
                  ? "border-vs bg-vs/5 shadow-sm"
                  : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => onSelectConstructionSubtype("apartment")}
            >
              <div className={cn(
                "flex items-center justify-center size-16 rounded-lg transition-colors mb-3",
                selectedConstructionSubtype === "apartment"
                  ? "bg-vs text-white"
                  : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
              )}>
                <Building className="size-8" />
              </div>
              <h4 className="text-lg font-semibold text-[#4f090c]">Apartment</h4>
              <p className="text-sm text-[#4f090c]/70 text-center mt-2">
                Multi-unit building or apartment complex
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Floor Count Selection (Conditional - when construction subtype is selected OR interiors work type) */}
      {(selectedConstructionSubtype || selectedWorkTypes.includes("interiors")) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedText
            text="Number of Floors (G+ Format)"
            className="text-xl font-display mb-6 text-center"
          />

          <div className="max-w-md mx-auto">
            {/* Compact Floor Count Input */}
            <div className="flex flex-col items-center gap-4">
              {/* G+ Format Display */}
              <div className="flex items-center gap-4 w-full max-w-sm">
                <div className="flex-1 text-right">
                  <motion.div
                    key={selectedFloorCount || 1}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-vs to-vs-light rounded-xl shadow-lg"
                  >
                    <Layers className="size-6 text-white" />
                    <span className="text-4xl font-bold text-white">
                      G+{Math.max(0, (selectedFloorCount || 1) - 1)}
                    </span>
                  </motion.div>
                </div>

                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={selectedFloorCount || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        if (value >= 1 && value <= 99) {
                          onSelectFloorCount(value);
                        }
                      }}
                      className="w-full text-3xl font-bold text-center border-2 border-vs/30 focus:border-vs rounded-xl py-3 px-4 outline-none transition-colors bg-white shadow-sm"
                      placeholder="1"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                      floors
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-center">
                <p className="text-sm text-gray-700 font-medium mb-1">
                  {(selectedFloorCount || 1) === 1
                    ? "Single floor only (Ground floor)"
                    : `${selectedFloorCount} floors total`}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedConstructionSubtype
                    ? `Enter the number of floors for your ${selectedConstructionSubtype}`
                    : "Enter total number of floors in your home"}
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => onSelectFloorCount(count)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      (selectedFloorCount || 1) === count
                        ? "bg-vs text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    G+{count - 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Floor Structure */}
            {selectedFloorCount && selectedFloorCount > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="size-5 text-purple-600" />
                  <h5 className="font-semibold text-purple-900">G+{selectedFloorCount - 1} Structure</h5>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-800">
                  {Array.from({ length: selectedFloorCount }, (_, i) => selectedFloorCount - i).map((floor, index) => (
                    <div key={floor} className="flex items-center gap-2 py-1">
                      <div className={cn(
                        "size-2 rounded-sm",
                        index === 0 ? "bg-purple-500" : "bg-blue-400"
                      )}></div>
                      <span className="font-medium text-xs">
                        {floor === 1 ? "Ground Floor" : `${floor - 1}${getOrdinalSuffix(floor - 1)} Floor`}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Area Type Selection (Conditional - for House/Apartment construction OR Interiors) */}
      {(selectedConstructionSubtype || selectedWorkTypes.includes("interiors")) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedText
            text="How would you like to specify the area?"
            className="text-xl font-display mb-6 text-center"
          />

          <div className={cn(
            "grid gap-4 max-w-3xl mx-auto",
            selectedConstructionSubtype === "house" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
          )}>
            {/* Plot Area - Only for houses */}
            {selectedConstructionSubtype === "house" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "group flex flex-col border rounded-lg p-5 cursor-pointer transition-all duration-300 hover:shadow-md",
                  selectedAreaInputType === "plot"
                    ? "border-vs bg-vs/5 shadow-sm"
                    : "border-primary/10 hover:border-primary/30"
                )}
                onClick={() => onSelectAreaInputType("plot")}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center size-10 rounded-lg transition-colors flex-shrink-0",
                    selectedAreaInputType === "plot"
                      ? "bg-vs text-white"
                      : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
                  )}>
                    <Layers className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-[#4f090c] mb-1">Plot/Site Area</h4>
                    <p className="text-xs text-[#4f090c]/70">
                      Total land area. FSI-based calculation.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Plinth Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: selectedConstructionSubtype === "house" ? 0.05 : 0 }}
              className={cn(
                "group flex flex-col border rounded-lg p-5 cursor-pointer transition-all duration-300 hover:shadow-md",
                selectedAreaInputType === "plinth" || (!selectedConstructionSubtype && !selectedAreaInputType)
                  ? "border-vs bg-vs/5 shadow-sm"
                  : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => onSelectAreaInputType("plinth")}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex items-center justify-center size-10 rounded-lg transition-colors flex-shrink-0",
                  selectedAreaInputType === "plinth" || (!selectedConstructionSubtype && !selectedAreaInputType)
                    ? "bg-vs text-white"
                    : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
                )}>
                  <Home className="size-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-[#4f090c] mb-1">Plinth Area</h4>
                  <p className="text-xs text-[#4f090c]/70">
                    Ground floor only. Total = plinth × floors.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Built-up Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: selectedConstructionSubtype === "house" ? 0.1 : 0.05 }}
              className={cn(
                "group flex flex-col border rounded-lg p-5 cursor-pointer transition-all duration-300 hover:shadow-md",
                selectedAreaInputType === "builtup"
                  ? "border-vs bg-vs/5 shadow-sm"
                  : "border-primary/10 hover:border-primary/30"
              )}
              onClick={() => onSelectAreaInputType("builtup")}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex items-center justify-center size-10 rounded-lg transition-colors flex-shrink-0",
                  selectedAreaInputType === "builtup"
                    ? "bg-vs text-white"
                    : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
                )}>
                  <Building2 className="size-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-[#4f090c] mb-1">Built-up Area</h4>
                  <p className="text-xs text-[#4f090c]/70">
                    Total area across all floors.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Info Notes */}
          {selectedAreaInputType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 max-w-3xl mx-auto"
            >
              {selectedAreaInputType === "plot" && (
                <>
                  <p className="font-medium mb-1">Plot/Site Area:</p>
                  <p>We'll verify FSI compliance for your city and calculate the built-up area based on floor count.</p>
                </>
              )}
              {selectedAreaInputType === "plinth" && (
                <>
                  <p className="font-medium mb-1">Plinth Area:</p>
                  <p>Enter ground floor area only. {selectedFloorCount && selectedFloorCount > 1 && `For G+${selectedFloorCount - 1}, total = ${selectedFloorCount} × plinth area.`}</p>
                </>
              )}
              {selectedAreaInputType === "builtup" && (
                <>
                  <p className="font-medium mb-1">Built-up Area:</p>
                  <p>Enter the total constructed area across all {selectedFloorCount || 1} floor{(selectedFloorCount || 1) > 1 ? 's' : ''}.</p>
                </>
              )}
            </motion.div>
          )}

          {selectedAreaInputType === "plot" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 max-w-2xl mx-auto"
            >
              <p className="font-medium mb-1">Note about FSI (Floor Space Index):</p>
              <p>
                We'll verify that your floor count complies with FSI regulations for your selected city.
                If the floors exceed the maximum allowed FSI, you'll be notified before proceeding.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Landscape Area Selection (Conditional - if Landscape is selected) */}
      {selectedWorkTypes.includes("landscape") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatedText
            text="Landscape Areas / Sections (Select all that apply)"
            className="text-xl font-display mb-6 text-center"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {landscapeAreaOptions.map((option, index) => {
              const isSelected = selectedLandscapeAreas.includes(option.id);
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className={cn(
                    "group relative flex items-center justify-center border rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-md",
                    isSelected
                      ? "border-vs bg-vs/5 shadow-sm"
                      : "border-primary/10 hover:border-primary/30"
                  )}
                  onClick={() => toggleLandscapeArea(option.id)}
                >
                  {/* Checkmark indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 size-5 bg-vs rounded-full flex items-center justify-center"
                    >
                      <Check className="size-3 text-white" />
                    </motion.div>
                  )}

                  <h4 className={cn(
                    "text-sm font-medium text-center transition-colors",
                    isSelected ? "text-[#4f090c]" : "text-[#4f090c]/70"
                  )}>
                    {option.title}
                  </h4>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="mt-8 text-center text-[#4f090c]/70 text-sm">
        <p>Choose the options that best describe your project</p>
      </div>
    </div>
  );
};

export default ProjectTypeStep;
