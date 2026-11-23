import { useState } from 'react';
import { Link } from 'react-router-dom';
import articles from '@/data/pseo/articles.json';
import { isExcludedArticleSlug } from '@/data/excludedSlugs';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';

/**
 * Front-page index by stack. Titles come from the bundled catalog, so
 * choosing Snowflake does not wait on WordPress and does not repeat the
 * "featured" card grid this page used to render twice.
 */
const STACKS = [
  { slug: 'snowflake', label: 'Snowflake' },
  { slug: 'dbt', label: 'dbt' },
  { slug: 'airflow', label: 'Airflow' },
  { slug: 'sql', label: 'SQL' },
  { slug: 'python', label: 'Python' },
  { slug: 'databricks', label: 'Databricks' },
  { slug: 'aws', label: 'AWS' },
  { slug: 'azure', label: 'Azure' },
];

const PER_STACK = 8;

function buildShelves() {
  const primary = Object.fromEntries(STACKS.map((stack) => [stack.slug, []]));
  const secondary = Object.fromEntries(STACKS.map((stack) => [stack.slug, []]));

  for (const article of articles) {
    if (!article?.slug || !article?.title || isExcludedArticleSlug(article.slug)) continue;
    const cats = (article.categories || []).map((cat) => String(cat).toLowerCase());
    const entry = { slug: article.slug, title: article.title };
    if (primary[cats[0]] && primary[cats[0]].length < PER_STACK) primary[cats[0]].push(entry);
    for (const cat of cats.slice(1)) {
      if (secondary[cat] && secondary[cat].length < PER_STACK) secondary[cat].push(entry);
    }
  }

  return STACKS.map((stack) => {
    const seen = new Set();
    const titles = [];
    for (const entry of [...primary[stack.slug], ...secondary[stack.slug]]) {
      if (seen.has(entry.slug)) continue;
      seen.add(entry.slug);
      titles.push(entry);
      if (titles.length === PER_STACK) break;
    }
    return { ...stack, titles };
  }).filter((stack) => stack.titles.length > 0);
}

const SHELVES = buildShelves();

function stackSlug(label) {
  return String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const StackShelf = ({ categories = [], omitSlugs = [] }) => {
  const [picked, setPicked] = useState(null);
  if (SHELVES.length === 0) return null;

  const fromPage = categories
    .map(stackSlug)
    .find((slug) => SHELVES.some((stack) => stack.slug === slug));
  const activeSlug = SHELVES.some((stack) => stack.slug === picked)
    ? picked
    : fromPage || SHELVES[0].slug;
  const active = SHELVES.find((stack) => stack.slug === activeSlug) || SHELVES[0];
  const hidden = new Set(omitSlugs.filter(Boolean));
  const fresh = active.titles.filter((article) => !hidden.has(article.slug));
  const titles = (fresh.length > 0 ? fresh : active.titles).slice(0, 3);
  const countLabel = ['', 'One', 'Two', 'Three'][titles.length] || String(titles.length);

  return (
    <section aria-labelledby="stack-shelf-heading">
      <div className="mb-6 flex items-end justify-between gap-4 border-t-2 border-ink pt-4">
        <div>
          <h2 id="stack-shelf-heading" className="font-serif text-2xl font-semibold text-ink">The shelves</h2>
          <p className="mt-1 text-sm text-ink-faint">
            {countLabel} {active.label} {titles.length === 1 ? 'piece' : 'pieces'}, then the rest of that stack.
          </p>
        </div>
        <Link
          to={`/category/${active.slug}`}
          className="inline-flex min-h-11 items-center whitespace-nowrap rounded px-1 text-sm font-medium text-rust-600 hover:text-rust-700 hover:underline"
        >
          All {active.label} →
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Article stacks"
        className="-mx-4 flex gap-x-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-x-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {SHELVES.map((stack) => {
          const on = stack.slug === active.slug;
          return (
            <button
              key={stack.slug}
              type="button"
              role="tab"
              id={`shelf-tab-${stack.slug}`}
              aria-selected={on}
              aria-controls="stack-shelf-panel"
              onClick={() => setPicked(stack.slug)}
              className={`min-h-11 shrink-0 border-b-2 px-3 font-mono text-[12px] uppercase tracking-[0.06em] transition-colors ${
                on ? 'border-rust-500 text-ink' : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              {stack.label}
            </button>
          );
        })}
      </div>

      {/* The tab panel is a div that holds the list. role="tabpanel" on the <ul> itself is invalid
          ARIA and removes list semantics from its <li> items. */}
      <div id="stack-shelf-panel" role="tabpanel" aria-labelledby={`shelf-tab-${active.slug}`}>
        <ul className="mt-3 border-b border-paper-500">
          {titles.map((article, index) => (
            <li key={article.slug} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 border-t border-paper-500 py-5">
              <span className="pt-1 font-mono text-[12px] text-ink-faint">0{index + 1}</span>
              <Link
                to={`/articles/${article.slug}`}
                reloadDocument={ADSENSE_REVIEW_MODE}
                className="block font-serif text-[17px] font-semibold leading-snug text-ink hover:text-rust-600"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default StackShelf;
