// src/pages/ArticlePage.jsx - ENHANCED WITH BREADCRUMBS AND SEO
import React, { Suspense, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, User, AlertCircle, RefreshCw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { usePost, useRelatedPosts } from '@/hooks/useWordPress';
import { preloadImage } from '@/utils/imageOptimizer';
import { throttle } from '@/utils/performance';
import { trackScrollDepth, trackArticleRead, trackEvent } from '@/utils/analytics';
import { generateBreadcrumbs, getHowToSchema, getVideoSchema, extractVideosFromContent } from '@/lib/seoConfig';
import { extractHowToSteps } from '@/utils/howToExtractor';
import { getOptimizedTitle, getOptimizedDescription } from '@/data/seoOverrides';
import LazyImage from '@/components/LazyImage';
import TagsList from '@/components/TagsList';
import DOMPurify from 'dompurify';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/PostCardSkeleton';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import TableOfContents, { extractHeadings, injectHeadingIds } from '@/components/TableOfContents';
import ShareButtons from '@/components/ShareButtons';
import KeyTakeaways from '@/components/KeyTakeaways';
import GiscusComments from '@/components/GiscusComments';
import AudioReader from '@/components/AudioReader';
import EmailDigestBanner from '@/components/EmailDigestBanner';
import useCopyCodeButtons from '@/hooks/useCopyCodeButtons';
import useReactions from '@/hooks/useReactions';
import usePopularity from '@/hooks/usePopularity';
import { injectInternalLinks } from '@/lib/pseo/linkingEngine';
import { getRecommendedCourses, getPlatformColor } from '@/data/courseRecommendations';
import InlineToolWidget from '@/components/InlineToolWidget';
import AuthorBioCard from '@/components/AuthorBioCard';
import SponsorPlacement from '@/components/SponsorPlacement';
import { isBlogOwner, OWNER_DISPLAY_NAME, OWNER_ROLE, OWNER_PROFILE_PATH } from '@/lib/contributorIdentity';
import { useSsgArticleFallback } from '@/hooks/useSsgArticleFallback';
import {
  ADSENSE_REVIEW_MODE,
  countIndexableWords,
} from '@/data/adsenseQualityGate';
import { MIN_INDEXABLE_WORD_COUNT } from '@/data/thinTags';
import { analyzeArticleFaqs } from '@/utils/articleFaq';
import { enhanceArticleCodeBlocks } from '@/utils/articleCodeBlocks';
import { analyzeKeyTakeaways, isElevatedTakeawaysSource } from '@/utils/articleTakeaways';
import { injectArticleContextualLinks } from '@/data/articleContextualLinks';
import ArticleFaq from '@/components/ArticleFaq';
import SaveArticleButton from '@/components/SaveArticleButton';
import ArticleSeries from '@/components/ArticleSeries';
import { ExternalLink, GraduationCap, Megaphone } from 'lucide-react';

const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

const ArticleSkeleton = () => (
  <div className="container mx-auto px-6 max-w-7xl">
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
      'blockquote', 'pre', 'code', 'hr', 'div', 'span', 'button',
      'iframe', 'video', 'audio', 'source', 'dl', 'dt', 'dd',
      'details', 'summary'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'open', 'type',
      'aria-hidden', 'aria-label',
      'width', 'height', 'target', 'rel', 'colspan', 'rowspan',
      'data-*', 'frameborder', 'allowfullscreen', 'loading'
    ],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
  };

  // Restrict iframe src to trusted embed domains
  const TRUSTED_IFRAME_HOSTS = [
    'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com',
    'player.vimeo.com', 'open.spotify.com',
    'codepen.io', 'codesandbox.io',
    'app.dataengineerhub.blog'
  ];

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (node.tagName === 'IFRAME' && data.attrName === 'src') {
      try {
        const url = new URL(data.attrValue);
        if (!TRUSTED_IFRAME_HOSTS.includes(url.hostname)) {
          data.attrValue = 'about:blank';
        }
      } catch {
        data.attrValue = 'about:blank';
      }
    }
  });

  let cleanContent = DOMPurify.sanitize(content, config);
  DOMPurify.removeHook('uponSanitizeAttribute');
  cleanContent = injectHeadingIds(cleanContent);
  cleanContent = cleanContent
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, '')
    .replace(/<br\s*\/?>/g, '<br />')
    .replace(/<table/g, '<table class="wp-table"')
    .replace(/<iframe/g, '<div class="iframe-wrapper"><iframe')
    .replace(/<\/iframe>/g, '</iframe></div>')
    // Optimize inline images: add lazy loading, async decoding, and reserve
    // intrinsic dimensions to reduce CLS. If width/height are already set, we
    // leave them alone.
    .replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy" decoding="async"')
    .replace(/<img(?![^>]*\swidth=)([^>]*)>/gi, '<img width="800" height="450"$1>');

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
      <Helmet>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="container mx-auto px-6 max-w-7xl">
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

