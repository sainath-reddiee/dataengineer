import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import MobileOptimization from '@/components/MobileOptimization';
import { trackPageView, trackEvent } from '@/utils/analytics';
import { useApiDebugger } from '@/components/ApiDebugger';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AllArticlesPage = lazy(() => import('./pages/AllArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));

const LoadingFallback = ({ text = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-purple-400 border-b-transparent rounded-full animate-spin animate-reverse"></div>
      </div>
      <p className="text-blue-300 font-medium text-lg">{text}</p>
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  </div>
);

// Combined Route Change Tracker for Analytics & Ads
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Mark performance timing
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`route-${location.pathname}-${Date.now()}`);
    }

    // Track page view in Google Analytics
    trackPageView(location.pathname + location.search);

    // Refresh Ezoic ads on route change with proper timing
    const refreshAds = () => {
      try {
        if (window.ezstandalone && typeof window.ezstandalone.showAds === 'function') {
          window.ezstandalone.cmd.push(function() {
            window.ezstandalone.showAds();
          });
        }
        if (window.ezoic && typeof window.ezoic.refresh === 'function') {
          window.ezoic.refresh();
        }
      } catch (e) {
        console.error("Ezoic ad refresh error:", e);
      }
    };

    // Delay ad refresh to avoid conflicts with page render
    const adTimeout = setTimeout(() => {
      requestAnimationFrame(refreshAds);
    }, 150);

    // Scroll to top on route change (better UX)
    window.scrollTo({ top: 0, behavior: 'instant' });

    return () => clearTimeout(adTimeout);
  }, [location.pathname, location.search]);

  return null;
};

function App() {
  const { debugMode, ApiDebugger } = useApiDebugger();

  useEffect(() => {
    // Mark app initialization
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark('app-initialized');
    }

    // Prefetch high-traffic pages after initial load
    const prefetchTimer = setTimeout(() => {
      import('./pages/AllArticlesPage');
      import('./pages/ArticlePage');
    }, 2000);

    // Log initial performance metrics
    const logPerformance = () => {
      if (typeof performance !== 'undefined') {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          console.log('⚡ App Performance:', {
            'Total Load': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
            'DOM Ready': Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms',
            'First Paint': performance.getEntriesByType('paint')[0] 
              ? Math.round(performance.getEntriesByType('paint')[0].startTime) + 'ms' 
              : 'N/A'
          });
        }
      }
    };

    // Track app initialization
    trackEvent({
      action: 'app_initialized',
      category: 'performance',
      label: 'App Loaded'
    });

    setTimeout(logPerformance, 1500);

    return () => clearTimeout(prefetchTimer);
  }, []);

  return (
    <ErrorBoundary>
      <MobileOptimization />
      <RouteChangeTracker />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<LoadingFallback text="Loading Home..." />}>
              <HomePage />
            </Suspense>
          } />
          <Route path="articles" element={
            <Suspense fallback={<LoadingFallback text="Loading Articles..." />}>
              <AllArticlesPage />
            </Suspense>
          } />
          <Route path="articles/:slug" element={
            <Suspense fallback={<LoadingFallback text="Loading Article..." />}>
              <ArticlePage />
            </Suspense>
          } />
          <Route path="category/:categoryName" element={
            <Suspense fallback={<LoadingFallback text="Loading Category..." />}>
              <CategoryPage />
            </Suspense>
          } />
          <Route path="about" element={
            <Suspense fallback={<LoadingFallback text="Loading About..." />}>
              <AboutPage />
            </Suspense>
          } />
          <Route path="contact" element={
            <Suspense fallback={<LoadingFallback text="Loading Contact..." />}>
              <ContactPage />
            </Suspense>
          } />
          <Route path="privacy-policy" element={
            <Suspense fallback={<LoadingFallback text="Loading Privacy Policy..." />}>
              <PrivacyPolicyPage />
            </Suspense>
          } />
          <Route path="terms-of-service" element={
            <Suspense fallback={<LoadingFallback text="Loading Terms..." />}>
              <TermsOfServicePage />
            </Suspense>
          } />
          <Route path="newsletter" element={
            <Suspense fallback={<LoadingFallback text="Loading Newsletter..." />}>
              <NewsletterPage />
            </Suspense>
          } />
          {debugMode && (
            <Route path="debug" element={
              <Suspense fallback={<LoadingFallback text="Loading Debug..." />}>
                <ApiDebugger />
              </Suspense>
            } />
          )}
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

const Root = () => (
  <HelmetProvider>
    <App />
    <Toaster />
  </HelmetProvider>
);

export default Root;