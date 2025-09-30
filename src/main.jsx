import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '@/index.css';

// Lazy load the main App component for better initial bundle size
const App = React.lazy(() => import('@/App'));

// Loading component for better UX
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-300 font-medium">Loading DataEngineer Hub...</p>
    </div>
  </div>
);

// Preload critical fonts
const preloadFont = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2';
  document.head.appendChild(link);
};

// Load fonts efficiently
const loadFonts = () => {
  // Preconnect to font origins
  const preconnectGoogle = document.createElement('link');
  preconnectGoogle.rel = 'preconnect';
  preconnectGoogle.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnectGoogle);

  const preconnectGstatic = document.createElement('link');
  preconnectGstatic.rel = 'preconnect';
  preconnectGstatic.href = 'https://fonts.gstatic.com';
  preconnectGstatic.crossOrigin = 'anonymous';
  document.head.appendChild(preconnectGstatic);

  // Load fonts with display=swap for better performance
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
  fontLink.media = 'all';
  document.head.appendChild(fontLink);

  // Preload critical font weights
  preloadFont();
};

// Initialize font loading
loadFonts();

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
  window.addEventListener('load', () => {
    // Log performance metrics for debugging
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('🚀 Performance Metrics:', {
      'Load Time': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
      'DOMContentLoaded': `${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`,
      'First Paint': `${Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)}ms`
    });
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