// src/components/ReadingProgressBar.jsx - ENHANCED WITH TIME REMAINING
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';

/**
 * Reading Progress Bar
 * Shows a blue gradient bar at the top of the page indicating reading progress
 * Optionally shows "X min left" indicator when readTime prop is provided
 */
const ReadingProgressBar = ({ readTime }) => {
  const { scrollYProgress } = useScroll();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Track numeric progress for the time remaining indicator
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setProgress(v);
      setIsVisible(v > 0.02 && v < 0.98);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Parse readTime like "5 min read" into a number
  const totalMinutes = readTime ? parseInt(readTime) || 0 : 0;
  const minutesLeft = Math.max(1, Math.ceil(totalMinutes * (1 - progress)));

  return (
    <>
      {/* Fixed progress bar at the top */}
      <div
        className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gradient-to-r from-slate-800/30 to-slate-700/30"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <motion.div
          className="h-full origin-left"
          style={{
            scaleX,
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.5)'
          }}
        />
      </div>

      {/* Time remaining pill - only if readTime is provided */}
      {totalMinutes > 0 && (
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-3 right-4 z-[9997] px-3 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-lg"
            >
              <span className="text-xs font-medium text-gray-300">
                {progress >= 0.95
                  ? 'Done reading'
                  : `${minutesLeft} min left`
                }
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default ReadingProgressBar;