// src/pages/QueryCostEstimatorPage.jsx
// Estimate the cost of a single Snowflake query based on warehouse size and runtime.
// Targets: "snowflake query cost", "snowflake cost per query", "how much does a snowflake query cost".
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Database, Clock, Cloud, Share2, Check, Zap, HardDrive } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { EDITIONS, REGIONS, WAREHOUSE_SIZES, formatUSD } from '@/data/snowflakePricing';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const FAQ = [
  {
    q: 'How is query cost calculated in Snowflake?',
    a: 'Query cost = (warehouse credits/hour × query runtime in hours) × price per credit. A 60-second minimum applies when a suspended warehouse resumes. Bytes scanned does not directly appear in pricing, but larger scans typically take longer to execute, driving up cost.',
  },
  {
    q: 'Why does bytes scanned matter if Snowflake bills by time?',
    a: 'Scan volume is the best predictor of query runtime. Less pruning = more bytes scanned = longer runtime = higher cost. Micro-partition pruning, clustering keys, and search optimization all reduce bytes scanned and therefore cost.',
  },
  {
    q: 'Does the 60-second minimum really matter?',
    a: 'Yes — every time a warehouse resumes from auto-suspend, you are billed for at least 60 seconds even if your query takes 2 seconds. For bursty workloads this can inflate real costs 10x vs. the theoretical runtime.',
  },
  {
    q: 'Are serverless / Snowpipe queries priced the same?',
    a: 'No. Serverless features (Snowpipe, Tasks serverless, Cortex AI) are priced per operation or per token, not per warehouse hour. Use the full cost calculator to model them.',
  },
  {
    q: 'How can I reduce a specific query cost?',
    a: 'Top 4 levers: (1) add clustering keys on high-cardinality filter columns; (2) use search optimization service for point lookups; (3) right-size the warehouse — bigger is often cheaper because queries finish faster; (4) review the query profile for remote disk spillage.',
  },
];

