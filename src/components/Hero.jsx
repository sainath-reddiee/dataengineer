// src/components/Hero.jsx - OPTIMIZED FOR LCP
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users, ChevronDown, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { reduceMotion } from '@/utils/performance';
import { useStats } from '@/hooks/useStats';

const Hero = () => {
  const [ref] = useIntersectionObserver();
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

  const stats = [
    { icon: Zap, value: `${totalArticles}+`, label: 'Articles', tone: 'text-blue-400' },
    { icon: TrendingUp, value: `${totalCategories}+`, label: 'Technologies', tone: 'text-purple-400' },
    totalReaders ? { icon: Users, value: totalReaders, label: 'Readers', tone: 'text-emerald-400' } : null,
    { icon: Sparkles, value: updateFrequency, label: 'Updates', tone: 'text-orange-400' },
  ].filter(Boolean);

  return (
    <section ref={ref} className="relative flex items-center justify-center overflow-hidden py-16 sm:py-20 md:py-24 px-4 sm:px-6">
      {/* Animated Background - Simplified on mobile */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl floating-animation"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-pink-500/10 to-violet-500/10 rounded-full blur-3xl"></div>
        </div>
      )}

      <div className="container mx-auto relative z-10 max-w-6xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible" // ✅ Always animate, no hasIntersected check for Hero
          className="text-center"
        >
          <motion.p
            variants={itemVariants}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300/80 sm:mb-6"
          >
            DataEngineer Hub · production tutorials
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-5 sm:mb-6 leading-[1.1] px-4 tracking-tight"
          >
            Master{' '}
            <span className="gradient-text">Data Engineering</span>
            {' '}with Expert Tutorials
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto px-4"
          >
            Learn Snowflake, AWS, Azure, SQL, Python, Airflow, dbt, and more with practical, 
            hands-on guides designed for data professionals.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10 px-4"
          >
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 sm:px-8 py-4 text-base rounded-lg font-semibold group shadow-lg shadow-blue-950/40 transition-all duration-300 min-h-[48px]"
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
              className="w-full sm:w-auto border border-white/15 text-slate-100 hover:bg-white/5 px-6 sm:px-8 py-4 text-base rounded-lg font-semibold backdrop-blur-sm min-h-[48px]"
            >
              <Link to="/about">
                Learn more
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border border-white/15 text-slate-100 hover:bg-white/5 px-6 sm:px-8 py-4 text-base rounded-lg font-semibold backdrop-blur-sm min-h-[48px]"
            >
              <Link to="/tools/sql-playground">
                SQL Playground
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-4 sm:grid-cols-4"
          >
            {loading ? (
              <div className="col-span-full flex items-center justify-center gap-2 text-gray-400">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Loading stats...</span>
              </div>
            ) : (
              stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="card-3d rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-left"
                  >
                    <Icon className={`mb-2 h-4 w-4 ${stat.tone}`} />
                    <p className="text-lg font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                );
              })
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