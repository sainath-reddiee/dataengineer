// src/components/Hero.jsx - editorial masthead (text only, so it paints fast)
import { Link } from 'react-router-dom';
import { useStats } from '@/hooks/useStats';

/**
 * Homepage masthead. A publication states what it covers and who writes it;
 * it does not sell. No gradients, glows or animated scenes: the articles
 * below are the product.
 */
const Hero = () => {
  const { totalArticles, totalCategories, updateFrequency } = useStats();

  return (
    <section className="border-b border-paper-500 px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto max-w-6xl">
        <p className="kicker mb-4">Production notes for data engineers</p>
        <h1 className="mb-5 max-w-4xl font-serif text-[34px] font-semibold leading-[1.1] text-ink sm:text-[46px]">
          Snowflake, dbt and Airflow, written from real incidents rather than vendor docs.
        </h1>
        <p className="mb-6 max-w-2xl text-[17px] leading-relaxed text-ink-body">
          Warehouse bills, broken DAGs and code-review lessons from{' '}
          <Link to="/about" className="text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500">
            Sainath Reddy
          </Link>
          , a working data engineer. Every article follows our{' '}
          <Link to="/editorial-standards" className="text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500">
            editorial standards
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to="/articles"
            className="inline-flex min-h-11 items-center rounded bg-ink px-5 text-[15px] font-medium text-paper transition-colors hover:bg-rust-600"
          >
            Browse all articles
          </Link>
          <Link to="/tools/sql-playground" className="text-[15px] text-ink-soft underline decoration-paper-600 underline-offset-4 hover:text-rust-600">
            Open the SQL playground
          </Link>
          <p className="font-mono text-[12px] text-ink-faint">
            {totalArticles}+ articles · {totalCategories}+ technologies · updated {String(updateFrequency).toLowerCase()}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
