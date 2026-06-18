
import { EstimatorProvider } from "@/context/EstimatorContext";
import StepIndicator from "@/components/estimator/StepIndicator";
import CurrentEstimateDisplay from "@/components/estimator/CurrentEstimateDisplay";
import StepContent from "@/components/estimator/StepContent";
import StepNavigation from "@/components/estimator/StepNavigation";
import StickyPricing from "@/components/estimator/StickyPricing";
import { ComponentOption } from "@/types/estimator";

// Re-export types that were used by other components
export type { ComponentOption };

const EstimatorWizard = () => {
  return (
    <EstimatorProvider>
      <div className="glass-card border border-primary/5 rounded-2xl p-4 md:p-5 lg:p-6 estimator-container relative">
        <StepIndicator />
        <CurrentEstimateDisplay />
        <div className="overflow-visible">
          <StepContent />
        </div>
        <StepNavigation />
        <StickyPricing />
      </div>
    </EstimatorProvider>
  );
};

export default EstimatorWizard;
