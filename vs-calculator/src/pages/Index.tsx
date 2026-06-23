
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
            Get an accurate estimate for your architecture or interior design project in just a few steps.
          </p>
        </div>
        
        <EstimatorWizard />
      </div>
    </div>
  );
};

export default Index;
