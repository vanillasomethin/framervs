
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterAnimationProps {
  className?: string;
}

const TypewriterAnimation: React.FC<TypewriterAnimationProps> = ({ className }) => {
  const [currentText1, setCurrentText1] = useState("VANILLA");
  const [currentText2, setCurrentText2] = useState("SOMETHIN");
  const [morphing, setMorphing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const vanillaWords = ["VANILLA", "CREATIVE", "DESIGN", "UNIQUE"];
  const somethinWords = ["SOMETHIN", "AMAZING", "INSPIRED", "SPECIAL"];
  
  // Index tracking for word rotation
  const [wordIndex1, setWordIndex1] = useState(0);
  const [wordIndex2, setWordIndex2] = useState(0);
  
  // Initial animation
  useEffect(() => {
    const typeInitialWords = async () => {
      // Short delay before starting animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Type first word letter by letter
      for (let i = 0; i <= vanillaWords[0].length; i++) {
        setCurrentText1(vanillaWords[0].substring(0, i));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Short pause before typing second word
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Type second word letter by letter
      for (let i = 0; i <= somethinWords[0].length; i++) {
        setCurrentText2(somethinWords[0].substring(0, i));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };
    
    typeInitialWords();
  }, []);
  
  // Rotate words on hover
  const handleHover = async () => {
    if (morphing) return;
    
    setMorphing(true);
    
    // Update indices for next words
    const nextIndex1 = (wordIndex1 + 1) % vanillaWords.length;
    const nextIndex2 = (wordIndex2 + 1) % somethinWords.length;
    
    // Morph to next words
    setCurrentText1(vanillaWords[nextIndex1]);
    setCurrentText2(somethinWords[nextIndex2]);
    
    // Update indices
    setWordIndex1(nextIndex1);
    setWordIndex2(nextIndex2);
    
    // Wait before allowing another morph
    setTimeout(() => setMorphing(false), 800);
  };
  
  return (
    <motion.div 
      ref={containerRef}
      className={`relative ${className} bg-vs-dark/5 px-6 py-4 rounded-lg backdrop-blur-sm shadow-inner`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      onHoverStart={handleHover}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-vs-dark/80 font-syne uppercase font-medium">Where</span>
            <div className="typewriter relative">
              <motion.span 
                className="font-syne text-2xl md:text-4xl font-extrabold text-vs-dark uppercase tracking-wider"
                initial={{ y: 0 }}
                animate={{ y: morphing ? [-5, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                {currentText1}
              </motion.span>
            </div>
            <span className="text-sm text-vs-dark/80 font-syne uppercase font-medium">meets</span>
          </div>
          
          <div className="typewriter relative mt-2">
            <motion.span 
              className="font-syne text-3xl md:text-5xl text-vs uppercase font-extrabold tracking-wider"
              initial={{ y: 0 }}
              animate={{ y: morphing ? [-5, 0] : 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {currentText2}
            </motion.span>
          </div>
        </div>
      </div>
      
      {/* SVG filter for the gooey effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
};

export default TypewriterAnimation;
