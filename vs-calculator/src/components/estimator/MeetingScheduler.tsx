import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Video, Building, MessageCircle, Mail, Calendar, CheckCircle2, ChevronRight, Clock, Zap, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import CalBookingForm from "./CalBookingForm";
import CalEmbed from "./CalEmbed";
import { isCalComConfigured } from "@/utils/calcom";
import { getCalApi } from "@calcom/embed-react";

type MainOptionType = "schedule" | "api-booking" | "schedule-virtual" | "schedule-office" | "schedule-site";
type ScheduleSubOption = "on-site" | "in-office" | "virtual";

interface MainOption {
  id: MainOptionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  hasSubOptions?: boolean;
  action?: () => void;
}

interface ScheduleOption {
  id: ScheduleSubOption;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface MeetingSchedulerProps {
  autoExpand?: boolean;
  estimate?: any; // ProjectEstimate
}

const MeetingScheduler = ({ autoExpand = false, estimate }: MeetingSchedulerProps) => {
  const [selectedMainOption, setSelectedMainOption] = useState<MainOptionType | null>(null);
  const [selectedSubOption, setSelectedSubOption] = useState<ScheduleSubOption | null>(null);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Auto-expand when triggered from parent
  useEffect(() => {
    if (autoExpand && !selectedMainOption) {
      setShouldPulse(true);
      // Auto-dismiss pulse after 3 seconds
      const timer = setTimeout(() => setShouldPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [autoExpand, selectedMainOption]);

  // Initialize Cal.com
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "schedule-meeting" });
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

  const openCalWidget = async () => {
    const cal = await getCalApi({ namespace: "schedule-meeting" });
    cal("vanilla-somethin-nezld5/15min", {
      layout: "month_view",
    });
  };

  const whatsappNumber = "917411349844";
  const email = "hello@vanillasometh.in";

  const mainOptions: MainOption[] = [
    {
      id: "schedule-virtual",
      title: "Schedule Meeting",
      description: "Virtual / Onsite / At Office",
      icon: <Calendar className="size-6" />,
      action: () => {
        openCalWidget();
      }
    },
    {
      id: "schedule-site",
      title: "Request via WhatsApp",
      description: "Quick consultation request",
      icon: <MessageCircle className="size-6" />,
      action: () => {
        const message = `Hi! I'd like to schedule a consultation to discuss my project. Please let me know your availability.`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }
    },
    {
      id: "schedule-office",
      title: "Contact via Email",
      description: "Send detailed requirements",
      icon: <Mail className="size-6" />,
      action: () => {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent("Project Consultation Request")}&body=${encodeURIComponent("Hi! I'd like to schedule a consultation to discuss my project. Please let me know your availability.")}`;
      }
    },
  ];

  const scheduleOptions: ScheduleOption[] = [
    {
      id: "virtual",
      title: "Virtual Meeting",
      description: "Online meeting via Cal.com",
      icon: <Video className="size-5" />,
      action: () => {
        setSelectedMainOption("schedule-virtual");
      }
    },
    {
      id: "in-office",
      title: "At Office Meeting",
      description: "Visit our office for consultation",
      icon: <Building className="size-5" />,
      action: () => {
        const message = `Hi! I'd like to schedule an office visit to discuss my project.${selectedDate ? `\n\nPreferred Date: ${selectedDate}` : ''}${selectedTime ? `\nPreferred Time: ${selectedTime}` : ''}`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }
    },
    {
      id: "on-site",
      title: "At Site Meeting",
      description: "We'll visit your project location",
      icon: <MapPin className="size-5" />,
      action: () => {
        const message = `Hi! I'd like to schedule an on-site visit to discuss my project.${selectedDate ? `\n\nPreferred Date: ${selectedDate}` : ''}${selectedTime ? `\nPreferred Time: ${selectedTime}` : ''}`;
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

  const handleSubOptionClick = (option: ScheduleOption) => {
    setSelectedSubOption(option.id);
    setTimeout(() => {
      option.action();
    }, 300);
  };

  const handleBack = () => {
    setSelectedMainOption(null);
    setSelectedSubOption(null);
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
        "bg-white p-6 rounded-xl border shadow-sm transition-all duration-300",
        shouldPulse
          ? "border-vs shadow-lg ring-2 ring-vs/20"
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
          {shouldPulse ? "👋 Ready to get started?" : "Let's Connect"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {shouldPulse
            ? "Virtual / Onsite / At Office - Schedule a consultation to discuss your project"
            : "Virtual / Onsite / At Office - Choose your preferred way to connect"}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
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
                    "w-full group relative flex flex-col items-center p-6 border rounded-lg transition-all duration-300 text-center hover:shadow-md",
                    selectedMainOption === option.id && !option.hasSubOptions
                      ? "border-vs bg-vs/5 shadow-sm"
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
    </motion.div>
  );
};

export default MeetingScheduler;
