// src/pages/ArticlePage.jsx - ENHANCED WITH BREADCRUMBS, SEO, AND PHASE 4 READER POLISH
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, AlertCircle, RefreshCw, Share2 } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { usePost } from '@/hooks/useWordPress';
import { throttle } from '@/utils/performance';
import { trackScrollDepth, trackArticleRead } from '@/utils/analytics';
import { generateBreadcrumbs } from '@/lib/seoConfig';
import LazyImage from '@/components/LazyImage';
import TagsList from '@/components/TagsList';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import TableOfContents, { extractHeadings, injectHeadingIds } from '@/components/TableOfContents';
import KeyTakeaways from '@/components/KeyTakeaways';
import useCopyCodeButtons from '@/hooks/useCopyCodeButtons';
import useReactions from '@/hooks/useReactions';
import usePopularity from '@/hooks/usePopularity';
import { markSponsoredLinks } from '@/utils/sponsoredLinks';
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

const PipelineInstrument = React.lazy(() => import('@/components/editorial/PipelineInstrument'));
const AdPlacement = React.lazy(() => import('../components/AdPlacement'));
const AudioReader = React.lazy(() => import('@/components/AudioReader'));
const GiscusComments = React.lazy(() => import('@/components/GiscusComments'));
const ShareButtons = React.lazy(() => import('@/components/ShareButtons'));
const EmailDigestBanner = React.lazy(() => import('@/components/EmailDigestBanner'));
const InlineToolWidget = React.lazy(() => import('@/components/InlineToolWidget'));
const AuthorBioCard = React.lazy(() => import('@/components/AuthorBioCard'));
const SponsorPlacement = React.lazy(() => import('@/components/SponsorPlacement'));
const ArticleFaq = React.lazy(() => import('@/components/ArticleFaq'));
const SaveArticleButton = React.lazy(() => import('@/components/SaveArticleButton'));
const ArticleSeries = React.lazy(() => import('@/components/ArticleSeries'));
const RelatedPosts = React.lazy(() => import('@/components/RelatedPosts'));

const ArticleSkeleton = () => (
  <div className="container mx-auto max-w-4xl px-6 py-8">
    <div className="mb-4 h-6 w-32 rounded bg-paper-400 animate-pulse" />
    <div className="mb-6 h-12 w-3/4 rounded bg-paper-400 animate-pulse" />
    <div className="mb-8 aspect-video max-h-[420px] w-full rounded-sm bg-paper-300 animate-pulse" />
    <div className="space-y-4">
      <div className="h-5 w-full rounded bg-paper-300 animate-pulse" />
      <div className="h-5 w-5/6 rounded bg-paper-300 animate-pulse" />
    </div>
  </div>
);