export default function QueryCostEstimatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bytesGB, setBytesGB] = useState(() => Number(searchParams.get('b')) || 50);
  const [sizeId, setSizeId] = useState(() => searchParams.get('s') || 'm');
  const [editionId, setEditionId] = useState(() => searchParams.get('e') || 'enterprise');
  const [regionId, setRegionId] = useState(() => searchParams.get('r') || 'aws-us-east');
  const [queriesPerDay, setQueriesPerDay] = useState(() => Number(searchParams.get('q')) || 100);
  const [resumeFromCold, setResumeFromCold] = useState(() => searchParams.get('c') === '1');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams({
        b: String(bytesGB),
        s: sizeId,
        e: editionId,
        r: regionId,
        q: String(queriesPerDay),
        c: resumeFromCold ? '1' : '0',
      }, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [bytesGB, sizeId, editionId, regionId, queriesPerDay, resumeFromCold, setSearchParams]);

  const result = useMemo(() => {
    const ed = EDITIONS.find(e => e.id === editionId) || EDITIONS[1];
    const rg = REGIONS.find(r => r.id === regionId) || REGIONS[0];
    const sz = WAREHOUSE_SIZES.find(s => s.id === sizeId) || WAREHOUSE_SIZES[2];
    const pricePerCredit = rg.creditPrice * ed.multiplier;

    // Throughput assumption: roughly 100 MB/s per credit/hour of warehouse capacity
    // (empirically, an XS handles ~100 MB/s of sustained scan; doubles with each size).
    // This is a heuristic; real throughput depends on query shape, caching, clustering.
    const throughputMBps = sz.creditsPerHour * 100;
    const bytesMB = Math.max(0, bytesGB) * 1024;
    const rawSeconds = throughputMBps > 0 ? bytesMB / throughputMBps : 0;

    // 60s minimum on cold resume
    const billedSeconds = resumeFromCold ? Math.max(60, rawSeconds) : Math.max(1, rawSeconds);
    const billedHours = billedSeconds / 3600;
    const creditsPerQuery = sz.creditsPerHour * billedHours;
    const costPerQuery = creditsPerQuery * pricePerCredit;

    const dailyCost = costPerQuery * Math.max(0, queriesPerDay);
    const monthlyCost = dailyCost * 30;

    return {
      edition: ed,
      region: rg,
      size: sz,
      pricePerCredit,
      rawSeconds,
      billedSeconds,
      creditsPerQuery,
      costPerQuery,
      dailyCost,
      monthlyCost,
    };
  }, [bytesGB, sizeId, editionId, regionId, queriesPerDay, resumeFromCold]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Snowflake Query Cost Estimator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Estimate the cost of a single Snowflake query from bytes scanned, warehouse size, edition and region.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/snowflake-query-cost-estimator',
    publisher: { '@type': 'Organization', name: 'DataEngineer Hub', url: 'https://dataengineerhub.blog' },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <MetaTags
        title="Snowflake Query Cost Estimator 2026 — Price per Query Calculator"
        description="Estimate Snowflake query cost from bytes scanned and warehouse size. See cost per query, daily cost and monthly projection. Free tool."
        keywords="snowflake query cost, snowflake cost per query, snowflake query pricing, bytes scanned cost, query cost calculator"
        url="/tools/snowflake-query-cost-estimator"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Query Cost Estimator', url: '/tools/snowflake-query-cost-estimator' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 rounded-full">
            Heuristic estimate · Based on throughput ~100 MB/s per credit/hour
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400" />
            Snowflake Query Cost Estimator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Estimate the cost of a single query based on bytes scanned and warehouse size.
            Includes the 60-second resume minimum and scales to daily and monthly totals.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Query profile</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HardDrive className="w-4 h-4 text-blue-400" /> Bytes scanned (GB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={bytesGB}
                    onChange={e => setBytesGB(Number(e.target.value) || 0)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[11px] text-gray-500 mt-1">See the Query Profile panel in Snowsight for the exact number.</div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Database className="w-4 h-4 text-blue-400" /> Warehouse size
                  </label>
                  <select
                    value={sizeId}
                    onChange={e => setSizeId(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {WAREHOUSE_SIZES.map(sz => (
                      <option key={sz.id} value={sz.id}>
                        {sz.label} — {sz.creditsPerHour} credit{sz.creditsPerHour > 1 ? 's' : ''}/hr
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Cloud className="w-4 h-4 text-blue-400" /> Edition
                  </label>
                  <select
                    value={editionId}
                    onChange={e => setEditionId(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EDITIONS.map(ed => (
                      <option key={ed.id} value={ed.id}>{ed.label} ({ed.multiplier}x)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Cloud className="w-4 h-4 text-blue-400" /> Region
                  </label>
                  <select
                    value={regionId}
                    onChange={e => setRegionId(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {REGIONS.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Queries per day
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={queriesPerDay}
                    onChange={e => setQueriesPerDay(Number(e.target.value) || 0)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> Resume from cold
                  </label>
                  <button
                    type="button"
                    onClick={() => setResumeFromCold(v => !v)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                      resumeFromCold
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-700/30 border-slate-600 text-gray-300'
                    }`}
                  >
                    <span className="text-sm">{resumeFromCold ? 'Yes (60s minimum applies)' : 'No (warehouse already warm)'}</span>
                    <span className={`w-10 h-6 rounded-full relative ${resumeFromCold ? 'bg-blue-500' : 'bg-slate-600'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${resumeFromCold ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border border-blue-700/50 p-6 lg:sticky lg:top-4"
            >
              <div className="text-sm text-gray-300 mb-2">Cost per query</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                {formatUSD(result.costPerQuery)}
              </div>
              <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
                <div className="flex justify-between"><span className="text-gray-400">Raw runtime</span><span className="text-white font-mono">{result.rawSeconds.toFixed(1)}s</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Billed runtime</span><span className="text-white font-mono">{result.billedSeconds.toFixed(1)}s</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Credits / query</span><span className="text-white font-mono">{result.creditsPerQuery.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Price / credit</span><span className="text-white font-mono">{formatUSD(result.pricePerCredit)}</span></div>
              </div>
              <div className="mt-4 p-3 bg-slate-900/60 rounded-xl">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Daily ({queriesPerDay} queries)</span><span className="text-white font-mono">{formatUSD(result.dailyCost)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Monthly (×30 days)</span><span className="text-white font-mono">{formatUSD(result.monthlyCost)}</span></div>
              </div>
              <button
                onClick={handleShare}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
              >
                {copied ? (<><Check className="w-4 h-4 text-green-400" /> Link copied</>) : (<><Share2 className="w-4 h-4" /> Share this estimate</>)}
              </button>
              <p className="text-[11px] text-gray-500 mt-4">
                Heuristic only. Real runtime depends on query shape, caching, clustering, and concurrency.
              </p>
            </motion.div>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How to find bytes scanned for your query</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-300">
            <li>Open Snowsight → <strong>Activity</strong> → <strong>Query History</strong>.</li>
            <li>Click the query ID you want to estimate.</li>
            <li>In the <strong>Query Profile</strong> pane, look for the <strong>TableScan</strong> nodes — the "Bytes scanned" stat is the value to enter above.</li>
            <li>Alternatively, run <code className="px-1 py-0.5 bg-slate-900 rounded">SELECT BYTES_SCANNED FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY WHERE QUERY_ID = '...';</code></li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Full Snowflake Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Monthly spend across compute, storage, cloud services, and serverless.</div>
            </Link>
            <Link to="/tools/snowflake-warehouse-sizing" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Warehouse Sizing Estimator →</div>
              <div className="text-gray-400 text-sm">Pick the right warehouse size for your workload shape.</div>
            </Link>
            <Link to="/articles/snowflake-query-optimization-2025" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Snowflake query optimization in 2025 →</div>
              <div className="text-gray-400 text-sm">Partition pruning, clustering, and materialized views done right.</div>
            </Link>
            <Link to="/articles/snowflake-cost-optimization-techniques-2026" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">12 cost optimization techniques →</div>
              <div className="text-gray-400 text-sm">Cut bills 30–60% without hurting performance.</div>
            </Link>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((f, i) => (
              <details key={i} className="group border border-slate-700 rounded-xl px-4 py-3 open:bg-slate-800/70">
                <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-blue-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="mt-3 text-gray-300 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
