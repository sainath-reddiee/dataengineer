import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, MousePointerClick, Eye, Calendar, ArrowLeft,
  ExternalLink, ShieldCheck, Sparkles, MapPin, RefreshCw
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import {
  findSponsorByToken,
  getCampaignStatus,
  placementLabel,
  buildTrackedDestination,
} from '@/lib/sponsorCampaign';
import { dailyTimeline, formatCtr, getSponsorStats } from '@/utils/sponsorTracking';
import activeSponsors from '@/data/activeSponsors.json';

export default function SponsorDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [searchInput, setSearchInput] = useState(tokenFromUrl);
  const [statsTick, setStatsTick] = useState(0);

  useEffect(() => {
    setToken(tokenFromUrl);
    setSearchInput(tokenFromUrl);
  }, [tokenFromUrl]);

  useEffect(() => {
    const refresh = () => setStatsTick((n) => n + 1);
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const sponsorData = useMemo(() => findSponsorByToken(token, activeSponsors), [token]);
  const campaignStatus = useMemo(() => getCampaignStatus(sponsorData), [sponsorData]);
  const analyticsData = useMemo(() => {
    void statsTick;
    if (!sponsorData) return null;
    const stats = getSponsorStats(sponsorData.token);
    return {
      ...stats,
      ctr: formatCtr(stats.impressions, stats.clicks),
      timeline: dailyTimeline(stats, 7),
    };
  }, [sponsorData, statsTick]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = searchInput.trim();
    setToken(next);
    if (next) setSearchParams({ token: next });
    else setSearchParams({});
    setStatsTick((n) => n + 1);
  };

  const destination = sponsorData
    ? buildTrackedDestination(sponsorData, 'dashboard')
    : '/contact';

  const statusClass = {
    live: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    scheduled: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    expired: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
    paused: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    unknown: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
  }[campaignStatus.key] || 'bg-slate-500/10 border-slate-500/20 text-slate-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-slate-100 py-16 px-4">
      <MetaTags
        title="Sponsor Dashboard"
        description="Private campaign performance for DataEngineer Hub partners."
        noindex={true}
      />
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            to="/advertise"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Advertising Options
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!sponsorData ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl mt-10"
            >
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Sponsorship Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Enter the campaign token we emailed you. Metrics are first-party viewable impressions and clicks — not estimates.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div>
                  <label htmlFor="access-token" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Campaign Access Token</label>
                  <input
                    id="access-token"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="e.g. sp_8f3a9e1d2c"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder-gray-600 font-mono"
                    required
                  />
                </div>

                {token && !sponsorData && (
                  <p className="text-xs text-amber-300 font-semibold">
                    That token does not match an active or past campaign. Check the email we sent, or contact support.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
                >
                  Access Dashboard
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <span className="text-xs text-gray-500">Need help locating your token? <Link to="/contact" className="text-blue-400 hover:underline">Contact Support</Link></span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-black shadow-inner">
                    {sponsorData.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-black text-white">{sponsorData.company}</h1>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                        {campaignStatus.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {placementLabel(sponsorData.placement)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 max-w-xl">
                      Impressions count only when the placement is at least 50% on screen for one second. Clicks are counted on the outbound link. AdsBot and other crawlers are excluded.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStatsTick((n) => n + 1)}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh metrics
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setToken('');
                      setSearchInput('');
                      setSearchParams({});
                    }}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                  >
                    Sign out
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Viewable impressions</span>
                    <Eye className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{analyticsData.impressions.toLocaleString()}</div>
                  <p className="text-[10px] text-gray-500 mt-1">This browser, last 90 days</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Clicks</span>
                    <MousePointerClick className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{analyticsData.clicks.toLocaleString()}</div>
                  <p className="text-[10px] text-gray-500 mt-1">Outbound sponsor clicks</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">CTR</span>
                    <Sparkles className="h-4 w-4 text-pink-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{analyticsData.ctr}</div>
                  <p className="text-[10px] text-gray-500 mt-1">Clicks / viewable impressions</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Campaign dates</span>
                    <Calendar className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white mt-1.5 leading-tight">
                    {sponsorData.startDate}
                    <div className="text-[10px] text-gray-500 font-normal">to {sponsorData.endDate}</div>
                  </div>
                </div>
              </div>

              {analyticsData.impressions === 0 && analyticsData.clicks === 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
                  No viewable impressions yet on this device. Numbers start after a reader keeps your placement on screen for one second. GA4 also receives the same events after cookie consent, so site-wide totals live there too.
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white mb-6">Last 7 days (this browser)</h3>
                  <div className="h-48 flex items-end justify-between gap-2.5 pt-4 border-b border-white/10 pb-2">
                    {analyticsData.timeline.map((item, idx) => {
                      const maxVal = Math.max(1, ...analyticsData.timeline.map((t) => Math.max(t.clicks, t.impressions)));
                      const percent = (Math.max(item.impressions, item.clicks) / maxVal) * 100;
                      return (
                        <div key={item.fullDate} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold mb-1">
                            {item.impressions} / {item.clicks}
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(percent, item.impressions || item.clicks ? 8 : 2)}%` }}
                            transition={{ delay: 0.05 * idx, duration: 0.45 }}
                            className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t-lg group-hover:brightness-125 transition-all"
                          />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                    Hover a bar for impressions / clicks that day. This chart is first-party (this browser). Site-wide delivery is also sent to Google Analytics as <code>sponsor_impression</code> and <code>sponsor_link_clicked</code>.
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Campaign details</h3>
                    {sponsorData.targeting && (
                      <div className="mb-4">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Targeting</span>
                        <p className="text-xs text-gray-300 flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-blue-400 shrink-0" />
                          {[
                            ...(sponsorData.targeting.categories || []),
                            ...(sponsorData.targeting.tags || []),
                            ...(sponsorData.targeting.slugs || []),
                          ].join(', ') || 'Run of relevant content'}
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Tracked destination</span>
                        <a
                          href={destination}
                          target="_blank"
                          rel="noopener noreferrer nofollow sponsored"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 break-all bg-slate-950/40 p-3 rounded-xl border border-white/5 font-mono"
                        >
                          Open live URL <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                      <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 flex gap-2">
                        <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-400 leading-relaxed">
                          Links include UTM tags (<span className="font-mono">utm_source=dataengineerhub</span>) so you can match clicks in your own analytics.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <Link
                      to="/contact"
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-center transition flex items-center justify-center gap-1 text-white"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
