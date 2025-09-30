import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/useWordPress';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';

const TrendingPosts = () => {
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();
  
  const { posts: trendingPosts, loading, error, refresh } = usePosts({
    per_page: 3,
    trending: true,
  });

  if (loading) {
    return (
      <section className="py-16 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 relative">
        <div className="container mx-auto px-6 text-center text-red-400">
          <AlertCircle className="h-8 w-8 mb-4 mx-auto" />
          <p>Error loading trending posts.</p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (trendingPosts.length === 0) {
    return null; // Don't render the section if there are no trending posts
  }

  return (
    <section ref={ref} className="py-16 relative">
      <div className="container mx-auto px-6">
        <AnimatePresence>
          {hasIntersected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-6 py-3">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-green-200">Trending Now</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-text">Hot</span> Topics
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Discover the most popular articles and discussions in the community right now.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hasIntersected && trendingPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1
              }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingPosts;