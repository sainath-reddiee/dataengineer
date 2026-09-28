import { useMemo, useState, useEffect, useRef } from 'react';
import { ExternalLink, BookOpen, Layers, ArrowRight } from 'lucide-react';
import activeSponsors from '@/data/activeSponsors.json';
import {
  buildTrackedDestination,
  pickSponsor,
} from '@/lib/sponsorCampaign';
import { recordSponsorClick, recordSponsorImpression } from '@/utils/sponsorTracking';

const IN_CONTENT_PLACEMENTS = ['resource_reference', 'content'];

function getSponsorContext(category, slug) {
  return category || slug || 'run-of-site';
}

export default function SponsorPlacement({
  category,
  tags = [],
  slug,
  className = '',
  placementFilter = IN_CONTENT_PLACEMENTS,
  relaxTargeting = false,
}) {
  const [logoError, setLogoError] = useState(false);
  const cardRef = useRef(null);

  const normalizedTags = Array.isArray(tags)
    ? tags.map((t) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean)
    : [];
  const tagsKey = normalizedTags.join(',');
  const filterKey = Array.isArray(placementFilter) ? placementFilter.join(',') : String(placementFilter || '');

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

  const sponsor = useMemo(
    () => pickSponsor(allSponsors, {
      category,
      tags: normalizedTags,
      slug,
      placementFilter,
      relaxTargeting,
    }),
    [allSponsors, category, tagsKey, slug, filterKey, relaxTargeting] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    setLogoError(false);
  }, [sponsor?.token]);

  // Count an impression only when the card is actually on screen (50% for 1s).
  useEffect(() => {
    if (!sponsor || !cardRef.current || typeof IntersectionObserver === 'undefined') return undefined;

    const context = getSponsorContext(category, slug);
    let timer = null;
    let recorded = false;
    const node = cardRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5);
        if (visible && !recorded && !timer) {
          timer = window.setTimeout(() => {
            timer = null;
            if (recorded) return;
            recorded = true;
            recordSponsorImpression({
              token: sponsor.token,
              company: sponsor.company,
              placement: sponsor.placement,
              context,
            });
            observer.disconnect();
          }, 1000);
        } else if (!visible && timer) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [category, slug, sponsor]);

  if (!sponsor) return null;

  const sponsorContext = getSponsorContext(category, slug);
  const sponsorHref = buildTrackedDestination(sponsor, sponsorContext);

  const handleSponsorClick = () => {
    recordSponsorClick({
      token: sponsor.token,
      company: sponsor.company,
      placement: sponsor.placement,
      context: sponsorContext,
    });
  };

  if (sponsor.placement === 'resource_reference') {
    return (
      <div
        ref={cardRef}
        className={`my-6 p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-blue-500/20 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5 sm:mt-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Recommended Resource</span>
              <span className="text-[9px] text-gray-500">Sponsored</span>
            </div>
            <h4 className="font-bold text-white text-sm mt-0.5">{sponsor.company}</h4>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{sponsor.notes}</p>
          </div>
        </div>
        <a
          href={sponsorHref}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          onClick={handleSponsorClick}
          onAuxClick={handleSponsorClick}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1 px-4.5 py-2 bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-xs font-semibold transition"
        >
          Explore Link <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  if (sponsor.placement === 'directory') {
    const hasValidLogo = sponsor.logo && !logoError;

    return (
      <div
        ref={cardRef}
        className={`my-8 p-6 rounded-2xl border-2 border-blue-500/20 bg-slate-900/60 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:border-blue-500/35 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/50 flex items-center justify-center text-blue-300 font-black text-lg shrink-0 overflow-hidden">
            {hasValidLogo ? (
              <img
                src={sponsor.logo}
                alt={`${sponsor.company} Logo`}
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain p-2"
                loading="lazy"
              />
            ) : (
              sponsor.company.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">Showcase Partner</span>
            </div>
            <h4 className="font-extrabold text-white text-base mt-2">{sponsor.company}</h4>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-xl">{sponsor.notes}</p>
          </div>
        </div>
        <a
          href={sponsorHref}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          onClick={handleSponsorClick}
          onAuxClick={handleSponsorClick}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/15"
        >
          Try Platform <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`my-8 p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-slate-900/60 to-purple-950/10 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:border-purple-500/35 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Integration Spotlight</span>
            <span className="text-[9px] text-gray-500">Sponsored</span>
          </div>
          <h4 className="font-extrabold text-white text-base mt-1">Co-Authored Guide: {sponsor.company}</h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xl">Learn how to build real-world pipelines and configure integrations using {sponsor.company}. Includes full companion GitHub samples.</p>
        </div>
      </div>
      <a
        href={sponsorHref}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleSponsorClick}
        onAuxClick={handleSponsorClick}
        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition"
      >
        Read Integration Guide &rarr;
      </a>
    </div>
  );
}
