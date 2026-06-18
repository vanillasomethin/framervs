import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ProjectEstimate, ComponentOption } from "@/types/estimator";
import { Share, CheckCircle2, Download, IndianRupee, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImprovedCostVisualization from "./ImprovedCostVisualization";
import PhaseTimelineCost from "./PhaseTimelineCost";
import MeetingScheduler from "./MeetingScheduler";
import DetailedBreakdownSection from "./DetailedBreakdownSection";
import FAQSection from "./FAQSection";
import { generateEstimatePDF } from "@/utils/pdfExport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ResultsStepProps {
  estimate: ProjectEstimate;
  onReset: () => void;
  onSave: () => void;
}

// Component pricing per square meter mapping for display
// Updated based on realistic 2025 Indian construction costs
const COMPONENT_PRICING_PER_SQM: Record<string, Record<ComponentOption, number>> = {
  civilQuality: { none: 0, standard: 1500, premium: 2300, luxury: 3800 },
  plumbing: { none: 0, standard: 500, premium: 1000, luxury: 2000 },
  electrical: { none: 0, standard: 450, premium: 850, luxury: 1650 },
  ac: { none: 0, standard: 650, premium: 1300, luxury: 2800 },
  elevator: { none: 0, standard: 1500, premium: 2300, luxury: 3800 },
  buildingEnvelope: { none: 0, standard: 400, premium: 800, luxury: 1600 },
  lighting: { none: 0, standard: 300, premium: 650, luxury: 1300 },
  windows: { none: 0, standard: 500, premium: 1000, luxury: 2000 },
  ceiling: { none: 0, standard: 300, premium: 600, luxury: 1200 },
  surfaces: { none: 0, standard: 550, premium: 1100, luxury: 2200 },
  fixedFurniture: { none: 0, standard: 900, premium: 1700, luxury: 3200 },
  looseFurniture: { none: 0, standard: 650, premium: 1300, luxury: 3000 },
  furnishings: { none: 0, standard: 200, premium: 450, luxury: 950 },
  appliances: { none: 0, standard: 400, premium: 800, luxury: 1800 },
  artefacts: { none: 0, standard: 150, premium: 400, luxury: 900 },
};

