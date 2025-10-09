// src/components/ReadingProgressBar.jsx - FIXED VERSION (ALWAYS VISIBLE)
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Reading Progress Bar
 * Shows a blue gradient bar at the top of the page indicating reading progress
 * ALWAYS VISIBLE - works when scrolling up or down
 */
const ReadingProgressBar = () => {
  // Use framer-motion's useScroll for smooth scroll tracking
  const { scrollYProgress } = useScroll();
  
  // Add spring animation for smoother movement
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      {/* Fixed container at the top - ALWAYS VISIBLE */}
      <div 
        className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gradient-to-r from-slate-800/30 to-slate-700/30"
        style={{ 
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        {/* Progress bar with gradient - ALWAYS VISIBLE */}
        <motion.div
          className="h-full origin-left"
          style={{ 
            scaleX,
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.5)'
          }}
        />
      </div>
    </>
  );
};

export default ReadingProgressBar;