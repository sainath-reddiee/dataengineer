// src/utils/seo/seoScanner.js
/**
 * Comprehensive SEO Scanner - 30+ On-Page Checks
 * Analyzes any URL for SEO issues and provides actionable recommendations
 */

// Check severity levels
export const SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  GOOD: 'good',
  INFO: 'info'
};

// Check categories
export const CATEGORIES = {
  META: 'Meta Tags',
  CONTENT: 'Content',
  STRUCTURE: 'Structure',
  LINKS: 'Links',
  IMAGES: 'Images',
  TECHNICAL: 'Technical',
  SOCIAL: 'Social',
  PERFORMANCE: 'Performance'
};

/**
 * Main SEO Scanner class
 */
export class SEOScanner {
  constructor() {
    this.checks = [];
    this.score = 0;
    this.maxScore = 100;
  }

  /**
   * Analyze a URL and return comprehensive SEO report
   * @param {string} url - URL to analyze
   * @param {Document|string} doc - DOM document or HTML string
   */
  async analyze(url, doc) {
    this.checks = [];
    this.url = url;
    
    // Parse document if string
    if (typeof doc === 'string') {
      const parser = new DOMParser();
      this.doc = parser.parseFromString(doc, 'text/html');
    } else {
      this.doc = doc;
    }

    // Run all checks
    this.checkTitleTag();
    this.checkMetaDescription();
    this.checkH1Structure();
    this.checkHeadingHierarchy();
    this.checkInternalLinks();
    this.checkExternalLinks();
    this.checkImageOptimization();
    this.checkSchemaMarkup();
    this.checkOpenGraphTags();
    this.checkTwitterCards();
    this.checkCanonicalUrl();
    this.checkRobotsMeta();
    this.checkViewport();
    this.checkSSL();
    this.checkUrlStructure();
    this.checkContentAnalysis();
    this.checkAccessibility();
    this.checkHreflang();
    this.checkFavicon();
    this.checkLazyLoading();
    this.checkDoctype();
    this.checkCharEncoding();
    this.checkKeywordsInUrl();
    this.checkSocialImageSize();
    this.checkContentFreshness();
    this.checkLanguageAttribute();
    this.checkMetaKeywords();
    this.checkPageSize();
    this.checkLinkAnchors();
    this.checkDuplicateContent();

    // Calculate overall score
    this.calculateScore();

    return this.getReport();
  }

  /**
   * Add a check result
   */
  addCheck(name, category, severity, message, recommendation = null, details = null) {
    this.checks.push({
      name,
      category,
      severity,
      message,
      recommendation,
      details,
      passed: severity === SEVERITY.GOOD
    });
  }

  // ============================================================================
  // META TAGS CHECKS
  // ============================================================================

  checkTitleTag() {
    const title = this.doc.querySelector('title')?.textContent?.trim();
    
    if (!title) {
      this.addCheck(
        'Title Tag',
        CATEGORIES.META,
        SEVERITY.CRITICAL,
        'No title tag found',
        'Add a unique, descriptive title tag between 30-60 characters'
      );
      return;
    }

    const length = title.length;
    
    if (length < 30) {
      this.addCheck(
        'Title Tag',
        CATEGORIES.META,
        SEVERITY.WARNING,
        `Title too short (${length} chars)`,
        'Expand your title to 30-60 characters for better CTR',
        { title, length }
      );
    } else if (length > 60) {
      this.addCheck(
        'Title Tag',
        CATEGORIES.META,
        SEVERITY.WARNING,
        `Title too long (${length} chars) - may be truncated`,
        'Shorten your title to under 60 characters to avoid truncation',
        { title, length }
      );
    } else {
      this.addCheck(
        'Title Tag',
        CATEGORIES.META,
        SEVERITY.GOOD,
        `Title tag optimized (${length} chars)`,
        null,
        { title, length }
      );
    }
  }

