import { useRef, useEffect, useState } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { ProjectEstimate } from "@/types/estimator";

interface CostTreeMapProps {
  estimate: ProjectEstimate;
  showLabels?: boolean;
}

interface TreeMapItem {
  name: string;
  size?: number;
  children?: TreeMapItem[];
  color?: string;
  percentage?: number;
}

// Enhanced color scheme
const COLORS = [
  "#8889DD", "#8DC77B", "#E2CF45", "#F89C74", "#E79796", 
  "#B085F5", "#71C2CC", "#F8C12D", "#A5D297"
];

const COLOR_CATEGORIES = {
  "Construction": "#8889DD",
  "Core Components": "#8DC77B",
  "Finishes": "#E2CF45",
  "Interiors": "#F89C74"
};

const CostTreeMap = ({ estimate, showLabels = false }: CostTreeMapProps) => {
  const [data, setData] = useState<TreeMapItem[]>([]);
  
  useEffect(() => {
    const formatData = () => {
      const isIncluded = (value: any) => value && value !== 'none' && value !== '';
      
      // Get actual breakdown values
      const coreTotal = estimate.categoryBreakdown.core;
      const finishesTotal = estimate.categoryBreakdown.finishes;
      const interiorsTotal = estimate.categoryBreakdown.interiors;
      const constructionTotal = estimate.categoryBreakdown.construction;
      
      // Core Components breakdown
      const coreItems: TreeMapItem[] = [];
      let coreItemsCount = 0;
      
      if (isIncluded(estimate.civilQuality)) coreItemsCount++;
      if (isIncluded(estimate.plumbing)) coreItemsCount++;
      if (isIncluded(estimate.electrical)) coreItemsCount++;
      if (isIncluded(estimate.ac)) coreItemsCount++;
      if (isIncluded(estimate.elevator)) coreItemsCount++;
      
      // Calculate proportional costs based on typical construction distributions
      if (isIncluded(estimate.civilQuality)) {
        const civilCost = coreTotal * 0.20; // Civil quality is typically 20% of core
        coreItems.push({ 
          name: "Civil Quality", 
          size: civilCost,
          percentage: (civilCost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.plumbing)) {
        const plumbingCost = coreTotal * 0.25;
        coreItems.push({ 
          name: "Plumbing", 
          size: plumbingCost,
          percentage: (plumbingCost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.electrical)) {
        const electricalCost = coreTotal * 0.25;
        coreItems.push({ 
          name: "Electrical", 
          size: electricalCost,
          percentage: (electricalCost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.ac)) {
        const acCost = coreTotal * 0.20;
        coreItems.push({ 
          name: "AC Systems", 
          size: acCost,
          percentage: (acCost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.elevator)) {
        const elevatorCost = coreTotal * 0.10;
        coreItems.push({ 
          name: "Elevator", 
          size: elevatorCost,
          percentage: (elevatorCost / estimate.totalCost) * 100
        });
      }
      
      // Finishes breakdown
      const finishItems: TreeMapItem[] = [];
      let finishItemsCount = 0;
      
      if (isIncluded(estimate.buildingEnvelope)) finishItemsCount++;
      if (isIncluded(estimate.lighting)) finishItemsCount++;
      if (isIncluded(estimate.windows)) finishItemsCount++;
      if (isIncluded(estimate.ceiling)) finishItemsCount++;
      if (isIncluded(estimate.surfaces)) finishItemsCount++;
      
      if (isIncluded(estimate.buildingEnvelope)) {
        const cost = finishesTotal * 0.30; // Envelope is major component
        finishItems.push({ 
          name: "Building Envelope", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.lighting)) {
        const cost = finishesTotal * 0.15;
        finishItems.push({ 
          name: "Lighting", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.windows)) {
        const cost = finishesTotal * 0.25;
        finishItems.push({ 
          name: "Windows", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.ceiling)) {
        const cost = finishesTotal * 0.15;
        finishItems.push({ 
          name: "Ceiling", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.surfaces)) {
        const cost = finishesTotal * 0.15;
        finishItems.push({ 
          name: "Surfaces", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      
      // Interiors breakdown
      const interiorItems: TreeMapItem[] = [];
      
      if (isIncluded(estimate.fixedFurniture)) {
        const cost = interiorsTotal * 0.35; // Fixed furniture is major component
        interiorItems.push({ 
          name: "Fixed Furniture", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.looseFurniture)) {
        const cost = interiorsTotal * 0.30;
        interiorItems.push({ 
          name: "Loose Furniture", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.furnishings)) {
        const cost = interiorsTotal * 0.15;
        interiorItems.push({ 
          name: "Furnishings", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.appliances)) {
        const cost = interiorsTotal * 0.15;
        interiorItems.push({ 
          name: "Appliances", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      if (isIncluded(estimate.artefacts)) {
        const cost = interiorsTotal * 0.05;
        interiorItems.push({ 
          name: "Artefacts", 
          size: cost,
          percentage: (cost / estimate.totalCost) * 100
        });
      }
      
      // Construction phase breakdown
      const constructionItems: TreeMapItem[] = [
        { 
          name: "Foundation", 
          size: constructionTotal * 0.25,
          percentage: (constructionTotal * 0.25 / estimate.totalCost) * 100
        },
        { 
          name: "Structure", 
          size: constructionTotal * 0.40,
          percentage: (constructionTotal * 0.40 / estimate.totalCost) * 100
        },
        { 
          name: "Masonry", 
          size: constructionTotal * 0.35,
          percentage: (constructionTotal * 0.35 / estimate.totalCost) * 100
        }
      ];
      
      // Build category structure
      const categories = [];

      if (constructionItems.length > 0 && constructionTotal >= 1) {
        categories.push({
          name: "Construction",
          children: constructionItems,
          color: COLOR_CATEGORIES["Construction"]
        });
      }
      if (coreItems.length > 0 && coreTotal >= 1) {
        categories.push({
          name: "Core Components",
          children: coreItems,
          color: COLOR_CATEGORIES["Core Components"]
        });
      }
      if (finishItems.length > 0 && finishesTotal >= 1) {
        categories.push({
          name: "Finishes",
          children: finishItems,
          color: COLOR_CATEGORIES["Finishes"]
        });
      }
      if (interiorItems.length > 0 && interiorsTotal >= 1) {
        categories.push({
          name: "Interiors",
          children: interiorItems,
          color: COLOR_CATEGORIES["Interiors"]
        });
      }
      
      return [
        {
          name: "Total Cost",
          children: categories
        }
      ];
    };
    
    setData(formatData());
  }, [estimate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount).replace('₹', '₹');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-vs">{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.percentage && (
            <p className="text-xs text-gray-500">
              {payload[0].payload.percentage.toFixed(1)}% of total
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-4 min-w-0">
      <div className="h-[400px] w-full overflow-hidden rounded-lg">
        {data.length > 0 && data[0].children && data[0].children.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              stroke="#fff"
              fill="#8884d8"
              content={<CustomizedContent showLabels={showLabels} />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            No cost data to display. Please select components.
          </div>
        )}
      </div>
      
      {/* Color legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {Object.entries(COLOR_CATEGORIES).map(([category, color]) => (
          <div key={category} className="flex items-center">
            <div 
              className="w-4 h-4 mr-2 rounded-sm" 
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-xs text-gray-600">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom treemap rectangle component
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value, showLabels } = props;
  
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) { // 1 Crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 Lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount).replace('₹', '₹');
  };
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth === 1 
            ? COLOR_CATEGORIES[name as keyof typeof COLOR_CATEGORIES] || COLORS[index % COLORS.length]
            : COLORS[index % COLORS.length],
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {/* Show labels based on depth and size */}
      {depth === 1 && width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={14}
            fontWeight="bold"
            className="drop-shadow-md"
            style={{ textShadow: "0px 0px 3px rgba(0,0,0,0.7)" }}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            className="drop-shadow-md"
            style={{ textShadow: "0px 0px 3px rgba(0,0,0,0.7)" }}
          >
            {formatCurrency(value)}
          </text>
        </>
      )}
      {depth === 2 && width > 70 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 4}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            fontWeight="500"
            style={{ textShadow: "0px 0px 3px rgba(0,0,0,0.7)" }}
          >
            {name}
          </text>
          {width > 90 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={9}
              style={{ textShadow: "0px 0px 3px rgba(0,0,0,0.7)" }}
            >
              {formatCurrency(value)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default CostTreeMap;
