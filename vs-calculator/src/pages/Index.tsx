
import { useEffect } from "react";
import EstimatorWizard from "@/components/EstimatorWizard";

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-background py-4 px-4">
      <div className="container-custom max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-display mb-2">
            Project Cost Estimator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Explore an indicative construction and interiors budget for a residential, commercial or mixed-use project. Choose your location, area, scope and specification level to see a preliminary cost breakdown.
          </p>
        </div>
        
        <EstimatorWizard />
        <p className="max-w-3xl mx-auto mt-6 text-center text-xs text-muted-foreground">This is an early-stage planning estimate, not a quotation, bill of quantities, tender price or guarantee of final project cost. Actual costs depend on site conditions, drawings, specifications, consultant inputs and the agreed scope.</p>
      </div>
    </div>
  );
};

export default Index;
