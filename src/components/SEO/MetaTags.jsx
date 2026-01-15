// src/components/SEO/MetaTags.jsx - ENHANCED WITH CTR OPTIMIZATION
import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SITE_CONFIG,
  formatTitle,
  formatDescription,
  generateKeywords,
  getCanonicalUrl,
  ensureAbsoluteUrl,
  getImageUrl,
  formatDate,
  getArticleSchema,
  getWebSiteSchema,
  getBreadcrumbSchema,
} from '@/lib/seoConfig';
import { optimizeMetaDescription } from '@/lib/metaDescriptionOptimizer';

const MetaTags = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author = SITE_CONFIG.author.name,
  publishedTime,
  modifiedTime,
  category,
  tags = [],
  noindex = false,
  breadcrumbs = null,
  faqSchema = null,
  howToSchema = null,
  readTime, // NEW: for meta description optimization
  optimizeDescription = true, // NEW: enable/disable optimization
}) => {
  // Format title
  const fullTitle = formatTitle(title);

  // Optimize description for better CTR
  let fullDescription;
  if (optimizeDescription && type === 'article' && title) {
    // Use smart optimizer for articles
    fullDescription = optimizeMetaDescription({
      title,
      excerpt: description,
      category,
      tags,
      readTime: readTime || 5,
    });
  } else {
    // Use standard formatting for other pages
    fullDescription = formatDescription(description);
  }

  // Generate canonical URL
  const currentUrl = url ? ensureAbsoluteUrl(url) : (typeof window !== 'undefined' ? window.location.href : SITE_CONFIG.url);

  // Get image URL
  const fullImage = getImageUrl(image);

  // Format dates
  const formattedPublishedTime = formatDate(publishedTime);
  const formattedModifiedTime = formatDate(modifiedTime || publishedTime);

  // Generate keywords
  const finalKeywords = keywords || generateKeywords(tags, category);

  // Generate structured data
  const articleSchema = type === 'article' && formattedPublishedTime
    ? getArticleSchema({
      title: title || fullTitle,
      description: fullDescription,
      url: currentUrl,
      image: fullImage,
      datePublished: formattedPublishedTime,
      dateModified: formattedModifiedTime,
      category,
      tags,
      author,
    })
    : null;

  const websiteSchema = type === 'website' ? getWebSiteSchema() : null;

  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0
    ? getBreadcrumbSchema(breadcrumbs)
    : null;

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={currentUrl} />

      {/* Robots directives */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || SITE_CONFIG.name} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={title || SITE_CONFIG.name} />
      <meta name="twitter:site" content={SITE_CONFIG.social.twitter} />
      <meta name="twitter:creator" content={SITE_CONFIG.social.twitter} />

      {/* Article-specific meta tags */}
      {type === 'article' && formattedPublishedTime && (
        <>
          <meta property="article:author" content={author} />
          <meta property="article:published_time" content={formattedPublishedTime} />
          {formattedModifiedTime && (
            <>
              <meta property="article:modified_time" content={formattedModifiedTime} />
              <meta property="og:updated_time" content={formattedModifiedTime} />
            </>
          )}
          {category && <meta property="article:section" content={category} />}
          {Array.isArray(tags) && tags.map((tag, i) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            return tagName ? <meta property="article:tag" content={tagName} key={`article-tag-${i}`} /> : null;
          })}
        </>
      )}

      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#1e293b" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Structured Data - Article */}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}

      {/* Structured Data - Breadcrumbs */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}

      {/* Structured Data - Website */}
      {websiteSchema && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}

      {/* Structured Data - FAQ (if provided) */}
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}

      {/* Structured Data - HowTo (if provided) */}
      {howToSchema && (
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default MetaTags;
