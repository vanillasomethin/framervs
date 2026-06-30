import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCalApi } from "@calcom/embed-react";

// Cal.com keyless embed configuration.
// These are public booking links (no API key required). Change here to update everywhere.
const CAL_NAMESPACE = "vs-booking";
const CAL_LINK_15 = "hisham-khalid-qyohid/15min";
const CAL_LINK_30 = "hisham-khalid-qyohid/30min";

type MainOptionType = "schedule-consultation" | "schedule-site";

interface MainOption {
  id: MainOptionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  hasSubOptions?: boolean;
  action?: () => void;
}

interface MeetingSchedulerProps {
  autoExpand?: boolean;
  estimate?: any; // ProjectEstimate
}

const MeetingScheduler = ({ autoExpand = false, estimate }: MeetingSchedulerProps) => {
  const [selectedMainOption, setSelectedMainOption] = useState<MainOptionType | null>(null);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Auto-expand when triggered from parent
  useEffect(() => {
    if (autoExpand && !selectedMainOption) {
      setShouldPulse(true);
      // Auto-dismiss pulse after 3 seconds
      const timer = setTimeout(() => setShouldPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [autoExpand, selectedMainOption]);

  // Initialize Cal.com keyless embed
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#44080b" }
        },
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "light",
      });
    })();
  }, []);

  const openCalWidget = async (calLink: string) => {
    const cal = await getCalApi({ namespace: CAL_NAMESPACE });
    cal("modal", {
      calLink,
      config: { layout: "month_view" },
    });
  };

  const whatsappNumber = "917411349844";
  const email = "hello@vanillasometh.in";

  // Two clear primary paths — a scheduled call or an instant chat — rather
  // than four similarly-weighted choices that made people pause to compare.
  // The 15-min intro and email options still exist, just as lighter-weight
  // text links underneath for the minority who specifically want them.
  const mainOptions: MainOption[] = [
    {
      id: "schedule-consultation",
      title: "Book a call",
      description: "30-min, in-depth project discussion",
      icon: <Calendar className="size-6" />,
      action: () => {
        openCalWidget(CAL_LINK_30);
      }
    },
    {
      id: "schedule-site",
      title: "WhatsApp us",
      description: "Quick consultation request",
      icon: <MessageCircle className="size-6" />,
      action: () => {
        const message = `Hi! I'd like to schedule a consultation to discuss my project. Please let me know your availability.`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }
    },
  ];

  const handleMainOptionClick = (option: MainOption) => {
    setSelectedMainOption(option.id);
    setTimeout(() => {
      option.action?.();
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: shouldPulse ? [1, 1.02, 1] : 1,
      }}
      transition={{
        duration: 0.5,
        delay: 0.2,
        scale: {
          repeat: shouldPulse ? 2 : 0,
          duration: 0.6,
        }
      }}
      className={cn(
        "bg-white p-6 rounded-xl border transition-colors duration-300",
        shouldPulse
          ? "border-vs ring-1 ring-vs/20"
          : "border-vs/10"
      )}
    >
      <div className="text-center mb-6">
        <div className={cn(
          "inline-flex items-center justify-center size-12 rounded-full transition-all duration-300 mb-3",
          shouldPulse
            ? "bg-vs text-white animate-pulse"
            : "bg-vs/10 text-vs"
        )}>
          <Calendar className="size-6" />
        </div>
        <h3 className="text-xl font-bold text-vs-dark mb-2">
          {shouldPulse ? "Ready to get started?" : "Let's Connect"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {shouldPulse
            ? "Schedule a consultation to discuss your project"
            : "Choose your preferred way to connect"}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
            {mainOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleMainOptionClick(option)}
                  className={cn(
                    "w-full group relative flex flex-col items-center p-6 border rounded-lg transition-colors duration-300 text-center",
                    selectedMainOption === option.id && !option.hasSubOptions
                      ? "border-vs bg-vs/5"
                      : "border-gray-200 hover:border-vs/50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center size-14 rounded-lg transition-colors mb-4",
                    selectedMainOption === option.id && !option.hasSubOptions
                      ? "bg-vs text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-vs/10 group-hover:text-vs"
                  )}>
                    {selectedMainOption === option.id && !option.hasSubOptions ? (
                      <CheckCircle2 className="size-7" />
                    ) : (
                      option.icon
                    )}
                  </div>

                  <h4 className="font-semibold text-vs-dark mb-2 text-base">{option.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                </button>
              </motion.div>
            ))}
          </motion.div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        Short on time?{" "}
        <button
          onClick={() => openCalWidget(CAL_LINK_15)}
          className="font-medium text-vs hover:underline"
        >
          Book a 15-min intro
        </button>
        {" "}· Prefer email?{" "}
        <a
          href={`mailto:${email}?subject=${encodeURIComponent("Project Consultation Request")}&body=${encodeURIComponent("Hi! I'd like to schedule a consultation to discuss my project. Please let me know your availability.")}`}
          className="font-medium text-vs hover:underline"
        >
          Write to us
        </a>
      </p>
    </motion.div>
  );
};

export default MeetingScheduler;
