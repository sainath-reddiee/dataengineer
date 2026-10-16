// src/components/TagsList.jsx - "Filed under" topic line
import { Link } from 'react-router-dom';
import { isIndexableTag } from '@/data/thinTags';

/**
 * Topics as a plain comma-separated line, the way a publication files a
 * story, instead of hashtag pills. Thin or review-held tags render as text.
 */
const TagsList = ({ tags, limit = null, linkless = false }) => {
  if (!tags || tags.length === 0) return null;

  const displayTags = limit ? tags.slice(0, limit) : tags;

  return (
    <p className="text-[15px] leading-relaxed text-ink-muted">
      <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Filed under</span>
      {displayTags.map((tag, index) => (
        <span key={tag.id || tag.slug}>
          {index > 0 && <span className="text-ink-faint">, </span>}
          {linkless || !isIndexableTag(tag) ? (
            <span className="text-ink-soft">{tag.name}</span>
          ) : (
            <Link
              to={`/tag/${tag.slug}`}
              className="text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500"
              aria-label={`View articles tagged with ${tag.name}`}
            >
              {tag.name}
            </Link>
          )}
        </span>
      ))}
      {limit && tags.length > limit && (
        <span className="text-ink-faint">, and {tags.length - limit} more</span>
      )}
    </p>
  );
};

export default TagsList;
