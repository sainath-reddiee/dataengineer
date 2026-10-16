// src/components/PostCard.jsx - editorial article card
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import { formatStoryDate, plainExcerpt, storyKicker } from './editorial/storyMeta';

/**
 * A plain, magazine-style card: image, topic line, serif headline, short
 * summary, date. No hover lifts, view counters or hashtag chips; the title
 * carries the card. The whole card is one link so the hit area stays large.
 */
const PostCard = ({ post }) => {
  if (!post) return null;

  return (
    <Link
      to={`/articles/${post.slug}`}
      reloadDocument={ADSENSE_REVIEW_MODE}
      className="group flex h-full flex-col"
    >
      {post.image && (
        <div className="mb-4 aspect-[16/9] overflow-hidden rounded-sm border border-paper-500 bg-paper-300">
          <LazyImage
            src={post.image}
            alt=""
            width={400}
            quality={80}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <p className="font-mono text-[11px] uppercase tracking-wide text-rust-600">{storyKicker(post)}</p>
      <h3 className="mt-1.5 font-serif text-xl font-semibold leading-snug text-ink group-hover:text-rust-600">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-muted">
          {plainExcerpt(post.excerpt, 200)}
        </p>
      )}
      {post.date && (
        <time dateTime={post.date} className="mt-auto pt-3 font-mono text-[11px] text-ink-faint">
          {formatStoryDate(post.date)}
        </time>
      )}
    </Link>
  );
};

export default PostCard;
