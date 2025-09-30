import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Custom hook for SEO optimizations
export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);

    // Update page view for analytics
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
      });
    }
  }, [location.pathname]);

  return null;
};

// Hook for structured data
export const useStructuredData = (data) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);
};

// Hook for preloading critical resources
export const usePreloadResources = (resources = []) => {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      document.head.appendChild(link);
    });
  }, [resources]);
};