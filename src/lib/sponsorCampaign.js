export const ALLOWED_PLACEMENTS = new Set(['directory', 'resource_reference', 'content']);

export function parseCampaignDate(value, endOfDay = false) {
  if (!value) return null;
  const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
  const parsed = Date.parse(`${value}${suffix}`);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getCampaignStatus(sponsor, now = Date.now()) {
  if (!sponsor) return { key: 'unknown', label: 'Unknown' };
  const start = parseCampaignDate(sponsor.startDate, false);
  const end = parseCampaignDate(sponsor.endDate, true);
  // Expired wins over paused so the admin table does not hide a finished term.
  if (end && now > end) return { key: 'expired', label: 'Expired' };
  if (!sponsor.active) return { key: 'paused', label: 'Paused' };
  if (start && now < start) return { key: 'scheduled', label: 'Scheduled' };
  return { key: 'live', label: 'Live' };
}

export function isCampaignLive(sponsor, now = Date.now()) {
  return getCampaignStatus(sponsor, now).key === 'live';
}

export function findSponsorByToken(token, catalog = []) {
  const cleaned = String(token || '').trim();
  if (!cleaned) return null;
  const list = Array.isArray(catalog) ? catalog : [];
  return list.find((item) => item?.token === cleaned) || null;
}

export function getLiveSponsors(catalog = [], now = Date.now()) {
  const list = Array.isArray(catalog) ? catalog : [];
  return list.filter((item) => isCampaignLive(item, now));
}

export function matchesPlacementFilter(sponsor, placementFilter) {
  if (!placementFilter) return true;
  const allowed = Array.isArray(placementFilter) ? placementFilter : [placementFilter];
  return allowed.includes(sponsor?.placement);
}

export function pickSponsor(catalog, {
  category,
  tags = [],
  slug,
  placementFilter,
  now,
  relaxTargeting = false,
} = {}) {
  const normalizedTags = Array.isArray(tags)
    ? tags.map((t) => (typeof t === 'string' ? t : t?.name || '')).filter(Boolean)
    : [];

  const activeCandidates = getLiveSponsors(catalog, now).filter((item) =>
    matchesPlacementFilter(item, placementFilter)
  );

  const targetedMatch = activeCandidates.find((s) => {
    if (!s.targeting) return false;
    const { categories = [], tags: sponsorTags = [], slugs = [] } = s.targeting;

    if (slugs && slug && slugs.includes(slug)) return true;

    if (categories && category && typeof category === 'string') {
      const catMatch = categories.some(
        (c) => typeof c === 'string' && c.toLowerCase() === category.toLowerCase()
      );
      if (catMatch) return true;
    }

    if (sponsorTags && normalizedTags.length > 0) {
      return normalizedTags.some((t) =>
        sponsorTags.some((st) => typeof st === 'string' && st.toLowerCase() === t.toLowerCase())
      );
    }

    return false;
  });

  if (targetedMatch) return targetedMatch;
  // Tools Hub showcase cards are purchased for the directory itself, so a
  // category-targeted campaign still belongs on /tools.
  if (relaxTargeting) return activeCandidates[0] || null;
  return activeCandidates.find((s) => !s.targeting) || null;
}

export function campaignDestination(sponsor) {
  return String(sponsor?.url || sponsor?.destinationUrl || '').trim();
}

export function buildTrackedDestination(sponsor, context = 'run-of-site') {
  const raw = campaignDestination(sponsor);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', 'dataengineerhub');
    if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'sponsorship');
    if (!url.searchParams.has('utm_campaign')) {
      url.searchParams.set('utm_campaign', sponsor.token || sponsor.company || 'campaign');
    }
    if (!url.searchParams.has('utm_content')) {
      url.searchParams.set('utm_content', `${sponsor.placement || 'placement'}:${context}`);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export function placementLabel(placement) {
  if (placement === 'directory') return 'Ecosystem Showcase';
  if (placement === 'resource_reference') return 'Developer Resource Reference';
  if (placement === 'content') return 'Technical Integration Guide';
  return String(placement || 'Placement').replace(/_/g, ' ');
}

export function partnerDashboardPath(token) {
  const cleaned = String(token || '').trim();
  if (!cleaned) return '/sponsors/dashboard';
  return `/sponsors/dashboard?token=${encodeURIComponent(cleaned)}`;
}
