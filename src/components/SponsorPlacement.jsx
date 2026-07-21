import { useMemo, useState, useEffect } from 'react';
import { trackEvent } from '@/utils/analytics';
import activeSponsors from '@/data/activeSponsors.json';
import { ExternalLink, BookOpen, Layers, ArrowRight } from 'lucide-react';

function getSponsorContext(category, slug) {
  return category || slug || 'run-of-site';
}

export default function SponsorPlacement({ category, tags = [], slug, className = '' }) {
  const [logoError, setLogoError] = useState(false);

  // Normalize tags: they may be strings or objects with a .name property (WP API)
  const normalizedTags = Array.isArray(tags)
    ? tags.map(t => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean)
    : [];

  // Join tags to create a stable dependency string for memoization
  const tagsKey = normalizedTags.join(',');

  // Find an active sponsor matching this category, tag, or slug
  const sponsor = useMemo(() => {
    const now = new Date();
    
    // Filter active and non-expired sponsors first
    const activeCandidates = activeSponsors.filter(s => {
      if (!s.active) return false;
      const isStarted = now >= new Date(`${s.startDate}T00:00:00`);
      const isNotExpired = now <= new Date(`${s.endDate}T23:59:59`);
      return isStarted && isNotExpired;
    });

    // 1. Search for candidates with SPECIFIC targeting rules first
    const targetedMatch = activeCandidates.find(s => {
      if (!s.targeting) return false;
      const { categories = [], tags: sponsorTags = [], slugs = [] } = s.targeting;
      
      // Match by slug
      if (slugs && slug && slugs.includes(slug)) return true;
      
      // Match by category (case-insensitive)
      if (categories && category && typeof category === 'string') {
        const catMatch = categories.some(c => typeof c === 'string' && c.toLowerCase() === category.toLowerCase());
        if (catMatch) return true;
      }
      
      // Match by tags (case-insensitive intersection)
      if (sponsorTags && normalizedTags.length > 0) {
        return normalizedTags.some(t => 
          sponsorTags.some(st => typeof st === 'string' && st.toLowerCase() === t.toLowerCase())
        );
      }
      
      return false;
    });

    if (targetedMatch) return targetedMatch;

    // 2. If no specific match, find run-of-site fallbacks (sponsors without targeting)
    return activeCandidates.find(s => !s.targeting);
  }, [category, tagsKey, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset logo error flag when sponsor changes
  useEffect(() => {
    setLogoError(false);
  }, [sponsor?.token]);

  // Client-side impression tracking via GA4 (no backend required).
  // No-ops until cookie consent is accepted (trackEvent checks window.gtag).
  useEffect(() => {
    if (!sponsor) return;
    trackEvent({
      action: 'sponsor_impression',
      category: 'sponsorship',
      label: `${sponsor.company} - ${getSponsorContext(category, slug)}`
    });
  }, [category, slug, sponsor, tagsKey]);

  if (!sponsor) return null;

  const sponsorContext = getSponsorContext(category, slug);
  const sponsorHref = sponsor.url;

  const handleSponsorClick = () => {
    trackEvent({
      action: 'sponsor_link_clicked',
      category: 'sponsorship',
      label: `${sponsor.company} - ${sponsorContext}`
    });
  };

  // ─── Render layouts based on sponsor placement package key ───────────────────
  
  // Package 1: Developer Resource Reference (Inline editorial callout)
  if (sponsor.placement === 'resource_reference') {
    return (
      <div className={`my-6 p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-blue-500/20 ${className}`}>
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
          rel="noopener noreferrer"
          onClick={handleSponsorClick}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1 px-4.5 py-2 bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-xs font-semibold transition"
        >
          Explore Link <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Package 2: Ecosystem Showcase (Highlight showcase card)
  if (sponsor.placement === 'directory') {
    const hasValidLogo = sponsor.logo && !logoError;
    
    return (
      <div className={`my-8 p-6 rounded-2xl border-2 border-blue-500/20 bg-slate-900/60 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:border-blue-500/35 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] ${className}`}>
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
          rel="noopener noreferrer"
          onClick={handleSponsorClick}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/15"
        >
          Try Platform <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  // Package 3: Technical Integration Guide (Co-authored tutorial promotion)
  return (
    <div className={`my-8 p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-slate-900/60 to-purple-950/10 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:border-purple-500/35 ${className}`}>
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
        rel="noopener noreferrer"
        onClick={handleSponsorClick}
        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition"
      >
        Read Integration Guide &rarr;
      </a>
    </div>
  );
}
