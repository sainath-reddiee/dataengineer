import { generateSitemap } from 'react-router-sitemap';
import { allArticles } from '@/data/articles';

// Generate dynamic routes for articles
const generateArticleRoutes = () => {
  return allArticles.map(article => ({
    path: `/articles/${article.slug}`,
    lastmod: article.date,
    priority: 0.8,
    changefreq: 'weekly'
  }));
};

// Generate category routes
const generateCategoryRoutes = () => {
  const categories = ['aws', 'snowflake', 'azure', 'sql', 'airflow', 'dbt', 'python', 'analytics'];
  return categories.map(category => ({
    path: `/category/${category}`,
    priority: 0.7,
    changefreq: 'daily'
  }));
};

// Static routes
const staticRoutes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/articles', priority: 0.9, changefreq: 'daily' },
  { path: '/about', priority: 0.6, changefreq: 'monthly' },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' },
  { path: '/newsletter', priority: 0.7, changefreq: 'weekly' },
  { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.3, changefreq: 'yearly' }
];

export const generateSitemapXML = () => {
  const allRoutes = [
    ...staticRoutes,
    ...generateArticleRoutes(),
    ...generateCategoryRoutes()
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(route => `
  <url>
    <loc>https://dataengineerhub.blog${route.path}</loc>
    ${route.lastmod ? `<lastmod>${new Date(route.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <priority>${route.priority}</priority>
    <changefreq>${route.changefreq}</changefreq>
  </url>
`).join('')}
</urlset>`;

  return sitemap;
};

// Generate robots.txt
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

Sitemap: https://dataengineerhub.blog/sitemap.xml

# Block access to admin areas
Disallow: /admin/
Disallow: /wp-admin/
Disallow: /wp-includes/
Disallow: /wp-content/plugins/
Disallow: /wp-content/themes/

# Allow access to CSS and JS files
Allow: /wp-content/themes/*.css
Allow: /wp-content/themes/*.js
Allow: /wp-includes/*.css
Allow: /wp-includes/*.js`;
};