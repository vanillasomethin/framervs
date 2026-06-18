import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ruler, SwitchCamera, AlertTriangle, CheckCircle2, Info, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedText from "@/components/AnimatedText";
import { ConstructionSubtype, AreaInputType } from "@/types/estimator";
import { getFSIRule, validateFSICompliance, calculateTypicalBuiltUpArea, suggestMaxFloors } from "@/utils/fsiRules";

interface AreaStepProps {
  area: number;
  areaUnit: "sqft" | "sqm";
  projectType: string;
  city: string;
  constructionSubtype?: ConstructionSubtype;
  floorCount?: number;
  areaInputType?: AreaInputType;
  onAreaChange: (area: number) => void;
  onUnitChange: (unit: "sqft" | "sqm") => void;
  onBuiltUpAreaChange?: (builtUpArea: number) => void;
  onFSIComplianceChange?: (isCompliant: boolean) => void;
}

const AreaStep = ({
  area,
  areaUnit,
  projectType,
  city,
  constructionSubtype,
  floorCount,
  areaInputType,
  onAreaChange,
  onUnitChange,
  onBuiltUpAreaChange,
  onFSIComplianceChange
}: AreaStepProps) => {
  // Use area prop as the initial value, ensuring synchronization
  const [inputValue, setInputValue] = useState(area > 0 ? area.toString() : "");
  const [fsiValidation, setFsiValidation] = useState<{
    isCompliant: boolean;
    maxAllowed: number;
    fsiUsed: number;
    fsiMax: number;
    message: string;
  } | null>(null);
  const [calculatedBuiltUpArea, setCalculatedBuiltUpArea] = useState<number | null>(null);

  // Calculate FSI compliance and built-up area when relevant parameters change
  useEffect(() => {
    // Only calculate if we have house construction with plot area selected
    if (
      constructionSubtype === "house" &&
      areaInputType === "plot" &&
      area > 0 &&
      floorCount &&
      city
    ) {
      // Convert area to square meters for FSI calculation if needed
      const areaInSqm = areaUnit === "sqft" ? area * 0.092903 : area;

      // Get FSI rule for the city
      const fsiRule = getFSIRule(city);

      // Calculate typical built-up area based on FSI
      const typicalBuiltUp = calculateTypicalBuiltUpArea(areaInSqm, city, areaUnit);

      // Estimate floor area based on plot size (ground floor is ~70-75% of plot area due to setbacks)
      // Smaller plots get higher percentage, larger plots need more setbacks
      let groundFloorPercentage = 0.75; // Default 75% for small plots
      if (areaInSqm > 150) groundFloorPercentage = 0.70; // 70% for plots > 1,600 sqft
      if (areaInSqm > 200) groundFloorPercentage = 0.68; // 68% for plots > 2,150 sqft

      const groundFloorArea = areaInSqm * groundFloorPercentage;
      // Upper floors can be slightly larger (including balconies, projections allowed)
      const upperFloorArea = areaInSqm * 0.75;
      const additionalFloors = Math.max(0, floorCount - 1);
      const proposedBuiltUpArea = groundFloorArea + (upperFloorArea * additionalFloors);

      // Validate FSI compliance
      const validation = validateFSICompliance(areaInSqm, proposedBuiltUpArea, city);

      setFsiValidation(validation);
      setCalculatedBuiltUpArea(proposedBuiltUpArea);

      // Notify parent components
      if (onBuiltUpAreaChange) {
        onBuiltUpAreaChange(proposedBuiltUpArea);
      }
      if (onFSIComplianceChange) {
        onFSIComplianceChange(validation.isCompliant);
      }
    } else {
      setFsiValidation(null);
      setCalculatedBuiltUpArea(null);
      if (onFSIComplianceChange) {
        onFSIComplianceChange(true); // Default to compliant if not using plot area
      }
    }
  }, [area, areaUnit, city, constructionSubtype, floorCount, areaInputType, onBuiltUpAreaChange, onFSIComplianceChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or digits only
    if (value === "" || /^\d+$/.test(value)) {
      setInputValue(value);
      // Pass the updated number to the parent
      onAreaChange(value ? parseInt(value) : 0);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setInputValue(value.toString());
    onAreaChange(value);
  };

  const toggleUnit = () => {
    const newUnit = areaUnit === "sqft" ? "sqm" : "sqft";
    onUnitChange(newUnit);
    
    // Convert area value
    if (area > 0) {
      let convertedArea = area; // Use a variable to store the result

      if (newUnit === "sqm") {
        // Convert from sqft to sqm (1 sqft ≈ 0.0929 sqm, so divide by 10.764)
        convertedArea = Math.round(area / 10.764);
      } else {
        // Convert from sqm to sqft
        convertedArea = Math.round(area * 10.764);
      }
      
      onAreaChange(convertedArea); // Update parent state with converted value
      
      // ✅ FIX APPLIED HERE: Synchronize local state with the converted value
      setInputValue(convertedArea.toString());
    }
  };

  const getPresetOptions = () => {
    const multiplier = areaUnit === "sqft" ? 1 : 0.092903; // 1 sqft = 0.092903 sqm
    
    if (projectType === "residential") {
      return [
        { label: `Small (${Math.round(1000 * multiplier)} ${areaUnit})`, value: Math.round(1000 * multiplier) },
        { label: `Medium (${Math.round(2000 * multiplier)} ${areaUnit})`, value: Math.round(2000 * multiplier) },
        { label: `Large (${Math.round(3500 * multiplier)} ${areaUnit})`, value: Math.round(3500 * multiplier) },
      ];
    } else if (projectType === "commercial") {
      return [
        { label: `Small Office (${Math.round(2000 * multiplier)} ${areaUnit})`, value: Math.round(2000 * multiplier) },
        { label: `Medium (${Math.round(5000 * multiplier)} ${areaUnit})`, value: Math.round(5000 * multiplier) },
        { label: `Large (${Math.round(10000 * multiplier)} ${areaUnit})`, value: Math.round(10000 * multiplier) },
      ];
    } else if (projectType === "mixed-use") {
      return [
        { label: `Small Project (${Math.round(5000 * multiplier)} ${areaUnit})`, value: Math.round(5000 * multiplier) },
        { label: `Medium (${Math.round(15000 * multiplier)} ${areaUnit})`, value: Math.round(15000 * multiplier) },
        { label: `Large (${Math.round(30000 * multiplier)} ${areaUnit})`, value: Math.round(30000 * multiplier) },
      ];
    }
    
    return [
      { label: `Small (${Math.round(1000 * multiplier)} ${areaUnit})`, value: Math.round(1000 * multiplier) },
      { label: `Medium (${Math.round(3000 * multiplier)} ${areaUnit})`, value: Math.round(3000 * multiplier) },
      { label: `Large (${Math.round(8000 * multiplier)} ${areaUnit})`, value: Math.round(8000 * multiplier) },
    ];
  };

  const presetOptions = getPresetOptions();
  
  const getMaxRange = () => {
    const multiplier = areaUnit === "sqft" ? 1 : 0.092903;
    
    switch (projectType) {
      case "residential": return Math.round(5000 * multiplier);
      case "commercial": return Math.round(20000 * multiplier);
      case "mixed-use": return Math.round(50000 * multiplier);
      default: return Math.round(10000 * multiplier);
    }
  };
  
  const maxRange = getMaxRange();

  // Get dynamic title based on area input type
  const getTitle = () => {
    if (constructionSubtype === "house" && areaInputType === "plot") {
      return "What's the plot/site area?";
    } else if (areaInputType === "plinth") {
      return "What's the plinth area (ground floor)?";
    } else if (areaInputType === "builtup") {
      return "What's the total built-up area?";
    }
    return "What's the approximate area of your project?";
  };

  return (
    <div>
      <AnimatedText
        text={getTitle()}
        className="text-2xl font-display mb-8 text-center"
      />
      
      <div className="flex items-center justify-center mb-12">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full text-4xl text-center font-display border-b-2 border-primary/20 focus:border-vs outline-none py-2 bg-transparent"
            placeholder="0"
          />
          <div className="absolute right-0 bottom-3 text-[#4f090c]">
            {areaUnit}
          </div>
          
          <button 
            onClick={toggleUnit}
            className="absolute -right-12 bottom-3 text-vs hover:text-vs-light transition-colors"
            title={`Switch to ${areaUnit === "sqft" ? "square meters" : "square feet"}`}
          >
            <SwitchCamera size={20} />
          </button>
          
          <motion.div 
            className={cn(
              "absolute -bottom-2 left-0 h-1 bg-vs rounded-full",
              area > 0 ? "opacity-100" : "opacity-0"
            )}
            animate={{ 
              // Ensure the range calculation uses the maxRange correctly
              width: area > 0 ? `${Math.min((area / maxRange) * 100, 100)}%` : "0%" 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#4f090c]/70 text-sm">0 {areaUnit}</span>
          <span className="text-[#4f090c]/70 text-sm">{maxRange.toLocaleString()} {areaUnit}</span>
        </div>
        
        <input
          type="range"
          min="0"
          max={maxRange}
          // The slider value should always match the 'area' prop
          step={areaUnit === "sqft" ? "50" : "10"}
          value={area} 
          onChange={handleRangeChange}
          className="w-full h-2 bg-primary/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-vs"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4 text-[#4f090c]">Common sizes:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {presetOptions.map((option, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                "flex flex-col items-center justify-center p-4 border rounded-xl transition-all",
                // This checks the selection status
                area === option.value 
                  ? "border-vs bg-vs/5" 
                  : "border-primary/10 hover:bg-primary/5"
              )}
              onClick={() => {
                // Clicking a preset updates both local and parent state
                setInputValue(option.value.toString());
                onAreaChange(option.value);
              }}
            >
              <Ruler className={cn(
                "mb-2 size-5",
                area === option.value ? "text-vs" : "text-primary/60"
              )} />
              <span className="text-sm">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="mt-8 text-center text-[#4f090c]/70 text-sm">
        <p>
          {constructionSubtype === "house" && areaInputType === "plot"
            ? "Enter the plot/site area. We'll calculate the plinth (ground floor) area based on FSI rules."
            : areaInputType === "plinth"
            ? "Enter the ground floor area only. We'll calculate total built-up area based on the number of floors."
            : areaInputType === "builtup"
            ? "Enter the total built-up area across all floors."
            : "Enter the area or use the slider to set your project size. Toggle between square feet and square meters as needed."}
        </p>
      </div>

      {/* G+ Format Info Display */}
      {areaInputType === "plinth" && area > 0 && floorCount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 p-5 bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-start gap-3 mb-4">
            <Building2 className="size-6 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">
                {floorCount === 1 ? "G+0 Format Calculation" : `G+${floorCount - 1} Format Calculation`}
              </h4>
              <p className="text-sm text-green-800">
                {floorCount === 1
                  ? "Single floor structure (Ground floor only)"
                  : `Total built-up area for your ${floorCount}-floor structure`}
              </p>
            </div>
          </div>

          {/* Floor breakdown */}
          <div className="space-y-2 mb-4">
            {Array.from({ length: floorCount }, (_, i) => ({
              floor: floorCount - i,
              index: i
            })).map(({ floor, index }) => {
              const getOrdinalSuffix = (num: number): string => {
                const j = num % 10;
                const k = num % 100;
                if (j === 1 && k !== 11) return "st";
                if (j === 2 && k !== 12) return "nd";
                if (j === 3 && k !== 13) return "rd";
                return "th";
              };

              return (
                <div key={floor} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`size-3 rounded-sm ${index === floorCount - 1 ? 'bg-green-600' : 'bg-teal-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {floor === 1 ? "Ground Floor (Plinth)" : `${floor - 1}${getOrdinalSuffix(floor - 1)} Floor`}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {area.toLocaleString()} {areaUnit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Total calculation */}
          <div className="p-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Built-up Area</p>
                {floorCount > 1 ? (
                  <p className="text-xs opacity-75">{area} {areaUnit} × {floorCount} floors</p>
                ) : (
                  <p className="text-xs opacity-75">Single floor (plinth area)</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{(area * floorCount).toLocaleString()} {areaUnit}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-green-700 mt-3 text-center">
            Pricing will be calculated based on total built-up area of {(area * floorCount).toLocaleString()} {areaUnit}
          </p>
        </motion.div>
      )}

      {/* FSI Validation Display */}
      {constructionSubtype === "house" && areaInputType === "plot" && area > 0 && floorCount && fsiValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 space-y-4"
        >
          {/* FSI Info Card */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">FSI Calculation</h4>
                <p className="text-sm text-blue-800">
                  Based on {city}'s FSI regulations and your {floorCount}-floor design
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/60 p-3 rounded-lg">
                <p className="text-blue-700 font-medium mb-1">Plot Area</p>
                <p className="text-lg font-bold text-blue-900">
                  {area.toLocaleString()} {areaUnit}
                </p>
              </div>

              <div className="bg-white/60 p-3 rounded-lg">
                <p className="text-blue-700 font-medium mb-1">Max FSI Allowed</p>
                <p className="text-lg font-bold text-blue-900">
                  {fsiValidation.fsiMax}
                </p>
              </div>

              <div className="bg-white/60 p-3 rounded-lg">
                <p className="text-blue-700 font-medium mb-1">Estimated Built-up Area</p>
                <p className="text-lg font-bold text-blue-900">
                  {calculatedBuiltUpArea
                    ? `${Math.round(areaUnit === "sqft" ? calculatedBuiltUpArea / 0.092903 : calculatedBuiltUpArea).toLocaleString()} ${areaUnit}`
                    : "N/A"}
                </p>
              </div>

              <div className="bg-white/60 p-3 rounded-lg">
                <p className="text-blue-700 font-medium mb-1">FSI Used</p>
                <p className="text-lg font-bold text-blue-900">
                  {fsiValidation.fsiUsed.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Status */}
          {fsiValidation.isCompliant ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
            >
              <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-1">FSI Compliant ✓</h4>
                <p className="text-sm text-green-800">
                  Your {floorCount}-floor design complies with {city}'s FSI regulations.
                  You're using {fsiValidation.fsiUsed.toFixed(2)} out of {fsiValidation.fsiMax} maximum FSI.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">FSI Violation ⚠</h4>
                <p className="text-sm text-red-800 mb-3">
                  {fsiValidation.message}
                </p>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-xs text-red-700 font-medium mb-1">Recommendation:</p>
                  <p className="text-sm text-red-900">
                    {(() => {
                      const areaInSqm = areaUnit === "sqft" ? area * 0.092903 : area;
                      // Use same calculation as above
                      let groundFloorPercentage = 0.75;
                      if (areaInSqm > 150) groundFloorPercentage = 0.70;
                      if (areaInSqm > 200) groundFloorPercentage = 0.68;
                      const groundFloorArea = areaInSqm * groundFloorPercentage;
                      const upperFloorArea = areaInSqm * 0.75;

                      // Calculate max floors: ground + additional floors
                      const remainingArea = fsiValidation.maxAllowed - groundFloorArea;
                      const maxAdditionalFloors = Math.floor(remainingArea / upperFloorArea);
                      const maxFloors = maxAdditionalFloors + 1;

                      return `With your plot size, you can build up to ${maxFloors} floor${maxFloors > 1 ? 's' : ''} to comply with FSI regulations.
                              Alternatively, increase the plot area or reduce the number of floors.`;
                    })()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AreaStep;
