import {
  getCampaignStatus,
  isCampaignLive,
  findSponsorByToken,
  buildTrackedDestination,
  pickSponsor,
  partnerDashboardPath,
} from '../src/lib/sponsorCampaign.js';
import {
  recordSponsorImpression,
  recordSponsorClick,
  getSponsorStats,
  formatCtr,
  SPONSOR_STATS_KEY,
} from '../src/utils/sponsorTracking.js';

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    failed += 1;
    console.log(`  ❌ ${msg}`);
  }
}

const live = {
  company: 'Acme',
  token: 'sp_live',
  url: 'https://acme.example/product',
  placement: 'directory',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  active: true,
};

ok(getCampaignStatus({ ...live, active: false }).key === 'paused', 'paused when inactive');
ok(getCampaignStatus({ ...live, active: false, endDate: '2026-01-02' }, Date.parse('2026-08-24T12:00:00')).key === 'expired', 'expired wins over paused');
ok(getCampaignStatus({ ...live, startDate: '2026-11-01' }, Date.parse('2026-08-24T12:00:00')).key === 'scheduled', 'scheduled before start');
ok(getCampaignStatus({ ...live, endDate: '2026-01-02' }, Date.parse('2026-08-24T12:00:00')).key === 'expired', 'expired after end');
ok(isCampaignLive(live, Date.parse('2026-08-24T12:00:00')), 'live campaign is live');
ok(findSponsorByToken('sp_live', [live])?.company === 'Acme', 'finds token');
ok(findSponsorByToken('nope', [live]) === null, 'unknown token is null');
ok(findSponsorByToken('sp_live') === null, 'missing catalog does not invent a campaign');

const href = buildTrackedDestination(live, 'snowflake');
const url = new URL(href);
ok(url.searchParams.get('utm_source') === 'dataengineerhub', 'utm_source set');
ok(url.searchParams.get('utm_campaign') === 'sp_live', 'utm_campaign is token');
ok(url.searchParams.get('utm_content') === 'directory:snowflake', 'utm_content includes placement and context');

const alt = buildTrackedDestination({ destinationUrl: 'https://other.example', token: 'sp_x', placement: 'content' }, 'tools');
ok(alt.includes('utm_source=dataengineerhub'), 'destinationUrl fallback still gets UTM tags');
ok(partnerDashboardPath('sp a').includes('token=sp%20a'), 'dashboard path encodes the token');

const catalog = [
  { ...live, targeting: { categories: ['snowflake'] } },
  {
    company: 'InContent',
    token: 'sp_ref',
    url: 'https://ref.example',
    placement: 'resource_reference',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    active: true,
  },
];
ok(pickSponsor(catalog, { category: 'snowflake', placementFilter: 'directory' })?.token === 'sp_live', 'directory slot picks targeted directory campaign');
ok(pickSponsor(catalog, { category: 'snowflake', placementFilter: ['resource_reference', 'content'] })?.token === 'sp_ref', 'article slot does not leak a directory campaign');
ok(pickSponsor(catalog, { placementFilter: 'directory', slug: 'tools' }) == null, 'targeted directory campaign stays off tools hub unless targeting matches');
ok(pickSponsor(catalog, { placementFilter: 'directory', slug: 'tools', relaxTargeting: true })?.token === 'sp_live', 'tools hub showcase still shows a live directory campaign');

const mem = {};
const session = {};
global.window = {
  localStorage: {
    getItem: (k) => mem[k] || null,
    setItem: (k, v) => { mem[k] = v; },
  },
  sessionStorage: {
    getItem: (k) => session[k] || null,
    setItem: (k, v) => { session[k] = v; },
  },
};

const chromeUA = 'Mozilla/5.0 Chrome';
recordSponsorImpression({ token: 'sp_live', company: 'Acme', placement: 'directory', context: 'tools', userAgent: chromeUA });
recordSponsorImpression({ token: 'sp_live', company: 'Acme', placement: 'directory', context: 'tools', userAgent: chromeUA });
recordSponsorClick({ token: 'sp_live', company: 'Acme', placement: 'directory', context: 'tools', userAgent: chromeUA });
const stats = getSponsorStats('sp_live');
ok(stats.impressions === 1, 'session-deduped impression stored once');
ok(stats.clicks === 1, 'one click stored');
ok(formatCtr(100, 2) === '2.00%', 'CTR formatting');
ok(mem[SPONSOR_STATS_KEY], 'stats persist to localStorage');

recordSponsorImpression({
  token: 'sp_bot',
  company: 'Bot',
  placement: 'directory',
  context: 'tools',
  userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
});
ok(getSponsorStats('sp_bot').impressions === 0, 'crawlers are not counted');

if (failed) {
  console.error(`\nSponsor campaign checks failed: ${failed}`);
  process.exit(1);
}
console.log('\n✅ Sponsor campaign and tracking checks passed.');
