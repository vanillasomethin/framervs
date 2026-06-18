import { ComponentOption } from "@/types/estimator";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QualityLevel {
  label: string;
  value: ComponentOption;
  price: number;
  description: string;
}

interface QualityLevelSelectorProps {
  component: string;
  currentValue: ComponentOption;
  onChange: (value: ComponentOption) => void;
  required?: boolean;
}

// Component-specific descriptions and pricing
const COMPONENT_CONFIG: Record<string, {
  notRequiredDesc: string;
  standardDesc: string;
  premiumDesc: string;
  luxuryDesc: string;
  pricing: { standard: number; premium: number; luxury: number };
}> = {
  civilQuality: {
    notRequiredDesc: "For interior-only projects where structural work is already complete. Assumes existing building envelope is in good condition.",
    standardDesc: "M20 grade concrete, Fe415 steel, standard brick/AAC blocks. Basic construction quality suitable for most residential projects with 30-year design life.",
    premiumDesc: "M25 grade concrete, Fe500 steel, solid bricks/premium blocks. Enhanced structural integrity with weather-resistant materials and 50-year design life.",
    luxuryDesc: "M30+ grade concrete, high-strength steel, engineered materials. Superior construction with seismic resistance, waterproofing, and 75+ year design life.",
    pricing: { standard: 1500, premium: 2300, luxury: 3800 }
  },
  plumbing: {
    notRequiredDesc: "No plumbing work needed. Suitable for projects where plumbing infrastructure exists or isn't required (storage, garages, etc.).",
    standardDesc: "CPVC/PVC pipes, basic fixtures (Parryware/Hindware), standard taps and fittings. Includes water supply lines, drainage, and basic sanitary fixtures.",
    premiumDesc: "Premium CPVC/copper pipes, branded fixtures (Kohler/Grohe), designer faucets. Enhanced pressure systems, hot water circulation, and quality fittings.",
    luxuryDesc: "Copper/stainless steel pipes, luxury fixtures (Duravit/Hansgrohe), smart water systems. Includes water softeners, purification, touchless controls, and premium finishes.",
    pricing: { standard: 500, premium: 1000, luxury: 2000 }
  },
  electrical: {
    notRequiredDesc: "No electrical work required. Only for projects where electrical infrastructure is complete or not needed.",
    standardDesc: "ISI marked copper wiring, MCB protection, modular switches (Anchor/GM). Standard lighting points, power outlets, and distribution boards for residential use.",
    premiumDesc: "Fire-retardant wiring, branded switches (Legrand/Schneider), LED-ready infrastructure. Enhanced load capacity, safety features, and organized cable management.",
    luxuryDesc: "Premium wiring systems, designer switches (Legrand Arteor/Gira), home automation-ready. Smart lighting controls, integrated AV systems, and backup power provisions.",
    pricing: { standard: 450, premium: 850, luxury: 1650 }
  },
  ac: {
    notRequiredDesc: "No air conditioning required. Suitable for temperate climates or projects relying on natural ventilation.",
    standardDesc: "Split AC units (1.5-2 ton), basic ducting, standard vents. Energy-efficient systems for essential cooling in bedrooms and living areas.",
    premiumDesc: "Multi-split/VRV systems, concealed ducting, designer vents. Advanced climate control with better efficiency and noise reduction across all spaces.",
    luxuryDesc: "Centralized VRF systems, complete concealment, zone control. Premium brands (Daikin VRV/Mitsubishi), air purification, smart controls, and silent operation.",
    pricing: { standard: 650, premium: 1300, luxury: 2800 }
  },
  elevator: {
    notRequiredDesc: "No elevator needed. Suitable for single/double-story buildings or where vertical transportation isn't required.",
    standardDesc: "Hydraulic lift (4-6 person capacity), basic cabin finish, standard controls. Essential vertical transport with safety features for 2-4 floor buildings.",
    premiumDesc: "Traction lift (6-8 person), quality cabin finishes, smooth operation. Faster, quieter lifts with better aesthetics for 4-6 floor buildings.",
    luxuryDesc: "High-speed traction lifts (8-10 person), luxury finishes, smart controls. Premium brands (Otis/Schindler) with glass panels, destination control, and emergency systems.",
    pricing: { standard: 1500, premium: 2300, luxury: 3800 }
  },
  buildingEnvelope: {
    notRequiredDesc: "No exterior facade work. For interior-only projects or where building exterior is complete.",
    standardDesc: "Cement plaster, weather-resistant paint, basic waterproofing. Standard exterior finish with basic protection against elements.",
    premiumDesc: "Textured plaster/stone cladding, premium weather coatings, enhanced insulation. Better aesthetics with improved thermal and acoustic protection.",
    luxuryDesc: "ACP panels/natural stone, architectural features, complete thermal envelope. Premium facade with metal/glass elements, superior weatherproofing, and design appeal.",
    pricing: { standard: 400, premium: 800, luxury: 1600 }
  },
  lighting: {
    notRequiredDesc: "No decorative lighting needed. Basic electrical points only without fixtures.",
    standardDesc: "LED panels, basic decorative lights, standard fixtures. Essential ambient and task lighting with energy-efficient LED technology.",
    premiumDesc: "Designer LED fixtures, cove lighting, dimmers. Branded lights (Philips/Osram) with layered lighting design and smart controls.",
    luxuryDesc: "Architectural lighting, imported fixtures, complete automation. Premium brands (iGuzzini/Erco) with scene control, color tuning, and art lighting.",
    pricing: { standard: 300, premium: 650, luxury: 1300 }
  },
  windows: {
    notRequiredDesc: "No window work required. Existing windows retained or not applicable.",
    standardDesc: "Aluminum/uPVC frames, single glazed glass, basic hardware. Standard windows with mosquito mesh and basic weather sealing.",
    premiumDesc: "Premium uPVC/wood frames, double glazed glass, quality hardware. Better insulation, noise reduction, and German/Italian hardware.",
    luxuryDesc: "Imported systems (Schüco/Reynaers), acoustic glazing, designer hardware. Slim frames, large spans, motorized options, and superior performance.",
    pricing: { standard: 500, premium: 1000, luxury: 2000 }
  },
  ceiling: {
    notRequiredDesc: "No false ceiling work. Exposed/existing ceiling to be retained.",
    standardDesc: "Gypsum board ceiling, basic finish, simple profiles. Standard false ceiling with basic designs and recessed lighting provisions.",
    premiumDesc: "Premium gypsum/POP, designer profiles, cove lighting. Enhanced aesthetics with complex profiles, better finish quality, and integrated lighting.",
    luxuryDesc: "Acoustic panels, imported systems, architectural features. Premium materials with 3D designs, concealed AC vents, and complete integration.",
    pricing: { standard: 300, premium: 600, luxury: 1200 }
  },
  surfaces: {
    notRequiredDesc: "No flooring/wall finishes. Bare surfaces to be left as-is or existing finishes retained.",
    standardDesc: "Vitrified tiles (600x600), basic wall paint, simple skirting. Standard quality flooring and wall finishes suitable for residential use.",
    premiumDesc: "Large format tiles/engineered wood, premium paint (Asian Paints Royale), designer skirting. Better quality materials with enhanced aesthetics and durability.",
    luxuryDesc: "Imported marble/hardwood, luxury finishes (Italian marble/Jotun paints), premium trims. High-end materials with exquisite patterns and superior finish quality.",
    pricing: { standard: 550, premium: 1100, luxury: 2200 }
  },
  fixedFurniture: {
    notRequiredDesc: "No built-in furniture. Loose furniture only or client to arrange separately.",
    standardDesc: "Plywood (BWP) with laminate finish, basic hardware. Standard modular kitchen, wardrobes, and storage with durable construction.",
    premiumDesc: "Premium plywood/particle board, branded laminates (Merino/Greenlam), soft-close hardware. Better finishes with enhanced functionality and hardware.",
    luxuryDesc: "Imported boards, luxury veneers/laminates, premium hardware (Hettich/Blum). High-end cabinetry with handleless options, glass shutters, and customization.",
    pricing: { standard: 900, premium: 1700, luxury: 3200 }
  },
  looseFurniture: {
    notRequiredDesc: "No loose furniture included. Client to purchase furniture separately.",
    standardDesc: "Quality Indian brands (Godrej/Durian), solid construction. Essential furniture pieces including sofa, beds, dining, with basic upholstery.",
    premiumDesc: "Premium Indian/international brands (Urban Ladder/Pepperfry), designer pieces. Better quality furniture with branded fabric/leather and enhanced comfort.",
    luxuryDesc: "Imported/custom furniture (Natuzzi/Roche Bobois), luxury materials. Bespoke pieces with premium leather/fabric, designer aesthetics, and superior craftsmanship.",
    pricing: { standard: 650, premium: 1300, luxury: 3000 }
  },
  furnishings: {
    notRequiredDesc: "No soft furnishings included. Client to arrange curtains, rugs, etc. separately.",
    standardDesc: "Basic curtains with tracks, standard rugs, essential soft decor. Functional furnishings with decent quality fabrics and basic designs.",
    premiumDesc: "Designer curtains (motorized options), branded rugs, coordinated soft decor. Better quality fabrics with enhanced aesthetics and layered window treatments.",
    luxuryDesc: "Imported fabrics, custom upholstery, luxury soft furnishings. Premium materials with designer patterns, motorized systems, and complete customization.",
    pricing: { standard: 200, premium: 450, luxury: 950 }
  },
  appliances: {
    notRequiredDesc: "No appliances included. Client to purchase all appliances separately.",
    standardDesc: "Standard Indian brands (IFB/Voltas), essential appliances. Basic kitchen appliances, water purifier, and geyser with good functionality.",
    premiumDesc: "Premium brands (Bosch/Samsung), branded appliances. Better quality kitchen suite, smart features, and enhanced energy efficiency.",
    luxuryDesc: "Imported brands (Miele/Gaggenau), luxury appliances, smart home integration. High-end kitchen appliances, wine coolers, and complete automation.",
    pricing: { standard: 400, premium: 800, luxury: 1800 }
  },
  artefacts: {
    notRequiredDesc: "No decorative items included. Client to arrange all decor separately.",
    standardDesc: "Basic artwork, simple decorative pieces, essential styling. Curated decor items to enhance aesthetics with budget-friendly options.",
    premiumDesc: "Designer artwork, branded decor pieces, styled accessories. Better quality decorative items with coordinated color schemes and themes.",
    luxuryDesc: "Custom artwork, imported sculptures, luxury decorative pieces. High-end art, antiques, designer objects, and complete styling with unique pieces.",
    pricing: { standard: 150, premium: 400, luxury: 900 }
  },
};