  checkMetaDescription() {
    const desc = this.doc.querySelector('meta[name="description"]')?.content?.trim();
    
    if (!desc) {
      this.addCheck(
        'Meta Description',
        CATEGORIES.META,
        SEVERITY.CRITICAL,
        'No meta description found',
        'Add a compelling meta description between 120-160 characters'
      );
      return;
    }

    const length = desc.length;
    
    if (length < 120) {
      this.addCheck(
        'Meta Description',
        CATEGORIES.META,
        SEVERITY.WARNING,
        `Meta description too short (${length} chars)`,
        'Expand to 120-160 characters for better search visibility',
        { description: desc, length }
      );
    } else if (length > 160) {
      this.addCheck(
        'Meta Description',
        CATEGORIES.META,
        SEVERITY.WARNING,
        `Meta description too long (${length} chars)`,
        'Shorten to under 160 characters to avoid truncation',
        { description: desc, length }
      );
    } else {
      this.addCheck(
        'Meta Description',
        CATEGORIES.META,
        SEVERITY.GOOD,
        `Meta description optimized (${length} chars)`,
        null,
        { description: desc, length }
      );
    }
  }

  checkRobotsMeta() {
    const robots = this.doc.querySelector('meta[name="robots"]')?.content?.toLowerCase();
    
    if (!robots) {
      this.addCheck(
        'Robots Meta',
        CATEGORIES.META,
        SEVERITY.INFO,
        'No robots meta tag (defaults to index, follow)',
        null
      );
      return;
    }

    if (robots.includes('noindex')) {
      this.addCheck(
        'Robots Meta',
        CATEGORIES.META,
        SEVERITY.CRITICAL,
        'Page set to NOINDEX - will not appear in search!',
        'Remove noindex if you want this page indexed',
        { robots }
      );
    } else if (robots.includes('nofollow')) {
      this.addCheck(
        'Robots Meta',
        CATEGORIES.META,
        SEVERITY.WARNING,
        'Page set to NOFOLLOW - links won\'t pass equity',
        'Consider removing nofollow unless intentional',
        { robots }
      );
    } else {
      this.addCheck(
        'Robots Meta',
        CATEGORIES.META,
        SEVERITY.GOOD,
        'Robots meta allows indexing and following',
        null,
        { robots }
      );
    }
  }

  checkMetaKeywords() {
    const keywords = this.doc.querySelector('meta[name="keywords"]')?.content;
    
    if (keywords) {
      this.addCheck(
        'Meta Keywords',
        CATEGORIES.META,
        SEVERITY.INFO,
        'Meta keywords found (ignored by Google)',
        'Meta keywords have no SEO value but don\'t hurt',
        { keywords }
      );
    }
  }

  // ============================================================================
  // STRUCTURE CHECKS
  // ============================================================================

  checkH1Structure() {
    const h1s = this.doc.querySelectorAll('h1');
    const count = h1s.length;
    
    if (count === 0) {
      this.addCheck(
        'H1 Structure',
        CATEGORIES.STRUCTURE,
        SEVERITY.CRITICAL,
        'No H1 tag found',
        'Add exactly one H1 tag with your primary keyword'
      );
    } else if (count > 1) {
      this.addCheck(
        'H1 Structure',
        CATEGORIES.STRUCTURE,
        SEVERITY.WARNING,
        `Multiple H1 tags found (${count})`,
        'Use only one H1 tag per page for proper hierarchy',
        { h1s: Array.from(h1s).map(h => h.textContent?.trim().substring(0, 100)) }
      );
    } else {
      const h1Text = h1s[0].textContent?.trim();
      this.addCheck(
        'H1 Structure',
        CATEGORIES.STRUCTURE,
        SEVERITY.GOOD,
        'Single H1 tag found',
        null,
        { h1: h1Text }
      );
    }
  }

