import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, IndianRupee } from "lucide-react";
import { ComponentOption, ProjectEstimate } from "@/types/estimator";

interface BudgetMatchingStepProps {
  budget: number;
  estimate: ProjectEstimate;
  onBudgetChange: (budget: number) => void;
  onApplySuggestions: (suggestions: Partial<ProjectEstimate>) => void;
}

interface ComponentSuggestion {
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
}

// Location-based cost multipliers (must match EstimatorContext)
const LOCATION_MULTIPLIERS: Record<string, number> = {
  "Mumbai": 1.30, "Navi Mumbai": 1.25, "Thane": 1.22,
  "Delhi": 1.25, "New Delhi": 1.25, "Gurgaon": 1.28, "Noida": 1.22,
  "Bangalore": 1.20, "Bengaluru": 1.20,
  "Hyderabad": 1.15, "Chennai": 1.15, "Pune": 1.15,
  "Ahmedabad": 1.10, "Surat": 1.08, "Jaipur": 1.10,
  "Kochi": 1.05, "Coimbatore": 1.05, "Indore": 1.05,
  "Chandigarh": 1.12, "Lucknow": 1.02,
  "Visakhapatnam": 1.00, "Nagpur": 1.00, "Vadodara": 1.05,
  "default": 0.95
};

// Component pricing per square meter (must match EstimatorContext - updated to 2025 market rates)
const COMPONENT_PRICING: Record<string, Record<ComponentOption, number>> = {
  civilQuality: { none: 0, standard: 300, premium: 700, luxury: 1400 },
  plumbing: { none: 0, standard: 500, premium: 1500, luxury: 3500 },
  electrical: { none: 0, standard: 400, premium: 1200, luxury: 2800 },
  ac: { none: 0, standard: 800, premium: 2200, luxury: 5000 },
  elevator: { none: 0, standard: 750, premium: 1300, luxury: 2300 },
  buildingEnvelope: { none: 0, standard: 150, premium: 400, luxury: 900 },
  lighting: { none: 0, standard: 400, premium: 1200, luxury: 3000 },
  windows: { none: 0, standard: 500, premium: 1500, luxury: 3500 },
  ceiling: { none: 0, standard: 350, premium: 1000, luxury: 2500 },
  surfaces: { none: 0, standard: 600, premium: 1800, luxury: 4000 },
  fixedFurniture: { none: 0, standard: 3000, premium: 8000, luxury: 15000 },
  looseFurniture: { none: 0, standard: 2000, premium: 5000, luxury: 12000 },
  furnishings: { none: 0, standard: 500, premium: 2000, luxury: 4000 },
  appliances: { none: 0, standard: 1000, premium: 3500, luxury: 8000 },
  artefacts: { none: 0, standard: 300, premium: 1500, luxury: 3500 },
};

const BASE_CONSTRUCTION_COST: Record<string, number> = {
  residential: 15000,
  commercial: 18000,
  "mixed-use": 21000,
};

