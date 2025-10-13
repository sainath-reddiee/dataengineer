// src/main.jsx - OPTIMIZED FONT LOADING
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '@/index.css';
import { initThirdPartyScripts } from '@/utils/scriptLoader';

const App = React.lazy(() => import('@/App'));

const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-300 font-medium">Loading DataEngineer Hub...</p>
    </div>
  </div>
);

// OPTIMIZED FONT LOADING
const loadFonts = () => {
  // Preconnect to font domains
  const preconnectGoogle = document.createElement('link');
  preconnectGoogle.rel = 'preconnect';
  preconnectGoogle.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnectGoogle);

  const preconnectGstatic = document.createElement('link');
  preconnectGstatic.rel = 'preconnect';
  preconnectGstatic.href = 'https://fonts.gstatic.com';
  preconnectGstatic.crossOrigin = 'anonymous';
  document.head.appendChild(preconnectGstatic);

  // Preload critical font file
  const preloadFont = document.createElement('link');
  preloadFont.rel = 'preload';
  preloadFont.as = 'font';
  preloadFont.type = 'font/woff2';
  preloadFont.crossOrigin = 'anonymous';
  preloadFont.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
  document.head.appendChild(preloadFont);

  // Load font stylesheet with font-display: swap
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
  fontLink.media = 'all';
  document.head.appendChild(fontLink);
};

// Initialize fonts
loadFonts();

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('🚀 Performance Metrics:', {
      'Load Time': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
      'DOMContentLoaded': `${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`,
      'First Paint': `${Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)}ms`
    });
  });
}

// Log environment configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 Development Environment Configuration:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_ADS_ENABLED: import.meta.env.VITE_ADS_ENABLED,
    VITE_ADSENSE_PUBLISHER_ID: import.meta.env.VITE_ADSENSE_PUBLISHER_ID ? 
      import.meta.env.VITE_ADSENSE_PUBLISHER_ID.slice(0, 15) + '...' : 
      '❌ Not Set',
    VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '❌ Not Set'
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// Initialize third-party scripts after app loads
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initThirdPartyScripts();
  }, 1000);
}