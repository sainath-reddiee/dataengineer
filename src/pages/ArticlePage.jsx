import React, { Suspense, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetaTags from '@/components/SEO/MetaTags';
import { usePost } from '@/hooks/useWordPress';

// Lazy load ad component to reduce initial bundle size
const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

// Enhanced Error Display Component
const ErrorDisplay = ({ error, onRetry, slug }) => {
  const navigate = useNavigate();
  
  const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error.message) {
      if (error.message.includes('not found')) {
        return `Article "${slug}" was not found. It may have been moved or deleted.`;
      }
      if (error.message.includes('Network')) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      if (error.message.includes('timeout')) {
        return 'The request took too long. Please try again.';
      }
      return error.message;
    }
    
    return 'Failed to load the article. Please try again.';
  };

  const isNotFound = error?.message?.includes('not found') || error?.message?.includes('404');

  return (
    <div className="pt-4 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Button 
            asChild 
            variant="outline" 
            className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm"
          >
            <Link to="/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Articles
            </Link>
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-6">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">
              {isNotFound ? 'Article Not Found' : 'Error Loading Article'}
            </h1>
          </div>
          
          <div className="max-w-md space-y-4">
            <p className="text-gray-400 leading-relaxed">
              {getErrorMessage(error)}
            </p>
            
            {!isNotFound && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={onRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/articles')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Browse Articles
                </Button>
              </div>
            )}
            
            {isNotFound && (
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/articles')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Browse All Articles
                </Button>
                <p className="text-sm text-gray-500">
                  Looking for something specific? Try searching our articles.
                </p>
              </div>
            )}
          </div>
          
          {/* Debug info in development */}
          {import.meta.env.DEV && (
            <details className="mt-8 text-left max-w-lg">
              <summary className="text-sm text-gray-500 cursor-pointer">Debug Info</summary>
              <pre className="text-xs text-gray-600 mt-2 p-3 bg-gray-900 rounded overflow-auto">
                {JSON.stringify({ slug, error: error?.toString() }, null, 2)}
              </pre>
            </details>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Enhanced Loading Component
const LoadingDisplay = () => (
  <div className="pt-4 pb-12">
    <div className="container mx-auto px-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <Button 
          asChild 
          variant="outline" 
          className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm"
        >
          <Link to="/articles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Articles
          </Link>
        </Button>
      </motion.div>
      
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader className="h-8 w-8 animate-spin text-blue-400" />
            <div className="absolute inset-0 h-8 w-8 border-4 border-purple-400 border-b-transparent rounded-full animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1s' }}>
            </div>
          </div>
          <p className="text-gray-400">Loading article...</p>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Optimized Image component for better mobile performance
const OptimizedImage = ({ src, alt, className }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(null);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setImageError(true);
      return;
    }

    // Create different sized images for mobile optimization
    const img = new Image();
    
    // Use smaller image for mobile devices
    const isMobile = window.innerWidth <= 768;
    let optimizedSrc = src;
    
    // Only modify if it's a valid URL
    try {
      const url = new URL(src);
      if (isMobile && !src.includes('unsplash.com')) {
        optimizedSrc = src.replace(/w=\d+/, 'w=400').replace(/h=\d+/, 'h=300');
      }
    } catch (e) {
      console.warn('Invalid image URL:', src);
    }
    
    img.onload = () => {
      setImageSrc(optimizedSrc);
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      console.warn('Failed to load image:', optimizedSrc);
      // Try original src as fallback
      if (optimizedSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setImageSrc(src);
          setImageLoaded(true);
        };
        fallbackImg.onerror = () => {
          setImageError(true);
        };
        fallbackImg.src = src;
      } else {
        setImageError(true);
      }
    };
    
    img.src = optimizedSrc;
  }, [src]);

  if (imageError) {
    return (
      <div className={`relative ${className} bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center`}>
        <div className="text-gray-500 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <span className="text-sm">Image not available</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse rounded-2xl flex items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      )}
      {imageSrc && (
        <img 
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          alt={alt || 'Article image'}
          src={imageSrc}
          loading="lazy"
          decoding="async"
          // Add responsive image attributes for mobile
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          style={{ 
            contentVisibility: 'auto',
            containIntrinsicSize: '800px 400px'
          }}
          onError={() => setImageError(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
    </div>
  );
};

// Loading skeleton for ads
const AdSkeleton = () => (
  <div className="h-32 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse rounded-lg flex items-center justify-center">
    <span className="text-gray-500 text-sm">Advertisement</span>
  </div>
);

const ArticlePage = () => {
  const { slug } = useParams();
  const [retryCount, setRetryCount] = useState(0);
  const { post, loading, error, refetch } = usePost(slug);

  // Validate slug
  useEffect(() => {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      console.error('Invalid slug provided:', slug);
    }
  }, [slug]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  // Show loading state
  if (loading) {
    return <LoadingDisplay />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} slug={slug} />;
  }

  // Show not found state
  if (!post) {
    return <ErrorDisplay 
      error="Post not found" 
      onRetry={handleRetry} 
      slug={slug} 
    />;
  }

  // Validate post data before rendering
  const safePost = {
    id: post.id || 'unknown',
    title: post.title || 'Untitled',
    excerpt: post.excerpt || '',
    content: post.content || '<p>Content not available</p>',
    category: post.category || 'Uncategorized',
    author: post.author || 'DataEngineer Hub',
    date: post.date || new Date().toISOString(),
    readTime: post.readTime || '1 min read',
    image: post.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop'
  };

  // Safe date parsing
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="pt-4 pb-12">
      <MetaTags 
        title={safePost.title}
        description={safePost.excerpt}
        image={safePost.image}
        type="article"
      />
      
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Button 
            asChild 
            variant="outline" 
            className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm"
          >
            <Link to="/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Articles
            </Link>
          </Button>
        </motion.div>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="relative">
            <OptimizedImage 
              src={safePost.image}
              alt={safePost.title}
              className="w-full h-64 md:h-96 rounded-2xl overflow-hidden"
            />
            
            <div className="absolute inset-0 flex items-end p-6 md:p-8">
              <div className="space-y-4 text-white">
                <div className="inline-block px-3 py-1 bg-blue-600/80 backdrop-blur-sm rounded-full text-sm font-medium">
                  {safePost.category}
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {safePost.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{safePost.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(safePost.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{safePost.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ad Placement - Top */}
          <Suspense fallback={<AdSkeleton />}>
            <AdPlacement position="article-top" />
          </Suspense>

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: safePost.content }}
              className="article-content"
            />
          </div>

          {/* Ad Placement - Bottom */}
          <Suspense fallback={<AdSkeleton />}>
            <AdPlacement position="article-bottom" />
          </Suspense>

          {/* Article Footer */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <p className="text-gray-400">Published by</p>
                <p className="font-semibold text-white">{safePost.author}</p>
              </div>
              <Button 
                asChild 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link to="/articles">
                  Read More Articles
                </Link>
              </Button>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default ArticlePage;