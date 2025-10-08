// src/components/SEO/MetaTags.jsx - COMPLETE WITH TAGS SUPPORT
import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaTags = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author = 'DataEngineer Hub',
  publishedTime,
  modifiedTime,
  category,
  tags = [],
  noindex = false,
}) => {
  const siteName = 'DataEngineer Hub';
  const twitterHandle = '@sainath29';
  const siteUrl = 'https://dataengineerhub.blog';
  
  const createTitle = () => {
    if (!title) {
      return 'DataEngineer Hub - Data Engineering Tutorials';
    }
    
    const maxLength = 60 - siteName.length - 3;
    const truncatedTitle = title.length > maxLength 
      ? title.substring(0, maxLength) + '...' 
      : title;
    
    return `${truncatedTitle} | ${siteName}`;
  };
  
  const fullTitle = createTitle();
  
  const createDescription = () => {
    if (description) {
      return description.length > 155 
        ? description.substring(0, 152) + '...' 
        : description;
    }
    
    return 'Learn data engineering with expert tutorials on Snowflake, AWS, Azure, SQL, Python, Airflow & dbt. Practical guides for data professionals.';
  };
  
  const fullDescription = createDescription();
  
  const fullImage = image || `${siteUrl}/og-image.jpg`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);

  const formatDate = (date) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
    }
  };

  const formattedPublishedTime = formatDate(publishedTime);
  const formattedModifiedTime = formatDate(modifiedTime || publishedTime);

  // Generate keywords from tags
  const generateKeywords = () => {
    if (keywords) return keywords;
    
    const tagNames = Array.isArray(tags) 
      ? tags.map(tag => typeof tag === 'string' ? tag : tag.name).filter(Boolean)
      : [];
    
    const baseKeywords = ['data engineering', 'tutorials', 'data engineering blog'];
    
    if (category) {
      baseKeywords.push(category.toLowerCase());
    }
    
    return [...baseKeywords, ...tagNames].join(', ');
  };

  const finalKeywords = generateKeywords();

  const articleSchema = type === 'article' && formattedPublishedTime ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": fullDescription,
    "image": {
      "@type": "ImageObject",
      "url": fullImage,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": author,
      "url": `${siteUrl}/about`
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
        "width": 250,
        "height": 250
      }
    },
    "datePublished": formattedPublishedTime,
    "dateModified": formattedModifiedTime || formattedPublishedTime,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": currentUrl
    },
    ...(category && { "articleSection": category }),
    ...(tags.length > 0 && { 
      "keywords": Array.isArray(tags) 
        ? tags.map(t => typeof t === 'string' ? t : t.name).filter(Boolean).join(", ")
        : tags
    })
  } : null;

  const websiteSchema = type === 'website' ? {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "url": currentUrl,
    "name": siteName,
    "description": fullDescription,
    "publisher": {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": siteName
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  } : null;

  const breadcrumbSchema = type === 'article' && category ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Articles",
        "item": `${siteUrl}/articles`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": category,
        "item": `${siteUrl}/category/${encodeURIComponent(category.toLowerCase())}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": title,
        "item": currentUrl
      }
    ]
  } : null;

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      <meta name="author" content={author} />
      <link rel="canonical" href={currentUrl} />

      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || siteName} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={title || siteName} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />

      {type === 'article' && formattedPublishedTime && (
        <>
          <meta property="article:author" content={author} />
          <meta property="article:published_time" content={formattedPublishedTime} />
          {formattedModifiedTime && (
            <meta property="article:modified_time" content={formattedModifiedTime} />
          )}
          {category && <meta property="article:section" content={category} />}
          {Array.isArray(tags) && tags.map((tag, i) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            return tagName ? <meta property="article:tag" content={tagName} key={`article-tag-${i}`} /> : null;
          })}
        </>
      )}

      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#1e293b" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {websiteSchema && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default MetaTags;