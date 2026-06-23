
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  duration?: number;
}

const LoadingScreen = ({ duration = 5000 }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    // Update loading progress from 1 to 100
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newValue = prev + 1;
        return newValue > 100 ? 100 : newValue;
      });
    }, duration / 100);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [duration]);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 bg-[#f0ede8] flex items-center justify-center z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="lds-ripple">
              <div></div>
              <div></div>
            </div>
            <div className="status mt-6">
              <p className="status__message text-vs font-medium">{loadingProgress}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
