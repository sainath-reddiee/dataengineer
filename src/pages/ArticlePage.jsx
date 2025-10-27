// src/pages/ArticlePage.jsx - OPTIMIZED FOR SPEED
import React, { Suspense, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Loader, AlertCircle, RefreshCw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetaTags from '@/components/SEO/MetaTags';
import { usePost, useRelatedPosts } from '@/hooks/useWordPress';
import { preloadImage } from '@/utils/imageOptimizer';
import { throttle } from '@/utils/performance';
import { trackScrollDepth, trackArticleRead } from '@/utils/analytics';
import LazyImage from '@/components/LazyImage';
import TagsList from '@/components/TagsList';
import DOMPurify from 'dompurify';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import ArticleNavigation from '@/components/ArticleNavigation';
import ReadingProgressBar from '@/components/ReadingProgressBar';

const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

// ✅ CRITICAL: Pre-render skeleton with exact dimensions to prevent CLS
const ArticleSkeleton = () => (
  <div className="container mx-auto px-6 max-w-4xl">
    <div className="mb-4 h-10 w-32 bg-gray-800 rounded animate-pulse" />
    
    {/* Hero skeleton with FIXED height */}
    <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: '384px' }}>
      <div className="w-full h-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse" />
    </div>

    {/* Content skeleton */}
    <div className="space-y-4">
      <div className="h-8 bg-gray-800 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-5/6 animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-4/6 animate-pulse" />
    </div>
  </div>
);

const processWordPressContent = (content) => {
  if (!content) return '';
  
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'blockquote', 'pre', 'code', 'hr', 'div', 'span',
      'iframe', 'video', 'audio', 'source', 'dl', 'dt', 'dd'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'width', 'height', 'target', 'rel', 'colspan', 'rowspan',
      'data-*', 'frameborder', 'allowfullscreen', 'loading'
    ],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
  };
  
  let cleanContent = DOMPurify.sanitize(content, config);
  
  cleanContent = cleanContent
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, '')
    .replace(/<br\s*\/?>/g, '<br />')
    .replace(/<table/g, '<table class="wp-table"')
    .replace(/<iframe/g, '<div class="iframe-wrapper"><iframe')
    .replace(/<\/iframe>/g, '</iframe></div>')
    .replace(/\n\n/g, '</p><p>');
  
  return cleanContent;
};

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
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm">
            <Link to="/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Articles
            </Link>
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">
            {isNotFound ? 'Article Not Found' : 'Error Loading Article'}
          </h1>
          
          <p className="text-gray-400 leading-relaxed max-w-md mb-4">
            {getErrorMessage(error)}
          </p>
          
          {!isNotFound && (
            <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          
          {isNotFound && (
            <Button onClick={() => navigate('/articles')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Browse All Articles
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const RelatedPosts = ({ currentPostId }) => {
  const { posts: relatedPosts, loading } = useRelatedPosts(currentPostId);

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8 text-white text-center">
          Related <span className="gradient-text">Articles</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold mb-8 text-white text-center">
        Related <span className="gradient-text">Articles</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

const ArticlePage = () => {
  const { slug } = useParams();
  const { post, loading, error, refetch } = usePost(slug);
  const [contentReady, setContentReady] = useState(false);

  // ✅ CRITICAL: Start image preload immediately
  useEffect(() => {
    if (post?.image) {
      const img = new Image();
      img.src = post.image;
      img.onload = () => setContentReady(true);
      img.onerror = () => setContentReady(true);
    }
  }, [post?.image]);

  useEffect(() => {
    if (!post) return;

    const readTimeMinutes = parseInt(post.readTime) || 1;
    trackArticleRead(post.title, post.category, readTimeMinutes);

    let maxDepth = 0;
    const handleScroll = throttle(() => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercentage > maxDepth) {
        maxDepth = scrollPercentage;
        if ([25, 50, 75, 100].includes(scrollPercentage)) {
          trackScrollDepth(post.title, scrollPercentage);
        }
      }
    }, 1000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  const handleRetry = () => {
    refetch();
  };

  // ✅ Show skeleton immediately while loading
  if (loading) {
    return (
      <div className="pt-4 pb-12">
        <ReadingProgressBar />
        <ArticleSkeleton />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} slug={slug} />;
  }

  if (!post) {
    return <ErrorDisplay 
      error={{ message: "Post not found" }}
      onRetry={handleRetry} 
      slug={slug} 
    />;
  }

  const safePost = {
    id: post.id || 'unknown',
    title: post.title || 'Untitled',
    excerpt: post.excerpt || '',
    content: post.content || '<p>Content not available</p>',
    category: post.category || 'Uncategorized',
    tags: post.tags || [],
    author: post.author || 'DataEngineer Hub',
    date: post.date || new Date().toISOString(),
    readTime: post.readTime || '1 min read',
    image: post.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop'
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  return (
    <div className="pt-4 pb-12">
      <ReadingProgressBar />
      
      <MetaTags 
        title={safePost.title}
        description={safePost.excerpt}
        image={safePost.image}
        type="article"
        publishedTime={safePost.date}
        category={safePost.category}
        tags={safePost.tags}
        author={safePost.author}
      />
      
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm">
            <Link to="/articles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Articles
            </Link>
          </Button>
        </motion.div>

        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* ✅ CRITICAL: Fixed height hero to prevent CLS */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: '384px' }}>
            <LazyImage
              src={safePost.image}
              alt={safePost.title}
              width={1600}
              quality={85}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="w-full h-full"
              priority={true}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end p-6 md:p-8">
              <div className="space-y-4 text-white w-full">
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

          <Suspense fallback={<div className="h-32" />}>
            <AdPlacement position="article-top" />
          </Suspense>

          {/* ✅ Render content immediately without waiting */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: processWordPressContent(safePost.content) }}
              className="article-content"
              style={{
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                minHeight: '200px'
              }}
            />
          </div>

          {safePost.tags && safePost.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="my-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-400" />
                Related Topics
              </h3>
              <TagsList tags={safePost.tags} showIcon={false} size="default" />
            </motion.div>
          )}

          <Suspense fallback={<div className="h-32" />}>
            <AdPlacement position="article-bottom" />
          </Suspense>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <p className="text-gray-400">Published by</p>
                <p className="font-semibold text-white text-lg">Sainath Reddy</p>
                <p className="text-sm text-blue-400 font-medium">Data Engineer at Anblicks</p>
                <p className="text-sm text-gray-500">📅 {formatDate(safePost.date)}</p>
                <p className="text-xs text-gray-600">🎯 4+ years of Data Engineering experience</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Link to="/articles">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    More Articles
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
                  <Link to="/contact">
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.article>
        
        <ArticleNavigation 
          currentPostId={safePost.id} 
          category={safePost.category} 
        />
        
        {/* ✅ Load related posts last - they're not critical */}
        <RelatedPosts currentPostId={safePost.id} />
      </div>
    </div>
  );
};

export default ArticlePage;