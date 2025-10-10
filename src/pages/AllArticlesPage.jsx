// src/pages/AllArticlesPage.jsx - COMPLETE FINAL VERSION WITH ACCESSIBILITY FIXES
import React, { useState, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePosts } from '@/hooks/useWordPress';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import PostListItem from '@/components/PostListItem';
import PostListItemSkeleton from '@/components/PostListItemSkeleton';
import FeaturedPosts from '@/components/FeaturedPosts';
import MetaTags from '@/components/SEO/MetaTags';
import { debounce } from '@/utils/performance';
import { trackSearch } from '@/utils/analytics';

// Lazy load AdPlacement
const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const AllArticlesPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeSearch, setActiveSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const postsPerPage = 12;

  const { posts, loading, error, totalPages, totalPosts, refresh } = usePosts({
    page: currentPage,
    per_page: postsPerPage,
    search: activeSearch,
    orderby: 'date',
    order: sortOrder,
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((query) => {
      setActiveSearch(query.trim());
      setCurrentPage(1);
      if (query.trim()) {
        trackSearch(query.trim(), posts.length);
      }
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== activeSearch) {
      setActiveSearch(searchQuery.trim());
      setCurrentPage(1);
      if (searchQuery.trim()) {
        trackSearch(searchQuery.trim(), posts.length);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const containerClasses = viewMode === 'list'
    ? 'flex flex-col space-y-4 max-w-4xl mx-auto'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

  return (
    <>
      <MetaTags 
        title="All Articles - DataEngineer Hub"
        description="Browse all articles and tutorials on DataEngineer Hub. Find content on data engineering, Snowflake, AWS, Azure, SQL, Python, Airflow, dbt, and analytics."
        keywords="data engineering articles, tutorials, blog posts, Snowflake, AWS, Azure, SQL, Python"
      />
      <div className="pt-1 pb-6">
        <div className="container mx-auto px-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              All <span className="gradient-text">Articles</span>
            </h1>
            <p className="text-base text-gray-300 mb-6 max-w-3xl mx-auto">
              Explore our full library of content, from beginner tutorials to advanced deep dives into data engineering.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    aria-label="Search articles"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  disabled={loading}
                  aria-label="Search"
                >
                  Search
                </Button>
              </form>
              
              {/* Active Search Display */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {activeSearch && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Searching for:</span>
                      <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">
                        "{activeSearch}"
                      </span>
                      <button 
                        onClick={handleClearSearch}
                        className="text-gray-400 hover:text-white"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Ad after search, before featured posts */}
          {currentPage === 1 && !activeSearch && (
            <Suspense fallback={null}>
              <AdPlacement position="article-list-top" format="auto" responsive={true} />
            </Suspense>
          )}
          
          {/* Featured Posts - Only on first page without search */}
          {currentPage === 1 && !activeSearch && <FeaturedPosts />}
          
          {/* Articles Section Header */}
          {!loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold gradient-text">
                    {activeSearch ? `Search Results` : 'All Articles'}
                  </h2>
                  {totalPosts > 0 && (
                    <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                      {totalPosts} total articles
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* VIEW TOGGLE BUTTONS - FIXED WITH ACCESSIBILITY */}
                  <div className="flex items-center space-x-2 mr-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid'
                        ? "bg-blue-600 text-white min-h-[44px] min-w-[44px]"
                        : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20 min-h-[44px] min-w-[44px]"
                      }
                      aria-label="Switch to grid view"
                      title="Grid view"
                    >
                      <Grid className="h-4 w-4" />
                      <span className="sr-only">Grid view</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list'
                        ? "bg-blue-600 text-white min-h-[44px] min-w-[44px]"
                        : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20 min-h-[44px] min-w-[44px]"
                      }
                      aria-label="Switch to list view"
                      title="List view"
                    >
                      <List className="h-4 w-4" />
                      <span className="sr-only">List view</span>
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                    className="border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
                    title={sortOrder === 'desc' ? 'Click for oldest first' : 'Click for newest first'}
                    aria-label={sortOrder === 'desc' ? 'Sort oldest first' : 'Sort newest first'}
                  >
                    {sortOrder === 'desc' ? (
                      <>
                        <SortDesc className="h-4 w-4 mr-2" />
                        Newest First
                      </>
                    ) : (
                      <>
                        <SortAsc className="h-4 w-4 mr-2" />
                        Oldest First
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={refresh} 
                    variant="outline" 
                    size="sm"
                    className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                    disabled={loading}
                    aria-label="Refresh articles"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Loading State */}
          {loading ? (
            <div className={containerClasses}>
              {Array.from({ length: postsPerPage }).map((_, i) => (
                viewMode === 'list' ? <PostListItemSkeleton key={i} /> : <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-red-400 mb-4">Error loading articles: {error}</p>
                <Button 
                  onClick={refresh} 
                  variant="outline"
                  className="border-red-400/50 text-red-300 hover:bg-red-500/20"
                  aria-label="Try again"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          ) : posts.length === 0 ? (
            /* No Results State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                  {activeSearch ? 'No search results found' : 'No articles found'}
                </h3>
                <p className="text-yellow-200/80 mb-4">
                  {activeSearch 
                    ? `No articles match your search for "${activeSearch}". Try different keywords.`
                    : 'No articles are currently available.'
                  }
                </p>
                {activeSearch && (
                  <Button 
                    onClick={handleClearSearch}
                    variant="outline"
                    className="border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/20"
                    aria-label="Clear search"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Posts Grid/List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={containerClasses}
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
                    {viewMode === 'list' ? <PostListItem post={post} /> : <PostCard post={post} />}
                  </motion.div>
                ))}
              </motion.div>

              {/* Ad after posts grid, before pagination */}
              <Suspense fallback={null}>
                <AdPlacement position="article-list-bottom" format="auto" responsive={true} />
              </Suspense>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center space-y-4 mt-12">
                  <div className="flex justify-center items-center space-x-2 flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {getPaginationRange().map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span 
                            key={`dots-${index}`} 
                            className="px-3 py-2 text-gray-400"
                            aria-hidden="true"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-blue-600 text-white hover:bg-blue-700" 
                              : "border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
                            }
                            aria-label={`Go to page ${pageNum}`}
                            aria-current={currentPage === pageNum ? "page" : undefined}
                          >
                            {pageNum}
                          </Button>
                        )
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="text-center text-sm text-gray-400">
                    <div className="bg-gray-800/30 px-4 py-2 rounded-full">
                      Showing page <span className="text-white font-medium">{currentPage}</span> of{' '}
                      <span className="text-white font-medium">{totalPages}</span>
                      {' '}({posts.length} articles on this page)
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Jump for Many Pages */}
              {totalPages > 10 && (
                <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-sm text-gray-400">Quick jump:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      aria-label="Go to first page"
                    >
                      First Page
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      aria-label="Go to last page"
                    >
                      Last Page
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AllArticlesPage;