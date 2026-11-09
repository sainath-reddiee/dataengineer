import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readReadingPlace } from '@/utils/readingPlace';
import { getReadingList, subscribeReadingList } from '@/utils/readingList';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';

/**
 * Personal front-page slip. Renders only when this browser has an article
 * in progress or something saved. No empty state.
 */
const ContinueReading = () => {
  const [place, setPlace] = useState(null);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setPlace(readReadingPlace());
    setSaved(getReadingList());
    return subscribeReadingList(setSaved);
  }, []);

  const others = saved.filter((item) => item.slug && item.slug !== place?.slug).slice(0, 3);
  if (!place && others.length === 0) return null;

  const href = place?.headingId
    ? `/articles/${place.slug}#${place.headingId}`
    : place
      ? `/articles/${place.slug}`
      : '';
  const where = [place?.stage, place?.heading].filter(Boolean).join(' · ');

  return (
    <aside aria-label="On your desk" className="border-l-2 border-rust-500 pl-4">
      <p className="kicker mb-3">On your desk</p>
      <div className={`grid gap-6 ${place && others.length > 0 ? 'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]' : ''}`}>
        {place && (
          <Link
            to={href}
            reloadDocument={ADSENSE_REVIEW_MODE}
            className="group block"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">Continue</span>
            <span className="mt-1 block font-serif text-xl font-semibold leading-snug text-ink group-hover:text-rust-600">
              {place.title}
            </span>
            {where && (
              <span className="mt-1 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                {where}
              </span>
            )}
          </Link>
        )}

        {others.length > 0 && (
          <div className={place ? 'md:border-l md:border-paper-500 md:pl-6' : ''}>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">Saved for later</p>
            <ul className="mt-2 space-y-2">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={`/articles/${item.slug}`}
                    reloadDocument={ADSENSE_REVIEW_MODE}
                    className="font-serif text-[17px] font-semibold leading-snug text-ink hover:text-rust-600"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/reading-list" className="mt-3 inline-block text-sm text-rust-600 hover:text-rust-700">
              Reading list →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ContinueReading;
