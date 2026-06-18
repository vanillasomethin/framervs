
import { motion } from "framer-motion";

interface HorizontalRibbonProps {
  text?: string;
  className?: string;
}

const HorizontalRibbon = ({ text = "Let's create something exceptional together", className = "" }: HorizontalRibbonProps) => {
  // Function to animate the letters of the text
  const animateText = (text: string) => {
    return text.split('').map((char, index) => (
      <motion.span
        key={index}
        className="animate-letter inline-block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.03,
          ease: "easeOut"
        }}
        whileHover={{ y: -5, color: "#ffffff", transition: { duration: 0.2 } }}
      >
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    ));
  };
  
  return (
    <div className={`horizontal-ribbon w-full py-3 relative z-30 ${className}`}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white text-center"
        >
          <h3 className="text-lg md:text-xl font-medium tracking-wider">
            {animateText(text)}
          </h3>
        </motion.div>
      </div>
    </div>
  );
};

export default HorizontalRibbon;
