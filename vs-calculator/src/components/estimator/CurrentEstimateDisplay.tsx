
import { useEstimator } from "@/context/EstimatorContext";
import { AlertTriangle } from "lucide-react";

const CurrentEstimateDisplay = () => {
  const { estimate, step } = useEstimator();

  // Hide on step 3 (area selection) and step 5 (results)
  if (step === 3 || step >= 5 || estimate.totalCost <= 0) {
    return null;
  }
  
  const formattedCost = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(Math.round(estimate.totalCost)).replace('₹', '₹');

  return (
    <div className="mb-8 flex flex-col items-center">
      <div className="glass-card border border-vs/10 px-6 py-3 rounded-full inline-flex items-center gap-3 mb-2">
        <span className="text-[#4f090c]">Current Estimate:</span>
        <span className="text-vs font-semibold">{formattedCost}</span>
      </div>
      <div className="text-xs text-vs-dark/70 flex items-center gap-1 bg-orange-50/50 px-3 py-1 rounded-full">
        <AlertTriangle size={12} className="text-orange-500" />
        <span>Indicative cost only. Contact us for a detailed quote.</span>
      </div>
    </div>
  );
};

export default CurrentEstimateDisplay;
