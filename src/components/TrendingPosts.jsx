// src/components/TrendingPosts.jsx - COMPLETE VERSION
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { reduceMotion } from '@/utils/performance';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { useHomepagePosts } from '@/hooks/useHomepagePosts';
import { useSlowLoadFallback } from '@/hooks/useSlowLoadFallback';

const TrendingPosts = ({ compact = false }) => {
  const shouldReduceMotion = reduceMotion();

  const { posts: trendingPosts, loading } = useHomepagePosts({
    per_page: 3,
    trending: true,
  });
  const showBundledFallback = useSlowLoadFallback(loading && trendingPosts.length === 0);

  const baseAnimationConfig = shouldReduceMotion
    ? { initial: {}, animate: {}, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  const grid = (
    <div className="spatial-deck grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trendingPosts.map((post, index) => (
        <motion.div
          key={post.id}
          {...(shouldReduceMotion ? {} : {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: {
              duration: 0.5,
              delay: index * 0.1
            }
          })}
        >
          <PostCard post={post} />
        </motion.div>
      ))}
    </div>
  );

  if (loading && trendingPosts.length === 0 && !showBundledFallback) {
    if (compact) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCardSkeleton key={index} />
          ))}
        </div>
      );
    }
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

  if (trendingPosts.length === 0) {
    return null;
  }

  if (compact) {
    return grid;
  }

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6">
        <AnimatePresence>
          {(
            <motion.div
              {...baseAnimationConfig}
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

        {grid}
      </div>
    </section>
  );
};

export default TrendingPosts;
