// src/pages/ArticlePage.jsx - ENHANCED WITH BREADCRUMBS AND SEO
import React, { Suspense, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Clock, User, AlertCircle, RefreshCw, Tag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { usePost, useRelatedPosts } from '@/hooks/useWordPress';
import { preloadImage } from '@/utils/imageOptimizer';
import { throttle } from '@/utils/performance';
import { trackScrollDepth, trackArticleRead } from '@/utils/analytics';
import { generateBreadcrumbs } from '@/lib/seoConfig';
import LazyImage from '@/components/LazyImage';
import TagsList from '@/components/TagsList';
import DOMPurify from 'dompurify';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import ArticleNavigation from '@/components/ArticleNavigation';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import RelatedArticles from '@/components/RelatedArticles';

const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

const ArticleSkeleton = () => (
  <div className="container mx-auto px-6 max-w-4xl">
    <div className="mb-4 h-10 w-32 bg-gray-800 rounded animate-pulse" />
    <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: '400px' }}>
      <div className="w-full h-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse" />
    </div>
    <div className="space-y-4">
      <div className="h-8 bg-gray-800 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
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
      if (error.message.includes('not found')) return `Article "${slug}" was not found.`;
      if (error.message.includes('Network')) return 'Unable to connect. Please check your internet connection.';
      if (error.message.includes('timeout')) return 'Request timed out. Please try again.';
      return error.message;
    }
    return 'Failed to load the article. Please try again.';
  };

  const isNotFound = error?.message?.includes('not found') || error?.message?.includes('404');

  return (
    <div className="pt-4 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
            <Link to="/articles"><ArrowLeft className="mr-2 h-4 w-4" />All Articles</Link>
          </Button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">
            {isNotFound ? 'Article Not Found' : 'Error Loading Article'}
          </h1>
          <p className="text-gray-400 leading-relaxed max-w-md mb-4">{getErrorMessage(error)}</p>
          {!isNotFound && (
            <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="mr-2 h-4 w-4" />Try Again
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
          {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-bold mb-8 text-white text-center">
        Related <span className="gradient-text">Articles</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
};

// ============================================================================
// 🎨 OPTION 1: MINIMALIST AUTHOR CHIP + FLOATING ACTION (RECOMMENDED)
// ============================================================================
const MetadataOption1 = ({ safePost, formatDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Category */}
      <div>
        <Link
          to={`/category/${safePost.category.toLowerCase()}`}
          className="inline-flex items-center px-3 py-1.5 bg-blue-500/20 border border-blue-400/40 rounded-full text-xs font-semibold text-blue-300 hover:bg-blue-500/30 transition-all"
        >
          {safePost.category}
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-white">
        {safePost.title}
      </h1>

      {/* 🔥 OPTION 1: AUTHOR CHIP WITH FLOATING SHARE */}
      <div className="flex items-center justify-between pt-6 group">
        {/* Author Chip - Clickable */}
        <Link
          to="/about"
          className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-slate-800/60 to-slate-700/60 hover:from-slate-800 hover:to-slate-700 border border-slate-600/40 hover:border-slate-500/60 transition-all backdrop-blur-sm group/chip"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            SR
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-white group-hover/chip:text-blue-300">Sainath Reddy</span>
            <span className="text-xs text-gray-400">Data Engineer</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-500 group-hover/chip:text-blue-400 transition-colors" />
        </Link>

        {/* Floating Meta Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5 text-purple-400/60" />
            <span>{formatDate(safePost.date)}</span>
            <span className="text-gray-600">•</span>
            <Clock className="h-3.5 w-3.5 text-green-400/60" />
            <span>{safePost.readTime}</span>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: safePost.title,
                  url: window.location.href
                }).catch(() => { });
              }
            }}
            className="p-2.5 rounded-full bg-slate-800/60 hover:bg-slate-700 border border-slate-600/40 text-gray-400 hover:text-white transition-all"
            title="Share article"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Meta (only shows on small screens) */}
      <div className="sm:hidden flex items-center gap-3 text-xs text-gray-400 pt-2">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(safePost.date)}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {safePost.readTime}
        </span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 🎨 OPTION 2: SIDEBAR METADATA (Pinterest/Medium style - for wide screens)
// ============================================================================
const MetadataOption2 = ({ safePost, formatDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Category */}
      <div>
        <Link
          to={`/category/${safePost.category.toLowerCase()}`}
          className="inline-flex items-center px-3 py-1.5 bg-blue-500/20 border border-blue-400/40 rounded-full text-xs font-semibold text-blue-300 hover:bg-blue-500/30 transition-all"
        >
          {safePost.category}
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-white">
        {safePost.title}
      </h1>

      {/* 🔥 OPTION 2: SIDEBAR STYLE with floating badges */}
      <div className="relative pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main content - left */}
          <div className="lg:col-span-2 space-y-3">
            <Link
              to="/about"
              className="inline-flex items-center gap-3 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                SR
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-blue-300 text-sm">Sainath Reddy</div>
                <div className="text-xs text-gray-400">Data Engineer at Anblicks</div>
              </div>
            </Link>
          </div>

          {/* Right side - floating badges */}
          <div className="lg:sticky lg:top-24 space-y-2">
            <div className="inline-flex flex-col gap-2 w-full lg:w-auto">
              {/* Experience Badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs font-semibold text-yellow-400">
                <span>🎯</span>
                <span>4+ Years Experience</span>
              </div>

              {/* Meta Badges Row */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-xs text-gray-300">
                  <Calendar className="h-3.5 w-3.5 text-purple-400" />
                  <span className="hidden sm:inline">{formatDate(safePost.date)}</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-xs text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-green-400" />
                  <span>{safePost.readTime}</span>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: safePost.title,
                      url: window.location.href
                    }).catch(() => { });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg text-sm font-semibold text-white transition-all"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 🎨 OPTION 3: MODERN GLASSMORPHISM OVERLAY (Ultra-sleek)
// ============================================================================
const MetadataOption3 = ({ safePost, formatDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-0"
    >
      {/* Category Badge - Overlay on image */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to={`/category/${safePost.category.toLowerCase()}`}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-600 hover:to-blue-500 backdrop-blur-md border border-blue-400/20 rounded-full text-sm font-semibold text-white transition-all shadow-lg"
        >
          {safePost.category}
        </Link>
      </div>

      {/* Gradient overlay on image */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent rounded-3xl z-5" />

      {/* Content overlaid on image */}
      <div className="relative space-y-6 pt-64">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-white">
          {safePost.title}
        </h1>

        {/* 🔥 OPTION 3: MODERN GLASSMORPHISM METADATA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4"
        >
          {/* Left: Author + Meta */}
          <Link
            to="/about"
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-blue-400/30">
              SR
            </div>
            <div className="space-y-1">
              <div className="font-bold text-white group-hover:text-blue-300">Sainath Reddy</div>
              <div className="text-xs text-gray-300 flex items-center gap-2">
                <span>🎯 4+ yrs</span>
                <span className="text-gray-500">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(safePost.date)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {safePost.readTime}
                </span>
              </div>
            </div>
          </Link>

          {/* Right: Share button with glassmorphism */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: safePost.title,
                  url: window.location.href
                }).catch(() => { });
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-sm font-semibold text-white transition-all"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ArticlePage = () => {
  const { slug } = useParams();
  const { post, loading, error, refetch } = usePost(slug);
  const [contentReady, setContentReady] = useState(false);

  // 🎨 CHOOSE YOUR METADATA DESIGN:
  // Change this value: 1, 2, or 3
  const METADATA_DESIGN = 1;

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

  if (loading) {
    return (
      <div className="pt-4 pb-12">
        <ReadingProgressBar />
        <ArticleSkeleton />
      </div>
    );
  }

  if (error) return <ErrorDisplay error={error} onRetry={refetch} slug={slug} />;
  if (!post) return <ErrorDisplay error={{ message: "Post not found" }} onRetry={refetch} slug={slug} />;

  const safePost = {
    id: post.id || 'unknown',
    title: post.title || 'Untitled',
    excerpt: post.excerpt || '',
    content: post.content || '<p>Content not available</p>',
    category: post.category || 'Uncategorized',
    tags: post.tags || [],
    author: 'Sainath Reddy',
    date: post.date || new Date().toISOString(),
    readTime: post.readTime || '1 min read',
    image: post.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop'
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Generate breadcrumbs for SEO
  const breadcrumbs = generateBreadcrumbs(`/articles/${slug}`, safePost.title);

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
        breadcrumbs={breadcrumbs}
      />

      <div className="container mx-auto px-6 max-w-4xl">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="mb-6">
          <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm">
            <Link to="/articles"><ArrowLeft className="mr-2 h-4 w-4" />All Articles</Link>
          </Button>
        </motion.div>

        <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-8">
          {/* Hero Image */}
          {METADATA_DESIGN !== 3 && (
            <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ height: '450px' }}>
              <LazyImage
                src={safePost.image}
                alt={safePost.title}
                width={1600}
                quality={90}
                sizes="(max-width: 768px) 100vw, 1200px"
                className="w-full h-full object-cover"
                priority={true}
              />
            </div>
          )}

          {/* Metadata Section - Choose design */}
          {METADATA_DESIGN === 1 && <MetadataOption1 safePost={safePost} formatDate={formatDate} />}
          {METADATA_DESIGN === 2 && <MetadataOption2 safePost={safePost} formatDate={formatDate} />}

          {/* Option 3 needs special layout with image */}
          {METADATA_DESIGN === 3 && (
            <div className="relative rounded-3xl overflow-hidden shadow-2xl -mx-6" style={{ height: '600px' }}>
              <LazyImage
                src={safePost.image}
                alt={safePost.title}
                width={1600}
                quality={90}
                sizes="(max-width: 768px) 100vw, 1200px"
                className="w-full h-full object-cover"
                priority={true}
              />
              <div className="absolute inset-0 px-6 pb-6 flex flex-col justify-end">
                <MetadataOption3 safePost={safePost} formatDate={formatDate} />
              </div>
            </div>
          )}

          <Suspense fallback={<div className="h-32" />}>
            <AdPlacement position="article-top" />
          </Suspense>

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-h2:text-3xl prose-h2:font-bold prose-h2:mb-4 prose-h3:text-2xl prose-h3:font-bold prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-pink-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
            <div
              dangerouslySetInnerHTML={{ __html: processWordPressContent(safePost.content) }}
              className="article-content"
            />
          </div>

          {/* Tags Section */}
          {safePost.tags && safePost.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="my-8 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm"
            >
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Tag className="h-6 w-6 text-blue-400" />
                Related Topics
              </h3>
              <TagsList tags={safePost.tags} showIcon={false} size="default" />
            </motion.div>
          )}

          <Suspense fallback={<div className="h-32" />}>
            <AdPlacement position="article-bottom" />
          </Suspense>

          {/* Enhanced Author Footer */}
          <div className="border-t-2 border-gray-700/50 pt-8 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-2xl border border-blue-500/20">
              <div className="space-y-3">
                <p className="text-sm text-gray-400 uppercase tracking-wider">Published by</p>
                <Link
                  to="/about"
                  className="font-bold text-2xl text-white hover:text-blue-400 transition-colors inline-flex items-center gap-2 group"
                >
                  Sainath Reddy
                  <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <p className="text-base text-blue-400 font-semibold">Data Engineer at Anblicks</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">📅 {formatDate(safePost.date)}</span>
                  <span className="text-gray-700">•</span>
                  <span className="text-yellow-400 font-semibold">🎯 4+ years experience</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg">
                  <Link to="/articles">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    More Articles
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 font-semibold">
                  <Link to="/contact">
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Related Articles - NEW COMPONENT FOR BETTER INTERNAL LINKING */}
        <RelatedArticles
          currentPost={{
            id: safePost.id,
            categorySlug: safePost.category?.toLowerCase().replace(/\s+/g, '-') || 'uncategorized',
            tags: safePost.tags || [],
          }}
          limit={6}
        />

        <ArticleNavigation currentPostId={safePost.id} category={safePost.category} />
        <RelatedPosts currentPostId={safePost.id} />
      </div>
    </div>
  );
};

export default ArticlePage;
