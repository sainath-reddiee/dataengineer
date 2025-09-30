import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, ChevronDown, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import wordpressApi from '@/services/wordpressApi';

const RecentPosts = ({ 
  category = null, 
  showCategoryError = false,
  initialLimit = 6,
  title = "Recent Posts",
  showLoadMore = true,
  showViewToggle = false
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  const postsPerPage = initialLimit;

  // Fetch posts function
  const fetchPosts = async (page = 1, append = false) => {
    try {
      setError(null);
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      let result;
      
      if (category) {
        // Get posts by category
        try {
          const categoryId = await wordpressApi.getCategoryIdBySlug(category);
          result = await wordpressApi.getPostsByCategory(categoryId, { 
            page, 
            per_page: postsPerPage 
          });
        } catch (categoryError) {
          if (showCategoryError) {
            setError(`Category "${category}" not found. Please check if the category exists in WordPress.`);
            setPosts([]); // Clear posts on category error
            setTotalPosts(0);
            setHasMore(false);
            return;
          }
          // When not showing a category error, we just show no posts.
          result = { posts: [], totalPosts: 0, totalPages: 0 };
        }
      } else {
        // Get all posts
        result = await wordpressApi.getPosts({ 
          page, 
          per_page: postsPerPage 
        });
      }
      
      if (append) {
        setPosts(prevPosts => [...prevPosts, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      
      setTotalPosts(result.totalPosts || 0);
      setCurrentPage(page);
      
      // Check if there are more posts to load
      const totalLoaded = append ? posts.length + result.posts.length : result.posts.length;
      setHasMore(totalLoaded < (result.totalPosts || 0));
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more posts
  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(currentPage + 1, true);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    wordpressApi.clearCache(); // Clear cache before refresh
    setCurrentPage(1);
    fetchPosts(1, false);
    toast({
      title: "Refreshing posts...",
      description: "Loading latest content",
    });
  };

  // Initial load and re-fetch when the category changes
  useEffect(() => {
    // Clear the cache for posts and categories whenever a new category is viewed.
    // This ensures that the user always sees the correct posts without needing to manually refresh.
    if (category) {
      wordpressApi.clearCache('posts');
      wordpressApi.clearCache('categories');
    }
    setCurrentPage(1);
    setPosts([]);
    setHasMore(false);
    fetchPosts(1, false);
  }, [category, postsPerPage]);

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
              ? 'This category exists but has no published posts yet. Try publishing a post with relevant keywords.'
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.05 
            }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Button */}
      {showLoadMore && hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105"
          >
            {loadingMore ? (
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
      {loadingMore && (
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