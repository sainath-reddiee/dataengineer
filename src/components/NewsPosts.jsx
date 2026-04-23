// src/components/NewsPosts.jsx - Homepage news section
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/useWordPress';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { reduceMotion } from '@/utils/performance';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';

const NewsPosts = () => {
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();
  const shouldReduceMotion = reduceMotion();

  const { posts: newsPosts, loading, error, refresh } = usePosts({
    categorySlug: 'news',
    per_page: 3,
  });

  const baseAnimationConfig = shouldReduceMotion
    ? { initial: {}, animate: {}, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
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
    <div ref={ref}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hasIntersected && newsPosts.map((post, index) => (
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
    </div>
  );
};

export default NewsPosts;
