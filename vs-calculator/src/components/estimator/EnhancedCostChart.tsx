
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend,
  Sector
} from "recharts";
import { CategoryBreakdown } from "@/types/estimator";

interface EnhancedCostChartProps {
  data: CategoryBreakdown;
  totalCost: number;
}

const COLORS = ['#7A1E1F', '#a45a5a', '#c68e8e', '#e9cece', '#f1e1e1'];

const EnhancedCostChart = ({ data, totalCost }: EnhancedCostChartProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Calculate percentages accurately
  useEffect(() => {
    // Calculate total from the breakdown to ensure percentages add up to 100%
    const calculatedTotal = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    const processedData = Object.entries(data)
      .map(([category, amount], index) => {
        const percentage = (amount / calculatedTotal) * 100;
        return {
          name: formatCategoryName(category),
          value: amount,
          percentage: Math.round(percentage),
          color: COLORS[index % COLORS.length]
        };
      })
      .sort((a, b) => b.value - a.value);
      
    setChartData(processedData);
  }, [data, totalCost]);
  
  // Format category names for better display
  function formatCategoryName(category: string): string {
    return category
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }
  
  // Custom active shape for animation on hover
  const renderActiveShape = (props: any) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="stroke-white"
          strokeWidth={2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text x={cx} y={cy - 15} dy={8} textAnchor="middle" fill={fill} className="text-lg font-bold">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={fill} className="text-md font-semibold">
          ₹{new Intl.NumberFormat('en-IN').format(value)}
        </text>
        <text x={cx} y={cy + 35} textAnchor="middle" fill={fill} className="text-sm font-medium">
          {Math.round(percent * 100)}%
        </text>
      </g>
    );
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-3 rounded-lg shadow-lg border border-vs/10"
        >
          <p className="font-semibold text-vs">{payload[0].name}</p>
          <p className="text-vs-dark text-sm">
            ₹{new Intl.NumberFormat('en-IN').format(payload[0].value)}
          </p>
          <p className="text-vs-dark/70 text-xs font-bold">
            {payload[0].payload.percentage}% of total
          </p>
        </motion.div>
      );
    }
    return null;
  };
  
  return (
    <div className="relative w-full h-80 my-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={4}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                strokeWidth={activeIndex === index ? 2 : 0}
                className="transition-all duration-300"
              />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ paddingLeft: 20 }}
            formatter={(value, entry, index) => {
              return (
                <span 
                  className={`text-xs font-medium cursor-pointer hover:text-vs transition-colors ${activeIndex === index ? 'font-bold text-vs' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  {value} ({chartData[index]?.percentage}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnhancedCostChart;
