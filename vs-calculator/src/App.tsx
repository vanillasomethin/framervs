
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import ArchitectFee from "./pages/ArchitectFee";
import EstimatorConstants from "./pages/EstimatorConstants";
import NotFound from "./pages/NotFound";
import CursorAnimation from "./components/CursorAnimation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <div className="bg-[#f0ede8] min-h-screen">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CursorAnimation />
        <BrowserRouter basename="/estimator">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/architect-fee" element={<ArchitectFee />} />
            <Route path="/constants" element={<EstimatorConstants />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </div>
  </QueryClientProvider>
);

export default App;
