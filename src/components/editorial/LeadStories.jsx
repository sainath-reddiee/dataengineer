import { Link } from 'react-router-dom';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import FallbackArticleList from '@/components/FallbackArticleList';
import { formatStoryDate, plainExcerpt, storyKicker } from './storyMeta';

/**
 * Front-page lead: the newest article set large in the serif, with the next
 * three as an "Also new" column. Reads like a publication's front page
 * instead of a grid of identical image cards.
 */
const LeadStories = ({ posts, loading, error }) => {
  if (loading && posts.length === 0) return <LeadSkeleton />;
  if (posts.length === 0) {
    return error ? <FallbackArticleList limit={4} /> : null;
  }

  const [lead, ...rest] = posts;
  const also = rest.slice(0, 3);

  return (
    <section aria-labelledby="lead-story" className="grid gap-8 border-b border-paper-500 pb-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-10">
      <article>
        <p className="kicker mb-3">Latest · {storyKicker(lead)}</p>
        <h2 id="lead-story" className="mb-4 font-serif text-[28px] font-semibold leading-[1.15] text-ink sm:text-[36px]">
          <Link to={`/articles/${lead.slug}`} reloadDocument={ADSENSE_REVIEW_MODE} className="hover:text-rust-600">
            {lead.title}
          </Link>
        </h2>
        <p className="mb-4 max-w-2xl font-serif text-lg leading-relaxed text-ink-body">
          {plainExcerpt(lead.excerpt, 260)}
        </p>
        <p className="text-sm text-ink-faint">
          By <Link to="/about" className="text-ink-soft underline decoration-paper-600 underline-offset-2 hover:text-rust-600">Sainath Reddy</Link>
          {lead.date && <> · <time dateTime={lead.date}>{formatStoryDate(lead.date)}</time></>}
        </p>
      </article>

      {also.length > 0 && (
        <aside aria-label="Also new" className="md:border-l md:border-paper-500 md:pl-8">
          <p className="kicker mb-4 text-ink-faint">Also new</p>
          <ul className="space-y-5">
            {also.map((post) => (
              <li key={post.id || post.slug}>
                <Link
                  to={`/articles/${post.slug}`}
                  reloadDocument={ADSENSE_REVIEW_MODE}
                  className="block font-serif text-[17px] font-semibold leading-snug text-ink hover:text-rust-600"
                >
                  {post.title}
                </Link>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">{storyKicker(post)}</p>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
};

const LeadSkeleton = () => (
  <div className="grid gap-8 border-b border-paper-500 pb-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" aria-hidden="true">
    <div className="space-y-4">
      <div className="h-3 w-40 rounded bg-paper-400" />
      <div className="h-9 w-full rounded bg-paper-400" />
      <div className="h-9 w-3/4 rounded bg-paper-400" />
      <div className="h-20 w-full rounded bg-paper-300" />
    </div>
    <div className="space-y-5">
      {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded bg-paper-300" />)}
    </div>
  </div>
);

export default LeadStories;
