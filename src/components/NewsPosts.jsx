// src/components/NewsPosts.jsx - Homepage news section
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/useWordPress';
import { reduceMotion } from '@/utils/performance';
import PostCard from './PostCard';

const NewsPosts = () => {
  const shouldReduceMotion = reduceMotion();

  const { posts: newsPosts, loading, error, refresh } = usePosts({
    categorySlug: 'news',
    per_page: 3,
  });

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <AlertCircle className="h-8 w-8 mb-4 mx-auto" />
        <p>Error loading news.</p>
        <Button onClick={refresh} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (newsPosts.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 sm:mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">News & Trends</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Latest updates from the data stack</p>
          </div>
        </div>
        <Link
          to="/news"
          className="whitespace-nowrap text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 hover:bg-blue-500/10 rounded"
        >
          View news →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {newsPosts.map((post, index) => (
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
    </section>
  );
};

export default NewsPosts;