function fallbackAltFromSrc(src) {
  if (!src) return 'Article diagram';
  try {
    const pathname = new URL(src, 'https://dataengineerhub.blog').pathname;
    const filename = (pathname.split('/').pop() || '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/-\d+x\d+$/i, '')
      .replace(/-scaled$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (filename.length >= 3) {
      return filename.charAt(0).toUpperCase() + filename.slice(1);
    }
  } catch {
    // ignore URL parse failure
  }
  return 'Article diagram';
}

export const optimizeInlineArticleImages = (html) => {
  if (!html) return '';
  return html.replace(/<img\b([^>]*)>/gi, (match, rawAttrs) => {
    let attrs = rawAttrs;

    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : '';

    // 1. Modern format: request WebP on Jetpack Photon (i0.wp.com) images when not specified
    if (src && /i\d\.wp\.com\//i.test(src) && !/[?&]format=/i.test(src)) {
      const sep = src.includes('?') ? '&' : '?';
      const nextSrc = `${src}${sep}format=webp`;
      attrs = attrs.replace(/\bsrc=["'][^"']+["']/i, `src="${nextSrc}"`);
    }

    // 2. Lazy-load below-the-fold inline images and decode off main thread
    if (!/\bloading=/i.test(attrs)) {
      attrs += ' loading="lazy"';
    }
    if (!/\bdecoding=/i.test(attrs)) {
      attrs += ' decoding="async"';
    }

    // 3. Explicit width & height (extract from -WxH. filename if available, otherwise 800x450)
    const dimMatch = src.match(/-(\d{2,4})x(\d{2,4})\.[a-z0-9]+/i);
    const w = dimMatch ? dimMatch[1] : '800';
    const h = dimMatch ? dimMatch[2] : '450';
    if (!/\bwidth=/i.test(attrs)) {
      attrs += ` width="${w}"`;
    }
    if (!/\bheight=/i.test(attrs)) {
      attrs += ` height="${h}"`;
    }

    // 4. Accessibility: ensure non-empty alt text on every inline tutorial diagram
    if (!/\balt=/i.test(attrs)) {
      attrs += ` alt="${fallbackAltFromSrc(src)}"`;
    } else {
      attrs = attrs.replace(/\balt=["']\s*["']/i, `alt="${fallbackAltFromSrc(src)}"`);
    }

    return `<img${attrs}>`;
  });
};

const processWordPressContent = (content, purify) => {
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
      'data-*', 'frameborder', 'allowfullscreen', 'loading', 'decoding'
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

  purify.addHook('uponSanitizeAttribute', (node, data) => {
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

  let cleanContent = purify.sanitize(content, config);
  purify.removeHook('uponSanitizeAttribute');
  cleanContent = injectHeadingIds(cleanContent);
  cleanContent = cleanContent
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, '')
    .replace(/<br\s*\/?>/g, '<br />')
    .replace(/<table/g, '<table class="wp-table"')
    .replace(/<iframe/g, '<div class="iframe-wrapper"><iframe')
    .replace(/<\/iframe>/g, '</iframe></div>');

  return optimizeInlineArticleImages(cleanContent);
};

const ErrorDisplay = ({ error, onRetry, slug }) => {
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    if (!err) return 'An unknown error occurred';
    if (typeof err === 'string') return err;
    if (err.message) {
      if (err.message.includes('not found')) return `Article "${slug}" was not found.`;
      if (err.message.includes('Network')) return 'Unable to connect. Please check your internet connection.';
      if (err.message.includes('timeout')) return 'Request timed out. Please try again.';
      return err.message;
    }
    return 'Failed to load the article. Please try again.';
  };

  const isNotFound = error?.message?.includes('not found') || error?.message?.includes('404');

  return (
    <div className="pt-4 pb-12">
      <Helmet>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-4">
          <Link
            to="/articles"
            className="inline-flex items-center rounded-md border border-paper-500 px-3 py-2 text-sm text-ink-soft hover:border-ink hover:text-ink"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />All Articles
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="mx-auto mb-4 h-14 w-14 text-rust-600" />
          <h1 className="mb-4 font-serif text-2xl font-semibold text-ink md:text-3xl">
            {isNotFound ? 'Article Not Found' : 'Error Loading Article'}
          </h1>
          <p className="mb-6 max-w-md leading-relaxed text-ink-muted">{getErrorMessage(error)}</p>
          {!isNotFound && (
            <button type="button" onClick={onRetry} className="inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm text-paper hover:bg-rust-600">
              <RefreshCw className="mr-2 h-4 w-4" />Try Again
            </button>
          )}
          {isNotFound && (
            <button type="button" onClick={() => navigate('/articles')} className="inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm text-paper hover:bg-rust-600">
              Browse All Articles
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Article header: topic line, serif headline, summary, ruled byline row.
// No fade-in (initial={false}) on first paint so static-to-React swap is seamless.
// ============================================================================
const MetadataOption1 = ({ safePost, formatDate, slug, isAnnouncement = false }) => {
  const isOwner = isBlogOwner({ name: safePost.author, id: safePost.authorData?.id, slug: safePost.authorData?.slug });
  const authorDisplayName = isOwner ? OWNER_DISPLAY_NAME : (safePost.author || 'Unknown Author');
  const authorInitials = authorDisplayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
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
    <header className="mx-auto max-w-3xl">
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
              alt={authorDisplayName}
              width={40}
              height={40}
              loading="eager"
              decoding="async"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-400 text-sm font-medium text-ink-soft">
              {authorInitials}
            </span>
          )}
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-medium text-ink">{isAnnouncement ? 'Sponsored announcement' : `By ${authorDisplayName}`}</span>
            <span className="text-[13px] text-ink-faint">{authorSubtitle}</span>
          </span>
        </AuthorWrapper>

        <p className="font-mono text-[12px] text-ink-faint">
          <time dateTime={safePost.date}>{formatDate(safePost.date)}</time>
          {wasUpdated && <> · Updated <time dateTime={safePost.modified}>{formatDate(safePost.modified)}</time></>}
        </p>

        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <AudioReader content={safePost.content} title={safePost.title} />
          </Suspense>
          <Suspense fallback={<span className="inline-block h-10 w-10" />}>
            <SaveArticleButton slug={slug} title={safePost.title} />
          </Suspense>
          <button
            type="button"
            onClick={async () => {
              if (navigator.share) {
                navigator.share({ title: safePost.title, url: window.location.href }).catch(() => {});
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
    </header>
  );
};

const ArticlePage = () => {
  const { slug } = useParams();
  // /announcements/:slug renders paid press releases with this same view.
  const isAnnouncement = useLocation().pathname.startsWith('/announcements/');
  const { post, loading, error, refetch } = usePost(slug);

  useEffect(() => {
    if (!post) return undefined;

    const readTimeMinutes = parseInt(post.readTime, 10) || 1;
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

  // SSG HTML is already sanitized at build time. Re-running DOMPurify here
  // pulled an 11 KB gzip library onto every article's first paint.
  const readyProcessed = useMemo(() => {
    if (!post?.content || !post.htmlReady) {
      return { processedHtml: '', keyTakeaways: [], takeawaysTitle: 'TL;DR', articleFaqs: [] };
    }
    const readyFaqs = analyzeArticleFaqs(post.content);
    const readyBody = readyFaqs.source === 'section' || readyFaqs.source === 'rendered'
      ? readyFaqs.html
      : post.content;
    return {
      processedHtml: optimizeInlineArticleImages(
        enhanceArticleCodeBlocks(injectArticleContextualLinks(readyBody, slug))
      ),
      keyTakeaways: Array.isArray(post.keyTakeaways) ? post.keyTakeaways : [],
      takeawaysTitle: post.takeawaysTitle || 'TL;DR',
      articleFaqs: readyFaqs.items,
    };
  }, [post?.content, post?.htmlReady, post?.keyTakeaways, post?.takeawaysTitle, slug]);

  const [liveProcessed, setLiveProcessed] = useState(null);
  useEffect(() => {
    if (!post?.content || post.htmlReady) {
      setLiveProcessed(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const [{ default: purify }, { default: articlesData }, { injectArticleLinks }] = await Promise.all([
        import('dompurify'),
        import('@/data/articlesCatalog'),
        import('@/lib/pseo/injectArticleLinks'),
      ]);
      const analysis = analyzeKeyTakeaways(post.content);
      const elevate = isElevatedTakeawaysSource(analysis.source);
      const bodySource = elevate ? analysis.html : post.content;
      const faqAnalysis = analyzeArticleFaqs(bodySource);
      const faqBody = faqAnalysis.source === 'section' || faqAnalysis.source === 'rendered'
        ? faqAnalysis.html
        : bodySource;
      const sanitized = processWordPressContent(faqBody, purify);
      if (cancelled) return;
      setLiveProcessed({
        processedHtml: enhanceArticleCodeBlocks(
          injectArticleContextualLinks(
            injectArticleLinks(sanitized, slug, { articles: articlesData }),
            slug
          )
        ),
        keyTakeaways: elevate ? analysis.items : [],
        takeawaysTitle: analysis.label || 'TL;DR',
        articleFaqs: faqAnalysis.items,
      });
    })();
    return () => { cancelled = true; };
  }, [post?.content, post?.htmlReady, slug]);

  const { processedHtml, keyTakeaways, takeawaysTitle, articleFaqs } = post?.htmlReady
    ? readyProcessed
    : (liveProcessed || { processedHtml: '', keyTakeaways: [], takeawaysTitle: 'TL;DR', articleFaqs: [] });

  const [seoMeta, setSeoMeta] = useState(null);
  useEffect(() => {
    if (!post || post.htmlReady) {
      setSeoMeta(null);
      return undefined;
    }
    let cancelled = false;
    import('@/data/seoOverrides').then((mod) => {
      if (cancelled) return;
      setSeoMeta({
        title: mod.getOptimizedTitle(slug, post.title),
        description: mod.getOptimizedDescription(slug, post.excerpt),
      });
    });
    return () => { cancelled = true; };
  }, [post, slug]);

  const [extraSchema, setExtraSchema] = useState({ howTo: null, video: null });
  useEffect(() => {
    if (!post || post.htmlReady) {
      setExtraSchema({ howTo: null, video: null });
      return undefined;
    }
    let cancelled = false;
    Promise.all([
      import('@/utils/howToExtractor'),
      import('@/lib/seoConfig'),
    ]).then(([howTo, seo]) => {
      if (cancelled) return;
      const steps = howTo.extractHowToSteps(post.content || '');
      setExtraSchema({
        howTo: steps.length > 0
          ? seo.getHowToSchema({
              name: post.title,
              description: post.excerpt,
              steps,
              image: post.image,
            })
          : null,
        video: seo.getVideoSchema(
          seo.extractVideosFromContent(post.content, post.title, post.excerpt, post.image, post.date)
        ),
      });
    });
    return () => { cancelled = true; };
  }, [post, slug]);

  const headings = useMemo(() => extractHeadings(processedHtml), [processedHtml]);
  const parkedSsgHtml = useSsgArticleFallback(slug);

  if ((loading && !post) || ((error || !post) && parkedSsgHtml)) {
    if (parkedSsgHtml) {
      return (
        <div className="pt-4 pb-12">
          <ReadingProgressBar />
          <div className="container mx-auto max-w-4xl px-6">
            <div
              className="seo-content article-content"
              dangerouslySetInnerHTML={{ __html: parkedSsgHtml }}
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
  if (!post) return <ErrorDisplay error={{ message: 'Post not found' }} onRetry={refetch} slug={slug} />;

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

  const isOwner = isBlogOwner({ name: safePost.author, id: safePost.authorData?.id, slug: safePost.authorData?.slug });
  const authorDisplayName = isOwner ? OWNER_DISPLAY_NAME : (safePost.author || 'Unknown Author');

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Co-authored sponsor guides carry the WordPress tag "sponsored".
  const isSponsoredPost = (safePost.tags || []).some(
    (t) => String(typeof t === 'string' ? t : (t?.slug || t?.name || '')).toLowerCase() === 'sponsored'
  );

  const breadcrumbs = generateBreadcrumbs(`${isAnnouncement ? '/announcements' : '/articles'}/${slug}`, safePost.title);
  const articleIsThin =
    countIndexableWords(safePost.content) < MIN_INDEXABLE_WORD_COUNT;
  const waitingOnSanitize = !post.htmlReady && !liveProcessed;

  return (
    <div className="pt-4 pb-12">
      <ReadingProgressBar readTime={safePost.readTime} />
      <Suspense fallback={null}>
        <ShareButtons title={safePost.title} url={typeof window !== 'undefined' ? window.location.href : ''} />
      </Suspense>

      <MetaTags
        title={seoMeta?.title || safePost.title}
        description={seoMeta?.description || safePost.excerpt}
        image={safePost.image}
        type="article"
        publishedTime={safePost.date}
        modifiedTime={safePost.modified}
        category={safePost.category}
        tags={safePost.tags}
        url={`${isAnnouncement ? '/announcements' : '/articles'}/${slug}`}
        readTime={parseInt(safePost.readTime, 10) || 5}
        author={authorDisplayName}
        noindex={articleIsThin}
        breadcrumbs={breadcrumbs}
        howToSchema={extraSchema.howTo}
        videoSchema={extraSchema.video}
      />

      <div className="container mx-auto max-w-7xl px-6">
        {/* Breadcrumbs + Back Button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          <Link
            to="/articles"
            className="hidden shrink-0 items-center rounded-md border border-paper-500 bg-paper-50 px-3 py-1.5 text-sm text-ink-soft hover:border-ink hover:bg-paper-300 hover:text-ink sm:inline-flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />All Articles
          </Link>
        </div>

        <article className="space-y-8">
          <MetadataOption1 safePost={safePost} formatDate={formatDate} slug={slug} isAnnouncement={isAnnouncement} />

          {isAnnouncement ? (
            <p className="mx-auto max-w-3xl border-l-2 border-rust-500 bg-paper-300 px-4 py-3 text-[15px] text-ink-body">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-rust-600">Sponsored announcement</span>{' '}
              This is a paid announcement supplied by the company named in it, published with light editing. It is not a
              review, and DataEngineer Hub has not necessarily tested the product. Links are marked as sponsored.
            </p>
          ) : isSponsoredPost && (
            <p className="mx-auto max-w-3xl border-l-2 border-rust-500 bg-paper-300 px-4 py-3 text-[15px] text-ink-body">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-rust-600">Sponsored</span>{' '}
              This guide was written in partnership with a sponsor. Our{' '}
              <Link to="/editorial-standards" className="text-rust-600 underline decoration-rust-200 underline-offset-2">editorial standards</Link>{' '}
              still apply, and links to the sponsor are marked as sponsored.
            </p>
          )}

          {/* Hero Image: explicit 16:9 aspect ratio & dimensions prevent CLS */}
          <figure className="relative mx-auto aspect-video max-h-[220px] max-w-4xl overflow-hidden rounded-sm border border-paper-500 bg-paper-300 sm:max-h-[360px] md:max-h-[440px]">
            <LazyImage
              src={safePost.image}
              alt={safePost.title}
              width={1600}
              height={900}
              quality={90}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="h-full w-full object-cover"
              priority={true}
            />
          </figure>

          {/* Body column is centred under the headline (~65-75 characters per
              line at 19px). On wide screens the sticky contents list sits in
              the right margin instead of pushing the column off-centre. */}
          <div className="relative">
            <div className="mx-auto min-w-0 max-w-2xl">
              <KeyTakeaways items={keyTakeaways} title={takeawaysTitle} />
              {!isAnnouncement && (
                <Suspense fallback={null}>
                  <PipelineInstrument post={safePost} slug={slug} />
                </Suspense>
              )}
              <div className="xl:hidden">
                <TableOfContents headings={headings} />
              </div>
              <div className="prose max-w-none prose-headings:text-ink prose-strong:text-ink">
                {waitingOnSanitize ? (
                  <ArticleSkeleton />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: isAnnouncement || isSponsoredPost ? markSponsoredLinks(processedHtml) : processedHtml }}
                    className="article-content"
                  />
                )}
              </div>
              <Suspense fallback={null}>
                <ArticleFaq items={articleFaqs} />
              </Suspense>
            </div>
            <div className="absolute inset-y-0 left-[calc(50%+23rem)] hidden w-56 xl:block">
              <TableOfContents headings={headings} />
            </div>
          </div>

          {/* Renders only when a live sponsor matches this article; always labeled. */}
          <div className="mx-auto max-w-2xl">
            {!isAnnouncement && (
              <Suspense fallback={null}>
                <SponsorPlacement category={safePost.category} tags={safePost.tags} slug={slug} />
              </Suspense>
            )}
          </div>

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
              {[['👍', 'Like'], ['🔥', 'Fire'], ['💡', 'Insightful'], ['🎉', 'Celebrate'], ['❤️', 'Love']].map(([emoji, label]) => {
                const count = reactions[emoji] || 0;
                const isActive = userReaction === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`React with ${label}${count > 0 ? `, ${count} reaction${count !== 1 ? 's' : ''}` : ''}`}
                    onClick={() => react(emoji)}
                    className={`compact-control inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-sm transition-colors ${
                      isActive
                        ? 'border-rust-300 bg-rust-50 text-rust-700'
                        : 'border-paper-500 text-ink-muted hover:border-paper-600'
                    }`}
                  >
                    <span aria-hidden="true">{emoji}</span>
                    {count > 0 && <span className="font-mono text-xs">{count}</span>}
                  </button>
                );
              })}
            </div>

            {isAnnouncement ? (
              <p className="text-[15px] text-ink-muted">
                <Link to="/announcements" className="text-rust-600 underline decoration-rust-200 underline-offset-2">More sponsored announcements</Link>
                {' '}· <Link to="/articles" className="text-rust-600 underline decoration-rust-200 underline-offset-2">Read the tutorials</Link>
              </p>
            ) : (
              <>
                <Suspense fallback={null}>
                  <InlineToolWidget post={safePost} />
                </Suspense>
                <Suspense fallback={null}>
                  <AuthorBioCard author={safePost.authorData} />
                </Suspense>
              </>
            )}

            <p className="text-xs text-ink-faint">
              This page may contain advertisements.{' '}
              <Link to="/privacy-policy" className="text-rust-600 underline decoration-rust-200 underline-offset-2">
                How we use ads
              </Link>.
            </p>
          </div>
        </article>

        {/* End of article stays short: series, one newsletter prompt, related reading, discussion.
            Extra promos, affiliate course grids, sticky bars, and popups are omitted. */}
        {!isAnnouncement && (
          <>
            <div className="mx-auto mt-12 max-w-2xl">
              <Suspense fallback={null}>
                <ArticleSeries slug={slug} category={safePost.category} />
              </Suspense>
            </div>

            <Suspense fallback={null}>
              <EmailDigestBanner />
            </Suspense>

            <Suspense fallback={null}>
              <RelatedPosts currentPostId={safePost.id} category={safePost.category} />
            </Suspense>
          </>
        )}

        <div className="mx-auto max-w-2xl">
          <Suspense fallback={null}>
            <GiscusComments />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;
