// src/App.jsx - FINAL VERSION with all routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Layout
import MainLayout from '@/components/layout/MainLayout';

// Pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

// Articles
import ArticleList from '@/pages/articles/ArticleList';
import ArticleDetail from '@/pages/articles/ArticleDetail';
import CategoryPage from '@/pages/articles/CategoryPage';
import TagPage from '@/pages/articles/TagPage';

// Certifications
import CertificationHub from '@/pages/certifications/CertificationHub';
import CertificationDetail from '@/pages/certifications/CertificationDetail';
import ResourceTypePage from '@/pages/certifications/ResourceTypePage';
import FlashcardPage from '@/pages/certifications/FlashcardPage';

// Tools & Resources
import Tools from '@/pages/Tools';
import Resources from '@/pages/Resources';

// Error Pages
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Main Layout Routes */}
          <Route element={<MainLayout />}>
            {/* Home */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Articles */}
            <Route path="/articles" element={<ArticleList />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/tag/:slug" element={<TagPage />} />

            {/* Certifications */}
            <Route path="/certifications" element={<CertificationHub />} />
            <Route path="/certifications/:slug" element={<CertificationDetail />} />
            <Route path="/certifications/:slug/flashcards" element={<FlashcardPage />} />
            <Route path="/resource-type/:resourceTypeSlug" element={<ResourceTypePage />} />

            {/* Tools & Resources */}
            <Route path="/tools" element={<Tools />} />
            <Route path="/resources" element={<Resources />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;