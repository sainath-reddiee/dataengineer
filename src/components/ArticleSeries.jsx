import { Link } from 'react-router-dom';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { getSeriesArticles } from '@/utils/articleSeries';

const ArticleSeries = ({ slug, category }) => {
  const articles = getSeriesArticles(slug, category, 4);
  if (articles.length === 0) return null;

  const topic = category ? `${category} series` : 'this series';

  return (
    <section aria-labelledby="article-series-heading">
      <h2 id="article-series-heading" className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        Continue the {topic}
      </h2>
      <ol className="divide-y divide-paper-500 border-y border-paper-500">
        {articles.map((article, index) => (
          <li key={article.slug}>
            <Link
              to={`/articles/${article.slug}`}
              reloadDocument={ADSENSE_REVIEW_MODE}
              className="flex items-baseline gap-3 py-3 font-serif text-[17px] font-semibold leading-snug text-ink hover:text-rust-600"
            >
              <span className="font-mono text-[11px] font-normal text-ink-faint">
                {String(index + 1).padStart(2, '0')}
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
