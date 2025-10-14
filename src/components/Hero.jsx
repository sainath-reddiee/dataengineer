// src/components/Hero.jsx - OPTIMIZED FOR LCP
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users, ChevronDown, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { reduceMotion } from '@/utils/performance';
import { useStats } from '@/hooks/useStats';

const Hero = () => {
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();
  const shouldReduceMotion = reduceMotion();
  const { totalArticles, totalCategories, totalReaders, updateFrequency, loading } = useStats();

  // ✅ CRITICAL: Reduce animations on mobile for better LCP
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const containerVariants = (shouldReduceMotion || isMobile) ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1 // ✅ Reduced from 0.3
      }
    }
  };

  const itemVariants = (shouldReduceMotion || isMobile) ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3, // ✅ Reduced from 0.5
        ease: "easeOut"
      }
    }
  };

  const chevronContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };
  
  const chevronVariants = {
    animate: {
      y: [0, 10, 0],
      opacity: [1, 0, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section ref={ref} className="relative flex items-center justify-center overflow-hidden py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      {/* Animated Background - Simplified on mobile */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl floating-animation"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-pink-500/10 to-violet-500/10 rounded-full blur-3xl"></div>
        </div>
      )}

      <div className="container mx-auto relative z-10 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible" // ✅ Always animate, no hasIntersected check for Hero
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <span className="text-xs sm:text-sm font-medium text-blue-200">Welcome to DataEngineer Hub</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 leading-tight px-4"
          >
            Master{' '}
            <span className="gradient-text">Data Engineering</span>
            {' '}with Expert Tutorials
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4"
          >
            Learn Snowflake, AWS, Azure, SQL, Python, Airflow, dbt, and more with practical, 
            hands-on guides designed for data professionals.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 px-4"
          >
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full font-bold group shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 min-h-[48px]"
            >
              <Link to="/articles">
                Explore Articles
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full font-bold backdrop-blur-sm min-h-[48px]"
            >
              <Link to="/about">
                Learn More About Us
              </Link>
            </Button>
          </motion.div>

          {/* Dynamic stats */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-2xl mx-auto px-4 text-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Loading stats...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-gray-300">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold">{totalArticles}+</span>
                  <span className="text-gray-400">Articles</span>
                </div>
                <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2 text-gray-300">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span className="font-semibold">{totalCategories}+</span>
                  <span className="text-gray-400">Technologies</span>
                </div>
                <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="h-4 w-4 text-green-400" />
                  <span className="font-semibold">{totalReaders}</span>
                  <span className="text-gray-400">Readers</span>
                </div>
                <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  <span className="font-semibold">{updateFrequency}</span>
                  <span className="text-gray-400">Updates</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator - Desktop only */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1 } }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center"
        >
          <motion.div
            variants={chevronContainerVariants}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center"
          >
            {[0, 1, 2].map((i) => (
              <motion.div key={i} variants={chevronVariants} custom={i}>
                <ChevronDown className="h-6 w-6 text-blue-400/50" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default Hero;