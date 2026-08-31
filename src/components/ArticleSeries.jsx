import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { getSeriesArticles } from '@/utils/articleSeries';

const ArticleSeries = ({ slug, category }) => {
  const articles = getSeriesArticles(slug, category, 4);
  if (articles.length === 0) return null;

  const topic = category ? `${category} series` : 'related reading';

  return (
    <section
      className="my-10 rounded-xl border border-slate-700/50 bg-slate-900/40 p-6"
      aria-labelledby="article-series-heading"
    >
      <h2 id="article-series-heading" className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-blue-400" />
        Continue the {topic}
      </h2>
      <ol className="space-y-3">
        {articles.map((article, index) => (
          <li key={article.slug}>
            <Link
              to={`/articles/${article.slug}`}
              reloadDocument={ADSENSE_REVIEW_MODE}
              className="flex items-start gap-3 text-sm text-slate-200 hover:text-blue-300"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-200">
                {index + 1}
              </span>
              {article.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default ArticleSeries;
