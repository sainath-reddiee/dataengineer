// src/pages/HomePage.jsx - ENHANCED WITH SEO STRUCTURED DATA
import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import MetaTags from '../components/SEO/MetaTags';
import { Sparkles, TrendingUp, FileText, Zap } from 'lucide-react';
import { getOrganizationSchema } from '@/lib/seoConfig';

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

const HomePage = () => {
  // Generate Organization schema for homepage
  const organizationSchema = getOrganizationSchema();

  return (
    <>
      <MetaTags
        title="Data Engineering Tutorials - Snowflake, AWS, Azure, Databricks & More"
        description="Master data engineering with expert tutorials on Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, Airflow & dbt. Practical guides for data professionals."
        keywords="data engineering tutorials, snowflake tutorial, aws data engineering, azure data engineering, databricks tutorial, salesforce data cloud, sql optimization, python data engineering, apache airflow, dbt tutorial, lakehouse, delta lake"
        type="website"
      />

      {/* Organization Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

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

          {/* AD - TOP */}
          <Suspense fallback={null}>
            <AdPlacement position="homepage-top" format="auto" responsive={true} />
          </Suspense>

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

          {/* AD - MIDDLE */}
          <Suspense fallback={null}>
            <AdPlacement position="homepage-middle" format="auto" responsive={true} />
          </Suspense>

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
            <AdPlacement position="homepage-bottom" format="auto" responsive={true} />
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
