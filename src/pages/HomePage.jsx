// src/pages/HomePage.jsx - editorial front page
import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import MetaTags from '../components/SEO/MetaTags';
import LeadStories from '../components/editorial/LeadStories';
import ArticleLedger from '../components/editorial/ArticleLedger';
import StackShelf from '../components/editorial/StackShelf';
import ContinueReading from '@/components/ContinueReading';
import { usePosts } from '@/hooks/useWordPress';

const Newsletter = React.lazy(() => import('../components/Newsletter'));

// Lead story + "Also new" column take the first four; the ledger lists the next six.
const LEAD_COUNT = 4;
const FRONT_PAGE_COUNT = 10;

// Reserve height so lazy sections do not shift layout while they load.
const SectionSkeleton = ({ height = 'h-32' }) => (
  <div className={`${height} rounded bg-paper-300`} aria-hidden="true" />
);

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

const HomePage = () => {
  const { posts, loading, error } = usePosts({ per_page: FRONT_PAGE_COUNT });
  const ledgerPosts = posts.slice(LEAD_COUNT);
  const keepStaticHero =
    typeof document !== 'undefined' && Boolean(document.getElementById('deh-static-hero'));

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
        {!keepStaticHero && <Hero />}

        <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6">
          <ContinueReading />
          <LeadStories posts={posts} loading={loading} error={error} />
          <StackShelf
            categories={posts.map((post) => post.category)}
            omitSlugs={posts.map((post) => post.slug)}
          />

          {ledgerPosts.length > 0 && (
            <section>
              <SectionHeader title="More from the notebook" actionText="Full archive" actionLink="/articles" />
              <ArticleLedger posts={ledgerPosts} />
            </section>
          )}

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
