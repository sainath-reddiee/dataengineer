// src/main.jsx - FIXED VERSION (No immediate loading spinner)
// Trigger deploy 2
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import '@/index.css';
import { initThirdPartyScripts } from '@/utils/scriptLoader';
import { parkSsgArticleFromRoot } from '@/utils/ssgArticle';
import { parkArticleBootstrapFromRoot } from '@/utils/articleBootstrap';

// Note: Font preloading is handled in index.html with proper preload tags
// This avoids duplicate requests and improves FCP

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      console.log('🚀 Performance Metrics:', {
        'Load Time': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
        'DOMContentLoaded': `${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`,
        'First Paint': `${Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)}ms`
      });
    }
  });
}

// Log environment configuration in dev mode only
if (import.meta.env.DEV) {
  console.log('🔧 Development Environment Configuration:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  });
}

// Every visitor, crawler or human, gets the same React render. The SSG HTML
// is parked first so React paints the same article body without a loading
// shell. Never branch on user agent here: serving crawlers a different page
// from humans is cloaking under Google's spam policies.
const initApp = () => {
  const rootEl = document.getElementById('root');
  parkSsgArticleFromRoot(rootEl);
  parkArticleBootstrapFromRoot(rootEl);
  const root = ReactDOM.createRoot(rootEl);

  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );

  // react-loaded class is now set by App.jsx useEffect (fires after actual render)

  // Initialize third-party scripts after app loads
  setTimeout(() => {
    initThirdPartyScripts();
  }, 1000);
};

// Let the static hero paint first (FCP/LCP) then mount on idle so the
// 300 KB app bundle is not on the critical path for the first contentful text.
const bootApp = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
  } else {
    initApp();
  }
};

if (typeof window.requestIdleCallback === 'function') {
  window.requestIdleCallback(bootApp, { timeout: 1200 });
} else {
  bootApp();
}
