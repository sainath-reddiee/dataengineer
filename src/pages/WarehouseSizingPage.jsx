// src/pages/WarehouseSizingPage.jsx
// Warehouse Sizing Estimator. Suggest an XS-6XL T-shirt size based on workload shape.
// Targets: "snowflake warehouse size", "how to size snowflake warehouse", "snowflake warehouse sizing guide".
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Layers, Users, HardDrive, Clock, Cloud, Share2, Check, Zap } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import ValidateWithSqlBlock from '@/components/calculator/ValidateWithSqlBlock';
import { EDITIONS, REGIONS, WAREHOUSE_SIZES, formatUSD } from '@/data/snowflakePricing';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const WORKLOAD_TYPES = [
  { id: 'dashboard', label: 'BI / Dashboards (fast, many concurrent)', concurrencyHeavy: true },
  { id: 'adhoc', label: 'Ad-hoc analytics / exploration', concurrencyHeavy: false },
  { id: 'etl', label: 'ETL / batch transformations', concurrencyHeavy: false },
  { id: 'ml', label: 'ML feature engineering / training prep', concurrencyHeavy: false },
  { id: 'dev', label: 'Dev / sandbox (small, cheap)', concurrencyHeavy: false },
];

const FAQ = [
  {
    q: 'How should I choose a Snowflake warehouse size?',
    a: 'Start small (XS or S) and monitor query runtimes. If queries routinely exceed your latency SLA or spill to remote disk, bump up one size. Bigger warehouses finish faster and often cost the same — a 2XL running 30s may equal an S running 8 minutes. Size to your critical-path query, not your tiny ones.',
  },
  {
    q: 'Is a larger warehouse always more expensive?',
    a: 'No — because warehouses are billed per second, a larger warehouse that finishes 4x faster costs the same as a smaller one on many workloads. The larger size wins when queries spill to remote disk on the smaller size.',
  },
  {
    q: 'When do I need multi-cluster warehouses?',
    a: 'Multi-cluster is for concurrency, not data volume. If 30+ dashboard users fire queries simultaneously and some queue for >10s, enable multi-cluster with auto-scale. It will spin up additional clusters only when needed.',
  },
  {
    q: 'What about auto-suspend?',
    a: 'Set auto-suspend to 60 seconds for interactive dashboards (fast resume, low waste) and 300–600 seconds for ETL pipelines (avoid repeated cold-start overhead). Never run a warehouse 24/7 unless it is genuinely busy 24/7.',
  },
  {
    q: 'Should dev and prod share a warehouse?',
    a: 'No. Use separate small warehouses (XS for dev, sized-to-SLA for prod) so one runaway dev query cannot slow production dashboards. Use resource monitors to cap dev spend.',
  },
];

function recommendSize(workload, dataGB, concurrency) {
  // Heuristic ladder: bigger of "data volume needs" vs "concurrency needs"
  // Data volume ladder (bytes scanned per query)
  let volumeIdx = 0; // XS
  if (dataGB <= 2) volumeIdx = 0;         // XS
  else if (dataGB <= 20) volumeIdx = 1;   // S
  else if (dataGB <= 100) volumeIdx = 2;  // M
  else if (dataGB <= 500) volumeIdx = 3;  // L
  else if (dataGB <= 2000) volumeIdx = 4; // XL
  else if (dataGB <= 8000) volumeIdx = 5; // 2XL
  else if (dataGB <= 30000) volumeIdx = 6; // 3XL
  else volumeIdx = 7;                      // 4XL+

  // Concurrency ladder (for BI workloads we favor one size up, plus multi-cluster)
  let concurrencyIdx = 0;
  if (concurrency <= 5) concurrencyIdx = 0;
  else if (concurrency <= 15) concurrencyIdx = 1;
  else if (concurrency <= 40) concurrencyIdx = 2;
  else concurrencyIdx = 3;

  // For dashboards, latency SLA is tight — nudge up one size on large data
  let idx = Math.max(volumeIdx, concurrencyIdx);
  if (workload === 'dashboard' && dataGB > 20) idx = Math.min(idx + 1, WAREHOUSE_SIZES.length - 1);
  if (workload === 'dev') idx = 0; // force XS for dev

  // Multi-cluster advice
  const multiCluster = (workload === 'dashboard' && concurrency > 20);
  const clusters = multiCluster ? Math.min(6, Math.ceil(concurrency / 10)) : 1;

  return { sizeIdx: idx, clusters, multiCluster };
}

