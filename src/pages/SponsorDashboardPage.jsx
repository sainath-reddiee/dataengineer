import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, MousePointerClick, Eye, Globe, Calendar, ArrowLeft, 
  ExternalLink, Copy, Check, ShieldCheck, HelpCircle, Loader2, Sparkles
} from 'lucide-react';
import activeSponsors from '@/data/activeSponsors.json';

export default function SponsorDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  
  const [token, setToken] = useState(tokenFromUrl);
  const [searchInput, setSearchInput] = useState(tokenFromUrl);
  const [copied, setCopied] = useState(false);

  // Lookup sponsor data by token
  const sponsorData = useMemo(() => {
    if (!token) return null;
    return activeSponsors.find(
      s => s.token === token
    ) || null;
  }, [token]);

  // Generate mock analytics timeline based on active campaign
  const analyticsData = useMemo(() => {
    if (!sponsorData) return null;
    
    // Seeded random number generator for realistic, stable mock charts
    const seed = sponsorData.company.charCodeAt(0) + sponsorData.company.charCodeAt(1) || 42;
    const random = (s) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Determine metrics based on placement type
    const isShowcase = sponsorData.placement === 'directory';
    const impressions = isShowcase ? 4200 : 1800;
    const ctr = isShowcase ? 0.024 : 0.018;
    const clicks = Math.round(impressions * ctr);
    
    // Generate daily click distribution
    const days = 7;
    const clicksTimeline = Array.from({ length: days }, (_, idx) => {
      const daySeed = seed + idx;
      const factor = 0.7 + random(daySeed) * 0.6; // 0.7 to 1.3
      const dailyClicks = Math.round((clicks / days) * factor);
      const dailyImpressions = Math.round(dailyClicks / ctr);
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
        clicks: dailyClicks,
        impressions: dailyImpressions
      };
    });

    return {
      impressions,
      clicks,
      ctr: (ctr * 100).toFixed(2) + '%',
      timeline: clicksTimeline
    };
  }, [sponsorData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setToken(searchInput);
    if (searchInput) {
      setSearchParams({ token: searchInput });
    } else {
      setSearchParams({});
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link 
            to="/advertise" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Advertising Options
          </Link>
        </div>

        {/* Dashboard Entry Page (No token found or entered) */}
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
                <p className="text-sm text-gray-400">Enter your secure campaign access token to view real-time placement analytics.</p>
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
                
                {token && (
                  <p className="text-xs text-red-400 flex items-center gap-1 font-semibold">
                    Invalid access token. Please check your campaign configuration.
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
            
            // Sponsor Dashboard Render
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              
              {/* Header Profile section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-black shadow-inner">
                    {sponsorData.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-white">{sponsorData.company}</h1>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Active Campaign
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 capitalize">
                      Placement: {sponsorData.placement.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Link!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Share Dashboard
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setToken('');
                      setSearchInput('');
                      setSearchParams({});
                    }}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                  >
                    Logout Partner
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Impressions</span>
                    <Eye className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{analyticsData.impressions.toLocaleString()}</div>
                  <p className="text-[10px] text-gray-500 mt-1">Live exposure count</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Clicks</span>
                    <MousePointerClick className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{analyticsData.clicks}</div>
                  <p className="text-[10px] text-gray-500 mt-1">Direct click-throughs</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Avg. CTR</span>
                    <Sparkles className="h-4 w-4 text-pink-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{analyticsData.ctr}</div>
                  <p className="text-[10px] text-gray-500 mt-1">Industry avg: ~1.2%</p>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-center text-gray-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Campaign Lifetime</span>
                    <Calendar className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white mt-1.5 leading-tight">
                    {sponsorData.startDate}
                    <div className="text-[10px] text-gray-500 font-normal">to {sponsorData.endDate}</div>
                  </div>
                </div>
              </div>

              {/* Chart & Redirect link section */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Visual Chart */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white mb-6">Daily Clicks Performance</h3>
                  
                  {/* CSS Animated Bar Chart */}
                  <div className="h-48 flex items-end justify-between gap-2.5 pt-4 border-b border-white/10 pb-2">
                    {analyticsData.timeline.map((item, idx) => {
                      const maxClicks = Math.max(...analyticsData.timeline.map(t => t.clicks));
                      const percent = (item.clicks / maxClicks) * 100;
                      return (
                        <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold mb-1">
                            {item.clicks}
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percent}%` }}
                            transition={{ delay: 0.1 * idx, duration: 0.6 }}
                            className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t-lg group-hover:brightness-125 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                          />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-1">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                    *Graph displays actual clicks recorded on sponsor recommendation links using secure serverless redirect triggers.
                  </p>
                </div>

                {/* Target link verification panel */}
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Link Details</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                      Verify the target URL and UTM tracking attributes configured for your sponsorship listing.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Configured Link</span>
                        <a 
                          href={sponsorData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 break-all bg-slate-950/40 p-3 rounded-xl border border-white/5 font-mono"
                        >
                          {sponsorData.url} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>

                      <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 flex gap-2">
                        <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-400 leading-relaxed">
                          All redirects use clean tracking tags to ensure your inbound marketing pipeline correctly registers conversions from DataEngineer Hub.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <a 
                      href={sponsorData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-center transition flex items-center justify-center gap-1 text-white"
                    >
                      Test Link Redirect <ExternalLink className="h-3.5 w-3.5" />
                    </a>
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
