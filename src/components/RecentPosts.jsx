// src/components/RecentPosts.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, ChevronDown, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import { usePosts } from '@/hooks/useWordPress';
import { reduceMotion } from '@/utils/performance';

const RecentPosts = ({ 
  category = null, 
  showCategoryError = false,
  initialLimit = 6,
  title = "Recent Posts",
  showLoadMore = true,
  showViewToggle = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const shouldReduceMotion = reduceMotion();
  
  const postsPerPage = initialLimit;

  // FIXED: Pass sortOrder to usePosts hook
  const { 
    posts, 
    loading, 
    error, 
    totalPages, 
    totalPosts, 
    hasMore,
    refresh 
  } = usePosts({
    page: currentPage,
    per_page: postsPerPage,
    categorySlug: category,
    orderby: 'date',
    order: sortOrder, // FIXED: This now actually changes the API call
  });

  // FIXED: Reset page when sort order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder, category]);

  // Manual refresh
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered in RecentPosts');
    refresh();
    toast({
      title: "Refreshing posts...",
      description: "Loading latest content",
    });
  };

  // FIXED: Toggle sort order
  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    console.log('🔄 Changing sort order to:', newOrder);
    setSortOrder(newOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // FIXED: Load more with proper pagination
  const loadMorePosts = () => {
    if (!loading && hasMore) {
      console.log('📄 Loading more posts, next page:', currentPage + 1);
      setCurrentPage(prev => prev + 1);
    }
  };

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">{title}</h2>
          {showViewToggle && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' 
                  ? "bg-blue-600 text-white" 
                  : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                }
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' 
                  ? "bg-blue-600 text-white" 
                  : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                }
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className={`grid gap-6 ${
          viewMode === 'list' 
            ? 'grid-cols-1' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {Array.from({ length: initialLimit }, (_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold gradient-text">{title}</h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            {category ? `Category "${category}" Issue` : 'Failed to Load Posts'}
          </h3>
          <p className="text-red-200/80 mb-4">{error}</p>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="border-red-400/50 text-red-300 hover:bg-red-500/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">{title}</h2>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 text-center"
        >
          <h3 className="text-lg font-semibold text-yellow-300 mb-2">
            {category ? `No posts found in "${category}" category` : 'No posts available'}
          </h3>
          <p className="text-yellow-200/80 mb-4">
            {category 
              ? 'This category exists but has no published posts yet.'
              : 'No posts have been published yet.'
            }
          </p>
        </motion.div>
      </div>
    );
  }

  // Success state - render posts
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold gradient-text">{title}</h2>
          {totalPosts > 0 && (
            <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
              {posts.length} of {totalPosts} posts
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {showViewToggle && (
            <div className="flex items-center space-x-2 mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' 
                  ? "bg-blue-600 text-white" 
                  : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                }
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' 
                  ? "bg-blue-600 text-white" 
                  : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                }
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* FIXED: Sort button with actual functionality */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
            title={sortOrder === 'desc' ? 'Click for oldest first' : 'Click for newest first'}
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {sortOrder === 'desc' ? (
                // Descending icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              ) : (
                // Ascending icon
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              )}
            </svg>
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`grid gap-6 ${
          viewMode === 'list' 
            ? 'grid-cols-1' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            {...(shouldReduceMotion ? {} : {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { 
                duration: 0.5, 
                delay: index * 0.05 
              }
            })}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </motion.div>

      {/* FIXED: Load More Button with proper state */}
      {showLoadMore && hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={loadMorePosts}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Load More Posts
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {loading && posts.length > 0 && (
        <div className={`grid gap-6 ${
          viewMode === 'list' 
            ? 'grid-cols-1' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {Array.from({ length: Math.min(postsPerPage, 3) }, (_, i) => (
            <PostCardSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {/* End message */}
      {!hasMore && posts.length > initialLimit && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-gray-400 bg-gray-800/30 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="text-sm">You've reached the end of the posts</span>
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentPosts;