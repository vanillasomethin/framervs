import {
  Waves,
  Dumbbell,
  Flame,
  Clapperboard,
  Cpu,
  Sun,
  ChefHat,
  Bath,
  Wine,
  Droplets,
  Check,
} from "lucide-react";
import { AmenityOption, ProjectSubcategory } from "@/types/estimator";
import { cn } from "@/lib/utils";

interface AmenitiesStepProps {
  selectedAmenities: AmenityOption[];
  projectType: string;
  workTypes: ProjectSubcategory[];
  onToggleAmenity: (amenities: AmenityOption[]) => void;
}

interface AmenityConfig {
  id: AmenityOption;
  title: string;
  icon: React.ReactNode;
  price: number;
  description: string;
}

// Indicative lump-sum costs (₹) mirrored from the estimator engine. The location
// multiplier is applied to these in the calculation; the figures here are the
// base/national reference shown to set expectations.
const AMENITIES: AmenityConfig[] = [
  { id: "swimmingPool", title: "Swimming Pool", icon: <Waves className="size-5" />, price: 2000000, description: "In-ground pool with filtration, pump room & deck" },
  { id: "homeTheater", title: "Home Theater", icon: <Clapperboard className="size-5" />, price: 1200000, description: "Acoustic room, projector/AV & recliner seating" },
  { id: "homeGym", title: "Home Gym", icon: <Dumbbell className="size-5" />, price: 800000, description: "Equipment, rubber flooring & mirror wall" },
  { id: "wineCellar", title: "Wine Cellar", icon: <Wine className="size-5" />, price: 600000, description: "Climate-controlled storage & display racking" },
  { id: "homeAutomation", title: "Home Automation", icon: <Cpu className="size-5" />, price: 600000, description: "Whole-home lighting, AV, security & climate control" },
  { id: "saunaSteam", title: "Sauna / Steam", icon: <Flame className="size-5" />, price: 500000, description: "Sauna or steam cabin with controls" },
  { id: "jacuzziSpa", title: "Jacuzzi / Spa", icon: <Bath className="size-5" />, price: 450000, description: "Jacuzzi tub or spa unit with jets & heater" },
  { id: "solarPower", title: "Solar Power", icon: <Sun className="size-5" />, price: 400000, description: "~5kW rooftop solar with inverter & net metering" },
  { id: "outdoorKitchen", title: "Outdoor Kitchen / BBQ", icon: <ChefHat className="size-5" />, price: 350000, description: "Outdoor counter, grill & utility connections" },
  { id: "borewell", title: "Borewell", icon: <Droplets className="size-5" />, price: 250000, description: "Borewell drilling, submersible pump & plumbing" },
];

const AmenitiesStep = ({
  selectedAmenities,
  projectType,
  workTypes,
  onToggleAmenity,
}: AmenitiesStepProps) => {
  // Amenities are only meaningful when building/renovating — an interiors-only or
  // landscape-only scope wouldn't add a pool or solar plant.
  const hasConstruction = workTypes?.includes("construction") ?? false;
  // Most relevant to residential & mixed-use (villas, independent houses,
  // penthouses). Commercial projects rarely spec these via this tool.
  const isRelevantType = projectType === "residential" || projectType === "mixed-use";

  if (!hasConstruction || !isRelevantType) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const toggle = (id: AmenityOption) => {
    const next = selectedAmenities.includes(id)
      ? selectedAmenities.filter((a) => a !== id)
      : [...selectedAmenities, id];
    onToggleAmenity(next);
  };

  const selectedTotal = AMENITIES
    .filter((a) => selectedAmenities.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h3 className="text-lg font-medium mb-2">Premium Amenities</h3>
        <p className="text-sm text-muted-foreground">
          Optional lifestyle additions priced as lump-sum installations (not per sqft). Select any that apply —
          figures shown are for a ~2,500 sqft reference project and are adjusted for your project's actual size and city.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AMENITIES.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity.id);
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => toggle(amenity.id)}
              className={cn(
                "group relative flex items-start gap-3 border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md",
                isSelected
                  ? "border-vs bg-vs/5 shadow-sm"
                  : "border-gray-200 hover:border-vs/50"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 size-5 bg-vs rounded-full flex items-center justify-center">
                  <Check className="size-3 text-white" />
                </div>
              )}
              <div className={cn(
                "flex-shrink-0 flex items-center justify-center size-10 rounded-lg transition-colors",
                isSelected ? "bg-vs text-white" : "bg-primary/5 text-primary/70 group-hover:bg-primary/10"
              )}>
                {amenity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="font-medium text-sm text-vs-dark">{amenity.title}</h4>
                  <span className="text-xs font-semibold text-vs whitespace-nowrap">{formatPrice(amenity.price)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{amenity.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedAmenities.length > 0 && (
        <div className="flex items-center justify-between bg-vs/5 border border-vs/20 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-vs-dark">
            {selectedAmenities.length} amenit{selectedAmenities.length === 1 ? "y" : "ies"} selected
          </span>
          <span className="text-sm font-semibold text-vs">
            ≈ {formatPrice(selectedTotal)} <span className="text-xs font-normal text-muted-foreground">(before size/city adjustment)</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AmenitiesStep;