export default function WarehouseSizingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workload, setWorkload] = useState(() => searchParams.get('w') || 'dashboard');
  const [dataGB, setDataGB] = useState(() => Number(searchParams.get('d')) || 50);
  const [concurrency, setConcurrency] = useState(() => Number(searchParams.get('u')) || 10);
  const [hoursPerDay, setHoursPerDay] = useState(() => Number(searchParams.get('h')) || 8);
  const [editionId, setEditionId] = useState(() => searchParams.get('e') || 'enterprise');
  const [regionId, setRegionId] = useState(() => searchParams.get('r') || 'aws-us-east');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams({
        w: workload,
        d: String(dataGB),
        u: String(concurrency),
        h: String(hoursPerDay),
        e: editionId,
        r: regionId,
      }, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [workload, dataGB, concurrency, hoursPerDay, editionId, regionId, setSearchParams]);

  const result = useMemo(() => {
    const rec = recommendSize(workload, dataGB, concurrency);
    const size = WAREHOUSE_SIZES[rec.sizeIdx];
    const ed = EDITIONS.find(e => e.id === editionId) || EDITIONS[1];
    const rg = REGIONS.find(r => r.id === regionId) || REGIONS[0];
    const pricePerCredit = rg.creditPrice * ed.multiplier;
    const monthlyHours = Math.max(0, hoursPerDay) * 22; // weekdays
    const monthlyCredits = size.creditsPerHour * monthlyHours * rec.clusters;
    const monthlyCost = monthlyCredits * pricePerCredit;

    // Compare with one-size-down
    const downIdx = Math.max(0, rec.sizeIdx - 1);
    const downSize = WAREHOUSE_SIZES[downIdx];
    const downMonthlyCost = downSize.creditsPerHour * monthlyHours * rec.clusters * pricePerCredit;
    // one-size-up
    const upIdx = Math.min(WAREHOUSE_SIZES.length - 1, rec.sizeIdx + 1);
    const upSize = WAREHOUSE_SIZES[upIdx];
    const upMonthlyCost = upSize.creditsPerHour * monthlyHours * rec.clusters * pricePerCredit;

    return {
      size,
      clusters: rec.clusters,
      multiCluster: rec.multiCluster,
      pricePerCredit,
      monthlyCredits,
      monthlyCost,
      downSize,
      downMonthlyCost,
      upSize,
      upMonthlyCost,
    };
  }, [workload, dataGB, concurrency, hoursPerDay, editionId, regionId]);

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
    name: 'Snowflake Warehouse Sizing Estimator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Free Snowflake warehouse sizing estimator. Pick workload type, data volume, and concurrency — get the right T-shirt size.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/snowflake-warehouse-sizing',
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
        title="Snowflake Warehouse Sizing Estimator 2026 — Pick XS–6XL by Workload"
        description="Which Snowflake warehouse size should you use? Enter workload type, data volume and concurrency — get an instant XS–6XL recommendation plus monthly cost."
        keywords="snowflake warehouse size, snowflake warehouse sizing, snowflake warehouse recommendation, which warehouse size snowflake, t-shirt size snowflake"
        url="/tools/snowflake-warehouse-sizing"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Warehouse Sizing Estimator', url: '/tools/snowflake-warehouse-sizing' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 rounded-full">
            Heuristic recommendation · Based on public Snowflake sizing patterns · Updated April 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-400" aria-hidden="true" />
            Snowflake Warehouse Sizing Estimator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Get a starting-point warehouse size (XS to 6XL) based on workload type, data volume,
            and concurrency. Use it as a first cut, then right-size with real query profiles.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Workload profile</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" /> Workload type
                  </label>
                  <select
                    value={workload}
                    onChange={e => setWorkload(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {WORKLOAD_TYPES.map(w => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <HardDrive className="w-4 h-4 text-blue-400" /> Data scanned per query (GB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={dataGB}
                    onChange={e => setDataGB(Number(e.target.value) || 0)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Users className="w-4 h-4 text-blue-400" /> Concurrent users / queries
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={concurrency}
                    onChange={e => setConcurrency(Number(e.target.value) || 1)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Active hours per day
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="1"
                    value={hoursPerDay}
                    onChange={e => setHoursPerDay(Number(e.target.value) || 0)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl rounded-2xl border border-purple-700/50 p-6 lg:sticky lg:top-4"
            >
              <div className="text-sm text-gray-300 mb-2">Recommended size</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2" aria-live="polite">
                {result.size.label}
              </div>
              <div className="text-sm text-gray-300 mb-4">
                {result.size.creditsPerHour} credit{result.size.creditsPerHour > 1 ? 's' : ''}/hour
                {result.multiCluster && (
                  <> · <span className="text-purple-300">multi-cluster × {result.clusters}</span></>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
                <div className="flex justify-between"><span className="text-gray-400">Est. monthly cost</span><span className="text-white font-mono">{formatUSD(result.monthlyCost)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Monthly credits</span><span className="text-white font-mono">{result.monthlyCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Price per credit</span><span className="text-white font-mono">{formatUSD(result.pricePerCredit)}</span></div>
              </div>

              <div className="mt-4 p-3 bg-slate-900/60 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Try one size down ({result.downSize.label})</span><span className="text-gray-300 font-mono">{formatUSD(result.downMonthlyCost)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Try one size up ({result.upSize.label})</span><span className="text-gray-300 font-mono">{formatUSD(result.upMonthlyCost)}</span></div>
              </div>

              <button
                onClick={handleShare}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
              >
                {copied ? (<><Check className="w-4 h-4 text-green-400" aria-hidden="true" /> Link copied</>) : (<><Share2 className="w-4 h-4" aria-hidden="true" /> Share recommendation</>)}
              </button>
              <p className="text-[11px] text-gray-500 mt-4">
                Starting-point only. Always validate with a query profile on production data.
              </p>
            </motion.div>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <ValidateWithSqlBlock
          title="Validate your warehouse size with real load + queue data"
          description="WAREHOUSE_LOAD_HISTORY tells you if queries are queueing (size up) or the warehouse is idle (size down or add auto-suspend). Run this after a representative week of usage."
          sql={`-- Snowflake: hourly load + queue pattern (last 7 days)
SELECT
  WAREHOUSE_NAME,
  DATE_TRUNC('hour', START_TIME) AS hour,
  ROUND(AVG(AVG_RUNNING), 2) AS avg_running,
  ROUND(AVG(AVG_QUEUED_LOAD), 2) AS avg_queued_load,
  ROUND(AVG(AVG_QUEUED_PROVISIONING), 2) AS avg_queued_provisioning
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_LOAD_HISTORY
WHERE START_TIME >= DATEADD('day', -7, CURRENT_DATE())
  AND WAREHOUSE_NAME = '<YOUR_WAREHOUSE>'
GROUP BY 1, 2
ORDER BY 2 DESC
LIMIT 72;`}
          note="Rule of thumb: if avg_queued_load > 0 during peak hours, size up one step or enable multi-cluster. If avg_running < 0.3, size down."
        />

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How to validate your size</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-300">
            <li>Create the recommended warehouse and run your top 10 queries against production data.</li>
            <li>Open each query's <strong>Query Profile</strong> — check for "Bytes spilled to remote storage". Any remote spill means the size is too small.</li>
            <li>Check the <strong>WAREHOUSE_LOAD_HISTORY</strong> view. If average load is consistently &gt;1.0, consider multi-cluster.</li>
            <li>For BI workloads, watch <strong>QUEUED_LOAD_PERCENTAGE</strong>. If queries sit in queue &gt;10s, enable multi-cluster auto-scale.</li>
            <li>After one week, review <strong>WAREHOUSE_METERING_HISTORY</strong> and right-size down if utilization is low.</li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How the sizing recommendation works</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Snowflake warehouse sizes follow a doubling pattern: each step up
              <strong> doubles both the credit rate and the compute power</strong> (cores, memory,
              local SSD). The recommendation engine balances three signals:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Working-set size</strong> vs. local cache — if your hottest data fits in the warehouse's SSD, scans go 5–10x faster.</li>
              <li><strong>Concurrency</strong> — BI workloads with &gt;8 concurrent users usually need multi-cluster, not a bigger single warehouse.</li>
              <li><strong>Query shape</strong> — heavy joins and window functions benefit most from size bumps; simple filters rarely do.</li>
            </ul>
            <p className="font-mono text-xs bg-slate-900/70 border border-slate-700 rounded-lg p-3 text-blue-300">
              Size up when queries spill to remote storage. Add clusters when queries queue. Never both at once.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Worked example: BI dashboard with 40 users</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              A Tableau deployment where 40 analysts hit dashboards sporadically throughout the day
              (avg 3 concurrent, peak 15). Data volume per query: 2–20 GB. Current setup:
              <strong> 1× Large (8 cr/hr)</strong>, always-on during business hours = $1,920/month on Enterprise.
            </p>
            <p>The estimator recommends:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Drop to <strong>Medium</strong> (4 cr/hr) with <strong>multi-cluster max=3</strong></li>
              <li>Set auto-suspend to <strong>60s</strong> (default 10 min wastes money between clicks)</li>
              <li>Expected monthly: ~$850 — <span className="text-green-400">~56% savings</span></li>
            </ul>
            <p>
              Why it works: with bursty BI traffic, you only pay for the extra clusters when queries
              actually queue. The dashboard feels <em>faster</em> because cluster 2/3 spin up in
              seconds when load spikes, instead of piling work onto a single big warehouse.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Full Snowflake Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Monthly spend across compute, storage, cloud services, and serverless.</div>
            </Link>
            <Link to="/tools/snowflake-query-cost-estimator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Query Cost Estimator →</div>
              <div className="text-gray-400 text-sm">Estimate single-query cost from bytes scanned.</div>
            </Link>
            <Link to="/tools/snowflake-credit-cost" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Credit → USD Converter →</div>
              <div className="text-gray-400 text-sm">Convert credits to dollars by edition and region.</div>
            </Link>
            <Link to="/articles/snowflake-cost-optimization-techniques-2026" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">12 cost optimization techniques →</div>
              <div className="text-gray-400 text-sm">Warehouse right-sizing is #1 lever — full playbook.</div>
            </Link>
            <Link to="/tools/databricks-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Databricks Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Equivalent cluster-sizing problem on the lakehouse side.</div>
            </Link>
            <Link to="/tools/bigquery-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">BigQuery Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Slot-based vs on-demand sizing for BigQuery.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-cost-optimization-interview" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Cost Optimization Interview Q&A →</div>
              <div className="text-gray-400 text-sm">Expert-level sizing, auto-suspend, and resource-monitor questions.</div>
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
