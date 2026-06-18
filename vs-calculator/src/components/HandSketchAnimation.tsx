
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const sketches = [
  "/estimator/lovable-uploads/sketch1.gif",
  "/estimator/lovable-uploads/sketch2.gif",
  "/estimator/lovable-uploads/sketch3.gif",
  "/estimator/lovable-uploads/sketch4.gif"
];

const HandSketchAnimation = () => {
  const [currentSketch, setCurrentSketch] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSketch((prev) => (prev + 1) % sketches.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-16 w-24 overflow-visible">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentSketch}
          src={sketches[currentSketch]}
          alt="Architecture sketch"
          className="h-full w-full object-contain"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
    </div>
  );
};

export default HandSketchAnimation;
