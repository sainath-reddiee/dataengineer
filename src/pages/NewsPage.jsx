import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Newspaper, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/useWordPress';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { generateBreadcrumbs } from '@/lib/seoConfig';

const NewsPage = () => {
  const { posts, loading, error, hasMore, loadMore, refresh, totalPosts } = usePosts({
    categorySlug: 'news',
    per_page: 9,
  });

  const breadcrumbs = generateBreadcrumbs('/news', 'News & Trends');

  // Noindex the page if we've confirmed there are no posts to render — avoids
  // serving a thin "No news yet" shell to crawlers (AdSense low-content signal).
  const isEmpty = !loading && !error && posts.length === 0;

  return (
    <>
      <MetaTags
        title="Data Engineering News & Trends | DataEngineer Hub"
        description="Stay up to date with the latest data engineering news, industry trends, product launches, and technology updates across Snowflake, AWS, Azure, Databricks, and more."
        keywords="data engineering news, data engineering trends, snowflake news, cloud data news, data platform updates, tech trends"
        type="website"
        breadcrumbs={breadcrumbs}
        noindex={isEmpty}
      />

      <div className="pt-1 pb-8">
        <div className="container mx-auto px-6">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Button
              asChild
              variant="outline"
              className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </motion.div>

          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-orange-400/30 mb-6">
              <Newspaper className="h-8 w-8 md:h-10 md:w-10 text-orange-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-4">
              <span className="gradient-text">News & Trends</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              The latest updates, product launches, and industry trends shaping the data engineering landscape.
            </p>
            <div className="text-sm text-gray-400 max-w-3xl mx-auto leading-relaxed mt-4 text-left md:text-center space-y-2">
              <p>
                This page tracks announcements that actually change how data engineers work —
                Snowflake release notes and new Cortex features, Databricks and Unity Catalog
                updates, BigQuery pricing or engine changes, dbt and Airflow major releases,
                Apache Iceberg and lakehouse format news, and the AWS / Azure / GCP services
                that most impact production pipelines.
              </p>
              <p>
                For step-by-step tutorials and deep dives, browse all{' '}
                <Link to="/articles" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">articles</Link>
                {' '}or jump to a category like{' '}
                <Link to="/category/snowflake" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">Snowflake</Link>,{' '}
                <Link to="/category/databricks" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">Databricks</Link>,{' '}
                <Link to="/category/dbt" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">dbt</Link>, or{' '}
                <Link to="/category/airflow" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">Airflow</Link>.
                For reference material, see the{' '}
                <Link to="/cheatsheets" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">cheat sheets</Link>
                {' '}and{' '}
                <Link to="/glossary" className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50">glossary</Link>.
              </p>
            </div>
            {totalPosts > 0 && (
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/30 px-4 py-2 rounded-full">
                  <Newspaper className="h-4 w-4" />
                  <span>{totalPosts} {totalPosts === 1 ? 'article' : 'articles'}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {loading && posts.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <PostCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Unable to load news</h2>
              <p className="text-gray-400 mb-6">Something went wrong while fetching the latest news.</p>
              <Button onClick={refresh} variant="outline" className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 mb-6">
                <Newspaper className="h-10 w-10 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No news yet</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                We're working on bringing you the latest data engineering news and trends. Check back soon!
              </p>
              <Button asChild variant="outline" className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
                <Link to="/articles">Browse all articles</Link>
              </Button>
            </motion.div>
          )}

          {/* Posts Grid */}
          {posts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-10">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                    className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm px-8"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More News'
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default NewsPage;
