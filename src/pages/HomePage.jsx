// src/pages/HomePage.jsx - editorial front page
import React, { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FeaturedToolsRail from '../components/FeaturedToolsRail';
import MetaTags from '../components/SEO/MetaTags';
import LeadStories from '../components/editorial/LeadStories';
import ArticleLedger from '../components/editorial/ArticleLedger';
import { usePosts } from '@/hooks/useWordPress';

const FeaturedPosts = React.lazy(() => import('../components/FeaturedPosts'));
const TrendingPosts = React.lazy(() => import('../components/TrendingPosts'));
const NewsPosts = React.lazy(() => import('../components/NewsPosts'));
const TechCategories = React.lazy(() => import('../components/TechCategories'));
const Newsletter = React.lazy(() => import('../components/Newsletter'));
const AdPlacement = React.lazy(() => import('../components/AdPlacement'));

// Lead story + "Also new" column take the first four; the ledger lists the next eight.
const LEAD_COUNT = 4;
const FRONT_PAGE_COUNT = 12;

// Reserve height so lazy sections do not shift layout while they load.
const SectionSkeleton = ({ height = 'h-32' }) => (
  <div className={`${height} rounded bg-paper-300`} aria-hidden="true" />
);

// Newspaper-style section heading: a ruled line, serif title, optional link.
const SectionHeader = ({ title, note, actionText, actionLink }) => (
  <div className="mb-6 flex items-end justify-between gap-4 border-t-2 border-ink pt-3">
    <div>
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-faint">{note}</p>}
    </div>
    {actionText && actionLink && (
      <Link to={actionLink} className="whitespace-nowrap pb-1 text-sm text-rust-600 hover:text-rust-700">
        {actionText} →
      </Link>
    )}
  </div>
);

// Featured cheat sheets, one per topic.
const FEATURED_SLUGS = [
  'snowflake-interview-questions',
  'snowflake-sql',
  'dbt-commands',
  'airflow-essentials',
  'sql-window-functions',
  'python-for-data-engineers',
  'data-engineering-interview-questions',
  'snowflake-cost-optimization-interview',
];

const CheatSheetList = () => {
  const [data, setData] = useState({ cheatsheets: null, categories: null });

  useEffect(() => {
    let cancelled = false;
    // cheatsheetData is large; load it after first paint.
    import('@/data/cheatsheetData').then((mod) => {
      if (cancelled) return;
      setData({ cheatsheets: mod.cheatsheets, categories: mod.CHEATSHEET_CATEGORIES });
    });
    return () => { cancelled = true; };
  }, []);

  if (!data.cheatsheets) return <SectionSkeleton height="h-48" />;

  const featured = FEATURED_SLUGS
    .map((slug) => data.cheatsheets.find((s) => s.slug === slug))
    .filter(Boolean)
    .slice(0, 8);

  return (
    <ul className="grid gap-x-8 sm:grid-cols-2">
      {featured.map((sheet) => {
        const cat = data.categories.find((c) => c.id === sheet.category);
        return (
          <li key={sheet.slug} className="border-b border-paper-500 py-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {[cat?.name, sheet.difficulty].filter(Boolean).join(' · ')}
            </p>
            <Link to={`/cheatsheets/${sheet.slug}`} className="mt-1 block font-serif text-lg font-semibold text-ink hover:text-rust-600">
              {sheet.title}
            </Link>
            <p className="mt-1 line-clamp-2 text-[15px] text-ink-muted">{sheet.shortDescription}</p>
          </li>
        );
      })}
    </ul>
  );
};

const HomePage = () => {
  const { posts, loading, error } = usePosts({ per_page: FRONT_PAGE_COUNT });
  const ledgerPosts = posts.slice(LEAD_COUNT);

  return (
    <>
      <MetaTags
        title="Data Engineering Tutorials - Snowflake, AWS, Azure, Databricks & More"
        description="Master data engineering with expert tutorials on Snowflake, AWS, Azure, Databricks, Salesforce, SQL, Python, Airflow & dbt. Practical guides for data professionals."
        keywords="data engineering tutorials, snowflake tutorial, aws data engineering, azure data engineering, databricks tutorial, salesforce data cloud, sql optimization, python data engineering, apache airflow, dbt tutorial, lakehouse, delta lake"
        type="website"
      />

      {/* Organization + WebSite JSON-LD is emitted in the static index.html shell
          so Googlebot sees it without JS. Do not duplicate here. */}

      <div className="min-h-screen overflow-x-clip bg-paper text-ink">
        <Hero />

        <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6">
          <LeadStories posts={posts} loading={loading} error={error} />

          {ledgerPosts.length > 0 && (
            <section>
              <SectionHeader title="More from the notebook" actionText="Full archive" actionLink="/articles" />
              <ArticleLedger posts={ledgerPosts} />
            </section>
          )}

          <section>
            <SectionHeader title="Editor's picks" note="The articles readers return to most." actionText="All articles" actionLink="/articles" />
            <Suspense fallback={<SectionSkeleton height="h-40" />}>
              <FeaturedPosts compact />
            </Suspense>
          </section>

          <section>
            <SectionHeader title="Trending this week" />
            <Suspense fallback={<SectionSkeleton height="h-40" />}>
              <TrendingPosts compact />
            </Suspense>
          </section>

          <Suspense fallback={null}>
            <NewsPosts />
          </Suspense>

          <div className="min-h-[8rem]">
            <FeaturedToolsRail />
          </div>

          <section>
            <SectionHeader title="Topics" actionText="Browse the archive" actionLink="/articles" />
            <Suspense fallback={<SectionSkeleton height="h-32" />}>
              <TechCategories compact />
            </Suspense>
          </section>

          <section>
            <SectionHeader title="Cheat sheets" note="One-page references for the commands you look up every week." actionText="All cheat sheets" actionLink="/cheatsheets" />
            <CheatSheetList />
          </section>

          <Suspense fallback={null}>
            <AdPlacement />
          </Suspense>

          <section>
            <SectionHeader title="The weekly letter" note="New articles and one practical tip, once a week. No spam." />
            <Suspense fallback={<SectionSkeleton height="h-20" />}>
              <Newsletter />
            </Suspense>
          </section>
        </div>
      </div>
    </>
  );
};

export default HomePage;
