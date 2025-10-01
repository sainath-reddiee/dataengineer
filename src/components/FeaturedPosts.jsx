// src/components/FeaturedPosts.jsx - COMPLETE PRODUCTION VERSION
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/useWordPress';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { WORDPRESS_API_URL } from '@/apiConfig';
import { reduceMotion } from '@/utils/performance';
import LazyImage from './LazyImage';
import { useToast } from '@/components/ui/use-toast';

const FeaturedPosts = () => {
  const [ref, isIntersecting, hasIntersected] = useIntersectionObserver();
  const shouldReduceMotion = reduceMotion();
  const { toast } = useToast();
  const location = useLocation();

  const { posts: featuredPosts, loading, error, refresh } = usePosts({
    per_page: 3,
    featured: true
  });

  const displayPosts = featuredPosts;

  // Enhanced refresh handler with user feedback
  const handleRefresh = async () => {
    console.log('🔄 Refresh button clicked in FeaturedPosts');
    
    toast({
      title: "🔄 Refreshing...",
      description: "Loading latest featured posts",
    });

    try {
      await refresh();
      
      toast({
        title: "✅ Refreshed!",
        description: "Featured posts updated successfully",
      });
      
      console.log('✅ Featured posts refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing featured posts:', error);
      
      toast({
        title: "❌ Refresh Failed",
        description: "Could not refresh posts. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <section className="py-16 relative">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <AlertCircle className="h-8 w-8 mb-4" />
            <span className="mb-4 text-center">Error loading featured posts: {error}</span>
            <div className="text-sm text-gray-500 max-w-md text-center mb-4">
              <p>Trying to fetch from: {WORDPRESS_API_URL}/wp-json/wp/v2/posts</p>
              <p>Check browser console for more details</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-red-400/50 text-red-300 hover:bg-red-500/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (displayPosts.length === 0 && !loading) {
    return null;
  }

  const animationConfig = shouldReduceMotion 
    ? { initial: {}, animate: {}, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } };

  return (
    <section ref={ref} className="py-16 relative">
      <div className="container mx-auto px-6">
        <AnimatePresence>
          {hasIntersected && (
            <motion.div
              {...animationConfig}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full px-6 py-3">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-200">Featured Content</span>
                </div>
                
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  title="Refresh featured posts"
                  aria-label="Refresh featured posts"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
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

        <div className="grid lg:grid-cols-2 gap-8 mb-12 items-start">
          {hasIntersected && displayPosts.length > 0 && (
            <motion.div
              {...(shouldReduceMotion ? {} : {
                initial: { opacity: 0, x: -30 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.6 }
              })}
            >
              <Link to={`/articles/${displayPosts[0].slug}`} className="block blog-card rounded-2xl overflow-hidden group">
                <div className="relative">
                  <LazyImage
                    src={displayPosts[0].image}
                    alt={displayPosts[0].title}
                    width={1200}
                    quality={85}
                    sizes="(max-width: 768px) 100vw, 80vw"
                    className="w-full h-64 lg:h-96"
                    priority={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute top-6 left-6">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      {displayPosts[0].category}
                    </span>
                  </div>
                  {displayPosts[0].featured && (
                    <div className="absolute top-6 right-6">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-full shadow-lg">
                        <Star className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                    {displayPosts[0].title}
                  </h3>
                  <p className="text-gray-300 mb-6 text-base leading-relaxed">
                    {displayPosts[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(displayPosts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{displayPosts[0].readTime}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          <div className="flex flex-col space-y-6">
            {displayPosts.slice(1, 3).map((post, index) => (
              hasIntersected && (
                <motion.div
                  key={post.id}
                  {...(shouldReduceMotion ? {} : {
                    initial: { opacity: 0, x: 30 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.6, delay: index * 0.1 }
                  })}
                  className="flex-shrink-0"
                >
                  <Link to={`/articles/${post.slug}`} className="block blog-card rounded-xl overflow-hidden group h-40">
                    <div className="flex h-full">
                      <div className="w-32 h-full flex-shrink-0">
                        <LazyImage
                          src={post.image}
                          alt={post.title}
                          width={400}
                          quality={80}
                          sizes="128px"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              {post.category}
                            </span>
                            {post.featured && (
                              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-1 rounded-full">
                                <Star className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                            {post.title}
                          </h3>
                          <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                          <div className="flex items-center space-x-2">
                            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </div>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            ))}
          </div>
        </div>

        {hasIntersected && location.pathname !== '/articles' && (
          <motion.div
            {...(shouldReduceMotion ? {} : {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6, delay: 0.3 }
            })}
            className="text-center"
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-full font-bold group shadow-xl">
              <Link to="/articles">
                View All Articles
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPosts;