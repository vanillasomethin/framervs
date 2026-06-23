import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface Row {
  label: string;
  values: (string | number)[];
}

interface Table {
  title: string;
  note?: string;
  columns: string[];
  rows: Row[];
}

const componentPricingRows: Row[] = [
  { label: "Civil Quality (shell)", values: [0, 300, 480, 780] },
  { label: "Plumbing", values: [0, 500, 800, 1300] },
  { label: "Electrical", values: [0, 400, 640, 1040] },
  { label: "AC / HVAC", values: [0, 800, 1300, 2100] },
  { label: "Elevator", values: [0, 750, 1200, 1950] },
  { label: "Building Envelope", values: [0, 150, 240, 390] },
  { label: "Waterproofing", values: [0, 250, 400, 650] },
  { label: "Lighting", values: [0, 400, 640, 1040] },
  { label: "Windows", values: [0, 500, 800, 1300] },
  { label: "Ceiling", values: [0, 350, 560, 910] },
  { label: "Surfaces (flooring/walls)", values: [0, 600, 1000, 1700] },
  { label: "Fixed Furniture & Cabinetry", values: [0, 3000, 5400, 9000] },
  { label: "Loose Furniture", values: [0, 2000, 3600, 6500] },
  { label: "Furnishings & Soft Decor", values: [0, 500, 1000, 1800] },
  { label: "Appliances & Equipment", values: [0, 1000, 2000, 3800] },
  { label: "Artefacts & Art Pieces", values: [0, 300, 900, 2000] },
];

const baseConstructionRows: Row[] = [
  { label: "Residential", values: ["₹17,000/sqm (₹1,579/sqft)"] },
  { label: "Commercial", values: ["₹20,000/sqm (₹1,858/sqft)"] },
  { label: "Mixed-use", values: ["₹23,000/sqm (₹2,137/sqft)"] },
];

const civilQualityMultiplierRows: Row[] = [
  { label: "Not Required", values: ["0× (interior-only projects)"] },
  { label: "Standard", values: ["1.0×"] },
  { label: "Premium", values: ["1.25× — structural shell rises only modestly with quality"] },
  { label: "Luxury", values: ["1.5× — luxury premium lives in finishes, not the shell"] },
];

const sizeMultiplierRows: Row[] = [
  { label: "< 50 sqm", values: ["1.20× — very small projects, high fixed costs"] },
  { label: "50 – 100 sqm", values: ["1.12× — small projects, limited economies"] },
  { label: "100 – 200 sqm", values: ["1.05× — medium projects, moderate scale"] },
  { label: "200 – 500 sqm", values: ["1.00× — standard size"] },
  { label: "≥ 500 sqm", values: ["0.95× — economies of scale"] },
];

const projectTypeMultiplierRows: Row[] = [
  { label: "Residential", values: ["1.0× base"] },
  { label: "Commercial", values: ["1.08× base (typology gap mostly carried by the higher base rate above)"] },
  { label: "Mixed-use", values: ["1.15× base"] },
  { label: "Complexity adjustment", values: ["±5% per point away from a baseline of 5 (scale 1–10)"] },
];

const locationMultiplierRows: Row[] = [
  { label: "Mumbai", values: [1.50] },
  { label: "Navi Mumbai", values: [1.42] },
  { label: "Thane", values: [1.40] },
  { label: "Delhi / New Delhi", values: [1.35] },
  { label: "Gurgaon", values: [1.30] },
  { label: "Noida", values: [1.28] },
  { label: "Pune", values: [1.22] },
  { label: "Bangalore / Bengaluru", values: [1.20] },
  { label: "Chandigarh", values: [1.15] },
  { label: "Chennai", values: [1.13] },
  { label: "Hyderabad", values: [1.05] },
  { label: "Kolkata", values: [1.05] },
  { label: "Jaipur / Kochi", values: [1.05] },
  { label: "Ahmedabad", values: [1.03] },
  { label: "Surat / Coimbatore / Indore / Vadodara", values: [1.00] },
  { label: "Nagpur / Lucknow", values: [0.98] },
  { label: "Visakhapatnam", values: [0.95] },
  { label: "All other cities (default)", values: [0.92] },
];

const feesRows: Row[] = [
  { label: "Architectural fee — individual house / interiors", values: ["7.5% of subtotal (COA minimum scale)"] },
  { label: "Architectural fee — apartment block / commercial / mixed-use", values: ["5.0% of subtotal (COA minimum scale)"] },
  { label: "Documentation & communication", values: ["10% of the architectural fee (COA, all engagements)"] },
  { label: "Combined professional fees", values: ["8.25% of subtotal for an individual house; 5.5% for apartment/commercial/mixed-use"] },
  { label: "Contingency", values: ["5% of subtotal"] },
  { label: "GST on professional fees", values: ["18% of professional fees (COA regulation — explicit line per COA guidelines)"] },
  { label: "GST on construction & contingency", values: ["6% of (subtotal + contingency) — net of input credits"] },
];

