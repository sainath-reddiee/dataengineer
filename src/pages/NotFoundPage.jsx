import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

// Curated evergreen landings so a 404 still converts traffic.
const POPULAR_ARTICLES = [
  { href: '/cheatsheets/snowflake-sql',             title: 'Snowflake SQL Cheat Sheet' },
  { href: '/cheatsheets/dbt-commands',              title: 'dbt Commands Cheat Sheet' },
  { href: '/cheatsheets/airflow-essentials',        title: 'Airflow Essentials Cheat Sheet' },
  { href: '/compare/snowflake-vs-databricks',       title: 'Snowflake vs Databricks' },
];

const CATEGORY_CHIPS = [
  { href: '/category/snowflake',   label: 'Snowflake' },
  { href: '/category/dbt',         label: 'dbt' },
  { href: '/category/airflow',     label: 'Airflow' },
  { href: '/category/python',      label: 'Python' },
  { href: '/category/aws',         label: 'AWS' },
  { href: '/category/data-engineering', label: 'Data Engineering' },
  { href: '/cheatsheets',          label: 'All Cheat Sheets' },
  { href: '/compare',              label: 'All Comparisons' },
  { href: '/glossary',             label: 'Glossary' },
];

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/articles?search=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <MetaTags
        title="Page Not Found | DataEngineer Hub"
        description="The page you are looking for does not exist or has been moved. Explore popular cheat sheets, comparisons, and articles."
        noindex={true}
      />
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-4 gradient-text">404</h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            The page you are looking for does not exist or has been moved.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSubmit}
            role="search"
            className="flex items-center gap-2 mx-auto max-w-xl bg-slate-900/60 border border-slate-700/60 rounded-full px-4 py-2 backdrop-blur-sm focus-within:border-blue-400/70"
          >
            <Search className="h-5 w-5 text-gray-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles, cheat sheets, comparisons…"
              aria-label="Search the site"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 py-1"
            />
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-bold px-4 py-1.5"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              to="/"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-full transition-all"
            >
              Go Home
            </Link>
            <Link
              to="/articles"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all"
            >
              Browse Articles
            </Link>
          </div>
        </div>

        {/* Popular articles */}
        <section className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-5 text-center">
            Popular <span className="gradient-text">Reads</span>
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {POPULAR_ARTICLES.map((p) => (
              <li key={p.href}>
                <Link
                  to={p.href}
                  className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-gray-200 hover:border-blue-400/50 hover:bg-slate-800/60 hover:text-white transition-colors"
                >
                  <span className="font-semibold">{p.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Category chips */}
        <section className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-5 text-center">
            Browse by <span className="gradient-text">Topic</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORY_CHIPS.map((c) => (
              <Link
                key={c.href}
                to={c.href}
                className="px-4 py-1.5 rounded-full border border-slate-700/60 bg-slate-800/50 text-sm text-gray-200 hover:border-blue-400/60 hover:bg-slate-800 hover:text-white transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default NotFoundPage;
