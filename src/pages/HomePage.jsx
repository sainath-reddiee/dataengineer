// src/pages/HomePage.jsx - ENHANCED WITH SEO STRUCTURED DATA
import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import MetaTags from '../components/SEO/MetaTags';
import { Sparkles, TrendingUp, FileText, Zap, BookOpen } from 'lucide-react';
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/seoConfig';
import { Link } from 'react-router-dom';

import { cheatsheets, CHEATSHEET_CATEGORIES } from '@/data/cheatsheetData';

const FeaturedPosts = React.lazy(() => import('../components/FeaturedPosts'));
const TrendingPosts = React.lazy(() => import('../components/TrendingPosts'));
const RecentPosts = React.lazy(() => import('../components/RecentPosts'));
const TechCategories = React.lazy(() => import('../components/TechCategories'));
const Newsletter = React.lazy(() => import('../components/Newsletter'));
const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

// 🔥 OPTIMIZED SKELETON - Minimal height
const SectionSkeleton = ({ height = "h-32" }) => (
  <div className={`${height} bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse rounded-lg mb-4`}>
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

// 🎨 SECTION HEADER - Compact and modern
const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  actionText,
  actionLink,
  isDark = false
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-4 sm:mb-5 flex items-start justify-between gap-3"
  >
    <div className="flex items-center gap-3 flex-1">
      <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'}`}>
        <Icon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-blue-400'}`} />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {actionText && actionLink && (
      <a
        href={actionLink}
        className="whitespace-nowrap text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 hover:bg-blue-500/10 rounded"
      >
        {actionText} →
      </a>
    )}
  </motion.div>
);

// 📋 CHEAT SHEET CARDS - Featured cheat sheets on homepage
const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-500/20 text-green-300',
  Intermediate: 'bg-blue-500/20 text-blue-300',
  Advanced: 'bg-orange-500/20 text-orange-300',
};

// Pick a diverse mix: one per category, up to 8 cards
const FEATURED_SLUGS = [
  'snowflake-interview-questions',
  'snowflake-best-practices',
  'snowflake-streams-tasks-interview',
  'snowflake-performance-deep-dive-interview',
  'sql-interview-questions',
  'dbt-best-practices',
  'snowflake-governance-interview',
  'snowflake-cost-optimization-interview',
];

const CheatSheetCards = () => {
  const featured = FEATURED_SLUGS
    .map((slug) => cheatsheets.find((s) => s.slug === slug))
    .filter(Boolean)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {featured.map((sheet) => {
        const cat = CHEATSHEET_CATEGORIES.find((c) => c.id === sheet.category);
        return (
          <Link
            key={sheet.slug}
            to={`/cheatsheets/${sheet.slug}`}
            className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              {cat && <span className="text-xs">{cat.icon}</span>}
              <span className="text-[10px] uppercase tracking-wider text-gray-500">{cat?.name}</span>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
              {sheet.title}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-2 mb-3">{sheet.shortDescription}</p>
            <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[sheet.difficulty] || DIFFICULTY_COLORS.Intermediate}`}>
              {sheet.difficulty}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

const HomePage = () => {
  // Generate schemas for homepage
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <>
      <MetaTags
        title="Data Engineering Tutorials - Snowflake, AWS, Azure, Databricks & More"
        description="Master data engineering with expert tutorials on Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, Airflow & dbt. Practical guides for data professionals."
        keywords="data engineering tutorials, snowflake tutorial, aws data engineering, azure data engineering, databricks tutorial, salesforce data cloud, sql optimization, python data engineering, apache airflow, dbt tutorial, lakehouse, delta lake"
        type="website"
      />

      {/* Organization + WebSite Structured Data */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webSiteSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        {/* ============================================================================
            HERO SECTION - Compact
            ============================================================================ */}
        <div className="pb-6 sm:pb-8">
          <Hero />
        </div>

        {/* ============================================================================
            CONTAINER WITH OPTIMIZED SPACING
            ============================================================================ */}
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

          {/* 🌟 FEATURED POSTS - Optimized section */}
          <section>
            <SectionHeader
              icon={Sparkles}
              title="Featured"
              subtitle="Must-read articles"
              actionText="View all"
              actionLink="/articles"
            />
            <Suspense fallback={<SectionSkeleton height="h-40" />}>
              <FeaturedPosts />
            </Suspense>
          </section>

          {/* 🔥 TRENDING POSTS - Compact grid */}
          <section>
            <SectionHeader
              icon={TrendingUp}
              title="Trending Now"
              subtitle="Most popular this week"
              actionText="See all"
              actionLink="/articles"
            />
            <Suspense fallback={<SectionSkeleton height="h-40" />}>
              <TrendingPosts />
            </Suspense>
          </section>

          {/* 🛠 TECH CATEGORIES - Grid view */}
          <section>
            <SectionHeader
              icon={FileText}
              title="Technologies"
              subtitle="Explore by tech stack"
              actionText="Browse all"
              actionLink="/articles"
            />
            <Suspense fallback={<SectionSkeleton height="h-32" />}>
              <TechCategories />
            </Suspense>
          </section>

          {/* 📋 CHEAT SHEETS - Quick reference */}
          <section>
            <SectionHeader
              icon={BookOpen}
              title="Cheat Sheets & Interview Prep"
              subtitle="References, best practices & interview questions"
              actionText="View all"
              actionLink="/cheatsheets"
            />
            <CheatSheetCards />
          </section>

          {/* 📚 RECENT POSTS - Compact list */}
          <section>
            <SectionHeader
              icon={FileText}
              title="Latest Articles"
              subtitle="Fresh content weekly"
              actionText="Archive"
              actionLink="/articles"
            />
            <Suspense fallback={<SectionSkeleton height="h-40" />}>
              <RecentPosts
                initialLimit={6}
                showLoadMore={true}
                showViewToggle={false}
                title={null}
                showCategoryError={false}
              />
            </Suspense>
          </section>

          {/* AD - BOTTOM */}
          <Suspense fallback={null}>
            <AdPlacement />
          </Suspense>

          {/* 📧 NEWSLETTER - Compact */}
          <section>
            <SectionHeader
              icon={Zap}
              title="Stay Updated"
              subtitle="Get weekly insights"
              isDark={true}
            />
            <Suspense fallback={<SectionSkeleton height="h-20" />}>
              <Newsletter />
            </Suspense>
          </section>

        </div>
      </div>
    </>
  );
};

export default HomePage;
