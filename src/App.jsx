// src/App.jsx - FIXED VERSION
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import MobileOptimization from '@/components/MobileOptimization';
import { trackPageView, trackEvent } from '@/utils/analytics';
import { recordReferralIfAny } from '@/utils/aiReferralTracker';
import { recordEngagementRoute, bootstrapEngagementListeners } from '@/utils/engagementTracker';
import { useApiDebugger } from '@/hooks/useApiDebugger';
import CookieConsent from '@/components/CookieConsent';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
const EditorialStandardsPage = lazy(() => import('./pages/EditorialStandardsPage'));
const ReadingListPage = lazy(() => import('./pages/ReadingListPage'));
const ContributePage = lazy(() => import('./pages/ContributePage'));
const ContributorsPage = lazy(() => import('./pages/ContributorsPage'));
const ContributorProfilePage = lazy(() => import('./pages/ContributorProfilePage'));
// Admin: Contributor Manager
const ContributorManagerPage = lazy(() => import('./pages/admin/ContributorManagerPage'));
const GuestProposalsPage = lazy(() => import('./pages/admin/GuestProposalsPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const ApiDebugger = lazy(() => import('./components/ApiDebugger'));
const TagsArchivePage = lazy(() => import('./pages/TagsArchivePage'));
const Certification = lazy(() => import('./pages/Certification'));
const AdvertisePage = lazy(() => import('./pages/AdvertisePage'));
const SponsorDashboardPage = lazy(() => import('./pages/SponsorDashboardPage'));

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
const SqlPlaygroundPage = lazy(() => import('./pages/SqlPlaygroundPage'));
const FormatConverterPage = lazy(() => import('./pages/FormatConverterPage'));
const WarehouseComparisonCalculatorPage = lazy(() => import('./pages/WarehouseComparisonCalculatorPage'));
const CheatSheetCategoryPage = lazy(() => import('./pages/CheatSheetCategoryPage'));
const InterviewPrepHubPage = lazy(() => import('./pages/InterviewPrepHubPage'));
const PracticeHubPage = lazy(() => import('./pages/PracticeHubPage'));
const PracticeQuizPage = lazy(() => import('./pages/PracticeQuizPage'));
const PracticeTopicPage = lazy(() => import('./pages/PracticeTopicPage'));
const PracticeQuestionPage = lazy(() => import('./pages/PracticeQuestionPage'));

// Not Found Page
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin Pages (SEO Toolkit)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const SEODashboard = lazy(() => import('./pages/admin/SEODashboard'));
const ScannerPage = lazy(() => import('./pages/admin/ScannerPage'));
const BulkScanPage = lazy(() => import('./pages/admin/BulkScanPage'));
const ComparePage = lazy(() => import('./pages/admin/ComparePage'));
const SchemaPage = lazy(() => import('./pages/admin/SchemaPage'));
const SponsorManagerPage = lazy(() => import('./pages/admin/SponsorManagerPage'));
const SerpPreviewPage = lazy(() => import('./pages/admin/SerpPreviewPage'));
const AISuitePage = lazy(() => import('./pages/admin/AISuitePage'));
const ChecklistPage = lazy(() => import('./pages/admin/ChecklistPage'));
const ContentOptimizerPage = lazy(() => import('./pages/admin/ContentOptimizerPage'));
const CtrLabPage = lazy(() => import('./pages/admin/CtrLabPage'));
const ReadabilityPage = lazy(() => import('./pages/admin/ReadabilityPage'));
const InternalLinksPage = lazy(() => import('./pages/admin/InternalLinksPage'));
const FreshnessPage = lazy(() => import('./pages/admin/FreshnessPage'));
const RankDashboardPage = lazy(() => import('./pages/admin/RankDashboardPage'));
const RevenueProjectionPage = lazy(() => import('./pages/admin/RevenueProjectionPage'));
const TopicClustersPage = lazy(() => import('./pages/admin/TopicClustersPage'));
const ContentCalendarPage = lazy(() => import('./pages/admin/ContentCalendarPage'));
const CompetitorGapPage = lazy(() => import('./pages/admin/CompetitorGapPage'));
const SmartLinkingPage = lazy(() => import('./pages/admin/SmartLinkingPage'));
const CTRFixerPage = lazy(() => import('./pages/admin/CTRFixerPage'));
const StrikingDistancePage = lazy(() => import('./pages/admin/StrikingDistancePage'));
const ContentDecayPage = lazy(() => import('./pages/admin/ContentDecayPage'));
const SnippetOptimizerPage = lazy(() => import('./pages/admin/SnippetOptimizerPage'));
const KeywordInjectorPage = lazy(() => import('./pages/admin/KeywordInjectorPage'));
const CannibalizationPage = lazy(() => import('./pages/admin/CannibalizationPage'));
const PAAOptimizerPage = lazy(() => import('./pages/admin/PAAOptimizerPage'));
const ArticleOptimizerPage = lazy(() => import('./pages/admin/ArticleOptimizerPage'));
const KeywordTargetPage = lazy(() => import('./pages/admin/KeywordTargetPage'));
const ArticleFixerPage = lazy(() => import('./pages/admin/ArticleFixerPage'));
const TrendIntelligencePage = lazy(() => import('./pages/admin/TrendIntelligencePage'));
const ArticleWriterPage = lazy(() => import('./pages/admin/ArticleWriterPage'));
const SerpIntelligencePage = lazy(() => import('./pages/admin/SerpIntelligencePage'));
const ActivityHistoryPage = lazy(() => import('./pages/admin/ActivityHistoryPage'));

// Keep this tiny. A full-viewport "Loading Article…" overlay was what
// AdSense snapshots when a lazy chunk is still in flight.
const LoadingFallback = ({ text = "Loading..." }) => (
  <div className="h-1 w-full bg-slate-800 overflow-hidden" role="status" aria-live="polite" aria-label={text}>
    <div className="h-full w-1/3 bg-blue-500 animate-pulse" />
  </div>
);

// Per-route error boundary — catches crashes within individual pages
// so the Layout (nav/footer) stays functional
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    // Detect chunk/module loading failures (happens after deploys with stale cache)
    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                         error?.message?.includes('Loading chunk') ||
                         error?.message?.includes('Loading CSS chunk') ||
                         error?.name === 'ChunkLoadError';
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error:', error, errorInfo);
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }

    // Auto-reload once for chunk errors (stale deployment cache)
    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                         error?.message?.includes('Loading chunk');
    if (isChunkError && !sessionStorage.getItem('chunk_reload_attempted')) {
      sessionStorage.setItem('chunk_reload_attempted', '1');
      window.location.reload();
    }
  }

  handleRetry = () => {
    // For chunk errors, a hard reload is needed to get fresh asset URLs
    if (this.state.isChunkError) {
      sessionStorage.removeItem('chunk_reload_attempted');
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center max-w-lg">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {this.state.isChunkError ? 'New version available' : 'This page ran into a problem'}
            </h2>
            <p className="text-gray-400 mb-6">
              {this.state.isChunkError
                ? 'The site has been updated since your last visit. Click below to load the latest version.'
                : 'Something went wrong loading this page. The rest of the site still works fine.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>
              <Link
                to="/"
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-gray-900/50 rounded-lg p-4 mt-6">
                <summary className="cursor-pointer text-yellow-400 text-sm font-medium">Error details</summary>
                <pre className="text-xs text-gray-300 mt-2 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper: wraps a lazy page in Suspense + per-route error boundary
const SafeRoute = ({ children, fallbackText = "Loading..." }) => {
  const location = useLocation();
  return (
    <RouteErrorBoundary key={location.pathname}>
      <Suspense fallback={<LoadingFallback text={fallbackText} />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
};

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

    // Classify landing as an AI-assistant referral (no-op after first session hit).
    try { recordReferralIfAny(); } catch { /* ignore */ }

    // Record engagement funnel signals (first route = landing, later = second-click).
    try { recordEngagementRoute(); } catch { /* ignore */ }

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

    // Wire engagement listeners (scroll, unload, newsletter). Idempotent.
    try { bootstrapEngagementListeners(); } catch { /* ignore */ }

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

      // ✅ Prefetch Tools hub (frequent nav target, cold chunk causes visible lag)
      import('./pages/ToolsHubPage');
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
          <Route index element={<SafeRoute fallbackText="Loading Home..."><HomePage /></SafeRoute>} />
          <Route path="articles" element={<SafeRoute fallbackText="Loading Articles..."><AllArticlesPage /></SafeRoute>} />
          <Route path="articles/:slug" element={<SafeRoute fallbackText="Loading Article..."><ArticlePage /></SafeRoute>} />
          <Route path="category/:categoryName" element={<SafeRoute fallbackText="Loading Category..."><CategoryPage /></SafeRoute>} />
          <Route path="tag" element={<SafeRoute fallbackText="Loading Tags..."><TagsArchivePage /></SafeRoute>} />
          <Route path="tag/:tagSlug" element={<SafeRoute fallbackText="Loading Tag..."><TagPage /></SafeRoute>} />
          {/* PSEO Routes */}
          <Route path="glossary" element={<SafeRoute fallbackText="Loading Glossary..."><GlossaryHubPage /></SafeRoute>} />
          <Route path="glossary/:term" element={<SafeRoute fallbackText="Loading Term..."><GlossaryPage /></SafeRoute>} />
          <Route path="compare" element={<SafeRoute fallbackText="Loading Comparisons..."><ComparisonHubPage /></SafeRoute>} />
          <Route path="compare/:slug" element={<SafeRoute fallbackText="Loading Comparison..."><ComparisonPage /></SafeRoute>} />
          <Route path="cheatsheets" element={<SafeRoute fallbackText="Loading Cheat Sheets..."><CheatSheetHubPage /></SafeRoute>} />
          <Route path="cheatsheets/:slug" element={<SafeRoute fallbackText="Loading Cheat Sheet..."><CheatSheetPage /></SafeRoute>} />
          <Route path="tools" element={<SafeRoute fallbackText="Loading Tools..."><ToolsHubPage /></SafeRoute>} />
          <Route path="tools/snowflake-cost-calculator" element={<SafeRoute fallbackText="Loading Calculator..."><CostCalculatorPage /></SafeRoute>} />
          <Route path="tools/snowflake-credit-cost" element={<SafeRoute fallbackText="Loading Credit Converter..."><CreditCostPage /></SafeRoute>} />
          <Route path="tools/snowflake-query-cost-estimator" element={<SafeRoute fallbackText="Loading Query Cost Estimator..."><QueryCostEstimatorPage /></SafeRoute>} />
          <Route path="tools/snowflake-warehouse-sizing" element={<SafeRoute fallbackText="Loading Warehouse Sizing..."><WarehouseSizingPage /></SafeRoute>} />
          <Route path="tools/databricks-cost-calculator" element={<SafeRoute fallbackText="Loading Databricks Cost Calculator..."><DatabricksCostPage /></SafeRoute>} />
          <Route path="tools/dbt-cloud-cost-calculator" element={<SafeRoute fallbackText="Loading dbt Cloud Cost Calculator..."><DbtCloudCostPage /></SafeRoute>} />
          <Route path="tools/sql-formatter" element={<SafeRoute fallbackText="Loading SQL Formatter..."><SqlFormatterPage /></SafeRoute>} />
          <Route path="tools/cron-expression-builder" element={<SafeRoute fallbackText="Loading Cron Builder..."><CronBuilderPage /></SafeRoute>} />
          <Route path="tools/json-to-sql-ddl" element={<SafeRoute fallbackText="Loading JSON→SQL DDL..."><JsonToSqlPage /></SafeRoute>} />
          <Route path="tools/csv-to-sql" element={<SafeRoute fallbackText="Loading CSV→SQL..."><CsvToSqlPage /></SafeRoute>} />
          <Route path="tools/dbt-schema-generator" element={<SafeRoute fallbackText="Loading dbt Schema Generator..."><DbtSchemaGeneratorPage /></SafeRoute>} />
          <Route path="tools/unix-timestamp-converter" element={<SafeRoute fallbackText="Loading Unix Timestamp Converter..."><UnixTimestampPage /></SafeRoute>} />
          <Route path="tools/bigquery-cost-calculator" element={<SafeRoute fallbackText="Loading BigQuery Cost Calculator..."><BigQueryCostPage /></SafeRoute>} />
          <Route path="tools/sql-playground" element={<SafeRoute fallbackText="Loading SQL Playground..."><SqlPlaygroundPage /></SafeRoute>} />
          <Route path="tools/json-parquet-avro-converter" element={<SafeRoute fallbackText="Loading Format Converter..."><FormatConverterPage /></SafeRoute>} />
          <Route path="tools/cloud-data-warehouse-cost-comparison" element={<SafeRoute fallbackText="Loading Warehouse Comparison..."><WarehouseComparisonCalculatorPage /></SafeRoute>} />
          <Route path="cheatsheets/category/:categoryId" element={<SafeRoute fallbackText="Loading Category..."><CheatSheetCategoryPage /></SafeRoute>} />
          <Route path="interview-prep" element={<SafeRoute fallbackText="Loading Interview Prep Hub..."><InterviewPrepHubPage /></SafeRoute>} />
          <Route path="practice" element={<SafeRoute fallbackText="Loading Practice Tests..."><PracticeHubPage /></SafeRoute>} />
          <Route path="practice/:slug" element={<SafeRoute fallbackText="Loading Quiz..."><PracticeQuizPage /></SafeRoute>} />
          <Route path="practice/:slug/topics/:topicSlug" element={<SafeRoute fallbackText="Loading Topic..."><PracticeTopicPage /></SafeRoute>} />
          <Route path="practice/:slug/q/:questionSlug" element={<SafeRoute fallbackText="Loading Question..."><PracticeQuestionPage /></SafeRoute>} />
          <Route path="about" element={<SafeRoute fallbackText="Loading About..."><AboutPage /></SafeRoute>} />
          <Route path="certification" element={<SafeRoute fallbackText="Loading Certification..."><Certification /></SafeRoute>} />
          <Route path="contact" element={<SafeRoute fallbackText="Loading Contact..."><ContactPage /></SafeRoute>} />
          <Route path="privacy-policy" element={<SafeRoute fallbackText="Loading Privacy Policy..."><PrivacyPolicyPage /></SafeRoute>} />
          <Route path="cookie-policy" element={<Navigate to="/privacy-policy#cookies" replace />} />
          <Route path="terms-of-service" element={<SafeRoute fallbackText="Loading Terms..."><TermsOfServicePage /></SafeRoute>} />
          <Route path="disclaimer" element={<SafeRoute fallbackText="Loading Disclaimer..."><DisclaimerPage /></SafeRoute>} />
          <Route path="editorial-standards" element={<SafeRoute fallbackText="Loading Editorial Standards..."><EditorialStandardsPage /></SafeRoute>} />
          <Route path="reading-list" element={<SafeRoute fallbackText="Loading Reading List..."><ReadingListPage /></SafeRoute>} />
          <Route path="contribute" element={<SafeRoute fallbackText="Loading..."><ContributePage /></SafeRoute>} />
          <Route path="contributors" element={<SafeRoute fallbackText="Loading Contributors..."><ContributorsPage /></SafeRoute>} />
          <Route path="contributors/:slug" element={<SafeRoute fallbackText="Loading Profile..."><ContributorProfilePage /></SafeRoute>} />
          <Route path="news" element={<SafeRoute fallbackText="Loading News..."><NewsPage /></SafeRoute>} />
          <Route path="newsletter" element={<SafeRoute fallbackText="Loading Newsletter..."><NewsletterPage /></SafeRoute>} />
          <Route path="advertise" element={<SafeRoute fallbackText="Loading Advertise..."><AdvertisePage /></SafeRoute>} />
          <Route path="sponsors/dashboard" element={<SafeRoute fallbackText="Loading Sponsor Dashboard..."><SponsorDashboardPage /></SafeRoute>} />
          {debugMode && (
            <Route path="debug" element={<SafeRoute fallbackText="Loading Debug..."><ApiDebugger /></SafeRoute>} />
          )}
          <Route path="*" element={<SafeRoute fallbackText="Loading..."><NotFoundPage /></SafeRoute>} />
        </Route>

        {/* Admin Routes - SEO Toolkit (outside Layout) */}
        <Route path="/admin" element={
          <Suspense fallback={<LoadingFallback text="Loading Dashboard..." />}>
            <AdminLayout />
          </Suspense>
        }>
          <Route index element={<SafeRoute><SEODashboard /></SafeRoute>} />
          <Route path="sponsors" element={<SafeRoute><SponsorManagerPage /></SafeRoute>} />
          <Route path="scanner" element={<SafeRoute><ScannerPage /></SafeRoute>} />
          <Route path="bulk" element={<SafeRoute><BulkScanPage /></SafeRoute>} />
          <Route path="compare" element={<SafeRoute><ComparePage /></SafeRoute>} />
          <Route path="schema" element={<SafeRoute><SchemaPage /></SafeRoute>} />
          <Route path="serp" element={<SafeRoute><SerpPreviewPage /></SafeRoute>} />
          <Route path="ai-suite" element={<SafeRoute><AISuitePage /></SafeRoute>} />
          <Route path="checklist" element={<SafeRoute><ChecklistPage /></SafeRoute>} />
          <Route path="content-optimizer" element={<SafeRoute><ContentOptimizerPage /></SafeRoute>} />
          <Route path="ctr-lab" element={<SafeRoute><CtrLabPage /></SafeRoute>} />
          <Route path="readability" element={<SafeRoute><ReadabilityPage /></SafeRoute>} />
          <Route path="internal-links" element={<SafeRoute><InternalLinksPage /></SafeRoute>} />
          <Route path="freshness" element={<SafeRoute><FreshnessPage /></SafeRoute>} />
          <Route path="rank-dashboard" element={<SafeRoute><RankDashboardPage /></SafeRoute>} />
          <Route path="revenue" element={<SafeRoute><RevenueProjectionPage /></SafeRoute>} />
          <Route path="topic-clusters" element={<SafeRoute><TopicClustersPage /></SafeRoute>} />
          <Route path="content-calendar" element={<SafeRoute><ContentCalendarPage /></SafeRoute>} />
          <Route path="competitor-gap" element={<SafeRoute><CompetitorGapPage /></SafeRoute>} />
          <Route path="smart-linking" element={<SafeRoute><SmartLinkingPage /></SafeRoute>} />
          <Route path="ctr-fixer" element={<SafeRoute><CTRFixerPage /></SafeRoute>} />
          <Route path="striking-distance" element={<SafeRoute><StrikingDistancePage /></SafeRoute>} />
          <Route path="content-decay" element={<SafeRoute><ContentDecayPage /></SafeRoute>} />
          <Route path="snippet-optimizer" element={<SafeRoute><SnippetOptimizerPage /></SafeRoute>} />
          <Route path="keyword-injector" element={<SafeRoute><KeywordInjectorPage /></SafeRoute>} />
          <Route path="cannibalization" element={<SafeRoute><CannibalizationPage /></SafeRoute>} />
          <Route path="paa-optimizer" element={<SafeRoute><PAAOptimizerPage /></SafeRoute>} />
          <Route path="article-optimizer" element={<SafeRoute><ArticleOptimizerPage /></SafeRoute>} />
                    <Route path="keyword-target" element={<SafeRoute><KeywordTargetPage /></SafeRoute>} />
                    <Route path="article-fixer" element={<SafeRoute><ArticleFixerPage /></SafeRoute>} />
                    <Route path="trend-intelligence" element={<SafeRoute><TrendIntelligencePage /></SafeRoute>} />
                    <Route path="article-writer" element={<SafeRoute><ArticleWriterPage /></SafeRoute>} />
          <Route path="serp-intelligence" element={<SafeRoute><SerpIntelligencePage /></SafeRoute>} />
          <Route path="history" element={<SafeRoute><ActivityHistoryPage /></SafeRoute>} />
          <Route path="contributors" element={<SafeRoute><ContributorManagerPage /></SafeRoute>} />
          <Route path="proposals" element={<SafeRoute><GuestProposalsPage /></SafeRoute>} />
        </Route>
      </Routes>
      <Toaster />
      <CookieConsent />
    </ErrorBoundary>
  );
}

export default App;