const foundationRows: Row[] = [
  { label: "Normal Soil", values: ["1.0× — firm ground, standard footing"] },
  { label: "Rocky Terrain", values: ["1.08× — harder excavation but stable, no piling"] },
  { label: "Black Cotton Soil", values: ["1.12× — expansive soil, replacement / under-reamed piles"] },
  { label: "Sloped / Hilly Site", values: ["1.15× — stepped foundation + retaining walls"] },
  { label: "Scope", values: ["Applied to the structural shell only, for NEW construction. Renovations skip this entirely."] },
];

const projectModeRows: Row[] = [
  { label: "New Construction", values: ["Full structural shell + foundation/soil multiplier above"] },
  { label: "Renovation / Remodel", values: ["Shell reduced to 0.40× (strengthening & modification, not new framing); no foundation multiplier"] },
  { label: "Demolition allowance (renovation)", values: ["₹1,500/sqm of built-up area — selective demolition + debris removal"] },
  { label: "MEP / finishes / interiors", values: ["Charged at full scope in both modes"] },
];

const amenitiesRows: Row[] = [
  { label: "Swimming Pool", values: ["₹20,00,000"] },
  { label: "Home Theater", values: ["₹12,00,000"] },
  { label: "Home Gym", values: ["₹8,00,000"] },
  { label: "Wine Cellar", values: ["₹6,00,000"] },
  { label: "Home Automation", values: ["₹6,00,000"] },
  { label: "Sauna / Steam", values: ["₹5,00,000"] },
  { label: "Jacuzzi / Spa", values: ["₹4,50,000"] },
  { label: "Solar Power (~5kW)", values: ["₹4,00,000"] },
  { label: "Outdoor Kitchen / BBQ", values: ["₹3,50,000"] },
  { label: "Borewell", values: ["₹2,50,000"] },
  { label: "Scaling", values: ["Fixed lump sums × location multiplier only (no size / project-type / complexity inflation). Residential & mixed-use construction only."] },
];

const phaseAllocationRows: Row[] = [
  { label: "Planning phase", values: ["Fixed 8% of total cost, taken off the top"] },
  { label: "Construction / Interiors / Landscape phases", values: ["Remaining 92% (\"build budget\") split proportionally by each phase's scaled cost weight"] },
  { label: "Landscape weight (mixed project)", values: ["15% of subtotal"] },
  { label: "Landscape weight (landscape-only project)", values: ["100% of subtotal"] },
];

const timelineRows: Row[] = [
  { label: "Planning (base)", values: ["2 months (1 month if interiors-only or landscape-only)"] },
  { label: "Construction (base)", values: ["6 months"] },
  { label: "Interiors (base)", values: ["2 months (3 months if interiors-only)"] },
  { label: "Landscape (base)", values: ["3 months"] },
  { label: "Commercial project adder", values: ["+1mo planning, +2mo construction, +1mo interiors (if included)"] },
  { label: "Mixed-use project adder", values: ["+2mo planning, +4mo construction, +1mo interiors (if included)"] },
  { label: "Area adder", values: ["+1 month per ~1000 sqft (2000 sqft for interiors, 3000 sqft for landscape) of extra size, applied to construction full / interiors & landscape half rate"] },
  { label: "Quality timeline penalty", values: ["+3% duration per luxury-tier component selected, +1.5% per premium-tier component"] },
  { label: "Complexity timeline factor", values: ["±10% per point away from baseline of 5 (scale 1–10)"] },
  { label: "Minimum durations", values: ["Planning ≥ 1mo, Construction ≥ 3mo, Interiors ≥ 1mo, Landscape ≥ 2mo"] },
];

const fsiRows: Row[] = [
  { label: "Mumbai", values: ["1.0 – 3.0 (typical 1.33)"] },
  { label: "Delhi", values: ["1.2 – 3.5 (typical 2.0)"] },
  { label: "Bangalore", values: ["1.5 – 2.5 (typical 2.0)"] },
  { label: "Chennai", values: ["1.5 – 2.0 (typical 1.8)"] },
  { label: "Hyderabad", values: ["1.0 – 2.5 (typical 2.0)"] },
  { label: "Pune", values: ["1.0 – 2.0 (typical 1.5)"] },
  { label: "Ahmedabad", values: ["1.2 – 2.7 (typical 1.8)"] },
  { label: "Kolkata", values: ["1.0 – 2.75 (typical 2.0)"] },
  { label: "Chandigarh", values: ["1.0 – 1.5 (typical 1.25) — strict FAR controls"] },
  { label: "Dehradun / Srinagar / Panaji", values: ["0.8 – 1.75 (typical 1.2–1.25) — hill/coastal restrictions"] },
  { label: "All other listed cities", values: ["typically 1.0 – 2.0 (typical 1.5)"] },
  { label: "Cities not in database (default)", values: ["1.0 – 2.0 (typical 1.5)"] },
  { label: "Floor-area assumption (FSI → floors)", values: ["Typical floor area assumed at 70% of plot area (accounts for setbacks) when not otherwise specified"] },
];

