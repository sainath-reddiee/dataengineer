import articlesData from '../data/pseo/articles.json' with { type: 'json' };

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

/**
 * Same-topic articles from the bundled catalog. Used when WordPress
 * related-posts is slow so "read next" never disappears.
 */
export function getSeriesArticles(currentSlug, category, limit = 4) {
  const slug = normalize(currentSlug);
  const topic = normalize(category);
  const catalog = Array.isArray(articlesData) ? articlesData : [];

  const scored = catalog
    .filter((article) => article.slug && normalize(article.slug) !== slug)
    .map((article) => {
      const categories = (article.categories || []).map(normalize);
      const keywords = (article.keywords || []).map(normalize);
      let score = 0;
      if (topic && categories.includes(topic)) score += 5;
      if (topic && keywords.some((word) => word.includes(topic))) score += 2;
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article }) => ({
      slug: article.slug,
      title: article.title,
    }));

  return scored;
}

export function getNextSeriesArticle(currentSlug, category) {
  return getSeriesArticles(currentSlug, category, 1)[0] || null;
}
