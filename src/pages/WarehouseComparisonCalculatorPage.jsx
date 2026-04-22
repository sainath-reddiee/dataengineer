// src/pages/WarehouseComparisonCalculatorPage.jsx
// Cross-platform data warehouse cost comparison: Snowflake vs BigQuery vs Databricks.
// Input normalized workload (TB scanned, compute hours, storage GB) once,
// get three side-by-side cost estimates to pick the cheapest for your pattern.
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Scale, Share2, Check, Cloud, TrendingDown, BookOpen } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Normalized workload inputs — intentionally simple so the three cost models
// can be evaluated against identical assumptions.
const DEFAULT_INPUTS = {
  tbScannedPerMonth: 50,   // TB queried per month (BigQuery on-demand anchor)
  computeHoursPerMonth: 160, // warehouse/cluster hours (Snowflake/Databricks anchor)
  storageGB: 500,          // total active storage
  complexity: 'mixed',     // 'light' | 'mixed' | 'heavy' — scales credits/slot hours
};

const COMPLEXITY_FACTORS = {
  light: { sfCreditsPerHour: 2, dbxDBUsPerHour: 2, bqSlotsEquiv: 100 },   // S-sized, ad-hoc
  mixed: { sfCreditsPerHour: 4, dbxDBUsPerHour: 4, bqSlotsEquiv: 200 },   // M-sized, dashboards + ETL
  heavy: { sfCreditsPerHour: 8, dbxDBUsPerHour: 8, bqSlotsEquiv: 400 },   // L-sized, heavy ETL/ML
};

// Published list prices (April 2026). Share link CTA explicitly notes contract
// discounts apply — this is a relative comparison tool, not a procurement quote.
const PRICING = {
  snowflake: {
    label: 'Snowflake',
    accent: 'blue',
    creditPrice: 3,          // Enterprise avg ($2 Std / $3 Ent / $4 BC)
    storagePerGB: 0.023,     // on-demand $23/TB
    cloudServicesFreeAllowancePct: 0.10,
  },
  databricks: {
    label: 'Databricks',
    accent: 'orange',
    dbuPrice: 0.55,          // SQL Pro average across clouds
    storagePerGB: 0.023,     // S3/ADLS passthrough (very similar to SF)
  },
  bigquery: {
    label: 'BigQuery',
    accent: 'cyan',
    onDemandPerTB: 6.25,
    editionsPerSlotHour: 0.06, // Enterprise
    storagePerGB: 0.02,       // Active
  },
};

