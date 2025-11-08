// src/main.jsx - FIXED VERSION (No immediate loading spinner)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import '@/index.css';
import { initThirdPartyScripts } from '@/utils/scriptLoader';

// Simple minimal loader for Suspense fallback
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '4px solid #60a5fa',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ color: '#93c5fd', fontWeight: '500' }}>Loading...</p>
  </div>
);

// Preload critical font
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
  const preconnectGoogle = document.createElement('link');
  preconnectGoogle.rel = 'preconnect';
  preconnectGoogle.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnectGoogle);

  const preconnectGstatic = document.createElement('link');
  preconnectGstatic.rel = 'preconnect';
  preconnectGstatic.href = 'https://fonts.gstatic.com';
  preconnectGstatic.crossOrigin = 'anonymous';
  document.head.appendChild(preconnectGstatic);

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
  fontLink.media = 'all';
  document.head.appendChild(fontLink);

  preloadFont();
};

// Initialize fonts
loadFonts();

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

// ✅ KEY FIX: Don't render immediately - wait for DOM
const initApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));

  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <React.Suspense fallback={<PageLoader />}>
            <App />
          </React.Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );

  // Mark React as loaded after render
  setTimeout(() => {
    document.body.classList.remove('react-loading');
    document.body.classList.add('react-loaded');
  }, 100);

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
