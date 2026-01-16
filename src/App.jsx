// src/App.jsx - FIXED VERSION
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import MobileOptimization from '@/components/MobileOptimization';
import { trackPageView, trackEvent } from '@/utils/analytics';
import { useApiDebugger } from '@/hooks/useApiDebugger';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const TagPage = lazy(() => import('./pages/TagPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AllArticlesPage = lazy(() => import('./pages/AllArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const ApiDebugger = lazy(() => import('./components/ApiDebugger'));
const TagsArchivePage = lazy(() => import('./pages/TagsArchivePage'));
const Certification = lazy(() => import('./pages/Certification'));

// Admin Pages (SEO Toolkit)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const SEODashboard = lazy(() => import('./pages/admin/SEODashboard'));
const ScannerPage = lazy(() => import('./pages/admin/ScannerPage'));
const BulkScanPage = lazy(() => import('./pages/admin/BulkScanPage'));
const ComparePage = lazy(() => import('./pages/admin/ComparePage'));
const SchemaPage = lazy(() => import('./pages/admin/SchemaPage'));
const SerpPreviewPage = lazy(() => import('./pages/admin/SerpPreviewPage'));
const AISuitePage = lazy(() => import('./pages/admin/AISuitePage'));
const ChecklistPage = lazy(() => import('./pages/admin/ChecklistPage'));

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
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Combined Route Change Tracker for Analytics
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`route-${location.pathname}-${Date.now()}`);
    }

    trackPageView(location.pathname + location.search);

    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  return null;
};

function App() {
  const { debugMode } = useApiDebugger();

  useEffect(() => {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark('app-initialized');
    }

    // Prefetch commonly accessed pages after initial load
    const prefetchTimer = setTimeout(() => {
      import('./pages/AllArticlesPage');
      import('./pages/ArticlePage');

      // ✅ Prefetch popular category pages
      import('./pages/CategoryPage'); // This covers all categories including new ones
    }, 2000);

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
          <Route path="tag" element={
            <Suspense fallback={<LoadingFallback text="Loading Tags..." />}>
              <TagsArchivePage />
            </Suspense>
          } />
          <Route path="tag/:tagSlug" element={
            <Suspense fallback={<LoadingFallback text="Loading Tag..." />}>
              <TagPage />
            </Suspense>
          } />
          <Route path="about" element={
            <Suspense fallback={<LoadingFallback text="Loading About..." />}>
              <AboutPage />
            </Suspense>
          } />
          <Route path="certification" element={
            <Suspense fallback={<LoadingFallback text="Loading Certification..." />}>
              <Certification />
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
          <Route path="disclaimer" element={
            <Suspense fallback={<LoadingFallback text="Loading Disclaimer..." />}>
              <DisclaimerPage />
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

        {/* Admin Routes - SEO Toolkit (outside Layout) */}
        <Route path="/admin" element={
          <Suspense fallback={<LoadingFallback text="Loading Dashboard..." />}>
            <AdminLayout />
          </Suspense>
        }>
          <Route index element={<Suspense fallback={<LoadingFallback />}><SEODashboard /></Suspense>} />
          <Route path="scanner" element={<Suspense fallback={<LoadingFallback />}><ScannerPage /></Suspense>} />
          <Route path="bulk" element={<Suspense fallback={<LoadingFallback />}><BulkScanPage /></Suspense>} />
          <Route path="compare" element={<Suspense fallback={<LoadingFallback />}><ComparePage /></Suspense>} />
          <Route path="schema" element={<Suspense fallback={<LoadingFallback />}><SchemaPage /></Suspense>} />
          <Route path="serp" element={<Suspense fallback={<LoadingFallback />}><SerpPreviewPage /></Suspense>} />
          <Route path="ai-suite" element={<Suspense fallback={<LoadingFallback />}><AISuitePage /></Suspense>} />
          <Route path="checklist" element={<Suspense fallback={<LoadingFallback />}><ChecklistPage /></Suspense>} />
        </Route>
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
