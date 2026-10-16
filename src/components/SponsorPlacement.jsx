import { useMemo, useState, useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import activeSponsors from '@/data/activeSponsors.json';
import {
  buildTrackedDestination,
  pickAllSponsors,
  pickSponsor,
} from '@/lib/sponsorCampaign';
import { recordSponsorClick, recordSponsorImpression } from '@/utils/sponsorTracking';

const IN_CONTENT_PLACEMENTS = ['resource_reference', 'content'];

function getSponsorContext(category, slug) {
  return category || slug || 'run-of-site';
}

// Paid placements are labeled "Sponsored". The site's own products are not
// sponsorships, so they say so instead of borrowing the label.
function disclosureLabel(sponsor) {
  return sponsor.ownProduct ? 'From the author' : 'Sponsored';
}

function SponsorCard({ sponsor, context, className }) {
  const [logoError, setLogoError] = useState(false);
  const cardRef = useRef(null);
  const href = buildTrackedDestination(sponsor, context);

  // Count an impression only when the card is actually on screen (50% for 1s).
  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    let timer = null;
    let recorded = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[0]?.isIntersecting && entries[0].intersectionRatio >= 0.5);
        if (visible && !recorded && !timer) {
          timer = window.setTimeout(() => {
            timer = null;
            if (recorded) return;
            recorded = true;
            recordSponsorImpression({ token: sponsor.token, company: sponsor.company, placement: sponsor.placement, context });
            observer.disconnect();
          }, 1000);
        } else if (!visible && timer) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0.5] }
    );
    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [sponsor, context]);

  const handleClick = () => {
    recordSponsorClick({ token: sponsor.token, company: sponsor.company, placement: sponsor.placement, context });
  };

  const isGuide = sponsor.placement === 'content';
  const destination = isGuide && sponsor.guideUrl ? sponsor.guideUrl : href;
  const showLogo = sponsor.placement === 'directory' && sponsor.logo && !logoError;

  return (
    <aside
      ref={cardRef}
      aria-label={`${disclosureLabel(sponsor)}: ${sponsor.company}`}
      className={`my-6 flex flex-col gap-4 rounded-sm border border-paper-500 bg-paper-50 p-5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex min-w-0 items-start gap-4">
        {showLogo && (
          <img
            src={sponsor.logo}
            alt=""
            onError={() => setLogoError(true)}
            className="h-12 w-12 shrink-0 rounded border border-paper-500 bg-paper-50 object-contain p-1.5"
            loading="lazy"
          />
        )}
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
            {disclosureLabel(sponsor)}
            {isGuide ? ' · Integration guide' : ''}
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-ink">{sponsor.company}</p>
          {sponsor.notes && <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{sponsor.notes}</p>}
        </div>
      </div>
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleClick}
        onAuxClick={handleClick}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        {isGuide ? 'Read the guide' : `Visit ${sponsor.company}`}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </aside>
  );
}

export default function SponsorPlacement({
  category,
  tags = [],
  slug,
  className = '',
  placementFilter = IN_CONTENT_PLACEMENTS,
  relaxTargeting = false,
  showAll = false,
}) {
  const normalizedTags = Array.isArray(tags)
    ? tags.map((t) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean)
    : [];
  const tagsKey = normalizedTags.join(',');
  const filterKey = Array.isArray(placementFilter) ? placementFilter.join(',') : String(placementFilter || '');

  // Admin preview: the sponsor manager can stage unsaved campaigns locally.
  // This only changes what that one browser shows.
  const allSponsors = useMemo(() => {
    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem('custom_active_sponsors') : null;
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map();
          activeSponsors.forEach((s) => { if (s?.token) map.set(s.token, s); });
          parsed.forEach((s) => { if (s?.token) map.set(s.token, s); });
          return Array.from(map.values());
        }
      }
    } catch (err) {
      void err;
    }
    return activeSponsors;
  }, []);

  const sponsors = useMemo(() => {
    if (showAll) return pickAllSponsors(allSponsors, { placementFilter });
    const one = pickSponsor(allSponsors, { category, tags: normalizedTags, slug, placementFilter, relaxTargeting });
    return one ? [one] : [];
  }, [allSponsors, category, tagsKey, slug, filterKey, relaxTargeting, showAll]); // eslint-disable-line react-hooks/exhaustive-deps

  if (sponsors.length === 0) return null;
  const context = getSponsorContext(category, slug);

  return (
    <>
      {sponsors.map((sponsor) => (
        <SponsorCard key={sponsor.token || sponsor.company} sponsor={sponsor} context={context} className={className} />
      ))}
    </>
  );
}
