import React, { useEffect } from 'react';

// Mobile-specific optimization component
const MobileOptimization = () => {
  useEffect(() => {
    // Defer optimizations to avoid blocking FCP
    const applyOptimizations = () => {
      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;

      if (isMobile || isSmallScreen) {
        // Apply mobile-specific optimizations
        optimizeForMobile();
      }
    };

    // Run after paint to avoid blocking FCP/LCP
    if ('requestIdleCallback' in window) {
      requestIdleCallback(applyOptimizations, { timeout: 2000 });
    } else {
      // Fallback for Safari
      setTimeout(applyOptimizations, 100);
    }

    // Listen for orientation changes and resize events
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        optimizeForMobile();
      } else {
        optimizeForDesktop();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const optimizeForMobile = () => {
    // Reduce image quality and size for mobile
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.dataset.optimized) {
        // Add loading="lazy" for better performance
        img.loading = 'lazy';
        img.decoding = 'async';

        // Add mobile-specific classes
        img.classList.add('mobile-optimized');
        img.dataset.optimized = 'true';

        // Optimize image URLs if they contain size parameters
        if (img.src && img.src.includes('w=')) {
          const mobileUrl = img.src
            .replace(/w=\d+/g, 'w=400')
            .replace(/h=\d+/g, 'h=300')
            .replace(/quality=\d+/g, 'quality=80');
          img.src = mobileUrl;
        }
      }
    });

    // Disable heavy animations on mobile
    document.body.classList.add('mobile-optimized');

    // Reduce backdrop-filter blur on mobile for better performance
    const elements = document.querySelectorAll('.glass-effect, .blog-card, .tech-card');
    elements.forEach(el => {
      el.style.backdropFilter = 'blur(5px)';
    });

    // Optimize fonts for mobile
    optimizeFontsForMobile();
  };

  const optimizeForDesktop = () => {
    document.body.classList.remove('mobile-optimized');

    // Restore full backdrop-filter blur on desktop
    const elements = document.querySelectorAll('.glass-effect, .blog-card, .tech-card');
    elements.forEach(el => {
      el.style.backdropFilter = '';
    });
  };

  const optimizeFontsForMobile = () => {
    // Ensure fonts are loaded efficiently
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        // Font loading complete
        console.log('✅ Fonts loaded successfully');
      });
    }

    // Self-hosted Inter variable font is already preloaded in index.html
    // No additional font preloading needed
  };

  return null; // This component doesn't render anything
};

export default MobileOptimization;