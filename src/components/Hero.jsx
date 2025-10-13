// src/components/Hero.jsx - FINAL OPTIMIZED VERSION
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { reduceMotion } from '@/utils/performance';
import { preloadImage } from '@/utils/imageOptimizer';

const Hero = () => {
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();
  const shouldReduceMotion = reduceMotion();

  useEffect(() => {
    // Defer non-critical image preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const heroImages = [];
        heroImages.forEach(img => preloadImage(img, { fetchpriority: 'high' }));
      }, { timeout: 2000 });
    }
  }, []);

  const containerVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
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
    <section ref={ref} className="relative flex items-center justify-center overflow-hidden py-16 sm:py-20 px-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-pink-500/10 to-violet-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={hasIntersected ? "visible" : "hidden"}
          className="text-center max-w-5xl mx-auto"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-6 py-3 mb-8"
          >
            <Sparkles className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-200">Welcome to DataEngineer Hub</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
          >
            Master{' '}
            <span className="gradient-text">Data Engineering</span>
            {' '}with Expert Tutorials
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto"
          >
            Learn Snowflake, AWS, Azure, SQL, Python, Airflow, dbt, and more with practical, 
            hands-on guides designed for data professionals.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full font-bold group shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
            >
              <Link to="/articles">
                Explore Articles
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 px-8 py-6 text-lg rounded-full font-bold backdrop-blur-sm"
            >
              <Link to="/about">
                Learn More About Us
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8 max-w-4xl mx-auto"
          >
            <div className="tech-card p-4 md:p-6 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Zap className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black gradient-text mb-2">
                100+
              </div>
              <div className="text-gray-400 text-xs md:text-sm font-medium">
                Articles
              </div>
            </div>

            <div className="tech-card p-4 md:p-6 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black gradient-text mb-2">
                8+
              </div>
              <div className="text-gray-400 text-xs md:text-sm font-medium">
                Technologies
              </div>
            </div>

            <div className="tech-card p-4 md:p-6 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black gradient-text mb-2">
                10K+
              </div>
              <div className="text-gray-400 text-xs md:text-sm font-medium">
                Readers
              </div>
            </div>

            <div className="tech-card p-4 md:p-6 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-black gradient-text mb-2">
                Weekly
              </div>
              <div className="text-gray-400 text-xs md:text-sm font-medium">
                Updates
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
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
    </section>
  );
};

export default Hero;