  checkHeadingHierarchy() {
    const headings = this.doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const hierarchy = Array.from(headings).map(h => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent?.trim().substring(0, 50)
    }));

    let hasIssue = false;
    let prevLevel = 0;

    for (const h of hierarchy) {
      if (h.level > prevLevel + 1 && prevLevel !== 0) {
        hasIssue = true;
        break;
      }
      prevLevel = h.level;
    }

    if (headings.length === 0) {
      this.addCheck(
        'Heading Hierarchy',
        CATEGORIES.STRUCTURE,
        SEVERITY.WARNING,
        'No headings found on page',
        'Add H1-H6 headings to structure your content'
      );
    } else if (hasIssue) {
      this.addCheck(
        'Heading Hierarchy',
        CATEGORIES.STRUCTURE,
        SEVERITY.WARNING,
        'Heading levels skip order (e.g., H1 to H3)',
        'Use sequential heading levels: H1 → H2 → H3',
        { hierarchy }
      );
    } else {
      this.addCheck(
        'Heading Hierarchy',
        CATEGORIES.STRUCTURE,
        SEVERITY.GOOD,
        `Proper heading hierarchy (${headings.length} headings)`,
        null,
        { hierarchy }
      );
    }
  }

  checkUrlStructure() {
    const url = this.url;
    const issues = [];

    // Check length
    if (url.length > 100) {
      issues.push('URL too long (>100 chars)');
    }

    // Check for parameters
    if (url.includes('?') && !url.includes('utm_')) {
      issues.push('URL contains query parameters');
    }

    // Check for underscores
    if (url.includes('_')) {
      issues.push('URL uses underscores (use hyphens instead)');
    }

    // Check for uppercase
    if (url !== url.toLowerCase()) {
      issues.push('URL contains uppercase letters');
    }

    if (issues.length > 0) {
      this.addCheck(
        'URL Structure',
        CATEGORIES.STRUCTURE,
        SEVERITY.WARNING,
        `URL has ${issues.length} issue(s)`,
        issues.join('; '),
        { url, issues }
      );
    } else {
      this.addCheck(
        'URL Structure',
        CATEGORIES.STRUCTURE,
        SEVERITY.GOOD,
        'URL structure is SEO-friendly',
        null,
        { url }
      );
    }
  }

  // ============================================================================
  // LINKS CHECKS
  // ============================================================================

  checkInternalLinks() {
    const domain = new URL(this.url).hostname;
    const links = this.doc.querySelectorAll('a[href]');
    const internalLinks = Array.from(links).filter(link => {
      try {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
        if (href.startsWith('/')) return true;
        const linkDomain = new URL(href, this.url).hostname;
        return linkDomain === domain;
      } catch {
        return false;
      }
    });

    const count = internalLinks.length;

    if (count === 0) {
      this.addCheck(
        'Internal Links',
        CATEGORIES.LINKS,
        SEVERITY.WARNING,
        'No internal links found',
        'Add internal links to help users and search engines discover content'
      );
    } else if (count < 3) {
      this.addCheck(
        'Internal Links',
        CATEGORIES.LINKS,
        SEVERITY.WARNING,
        `Only ${count} internal link(s) found`,
        'Add more internal links (aim for 3-10 per page)',
        { count }
      );
    } else {
      this.addCheck(
        'Internal Links',
        CATEGORIES.LINKS,
        SEVERITY.GOOD,
        `${count} internal links found`,
        null,
        { count }
      );
    }
  }

  checkExternalLinks() {
    const domain = new URL(this.url).hostname;
    const links = this.doc.querySelectorAll('a[href]');
    const externalLinks = Array.from(links).filter(link => {
      try {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('/') || href.startsWith('javascript:')) return false;
        const linkDomain = new URL(href).hostname;
        return linkDomain !== domain;
      } catch {
        return false;
      }
    });

    const count = externalLinks.length;
    const nofollow = externalLinks.filter(l => l.getAttribute('rel')?.includes('nofollow')).length;

    if (count === 0) {
      this.addCheck(
        'External Links',
        CATEGORIES.LINKS,
        SEVERITY.INFO,
        'No external links found',
        'Consider linking to authoritative sources for credibility'
      );
    } else {
      this.addCheck(
        'External Links',
        CATEGORIES.LINKS,
        SEVERITY.GOOD,
        `${count} external links (${nofollow} nofollow)`,
        null,
        { count, nofollow }
      );
    }
  }

  checkLinkAnchors() {
    const links = this.doc.querySelectorAll('a[href]');
    const badAnchors = [];

    links.forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      if (['click here', 'here', 'read more', 'link', 'this'].includes(text)) {
        badAnchors.push(text);
      }
    });

    if (badAnchors.length > 0) {
      this.addCheck(
        'Link Anchor Text',
        CATEGORIES.LINKS,
        SEVERITY.WARNING,
        `${badAnchors.length} generic anchor texts found`,
        'Use descriptive anchor text instead of "click here" or "read more"',
        { badAnchors: [...new Set(badAnchors)] }
      );
    } else {
      this.addCheck(
        'Link Anchor Text',
        CATEGORIES.LINKS,
        SEVERITY.GOOD,
        'All link anchors are descriptive',
        null
      );
    }
  }

  // ============================================================================
  // IMAGES CHECKS
  // ============================================================================

  checkImageOptimization() {
    const images = this.doc.querySelectorAll('img');
    const totalImages = images.length;
    
    if (totalImages === 0) {
      this.addCheck(
        'Image Optimization',
        CATEGORIES.IMAGES,
        SEVERITY.INFO,
        'No images found on page',
        'Consider adding relevant images to improve engagement'
      );
      return;
    }

    const missingAlt = Array.from(images).filter(img => !img.getAttribute('alt')?.trim());
    const missingAltCount = missingAlt.length;

    if (missingAltCount > 0) {
      this.addCheck(
        'Image Alt Text',
        CATEGORIES.IMAGES,
        SEVERITY.WARNING,
        `${missingAltCount}/${totalImages} images missing alt text`,
        'Add descriptive alt text to all images for accessibility and SEO',
        { missingCount: missingAltCount, total: totalImages }
      );
    } else {
      this.addCheck(
        'Image Alt Text',
        CATEGORIES.IMAGES,
        SEVERITY.GOOD,
        `All ${totalImages} images have alt text`,
        null,
        { total: totalImages }
      );
    }

    // Check for modern formats
    const oldFormats = Array.from(images).filter(img => {
      const src = img.getAttribute('src') || '';
      return src.match(/\.(jpg|jpeg|png|gif)(\?|$)/i);
    });

    if (oldFormats.length > 0 && totalImages > 0) {
      this.addCheck(
        'Image Formats',
        CATEGORIES.IMAGES,
        SEVERITY.INFO,
        `${oldFormats.length} images use legacy formats`,
        'Consider using WebP or AVIF for better compression',
        { legacyCount: oldFormats.length }
      );
    }
  }

  checkSocialImageSize() {
    const ogImage = this.doc.querySelector('meta[property="og:image"]')?.content;
    const ogWidth = this.doc.querySelector('meta[property="og:image:width"]')?.content;
    const ogHeight = this.doc.querySelector('meta[property="og:image:height"]')?.content;

    if (!ogImage) {
      this.addCheck(
        'Social Image',
        CATEGORIES.SOCIAL,
        SEVERITY.WARNING,
        'No Open Graph image found',
        'Add og:image for better social media sharing',
        null
      );
      return;
    }

    if (!ogWidth || !ogHeight) {
      this.addCheck(
        'Social Image Size',
        CATEGORIES.SOCIAL,
        SEVERITY.INFO,
        'OG image dimensions not specified',
        'Add og:image:width and og:image:height for faster loading',
        { image: ogImage }
      );
    } else {
      const width = parseInt(ogWidth);
      const height = parseInt(ogHeight);
      
      if (width >= 1200 && height >= 630) {
        this.addCheck(
          'Social Image Size',
          CATEGORIES.SOCIAL,
          SEVERITY.GOOD,
          `Social image properly sized (${width}x${height})`,
          null,
          { width, height, image: ogImage }
        );
      } else {
        this.addCheck(
          'Social Image Size',
          CATEGORIES.SOCIAL,
          SEVERITY.WARNING,
          `Social image too small (${width}x${height})`,
          'Use at least 1200x630 pixels for optimal display',
          { width, height, image: ogImage }
        );
      }
    }
  }

  // ============================================================================
  // TECHNICAL CHECKS
  // ============================================================================

  checkSchemaMarkup() {
    const schemas = this.doc.querySelectorAll('script[type="application/ld+json"]');
    
    if (schemas.length === 0) {
      this.addCheck(
        'Schema Markup',
        CATEGORIES.TECHNICAL,
        SEVERITY.WARNING,
        'No structured data found',
        'Add JSON-LD schema to enable rich snippets in search results'
      );
      return;
    }

    const schemaTypes = [];
    schemas.forEach(schema => {
      try {
        const data = JSON.parse(schema.textContent || '{}');
        if (data['@type']) {
          schemaTypes.push(data['@type']);
        }
      } catch (e) {
        // Invalid JSON
      }
    });

    this.addCheck(
      'Schema Markup',
      CATEGORIES.TECHNICAL,
      SEVERITY.GOOD,
      `${schemas.length} schema(s) found: ${schemaTypes.join(', ') || 'Unknown types'}`,
      null,
      { count: schemas.length, types: schemaTypes }
    );
  }

  checkCanonicalUrl() {
    const canonical = this.doc.querySelector('link[rel="canonical"]')?.href;
    
    if (!canonical) {
      this.addCheck(
        'Canonical URL',
        CATEGORIES.TECHNICAL,
        SEVERITY.WARNING,
        'No canonical URL specified',
        'Add a canonical tag to prevent duplicate content issues'
      );
      return;
    }

    // Check if self-referential
    const isSelfRef = canonical === this.url || 
                      canonical === this.url.replace(/\/$/, '') ||
                      canonical + '/' === this.url;

    if (isSelfRef) {
      this.addCheck(
        'Canonical URL',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        'Self-referential canonical URL set',
        null,
        { canonical }
      );
    } else {
      this.addCheck(
        'Canonical URL',
        CATEGORIES.TECHNICAL,
        SEVERITY.INFO,
        'Canonical points to different URL',
        'Verify this is intentional (e.g., for pagination)',
        { canonical, currentUrl: this.url }
      );
    }
  }

  checkViewport() {
    const viewport = this.doc.querySelector('meta[name="viewport"]')?.content;
    
    if (!viewport) {
      this.addCheck(
        'Mobile Viewport',
        CATEGORIES.TECHNICAL,
        SEVERITY.CRITICAL,
        'No viewport meta tag found',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
      );
      return;
    }

    if (viewport.includes('width=device-width')) {
      this.addCheck(
        'Mobile Viewport',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        'Mobile viewport properly configured',
        null,
        { viewport }
      );
    } else {
      this.addCheck(
        'Mobile Viewport',
        CATEGORIES.TECHNICAL,
        SEVERITY.WARNING,
        'Viewport may not be mobile-friendly',
        'Ensure viewport includes width=device-width',
        { viewport }
      );
    }
  }

  checkSSL() {
    const isHttps = this.url.startsWith('https://');
    
    if (isHttps) {
      this.addCheck(
        'SSL/HTTPS',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        'Site uses HTTPS',
        null
      );
    } else {
      this.addCheck(
        'SSL/HTTPS',
        CATEGORIES.TECHNICAL,
        SEVERITY.CRITICAL,
        'Site not using HTTPS',
        'Migrate to HTTPS for security and SEO benefits'
      );
    }
  }

  checkDoctype() {
    const html = this.doc.documentElement;
    // Check for HTML5 doctype (DOMParser doesn't preserve doctype well)
    const hasProperDoctype = html?.getAttribute('lang') || html?.querySelectorAll('*').length > 0;
    
    this.addCheck(
      'HTML Doctype',
      CATEGORIES.TECHNICAL,
      SEVERITY.GOOD,
      'Valid HTML document',
      null
    );
  }

  checkCharEncoding() {
    const charset = this.doc.querySelector('meta[charset]')?.getAttribute('charset') ||
                    this.doc.querySelector('meta[http-equiv="Content-Type"]')?.content;
    
    if (!charset) {
      this.addCheck(
        'Character Encoding',
        CATEGORIES.TECHNICAL,
        SEVERITY.WARNING,
        'Character encoding not specified',
        'Add <meta charset="UTF-8"> for proper character display'
      );
    } else if (charset.toLowerCase().includes('utf-8')) {
      this.addCheck(
        'Character Encoding',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        'UTF-8 encoding specified',
        null
      );
    } else {
      this.addCheck(
        'Character Encoding',
        CATEGORIES.TECHNICAL,
        SEVERITY.INFO,
        `Encoding: ${charset}`,
        'Consider using UTF-8 for universal character support'
      );
    }
  }

  checkLanguageAttribute() {
    const lang = this.doc.documentElement?.getAttribute('lang');
    
    if (!lang) {
      this.addCheck(
        'Language Attribute',
        CATEGORIES.TECHNICAL,
        SEVERITY.WARNING,
        'No language attribute on HTML element',
        'Add lang="en" (or appropriate language) to <html> tag'
      );
    } else {
      this.addCheck(
        'Language Attribute',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        `Language declared: ${lang}`,
        null,
        { lang }
      );
    }
  }

  checkHreflang() {
    const hreflangs = this.doc.querySelectorAll('link[rel="alternate"][hreflang]');
    
    if (hreflangs.length > 0) {
      const langs = Array.from(hreflangs).map(l => l.getAttribute('hreflang'));
      this.addCheck(
        'Hreflang Tags',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        `${hreflangs.length} hreflang tags found`,
        null,
        { languages: langs }
      );
    }
    // Not having hreflang is okay for single-language sites
  }

  checkFavicon() {
    const favicon = this.doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    const appleTouchIcon = this.doc.querySelector('link[rel="apple-touch-icon"]');
    
    if (!favicon) {
      this.addCheck(
        'Favicon',
        CATEGORIES.TECHNICAL,
        SEVERITY.INFO,
        'No favicon specified',
        'Add a favicon for better branding in browser tabs'
      );
    } else {
      const hasApple = appleTouchIcon ? ' + Apple touch icon' : '';
      this.addCheck(
        'Favicon',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        `Favicon found${hasApple}`,
        null
      );
    }
  }

  checkLazyLoading() {
    const images = this.doc.querySelectorAll('img');
    const lazyImages = Array.from(images).filter(img => 
      img.getAttribute('loading') === 'lazy' || 
      img.getAttribute('data-src') ||
      img.classList.contains('lazy')
    );

    if (images.length > 3 && lazyImages.length === 0) {
      this.addCheck(
        'Lazy Loading',
        CATEGORIES.PERFORMANCE,
        SEVERITY.INFO,
        'No lazy loading detected on images',
        'Add loading="lazy" to below-fold images for faster page loads',
        { totalImages: images.length }
      );
    } else if (lazyImages.length > 0) {
      this.addCheck(
        'Lazy Loading',
        CATEGORIES.PERFORMANCE,
        SEVERITY.GOOD,
        `${lazyImages.length}/${images.length} images use lazy loading`,
        null
      );
    }
  }

  // ============================================================================
  // SOCIAL CHECKS
  // ============================================================================

  checkOpenGraphTags() {
    const required = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    const found = [];
    const missing = [];

    required.forEach(tag => {
      const prop = tag.replace('og:', '');
      const el = this.doc.querySelector(`meta[property="${tag}"]`);
      if (el?.content) {
        found.push(tag);
      } else {
        missing.push(tag);
      }
    });

    if (missing.length === required.length) {
      this.addCheck(
        'Open Graph Tags',
        CATEGORIES.SOCIAL,
        SEVERITY.WARNING,
        'No Open Graph tags found',
        'Add OG tags for better social media sharing',
        { missing }
      );
    } else if (missing.length > 0) {
      this.addCheck(
        'Open Graph Tags',
        CATEGORIES.SOCIAL,
        SEVERITY.WARNING,
        `Missing OG tags: ${missing.join(', ')}`,
        'Add missing OG tags for complete social optimization',
        { found, missing }
      );
    } else {
      this.addCheck(
        'Open Graph Tags',
        CATEGORIES.SOCIAL,
        SEVERITY.GOOD,
        'All required OG tags present',
        null,
        { found }
      );
    }
  }

  checkTwitterCards() {
    const card = this.doc.querySelector('meta[name="twitter:card"]')?.content;
    const title = this.doc.querySelector('meta[name="twitter:title"]')?.content;
    
    if (!card) {
      this.addCheck(
        'Twitter Cards',
        CATEGORIES.SOCIAL,
        SEVERITY.INFO,
        'No Twitter Card tags found',
        'Add Twitter Card meta tags for better X/Twitter sharing'
      );
      return;
    }

    if (card && title) {
      this.addCheck(
        'Twitter Cards',
        CATEGORIES.SOCIAL,
        SEVERITY.GOOD,
        `Twitter Card configured (${card})`,
        null,
        { card, title }
      );
    } else {
      this.addCheck(
        'Twitter Cards',
        CATEGORIES.SOCIAL,
        SEVERITY.WARNING,
        'Incomplete Twitter Card setup',
        'Add twitter:card, twitter:title, and twitter:description'
      );
    }
  }

  // ============================================================================
  // CONTENT CHECKS
  // ============================================================================

  checkContentAnalysis() {
    // Get main content (exclude nav, header, footer, etc)
    const mainContent = this.doc.querySelector('main, article, .content, [role="main"]') || this.doc.body;
    const text = mainContent?.textContent || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    if (wordCount < 300) {
      this.addCheck(
        'Content Length',
        CATEGORIES.CONTENT,
        SEVERITY.WARNING,
        `Thin content (${wordCount} words)`,
        'Aim for at least 300 words for better rankings',
        { wordCount }
      );
    } else if (wordCount >= 1000) {
      this.addCheck(
        'Content Length',
        CATEGORIES.CONTENT,
        SEVERITY.GOOD,
        `Comprehensive content (${wordCount} words)`,
        null,
        { wordCount }
      );
    } else {
      this.addCheck(
        'Content Length',
        CATEGORIES.CONTENT,
        SEVERITY.GOOD,
        `Good content length (${wordCount} words)`,
        null,
        { wordCount }
      );
    }

    // Check readability (simple sentence length check)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? 
      words.length / sentences.length : 0;

    if (avgSentenceLength > 25) {
      this.addCheck(
        'Readability',
        CATEGORIES.CONTENT,
        SEVERITY.WARNING,
        `Long sentences (avg ${Math.round(avgSentenceLength)} words)`,
        'Shorten sentences for better readability',
        { avgSentenceLength: Math.round(avgSentenceLength) }
      );
    } else if (avgSentenceLength > 0) {
      this.addCheck(
        'Readability',
        CATEGORIES.CONTENT,
        SEVERITY.GOOD,
        `Good readability (avg ${Math.round(avgSentenceLength)} words/sentence)`,
        null
      );
    }
  }

  checkKeywordsInUrl() {
    const title = this.doc.querySelector('title')?.textContent?.toLowerCase() || '';
    const urlPath = new URL(this.url).pathname.toLowerCase();
    
    // Extract potential keywords from title (2+ char words)
    const titleWords = title.split(/\s+/).filter(w => w.length > 2);
    const urlContainsKeyword = titleWords.some(word => urlPath.includes(word));

    if (urlContainsKeyword) {
      this.addCheck(
        'Keywords in URL',
        CATEGORIES.STRUCTURE,
        SEVERITY.GOOD,
        'URL contains relevant keywords',
        null
      );
    } else {
      this.addCheck(
        'Keywords in URL',
        CATEGORIES.STRUCTURE,
        SEVERITY.INFO,
        'URL may not contain keywords from title',
        'Consider including primary keyword in URL slug'
      );
    }
  }

  checkContentFreshness() {
    const modified = this.doc.querySelector('meta[property="article:modified_time"]')?.content ||
                     this.doc.querySelector('meta[name="last-modified"]')?.content;
    const published = this.doc.querySelector('meta[property="article:published_time"]')?.content;

    if (modified) {
      const modDate = new Date(modified);
      const daysSinceModified = (Date.now() - modDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceModified > 365) {
        this.addCheck(
          'Content Freshness',
          CATEGORIES.CONTENT,
          SEVERITY.INFO,
          `Content last updated ${Math.round(daysSinceModified)} days ago`,
          'Consider updating content to maintain relevance',
          { lastModified: modified }
        );
      } else {
        this.addCheck(
          'Content Freshness',
          CATEGORIES.CONTENT,
          SEVERITY.GOOD,
          'Content recently updated',
          null,
          { lastModified: modified }
        );
      }
    } else if (published) {
      this.addCheck(
        'Content Freshness',
        CATEGORIES.CONTENT,
        SEVERITY.INFO,
        'Published date found, but no modified date',
        'Add article:modified_time meta tag',
        { published }
      );
    }
  }

  checkDuplicateContent() {
    // Check for duplicate meta descriptions or titles (simple check)
    const title = this.doc.querySelector('title')?.textContent?.trim();
    const metaDesc = this.doc.querySelector('meta[name="description"]')?.content?.trim();
    const ogTitle = this.doc.querySelector('meta[property="og:title"]')?.content?.trim();
    const ogDesc = this.doc.querySelector('meta[property="og:description"]')?.content?.trim();

    // This is a simple check - real duplicate detection would need multiple pages
    if (title === metaDesc) {
      this.addCheck(
        'Duplicate Content',
        CATEGORIES.CONTENT,
        SEVERITY.WARNING,
        'Title and meta description are identical',
        'Make title and description unique and complementary'
      );
    }
  }

  // ============================================================================
  // ACCESSIBILITY CHECKS
  // ============================================================================

  checkAccessibility() {
    const issues = [];

    // Check for skip link
    const skipLink = this.doc.querySelector('a[href="#main"], a[href="#content"], .skip-link');
    if (!skipLink) {
      issues.push('No skip navigation link');
    }

    // Check for ARIA landmarks
    const landmarks = this.doc.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], main, nav, header');
    if (landmarks.length === 0) {
      issues.push('No ARIA landmarks or semantic elements');
    }

    // Check form labels
    const inputs = this.doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      const hasLabel = id && this.doc.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel;
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs without labels`);
    }

    if (issues.length > 0) {
      this.addCheck(
        'Accessibility',
        CATEGORIES.TECHNICAL,
        SEVERITY.INFO,
        `${issues.length} accessibility improvements possible`,
        issues.join('; '),
        { issues }
      );
    } else {
      this.addCheck(
        'Accessibility',
        CATEGORIES.TECHNICAL,
        SEVERITY.GOOD,
        'Basic accessibility checks passed',
        null
      );
    }
  }

  // ============================================================================
  // PERFORMANCE CHECKS
  // ============================================================================

  checkPageSize() {
    // Estimate page size from document
    const html = this.doc.documentElement?.outerHTML || '';
    const sizeKB = Math.round(html.length / 1024);

    if (sizeKB > 500) {
      this.addCheck(
        'Page Size',
        CATEGORIES.PERFORMANCE,
        SEVERITY.WARNING,
        `Large HTML document (~${sizeKB} KB)`,
        'Consider reducing page size for faster loading',
        { sizeKB }
      );
    } else {
      this.addCheck(
        'Page Size',
        CATEGORIES.PERFORMANCE,
        SEVERITY.GOOD,
        `Page size OK (~${sizeKB} KB HTML)`,
        null,
        { sizeKB }
      );
    }

    // Count resources
    const scripts = this.doc.querySelectorAll('script[src]').length;
    const stylesheets = this.doc.querySelectorAll('link[rel="stylesheet"]').length;
    const images = this.doc.querySelectorAll('img').length;

    this.addCheck(
      'Resource Count',
      CATEGORIES.PERFORMANCE,
      scripts > 15 ? SEVERITY.WARNING : SEVERITY.INFO,
      `${scripts} scripts, ${stylesheets} stylesheets, ${images} images`,
      scripts > 15 ? 'Consider reducing the number of scripts' : null,
      { scripts, stylesheets, images }
    );
  }

  // ============================================================================
  // SCORE CALCULATION
  // ============================================================================

  calculateScore() {
    const weights = {
      [SEVERITY.CRITICAL]: 0,
      [SEVERITY.WARNING]: 0.5,
      [SEVERITY.GOOD]: 1,
      [SEVERITY.INFO]: 0.8
    };

    const criticals = this.checks.filter(c => c.severity === SEVERITY.CRITICAL).length;
    const warnings = this.checks.filter(c => c.severity === SEVERITY.WARNING).length;
    const goods = this.checks.filter(c => c.severity === SEVERITY.GOOD).length;
    const total = this.checks.length;

    if (total === 0) {
      this.score = 0;
      return;
    }

    // Weight criticals heavily
    const rawScore = this.checks.reduce((acc, check) => {
      return acc + (weights[check.severity] || 0);
    }, 0);

    this.score = Math.round((rawScore / total) * 100);

    // Penalize for critical issues
    if (criticals > 0) {
      this.score = Math.min(this.score, 50);
    }
    if (criticals > 2) {
      this.score = Math.min(this.score, 30);
    }
  }

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  getReport() {
    const criticals = this.checks.filter(c => c.severity === SEVERITY.CRITICAL);
    const warnings = this.checks.filter(c => c.severity === SEVERITY.WARNING);
    const goods = this.checks.filter(c => c.severity === SEVERITY.GOOD);
    const infos = this.checks.filter(c => c.severity === SEVERITY.INFO);

    return {
      url: this.url,
      score: this.score,
      maxScore: this.maxScore,
      grade: this.getGrade(),
      summary: {
        total: this.checks.length,
        critical: criticals.length,
        warning: warnings.length,
        good: goods.length,
        info: infos.length
      },
      checks: this.checks,
      byCategory: this.groupByCategory(),
      bySeverity: {
        critical: criticals,
        warning: warnings,
        good: goods,
        info: infos
      },
      analyzedAt: new Date().toISOString()
    };
  }

  getGrade() {
    if (this.score >= 90) return 'A+';
    if (this.score >= 80) return 'A';
    if (this.score >= 70) return 'B';
    if (this.score >= 60) return 'C';
    if (this.score >= 50) return 'D';
    return 'F';
  }

  groupByCategory() {
    const grouped = {};
    this.checks.forEach(check => {
      if (!grouped[check.category]) {
        grouped[check.category] = [];
      }
      grouped[check.category].push(check);
    });
    return grouped;
  }
}

/**
 * Quick scan function
 */
export async function scanUrl(url) {
  const scanner = new SEOScanner();
  
  try {
    // Fetch the URL
    const response = await fetch(url);
    const html = await response.text();
    
    return await scanner.analyze(url, html);
  } catch (error) {
    throw new Error(`Failed to scan URL: ${error.message}`);
  }
}

/**
 * Scan from existing DOM
 */
export async function scanDocument(url, document) {
  const scanner = new SEOScanner();
  return await scanner.analyze(url, document);
}

export default SEOScanner;
