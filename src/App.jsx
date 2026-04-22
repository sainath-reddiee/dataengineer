// src/App.jsx - FIXED VERSION
import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import MobileOptimization from '@/components/MobileOptimization';
import { trackPageView, trackEvent } from '@/utils/analytics';
import { useApiDebugger } from '@/hooks/useApiDebugger';
import CookieConsent from '@/components/CookieConsent';

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

// PSEO Pages (Programmatic SEO)
const GlossaryHubPage = lazy(() => import('./pages/GlossaryHubPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const ComparisonHubPage = lazy(() => import('./pages/ComparisonHubPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const CheatSheetHubPage = lazy(() => import('./pages/CheatSheetHubPage'));
const CheatSheetPage = lazy(() => import('./pages/CheatSheetPage'));

// Tools (interactive public calculators)
const ToolsHubPage = lazy(() => import('./pages/ToolsHubPage'));
const CostCalculatorPage = lazy(() => import('./pages/CostCalculatorPage'));
const CreditCostPage = lazy(() => import('./pages/CreditCostPage'));
const QueryCostEstimatorPage = lazy(() => import('./pages/QueryCostEstimatorPage'));
const WarehouseSizingPage = lazy(() => import('./pages/WarehouseSizingPage'));
const DatabricksCostPage = lazy(() => import('./pages/DatabricksCostPage'));
const DbtCloudCostPage = lazy(() => import('./pages/DbtCloudCostPage'));
const SqlFormatterPage = lazy(() => import('./pages/SqlFormatterPage'));
const CronBuilderPage = lazy(() => import('./pages/CronBuilderPage'));
const JsonToSqlPage = lazy(() => import('./pages/JsonToSqlPage'));
const CsvToSqlPage = lazy(() => import('./pages/CsvToSqlPage'));
const DbtSchemaGeneratorPage = lazy(() => import('./pages/DbtSchemaGeneratorPage'));
const UnixTimestampPage = lazy(() => import('./pages/UnixTimestampPage'));
const BigQueryCostPage = lazy(() => import('./pages/BigQueryCostPage'));
const WarehouseComparisonCalculatorPage = lazy(() => import('./pages/WarehouseComparisonCalculatorPage'));
const CheatSheetCategoryPage = lazy(() => import('./pages/CheatSheetCategoryPage'));
const InterviewPrepHubPage = lazy(() => import('./pages/InterviewPrepHubPage'));

// Not Found Page
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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
const ContentOptimizerPage = lazy(() => import('./pages/admin/ContentOptimizerPage'));

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

// Combined Route Change Tracker for Analytics + Accessibility
const RouteChangeTracker = ({ onRouteChange }) => {
  const location = useLocation();

  useEffect(() => {
    if (typeof performance !== "undefined" && performance.mark) {
      // Use a fixed mark name and clear previous entries to avoid unbounded growth
      performance.clearMarks('route-change');
      performance.mark('route-change');
    }

    trackPageView(location.pathname + location.search);

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Move focus to main content for keyboard/screen-reader users
    const main = document.getElementById('main-content');
    if (main) {
      main.focus({ preventScroll: true });
    }

    // Announce page change to screen readers after a short delay
    // so the new page title has time to render
    const timer = setTimeout(() => {
      const pageTitle = document.title || 'Page';
      onRouteChange(pageTitle);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
};

function App() {
  const { debugMode } = useApiDebugger();
  const [routeAnnouncement, setRouteAnnouncement] = useState('');

  useEffect(() => {
    // Signal that React has actually mounted and rendered
    document.body.classList.remove('react-loading');
    document.body.classList.add('react-loaded');
    window.dispatchEvent(new Event('react-mounted'));

    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark('app-initialized');
    }

    // Prefetch commonly accessed pages after initial load
    // Delay increased to 4s to avoid network contention on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const prefetchDelay = isMobile ? 5000 : 3000;

    const prefetchTimer = setTimeout(() => {
      import('./pages/AllArticlesPage');
      import('./pages/ArticlePage');

      // ✅ Prefetch popular category pages
      import('./pages/CategoryPage'); // This covers all categories including new ones
    }, prefetchDelay);

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
      <RouteChangeTracker onRouteChange={setRouteAnnouncement} />
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {routeAnnouncement}
      </div>
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
          {/* PSEO Routes */}
          <Route path="glossary" element={
            <Suspense fallback={<LoadingFallback text="Loading Glossary..." />}>
              <GlossaryHubPage />
            </Suspense>
          } />
          <Route path="glossary/:term" element={
            <Suspense fallback={<LoadingFallback text="Loading Term..." />}>
              <GlossaryPage />
            </Suspense>
          } />
          <Route path="compare" element={
            <Suspense fallback={<LoadingFallback text="Loading Comparisons..." />}>
              <ComparisonHubPage />
            </Suspense>
          } />
          <Route path="compare/:slug" element={
            <Suspense fallback={<LoadingFallback text="Loading Comparison..." />}>
              <ComparisonPage />
            </Suspense>
          } />
          <Route path="cheatsheets" element={
            <Suspense fallback={<LoadingFallback text="Loading Cheat Sheets..." />}>
              <CheatSheetHubPage />
            </Suspense>
          } />
          <Route path="cheatsheets/:slug" element={
            <Suspense fallback={<LoadingFallback text="Loading Cheat Sheet..." />}>
              <CheatSheetPage />
            </Suspense>
          } />
          <Route path="tools" element={
            <Suspense fallback={<LoadingFallback text="Loading Tools..." />}>
              <ToolsHubPage />
            </Suspense>
          } />
          <Route path="tools/snowflake-cost-calculator" element={
            <Suspense fallback={<LoadingFallback text="Loading Calculator..." />}>
              <CostCalculatorPage />
            </Suspense>
          } />
          <Route path="tools/snowflake-credit-cost" element={
            <Suspense fallback={<LoadingFallback text="Loading Credit Converter..." />}>
              <CreditCostPage />
            </Suspense>
          } />
          <Route path="tools/snowflake-query-cost-estimator" element={
            <Suspense fallback={<LoadingFallback text="Loading Query Cost Estimator..." />}>
              <QueryCostEstimatorPage />
            </Suspense>
          } />
          <Route path="tools/snowflake-warehouse-sizing" element={
            <Suspense fallback={<LoadingFallback text="Loading Warehouse Sizing..." />}>
              <WarehouseSizingPage />
            </Suspense>
          } />
          <Route path="tools/databricks-cost-calculator" element={
            <Suspense fallback={<LoadingFallback text="Loading Databricks Cost Calculator..." />}>
              <DatabricksCostPage />
            </Suspense>
          } />
          <Route path="tools/dbt-cloud-cost-calculator" element={
            <Suspense fallback={<LoadingFallback text="Loading dbt Cloud Cost Calculator..." />}>
              <DbtCloudCostPage />
            </Suspense>
          } />
          <Route path="tools/sql-formatter" element={
            <Suspense fallback={<LoadingFallback text="Loading SQL Formatter..." />}>
              <SqlFormatterPage />
            </Suspense>
          } />
          <Route path="tools/cron-expression-builder" element={
            <Suspense fallback={<LoadingFallback text="Loading Cron Builder..." />}>
              <CronBuilderPage />
            </Suspense>
          } />
          <Route path="tools/json-to-sql-ddl" element={
            <Suspense fallback={<LoadingFallback text="Loading JSON→SQL DDL..." />}>
              <JsonToSqlPage />
            </Suspense>
          } />
          <Route path="tools/csv-to-sql" element={
            <Suspense fallback={<LoadingFallback text="Loading CSV→SQL..." />}>
              <CsvToSqlPage />
            </Suspense>
          } />
          <Route path="tools/dbt-schema-generator" element={
            <Suspense fallback={<LoadingFallback text="Loading dbt Schema Generator..." />}>
              <DbtSchemaGeneratorPage />
            </Suspense>
          } />
          <Route path="tools/unix-timestamp-converter" element={
            <Suspense fallback={<LoadingFallback text="Loading Unix Timestamp Converter..." />}>
              <UnixTimestampPage />
            </Suspense>
          } />
          <Route path="tools/bigquery-cost-calculator" element={
            <Suspense fallback={<LoadingFallback text="Loading BigQuery Cost Calculator..." />}>
              <BigQueryCostPage />
            </Suspense>
          } />
          <Route path="tools/cloud-data-warehouse-cost-comparison" element={
            <Suspense fallback={<LoadingFallback text="Loading Warehouse Comparison..." />}>
              <WarehouseComparisonCalculatorPage />
            </Suspense>
          } />
          <Route path="cheatsheets/category/:categoryId" element={
            <Suspense fallback={<LoadingFallback text="Loading Category..." />}>
              <CheatSheetCategoryPage />
            </Suspense>
          } />
          <Route path="interview-prep" element={
            <Suspense fallback={<LoadingFallback text="Loading Interview Prep Hub..." />}>
              <InterviewPrepHubPage />
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
          <Route path="*" element={
            <Suspense fallback={<LoadingFallback text="Loading..." />}>
              <NotFoundPage />
            </Suspense>
          } />
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
          <Route path="content-optimizer" element={<Suspense fallback={<LoadingFallback />}><ContentOptimizerPage /></Suspense>} />
        </Route>
      </Routes>
      <Toaster />
      <CookieConsent />
    </ErrorBoundary>
  );
}

export default App;
