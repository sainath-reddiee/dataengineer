import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import activeSponsors from '@/data/activeSponsors.json';
import { formatCtr } from '@/utils/sponsorTracking';
import { placementLabel } from '@/lib/sponsorCampaign';
import { WORDPRESS_API_URL } from '@/apiConfig';

const STATS_URL = `${WORDPRESS_API_URL}/wp-json/dehub/v1/sponsor-stats`;

/**
 * Private sponsor dashboard. Numbers come from the server (counted for every
 * visitor), not from this browser. Access needs the signed link sent to the
 * sponsor: /sponsors/dashboard?campaign=<id>&key=<hmac>.
 */
const SponsorDashboardPage = () => {
  const [searchParams] = useSearchParams();
  const campaign = (searchParams.get('campaign') || '').trim().toLowerCase();
  const key = (searchParams.get('key') || '').trim();
  const [state, setState] = useState({ loading: Boolean(campaign && key), error: null, data: null });

  const sponsor = useMemo(
    () => activeSponsors.find((s) => String(s.token || '').toLowerCase() === campaign) || null,
    [campaign]
  );

  useEffect(() => {
    if (!campaign || !key) return undefined;
    let cancelled = false;
    setState({ loading: true, error: null, data: null });
    fetch(`${STATS_URL}?campaign=${encodeURIComponent(campaign)}&key=${encodeURIComponent(key)}`, { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (res.status === 404) throw new Error('Sponsor statistics are not switched on yet. Please check back shortly.');
        if (!res.ok || !body.success) throw new Error(body.message || 'Could not load stats.');
        return body;
      })
      .then((data) => { if (!cancelled) setState({ loading: false, error: null, data }); })
      .catch((err) => { if (!cancelled) setState({ loading: false, error: err.message, data: null }); });
    return () => { cancelled = true; };
  }, [campaign, key]);

  const totals = state.data?.totals || { impressions: 0, clicks: 0 };
  const daily = state.data?.daily || [];
  const last30 = daily.slice(-30).reverse();

  return (
    <>
      <MetaTags
        title="Sponsor dashboard"
        description="Private campaign statistics for DataEngineer Hub sponsors."
        noindex={true}
      />
      <div className="px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="kicker mb-3">Sponsor dashboard</p>

          {!campaign || !key ? (
            <>
              <h1 className="font-serif text-[36px] font-semibold leading-tight text-ink">Campaign statistics</h1>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-body">
                Each sponsor receives a private link to this page by email when their placement goes live. The
                link shows viewable impressions and clicks counted on our server for every reader, updated as they
                happen. Lost your link? Email{' '}
                <a href="mailto:sainath@dataengineerhub.blog" className="text-rust-600 underline decoration-rust-200 underline-offset-2">
                  sainath@dataengineerhub.blog
                </a>.
              </p>
              <p className="mt-4 text-[15px] text-ink-muted">
                Looking to sponsor? See the <Link to="/advertise" className="text-rust-600 underline decoration-rust-200 underline-offset-2">advertising options</Link>.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-[36px] font-semibold leading-tight text-ink">
                {sponsor?.company || campaign}
              </h1>
              <p className="mt-2 font-mono text-[12px] text-ink-faint">
                {sponsor ? `${placementLabel(sponsor.placement)} · ${sponsor.startDate} to ${sponsor.endDate}` : `Campaign ${campaign}`}
              </p>

              {state.loading && <p className="mt-8 text-ink-muted">Loading statistics…</p>}
              {state.error && (
                <p className="mt-8 rounded border border-red-300 bg-red-50 p-4 text-[15px] text-red-800">{state.error}</p>
              )}

              {state.data && (
                <>
                  <dl className="mt-8 grid grid-cols-3 border-y-2 border-ink">
                    {[
                      ['Viewable impressions', totals.impressions.toLocaleString()],
                      ['Clicks', totals.clicks.toLocaleString()],
                      ['Click-through rate', formatCtr(totals.impressions, totals.clicks)],
                    ].map(([label, value]) => (
                      <div key={label} className="border-r border-paper-500 px-3 py-4 last:border-r-0">
                        <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
                        <dd className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-sm text-ink-faint">
                    A viewable impression is the card at least half on screen for one second, counted once per reader
                    session and page. Repeat clicks from the same reader within a minute count once. Bots are excluded.
                  </p>

                  <h2 className="mb-3 mt-10 font-serif text-xl font-semibold text-ink">Last 30 days</h2>
                  {last30.length === 0 ? (
                    <p className="text-[15px] text-ink-muted">No impressions recorded yet.</p>
                  ) : (
                    <table className="w-full border-collapse text-[15px]">
                      <thead>
                        <tr className="border-b border-ink text-left font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                          <th className="py-2 font-normal">Day</th>
                          <th className="py-2 text-right font-normal">Impressions</th>
                          <th className="py-2 text-right font-normal">Clicks</th>
                          <th className="py-2 text-right font-normal">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {last30.map((row) => (
                          <tr key={row.day} className="border-b border-paper-500">
                            <td className="py-2 font-mono text-[13px] text-ink-muted">{row.day}</td>
                            <td className="py-2 text-right text-ink">{row.impressions.toLocaleString()}</td>
                            <td className="py-2 text-right text-ink">{row.clicks.toLocaleString()}</td>
                            <td className="py-2 text-right text-ink-muted">{formatCtr(row.impressions, row.clicks)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="mt-6 text-sm text-ink-faint">
                    Links to your site carry UTM tags (utm_source=dataengineerhub, utm_campaign={campaign}) so you can
                    match these clicks in your own analytics.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SponsorDashboardPage;
