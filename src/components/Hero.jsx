// src/components/Hero.jsx - OPTIMIZED FOR LCP
import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reduceMotion } from '@/utils/performance';
import { useStats } from '@/hooks/useStats';

const HubMotion = React.lazy(() => import('@/components/HubMotion'));

const isDesktopViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

const Hero = () => {
  const shouldReduceMotion = reduceMotion();
  const { totalArticles, totalCategories, totalReaders, updateFrequency } = useStats();
  const [showDesktopHub, setShowDesktopHub] = React.useState(false);

  React.useEffect(() => {
    setShowDesktopHub(isDesktopViewport());
  }, []);

  return (
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12 md:py-14">
      {showDesktopHub && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl floating-animation"></div>
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <div className="container relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-8">
          <div className="text-center md:text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300/80">
              DataEngineer Hub · production tutorials
            </p>

            <h1 className="mb-4 text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
              Master{' '}
              <span className="gradient-text">Data Engineering</span>
              {' '}with Expert Tutorials
            </h1>

            <p className="mx-auto mb-6 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg md:mx-0">
              Production notes on Snowflake, dbt, Airflow, and the warehouse bill — written by a
              working data engineer, not recycled vendor docs.
            </p>

            <div className="mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
              <Button
                asChild
                size="lg"
                className="group w-full min-h-[48px] rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-950/40 transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 sm:w-auto"
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
                className="w-full min-h-[48px] rounded-lg border border-white/15 px-6 py-4 text-base font-semibold text-slate-100 backdrop-blur-sm hover:bg-white/5 sm:w-auto"
              >
                <Link to="/tools/sql-playground">
                  SQL Playground
                </Link>
              </Button>
              <Link
                to="/tools"
                className="text-sm font-semibold text-blue-300 hover:text-blue-200 sm:ml-1"
              >
                Browse all tools →
              </Link>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-3 text-sm sm:gap-5 md:justify-start">
              <div className="flex items-center gap-2 text-gray-300">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="font-semibold">{totalArticles}+</span>
                <span className="text-gray-400">Articles</span>
              </div>
              <div className="hidden h-4 w-px bg-gray-700 sm:block"></div>
              <div className="flex items-center gap-2 text-gray-300">
                <TrendingUp className="h-4 w-4 text-purple-400" />
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
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span className="font-semibold">{updateFrequency}</span>
                <span className="text-gray-400">Updates</span>
              </div>
            </div>
          </div>

          {showDesktopHub && (
            <Suspense fallback={<div className="hidden min-h-[280px] md:block" aria-hidden="true" />}>
              <HubMotion reduceMotion={shouldReduceMotion} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
