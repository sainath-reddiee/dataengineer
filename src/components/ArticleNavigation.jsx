// src/components/ArticleNavigation.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';

const ArticleNavigation = ({ currentPostId, category }) => {
  const [prevPost, setPrevPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdjacentPosts = async () => {
      if (!currentPostId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let categoryId = null;
        
        if (category && category !== 'Uncategorized') {
          try {
            categoryId = await wordpressApi.getCategoryIdBySlug(category.toLowerCase());
          } catch (err) {
            console.warn('Category not found:', err);
          }
        }

        const result = await wordpressApi.getPosts({
          per_page: 100,
          categoryId: categoryId,
          orderby: 'date',
          order: 'desc'
        });

        const posts = result.posts;
        if (!posts || posts.length === 0) {
          setLoading(false);
          return;
        }

        const currentIndex = posts.findIndex(post => post.id === currentPostId);
        if (currentIndex === -1) {
          setLoading(false);
          return;
        }

        if (currentIndex < posts.length - 1) {
          setPrevPost(posts[currentIndex + 1]);
        }
        if (currentIndex > 0) {
          setNextPost(posts[currentIndex - 1]);
        }
      } catch (error) {
        console.error('Error fetching adjacent posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdjacentPosts();
  }, [currentPostId, category]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="my-12 py-8 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-xl h-40" />
          <div className="animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-xl h-40" />
        </div>
      </div>
    );
  }

  if (!prevPost && !nextPost) {
    return null;
  }

  return (
    <div className="my-12 py-8 border-t border-gray-800">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
        Continue Reading
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prevPost && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to={`/articles/${prevPost.slug}`}
              className="group block h-full p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Previous Article</span>
              </div>
              <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-3 line-clamp-2">
                {prevPost.title}
              </h4>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {prevPost.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(prevPost.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{prevPost.readTime}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {!prevPost && nextPost && <div className="hidden md:block" />}

        {nextPost && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to={`/articles/${nextPost.slug}`}
              className="group block h-full p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
            >
              <div className="flex items-center justify-end gap-2 text-sm text-gray-400 mb-3">
                <span className="font-medium">Next Article</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-3 line-clamp-2 text-right">
                {nextPost.title}
              </h4>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2 text-right">
                {nextPost.excerpt}
              </p>
              <div className="flex items-center justify-end gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(nextPost.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{nextPost.readTime}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          View All Articles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default ArticleNavigation;