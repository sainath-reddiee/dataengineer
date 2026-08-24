// First-party sponsor performance tracking.
// Viewable impressions (50% visible for 1s, once per session+context) and clicks
// are stored locally so the partner dashboard can show real numbers without a
// backend. GA4 also receives the same events after cookie consent.
// Crawlers (AdsBot/Googlebot) are never counted.

import { isCrawlerUserAgent } from './isCrawler.js';

export const SPONSOR_STATS_KEY = 'deh_sponsor_stats_v1';
const MAX_CAMPAIGNS = 50;
const MAX_DAYS = 90;

const emptyCampaign = () => ({
  impressions: 0,
  clicks: 0,
  contexts: {},
  daily: {},
  lastImpressionAt: null,
  lastClickAt: null,
});

const todayKey = () => new Date().toISOString().slice(0, 10);

const safeParse = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const pruneDaily = (daily) => {
  const cutoff = Date.now() - MAX_DAYS * 86400000;
  const next = {};
  Object.entries(daily || {}).forEach(([day, counts]) => {
    const t = Date.parse(`${day}T00:00:00Z`);
    if (!Number.isNaN(t) && t >= cutoff) next[day] = counts;
  });
  return next;
};

const readStore = () => {
  if (typeof window === 'undefined') return {};
  try {
    return safeParse(window.localStorage.getItem(SPONSOR_STATS_KEY));
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  if (typeof window === 'undefined') return;
  const tokens = Object.keys(store);
  const trimmed = tokens.length <= MAX_CAMPAIGNS
    ? store
    : Object.fromEntries(tokens.slice(tokens.length - MAX_CAMPAIGNS).map((token) => [token, store[token]]));
  try {
    window.localStorage.setItem(SPONSOR_STATS_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota or private mode — tracking is best-effort.
  }
};

function bump(campaign, field, context) {
  campaign[field] = (campaign[field] || 0) + 1;
  const ctx = context || 'run-of-site';
  campaign.contexts[ctx] = campaign.contexts[ctx] || { impressions: 0, clicks: 0 };
  campaign.contexts[ctx][field] = (campaign.contexts[ctx][field] || 0) + 1;
  const day = todayKey();
  campaign.daily[day] = campaign.daily[day] || { impressions: 0, clicks: 0 };
  campaign.daily[day][field] = (campaign.daily[day][field] || 0) + 1;
  campaign.daily = pruneDaily(campaign.daily);
}

function mutate(token, updater) {
  if (!token) return emptyCampaign();
  const store = readStore();
  const campaign = {
    ...emptyCampaign(),
    ...(store[token] || {}),
    contexts: { ...(store[token]?.contexts || {}) },
    daily: { ...(store[token]?.daily || {}) },
  };
  updater(campaign);
  store[token] = campaign;
  writeStore(store);
  return campaign;
}

function mirrorToGa4(payload) {
  if (typeof window === 'undefined') return;
  import('./analytics.js')
    .then(({ trackEvent }) => {
      trackEvent(payload);
    })
    .catch(() => {});
}

export function getSponsorStats(token) {
  if (!token) return emptyCampaign();
  const stored = readStore()[token];
  if (!stored) return emptyCampaign();
  return {
    ...emptyCampaign(),
    ...stored,
    contexts: stored.contexts || {},
    daily: pruneDaily(stored.daily || {}),
  };
}

export function getAllSponsorStats() {
  return readStore();
}

export function shouldSkipTracking(userAgent) {
  return isCrawlerUserAgent(userAgent);
}

export function impressionSessionKey(token, context) {
  return `deh_sponsor_imp_${token}_${context || 'run-of-site'}`;
}

export function recordSponsorImpression({ token, company, placement, context, userAgent }) {
  if (!token || shouldSkipTracking(userAgent)) return getSponsorStats(token);
  const ctx = context || 'run-of-site';
  const sessionKey = impressionSessionKey(token, ctx);
  try {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(sessionKey)) {
      return getSponsorStats(token);
    }
    if (typeof window !== 'undefined') window.sessionStorage.setItem(sessionKey, '1');
  } catch {
    // sessionStorage unavailable — still count once this call.
  }

  const campaign = mutate(token, (entry) => {
    bump(entry, 'impressions', ctx);
    entry.lastImpressionAt = Date.now();
  });

  mirrorToGa4({
    action: 'sponsor_impression',
    category: 'sponsorship',
    label: `${company || token} | ${placement || 'placement'} | ${ctx}`,
    value: 1,
  });
  return campaign;
}

export function recordSponsorClick({ token, company, placement, context, userAgent }) {
  if (!token || shouldSkipTracking(userAgent)) return getSponsorStats(token);
  const ctx = context || 'run-of-site';
  const campaign = mutate(token, (entry) => {
    bump(entry, 'clicks', ctx);
    entry.lastClickAt = Date.now();
  });
  mirrorToGa4({
    action: 'sponsor_link_clicked',
    category: 'sponsorship',
    label: `${company || token} | ${placement || 'placement'} | ${ctx}`,
    value: 1,
  });
  return campaign;
}

export function formatCtr(impressions, clicks) {
  if (!impressions) return '0.00%';
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

export function dailyTimeline(stats, days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    const key = date.toISOString().slice(0, 10);
    const counts = stats?.daily?.[key] || { impressions: 0, clicks: 0 };
    out.push({
      day: key.slice(5),
      fullDate: key,
      impressions: counts.impressions || 0,
      clicks: counts.clicks || 0,
    });
  }
  return out;
}
