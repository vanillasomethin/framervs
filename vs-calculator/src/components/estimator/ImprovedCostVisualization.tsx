import { ProjectEstimate } from "@/types/estimator";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface ImprovedCostVisualizationProps {
  estimate: ProjectEstimate;
}

const ImprovedCostVisualization = ({ estimate }: ImprovedCostVisualizationProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount).replace('₹', '₹');
  };

  const COLORS = {
    construction: '#8B0000', // Dark red
    core: '#B22222',        // Firebrick red
    finishes: '#CD5C5C',    // Indian red
    interiors: '#F08080'    // Light coral
  };

  const categoryData = [
    { name: 'Construction', value: estimate.categoryBreakdown.construction, color: COLORS.construction },
    { name: 'Services', value: estimate.categoryBreakdown.core, color: COLORS.core },
    { name: 'Finishes', value: estimate.categoryBreakdown.finishes, color: COLORS.finishes },
    { name: 'Interiors', value: estimate.categoryBreakdown.interiors, color: COLORS.interiors },
  ].filter(item => item.value >= 1); // Filter out zero or near-zero values

  const barData = categoryData.map(item => ({
    name: item.name,
    amount: item.value,
    fill: item.color
  }));

  return (
    <div className="w-full space-y-3">
      <h3 className="text-sm font-semibold text-vs-dark mb-2">Detailed Cost Structure</h3>
      
      {/* Donut Chart */}
      <div className="flex justify-center">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {categoryData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] text-vs-dark/70 truncate">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Horizontal Bar Chart */}
      <div className="w-full" style={{ height: Math.min(barData.length * 25 + 20, 150) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={barData} 
            layout="vertical"
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <XAxis 
              type="number" 
              tick={{ fontSize: 9 }}
              tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 9, fill: '#1a1a1a' }}
              width={70}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ fontSize: 10 }}
            />
            <Bar dataKey="amount" barSize={16} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Breakdown List */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {categoryData.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-[10px] py-1 px-2 bg-vs/5 rounded">
            <span className="text-vs-dark/70">{item.name}</span>
            <span className="font-semibold text-vs">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImprovedCostVisualization;
