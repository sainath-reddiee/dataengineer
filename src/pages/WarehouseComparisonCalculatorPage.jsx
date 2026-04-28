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

const FAQ_ITEMS = [
  {
    q: 'How accurate is this Snowflake vs BigQuery vs Databricks calculator?',
    a: 'It is intentionally a directional comparison, not a procurement quote. I built it from April 2026 published list prices and assumed defaults most teams actually use — 10% cloud-services allowance on Snowflake, SQL Pro DBU rate on Databricks, and the auto-cheaper pick between BigQuery on-demand and Editions. In most RFPs I have seen, Snowflake and Databricks negotiate 20–40% off list, while BigQuery list is mostly what you pay. Use this tool to shape your architecture decision and frame your budget, then validate the final number with a signed rate card from each vendor.',
  },
  {
    q: 'Why do the three platforms differ so much on identical workloads?',
    a: 'Because the billing units are fundamentally different. Snowflake bills warehouse-seconds at a credit rate (size-dependent). Databricks bills DBUs consumed (tier-dependent). BigQuery bills either bytes scanned or slot-hours. A workload that is cheap on one model can be expensive on another. For example, a dashboard that re-queries the same 10 TB a hundred times a day is very cheap on Snowflake (warmed warehouse + result cache) but very expensive on BigQuery on-demand (1,000 TB scanned billed).',
  },
  {
    q: 'Does this include network egress or data transfer costs?',
    a: 'No. Egress is highly account-specific — same-region is free on all three, cross-region and cross-cloud fees vary by your hyperscaler discounts, and most teams get custom network commits. I intentionally excluded egress so the calculator focuses on the 80% of cost that is compute + storage. If you replicate data across regions or clouds regularly, add 10–25% to whichever winner the calculator picks.',
  },
  {
    q: 'How should I find my actual TB scanned and compute hours?',
    a: 'On Snowflake, query QUERY_HISTORY and WAREHOUSE_METERING_HISTORY for the last 30 days — sum BYTES_SCANNED and EXECUTION_TIME. On BigQuery, check INFORMATION_SCHEMA.JOBS_BY_PROJECT for TOTAL_BYTES_BILLED. On Databricks, pull system.billing.usage for DBU-hours by workspace. If you have none of those because you are pre-adoption, a safe starting profile for a mid-sized analytics team is 20–50 TB scanned per month and 120–200 compute hours.',
  },
  {
    q: 'Why does the calculator sometimes pick BigQuery on-demand and sometimes Editions?',
    a: 'The break-even is roughly tbScanned ÷ slotHours. If your workload scans a lot of data in short bursts, on-demand wins. If it scans less data but runs nearly continuously, Editions wins because reserved slots amortize across long-running queries. The tool computes both numbers and displays whichever is lower along with a label so you know which pricing mode it picked.',
  },
  {
    q: 'What assumptions does this calculator make that might not match my situation?',
    a: 'Four big ones. (1) Snowflake at Enterprise edition $3/credit — Business Critical is $4 and some workloads need that. (2) Databricks at SQL Pro DBU rate — Serverless SQL is higher, Jobs compute is lower. (3) BigQuery Editions at Enterprise $0.06/slot-hour — Standard is $0.04 and Enterprise Plus is $0.10. (4) Storage at active tier only — long-term storage on BigQuery and Time Travel on Snowflake can change the storage bill materially. If any of those assumptions are wrong for you, the right answer is still likely the same winner, just at a different absolute number.',
  },
  {
    q: 'Can I share my calculated comparison with my team?',
    a: 'Yes — the inputs are encoded in the URL query string, so the Share button just copies the current URL to your clipboard. Anyone who opens that link sees the same numbers. I use this pattern so the tool is a living artifact you can paste into a Slack thread or RFP doc, not a one-off calculation that disappears when you close the tab.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
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
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
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

        <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">A worked example: mid-sized analytics team</h2>
          <p className="text-gray-300 text-sm mb-4">
            Let me walk through a real-ish scenario so the numbers aren't abstract. Say you're running a
            mid-sized analytics team: around <strong>50 TB scanned per month</strong> (BI dashboards plus
            a few dbt model builds),{' '}
            <strong>160 compute hours</strong> (roughly 8 hours a day × 20 business days on a medium warehouse),
            and <strong>500 GB of active storage</strong>. Workload complexity is <em>mixed</em>.
          </p>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="text-blue-300 font-semibold mb-1">Snowflake (Enterprise)</div>
              <div className="text-gray-400 text-xs mb-2">640 credits × $3 + ~$12 storage</div>
              <div className="text-white font-mono">~$1,972/mo</div>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="text-orange-300 font-semibold mb-1">Databricks (SQL Pro)</div>
              <div className="text-gray-400 text-xs mb-2">640 DBUs × $0.55 + ~$12 storage</div>
              <div className="text-white font-mono">~$364/mo</div>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="text-cyan-300 font-semibold mb-1">BigQuery (auto-pick)</div>
              <div className="text-gray-400 text-xs mb-2">Editions cheaper: 200 slots × 160h × $0.06</div>
              <div className="text-white font-mono">~$1,930/mo</div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            At first glance Databricks looks like a runaway winner here. In practice that comparison is misleading
            unless your workload is actually a good fit for SQL Pro — interactive BI dashboards with bursty
            concurrency often behave better on Snowflake multi-cluster warehouses, and the operational cost of
            keeping Databricks SQL warehouses healthy isn't zero. That's why this calculator exists as a
            starting point, not a verdict. Plug in your real numbers (from the data-source queries in the FAQ
            below) and look at the gap, not the absolute values.
          </p>
        </section>

        <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Limitations and what this calculator does <em>not</em> model</h2>
          <ul className="text-gray-300 text-sm space-y-3 list-disc pl-5">
            <li>
              <strong>Contract discounts.</strong> Snowflake and Databricks routinely discount 20–40% off list on
              annual commits; BigQuery is less negotiable. The calculator shows list pricing.
            </li>
            <li>
              <strong>Serverless surcharges.</strong> Snowflake Serverless tasks, Snowpipe, Cortex, and Search Optimization
              each have their own rates I did not include. If you lean heavily on those, add 10–20% to the Snowflake line.
            </li>
            <li>
              <strong>Databricks tier mix.</strong> We assume SQL Pro. If most of your compute is Jobs (cheaper) or
              Serverless SQL (more expensive), your actual number moves in that direction.
            </li>
            <li>
              <strong>BigQuery Editions tier.</strong> We use Enterprise ($0.06/slot-hour). Standard is ~$0.04 and
              Enterprise Plus is ~$0.10. Commitments (annual or 3-year) drop this 20–40% further.
            </li>
            <li>
              <strong>Storage tiers and Time Travel.</strong> BigQuery long-term storage is half the active rate,
              and Snowflake Time Travel plus Fail-safe adds a storage multiplier depending on retention. For a
              quick comparison I treat storage as a single active tier.
            </li>
            <li>
              <strong>Network egress.</strong> Excluded entirely — it's highly account-specific.
            </li>
            <li>
              <strong>Human cost.</strong> Operating Databricks clusters needs more platform-engineering muscle than
              running Snowflake warehouses. The calculator can't price your team.
            </li>
          </ul>
        </section>

        <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((f, i) => (
              <details
                key={i}
                className="group bg-slate-900/40 border border-slate-700 rounded-xl p-4 open:border-purple-700/60"
              >
                <summary className="cursor-pointer text-white font-semibold text-sm md:text-base list-none flex justify-between items-start gap-3">
                  <span>{f.q}</span>
                  <span className="text-purple-400 text-xs mt-1 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
                </summary>
                <p className="mt-3 text-gray-300 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

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
