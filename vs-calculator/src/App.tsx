
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ArchitectFee from "./pages/ArchitectFee";
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
            <Route path="/architect-fee" element={<ArchitectFee />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </div>
  </QueryClientProvider>
);

export default App;