const RecommendedCourses = ({ post }) => {
  const courses = React.useMemo(() => getRecommendedCourses(post, 3), [post]);
  if (courses.length === 0) return null;

  const handleClick = (course) => {
    trackEvent({
      action: course.isSponsored ? 'click_sponsored_course' : 'click_course',
      category: 'monetization',
      label: course.title,
      value: course.isFree ? 0 : 1,
    });
  };

  return (
    <section className="mt-16" aria-labelledby="recommended-courses-heading">
      <h2 id="recommended-courses-heading" className="text-3xl font-bold mb-8 text-white text-center">
        Recommended <span className="gradient-text">Courses</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => {
          const colors = getPlatformColor(course.platform);
          return (
            <a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => handleClick(course)}
              className={`group block rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 ${course.isSponsored ? 'hover:border-amber-500/40 hover:bg-slate-800/60 ring-1 ring-amber-500/10' : 'hover:border-blue-400/50 hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center justify-between mb-3">
                {course.isSponsored ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-900/50 text-amber-300 border border-amber-500/30">
                    <Megaphone className="h-3 w-3" />
                    Sponsored
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                    <GraduationCap className="h-3 w-3" />
                    {course.platform}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  {course.isFree && (
                    <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs font-semibold text-green-300 border border-green-500/30">
                      Free
                    </span>
                  )}
                  <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-gray-400 border border-slate-600/30">
                    {course.difficulty}
                  </span>
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                {course.description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
                View course <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 text-center mt-4">
        Some links are affiliate links — at no extra cost to you, we may earn a small commission if you enroll.{' '}
        <Link to="/disclaimer" className="underline hover:text-gray-400">Learn more</Link>
      </p>
    </section>
  );
};

const RelatedPosts = ({ currentPostId, category }) => {
  const { posts: relatedPosts, loading } = useRelatedPosts(currentPostId, category);

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
    <div className="mx-auto mt-16 max-w-6xl">
      <h2 className="mb-8 border-t-2 border-ink pt-3 font-serif text-2xl font-semibold text-ink">
        Keep reading
      </h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        {relatedPosts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
};

// ============================================================================
// Article header: topic line, serif headline, summary, ruled byline row.
// ============================================================================
const MetadataOption1 = ({ safePost, formatDate, slug }) => {
  const isOwner = isBlogOwner({ name: safePost.author, id: safePost.authorData?.id, slug: safePost.authorData?.slug });
  const authorDisplayName = isOwner ? OWNER_DISPLAY_NAME : (safePost.author || 'Unknown Author');
  const authorInitials = authorDisplayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const authorAvatarUrl = safePost.authorData?.avatarUrl || '';
  const authorSubtitle = isOwner ? OWNER_ROLE : (safePost.authorData?.role || 'Guest Author');
  const authorLink = isOwner ? OWNER_PROFILE_PATH : null;
  const AuthorWrapper = ({ children, className }) =>
    authorLink ? <Link to={authorLink} className={className}>{children}</Link>
               : <span className={className}>{children}</span>;
  // Only show "Updated" when the post really changed after publication.
  const wasUpdated = safePost.modified
    && new Date(safePost.modified) > new Date(safePost.date)
    && formatDate(safePost.modified) !== formatDate(safePost.date);

  return (
    <motion.header initial={false} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
      <p className="kicker mb-4">
        {ADSENSE_REVIEW_MODE ? (
          <span>{safePost.category}</span>
        ) : (
          <Link to={`/category/${safePost.category.toLowerCase()}`} className="hover:underline">
            {safePost.category}
          </Link>
        )}
        <span className="text-ink-faint"> · {safePost.readTime}</span>
      </p>

      <h1 className="font-serif text-[32px] font-semibold leading-[1.12] text-ink sm:text-[42px] lg:text-[46px]">
        {safePost.title}
      </h1>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-paper-500 py-4">
        <AuthorWrapper className="flex items-center gap-3">
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-400 text-sm font-medium text-ink-soft">
              {authorInitials}
            </span>
          )}
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-medium text-ink">By {authorDisplayName}</span>
            <span className="text-[13px] text-ink-faint">{authorSubtitle}</span>
          </span>
        </AuthorWrapper>

        <p className="font-mono text-[12px] text-ink-faint">
          <time dateTime={safePost.date}>{formatDate(safePost.date)}</time>
          {wasUpdated && <> · Updated <time dateTime={safePost.modified}>{formatDate(safePost.modified)}</time></>}
        </p>

        <div className="flex items-center gap-2">
          <AudioReader content={safePost.content} title={safePost.title} />
          <SaveArticleButton slug={slug} title={safePost.title} />
          <button
            onClick={async () => {
              if (navigator.share) {
                navigator.share({ title: safePost.title, url: window.location.href }).catch(() => { });
              } else {
                try { await navigator.clipboard.writeText(window.location.href); } catch { /* ignore */ }
              }
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-paper-500 text-ink-muted transition-colors hover:border-paper-600 hover:text-ink"
            title="Share article"
            aria-label="Share article"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

const ArticlePage = () => {
  const { slug } = useParams();
  const { post, loading, error, refetch } = usePost(slug);


  // Preload hero image into browser cache
  useEffect(() => {
    if (post?.image) {
      const img = new Image();
      img.src = post.image;
    }
  }, [post?.image]);

  useEffect(() => {
    if (!post) return;

    const readTimeMinutes = parseInt(post.readTime) || 1;
    trackArticleRead(post.title, post.category, readTimeMinutes);

    let maxDepth = 0;
    const milestones = [25, 50, 75, 100];
    const handleScroll = throttle(() => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercentage > maxDepth) {
        for (const milestone of milestones) {
          if (maxDepth < milestone && scrollPercentage >= milestone) {
            trackScrollDepth(post.title, milestone);
          }
        }
        maxDepth = scrollPercentage;
      }
    }, 1000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  // Inject copy buttons on code blocks after content renders
  useCopyCodeButtons(post?.content);

  // Engagement hooks — must be called before early returns (Rules of Hooks)
  const { reactions, userReaction, react } = useReactions(slug);
  usePopularity(slug);

  // IMPORTANT: useMemo hooks must be called before any early returns
  // to satisfy React's Rules of Hooks (consistent call order every render)
  // Strip an explicit TL;DR / Key Takeaways block from the body when we elevate
  // those bullets into the KeyTakeaways component — otherwise readers see both.
  const { processedHtml, keyTakeaways, takeawaysTitle, articleFaqs } = useMemo(() => {
    if (!post?.content) {
      return { processedHtml: '', keyTakeaways: [], takeawaysTitle: 'TL;DR', articleFaqs: [] };
    }
    // SSG already sanitized/linked this body. Re-running the pipeline on first
    // paint would swap the HTML the reader is already looking at.
    if (post.htmlReady) {
      const readyFaqs = analyzeArticleFaqs(post.content);
      const readyBody = readyFaqs.source === 'section' || readyFaqs.source === 'rendered'
        ? readyFaqs.html
        : post.content;
      return {
        processedHtml: enhanceArticleCodeBlocks(injectArticleContextualLinks(readyBody, slug)),
        keyTakeaways: Array.isArray(post.keyTakeaways) ? post.keyTakeaways : [],
        takeawaysTitle: post.takeawaysTitle || 'TL;DR',
        articleFaqs: readyFaqs.items,
      };
    }
    const analysis = analyzeKeyTakeaways(post.content);
    const elevate = isElevatedTakeawaysSource(analysis.source);
    // Only elevate explicit TL;DR / Key Takeaways sections. Synthetic H2
    // sentences stay in the body — showing them again as a box felt duplicated.
    const bodySource = elevate ? analysis.html : post.content;
    const faqAnalysis = analyzeArticleFaqs(bodySource);
    const faqBody = faqAnalysis.source === 'section' || faqAnalysis.source === 'rendered'
      ? faqAnalysis.html
      : bodySource;
    const sanitized = processWordPressContent(faqBody);
    return {
      processedHtml: enhanceArticleCodeBlocks(
        injectArticleContextualLinks(injectInternalLinks(sanitized, slug), slug)
      ),
      keyTakeaways: elevate ? analysis.items : [],
      takeawaysTitle: analysis.label || 'TL;DR',
      articleFaqs: faqAnalysis.items,
    };
  }, [post?.content, post?.htmlReady, post?.keyTakeaways, slug]);

  const headings = useMemo(() => extractHeadings(processedHtml), [processedHtml]);
  const parkedSsgHtml = useSsgArticleFallback(slug);

  if ((loading && !post) || ((error || !post) && parkedSsgHtml)) {
    if (parkedSsgHtml) {
      return (
        <div className="pt-4 pb-12">
          <ReadingProgressBar />
          <div className="container mx-auto px-6 max-w-4xl">
            <div
              className="seo-content article-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parkedSsgHtml) }}
            />
          </div>
        </div>
      );
    }
    if (loading && !post) {
      return (
        <div className="pt-4 pb-12">
          <ReadingProgressBar />
          <ArticleSkeleton />
        </div>
      );
    }
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
    author: post.author || 'Sainath Reddy',
    authorData: post.authorData || { name: post.author || 'Sainath Reddy', bio: '', avatarUrl: '', website: '', linkedin: '', twitter: '', role: '' },
    date: post.date || new Date().toISOString(),
    modified: post.modified || post.date || new Date().toISOString(),
    readTime: post.readTime || '1 min read',
    image: post.image || 'https://images.unsplash.com/photo-1595872018818-97555653a011?w=800&h=600&fit=crop'
  };

  // Dynamic author display helpers
  const isOwner = isBlogOwner({ name: safePost.author, id: safePost.authorData?.id, slug: safePost.authorData?.slug });
  const authorDisplayName = isOwner ? OWNER_DISPLAY_NAME : (safePost.author || 'Unknown Author');
  const authorInitials = authorDisplayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const authorSubtitle = isOwner ? OWNER_ROLE : (safePost.authorData?.role || 'Guest Author');
  const authorLink = isOwner ? OWNER_PROFILE_PATH : null;

  const AuthorWrapper = ({ children, className }) =>
    authorLink ? (
      <Link to={authorLink} className={className}>{children}</Link>
    ) : (
      <span className={className}>{children}</span>
    );

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

    // Auto-extract HowTo schema from step-based content
    const howToSteps = extractHowToSteps(safePost.content || '');
    const howToSchema = howToSteps.length > 0
      ? getHowToSchema({
          name: safePost.title,
          description: safePost.excerpt,
          steps: howToSteps,
          image: safePost.image,
        })
      : null;

    // Auto-extract VideoObject schema from YouTube/Vimeo embeds
    const videoSchema = getVideoSchema(
      extractVideosFromContent(safePost.content, safePost.title, safePost.excerpt, safePost.image, safePost.date)
    );

    const articleIsThin =
      countIndexableWords(safePost.content) < MIN_INDEXABLE_WORD_COUNT;

    // FAQPage JSON-LD is owned by the SSG layer (scripts/generateFAQSchema.js)
    // to avoid duplicate schemas in the rendered DOM. Do not re-inject here.

    return (
    <div className="pt-4 pb-12">
      <ReadingProgressBar readTime={safePost.readTime} />
      <ShareButtons title={safePost.title} url={typeof window !== 'undefined' ? window.location.href : ''} />

        <MetaTags
          title={getOptimizedTitle(slug, safePost.title)}
          description={getOptimizedDescription(slug, safePost.excerpt)}
          image={safePost.image}
          type="article"
          publishedTime={safePost.date}
          modifiedTime={safePost.modified}
          category={safePost.category}
          tags={safePost.tags}
          author={authorDisplayName}
          noindex={articleIsThin}
          breadcrumbs={breadcrumbs}
          howToSchema={howToSchema}
          videoSchema={videoSchema}
        />

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Breadcrumbs + Back Button */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-6 flex-wrap"
        >
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          {/* The breadcrumb already links back; on phones this button only
              pushed the article further down. */}
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border border-slate-700/60 text-gray-300 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/40 backdrop-blur-sm shrink-0">
            <Link to="/articles"><ArrowLeft className="mr-2 h-4 w-4" />All Articles</Link>
          </Button>
        </motion.div>

        <motion.article initial={false} animate={{ opacity: 1 }} className="space-y-8">
          {/* Title and byline first so readers see what they opened before
              the image; matches the static HTML order. */}
          <MetadataOption1 safePost={safePost} formatDate={formatDate} slug={slug} />

          {/* Hero Image */}
          <figure className="relative mx-auto aspect-video max-h-[220px] max-w-4xl overflow-hidden rounded-sm border border-paper-500 bg-paper-300 sm:max-h-[360px] md:max-h-[440px]">
            <LazyImage
              src={safePost.image}
              alt={safePost.title}
              width={1600}
              quality={90}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="w-full h-full object-cover"
              priority={true}
            />
          </figure>

          {/* Key Takeaways — AEO/AI visibility, Speakable schema target */}

          {/* Article Content with Table of Contents */}
              {/* Body column is centred under the headline (~75 characters per
                  line at 19px). On wide screens the contents list sits in the
                  right margin instead of pushing the column off-centre. */}
              <div className="relative">
                <div className="mx-auto min-w-0 max-w-2xl">
                  <KeyTakeaways items={keyTakeaways} title={takeawaysTitle} />
                  <div className="xl:hidden">
                    <TableOfContents headings={headings} />
                  </div>
                  <div className="prose max-w-none prose-headings:text-ink prose-strong:text-ink">
                    <div
                      dangerouslySetInnerHTML={{ __html: processedHtml }}
                      className="article-content"
                    />
                  </div>
                  <ArticleFaq items={articleFaqs} />
                </div>
                <div className="absolute inset-y-0 left-[calc(50%+23rem)] hidden w-56 xl:block">
                  <TableOfContents headings={headings} />
                </div>
              </div>

          {!ADSENSE_REVIEW_MODE && (
            <SponsorPlacement category={safePost.category} tags={safePost.tags} slug={slug} />
          )}

          {/* Everything after the body stays in the reading column. */}
          <div className="mx-auto max-w-2xl space-y-8 border-t border-paper-500 pt-8">
            {safePost.tags && safePost.tags.length > 0 && (
              <TagsList tags={safePost.tags} linkless={ADSENSE_REVIEW_MODE} />
            )}

            {!ADSENSE_REVIEW_MODE && (
              <Suspense fallback={<div className="h-32" />}>
                <AdPlacement />
              </Suspense>
            )}

            {/* Reactions: a quiet "was this useful" row, not a social bar. */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-ink-faint">Was this useful?</span>
              {[['👍','Like'],['🔥','Fire'],['💡','Insightful'],['🎉','Celebrate'],['❤️','Love']].map(([emoji, label]) => {
                const count = reactions[emoji] || 0;
                const isActive = userReaction === emoji;
                return (
                  <button
                    key={emoji}
                    aria-label={`React with ${label}${count > 0 ? `, ${count} reaction${count !== 1 ? 's' : ''}` : ''}`}
                    onClick={() => react(emoji)}
                    className={`compact-control inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-sm transition-colors ${
                      isActive
                        ? 'border-rust-300 bg-rust-50 text-rust-700'
                        : 'border-paper-500 text-ink-muted hover:border-paper-600'
                    }`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span className="font-mono text-xs">{count}</span>}
                  </button>
                );
              })}
            </div>

            <InlineToolWidget post={safePost} />

            <AuthorBioCard author={safePost.authorData} />

            <p className="text-xs text-ink-faint">
              This page may contain advertisements.{' '}
              <Link to="/privacy-policy" className="text-rust-600 underline decoration-rust-200 underline-offset-2">
                How we use ads
              </Link>.
            </p>
          </div>
        </motion.article>

        {/* End of article stays short: series, related reading, discussion.
            Extra link blocks, sticky bars and popups were removed because
            they buried the content and read as link farming to reviewers. */}
        <div className="mx-auto mt-12 max-w-2xl">
          <ArticleSeries slug={slug} category={safePost.category} />
        </div>

        {!ADSENSE_REVIEW_MODE && <EmailDigestBanner />}

        {!ADSENSE_REVIEW_MODE && <RecommendedCourses post={safePost} />}

        <RelatedPosts currentPostId={safePost.id} category={safePost.category} />

        <div className="mx-auto max-w-2xl">
          <GiscusComments />
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
