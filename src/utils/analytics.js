// src/utils/analytics.js
// Enhanced Google Analytics 4 Integration

export const GA_MEASUREMENT_ID = 'G-MTMNP6EV9C';

let isInitialized = false;

// Initialize Google Analytics (only once)
export const initGA = () => {
  if (typeof window === 'undefined' || isInitialized) return;
  
  // Check if gtag is already loaded from index.html
  if (typeof window.gtag !== 'undefined') {
    isInitialized = true;
    console.log('✅ Google Analytics already initialized');
    return;
  }

  // Fallback: Load gtag if not already loaded
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We handle this manually
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });

  isInitialized = true;
  console.log('✅ Google Analytics initialized');
};

// Track page views
export const trackPageView = (url) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
  
  console.log('📊 Page view tracked:', url);
};

// Track custom events
export const trackEvent = ({ action, category, label, value }) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Event tracked:', { action, category, label, value });
  }
};

// Track article reads
export const trackArticleRead = (articleTitle, category, readTime) => {
  trackEvent({
    action: 'read_article',
    category: 'engagement',
    label: `${category} - ${articleTitle}`,
    value: readTime,
  });
};

// Track article scroll depth
export const trackScrollDepth = (articleTitle, depth) => {
  trackEvent({
    action: 'scroll_depth',
    category: 'engagement',
    label: articleTitle,
    value: depth,
  });
};

// Track newsletter signups
export const trackNewsletterSignup = (source = 'unknown') => {
  trackEvent({
    action: 'newsletter_signup',
    category: 'conversion',
    label: source,
  });
};

// Track contact form submissions
export const trackContactForm = () => {
  trackEvent({
    action: 'contact_form_submit',
    category: 'conversion',
    label: 'Contact Form',
  });
};

// Track outbound links
export const trackOutboundLink = (url, linkText) => {
  trackEvent({
    action: 'click_outbound',
    category: 'outbound',
    label: `${linkText} - ${url}`,
  });
};

// Track internal link clicks
export const trackInternalLink = (url, linkText) => {
  trackEvent({
    action: 'click_internal',
    category: 'navigation',
    label: `${linkText} - ${url}`,
  });
};

// Track search queries
export const trackSearch = (query, resultsCount) => {
  trackEvent({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultsCount,
  });
};

// Track file downloads
export const trackDownload = (fileName, fileType) => {
  trackEvent({
    action: 'download',
    category: 'engagement',
    label: `${fileType} - ${fileName}`,
  });
};

// Track video interactions
export const trackVideo = (action, videoTitle) => {
  trackEvent({
    action: `video_${action}`,
    category: 'engagement',
    label: videoTitle,
  });
};

// Track errors
export const trackError = (errorMessage, errorLocation) => {
  trackEvent({
    action: 'error',
    category: 'technical',
    label: `${errorLocation}: ${errorMessage}`,
  });
};

// Track performance metrics
export const trackPerformance = (metricName, value) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }

  window.gtag('event', 'timing_complete', {
    name: metricName,
    value: Math.round(value),
    event_category: 'Performance',
  });
};

// Track Core Web Vitals
export const trackWebVitals = ({ name, value, id }) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }

  window.gtag('event', name, {
    event_category: 'Web Vitals',
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    event_label: id,
    non_interaction: true,
  });
};

// Track user engagement time
export const trackEngagementTime = (timeInSeconds) => {
  trackEvent({
    action: 'engagement_time',
    category: 'engagement',
    label: 'Page Engagement',
    value: timeInSeconds,
  });
};

// Track category views
export const trackCategoryView = (categoryName) => {
  trackEvent({
    action: 'view_category',
    category: 'navigation',
    label: categoryName,
  });
};

// Enhanced e-commerce tracking (if you add products/courses)
export const trackPurchase = (transactionId, value, items) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    items: items,
  });
};

// Track social shares
export const trackSocialShare = (platform, url) => {
  trackEvent({
    action: 'share',
    category: 'social',
    label: `${platform} - ${url}`,
  });
};

// Track user timing
export const trackTiming = (category, variable, value, label) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }

  window.gtag('event', 'timing_complete', {
    name: variable,
    value: Math.round(value),
    event_category: category,
    event_label: label,
  });
};

// Initialize on import (safe for SSR)
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGA);
  } else {
    initGA();
  }
}