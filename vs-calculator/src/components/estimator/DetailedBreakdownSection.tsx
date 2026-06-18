import { motion } from "framer-motion";
import { ProjectEstimate } from "@/types/estimator";
import { ChevronDown, ChevronUp, Info, IndianRupee } from "lucide-react";
import { useState } from "react";

interface DetailedBreakdownSectionProps {
  estimate: ProjectEstimate;
}

const DetailedBreakdownSection = ({ estimate }: DetailedBreakdownSectionProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount).replace('₹', '₹');
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate detailed breakdown based on total cost and work types
  // Using percentages from the user's data
  const getDetailedBreakdown = () => {
    const totalCost = estimate.totalCost;
    const hasConstruction = estimate.workTypes?.includes("construction") ?? false;
    const hasInteriors = estimate.workTypes?.includes("interiors") ?? false;
    const hasLandscape = estimate.workTypes?.includes("landscape") ?? false;

    // Construction-only breakdown
    if (hasConstruction && !hasInteriors && !hasLandscape) {
      return [
        {
          category: "Structural Work",
          percentage: 37.5,
          items: [
            { name: "Earthwork & Excavation", cost: totalCost * 0.0134 },
            { name: "Foundation (PCC Works)", cost: totalCost * 0.0185 },
            { name: "RCC (Slabs, Beams, Columns)", cost: totalCost * 0.171 },
            { name: "Steel & Reinforcement", cost: totalCost * 0.202 },
          ]
        },
        {
          category: "Masonry & Walls",
          percentage: 13.5,
          items: [
            { name: "Masonry/Brickwork", cost: totalCost * 0.122 },
            { name: "Plastering", cost: totalCost * 0.095 },
          ]
        },
        {
          category: "Basic Finishing Works",
          percentage: 18,
          items: [
            { name: "Basic Flooring", cost: totalCost * 0.084 },
            { name: "Basic Painting", cost: totalCost * 0.047 },
            { name: "Waterproofing", cost: totalCost * 0.018 },
          ]
        },
        {
          category: "Doors & Windows",
          percentage: 11,
          items: [
            { name: "Basic Doors & Windows", cost: totalCost * 0.120 },
            { name: "Staircase/Railings", cost: totalCost * 0.020 },
          ]
        },
        {
          category: "Core Services",
          percentage: 6,
          items: [
            { name: "Basic Plumbing & Fixtures", cost: totalCost * 0.005 },
            { name: "Basic Electrical Works", cost: totalCost * 0.025 },
          ]
        },
        {
          category: "External Works",
          percentage: 8,
          items: [
            { name: "Water Tanks (Underground & Overhead)", cost: totalCost * 0.033 },
            { name: "Compound Wall", cost: totalCost * 0.034 },
            { name: "Anti-Termite Treatment", cost: totalCost * 0.003 },
          ]
        },
        {
          category: "Contingency & Misc",
          percentage: 6,
          items: [
            { name: "Site Infrastructure", cost: totalCost * 0.02 },
            { name: "Labour Welfare", cost: totalCost * 0.01 },
            { name: "Tools & Equipment", cost: totalCost * 0.015 },
            { name: "Contingency Buffer", cost: totalCost * 0.015 },
          ]
        }
      ];
    }

    // Interiors-only breakdown
    if (hasInteriors && !hasConstruction && !hasLandscape) {
      return [
        {
          category: "Fixed Furniture & Cabinetry",
          percentage: 35,
          items: [
            { name: "Kitchen Cabinets", cost: totalCost * 0.15 },
            { name: "Wardrobes", cost: totalCost * 0.12 },
            { name: "TV Units & Study Tables", cost: totalCost * 0.05 },
            { name: "Bathroom Vanities", cost: totalCost * 0.03 },
          ]
        },
        {
          category: "Flooring & Wall Finishes",
          percentage: 25,
          items: [
            { name: "Premium Flooring", cost: totalCost * 0.15 },
            { name: "Wall Treatments", cost: totalCost * 0.06 },
            { name: "Skirting & Dado", cost: totalCost * 0.04 },
          ]
        },
        {
          category: "Lighting & Electrical",
          percentage: 15,
          items: [
            { name: "Designer Light Fixtures", cost: totalCost * 0.08 },
            { name: "Electrical Accessories", cost: totalCost * 0.04 },
            { name: "Smart Home Systems", cost: totalCost * 0.03 },
          ]
        },
        {
          category: "Furnishings & Decor",
          percentage: 15,
          items: [
            { name: "Curtains & Blinds", cost: totalCost * 0.06 },
            { name: "Soft Furnishings", cost: totalCost * 0.05 },
            { name: "Artefacts & Art", cost: totalCost * 0.04 },
          ]
        },
        {
          category: "Loose Furniture",
          percentage: 10,
          items: [
            { name: "Sofas & Seating", cost: totalCost * 0.05 },
            { name: "Dining & Center Tables", cost: totalCost * 0.03 },
            { name: "Beds & Storage", cost: totalCost * 0.02 },
          ]
        }
      ];
    }

    // Combined construction + interiors breakdown
    if (hasConstruction && hasInteriors) {
      return [
        {
          category: "Structural Work",
          percentage: 28,
          items: [
            { name: "Earthwork & Excavation", cost: totalCost * 0.01 },
            { name: "Foundation (PCC Works)", cost: totalCost * 0.014 },
            { name: "RCC (Slabs, Beams, Columns)", cost: totalCost * 0.13 },
            { name: "Steel & Reinforcement", cost: totalCost * 0.15 },
          ]
        },
        {
          category: "Masonry & Walls",
          percentage: 10,
          items: [
            { name: "Masonry/Brickwork", cost: totalCost * 0.09 },
            { name: "Plastering", cost: totalCost * 0.07 },
          ]
        },
        {
          category: "Premium Finishes",
          percentage: 18,
          items: [
            { name: "Premium Flooring", cost: totalCost * 0.10 },
            { name: "Premium Painting & Textures", cost: totalCost * 0.05 },
            { name: "Waterproofing", cost: totalCost * 0.014 },
          ]
        },
        {
          category: "Doors, Windows & Woodwork",
          percentage: 12,
          items: [
            { name: "Doors & Windows", cost: totalCost * 0.09 },
            { name: "Fixed Cabinetry", cost: totalCost * 0.10 },
            { name: "Staircase/Railings", cost: totalCost * 0.015 },
          ]
        },
        {
          category: "Services & Systems",
          percentage: 8,
          items: [
            { name: "Plumbing & Premium Fixtures", cost: totalCost * 0.004 },
            { name: "Electrical & Lighting", cost: totalCost * 0.035 },
          ]
        },
        {
          category: "Interiors & Furnishings",
          percentage: 16,
          items: [
            { name: "Furniture & Upholstery", cost: totalCost * 0.08 },
            { name: "Curtains & Soft Furnishings", cost: totalCost * 0.04 },
            { name: "Appliances", cost: totalCost * 0.03 },
            { name: "Decor & Artefacts", cost: totalCost * 0.01 },
          ]
        },
        {
          category: "External & Misc",
          percentage: 8,
          items: [
            { name: "Water Tanks & Compound Wall", cost: totalCost * 0.05 },
            { name: "Site Infrastructure", cost: totalCost * 0.015 },
            { name: "Contingency Buffer", cost: totalCost * 0.015 },
          ]
        }
      ];
    }

    // Default/fallback breakdown (landscape or other combinations)
    return [
      {
        category: "Project Costs",
        percentage: 100,
        items: [
          { name: "Planning & Design", cost: totalCost * 0.08 },
          { name: "Execution & Materials", cost: totalCost * 0.74 },
          { name: "Architectural Services (COA 7.5%)", cost: totalCost * 0.0625 },
          { name: "Documentation & Communication", cost: totalCost * 0.00625 },
          { name: "Contingency", cost: totalCost * 0.04 },
          { name: "GST", cost: totalCost * 0.05125 },
        ]
      }
    ];
  };

  const breakdown = getDetailedBreakdown();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-start gap-2 mb-6">
        <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Detailed Cost Breakdown</h3>
          <p className="text-sm text-gray-600">
            Typical distribution of project costs across major work categories
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Note: Actual costs may vary based on specifications and site conditions
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {breakdown.map((section, index) => {
          const sectionTotal = section.items.reduce((sum, item) => sum + item.cost, 0);
          const isExpanded = expandedSection === section.category;

          return (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.category)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-gray-900">{section.category}</span>
                    <span className="text-xs text-gray-500">{section.percentage}% of total</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-vs">{formatCurrency(sectionTotal)}</span>
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="size-5 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Section Items */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border-t border-gray-200"
                >
                  <div className="p-4 space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.cost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Bar */}
      <div className="mt-6 p-4 bg-gradient-to-r from-vs/10 to-vs/5 rounded-lg border border-vs/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Construction Cost</p>
            <p className="text-xs text-gray-500">Click categories above to view detailed breakdown</p>
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee className="size-5 text-vs" />
            <span className="text-2xl font-bold text-vs">{formatCurrency(estimate.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Cost Distribution Chart */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Cost Distribution (%)</p>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {breakdown.map((section, index) => {
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-yellow-500',
              'bg-orange-500',
              'bg-red-500',
              'bg-purple-500',
              'bg-gray-500'
            ];
            return (
              <div
                key={index}
                className={`${colors[index]} relative group cursor-pointer`}
                style={{ width: `${section.percentage}%` }}
                title={`${section.category}: ${section.percentage}%`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {section.percentage}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {breakdown.map((section, index) => {
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-yellow-500',
              'bg-orange-500',
              'bg-red-500',
              'bg-purple-500',
              'bg-gray-500'
            ];
            return (
              <div key={index} className="flex items-center gap-2">
                <div className={`size-3 ${colors[index]} rounded-sm`}></div>
                <span className="text-gray-600">{section.category.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default DetailedBreakdownSection;
