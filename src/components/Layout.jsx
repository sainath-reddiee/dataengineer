// src/components/Layout.jsx

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MetaTags from '@/components/SEO/MetaTags';
import ScrollToTop from '@/components/ScrollToTop';

const Toaster = lazy(() =>
  import('@/components/ui/toaster').then((m) => ({ default: m.Toaster }))
);

const Layout = () => {
  return (
    <>
      <MetaTags />
      <div className="min-h-screen flex flex-col overflow-x-clip bg-paper text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-ink focus:text-paper focus:rounded focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-rust-500"
        >
          Skip to main content
        </a>
        <Header topOffset={0} />
        <div style={{ paddingTop: 64 }}></div>
        <main id="main-content" tabIndex={-1} className="flex-grow relative z-0 outline-none">
          <Outlet />
        </main>
        <Footer />
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
        <ScrollToTop />
      </div>
    </>
  );
};

export default Layout;
