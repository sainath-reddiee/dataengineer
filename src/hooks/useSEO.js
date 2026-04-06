import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Custom hook for SEO optimizations
export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    // Note: scroll-to-top is handled in App.jsx route change handler

    // Update page view for analytics
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
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
    const links = [];
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach(link => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, [resources]);
};
