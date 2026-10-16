// src/pages/AllArticlesPage.jsx - COMPLETE FINAL VERSION WITH ACCESSIBILITY FIXES
import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePosts } from '@/hooks/useWordPress';
import ArticleLedger from '@/components/editorial/ArticleLedger';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import PostListItemSkeleton from '@/components/PostListItemSkeleton';
import MetaTags from '@/components/SEO/MetaTags';
import { generateBreadcrumbs, SITE_CONFIG } from '@/lib/seoConfig';
import { debounce } from '@/utils/performance';
import { trackSearch } from '@/utils/analytics';

// Lazy load AdPlacement
const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const AllArticlesPage = () => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeSearch, setActiveSearch] = useState('');
  // Archive defaults to the dense list; the card grid is one click away.
  const [viewMode, setViewMode] = useState('list');

  // Read ?search= query param on mount (supports Google Sitelinks Search Box)
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setSearchQuery(q);
      setActiveSearch(q);
    }
  }, []);
  
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
    ? 'flex flex-col space-y-4'
    : 'grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <MetaTags 
  title="All Articles"
  description="Browse all articles and tutorials on DataEngineer Hub. Find content on data engineering, Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, Airflow, dbt, and analytics."
  keywords="data engineering articles, tutorials, blog posts, Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, lakehouse, delta lake, data cloud"
  breadcrumbs={generateBreadcrumbs('/articles', 'All Articles')}
  collectionPageSchema={{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Articles - DataEngineer Hub',
    description:
      'Browse all articles and tutorials on DataEngineer Hub covering data engineering, Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, Airflow, dbt, and analytics.',
    url: `${SITE_CONFIG.url}/articles`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  }}
/>
      <div className="pt-1 pb-6">
        <div className="container mx-auto px-6">
          {/* Archive header: what this is, how many, and search. */}
          <header className="mx-auto max-w-6xl border-b-2 border-ink pb-6 pt-8">
            <p className="kicker mb-3">The archive</p>
            <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">
              {activeSearch ? `Results for "${activeSearch}"` : 'All articles'}
            </h1>
            <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-body">
              Long-form notes on{' '}
              <Link to="/category/snowflake" className="text-rust-600 underline decoration-rust-200 underline-offset-2">Snowflake</Link>,{' '}
              <Link to="/category/dbt" className="text-rust-600 underline decoration-rust-200 underline-offset-2">dbt</Link>,{' '}
              <Link to="/category/airflow" className="text-rust-600 underline decoration-rust-200 underline-offset-2">Apache Airflow</Link>,{' '}
              <Link to="/category/aws" className="text-rust-600 underline decoration-rust-200 underline-offset-2">AWS</Link>,{' '}
              <Link to="/category/python" className="text-rust-600 underline decoration-rust-200 underline-offset-2">Python</Link> and{' '}
              <Link to="/category/sql" className="text-rust-600 underline decoration-rust-200 underline-offset-2">SQL</Link>, newest first.
            </p>

            <form onSubmit={handleSearch} className="mt-6 flex max-w-xl gap-2" role="search">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <Input
                  type="text"
                  placeholder="Search by tool, error or topic"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="h-11 rounded border-paper-500 bg-paper-50 pl-10 text-ink placeholder:text-ink-faint focus:border-ink"
                  aria-label="Search articles"
                />
              </div>
              <Button
                type="submit"
                className="h-11 rounded bg-ink px-5 text-paper hover:bg-rust-600"
                disabled={loading}
                aria-label="Search"
              >
                Search
              </Button>
            </form>
            {activeSearch && (
              <button
                onClick={handleClearSearch}
                className="mt-3 text-sm text-rust-600 underline underline-offset-2"
                aria-label="Clear search"
              >
                Clear search
              </button>
            )}
          </header>

          {/* Count, view and sort controls */}
          {!loading && (
            <div className="mx-auto mb-2 mt-4 flex max-w-6xl flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-ink-faint">
                {totalPosts > 0 ? `${totalPosts} articles` : ''}
              </p>
              <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded border transition-colors ${
                      viewMode === 'list' ? 'border-ink bg-ink text-paper' : 'border-paper-500 text-ink-muted hover:text-ink'
                    }`}
                    aria-label="Switch to list view"
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded border transition-colors ${
                      viewMode === 'grid' ? 'border-ink bg-ink text-paper' : 'border-paper-500 text-ink-muted hover:text-ink'
                    }`}
                    aria-label="Switch to grid view"
                    title="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                <button
                  type="button"
                  onClick={toggleSortOrder}
                  className="ml-1 inline-flex h-10 items-center gap-2 rounded border border-paper-500 px-3 text-sm text-ink-muted transition-colors hover:text-ink"
                  title={sortOrder === 'desc' ? 'Show oldest first' : 'Show newest first'}
                  aria-label={sortOrder === 'desc' ? 'Sort oldest first' : 'Sort newest first'}
                >
                  {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                  {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
                </button>
              </div>
            </div>
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
              {/* Posts: dense ledger by default, card grid on request */}
              <div className="mx-auto max-w-6xl">
                {viewMode === 'list' ? (
                  <ArticleLedger posts={posts} />
                ) : (
                  <div className={`${containerClasses} pt-6`}>
                    {posts.map((post) => <PostCard key={post.id} post={post} />)}
                  </div>
                )}
              </div>

              {/* Ad after posts grid, before pagination */}
              <Suspense fallback={null}>
                <AdPlacement />
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