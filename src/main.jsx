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