const architectFeeCalcRows: Row[] = [
  { label: "Individual House", values: ["8% of construction cost, min ₹20,000"] },
  { label: "Residential Block", values: ["5% of construction cost, min ₹50,000"] },
  { label: "Commercial", values: ["4% of construction cost, min ₹80,000"] },
  { label: "FF&E Procurement add-on", values: ["10% of (15% of construction cost), min ₹30,000"] },
  { label: "Landscape (detailed) add-on", values: ["₹150/sqm, min ₹25,000"] },
  { label: "Client type multiplier", values: ["Friend/Family 0.85× · Individual 1.0× · Developer 1.10× · Corporate 1.15×"] },
  { label: "Complexity multiplier", values: ["Simple 0.9× · Standard 1.0× · Premium 1.2× · Luxury 1.5×"] },
  { label: "Client involvement multiplier", values: ["Minimal 1.035× · Low 1.075× · Moderate 1.125× · High 1.175× · Flexible 1.10×"] },
  { label: "Rush-job multiplier", values: ["1.25× when rush delivery requested"] },
  { label: "Visualisation package", values: ["None ₹0 · Standard ₹25,000 · Premium ₹50,000 · Luxury ₹1,00,000"] },
  { label: "Extra render add-on", values: ["Interior ₹5,000 · Exterior ₹7,500"] },
  { label: "Studio overhead allocation", values: ["₹80,000 ÷ 3 ≈ ₹26,667 added to every quote"] },
  { label: "Studio minimum fee floor", values: ["₹50,000"] },
  { label: "Profit margin", values: ["15% added on top of subtotal"] },
  { label: "Tax rate (this calculator)", values: ["18% of (subtotal + profit)"] },
  { label: "Currency conversion (illustrative)", values: ["USD ₹83/$ · EUR ₹90/€"] },
];

const sections: Table[] = [
  {
    title: "1. Base construction cost (per sqm of built-up area)",
    note: "Applied only when \"Construction\" is selected as a work type. Multiplied by the civil-quality multiplier and size multiplier below.",
    columns: ["Project Type", "Rate"],
    rows: baseConstructionRows,
  },
  {
    title: "2. Civil quality multiplier (applied to base construction cost)",
    columns: ["Quality Tier", "Multiplier"],
    rows: civilQualityMultiplierRows,
  },
  {
    title: "3. Component pricing (₹ per sqm of built-up area)",
    note: "Core services, finishes/envelope, and interiors are all priced per component per tier. Components flagged \"Not Required\" cost ₹0. Civil quality's contribution to the \"core\" bucket is additionally scaled ×0.15 to avoid double-counting against base construction cost.",
    columns: ["Component", "Not Required", "Standard", "Premium", "Luxury"],
    rows: componentPricingRows,
  },
  {
    title: "4. Size-based cost multiplier (applied to construction + all components)",
    note: "Smaller projects carry higher per-unit fixed costs; larger projects benefit from economies of scale.",
    columns: ["Built-up Area", "Multiplier"],
    rows: sizeMultiplierRows,
  },
  {
    title: "5. Location multiplier (by city)",
    note: "Applied to the full subtotal (construction + core + finishes + interiors). Calibrated against InfraLens 2026 metro standard rates relative to a ~₹2,100/sqft national baseline (multiplier 1.0). Cities not listed use the 0.92 default.",
    columns: ["City", "Multiplier"],
    rows: locationMultiplierRows,
  },
  {
    title: "6. Project-type & complexity multiplier",
    note: "Combined with the location multiplier into a single \"combined multiplier\" applied to the subtotal.",
    columns: ["Factor", "Effect"],
    rows: projectTypeMultiplierRows,
  },
  {
    title: "7. Foundation / soil-condition multiplier",
    note: "Applied to the structural shell only, for NEW construction. Difficult ground raises the substructure cost (deeper footings, soil replacement, piling, retaining work) while the superstructure and finishes are unaffected.",
    columns: ["Site / Soil Condition", "Multiplier & Rationale"],
    rows: foundationRows,
  },
  {
    title: "8. Project mode — new construction vs renovation",
    note: "Renovations reuse the existing structure: the shell is charged at a fraction of a new build plus a demolition allowance, and the foundation/soil multiplier does not apply. MEP, finishes and interiors are charged at full scope in both modes.",
    columns: ["Mode / Line", "Treatment"],
    rows: projectModeRows,
  },
  {
    title: "9. Premium amenities (fixed lump sums)",
    note: "Optional lifestyle installations priced as discrete lump sums rather than per-sqft. Only the location multiplier is applied on top — never the size, project-type or complexity multipliers. Offered for residential & mixed-use construction (villas, houses, penthouses).",
    columns: ["Amenity", "Indicative Cost (pre-location)"],
    rows: amenitiesRows,
  },
  {
    title: "10. Professional fees, contingency & tax",
    note: "Architect fees follow the COA (Council of Architecture) minimum scale of professional charges. GST is split COA-literal: 18% on professional fees, 6% on construction + contingency.",
    columns: ["Line Item", "Rate"],
    rows: feesRows,
  },
  {
    title: "11. Phase budget allocation (how the total cost splits across project phases)",
    columns: ["Phase Rule", "Detail"],
    rows: phaseAllocationRows,
  },
  {
    title: "12. Timeline constants (project duration in months)",
    columns: ["Phase / Adjustment", "Rule"],
    rows: timelineRows,
  },
  {
    title: "13. FSI (Floor Space Index) rules by city",
    note: "Used only for residential plot-area projects to compute the maximum/typical legally buildable area before it's converted to a built-up area for pricing. Not a cost constant, but feeds directly into the area used by every calculation above.",
    columns: ["City", "FSI Range"],
    rows: fsiRows,
  },
  {
    title: "14. Standalone Architect Fee Calculator (/architect-fee page — separate from the main estimator)",
    note: "This is a separate quoting tool for the studio's own design fees, not the construction-cost estimator. Listed here for completeness since it has its own independent set of constants.",
    columns: ["Line Item", "Rate"],
    rows: architectFeeCalcRows,
  },
];