const QualityLevelSelector = ({
  component,
  currentValue,
  onChange,
  required = false,
}: QualityLevelSelectorProps) => {
  const config = COMPONENT_CONFIG[component] || COMPONENT_CONFIG.civilQuality;
  
  const qualityLevels: QualityLevel[] = [
    {
      label: "Not Required",
      value: "none",
      price: 0,
      description: config.notRequiredDesc,
    },
    {
      label: "Standard",
      value: "standard",
      price: config.pricing.standard,
      description: config.standardDesc,
    },
    {
      label: "Premium",
      value: "premium",
      price: config.pricing.premium,
      description: config.premiumDesc,
    },
    {
      label: "Luxury",
      value: "luxury",
      price: config.pricing.luxury,
      description: config.luxuryDesc,
    },
  ];

  const availableLevels = required
    ? qualityLevels.filter((level) => level.value !== "none")
    : qualityLevels;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {availableLevels.map((level) => (
          <TooltipProvider key={level.value} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onChange(level.value)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                    currentValue === level.value
                      ? "border-vs bg-vs/5 shadow-sm"
                      : "border-gray-200 hover:border-vs/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{level.label}</span>
                    <Info className="size-4 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {level.price === 0 ? (
                      <span className="font-medium">₹0</span>
                    ) : (
                      <>
                        <span className="font-medium">₹{Math.round(level.price / 10.764)}</span>
                        <span>/sqft</span>
                      </>
                    )}
                  </div>
                  {currentValue === level.value && (
                    <div className="absolute top-2 right-2 size-2 rounded-full bg-vs" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{level.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      {currentValue && (
        <>
          <p className="text-xs text-muted-foreground pl-1">
            Selected: <span className="font-medium">
              {qualityLevels.find(l => l.value === currentValue)?.label}
            </span>
            {qualityLevels.find(l => l.value === currentValue)?.price! > 0 && (
              <span> - ₹{Math.round(qualityLevels.find(l => l.value === currentValue)?.price! / 10.764)}/sqft</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground pl-1 mt-1">
            {qualityLevels.find(l => l.value === currentValue)?.description}
          </p>
        </>
      )}
    </div>
  );
};

export default QualityLevelSelector;
