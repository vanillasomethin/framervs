
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedPhraseProps {
  text: string;
  className?: string;
}

const AnimatedPhrase = ({ text, className = "" }: AnimatedPhraseProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const words = text.split(' ');
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
    hover: {
      transition: {
        staggerChildren: 0.06,
      }
    }
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hover: (i: number) => ({
      y: [0, -15, 0],
      color: "#4f090c", 
      transition: {
        y: {
          times: [0, 0.5, 1],
          duration: 0.6,
          delay: i * 0.06,
          repeat: 0,
        },
        color: {
          duration: 0.2,
        }
      }
    })
  };

  return (
    <motion.div
      className={`relative inline-block cursor-pointer ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block mr-2">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              custom={charIndex}
              variants={child}
              className="inline-block transition-colors"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.div>
  );
};

export default AnimatedPhrase;
