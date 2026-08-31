import React from 'react';
import { Link } from 'react-router-dom';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { getFallbackArticles } from '@/data/fallbackArticles';

/**
 * Editorial title list used when WordPress listings fail or hang.
 * Full-page navigation in review mode so the SSG article parks
 * before React mounts.
 */
const FallbackArticleList = ({ limit = 6, offset = 0 }) => {
  const articles = getFallbackArticles(limit, offset);
  if (articles.length === 0) return null;

  return (
    <ul className="space-y-3 max-w-3xl mx-auto">
      {articles.map((article) => (
        <li
          key={article.slug}
          className="border-b border-white/5 pb-3 last:border-b-0"
        >
          <Link
            to={`/articles/${article.slug}`}
            reloadDocument={ADSENSE_REVIEW_MODE}
            className="text-base font-medium text-slate-100 hover:text-blue-300 transition-colors"
          >
            {article.title}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default FallbackArticleList;