// Component descriptions for detailed breakdown with specs/brands
const COMPONENT_DESCRIPTIONS: Record<string, { standard: string[]; premium: string[]; luxury: string[] }> = {
  civilQuality: {
    standard: ["UltraTech/ACC cement", "TMT Fe500D steel bars", "Red clay/Solid concrete blocks", "M20 grade concrete", "Standard brick masonry"],
    premium: ["Birla A1 cement", "TATA Tiscon steel", "AAC blocks (Siporex/Magicrete)", "M25 grade concrete", "Wire-cut clay bricks", "Premium plastering finish"],
    luxury: ["Premium imported cement", "High-grade steel with corrosion resistance", "Premium AAC blocks", "M30+ grade concrete", "Designer bricks/stone cladding", "Multi-coat premium plastering"]
  },
  plumbing: {
    standard: ["Astral/Ashirvad CPVC pipes", "Hindware/Parryware fixtures", "Basic CP fittings", "Standard drainage system"],
    premium: ["Supreme/Prince uPVC pipes", "Kohler/Jaquar fixtures", "Premium CP fittings", "Concealed plumbing", "Premium bathroom accessories"],
    luxury: ["Rehau/Geberit imported pipes", "TOTO/Duravit imported fixtures", "Designer faucets & accessories", "Smart flush systems", "Underfloor heating compatible"]
  },
  electrical: {
    standard: ["Polycab/Havells wires", "Legrand/Anchor Roma switches", "ABB/Siemens MCB", "Standard earthing system", "Basic lighting points"],
    premium: ["Finolex/KEI premium wires", "Schneider/Legrand designer switches", "Premium MCB & RCCB", "Smart home pre-wiring", "Structured cabling"],
    luxury: ["Premium imported wires", "Lutron/Gira touch switches", "Complete home automation ready", "Smart lighting control", "Integrated AV wiring"]
  },
  ac: {
    standard: ["3-star rated split ACs", "Basic copper piping", "Standard outdoor units", "Window/Split AC provision"],
    premium: ["5-star Inverter ACs (Daikin/Mitsubishi)", "Premium copper piping", "Concealed ducting", "VRV/VRF system ready"],
    luxury: ["Daikin/Mitsubishi VRV systems", "Complete ducted HVAC", "Smart climate control", "Air purification system", "Zone-wise temperature control"]
  },
  elevator: {
    standard: ["4-6 passenger hydraulic lift", "Basic cabin finish", "ARD system", "Standard controls"],
    premium: ["6-8 passenger MRL lift", "SS/Designer cabin", "Automatic rescue device", "Glass panel options", "Digital display"],
    luxury: ["Premium MRL/Traction lift", "Luxury cabin with wood/glass", "Smart destination control", "Machine room-less design", "Premium branding (Otis/Schindler)"]
  },
  buildingEnvelope: {
    standard: ["Basic exterior paint", "Standard waterproofing", "Basic thermal insulation", "Standard facade finish"],
    premium: ["Premium textured paint (Asian/Berger)", "APP membrane waterproofing", "Enhanced thermal insulation", "Elevation with designer elements"],
    luxury: ["ACP/Glass facade panels", "Premium waterproofing system", "Complete thermal envelope", "Designer cladding (Stone/Wood/Metal)", "Green building materials"]
  },
  lighting: {
    standard: ["Philips/Crompton LED lights", "Basic fixtures", "Standard outdoor lighting", "Energy-efficient bulbs"],
    premium: ["Premium LED systems", "Designer fixtures (Bajaj/Havells)", "Cove lighting", "Landscape lighting", "Dimmer controls"],
    luxury: ["Smart lighting system (Philips Hue)", "Designer imported fixtures", "Automated controls", "Color-changing ambiance", "Integrated outdoor lighting"]
  },
  windows: {
    standard: ["Solid/Veneer flush doors", "Aluminum sliding windows", "5mm clear glass", "Basic door & window hardware", "Basic MS grills", "Powder-coated frames"],
    premium: ["Premium veneer/laminated doors", "uPVC/Premium aluminum windows", "6mm toughened glass", "Designer door hardware (Dorset/Europa)", "Designer grills", "Double glazing options"],
    luxury: ["Premium imported doors (Porta/Tata)", "Premium uPVC windows (Fenesta)", "Double-glazed low-E glass", "Designer imported hardware (Hafele/Hettich)", "Motorized windows", "Acoustic doors & glass"]
  },
  ceiling: {
    standard: ["Gypsum board false ceiling", "Basic POP corners", "Standard grid system", "Paint finish"],
    premium: ["Premium gypsum with cove lighting", "Designer POP elements", "Acoustic panels (Armstrong)", "Textured/painted finishes", "Concealed AC vents"],
    luxury: ["Imported acoustic panels", "Designer wood/metal ceilings", "Integrated smart lighting", "Custom sculptural elements", "Premium finishes (veneer/fabric)"]
  },
  surfaces: {
    standard: ["Vitrified tiles 2x2 (Kajaria/Somany)", "Basic wall tiles", "Asian Paints Tractor Emulsion", "Standard granite kitchen counter"],
    premium: ["Premium tiles 2x4 or larger", "Designer wall tiles/cladding", "Premium paint (Royale/Dulux)", "Quartz/premium granite counters", "Wooden/laminate flooring options"],
    luxury: ["Imported marble/Italian tiles", "Large format porcelain", "Designer wall finishes", "Premium imported paint", "Engineered wood/real hardwood flooring", "Corian/Quartz surfaces"]
  },
  fixedFurniture: {
    standard: ["BWP plywood", "Laminate finish", "Basic hardware", "Standard kitchen cabinets", "Simple wardrobe systems"],
    premium: ["Premium BWR/Marine ply", "Acrylic/High-gloss finish", "Hettich/Ebco hardware", "Modular kitchen (Godrej/HomeLane)", "Designer wardrobes with organizers"],
    luxury: ["Imported marine ply/MDF", "Lacquered/Veneer finish", "Blum/Hafele premium hardware", "Designer modular kitchen (Häfele/Sleek)", "Walk-in closets", "Custom joinery"]
  },
  looseFurniture: {
    standard: ["IKEA/Hometown furniture", "Standard sofa sets", "Basic beds & dining", "Functional design"],
    premium: ["Urban Ladder/Pepperfry premium range", "Designer sofas (L-shaped/modular)", "Upholstered beds", "6-8 seater dining sets", "Storage ottomans"],
    luxury: ["Imported/Custom-designed furniture", "Italian leather sofas", "King-size designer beds", "Luxury dining sets", "Designer accent chairs", "Antique/Statement pieces"]
  },
  furnishings: {
    standard: ["Basic curtains", "Standard blinds", "Cotton bedding", "Simple rugs", "Basic cushions"],
    premium: ["Designer curtains with automation", "Premium blinds (Somfy)", "Branded bedding sets", "Hand-tufted rugs", "Designer cushions & throws"],
    luxury: ["Imported drapes & sheers", "Motorized curtain systems", "Luxury bedding (Egyptian cotton)", "Designer Persian/Turkish rugs", "Custom upholstery", "Decorative wall hangings"]
  },
  appliances: {
    standard: ["Basic kitchen appliances", "Standard chimney & hob", "Basic refrigerator & washing machine", "Standard microwave"],
    premium: ["Premium brands (Bosch/IFB)", "Built-in chimney & hob", "Inverter AC & refrigerator", "Dishwasher", "Water purifier (RO+UV)", "Smart TV"],
    luxury: ["High-end imported brands (Miele/Siemens)", "Complete built-in kitchen suite", "Wine cooler", "Premium coffee machine", "Smart home appliances", "Home theater system"]
  },
  artefacts: {
    standard: ["Basic wall art", "Decorative planters", "Simple photo frames", "Basic decorative pieces"],
    premium: ["Designer wall art", "Sculptures", "Statement mirrors", "Premium vases & artifacts", "Indoor plants with designer pots"],
    luxury: ["Original artwork/Limited editions", "Designer sculptures", "Antique pieces", "Custom installations", "Premium indoor landscaping", "Curated art collection"]
  },
};

