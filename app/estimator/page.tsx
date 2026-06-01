import { EstimatorProvider } from "./context/EstimatorContext";
import EstimatorWizard from "./components/EstimatorWizard";

export const metadata = {
  title: "Project Estimator — Vanilla & Somethin",
  description: "Get an accurate estimate for your architecture or interior design project in a few steps.",
};

export default function EstimatorPage() {
  return (
    <main className="min-h-screen bg-[#f0ede8]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-semibold text-stone-900 tracking-tight">Project Cost Estimator</h1>
          <p className="mt-3 text-stone-500 text-base max-w-md mx-auto">
            Get an indicative cost estimate for your architecture or interior design project in just a few steps.
          </p>
        </div>
        <EstimatorProvider>
          <EstimatorWizard />
        </EstimatorProvider>
      </div>
    </main>
  );
}
