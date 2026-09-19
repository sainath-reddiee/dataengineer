// src/components/Hero.jsx - OPTIMIZED FOR LCP
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { reduceMotion } from '@/utils/performance';
import { useStats } from '@/hooks/useStats';
import HubMotion from '@/components/HubMotion';
import HeroStage from '@/components/HeroStage';

const Hero = () => {
  const [ref] = useIntersectionObserver();
  const shouldReduceMotion = reduceMotion();
  const { totalArticles, totalCategories, totalReaders, updateFrequency, loading } = useStats();

  // ✅ CRITICAL: Reduce animations on mobile for better LCP
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const quietMotion = shouldReduceMotion || isMobile;

  const containerVariants = quietMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = quietMotion ? {} : {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12 md:py-14">
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-10 h-64 w-64 rounded-full bg-teal-400/25 blur-3xl floating-animation"></div>
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center md:text-left"
          >
            <motion.p
              variants={itemVariants}
              className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-teal-300/90"
            >
              DataEngineer Hub · production tutorials
            </motion.p>

            <motion.h1
              variants={itemVariants}
              className="mb-4 text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.4rem]"
            >
              Master{' '}
              <span className="gradient-text">Data Engineering</span>
              {' '}with Expert Tutorials
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto mb-6 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg md:mx-0"
            >
              Production notes on Snowflake, dbt, Airflow, and the warehouse bill — written by a
              working data engineer, not recycled vendor docs.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="group w-full min-h-[48px] rounded-lg bg-gradient-to-r from-teal-500 to-amber-500 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-teal-950/40 btn-3d transition-all duration-300 hover:from-teal-400 hover:to-amber-400 sm:w-auto"
              >
                <Link to="/articles">
                  Explore Articles
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full min-h-[48px] rounded-lg border border-white/15 bg-white/[0.04] px-6 py-4 text-base font-semibold text-slate-100 backdrop-blur-sm hover:bg-white/10 sm:w-auto"
              >
                <Link to="/tools/sql-playground">
                  SQL Playground
                </Link>
              </Button>
              <Link
                to="/tools"
                className="text-sm font-semibold text-teal-300 hover:text-amber-200 sm:ml-1"
              >
                Browse all tools →
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex w-full flex-wrap items-center justify-center gap-3 text-sm sm:gap-5 md:justify-start"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Loading stats...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Zap className="h-4 w-4 text-teal-400" />
                    <span className="font-semibold">{totalArticles}+</span>
                    <span className="text-gray-400">Articles</span>
                  </div>
                  <div className="hidden h-4 w-px bg-gray-700 sm:block"></div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold">{totalCategories}+</span>
                    <span className="text-gray-400">Technologies</span>
                  </div>
                  {totalReaders && (
                    <>
                      <div className="hidden h-4 w-px bg-gray-700 sm:block"></div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4 text-green-400" />
                        <span className="font-semibold">{totalReaders}</span>
                        <span className="text-gray-400">Readers</span>
                      </div>
                    </>
                  )}
                  <div className="hidden h-4 w-px bg-gray-700 sm:block"></div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Sparkles className="h-4 w-4 text-rose-400" />
                    <span className="font-semibold">{updateFrequency}</span>
                    <span className="text-gray-400">Updates</span>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            initial={quietMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: quietMotion ? 0 : 0.15 }}
          >
            <HeroStage reduceMotion={quietMotion}>
              <HubMotion reduceMotion={quietMotion} />
            </HeroStage>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