const EstimatorConstants = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container-custom max-w-4xl mx-auto">
        <Link
          to="/calculate"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-vs mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Estimator
        </Link>

        <h1 className="text-2xl md:text-3xl font-display mb-2">Estimator Calculation Reference</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Every hardcoded number the cost estimator and timeline engine use today, in the order they're
          applied. This page exists purely as a reference so these market-research figures can be swapped for
          real project data later — it isn't linked from the main wizard flow.
        </p>

        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 mb-10 max-w-3xl">
          <p className="text-xs font-semibold text-vs-dark mb-2">Calibration benchmarks (residential, construction-only, pre-fee)</p>
          <p className="text-xs text-muted-foreground mb-2">
            The rates below were tuned so the engine reproduces published 2026 market figures. For a 200&nbsp;sqm
            (≈2,150&nbsp;sqft) build the model outputs:
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
            <li>Bangalore standard ≈ ₹2,310/sqft — between architects4design (₹1,750–1,900) and InfraLens (₹2,520)</li>
            <li>Mumbai standard ≈ ₹2,890/sqft — InfraLens ₹3,150</li>
            <li>Hyderabad standard ≈ ₹2,020/sqft — InfraLens ₹2,205</li>
            <li>Tier-3 / default city ≈ ₹1,770/sqft — architects4design floor ₹1,750</li>
            <li>Premium grade ≈ 1.32× standard, Luxury ≈ 1.71× standard — InfraLens grade factors 1.35× / 1.85×</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Sources: architects4design.com (Bangalore BOQ &amp; per-sqft rates), InfraLens 2026 construction-cost
            calculator (multi-city, quality-graded), and Happho turnkey package pricing.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((table) => (
            <section key={table.title}>
              <h2 className="text-base font-semibold text-vs-dark mb-1">{table.title}</h2>
              {table.note && (
                <p className="text-xs text-muted-foreground mb-3 max-w-3xl">{table.note}</p>
              )}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {table.columns.map((col) => (
                        <th key={col} className="px-4 py-2 font-medium text-vs-dark whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.label} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-vs-dark whitespace-nowrap">{row.label}</td>
                        {row.values.map((value, i) => (
                          <td key={i} className="px-4 py-2 text-muted-foreground">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-10 pb-4">
          Source: <code>vs-calculator/src/context/EstimatorContext.tsx</code>,{" "}
          <code>vs-calculator/src/utils/fsiRules.ts</code>, and{" "}
          <code>vs-calculator/src/utils/feeCalculations.ts</code>.
        </p>
      </div>
    </div>
  );
};

export default EstimatorConstants;
