// src/pages/DatabricksCostPage.jsx
// Databricks DBU-based cost calculator. Targets queries like
// "databricks cost calculator", "databricks dbu cost", "databricks vs snowflake cost".
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Cloud, Share2, Check, Calculator, DollarSign, Server, Zap } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Databricks DBU rates as of early 2026 (list pricing).
// Sources: publicly documented on databricks.com/product/pricing
const DBU_RATES = [
  { id: 'all-purpose-standard',   label: 'All-Purpose Compute — Standard',    dbuRate: 0.40 },
  { id: 'all-purpose-premium',    label: 'All-Purpose Compute — Premium',     dbuRate: 0.55 },
  { id: 'all-purpose-enterprise', label: 'All-Purpose Compute — Enterprise',  dbuRate: 0.65 },
  { id: 'jobs-standard',          label: 'Jobs Compute — Standard',           dbuRate: 0.15 },
  { id: 'jobs-premium',           label: 'Jobs Compute — Premium',            dbuRate: 0.22 },
  { id: 'jobs-photon',            label: 'Jobs Compute — Photon (Premium)',   dbuRate: 0.22 },
  { id: 'sql-classic',            label: 'SQL Compute — Classic (Premium)',   dbuRate: 0.22 },
  { id: 'sql-pro',                label: 'SQL Compute — Pro (Premium)',       dbuRate: 0.55 },
  { id: 'sql-serverless',         label: 'SQL Compute — Serverless (Premium)', dbuRate: 0.70 },
  { id: 'dlt-core',               label: 'Delta Live Tables — Core',          dbuRate: 0.20 },
  { id: 'dlt-pro',                label: 'Delta Live Tables — Pro',           dbuRate: 0.25 },
  { id: 'dlt-advanced',           label: 'Delta Live Tables — Advanced',      dbuRate: 0.36 },
  { id: 'model-serving',          label: 'Model Serving (Serverless)',        dbuRate: 0.07 },
];

// Representative instance DBU-per-hour values for common cluster sizes.
// These are approximations — real DBU consumption varies by instance family.
const INSTANCE_TYPES = [
  { id: 'small',   label: 'Small (m5.xlarge, ~4 vCPU / 16 GB)',   dbuPerHour: 1.0 },
  { id: 'medium',  label: 'Medium (m5.2xlarge, ~8 vCPU / 32 GB)', dbuPerHour: 2.0 },
  { id: 'large',   label: 'Large (m5.4xlarge, ~16 vCPU / 64 GB)', dbuPerHour: 4.0 },
  { id: 'xlarge',  label: 'XLarge (m5.8xlarge, ~32 vCPU / 128 GB)', dbuPerHour: 8.0 },
  { id: 'mem-lg',  label: 'Memory-Optimized (r5.4xlarge)',         dbuPerHour: 5.5 },
  { id: 'gpu',     label: 'GPU (g4dn.xlarge)',                     dbuPerHour: 3.0 },
];

const formatUSD = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const FAQ = [
  {
    q: 'How is Databricks pricing calculated?',
    a: 'Databricks charges in DBUs (Databricks Units) per hour. Total cost = DBUs consumed × DBU rate × hours, plus the underlying cloud VM cost (billed separately by AWS/Azure/GCP). A DBU is a unit of processing capability — roughly 1 DBU/hour for a small cluster. Rates differ by workload (Jobs, All-Purpose, SQL) and tier (Standard, Premium, Enterprise).',
  },
  {
    q: 'What is the difference between Jobs Compute and All-Purpose Compute?',
    a: 'Jobs Compute is for automated, scheduled workloads (ETL, scheduled notebooks) and is cheapest at $0.15–$0.22/DBU. All-Purpose Compute is for interactive notebook work and ad-hoc exploration and costs $0.40–$0.65/DBU — roughly 2–3x more. Always use Jobs Compute for production pipelines.',
  },
  {
    q: 'Does this calculator include cloud VM costs?',
    a: 'No. Databricks DBUs cover the Databricks software charge only. You also pay the underlying EC2/Azure VM/GCE compute cost directly to the cloud provider. As a rough rule, VM cost is roughly 30–60% on top of the DBU cost for most workloads. Factor that in when comparing with Snowflake (whose credits are all-in).',
  },
  {
    q: 'How does Databricks pricing compare to Snowflake?',
    a: 'Snowflake charges per credit consumed; a credit is warehouse-size independent in price but size-dependent in credits-per-hour (XS = 1/hr, S = 2/hr, M = 4/hr, doubling each step). Databricks charges DBU × rate + VM cost. For similar compute capacity, Databricks Jobs Compute is often cheaper on paper but requires separate VM billing and more tuning. Snowflake is simpler to budget, Databricks more flexible.',
  },
  {
    q: 'What is Photon and how does it affect cost?',
    a: 'Photon is Databricks\' vectorized query engine. It is 2–5x faster on analytical SQL than classic Spark but consumes DBUs at the same Premium rate ($0.22/DBU for Jobs Photon). Net effect: lower cost for analytical workloads because faster completion outweighs the equal rate.',
  },
  {
    q: 'Are there discounts on list DBU rates?',
    a: 'Yes — Databricks commitment contracts (DB Commit Units, annual/multi-year) typically discount 15–40% off list. On-demand workloads pay full list. Large enterprise deals can reach 50%+ via pre-purchase of DBU pools.',
  },
  {
    q: 'How accurate is the DBU-per-hour estimate for an instance?',
    a: 'The values in this calculator are approximations for representative instance families on AWS. Real DBU consumption depends on exact instance SKU, autoscaling behavior, Photon usage, and Spot vs On-Demand. Always verify against your Databricks billing usage report for authoritative figures.',
  },
];

