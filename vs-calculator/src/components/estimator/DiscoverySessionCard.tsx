import { motion } from "framer-motion";
import { Sparkles, Check, ArrowRight } from "lucide-react";

// Price of the paid design-discovery session. It is fully credited against the
// design fee if the client proceeds — change this single value to reprice it.
const DISCOVERY_SESSION_FEE = 5000;

const WHATSAPP_NUMBER = "917411349844";

interface DiscoverySessionCardProps {
  // Optional context line appended to the WhatsApp message (e.g. the estimate).
  contextNote?: string;
}

const DiscoverySessionCard = ({ contextNote }: DiscoverySessionCardProps) => {
  const message =
    `Hi! I'd like to book the Design Discovery Session (₹${DISCOVERY_SESSION_FEE.toLocaleString("en-IN")}, credited to my design fee).` +
    (contextNote ? ` ${contextNote}` : "");

  const inclusions = [
    "On-site visit & requirement mapping",
    "Concept direction for your space",
    "Feasibility & budget reality-check",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-vs/20 bg-gradient-to-br from-vs/5 to-transparent p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-10 rounded-lg bg-vs text-white">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-vs-dark">Design Discovery Session</h3>
            <p className="text-xs text-muted-foreground">For serious projects ready to move</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide bg-vs/10 text-vs px-2 py-1 rounded-full whitespace-nowrap">
          Credited to fee
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-vs">
          ₹{DISCOVERY_SESSION_FEE.toLocaleString("en-IN")}
        </span>
        <span className="text-sm text-muted-foreground">
          — fully adjusted into your design fee when you proceed
        </span>
      </div>

      <ul className="space-y-2 mb-5">
        {inclusions.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="size-4 text-vs flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-vs hover:bg-vs-light text-white font-semibold py-3 px-6 rounded-lg transition-colors group"
      >
        Book a discovery session
        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
      </a>
      <p className="text-[11px] text-muted-foreground mt-3">
        Prefer to talk first? The intro call above is always free — the discovery session is for
        when you're ready to put pen to paper.
      </p>
    </motion.div>
  );
};

export default DiscoverySessionCard;
