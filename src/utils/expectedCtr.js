/**
 * Approximate Google organic CTR by average position.
 * Sources: Advanced Web Ranking / Sparktoro industry studies (desktop+mobile blended).
 * These are averages — branded queries run higher, informational lower.
 */
const CTR_CURVE = [
  [1, 0.28],
  [2, 0.15],
  [3, 0.11],
  [4, 0.08],
  [5, 0.06],
  [6, 0.05],
  [7, 0.04],
  [8, 0.03],
  [9, 0.025],
  [10, 0.02],
  [15, 0.01],
  [20, 0.007],
  [30, 0.004],
  [50, 0.002],
  [100, 0.001]
];

export function getExpectedCTR(position) {
  const pos = Number(position);
  if (!Number.isFinite(pos) || pos < 1) return 0;
  if (pos <= 1) return CTR_CURVE[0][1];
  for (let i = 1; i < CTR_CURVE.length; i++) {
    const [p1, c1] = CTR_CURVE[i - 1];
    const [p2, c2] = CTR_CURVE[i];
    if (pos <= p2) {
      const t = (pos - p1) / (p2 - p1);
      return c1 + t * (c2 - c1);
    }
  }
  return CTR_CURVE[CTR_CURVE.length - 1][1];
}

/**
 * Why CTR is low for this URL (or query).
 * Site-wide CTR < 1% is usually a RANK mix (lots of page-2+ impressions), not a title bug.
 */
export function diagnoseCtr({ impressions, clicks, ctr, position, title = '' }) {
  const imp = Number(impressions) || 0;
  const clk = Number(clicks) || 0;
  const pos = Number(position) || 0;
  const actual = typeof ctr === 'number' && Number.isFinite(ctr)
    ? ctr
    : (imp > 0 ? clk / imp : 0);
  const expected = getExpectedCTR(pos);
  const expectedClicks = expected * imp;
  const clickGap = expectedClicks - clk;
  const ctrGap = expected - actual;
  const titleLen = String(title || '').length;

  let kind = 'ok';
  let label = 'On track';
  let detail = `CTR is about what position ${pos.toFixed(1)} usually earns.`;

  if (imp < 50) {
    kind = 'low_data';
    label = 'Too little data';
    detail = 'Wait for more impressions before rewriting the title. Noise dominates under ~50 impressions.';
  } else if (pos > 10.5) {
    kind = 'rank';
    label = 'Ranking, not snippet';
    detail = `Average position ${pos.toFixed(1)} is page 2+. Typical CTR here is ~${(expected * 100).toFixed(1)}%. Title rewrites barely move this — improve the page until it ranks top 10.`;
  } else if (actual < expected * 0.65 && clickGap >= 5) {
    kind = 'snippet';
    label = 'Snippet underperforming';
    detail = `You are on page 1 (pos ${pos.toFixed(1)}) but CTR is ${(actual * 100).toFixed(2)}% vs ~${(expected * 100).toFixed(1)}% expected. Rewrite the SERP title/meta — this is the CTR Fixer sweet spot.`;
  } else if (titleLen > 62) {
    kind = 'snippet';
    label = 'Title likely truncated';
    detail = `Title is ${titleLen} chars. Google typically shows ~50–60. Truncation hides the benefit.`;
  } else if (actual >= expected * 0.9) {
    kind = 'ok';
    label = 'Healthy for this rank';
    detail = `CTR ${(actual * 100).toFixed(2)}% is in range for position ${pos.toFixed(1)}.`;
  } else {
    kind = 'ok';
    label = 'Slightly below average';
    detail = `Small gap vs expected ${(expected * 100).toFixed(1)}%. Not urgent.`;
  }

  return {
    kind,
    label,
    detail,
    actual,
    expected,
    expectedClicks,
    clickGap,
    ctrGap,
    opportunity: Math.max(0, clickGap)
  };
}

export function summarizeCtrMix(pages = []) {
  const buckets = { page1: { impressions: 0, clicks: 0 }, page2plus: { impressions: 0, clicks: 0 } };
  pages.forEach((p) => {
    const pos = Number(p.position) || 99;
    const bucket = pos <= 10.5 ? buckets.page1 : buckets.page2plus;
    bucket.impressions += Number(p.impressions) || 0;
    bucket.clicks += Number(p.clicks) || 0;
  });
  const totalImp = buckets.page1.impressions + buckets.page2plus.impressions;
  const totalClk = buckets.page1.clicks + buckets.page2plus.clicks;
  return {
    ...buckets,
    totalImpressions: totalImp,
    totalClicks: totalClk,
    overallCtr: totalImp > 0 ? totalClk / totalImp : 0,
    page1Share: totalImp > 0 ? buckets.page1.impressions / totalImp : 0
  };
}