const formatUSD = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function estimate(inputs) {
  const complexity = COMPLEXITY_FACTORS[inputs.complexity] || COMPLEXITY_FACTORS.mixed;

  // --- Snowflake: credits × hours × $/credit + storage + cloud services (10% free)
  const sfComputeCredits = complexity.sfCreditsPerHour * inputs.computeHoursPerMonth;
  const sfComputeCost = sfComputeCredits * PRICING.snowflake.creditPrice;
  const sfStorageCost = inputs.storageGB * PRICING.snowflake.storagePerGB;
  // Assume cloud services at ~12% of compute (just 2% billable after 10% allowance)
  const sfCloudServicesCost = sfComputeCost * 0.02;
  const sfTotal = sfComputeCost + sfStorageCost + sfCloudServicesCost;

  // --- Databricks: DBUs × hours × $/DBU + storage
  const dbxDBUs = complexity.dbxDBUsPerHour * inputs.computeHoursPerMonth;
  const dbxComputeCost = dbxDBUs * PRICING.databricks.dbuPrice;
  const dbxStorageCost = inputs.storageGB * PRICING.databricks.storagePerGB;
  const dbxTotal = dbxComputeCost + dbxStorageCost;

  // --- BigQuery: show BOTH on-demand ($/TB) and Editions ($/slot-hour), pick cheaper
  const bqOnDemand = inputs.tbScannedPerMonth * PRICING.bigquery.onDemandPerTB;
  const bqEditions = complexity.bqSlotsEquiv * inputs.computeHoursPerMonth * PRICING.bigquery.editionsPerSlotHour;
  const bqComputeCost = Math.min(bqOnDemand, bqEditions);
  const bqPricingMode = bqOnDemand <= bqEditions ? 'On-demand' : 'Editions';
  const bqStorageCost = inputs.storageGB * PRICING.bigquery.storagePerGB;
  const bqTotal = bqComputeCost + bqStorageCost;

  const totals = [
    { id: 'snowflake', label: 'Snowflake', total: sfTotal, compute: sfComputeCost, storage: sfStorageCost, note: `${sfComputeCredits.toFixed(0)} credits/mo` },
    { id: 'databricks', label: 'Databricks', total: dbxTotal, compute: dbxComputeCost, storage: dbxStorageCost, note: `${dbxDBUs.toFixed(0)} DBUs/mo (SQL Pro)` },
    { id: 'bigquery', label: 'BigQuery', total: bqTotal, compute: bqComputeCost, storage: bqStorageCost, note: `${bqPricingMode} cheaper here` },
  ];

  const cheapest = [...totals].sort((a, b) => a.total - b.total)[0];
  const mostExpensive = [...totals].sort((a, b) => b.total - a.total)[0];

  return { totals, cheapest, mostExpensive };
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cloud Data Warehouse Cost Comparison',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function WarehouseComparisonCalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputs, setInputs] = useState(() => {
    const tb = Number(searchParams.get('tb'));
    const h = Number(searchParams.get('h'));
    const g = Number(searchParams.get('g'));
    const c = searchParams.get('c');
    return {
      tbScannedPerMonth: !isNaN(tb) && tb > 0 ? tb : DEFAULT_INPUTS.tbScannedPerMonth,
      computeHoursPerMonth: !isNaN(h) && h > 0 ? h : DEFAULT_INPUTS.computeHoursPerMonth,
      storageGB: !isNaN(g) && g > 0 ? g : DEFAULT_INPUTS.storageGB,
      complexity: ['light', 'mixed', 'heavy'].includes(c) ? c : DEFAULT_INPUTS.complexity,
    };
  });
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => estimate(inputs), [inputs]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(
        {
          tb: String(inputs.tbScannedPerMonth),
          h: String(inputs.computeHoursPerMonth),
          g: String(inputs.storageGB),
          c: inputs.complexity,
        },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [inputs, setSearchParams]);

  const update = useCallback((patch) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <MetaTags
        title="Snowflake vs BigQuery vs Databricks Cost Calculator (2026)"
        description="Compare monthly costs across Snowflake, Google BigQuery, and Databricks with a single unified input. See which warehouse is cheapest for your workload pattern."
        canonical="/tools/cloud-data-warehouse-cost-comparison"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-purple-300 bg-purple-900/30 border border-purple-700/50 rounded-full">
            Updated April 2026 · Unified comparison · Client-side
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Scale className="w-8 h-8 text-purple-400" aria-hidden="true" />
            Cloud Data Warehouse Cost Comparison
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Enter one workload profile — TB scanned, compute hours, storage — and see an
            apples-to-apples cost estimate across <strong>Snowflake</strong>,{' '}
            <strong>Google BigQuery</strong>, and <strong>Databricks</strong>. Uses published list
            pricing as of April 2026. Great for pre-RFP sizing and migration budget framing.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Workload profile</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="cmp-tb" className="block text-sm font-medium text-gray-300 mb-2">
                    TB scanned per month
                  </label>
                  <input
                    id="cmp-tb"
                    type="number"
                    min="0"
                    step="5"
                    value={inputs.tbScannedPerMonth}
                    onChange={(e) => update({ tbScannedPerMonth: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    BigQuery on-demand anchor. Find yours via QUERY_HISTORY bytes_scanned.
                  </p>
                </div>
                <div>
                  <label htmlFor="cmp-hours" className="block text-sm font-medium text-gray-300 mb-2">
                    Compute hours per month
                  </label>
                  <input
                    id="cmp-hours"
                    type="number"
                    min="0"
                    step="10"
                    value={inputs.computeHoursPerMonth}
                    onChange={(e) => update({ computeHoursPerMonth: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Warehouse/cluster uptime. 160 = 8h × 20 business days.
                  </p>
                </div>
                <div>
                  <label htmlFor="cmp-storage" className="block text-sm font-medium text-gray-300 mb-2">
                    Active storage (GB)
                  </label>
                  <input
                    id="cmp-storage"
                    type="number"
                    min="0"
                    step="50"
                    value={inputs.storageGB}
                    onChange={(e) => update({ storageGB: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label htmlFor="cmp-complexity" className="block text-sm font-medium text-gray-300 mb-2">
                    Workload complexity
                  </label>
                  <select
                    id="cmp-complexity"
                    value={inputs.complexity}
                    onChange={(e) => update({ complexity: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="light">Light (ad-hoc, S/XS)</option>
                    <option value="mixed">Mixed (dashboards + ETL, M)</option>
                    <option value="heavy">Heavy (ML / big ETL, L+)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Why the numbers differ</h3>
              <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
                <li><strong>Snowflake</strong> bills per-second of warehouse uptime at a credit rate driven by size. Cloud services get a free 10% allowance.</li>
                <li><strong>Databricks</strong> bills per-DBU consumed; DBU rate varies by compute tier (SQL Pro, Serverless, Jobs). Here we use SQL Pro list.</li>
                <li><strong>BigQuery</strong> has two modes: on-demand ($6.25/TB scanned) or Editions ($0.04–$0.10/slot-hour). The calculator auto-picks the cheaper for your shape.</li>
                <li>Storage is roughly the same everywhere (~$20–$23/TB/month for active); networking egress is NOT included.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl rounded-2xl border border-purple-700/50 p-6 lg:sticky lg:top-4"
            >
              <div className="text-sm text-gray-300 mb-3">Monthly cost by platform</div>

              <div className="space-y-3" aria-live="polite">
                {result.totals
                  .slice()
                  .sort((a, b) => a.total - b.total)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border ${
                        p.id === result.cheapest.id
                          ? 'bg-green-900/30 border-green-700/60'
                          : p.id === result.mostExpensive.id
                            ? 'bg-slate-900/40 border-slate-700'
                            : 'bg-slate-900/40 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          <span className="text-white font-semibold">{p.label}</span>
                          {idx === 0 && (
                            <span className="text-[10px] px-2 py-0.5 bg-green-800/60 text-green-200 rounded-full uppercase tracking-wider">
                              Cheapest
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-white font-mono">
                          {formatUSD(p.total)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 flex justify-between">
                        <span>Compute {formatUSD(p.compute)} · Storage {formatUSD(p.storage)}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{p.note}</div>
                    </div>
                  ))}
              </div>

              <div className="mt-4 p-3 bg-slate-900/60 rounded-xl flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="text-xs text-green-200">
                  Switching from <strong>{result.mostExpensive.label}</strong> to{' '}
                  <strong>{result.cheapest.label}</strong> saves{' '}
                  <strong>{formatUSD(result.mostExpensive.total - result.cheapest.total)}</strong>/month
                  on this workload shape.
                </div>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
              >
                {copied
                  ? (<><Check className="w-4 h-4 text-green-400" aria-hidden="true" /> Link copied</>)
                  : (<><Share2 className="w-4 h-4" aria-hidden="true" /> Share this comparison</>)}
              </button>

              <p className="text-[11px] text-gray-500 mt-4">
                List pricing. Real RFP contracts typically see 20–40% discounts on Snowflake and
                Databricks; BigQuery pricing is much less negotiable at list.
              </p>
            </motion.div>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" aria-hidden="true" />
            Need a deeper dive on one platform?
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <Link to="/tools/snowflake-cost-calculator" className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-700 transition-colors">
              <div className="text-white font-semibold mb-1">Snowflake Cost Calculator</div>
              <div className="text-gray-400 text-xs">Edition × warehouse size × hours, plus serverless (Cortex, Snowpipe).</div>
            </Link>
            <Link to="/tools/bigquery-cost-calculator" className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-700 transition-colors">
              <div className="text-white font-semibold mb-1">BigQuery Cost Calculator</div>
              <div className="text-gray-400 text-xs">On-demand vs Editions break-even, streaming, storage tiers.</div>
            </Link>
            <Link to="/tools/databricks-cost-calculator" className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-slate-700 transition-colors">
              <div className="text-white font-semibold mb-1">Databricks Cost Calculator</div>
              <div className="text-gray-400 text-xs">DBU rate by tier, instance types, cluster uptime.</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
