// src/components/Layout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MetaTags from '@/components/SEO/MetaTags';
import ScrollToTop from '@/components/ScrollToTop';

const Layout = () => {
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
        <Header />
        <div className="pt-16"></div>
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