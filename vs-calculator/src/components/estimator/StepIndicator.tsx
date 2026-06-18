
import { useEstimator } from "@/context/EstimatorContext";
import { cn } from "@/lib/utils";

const StepIndicator = () => {
  const { step, totalSteps } = useEstimator();
  
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            index + 1 === step ? "w-8 bg-vs" : 
            index + 1 < step ? "w-6 bg-vs/60" : "w-6 bg-vs/20"
          )}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
