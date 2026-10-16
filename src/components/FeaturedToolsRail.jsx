import { Link } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import { FEATURED_TOOLS, toolHref } from '@/data/toolsCatalog';
import { TOOL_ICONS } from '@/data/toolIcons';
import { ADSENSE_REVIEW_MODE, isReviewAllowlistedTool } from '@/data/adsenseQualityGate';

const FeaturedToolsRail = () => {
  const tools = ADSENSE_REVIEW_MODE
    ? FEATURED_TOOLS.filter((tool) => isReviewAllowlistedTool(tool.slug))
    : FEATURED_TOOLS;

  return (
  <section aria-labelledby="featured-tools-heading">
    <div className="mb-6 flex items-end justify-between gap-4 border-t-2 border-ink pt-3">
      <div>
        <h2 id="featured-tools-heading" className="font-serif text-2xl font-semibold text-ink">
          Free tools, no signup
        </h2>
        <p className="mt-1 text-sm text-ink-faint">Calculators and a SQL playground that run in your browser.</p>
      </div>
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 whitespace-nowrap pb-1 text-sm text-rust-600 hover:text-rust-700"
      >
        All tools <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {tools.map((tool) => {
        const Icon = TOOL_ICONS[tool.icon] || Wrench;
        const inner = (
          <>
            <Icon className="mb-3 h-5 w-5 text-rust-500" />
            <span className="block font-serif text-lg font-semibold text-ink group-hover:text-rust-600">
              {tool.title}
            </span>
            <span className="mt-1 block text-sm text-ink-muted">{tool.tagline}</span>
            <span className="mt-3 inline-flex font-mono text-[11px] text-rust-600 sm:hidden">
              Open →
            </span>
          </>
        );
        const className =
          'group w-[78%] shrink-0 snap-start rounded-sm border border-paper-500 bg-paper-50 p-5 transition-colors hover:border-paper-600 sm:w-auto';
        return tool.external ? (
          <a key={tool.slug} href={tool.url} className={className}>
            {inner}
          </a>
        ) : (
          <Link key={tool.slug} to={toolHref(tool)} className={className}>
            {inner}
          </Link>
        );
      })}
    </div>
  </section>
  );
};

export default FeaturedToolsRail;
