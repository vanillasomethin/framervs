
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedText from "@/components/AnimatedText";

interface ComplexityStepProps {
  complexity: number;
  onComplexityChange: (complexity: number) => void;
}

const ComplexityStep = ({ complexity, onComplexityChange }: ComplexityStepProps) => {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const complexityLevels = [
    { level: 1, label: "Simple", description: "Basic design with minimal custom features" },
    { level: 3, label: "Standard", description: "Balanced design with some custom elements" },
    { level: 5, label: "Moderate", description: "Creative design with several custom features" },
    { level: 7, label: "Complex", description: "Sophisticated design with many custom details" },
    { level: 9, label: "Exceptional", description: "Highly innovative design with unique features" }
  ];

  const getComplexityDescription = () => {
    const level = hoveredLevel !== null ? hoveredLevel : complexity;
    const closest = complexityLevels.reduce((prev, curr) => {
      return (Math.abs(curr.level - level) < Math.abs(prev.level - level) ? curr : prev);
    });
    return closest;
  };

  const selectedComplexity = getComplexityDescription();

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onComplexityChange(parseInt(e.target.value));
  };

  return (
    <div>
      <AnimatedText 
        text="How complex is your design vision?"
        className="text-2xl font-display mb-8 text-center"
      />
      
      <div className="flex flex-col items-center mb-12">
        <div className="size-24 rounded-full bg-vs/10 border-4 border-vs/20 flex items-center justify-center mb-6">
          <Palette className="size-12 text-vs" />
        </div>
        
        <div className="text-center mb-8">
          <motion.h3 
            key={selectedComplexity.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-medium mb-2"
          >
            {selectedComplexity.label}
          </motion.h3>
          
          <motion.p 
            key={selectedComplexity.description}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground"
          >
            {selectedComplexity.description}
          </motion.p>
        </div>
      </div>
      
      <div className="w-full max-w-2xl mx-auto mb-8 px-4">
        <div className="relative pt-8 pb-12">
          {/* Complexity scale markers */}
          <div className="absolute top-0 left-0 right-0 flex justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
              <div 
                key={mark} 
                className="flex flex-col items-center"
                style={{ width: "20px" }}
              >
                <div className={cn(
                  "h-4 w-1 rounded-full mb-2",
                  complexity >= mark ? "bg-vs" : "bg-primary/20"
                )} />
                <span className={cn(
                  "text-xs",
                  complexity >= mark ? "text-vs" : "text-muted-foreground"
                )}>
                  {mark}
                </span>
              </div>
            ))}
          </div>
          
          {/* Range slider */}
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={complexity}
            onChange={handleRangeChange}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const position = e.clientX - rect.left;
              const percentage = position / rect.width;
              const value = Math.round(1 + percentage * 9);
              setHoveredLevel(value);
            }}
            onMouseLeave={() => setHoveredLevel(null)}
            className="w-full h-2 mt-12 bg-primary/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-vs [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {complexityLevels.map((item, index) => (
          <motion.button
            key={item.level}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              "flex flex-col items-center justify-center p-4 border rounded-xl transition-all",
              complexity === item.level 
                ? "border-vs bg-vs/5" 
                : "border-primary/10 hover:bg-primary/5"
            )}
            onClick={() => onComplexityChange(item.level)}
          >
            <span className={cn(
              "text-lg font-medium",
              complexity === item.level ? "text-vs" : "text-primary"
            )}>
              {item.label}
            </span>
            <span className="text-xs text-center text-muted-foreground mt-1">
              Level {item.level}
            </span>
          </motion.button>
        ))}
      </div>
      
      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>More complex designs require more resources and specialized craftsmanship</p>
      </div>
    </div>
  );
};

export default ComplexityStep;
