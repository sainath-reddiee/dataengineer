// src/main.jsx - FIXED VERSION (No immediate loading spinner)
// Trigger deploy 2

// Filter out noisy analytics and debug logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const filterMessage = (msg) => {
  if (typeof msg !== 'string') return false;
  const noisyPrefixes = [
    '🚀 Performance Metrics', '🔧 Development Environment',
    '📊 Page view tracked', '📊 Event tracked', '📡 API Request',
    '📂 Fetching', '⏳ Request already in progress', '🔄 Category/search/tag',
    '📚 Read time calculated', '✅ Transformed post', '✅ Category',
    '✅ [Request', '🧹 [Request', '⚠️ [Request', '🔍 Looking', '📂 [Request',
    '🚀 Initializing third-party', 'Environment:', '🚫 Ads disabled',
    '🔗 Preconnecting', '📊 Loading Google', '📥 Loading script',
    '✅ Script loaded', '✅ Google Analytics', '✅ AdSense', '⏸️ GA',
    '✅ Script already loaded', '🧹 Cache cleared', '📦 Cache hit',
    '🔍 Fetching post', '✅ Post loaded', '🔄 [Request',
    '[GSI_LOGGER]', 'FedCM', 'User declined or dismissed prompt'
  ];
  return noisyPrefixes.some(prefix => msg.includes(prefix));
};

console.log = (...args) => {
  if (filterMessage(args[0])) return;
  originalConsoleLog(...args);
};
console.warn = (...args) => {
  if (filterMessage(args[0])) return;
  originalConsoleWarn(...args);
};
console.error = (...args) => {
  if (filterMessage(args[0])) return;
  originalConsoleError(...args);
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '@/index.css';
import { initThirdPartyScripts } from '@/utils/scriptLoader';
import { isCrawlerUserAgent } from '@/utils/isCrawler';
import { parkSsgArticleFromRoot } from '@/utils/ssgArticle';
import { parkArticleBootstrapFromRoot } from '@/utils/articleBootstrap';

// Note: Font preloading is handled in index.html with proper preload tags
// This avoids duplicate requests and improves FCP

// Performance monitoring
// Log environment configuration in dev mode only

// Policy (site-wide: home, /articles, every /articles/:slug, tools, etc.):
// - Humans and LLM in-app browsers → always React (full UI).
// - AdsBot / Googlebot / other documented crawlers → keep SSG HTML so
//   AdSense still sees the full article-body without a loading shell.
const initApp = () => {
  if (isCrawlerUserAgent()) {
    document.body.classList.remove('react-loading');
    document.body.classList.add('react-loaded');
    return;
  }

  const rootEl = document.getElementById('root');
  parkSsgArticleFromRoot(rootEl);
  parkArticleBootstrapFromRoot(rootEl);
  const root = ReactDOM.createRoot(rootEl);
  const googleClientId = import.meta.env.VITE_GSC_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
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
