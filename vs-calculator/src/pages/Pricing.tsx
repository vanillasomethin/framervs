import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MeetingScheduler from "@/components/estimator/MeetingScheduler";

const options = [
  {
    title: "Estimate your project cost",
    description:
      "Self-serve calculator. See your construction, finishes and interiors cost broken down line by line, benchmarked against the market.",
    to: "/calculate",
    cta: "Start estimating",
    points: ["Cost per sqft + full breakdown", "Renovation & amenities", "Instant PDF summary"],
  },
  {
    title: "Get an architect fee quote",
    description:
      "COA-compliant professional fees for design & architecture. Priced per sqft or as a percentage of build cost, whichever suits you.",
    to: "/architect-fee",
    cta: "Calculate fees",
    points: ["₹/sqft or COA percentage", "Transparent fee breakdown", "Payment schedule included"],
  },
];

const Pricing = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container-custom max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display mb-2 text-vs-dark">Pricing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            See what your project could cost to build and to design, or talk to us first.
          </p>
        </div>

        {/* Two-option fork */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {options.map((opt, i) => {
            return (
              <motion.div
                key={opt.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  to={opt.to}
                  className="group flex h-full flex-col p-6 rounded-xl border border-vs-dark/15 bg-white transition-colors duration-300 hover:border-vs-dark"
                >
                  <h2 className="text-xl font-medium text-vs-dark mb-2">{opt.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>
                  <ul className="space-y-2 mb-6">
                    {opt.points.map((p) => (
                      <li key={p} className="text-sm text-vs-dark/80">
                        {p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-vs">
                    {opt.cta}
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Free consultation */}
        <div className="text-center mb-5">
          <h3 className="text-xl font-display text-vs-dark mb-1">Prefer to talk first?</h3>
          <p className="text-sm text-muted-foreground">
            A free first conversation. No numbers needed.
          </p>
        </div>
        <MeetingScheduler />
      </div>
    </div>
  );
};

export default Pricing;
