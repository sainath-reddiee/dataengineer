// src/utils/imageOptimizer.js
// OPTIMIZED - Reduce image payload from ~400KB to ~50KB per image

/**
 * Optimize WordPress image URL by requesting specific size
 */
export function optimizeWordPressImage(url, options = {}) {
  if (!url || typeof url !== 'string') return url;
  
  const {
    width = 800,
    quality = 80,
    format = 'webp'
  } = options;

  try {
    const urlObj = new URL(url);
    
    // Check if it's a WordPress image
    if (urlObj.hostname.includes('wp.com') || 
        urlObj.hostname.includes('dataengineerhub.blog') ||
        url.includes('wp-content/uploads')) {
      
      // For WordPress.com hosted images
      if (urlObj.hostname.includes('wp.com')) {
        urlObj.searchParams.set('w', width);
        urlObj.searchParams.set('quality', quality);
        if (format === 'webp') {
          urlObj.searchParams.set('format', 'webp');
        }
        return urlObj.toString();
      }
      
      // For self-hosted WordPress (dataengineerhub.blog)
      if (urlObj.hostname.includes('dataengineerhub.blog')) {
        // Use query parameters for on-the-fly resizing
        urlObj.searchParams.set('resize', `${width},${Math.round(width * 0.6)}`);
        urlObj.searchParams.set('quality', quality);
        urlObj.searchParams.set('strip', 'all'); // Remove metadata
        
        return urlObj.toString();
      }
      
      // Fallback: Try to use WordPress image sizes
      const sizeMap = {
        300: 'thumbnail',
        768: 'medium',
        1024: 'large'
      };
      
      const closestSize = Object.keys(sizeMap)
        .map(Number)
        .find(size => size >= width) || 1024;
      
      // Try to construct URL with size suffix
      const optimizedUrl = url.replace(
        /\.(?:jpg|jpeg|png|webp)$/i,
        `-${closestSize}x${closestSize}.$&`
      );
      
      return optimizedUrl;
    }
    
    return url;
  } catch (error) {
    console.warn('Image optimization failed:', error);
    return url;
  }
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(url, sizes = [400, 800, 1200, 1600]) {
  return sizes
    .map(size => {
      const optimized = optimizeWordPressImage(url, { width: size, quality: 80 });
      return `${optimized} ${size}w`;
    })
    .join(', ');
}

/**
 * Get image dimensions from WordPress URL
 */
export function extractImageDimensions(url) {
  const match = url.match(/-(\d+)x(\d+)\./);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10)
    };
  }
  return null;
}

/**
 * Preload critical images
 */
export function preloadImage(url, options = {}) {
  const { as = 'image', fetchpriority = 'high', width = 1200 } = options;
  
  // Check if already preloaded
  const existingLink = document.querySelector(`link[href="${url}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = optimizeWordPressImage(url, { width, quality: 85 });
  link.fetchPriority = fetchpriority;
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export class LazyImageLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );
  }
  
  observe(element) {
    if (!element) return;
    this.observer.observe(element);
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src) {
          img.src = optimizeWordPressImage(src);
          img.removeAttribute('data-src');
          this.observer.unobserve(img);
        }
      }
    });
  }
  
  disconnect() {
    this.observer.disconnect();
  }
}