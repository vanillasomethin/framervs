import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const FAQSection = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How often do construction costs change?",
      answer: "Material costs fluctuate monthly due to market dynamics, fuel prices, and seasonal demand. We recommend budgeting with a 5-8% buffer for inflation. Steel and cement prices are particularly volatile. To manage this, consider: (1) Getting fixed-rate quotes before starting, (2) Locking prices with suppliers for bulk materials, (3) Starting construction during off-peak seasons (typically post-monsoon), and (4) Keeping a contingency fund of 10% for price variations."
    },
    {
      question: "Can I reduce costs without compromising quality?",
      answer: "Yes, absolutely! Smart planning can save 10-15% while maintaining quality. Key strategies include: (1) Value engineering - optimize design for cost efficiency, (2) Smart material selection - choose cost-effective alternatives that meet quality standards, (3) Efficient planning - reduce wastage through proper planning, (4) Local sourcing - reduce transportation costs, (5) Optimal timing - schedule work to avoid peak season premiums, and (6) Standardization - use standard sizes to minimize custom work and wastage."
    },
    {
      question: "What's included in the per sq ft rate?",
      answer: "The base per sq ft rate (₹1,650-₹1,900/sqft) includes: Basic structure (foundation, RCC, columns, beams), roof slab, walls and masonry, windows and doors, flooring (vitrified tiles), plumbing (pipes, fittings, basic fixtures), electrical (wiring, switches, MCB), painting (interior and exterior), and basic finishes. It does NOT typically include: Premium fixtures, modular kitchen, false ceiling, furniture, appliances, landscaping, compound wall, or architect fees (charged separately at 2-4% of construction cost)."
    },
    {
      question: "Do I need an architect?",
      answer: "Yes, hiring an architect is highly recommended and provides excellent return on investment (typically 3-4x their fee). Architects provide: (1) Efficient design that maximizes space utilization and natural light, (2) Code compliance ensuring your project meets all legal requirements, (3) Cost optimization through value engineering, (4) Quality supervision preventing costly mistakes, (5) Coordination between contractors and consultants, and (6) Future-proofing with designs that accommodate future changes. While their fee is 2-4% of construction cost, they can save you 10-15% through efficient design and preventing costly errors."
    },
    {
      question: "When should I lock construction costs?",
      answer: "The best time to lock costs is: (1) After final design approval - once you have detailed drawings and BOQ, (2) Before starting construction - get fixed-rate quotes from at least 3 contractors, (3) Lock for 6 months - beyond this, contractors may add escalation clauses, (4) Bulk material booking - lock prices for cement, steel, and tiles upfront, and (5) Off-season advantage - negotiate better rates during slower construction periods (typically June-August). Also consider: Stage-wise payments with milestone-based releases, written contracts with clear specifications, and retention clauses (5-10% held back for 3-6 months post-completion)."
    },
    {
      question: "What factors can increase my construction cost?",
      answer: "Several factors can impact your final costs: (1) Site conditions - poor soil requiring deep foundations, high water table, rock excavation, (2) Design complexity - curved walls, multiple levels, complex roof designs, (3) Location - difficult access, remote areas with higher transport costs, (4) Market timing - monsoon season premiums, festival season labor shortages, (5) Regulatory - additional compliance requirements, special zone regulations, (6) Material choices - imported materials, custom finishes, premium brands, and (7) Changes during construction - any modifications to approved plans."
    },
    {
      question: "How is FSI/FAR calculated and why is it important?",
      answer: "FSI (Floor Space Index) or FAR (Floor Area Ratio) = Total Built-up Area / Plot Area. It determines how much you can build on your plot. For example, with a 2,000 sqft plot and FSI of 1.5, you can build up to 3,000 sqft total across all floors. FSI varies by city (Mumbai: 1.33-3.0, Bangalore: 1.75-2.5, Delhi: 2.0-3.5) and is crucial because: (1) Building beyond FSI is illegal and can result in demolition, (2) It affects property value - higher FSI plots command premium prices, (3) It determines floor count - directly impacts your building's height and total area, and (4) Impacts resale - FSI-compliant properties are easier to sell and finance."
    },
    {
      question: "What is the typical payment schedule for construction?",
      answer: "A standard construction payment schedule is milestone-based: (1) Advance: 10% on agreement signing, (2) Foundation complete: 15% (including plinth level), (3) Slab level: 20% per floor (for multi-floor buildings), (4) Brick work & plastering: 15%, (5) Doors, windows & flooring: 15%, (6) Finishing works: 20% (painting, fixtures, electrical), (7) Final handover: 5% after snag list completion. Always: Link payments to measurable milestones, retain 5-10% for 3-6 months post-completion, get lien waivers from contractor, maintain photographic evidence of each stage, and verify material quality before each payment."
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-start gap-2 mb-6">
        <HelpCircle className="size-6 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Frequently Asked Questions</h3>
          <p className="text-sm text-gray-600">
            Common questions about construction costs and planning
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isExpanded = expandedFAQ === index;

          return (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-start justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="flex-shrink-0 size-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold mt-0.5">
                    Q{index + 1}
                  </span>
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="size-5 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Answer */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border-t border-gray-200"
                >
                  <div className="p-4 pl-14">
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-green-800">Still have questions?</span>{" "}
          Our construction experts are here to help. Schedule a free consultation to discuss your specific project requirements and get personalized advice.
        </p>
      </div>
    </motion.div>
  );
};

export default FAQSection;
