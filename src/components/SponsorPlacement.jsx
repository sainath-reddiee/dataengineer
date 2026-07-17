import React from 'react';
import { trackEvent } from '@/utils/analytics';
import activeSponsors from '@/data/activeSponsors.json';
import { ExternalLink, Sparkles, BookOpen, Layers, ArrowRight } from 'lucide-react';

export default function SponsorPlacement({ category, tags = [], slug, className = '' }) {
  const now = new Date();
  
  // Find an active sponsor matching this category, tag, or slug
  const sponsor = activeSponsors.find(s => {
    if (!s.active) return false;
    // Ensure local timezone matching instead of UTC shifting by appending time constraints
    // Production Note: Verify server-side clock synchronization on host platforms 
    // to ensure date-based delivery triggers precisely on target days.
    const isStarted = now >= new Date(`${s.startDate}T00:00:00`);
    const isNotExpired = now <= new Date(`${s.endDate}T23:59:59`);
    if (!isStarted || !isNotExpired) return false;
    
    // Check targeting rules (if defined)
    if (s.targeting) {
      const { categories = [], tags: sponsorTags = [], slugs = [] } = s.targeting;
      
      // 1. Match by slug
      if (slugs && slug && slugs.includes(slug)) return true;
      
      // 2. Match by category (case-insensitive)
      if (categories && category) {
        const catMatch = categories.some(c => c.toLowerCase() === category.toLowerCase());
        if (catMatch) return true;
      }
      
      // 3. Match by tags (case-insensitive intersection)
      if (sponsorTags && tags && tags.length > 0) {
        const tagMatch = tags.some(t => 
          sponsorTags.some(st => st.toLowerCase() === t.toLowerCase())
        );
        if (tagMatch) return true;
      }
      
      return false;
    }
    
    // If no targeting configuration exists, treat as run-of-site fallback
    return true;
  });

  if (!sponsor) return null;

  const handleSponsorClick = () => {
    trackEvent({
      action: 'sponsor_link_clicked',
      category: 'sponsorship',
      label: `${sponsor.company} - ${category || slug || 'run-of-site'}`
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
          href={sponsor.url}
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
    return (
      <div className={`my-8 p-6 rounded-2xl border-2 border-blue-500/20 bg-slate-900/60 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:border-blue-500/35 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] ${className}`}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center text-blue-300 font-black text-lg shrink-0">
            {sponsor.company.substring(0, 2).toUpperCase()}
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
          href={sponsor.url}
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
        href={sponsor.url}
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
