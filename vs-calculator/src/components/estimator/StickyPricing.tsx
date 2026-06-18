import { useEstimator } from "@/context/EstimatorContext";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee } from "lucide-react";

const StickyPricing = () => {
  const { estimate, step } = useEstimator();

  // Only show on component selection step (step 4)
  if (step !== 4 || estimate.totalCost <= 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const perSqmCost = estimate.area > 0 ? estimate.totalCost / estimate.area : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="sticky bottom-0 left-0 right-0 bg-gradient-to-r from-vs to-vs-light text-white rounded-t-xl shadow-2xl border-t-4 border-white/20 z-50"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-white/80 mb-1">Estimated Project Cost</p>
              <div className="flex items-baseline gap-2 justify-center">
                <div className="flex items-center gap-1">
                  <IndianRupee className="size-4" />
                  <span className="text-2xl font-bold">{formatCurrency(estimate.totalCost)}</span>
                </div>
                <span className="text-sm text-white/90">
                  ({formatCurrency(Math.round(perSqmCost))} / {estimate.areaUnit})
                </span>
              </div>
              <div className="mt-1 text-xs text-white/70">
                Live estimate updates as you select components
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StickyPricing;
