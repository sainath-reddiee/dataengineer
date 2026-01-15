// src/lib/seoConfig.js
/**
 * Centralized SEO Configuration
 * Single source of truth for all SEO-related constants and utilities
 */

// ============================================================================
// SITE CONFIGURATION
// ============================================================================

export const SITE_CONFIG = {
  name: 'DataEngineer Hub',
  url: 'https://dataengineerhub.blog',
  description: 'Learn data engineering with expert tutorials on Snowflake, AWS, Azure, SQL, Python, Airflow & dbt. Practical guides for data professionals.',
  author: {
    name: 'Sainath Reddy',
    role: 'Data Engineer at Anblicks',
    experience: '4+ years',
    url: 'https://dataengineerhub.blog/about',
  },
  social: {
    twitter: '@sainath29',
    twitterHandle: 'sainath29',
  },
  logo: {
    url: 'https://dataengineerhub.blog/logo.png',
    width: 250,
    height: 250,
  },
  ogImage: {
    url: 'https://dataengineerhub.blog/og-image.jpg',
    width: 1200,
    height: 630,
  },
};

// ============================================================================
// SEO DEFAULTS
// ============================================================================

export const SEO_DEFAULTS = {
  titleTemplate: '%s | DataEngineer Hub',
  titleSeparator: '|',
  maxTitleLength: 60,
  maxDescriptionLength: 155,
  defaultTitle: 'DataEngineer Hub - Data Engineering Tutorials',
  defaultDescription: 'Learn data engineering with expert tutorials on Snowflake, AWS, Azure, SQL, Python, Airflow & dbt. Practical guides for data professionals.',
  defaultKeywords: [
    'data engineering',
    'data engineering tutorials',
    'snowflake',
    'aws data engineering',
    'azure data engineering',
    'databricks',
    'sql',
    'python',
    'airflow',
    'dbt',
  ],
  locale: 'en_US',
  type: 'website',
};

// ============================================================================
// STRUCTURED DATA TEMPLATES
// ============================================================================

/**
 * Generate Organization schema
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: SITE_CONFIG.logo.url,
      width: SITE_CONFIG.logo.width,
      height: SITE_CONFIG.logo.height,
    },
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.social.twitterHandle}`,
    ],
  };
}

/**
 * Generate WebSite schema with search action
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/articles?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Article schema
 */
export function getArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  category,
  tags = [],
  author = SITE_CONFIG.author.name,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: {
      '@type': 'ImageObject',
      url: image || SITE_CONFIG.ogImage.url,
      width: SITE_CONFIG.ogImage.width,
      height: SITE_CONFIG.ogImage.height,
    },
    author: {
      '@type': 'Person',
      name: author,
      url: SITE_CONFIG.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo.url,
        width: SITE_CONFIG.logo.width,
        height: SITE_CONFIG.logo.height,
      },
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(category && { articleSection: category }),
    ...(tags.length > 0 && {
      keywords: Array.isArray(tags)
        ? tags.map(t => (typeof t === 'string' ? t : t.name)).filter(Boolean).join(', ')
        : tags,
    }),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function getBreadcrumbSchema(breadcrumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Generate FAQ schema
 */
export function getFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate HowTo schema
 */
export function getHowToSchema({ name, description, steps, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: name,
    description: description,
    image: image,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
}

/**
 * Format page title with template
 */
export function formatTitle(title) {
  if (!title) return SEO_DEFAULTS.defaultTitle;
  
  const maxLength = SEO_DEFAULTS.maxTitleLength - SITE_CONFIG.name.length - 3; // " | "
  const truncatedTitle = title.length > maxLength 
    ? title.substring(0, maxLength) + '...' 
    : title;
  
  return SEO_DEFAULTS.titleTemplate.replace('%s', truncatedTitle);
}

/**
 * Truncate description to optimal length
 */
export function formatDescription(description) {
  if (!description) return SEO_DEFAULTS.defaultDescription;
  
  return description.length > SEO_DEFAULTS.maxDescriptionLength
    ? description.substring(0, SEO_DEFAULTS.maxDescriptionLength - 3) + '...'
    : description;
}

/**
 * Generate keywords from tags and category
 */
export function generateKeywords(tags = [], category = null) {
  const baseKeywords = [...SEO_DEFAULTS.defaultKeywords];
  
  if (category) {
    baseKeywords.push(category.toLowerCase());
  }
  
  const tagNames = Array.isArray(tags)
    ? tags.map(tag => (typeof tag === 'string' ? tag : tag.name)).filter(Boolean)
    : [];
  
  return [...new Set([...baseKeywords, ...tagNames])].join(', ');
}

/**
 * Validate and format date to ISO 8601
 */
export function formatDate(date) {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Generate breadcrumbs from path
 */
export function generateBreadcrumbs(pathname, title = null) {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
  ];
  
  const parts = pathname.split('/').filter(Boolean);
  
  parts.forEach((part, index) => {
    const path = '/' + parts.slice(0, index + 1).join('/');
    
    // Determine name based on path segment
    let name = part.charAt(0).toUpperCase() + part.slice(1);
    
    if (part === 'articles') {
      name = 'Articles';
    } else if (part === 'category') {
      name = 'Categories';
    } else if (part === 'tag') {
      name = 'Tags';
    } else if (index === parts.length - 1 && title) {
      // Last segment - use provided title if available
      name = title;
    }
    
    breadcrumbs.push({
      name: name.replace(/-/g, ' '),
      url: getCanonicalUrl(path),
    });
  });
  
  return breadcrumbs;
}

/**
 * Validate URL is absolute
 */
export function ensureAbsoluteUrl(url) {
  if (!url) return SITE_CONFIG.url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return getCanonicalUrl(url);
}

/**
 * Get image URL (ensure absolute)
 */
export function getImageUrl(image) {
  if (!image) return SITE_CONFIG.ogImage.url;
  return ensureAbsoluteUrl(image);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SITE_CONFIG,
  SEO_DEFAULTS,
  getOrganizationSchema,
  getWebSiteSchema,
  getArticleSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  getHowToSchema,
  getCanonicalUrl,
  formatTitle,
  formatDescription,
  generateKeywords,
  formatDate,
  generateBreadcrumbs,
  ensureAbsoluteUrl,
  getImageUrl,
};
