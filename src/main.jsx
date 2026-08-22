// src/main.jsx - FIXED VERSION (No immediate loading spinner)
// Trigger deploy 2
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import '@/index.css';
import { initThirdPartyScripts } from '@/utils/scriptLoader';
import { isCrawlerUserAgent } from '@/utils/isCrawler';

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

// AdSense reviewers use a normal Chrome UA. createRoot() replaces the
// pre-rendered article HTML inside #root, then Suspense shows a loading
// shell until WordPress returns — which looks like an under-construction
// site. Leave static article HTML in place for crawlers AND for any
// document that already shipped a full .article-body from SSG.
const hasPreRenderedArticle = () => {
  const root = document.getElementById('root');
  return Boolean(root && root.querySelector('.article-body'));
};

const initApp = () => {
  if (isCrawlerUserAgent() || hasPreRenderedArticle()) {
    document.body.classList.remove('react-loading');
    document.body.classList.add('react-loaded');
    return;
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));

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

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
