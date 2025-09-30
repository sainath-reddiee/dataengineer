import React, { useEffect } from 'react';

// Mobile-specific optimization component
const MobileOptimization = () => {
  useEffect(() => {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    
    if (isMobile || isSmallScreen) {
      // Apply mobile-specific optimizations
      optimizeForMobile();
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

    // Preload critical font weights for mobile
    const criticalFonts = [
      'Inter-400.woff2',
      'Inter-600.woff2',
      'Inter-700.woff2'
    ];

    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = `https://fonts.gstatic.com/s/inter/v12/${font}`;
      
      if (!document.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
    });
  };

  return null; // This component doesn't render anything
};

export default MobileOptimization;