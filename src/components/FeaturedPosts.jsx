// src/components/FeaturedPosts.jsx - FIXED CLS VERSION
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reduceMotion } from '@/utils/performance';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import FallbackArticleList from './FallbackArticleList';
import { useHomepagePosts } from '@/hooks/useHomepagePosts';
import { useSlowLoadFallback } from '@/hooks/useSlowLoadFallback';

const FeaturedPosts = ({ compact = false }) => {
  const shouldReduceMotion = reduceMotion();
  const location = useLocation();

  const { posts: featuredPosts, loading } = useHomepagePosts({
    per_page: 3,
    featured: true
  });
  const showBundledFallback = useSlowLoadFallback(loading && featuredPosts.length === 0);

  const animationConfig = shouldReduceMotion
    ? { initial: {}, animate: {}, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  const heading = (
    <AnimatePresence>
      {(
        <motion.div {...animationConfig} className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full px-6 py-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-200">Featured Content</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Must-Read</span> Articles
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Handpicked articles covering the latest trends and best practices in data engineering
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const viewAll = location.pathname !== '/articles' && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="text-center"
    >
      <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-full font-bold group shadow-xl min-h-[48px]">
        <Link to="/articles">
          View All Articles
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </motion.div>
  );

  const cards = featuredPosts.length === 0 ? (
    <FallbackArticleList limit={6} />
  ) : (
    <div className={`spatial-deck grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${compact ? '' : 'mb-12'}`}>
      {featuredPosts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <PostCard post={post} />
        </motion.div>
      ))}
    </div>
  );

  if (loading && featuredPosts.length === 0 && !showBundledFallback) {
    if (compact) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => <PostCardSkeleton key={index} />)}
        </div>
      );
    }
    return (
      <section className="pt-8 pb-12 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ minHeight: '400px' }}>
            {Array.from({ length: 3 }).map((_, index) => <PostCardSkeleton key={index} />)}
          </div>
        </div>
      </section>
    );
  }

  if (compact) {
    return cards;
  }

  if (featuredPosts.length === 0) {
    return (
      <section className="pt-8 pb-12 relative">
        <div className="container mx-auto px-6">
          {heading}
          <FallbackArticleList limit={6} />
          <div className="mt-10">{viewAll}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-12 relative">
      <div className="container mx-auto px-6">
        {heading}
        {cards}
        {viewAll}
      </div>
    </section>
  );
};

export default FeaturedPosts;
