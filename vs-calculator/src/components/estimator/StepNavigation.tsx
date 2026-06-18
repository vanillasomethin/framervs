
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEstimator } from "@/context/EstimatorContext";

const StepNavigation = () => {
  const { 
    step, 
    totalSteps, 
    handlePrevious, 
    handleNext, 
    handleReset, 
    handleSaveEstimate, 
    isCalculating,
    setStep 
  } = useEstimator();

  // Define steps for quick navigation
  const steps = [
    { id: 1, name: "Location" },
    { id: 2, name: "Project Type" },
    { id: 3, name: "Area" },
    { id: 4, name: "Components" },
    { id: 5, name: "Results" }
  ];

  return (
    <div className="flex flex-col items-center justify-between mt-12 pt-6 border-t border-primary/5">
      {/* Quick step navigation */}
      {step < totalSteps && (
        <div className="flex flex-wrap justify-center gap-2 mb-6 w-full">
          {steps.slice(0, step).map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors",
                s.id === step 
                  ? "bg-vs text-white" 
                  : "bg-vs/10 text-vs hover:bg-vs/20"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full">
        {step < totalSteps ? (
          <>
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full transition-opacity",
                step === 1 ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
              )}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-vs hover:bg-vs-light text-white font-medium rounded-full transition-colors duration-300 mb-4 sm:mb-0"
            >
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span className="text-white">Calculating...</span>
                </div>
              ) : (
                <>
                  <span className="text-white">Next</span> <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform text-white" />
                </>
              )}
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 border border-vs text-vs rounded-full transition-colors hover:bg-vs/5 mb-4 sm:mb-0"
              >
                Start Over
              </button>
              
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-3 border border-vs text-vs rounded-full transition-colors hover:bg-vs/5 mb-4 sm:mb-0"
              >
                Edit Selections
              </button>
            </div>
            
            <div className="flex gap-3"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
