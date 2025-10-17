// src/pages/HomePage.jsx - FINAL VERSION WITH ADSENSE
import React, { Suspense } from 'react';
import Hero from '../components/Hero';
import MetaTags from '../components/SEO/MetaTags';

const FeaturedPosts = React.lazy(() => import('../components/FeaturedPosts'));
const TrendingPosts = React.lazy(() => import('../components/TrendingPosts'));
const RecentPosts = React.lazy(() => import('../components/RecentPosts'));
const TechCategories = React.lazy(() => import('../components/TechCategories'));
const Newsletter = React.lazy(() => import('../components/Newsletter'));
const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

const SectionSkeleton = ({ height = "h-64" }) => (
  <div className={`${height} bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse rounded-2xl mb-8`}>
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

const HomePage = () => {
  return (
    <>
      <MetaTags 
  title="Data Engineering Tutorials - Snowflake, AWS, Azure, Databricks & More"
  description="Master data engineering with expert tutorials on Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, Airflow & dbt. Practical guides for data professionals."
  keywords="data engineering tutorials, snowflake tutorial, aws data engineering, azure data engineering, databricks tutorial, salesforce data cloud, sql optimization, python data engineering, apache airflow, dbt tutorial, lakehouse, delta lake"
  type="website"
/>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        <Hero />
        
        {/* Ad after Hero - High visibility position */}
        <Suspense fallback={null}>
          <AdPlacement position="homepage-top" format="auto" responsive={true} />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-96" />}>
          <FeaturedPosts />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-80" />}>
          <TrendingPosts />
        </Suspense>
        
        {/* Ad between Trending and Tech Categories */}
        <Suspense fallback={null}>
          <AdPlacement position="homepage-middle" format="auto" responsive={true} />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-72" />}>
          <TechCategories />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-96" />}>
          <RecentPosts 
            initialLimit={9}
            showLoadMore={true}
            showViewToggle={true}
            title="Latest Articles"
            showCategoryError={false}
          />
        </Suspense>
        
        {/* Ad before Newsletter - Good engagement position */}
        <Suspense fallback={null}>
          <AdPlacement position="homepage-bottom" format="auto" responsive={true} />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton height="h-64" />}>
          <Newsletter />
        </Suspense>
      </div>
    </>
  );
};

export default HomePage;