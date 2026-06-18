
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FixedBannerProps {
  className?: string;
}

const FixedBanner = ({ className }: FixedBannerProps) => {
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-vs py-2 text-white shadow-md",
      className
    )}>
      <div className="container-custom">
        <div className="flex items-center justify-center overflow-hidden">
          <motion.div 
            className="services-container" 
            initial={{ x: 0 }}
            animate={{ x: "-50%" }} 
            transition={{ 
              repeat: Infinity, 
              duration: 20, 
              ease: "linear" 
            }}
          >
            {[...Array(2)].map((_, index) => (
              <div key={index} className="flex gap-8 items-center">
                <span className="text-sm font-semibold uppercase tracking-wider px-4 whitespace-nowrap hover:scale-110 transition-transform cursor-pointer">
                  Architecture
                </span>
                <span className="size-2 rounded-full bg-white/30" />
                <span className="text-sm font-semibold uppercase tracking-wider px-4 whitespace-nowrap hover:scale-110 transition-transform cursor-pointer">
                  Interiors
                </span>
                <span className="size-2 rounded-full bg-white/30" />
                <span className="text-sm font-semibold uppercase tracking-wider px-4 whitespace-nowrap hover:scale-110 transition-transform cursor-pointer">
                  Urban Design
                </span>
                <span className="size-2 rounded-full bg-white/30" />
                <span className="text-sm font-semibold uppercase tracking-wider px-4 whitespace-nowrap hover:scale-110 transition-transform cursor-pointer">
                  Landscape
                </span>
                <span className="size-2 rounded-full bg-white/30" />
                <span className="text-sm font-semibold uppercase tracking-wider px-4 whitespace-nowrap hover:scale-110 transition-transform cursor-pointer">
                  Construction
                </span>
                <span className="size-2 rounded-full bg-white/30" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FixedBanner;
