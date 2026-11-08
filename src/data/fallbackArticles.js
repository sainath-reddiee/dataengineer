/**
 * Last-resort homepage and archive listing when WordPress is loading, down,
 * or returns no featured/trending posts. Titles come from the same article
 * inventory used for internal linking — no live API required.
 */
import articlesData from './articlesCatalog.js';
import { isExcludedArticleSlug } from './excludedSlugs.js';

const CATEGORY_LABELS = {
  snowflake: 'Snowflake',
  dbt: 'dbt',
  airflow: 'Airflow',
  databricks: 'Databricks',
  sql: 'SQL',
  python: 'Python',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  ai: 'AI',
};

export function getFallbackArticles(limit = 6, offset = 0) {
  const start = Math.max(0, offset);
  const valid = (articlesData || []).filter(
    (article) => article?.slug && article?.title && !isExcludedArticleSlug(article.slug)
  );
  return valid.slice(start, start + Math.max(0, limit)).map((article) => {
    const rawCat = article.categories?.[0] || 'snowflake';
    return {
      id: article.slug,
      slug: article.slug,
      title: article.title,
      category: CATEGORY_LABELS[rawCat.toLowerCase()] || rawCat,
      readTime: '8 min read',
      excerpt: '',
    };
  });
}