export default function DatabricksCostPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rateId, setRateId] = useState(() => searchParams.get('r') || 'jobs-premium');
  const [instanceId, setInstanceId] = useState(() => searchParams.get('i') || 'medium');
  const [clusterSize, setClusterSize] = useState(() => {
    const v = Number(searchParams.get('n'));
    return isFinite(v) && v > 0 ? v : 4;
  });
  const [hoursPerDay, setHoursPerDay] = useState(() => {
    const v = Number(searchParams.get('h'));
    return isFinite(v) && v >= 0 ? v : 8;
  });
  const [daysPerMonth, setDaysPerMonth] = useState(() => {
    const v = Number(searchParams.get('d'));
    return isFinite(v) && v >= 0 ? v : 22;
  });
  const [vmCostPct, setVmCostPct] = useState(() => {
    const v = Number(searchParams.get('v'));
    return isFinite(v) && v >= 0 ? v : 45;
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(
        {
          r: rateId,
          i: instanceId,
          n: String(clusterSize),
          h: String(hoursPerDay),
          d: String(daysPerMonth),
          v: String(vmCostPct),
        },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [rateId, instanceId, clusterSize, hoursPerDay, daysPerMonth, vmCostPct, setSearchParams]);

  const result = useMemo(() => {
    const rate = DBU_RATES.find((r) => r.id === rateId) || DBU_RATES[1];
    const inst = INSTANCE_TYPES.find((i) => i.id === instanceId) || INSTANCE_TYPES[1];
    const dbuPerHour = inst.dbuPerHour * Math.max(1, clusterSize);
    const totalHours = Math.max(0, hoursPerDay) * Math.max(0, daysPerMonth);
    const dbuTotal = dbuPerHour * totalHours;
    const dbuCost = dbuTotal * rate.dbuRate;
    const vmCost = dbuCost * (Math.max(0, vmCostPct) / 100);
    const total = dbuCost + vmCost;
    return {
      rate, inst,
      dbuPerHour,
      totalHours,
      dbuTotal,
      dbuCost,
      vmCost,
      total,
      perDay: total / Math.max(1, daysPerMonth),
    };
  }, [rateId, instanceId, clusterSize, hoursPerDay, daysPerMonth, vmCostPct]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, []);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Databricks Cost Calculator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Free Databricks cost calculator. Model DBU consumption by cluster type, instance, and hours. Includes VM cost factor.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/databricks-cost-calculator',
    publisher: { '@type': 'Organization', name: 'DataEngineer Hub', url: 'https://dataengineerhub.blog' },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <MetaTags
        title="Databricks Cost Calculator 2026 — DBU Pricing + VM Cost"
        description="Free Databricks cost calculator. Estimate monthly DBU spend by cluster type (Jobs, All-Purpose, SQL, Serverless), instance size, and hours. Includes VM uplift."
        keywords="databricks cost calculator, databricks dbu cost, databricks pricing calculator, databricks vs snowflake cost, dbu calculator"
        url="/tools/databricks-cost-calculator"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Databricks Cost Calculator', url: '/tools/databricks-cost-calculator' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-orange-300 bg-orange-900/30 border border-orange-700/50 rounded-full">
            Updated April 2026 · Databricks list pricing
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Cloud className="w-8 h-8 text-orange-400" />
            Databricks Cost Calculator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Model Databricks spend by DBU tier (Jobs, All-Purpose, SQL Compute, Serverless SQL,
            DLT, Model Serving) across cluster size and hours. Includes an adjustable VM cost
            uplift so you see the true all-in monthly number — not just the Databricks-only charge.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Zap className="w-4 h-4 text-orange-400" /> Compute tier
              </label>
              <select
                value={rateId}
                onChange={(e) => setRateId(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DBU_RATES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} — ${r.dbuRate.toFixed(2)}/DBU
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Server className="w-4 h-4 text-orange-400" /> Instance size
              </label>
              <select
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {INSTANCE_TYPES.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} — {i.dbuPerHour} DBU/hr
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cluster nodes</label>
              <input
                type="number"
                min="1"
                step="1"
                value={clusterSize}
                onChange={(e) => setClusterSize(Number(e.target.value) || 0)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hours/day</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value) || 0)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Days/month</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="1"
                  value={daysPerMonth}
                  onChange={(e) => setDaysPerMonth(Number(e.target.value) || 0)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                VM cost uplift (% of DBU cost)
              </label>
              <input
                type="number"
                min="0"
                max="150"
                step="5"
                value={vmCostPct}
                onChange={(e) => setVmCostPct(Number(e.target.value) || 0)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical: 30–60% for on-demand, 10–25% with Spot / Reserved / Savings Plans.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-xl rounded-2xl border border-orange-700/50 p-6"
          >
            <div className="text-sm text-gray-300 mb-2">Total monthly cost (all-in)</div>
            <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
              {formatUSD(result.total)}
            </div>
            <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
              <div className="flex justify-between"><span className="text-gray-400">DBUs per hour</span><span className="text-white font-mono">{result.dbuPerHour.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total hours / month</span><span className="text-white font-mono">{result.totalHours.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total DBUs</span><span className="text-white font-mono">{result.dbuTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">DBU cost</span><span className="text-white font-mono">{formatUSD(result.dbuCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">VM uplift ({vmCostPct}%)</span><span className="text-white font-mono">{formatUSD(result.vmCost)}</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-gray-400">Per day avg</span><span className="text-white font-mono">{formatUSD(result.perDay)}</span></div>
            </div>

            <button
              onClick={handleShare}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
            >
              {copied ? (<><Check className="w-4 h-4 text-green-400" /> Link copied</>) : (<><Share2 className="w-4 h-4" /> Share this calculation</>)}
            </button>

            <p className="text-[11px] text-gray-500 mt-4">
              List pricing. DB Commit contracts typically discount 15–40%. Cloud Spot / RIs can cut VM uplift to 10–15%.
            </p>
          </motion.div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How to use this calculator</h2>
          <ol className="list-decimal pl-5 text-gray-300 space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-white">Pick the compute tier.</strong> Production ETL pipelines
              should use <em>Jobs Compute</em> (Standard or Premium). Interactive notebook work uses
              <em> All-Purpose</em>. BI dashboards use <em>SQL Compute</em> (Classic, Pro, or
              Serverless). The tier determines the DBU rate.
            </li>
            <li>
              <strong className="text-white">Choose an instance size.</strong> Larger instances have
              higher DBU/hour but finish work faster. For steady ETL, Medium-to-Large is usually
              optimal. For Photon-accelerated SQL, XLarge often pays for itself in reduced runtime.
            </li>
            <li>
              <strong className="text-white">Set cluster nodes.</strong> DBU consumption scales
              linearly with worker count. Start small, enable autoscaling, and monitor the Spark UI.
            </li>
            <li>
              <strong className="text-white">Enter hours and days.</strong> Don't forget idle-cluster
              hours — if you don't terminate clusters promptly, you pay for them. Use the
              "Auto-termination" setting aggressively (15–30 min) to avoid bleeding DBUs.
            </li>
            <li>
              <strong className="text-white">Set VM uplift.</strong> This is the underlying EC2 /
              Azure VM / GCE charge. Default 45% is reasonable for On-Demand. Drop to 15% if you use
              Spot instances or have EC2 Savings Plans / RIs.
            </li>
          </ol>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Databricks vs Snowflake quick compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-slate-700">
                  <th className="py-2 pr-4">Dimension</th>
                  <th className="py-2 pr-4">Databricks</th>
                  <th className="py-2">Snowflake</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-slate-800 text-gray-300">
                <tr><td>Pricing unit</td><td>DBU/hour + VM cost</td><td>Credit/hour (all-in)</td></tr>
                <tr><td>Cheapest tier</td><td>Jobs Standard ($0.15/DBU)</td><td>Standard edition ($2.00/credit us-east)</td></tr>
                <tr><td>Billing transparency</td><td>Two bills (DBU + cloud VM)</td><td>One bill (credits)</td></tr>
                <tr><td>Auto-pause default</td><td>Configurable (15m–2h)</td><td>60 seconds default</td></tr>
                <tr><td>Photon / vectorized engine</td><td>Photon (Premium tiers)</td><td>Built-in by default</td></tr>
                <tr><td>Typical discount range</td><td>15–40% (DB Commit)</td><td>20–40% (capacity contracts)</td></tr>
                <tr><td>Best for</td><td>ML, streaming, Lakehouse, custom Spark</td><td>SQL analytics, BI, low-maintenance</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Snowflake Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Compare apples-to-apples with Snowflake pricing.</div>
            </Link>
            <Link to="/tools/dbt-cloud-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1 flex items-center gap-2"><DollarSign className="w-4 h-4" /> dbt Cloud Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Factor in your transformation layer cost too.</div>
            </Link>
            <Link to="/cheatsheets/databricks" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1">Databricks Cheat Sheet →</div>
              <div className="text-gray-400 text-sm">Quick reference for clusters, notebooks, and Delta Lake commands.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-cost-optimization-interview" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-xl">
              <div className="text-orange-300 font-medium mb-1">Cost Optimization Interview Questions →</div>
              <div className="text-gray-400 text-sm">Interview-grade reference on cloud DW + lakehouse cost tuning.</div>
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
                  <span className="text-orange-400 group-open:rotate-45 transition-transform text-xl">+</span>
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
