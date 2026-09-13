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
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          Use a tool in the browser
        </p>
        <h2 id="featured-tools-heading" className="mt-1 text-lg font-bold text-white sm:text-xl">
          Free tools, no signup
        </h2>
      </div>
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 sm:text-sm"
      >
        All tools <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {tools.map((tool) => {
        const Icon = TOOL_ICONS[tool.icon] || Wrench;
        const inner = (
          <>
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20">
              <Icon className="h-5 w-5 text-blue-300" />
            </span>
            <span className="block text-sm font-semibold text-white group-hover:text-blue-300">
              {tool.title}
            </span>
            <span className="mt-1 block text-xs text-slate-400">{tool.tagline}</span>
            <span className="mt-3 inline-flex text-[11px] font-semibold text-blue-300 sm:hidden">
              Open →
            </span>
          </>
        );
        const className =
          'card-3d group w-[78%] shrink-0 snap-start rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:w-auto';
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
