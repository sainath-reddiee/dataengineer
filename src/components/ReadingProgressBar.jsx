// src/components/ReadingProgressBar.jsx - NEW FILE
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Reading Progress Bar
 * Shows a blue gradient bar at the top of the page indicating reading progress
 * with an optional percentage indicator
 */
const ReadingProgressBar = ({ showPercentage = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [percentage, setPercentage] = useState(0);
  
  // Use framer-motion's useScroll for smooth scroll tracking
  const { scrollYProgress } = useScroll();
  
  // Add spring animation for smoother movement
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Show the bar after a small delay (when user starts reading)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Update percentage value
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setPercentage(Math.round(latest * 100));
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  if (!isVisible) return null;

  return (
    <>
      {/* Fixed container at the top - BELOW header at z-index 9998 */}
      <div 
        className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gradient-to-r from-slate-800/30 to-slate-700/30"
        style={{ 
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        {/* Progress bar with gradient */}
        <motion.div
          className="h-full origin-left"
          style={{ 
            scaleX,
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.5)'
          }}
        />
      </div>
      
      {/* Optional: Percentage indicator (desktop only) */}
      {showPercentage && (
        <motion.div
          className="fixed top-20 right-4 z-[9999] hidden md:block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div 
            className="bg-slate-900/90 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 text-sm font-medium text-blue-300 shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span>{percentage}%</span>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default ReadingProgressBar;