const ResultsStep = ({ estimate, onReset, onSave }: ResultsStepProps) => {
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showConsultationPrompt, setShowConsultationPrompt] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount).replace('₹', '₹');
  };

  const toSentenceCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  const handleShare = () => {
    const shareText = `My Construction Estimate:\n\n` +
      `Location: ${estimate.city}, ${estimate.state}\n` +
      `Project: ${toSentenceCase(estimate.projectType)}\n` +
      `Area: ${estimate.area} ${estimate.areaUnit}\n` +
      `Total Cost: ${formatCurrency(estimate.totalCost)}\n` +
      `Per ${estimate.areaUnit}: ${formatCurrency(Math.round(estimate.totalCost / estimate.area))}\n\n` +
      `Get your estimate at: ${window.location.origin}`;

    if (navigator.share) {
      navigator.share({
        title: 'My Construction Cost Estimate',
        text: shareText,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "Share text has been copied to your clipboard."
        });
      });
    }
  };

  const handleDownloadPDF = () => {
    try {
      generateEstimatePDF(estimate);
      toast({
        title: "PDF Generated!",
        description: "Your estimate has been downloaded as a PDF."
      });
    } catch (error) {
      toast({
        title: "Error generating PDF",
        description: "There was a problem creating your PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Scroll detection for consultation prompt - show modal once
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let hasTriggered = false;

    const handleScroll = () => {
      if (hasTriggered) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Show modal when scrolled 70% or more (only once)
      if (scrollPercentage >= 0.7) {
        hasTriggered = true;
        setShowConsultationPrompt(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to check if component is included
  const isIncluded = (value: string | undefined): boolean => {
    return !!(value && value !== 'none' && value !== '');
  };

  // Helper to format level label
  const formatLevel = (level: ComponentOption) => {
    if (level === 'standard') return 'Standard';
    if (level === 'premium') return 'Premium';
    if (level === 'luxury') return 'Luxury';
    return level;
  };

  // Calculate area in sqm for calculations
  const areaInSqM = estimate.areaUnit === "sqft" ? estimate.area * 0.092903 : estimate.area;

  // Calculate architect fee using same tiered system as PDF (COA standards)
  const getArchitectFeePercentage = (projectCost: number): number => {
    if (projectCost <= 5000000) return 12;  // Up to 50 lakh: 12%
    if (projectCost <= 10000000) return 10; // 50L - 1Cr: 10%
    if (projectCost <= 50000000) return 9;  // 1Cr - 5Cr: 9%
    return 8;                               // Above 5Cr: 8%
  };

  const architectFeePercent = getArchitectFeePercentage(estimate.totalCost);
  const architectFee = (estimate.totalCost * architectFeePercent) / 100;
  const totalWithArchitectFee = estimate.totalCost + architectFee;

  // Create pricing list with costs
  const pricingList = [
    isIncluded(estimate.civilQuality) && {
      category: "Core Components",
      name: "Civil Materials",
      level: estimate.civilQuality,
      description: COMPONENT_DESCRIPTIONS.civilQuality[estimate.civilQuality],
      perSqm: COMPONENT_PRICING_PER_SQM.civilQuality[estimate.civilQuality],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.civilQuality[estimate.civilQuality] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.civilQuality[estimate.civilQuality] * areaInSqM),
    },
    isIncluded(estimate.plumbing) && {
      category: "Core Components",
      name: "Plumbing & Sanitary",
      level: estimate.plumbing,
      description: COMPONENT_DESCRIPTIONS.plumbing[estimate.plumbing],
      perSqm: COMPONENT_PRICING_PER_SQM.plumbing[estimate.plumbing],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.plumbing[estimate.plumbing] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.plumbing[estimate.plumbing] * areaInSqM),
    },
    isIncluded(estimate.electrical) && {
      category: "Core Components",
      name: "Electrical Systems",
      level: estimate.electrical,
      description: COMPONENT_DESCRIPTIONS.electrical[estimate.electrical],
      perSqm: COMPONENT_PRICING_PER_SQM.electrical[estimate.electrical],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.electrical[estimate.electrical] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.electrical[estimate.electrical] * areaInSqM),
    },
    isIncluded(estimate.ac) && {
      category: "Core Components",
      name: "AC & HVAC Systems",
      level: estimate.ac,
      description: COMPONENT_DESCRIPTIONS.ac[estimate.ac],
      perSqm: COMPONENT_PRICING_PER_SQM.ac[estimate.ac],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.ac[estimate.ac] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.ac[estimate.ac] * areaInSqM),
    },
    isIncluded(estimate.elevator) && {
      category: "Core Components",
      name: "Elevator/Lift",
      level: estimate.elevator,
      description: COMPONENT_DESCRIPTIONS.elevator[estimate.elevator],
      perSqm: COMPONENT_PRICING_PER_SQM.elevator[estimate.elevator],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.elevator[estimate.elevator] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.elevator[estimate.elevator] * areaInSqM),
    },
    isIncluded(estimate.buildingEnvelope) && {
      category: "Finishes",
      name: "Building Envelope & Facade",
      level: estimate.buildingEnvelope,
      description: COMPONENT_DESCRIPTIONS.buildingEnvelope[estimate.buildingEnvelope],
      perSqm: COMPONENT_PRICING_PER_SQM.buildingEnvelope[estimate.buildingEnvelope],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.buildingEnvelope[estimate.buildingEnvelope] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.buildingEnvelope[estimate.buildingEnvelope] * areaInSqM),
    },
    isIncluded(estimate.lighting) && {
      category: "Finishes",
      name: "Lighting Systems & Fixtures",
      level: estimate.lighting,
      description: COMPONENT_DESCRIPTIONS.lighting[estimate.lighting],
      perSqm: COMPONENT_PRICING_PER_SQM.lighting[estimate.lighting],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.lighting[estimate.lighting] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.lighting[estimate.lighting] * areaInSqM),
    },
    isIncluded(estimate.windows) && {
      category: "Finishes",
      name: "Windows, Doors & Glazing",
      level: estimate.windows,
      description: COMPONENT_DESCRIPTIONS.windows[estimate.windows],
      perSqm: COMPONENT_PRICING_PER_SQM.windows[estimate.windows],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.windows[estimate.windows] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.windows[estimate.windows] * areaInSqM),
    },
    isIncluded(estimate.ceiling) && {
      category: "Finishes",
      name: "Ceiling Design & Finishes",
      level: estimate.ceiling,
      description: COMPONENT_DESCRIPTIONS.ceiling[estimate.ceiling],
      perSqm: COMPONENT_PRICING_PER_SQM.ceiling[estimate.ceiling],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.ceiling[estimate.ceiling] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.ceiling[estimate.ceiling] * areaInSqM),
    },
    isIncluded(estimate.surfaces) && {
      category: "Finishes",
      name: "Wall & Floor Finishes",
      level: estimate.surfaces,
      description: COMPONENT_DESCRIPTIONS.surfaces[estimate.surfaces],
      perSqm: COMPONENT_PRICING_PER_SQM.surfaces[estimate.surfaces],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.surfaces[estimate.surfaces] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.surfaces[estimate.surfaces] * areaInSqM),
    },
    isIncluded(estimate.fixedFurniture) && {
      category: "Interiors",
      name: "Fixed Furniture & Cabinetry",
      level: estimate.fixedFurniture,
      description: COMPONENT_DESCRIPTIONS.fixedFurniture[estimate.fixedFurniture],
      perSqm: COMPONENT_PRICING_PER_SQM.fixedFurniture[estimate.fixedFurniture],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.fixedFurniture[estimate.fixedFurniture] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.fixedFurniture[estimate.fixedFurniture] * areaInSqM),
    },
    isIncluded(estimate.looseFurniture) && {
      category: "Interiors",
      name: "Loose Furniture",
      level: estimate.looseFurniture,
      description: COMPONENT_DESCRIPTIONS.looseFurniture[estimate.looseFurniture],
      perSqm: COMPONENT_PRICING_PER_SQM.looseFurniture[estimate.looseFurniture],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.looseFurniture[estimate.looseFurniture] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.looseFurniture[estimate.looseFurniture] * areaInSqM),
    },
    isIncluded(estimate.furnishings) && {
      category: "Interiors",
      name: "Furnishings & Soft Decor",
      level: estimate.furnishings,
      description: COMPONENT_DESCRIPTIONS.furnishings[estimate.furnishings],
      perSqm: COMPONENT_PRICING_PER_SQM.furnishings[estimate.furnishings],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.furnishings[estimate.furnishings] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.furnishings[estimate.furnishings] * areaInSqM),
    },
    isIncluded(estimate.appliances) && {
      category: "Interiors",
      name: "Appliances & Equipment",
      level: estimate.appliances,
      description: COMPONENT_DESCRIPTIONS.appliances[estimate.appliances],
      perSqm: COMPONENT_PRICING_PER_SQM.appliances[estimate.appliances],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.appliances[estimate.appliances] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.appliances[estimate.appliances] * areaInSqM),
    },
    isIncluded(estimate.artefacts) && {
      category: "Interiors",
      name: "Artefacts & Art Pieces",
      level: estimate.artefacts,
      description: COMPONENT_DESCRIPTIONS.artefacts[estimate.artefacts],
      perSqm: COMPONENT_PRICING_PER_SQM.artefacts[estimate.artefacts],
      perSqft: Math.round(COMPONENT_PRICING_PER_SQM.artefacts[estimate.artefacts] / 10.764),
      totalCost: Math.round(COMPONENT_PRICING_PER_SQM.artefacts[estimate.artefacts] * areaInSqM),
    },
  ].filter(Boolean);

  return (
    <div
      ref={scrollContainerRef}
      className="space-y-6 overflow-y-auto overflow-x-hidden max-h-[85vh] px-2 pb-6"
    >
      {/* Main Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-5 rounded-xl border border-vs/10 shadow-sm space-y-5"
      >
        <h2 className="text-xl font-bold text-vs-dark text-center">Your Construction Estimate</h2>

        {/* Project Details */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xs text-vs-dark/70 mb-1">Location</h3>
            <p className="font-semibold text-sm">{estimate.city}, {estimate.state}</p>
          </div>
          <div>
            <h3 className="text-xs text-vs-dark/70 mb-1">Project Type</h3>
            <p className="font-semibold text-sm">{toSentenceCase(estimate.projectType)}</p>
          </div>
          <div>
            <h3 className="text-xs text-vs-dark/70 mb-1">Area</h3>
            <p className="font-semibold text-sm">{estimate.area.toLocaleString()} {estimate.areaUnit}</p>
          </div>
        </div>

        {/* Total Cost - Prominent */}
        <div className="bg-gradient-to-br from-vs/10 to-vs/5 p-5 rounded-xl text-center">
          <h3 className="text-xs text-vs-dark/70 mb-1.5">Construction Cost Estimate</h3>
          <p className="text-2xl font-bold text-vs-dark/80 mb-1.5">{formatCurrency(estimate.totalCost)}</p>
          <p className="text-xs text-vs-dark/70">
            {formatCurrency(Math.round(estimate.totalCost / estimate.area))} per {estimate.areaUnit}
          </p>
        </div>

        {/* Architect Fee Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
          <p className="text-[10px] text-blue-800 mb-0.5">+ Architect's Fee ({architectFeePercent}% as per COA standards)</p>
          <p className="text-sm font-semibold text-blue-900">{formatCurrency(Math.round(architectFee))}</p>
        </div>

        {/* Total Estimated Project Cost - HIGHLIGHTED */}
        <div className="bg-gradient-to-br from-vs to-vs-dark p-4 rounded-xl text-center shadow-lg border-2 border-vs-dark">
          <h3 className="text-xs text-white/90 mb-1.5 font-semibold">TOTAL ESTIMATED PROJECT COST</h3>
          <p className="text-3xl font-bold text-white mb-1.5">{formatCurrency(Math.round(totalWithArchitectFee))}</p>
          <p className="text-xs text-white/90">
            {formatCurrency(Math.round(totalWithArchitectFee / estimate.area))} per {estimate.areaUnit}
          </p>
          <p className="text-[10px] text-white/70 mt-1.5">All costs inclusive of GST @ 18%</p>
        </div>


        {/* Cost Breakdown Visualization */}
        <div>
          <h3 className="text-base font-semibold text-vs-dark mb-3">Cost Distribution</h3>
          <ImprovedCostVisualization estimate={estimate} />
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-base font-semibold text-vs-dark mb-3">Project Timeline & Costs</h3>
          <PhaseTimelineCost estimate={estimate} />
        </div>

        {/* Selected Features - List Format with Pricing */}
        <div>
          <h3 className="text-base font-semibold text-vs-dark mb-3">Selected Components & Features</h3>
          <div className="space-y-2">
            {pricingList.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <span className="text-xs font-semibold text-vs bg-vs/10 px-2 py-1 rounded-full whitespace-nowrap">
                          {formatLevel(item.level)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component description */}
                <div className="mt-1 mb-2 pl-6">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Includes:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-600 ml-2">
                    {item.description.map((spec: string, idx: number) => (
                      <li key={idx}>{spec}</li>
                    ))}
                  </ul>
                </div>

                {/* Pricing information */}
                <div className="flex items-center justify-between gap-2 mt-2 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      <IndianRupee className="size-3" />
                      <span className="font-medium">{estimate.areaUnit === "sqft" ? item.perSqft : item.perSqm}/{estimate.areaUnit}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                  <div className="text-sm font-bold text-vs">
                    {formatCurrency(item.totalCost)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pricingList.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No components selected</p>
          )}

          {/* Total Summary */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <div className="flex items-center justify-between text-lg font-bold">
              <span className="text-vs-dark">Total Construction Cost</span>
              <div className="flex items-center gap-1 text-vs">
                <IndianRupee className="size-5" />
                <span>{formatCurrency(estimate.totalCost)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              (Architect fee shown above - Total Project Cost: {formatCurrency(Math.round(totalWithArchitectFee))})
            </p>
          </div>
        </div>

        {/* Detailed Cost Breakdown */}
        <DetailedBreakdownSection estimate={estimate} />

        {/* Disclaimer */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-gray-700">
          <p className="font-medium text-orange-800 mb-1">Important Disclaimer:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>All costs shown are inclusive of GST @ 18%</li>
            <li>Actual costs may vary ±10% based on site conditions and material price fluctuations</li>
            <li>Architect's fee shown separately as per COA standards</li>
            <li>Detailed BOQ will be provided after site visit and requirement analysis</li>
            <li>Final pricing subject to contractor quotes and material availability</li>
            <li>This is an indicative estimate - please contact us for detailed quotation</li>
          </ul>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Download size={18} /> Download PDF
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-vs hover:bg-vs-light text-white font-semibold rounded-lg transition-colors"
        >
          <Share size={18} /> Share Estimate
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Start New Estimate
        </button>
      </div>

      {/* Bottom Booking Section */}
      <div className="mt-6">
        <MeetingScheduler autoExpand={false} estimate={estimate} />
      </div>

      {/* FAQ Section */}
      <div className="mt-6">
        <FAQSection />
      </div>

      {/* Modal Dialog for Meeting Scheduler */}
      <Dialog open={showConsultationPrompt} onOpenChange={setShowConsultationPrompt}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-vs-dark">
              Ready to Get Started?
            </DialogTitle>
            <DialogDescription className="text-base">
              Schedule a consultation with our team to discuss your project in detail
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <MeetingScheduler autoExpand={true} estimate={estimate} />
          </div>
          <button
            onClick={() => setShowConsultationPrompt(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultsStep;
