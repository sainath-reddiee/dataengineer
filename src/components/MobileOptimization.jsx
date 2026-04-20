import { useEffect } from 'react';

// Mobile-specific optimization component
// Uses CSS class toggles on <body> instead of direct DOM mutation.
// Individual image src rewriting has been removed — it caused double downloads
// and bypassed React's rendering. Use CSS or responsive <picture>/<srcset> instead.

const MobileOptimization = () => {
  useEffect(() => {
    let debounceTimer;

    const applyLayout = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        document.body.classList.add('mobile-optimized');
      } else {
        document.body.classList.remove('mobile-optimized');
      }
    };

    // Apply on mount (deferred to avoid blocking FCP)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => applyLayout(), { timeout: 2000 });
    } else {
      setTimeout(applyLayout, 100);
    }

    // Debounced resize handler
    const handleResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyLayout, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default MobileOptimization;
