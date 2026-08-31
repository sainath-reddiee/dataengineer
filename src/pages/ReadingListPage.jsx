import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { useReadingList } from '@/hooks/useReadingList';
import { getFallbackArticles } from '@/data/fallbackArticles';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';

const ReadingListPage = () => {
  const { items, toggle } = useReadingList();
  const suggestions = getFallbackArticles(6);

  return (
    <>
      <MetaTags
        title="Your reading list"
        description="Articles you saved on DataEngineer Hub to finish later."
        noindex={true}
      />
      <div className="container mx-auto px-6 max-w-3xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-3 gradient-text flex items-center gap-3">
          <Bookmark className="h-8 w-8 text-amber-300" />
          Reading list
        </h1>
        <p className="text-gray-400 mb-8">
          Saved on this browser. Use it to pick up a tutorial without hunting through the archive.
        </p>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 mb-10">
            <p className="text-gray-300 mb-4">
              Nothing saved yet. Open any article and tap <strong>Save for later</strong>.
            </p>
            <Link to="/articles" className="text-blue-400 hover:text-blue-300 font-semibold">
              Browse the article library →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 mb-12">
            {items.map((item) => (
              <li
                key={item.slug}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4"
              >
                <Link
                  to={`/articles/${item.slug}`}
                  reloadDocument={ADSENSE_REVIEW_MODE}
                  className="text-slate-100 hover:text-blue-300 font-medium"
                >
                  {item.title}
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className="shrink-0 text-xs text-gray-400 hover:text-white"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <section aria-labelledby="reading-list-suggestions">
          <h2 id="reading-list-suggestions" className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-400" />
            Start here
          </h2>
          <ul className="space-y-3">
            {suggestions.map((article) => (
              <li key={article.slug}>
                <Link
                  to={`/articles/${article.slug}`}
                  reloadDocument={ADSENSE_REVIEW_MODE}
                  className="text-slate-200 hover:text-blue-300"
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
};

export default ReadingListPage;
