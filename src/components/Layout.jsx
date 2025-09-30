import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MetaTags from '@/components/SEO/MetaTags';

const Layout = () => {
  return (
    <>
      <MetaTags />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
        <Header />
        <div className="pt-16"></div>
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
    </>
  );
};

export default Layout;