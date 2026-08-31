/**
 * Last-resort homepage listing when WordPress is down or returns
 * no featured/trending posts. Titles come from the same article
 * inventory used for internal linking — no live API required.
 */
import articlesData from './pseo/articles.json' with { type: 'json' };

export function getFallbackArticles(limit = 6, offset = 0) {
  const start = Math.max(0, offset);
  return (articlesData || []).slice(start, start + Math.max(0, limit)).map((article) => ({
    slug: article.slug,
    title: article.title,
    category: article.categories?.[0] || 'data-engineering',
  }));
}