const BudgetMatchingStep = ({
  budget,
  estimate,
  onBudgetChange,
  onApplySuggestions,
}: BudgetMatchingStepProps) => {
  const [inputBudget, setInputBudget] = useState<string>(budget > 0 ? budget.toString() : "");
  const [suggestions, setSuggestions] = useState<ComponentSuggestion | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<"low" | "moderate" | "good" | "excellent" | null>(null);

  // Calculate effective area (matching EstimatorContext logic)
  const getEffectiveArea = (): number => {
    let baseAreaInSqM = estimate.areaUnit === "sqft" ? estimate.area * 0.092903 : estimate.area;

    if (estimate.areaInputType === "plot" && estimate.builtUpArea) {
      return estimate.builtUpArea;
    } else if (estimate.areaInputType === "plinth" && estimate.floorCount) {
      return baseAreaInSqM * estimate.floorCount;
    }
    // For built-up area or default, use as-is (area is already total across all floors)
    return baseAreaInSqM;
  };

  const areaInSqM = getEffectiveArea();

  // Get multipliers (matching EstimatorContext)
  const getSizeMultiplier = (areaInSqM: number): number => {
    if (areaInSqM < 50) return 1.20;
    if (areaInSqM < 100) return 1.12;
    if (areaInSqM < 200) return 1.05;
    if (areaInSqM >= 500) return 0.95;
    return 1.0;
  };

  const getLocationMultiplier = (): number => {
    return LOCATION_MULTIPLIERS[estimate.city] || LOCATION_MULTIPLIERS["default"];
  };

  const getProjectTypeMultiplier = (): number => {
    let baseMultiplier = 1.0;
    if (estimate.projectType === "commercial") baseMultiplier = 1.15;
    else if (estimate.projectType === "mixed-use") baseMultiplier = 1.25;

    const complexityAdjustment = ((estimate.complexity || 5) - 5) * 0.05;
    return baseMultiplier * (1 + complexityAdjustment);
  };

  const sizeMultiplier = getSizeMultiplier(areaInSqM);
  const locationMultiplier = getLocationMultiplier();
  const projectMultiplier = getProjectTypeMultiplier();

  // Calculate full cost with all multipliers
  const calculateFullCost = (components: ComponentSuggestion): number => {
    const hasConstruction = estimate.workTypes?.includes("construction") ?? false;
    const hasInteriors = estimate.workTypes?.includes("interiors") ?? false;

    // Base construction cost
    const baseCost = (BASE_CONSTRUCTION_COST[estimate.projectType] || BASE_CONSTRUCTION_COST.residential) * areaInSqM;
    let qualityMultiplier = 1.0;
    if (components.civilQuality === "premium") qualityMultiplier = 1.6;
    else if (components.civilQuality === "luxury") qualityMultiplier = 2.8;
    else if (components.civilQuality === "none") qualityMultiplier = 0;

    const constructionCost = baseCost * qualityMultiplier * sizeMultiplier;

    // Component costs
    const civilQualityCost = hasConstruction ? COMPONENT_PRICING.civilQuality[components.civilQuality] * areaInSqM * 0.15 : 0;
    const core = (
      civilQualityCost +
      COMPONENT_PRICING.plumbing[components.plumbing] * areaInSqM +
      COMPONENT_PRICING.electrical[components.electrical] * areaInSqM +
      COMPONENT_PRICING.ac[components.ac] * areaInSqM +
      COMPONENT_PRICING.elevator[components.elevator] * areaInSqM
    ) * sizeMultiplier;

    const buildingEnvelopeCost = hasConstruction ? COMPONENT_PRICING.buildingEnvelope[components.buildingEnvelope] * areaInSqM : 0;
    const windowsCost = hasConstruction ? COMPONENT_PRICING.windows[components.windows] * areaInSqM : 0;
    const finishes = (
      buildingEnvelopeCost +
      COMPONENT_PRICING.lighting[components.lighting] * areaInSqM +
      windowsCost +
      COMPONENT_PRICING.ceiling[components.ceiling] * areaInSqM +
      COMPONENT_PRICING.surfaces[components.surfaces] * areaInSqM
    ) * sizeMultiplier;

    const interiors = hasInteriors ? (
      COMPONENT_PRICING.fixedFurniture[components.fixedFurniture] * areaInSqM +
      COMPONENT_PRICING.looseFurniture[components.looseFurniture] * areaInSqM +
      COMPONENT_PRICING.furnishings[components.furnishings] * areaInSqM +
      COMPONENT_PRICING.appliances[components.appliances] * areaInSqM +
      COMPONENT_PRICING.artefacts[components.artefacts] * areaInSqM
    ) * sizeMultiplier : 0;

    // Apply all multipliers
    let subtotal = constructionCost + core + finishes + interiors;
    subtotal *= locationMultiplier;
    subtotal *= projectMultiplier;

    // Add professional fees and contingency (aligned with architects4design.com)
    const professionalFees = subtotal * 0.03; // 3% (reduced from 13%)
    const contingency = subtotal * 0.05; // 5% (reduced from 9%)
    const totalBeforeTax = subtotal + professionalFees + contingency;
    const gst = totalBeforeTax * 0.06; // 6% effective (reduced from 12%)

    return Math.round(totalBeforeTax + gst);
  };

  // Calculate minimum viable budget
  const calculateMinimumBudget = (): number => {
    const hasConstruction = estimate.workTypes?.includes("construction") ?? false;
    const hasInteriors = estimate.workTypes?.includes("interiors") ?? false;

    const minSuggestions: ComponentSuggestion = {
      civilQuality: hasConstruction ? "standard" : "none",
      plumbing: "standard",
      electrical: "standard",
      ac: "none",
      elevator: "none",
      buildingEnvelope: hasConstruction ? "standard" : "none",
      lighting: "standard",
      windows: hasConstruction ? "standard" : "none",
      ceiling: "standard",
      surfaces: "standard",
      fixedFurniture: hasInteriors ? "standard" : "none",
      looseFurniture: "none",
      furnishings: "none",
      appliances: "none",
      artefacts: "none",
    };

    return calculateFullCost(minSuggestions);
  };

  const minimumBudget = calculateMinimumBudget();

  // Generate budget-based suggestions
  const generateSuggestions = (targetBudget: number): ComponentSuggestion => {
    const hasConstruction = estimate.workTypes?.includes("construction") ?? false;
    const hasInteriors = estimate.workTypes?.includes("interiors") ?? false;

    // Calculate budget ratio
    const budgetRatio = targetBudget / minimumBudget;

    // Default baseline suggestions
    const suggestion: ComponentSuggestion = {
      civilQuality: hasConstruction ? "standard" : "none",
      plumbing: "standard",
      electrical: "standard",
      ac: "none",
      elevator: "none",
      buildingEnvelope: hasConstruction ? "standard" : "none",
      lighting: "standard",
      windows: hasConstruction ? "standard" : "none",
      ceiling: "standard",
      surfaces: "standard",
      fixedFurniture: hasInteriors ? "standard" : "none",
      looseFurniture: "none",
      furnishings: "none",
      appliances: "none",
      artefacts: "none",
    };

    // Upgrade based on budget ratio
    if (budgetRatio >= 2.5) {
      // Luxury budget - 2.5x minimum or more
      suggestion.civilQuality = hasConstruction ? "luxury" : "none";
      suggestion.plumbing = "luxury";
      suggestion.electrical = "luxury";
      suggestion.ac = "luxury";
      suggestion.elevator = "premium";
      suggestion.buildingEnvelope = hasConstruction ? "luxury" : "none";
      suggestion.lighting = "luxury";
      suggestion.windows = hasConstruction ? "luxury" : "none";
      suggestion.ceiling = "luxury";
      suggestion.surfaces = "luxury";
      suggestion.fixedFurniture = hasInteriors ? "luxury" : "none";
      suggestion.looseFurniture = hasInteriors ? "luxury" : "none";
      suggestion.furnishings = hasInteriors ? "premium" : "none";
      suggestion.appliances = hasInteriors ? "premium" : "none";
      suggestion.artefacts = hasInteriors ? "standard" : "none";
    } else if (budgetRatio >= 1.8) {
      // Premium budget - 1.8x to 2.5x minimum
      suggestion.civilQuality = hasConstruction ? "premium" : "none";
      suggestion.plumbing = "premium";
      suggestion.electrical = "premium";
      suggestion.ac = "premium";
      suggestion.elevator = "standard";
      suggestion.buildingEnvelope = hasConstruction ? "premium" : "none";
      suggestion.lighting = "premium";
      suggestion.windows = hasConstruction ? "premium" : "none";
      suggestion.ceiling = "premium";
      suggestion.surfaces = "premium";
      suggestion.fixedFurniture = hasInteriors ? "premium" : "none";
      suggestion.looseFurniture = hasInteriors ? "standard" : "none";
      suggestion.furnishings = hasInteriors ? "standard" : "none";
      suggestion.appliances = hasInteriors ? "standard" : "none";
    } else if (budgetRatio >= 1.3) {
      // Good budget - 1.3x to 1.8x minimum
      suggestion.ac = "standard";
      suggestion.plumbing = "premium";
      suggestion.electrical = "premium";
      suggestion.lighting = "premium";
      suggestion.surfaces = "premium";
      suggestion.fixedFurniture = hasInteriors ? "standard" : "none";
    } else if (budgetRatio >= 1.1) {
      // Moderate budget - 1.1x to 1.3x minimum
      suggestion.ac = "standard";
    }
    // else keep baseline (minimum) configuration

    return suggestion;
  };

  // Handle budget analysis
  const analyzeBudget = () => {
    const budgetValue = parseFloat(inputBudget);

    if (isNaN(budgetValue) || budgetValue <= 0) {
      setSuggestions(null);
      setBudgetStatus(null);
      return;
    }

    onBudgetChange(budgetValue);
    const generatedSuggestions = generateSuggestions(budgetValue);
    setSuggestions(generatedSuggestions);

    // Determine budget status
    const budgetRatio = budgetValue / minimumBudget;
    if (budgetRatio < 0.9) {
      setBudgetStatus("low");
    } else if (budgetRatio < 1.3) {
      setBudgetStatus("moderate");
    } else if (budgetRatio < 1.8) {
      setBudgetStatus("good");
    } else {
      setBudgetStatus("excellent");
    }
  };

  const handleApplySuggestions = () => {
    if (suggestions) {
      onApplySuggestions(suggestions);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getQualityBadgeColor = (option: ComponentOption) => {
    switch (option) {
      case "luxury": return "bg-purple-100 text-purple-800 border-purple-300";
      case "premium": return "bg-blue-100 text-blue-800 border-blue-300";
      case "standard": return "bg-green-100 text-green-800 border-green-300";
      case "none": return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Calculate estimated cost with suggestions
  const estimatedCost = suggestions ? calculateFullCost(suggestions) : 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Sparkles className="size-5 text-vs" />
          Budget-Based Component Matching <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
        </h3>
        <p className="text-sm text-muted-foreground">
          Have a budget in mind? We'll suggest the best combination of components to match it.
          You can always customize selections in the next step, or <strong className="text-vs">skip this entirely</strong> if you prefer to choose manually.
        </p>
      </div>

      {/* Budget Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="size-5" />
            Enter Your Budget
          </CardTitle>
          <CardDescription>
            What's your total project budget? We'll help you make the most of it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Amount (INR)</Label>
            <div className="flex gap-3">
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 5000000"
                value={inputBudget}
                onChange={(e) => setInputBudget(e.target.value)}
                className="flex-1"
              />
              <Button onClick={analyzeBudget} className="bg-vs hover:bg-vs/90">
                Analyze Budget
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Minimum recommended budget for your project: <strong className="text-vs">{formatCurrency(minimumBudget)}</strong></p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              This estimate includes location ({estimate.city}), project complexity, and all applicable fees.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Budget Status Messages */}
      {budgetStatus === "low" && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="size-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Hey there!</strong> We appreciate your enthusiasm, but your budget might be a bit tight for what you have in mind.
            The minimum we'd recommend for a quality project of this size is around <strong>{formatCurrency(minimumBudget)}</strong>.
            <br /><br />
            Don't worry though! We can still work with what you have - we'll focus on the essentials and keep things smart and simple.
            You might want to consider phasing the project or adjusting the scope to make it work beautifully within your means.
          </AlertDescription>
        </Alert>
      )}

      {budgetStatus === "moderate" && (
        <Alert className="border-blue-200 bg-blue-50">
          <TrendingUp className="size-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Good start!</strong> Your budget gives us room to work with the essentials and add some nice touches.
            We'll make every rupee count by focusing on quality where it matters most. Let's create something you'll love!
          </AlertDescription>
        </Alert>
      )}

      {budgetStatus === "good" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Excellent!</strong> Your budget allows us to deliver a well-rounded project with quality materials and finishes.
            We can incorporate some premium elements while maintaining great value. This is a sweet spot for creating something special!
          </AlertDescription>
        </Alert>
      )}

      {budgetStatus === "excellent" && (
        <Alert className="border-purple-200 bg-purple-50">
          <Sparkles className="size-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Wonderful!</strong> With this budget, we can truly bring your vision to life with premium materials,
            luxury finishes, and all the bells and whistles. Let's create something extraordinary together!
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions && (
        <Card className="border-vs/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recommended Component Selection</span>
              <Badge variant="outline" className="text-vs border-vs">
                Estimated: {formatCurrency(estimatedCost)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Based on your budget of {formatCurrency(parseFloat(inputBudget))}, here's what we recommend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(suggestions).map(([key, value]) => {
                if (value === "none") return null;

                const displayNames: Record<string, string> = {
                  civilQuality: "Civil Materials",
                  plumbing: "Plumbing",
                  electrical: "Electrical",
                  ac: "A.C. & HVAC",
                  elevator: "Elevator",
                  buildingEnvelope: "Building Envelope",
                  lighting: "Lighting",
                  windows: "Windows",
                  ceiling: "Ceiling",
                  surfaces: "Surfaces",
                  fixedFurniture: "Fixed Furniture",
                  looseFurniture: "Loose Furniture",
                  furnishings: "Furnishings",
                  appliances: "Appliances",
                  artefacts: "Artefacts",
                };

                return (
                  <div key={key} className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                    <span className="text-xs font-medium text-muted-foreground">
                      {displayNames[key]}
                    </span>
                    <Badge variant="outline" className={getQualityBadgeColor(value)}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleApplySuggestions} className="flex-1 bg-vs hover:bg-vs/90">
                Apply These Suggestions
              </Button>
              <Button variant="outline" onClick={() => {
                setSuggestions(null);
                setBudgetStatus(null);
                setInputBudget("");
              }}>
                Clear
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Don't worry - you can customize any of these selections in the next step!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skip Option - Prominent */}
      <Card className="border-dashed border-2 border-vs/20 bg-vs/5">
        <CardContent className="pt-6 text-center">
          <h4 className="font-medium text-vs-dark mb-2">
            Prefer to Choose Components Yourself?
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            No problem! Click "Next" below to skip budget matching and manually select each component's quality level.
            Perfect if you have specific preferences or want full control.
          </p>
          <p className="text-xs text-vs font-medium">
            💡 Tip: You can proceed without entering a budget
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetMatchingStep;
