// src/components/Layout.jsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MetaTags from '@/components/SEO/MetaTags';
import ScrollToTop from '@/components/ScrollToTop';
import AnnouncementBar from '@/components/AnnouncementBar';

const ANNOUNCEMENT_BAR_HEIGHT = 40;
// Keep this key in sync with AnnouncementBar.jsx so Layout can reserve the
// correct paddingTop synchronously on the first render (avoiding CLS).
const ANNOUNCEMENT_STORAGE_KEY = 'announcement_dismissed_snowpro-gen-ai-2026';

const readInitialBarVisible = () => {
  if (typeof window === 'undefined') return false;
  try {
    return !localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
  } catch {
    return false;
  }
};

const Layout = () => {
  const [isBarVisible, setIsBarVisible] = useState(readInitialBarVisible);
  const topOffset = isBarVisible ? ANNOUNCEMENT_BAR_HEIGHT : 0;

  return (
    <>
      <MetaTags />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <AnnouncementBar onVisibilityChange={setIsBarVisible} />
        <Header topOffset={topOffset} />
        <div style={{ paddingTop: 64 + topOffset }}></div>
        {/* The 'relative z-0' classes are the crucial fix here */}
        <main id="main-content" tabIndex={-1} className="flex-grow relative z-0 outline-none">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
        <ScrollToTop />
      </div>
    </>
  );
};

export default Layout;