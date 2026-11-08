import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readReadingPlace } from '@/utils/readingPlace';

/**
 * One line, and only when this browser has an article in progress.
 * No empty state.
 */
const ContinueReading = () => {
  const [place, setPlace] = useState(null);

  useEffect(() => {
    setPlace(readReadingPlace());
  }, []);

  if (!place) return null;

  const href = place.headingId
    ? `/articles/${place.slug}#${place.headingId}`
    : `/articles/${place.slug}`;
  const where = [place.stage, place.heading].filter(Boolean).join(' ');

  return (
    <p className="mb-8 truncate font-mono text-[12px] uppercase tracking-[0.06em] text-ink-faint">
      <Link to={href} className="text-rust-600 hover:underline">
        Continue
      </Link>
      <span> · {place.title}</span>
      {where && <span> · {where}</span>}
    </p>
  );
};

export default ContinueReading;
