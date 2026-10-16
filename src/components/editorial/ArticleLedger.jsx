import { Link } from 'react-router-dom';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { formatStoryDate, plainExcerpt, storyKicker } from './storyMeta';

/**
 * Dense, scannable article list: topic and read time on the left, serif
 * headline and one-line summary in the middle, date on the right. Built for
 * readers who skim titles, the way engineering blogs index their archives.
 */
const ArticleLedger = ({ posts }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <ol className="divide-y divide-paper-500 border-y border-paper-500">
      {posts.map((post) => (
        <li key={post.id || post.slug} className="grid gap-1 py-5 sm:grid-cols-[9rem_minmax(0,1fr)_6.5rem] sm:gap-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-rust-600 sm:pt-1.5">
            {storyKicker(post)}
          </p>
          <div>
            <Link
              to={`/articles/${post.slug}`}
              reloadDocument={ADSENSE_REVIEW_MODE}
              className="font-serif text-xl font-semibold leading-snug text-ink hover:text-rust-600"
            >
              {post.title}
            </Link>
            {post.excerpt && (
              <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-muted">
                {plainExcerpt(post.excerpt, 180)}
              </p>
            )}
          </div>
          {post.date && (
            <time dateTime={post.date} className="font-mono text-[11px] text-ink-faint sm:pt-1.5 sm:text-right">
              {formatStoryDate(post.date)}
            </time>
          )}
        </li>
      ))}
    </ol>
  );
};

export default ArticleLedger;
