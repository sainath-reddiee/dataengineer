// src/pages/BigQueryCostPage.jsx
// BigQuery cost calculator: on-demand (per TB scanned) + flat-rate (slot-hours).
// Targets: bigquery cost calculator, bigquery pricing, bigquery slot cost.
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calculator, Cloud, BookOpen, Wand2, Share2, Check } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import ValidateWithSqlBlock from '@/components/calculator/ValidateWithSqlBlock';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// On-demand list price: $6.25 per TB scanned (first 1 TB/month free per project).
// Capacity (editions): Standard $0.04/slot-hr, Enterprise $0.06, Enterprise+ $0.10 (autoscaling).
// Storage: active $0.02/GB/mo, long-term (>90d) $0.01/GB/mo, physical ~50% discount.
// Streaming inserts (legacy API): $0.01 per 200 MB. Storage Write API: first 2 TB/mo free, then $0.025/GB.

function fmt(n) {
  if (!Number.isFinite(n)) return '-';
  if (Math.abs(n) >= 10000) return '$' + Math.round(n).toLocaleString();
  return '$' + n.toFixed(2);
}

const LAST_UPDATED = 'April 2026';

const INTRO = `**BigQuery pricing is simple until you try to model it.** Two completely different compute-billing modes (on-demand vs Editions), three Edition tiers with different feature cutlines, separate storage billing with automatic long-term discounts, and streaming ingest with its own free tier — and that's before you get into slot reservations, commitments, and autoscaling. This calculator exists because the official Google Cloud pricing calculator buries BigQuery inside a generic UI that doesn't let you reason clearly about the on-demand vs Editions break-even, which is the single most valuable pricing decision any BigQuery team makes.

### How to use this calculator

The **TB scanned per month** input is the one number you cannot hand-wave. Everything else on the page — storage, streaming, even the Editions slot count — is secondary to the compute cost driven by bytes scanned. If you don't know your TB scanned number, run the validator SQL block below against your \`INFORMATION_SCHEMA.JOBS_BY_PROJECT\` for the last 30 days. That's the number your actual bill cares about.

Then flip between **on-demand** and **Editions** to see the break-even. On-demand is \`(TB - 1) * $6.25\` — one number, easy. Editions is \`slots * hours/day * days/month * slot_rate\`, where slot_rate is $0.04 (Standard), $0.06 (Enterprise), or $0.10 (Enterprise Plus). If the calculator shows Editions cheaper at your current volume, that's your signal to open a Cloud Billing case and discuss a slot reservation.

### What this calculator gets right (and where to be skeptical)

**Gets right**: list prices across on-demand and all three Editions, the 1 TB free on-demand tier, the 90-day long-term storage auto-transition, the 2 TB free Storage Write API tier. These reflect public GCP pricing as of ${LAST_UPDATED}.

**Be skeptical when**: (1) you have a committed-use discount (CUD) on slots — your effective rate is lower. (2) You're running BigQuery ML, vector search, or multi-statement transactions — those have separate compute accounting. (3) You use cross-region or cross-cloud queries (Enterprise Plus) — there's an additional data-transfer charge the calculator doesn't model. (4) Your workload uses flex slots or autoscaling — variable slot count means the hours/day number becomes an average, not a ceiling.

### The pricing mental model that actually matters

Forget TB/slot/GB rates for a second. The economic question is: **does your workload look like a bursty spike or a steady stream?** Bursty spikes favor on-demand (pay only when you query) or Enterprise Plus with autoscale (slots drop to 0 at idle). Steady streams favor fixed Standard/Enterprise reservations (no overprovisioning needed, lowest slot rate). The calculator lets you prove which category your workload falls into before you commit — which is the entire point of modeling pricing before signing the contract.`;

const WHEN_TO_USE = {
  use: [
    "You're budgeting BigQuery spend for the next quarter and need a defensible monthly number to put in the FinOps spreadsheet",
    "You're evaluating the on-demand vs Editions break-even — especially when monthly scan volume is trending north of 400 TB",
    "You're comparing BigQuery against Snowflake or Databricks and need an apples-to-apples cost estimate at your actual TB scanned and storage volumes",
    "You're planning a slot reservation and want to model different commitment scenarios (Standard vs Enterprise vs Enterprise Plus) before signing",
    "You're auditing why last month's BigQuery bill spiked and need a quick sanity check on whether the scan volume matches the invoice",
    "You're pitching a BigQuery migration internally and need a back-of-envelope TCO for executives who don't care about slot mechanics"
  ],
  avoid: [
    "You already have a committed-use discount (CUD) — your effective slot rate is lower than list, so Editions numbers here will overstate your real cost",
    "Your workload is dominated by BigQuery ML training, vector search, or multi-statement transactions — those have separate compute accounting the calculator doesn't model",
    "You need exact contract-specific pricing for procurement — always validate against your Google Cloud account team's official quote, not a public calculator",
    "Your workload runs cross-region or cross-cloud queries (Enterprise Plus) — the data-transfer charge is material and not modeled here",
    "You're in a region with non-US pricing — BigQuery pricing varies by region; these defaults reflect US multi-region list prices"
  ]
};

const FAQ = [
  {
    q: 'How does BigQuery pricing work?',
    a: 'BigQuery has two pricing models. (1) On-demand: you pay $6.25 per TB of data scanned by queries, with the first 1 TB free per project per month. No cluster provisioning, pure pay-per-query. (2) Capacity (Editions): you buy slot-hours in advance at $0.04 (Standard) / $0.06 (Enterprise) / $0.10 (Enterprise Plus) per slot-hour. Enterprise Plus adds autoscaling, BigQuery ML, and cross-cloud features. Storage is billed separately at $0.02/GB for active and $0.01/GB for long-term.',
  },
  {
    q: 'When should I switch from on-demand to capacity (Editions)?',
    a: 'Run a break-even calculation. On-demand costs $6.25/TB scanned. Capacity at Standard edition with 100 slots running 24/7 = 100 * 720 hours * $0.04 = $2,880/month. If you scan more than ~461 TB/month and cannot reduce with partitioning/clustering, capacity is cheaper. In practice, teams with predictable large workloads (>$3k/month on-demand) typically save 20-40% by moving to Editions.',
  },
  {
    q: 'How can I reduce BigQuery query cost on on-demand?',
    a: 'Bytes scanned is the only cost lever. (1) Always filter on a partitioned column (DATE or INTEGER partitioning). (2) Use clustering on columns commonly used in WHERE/GROUP BY (up to 4 columns). (3) Never SELECT * - specify columns; BigQuery is columnar so unused columns are not scanned. (4) Use approximate aggregations (APPROX_COUNT_DISTINCT) when exact values are not required. (5) Materialize frequently-joined subqueries as tables or materialized views. Each of these can cut cost 50-90% for targeted queries.',
  },
  {
    q: 'What counts toward the 1 TB free tier on on-demand?',
    a: 'Only query scan bytes. Storage, streaming inserts, Storage Write API usage, BigQuery ML training, and data transfer do not count against the 1 TB free scan tier. The free tier is per project, resets monthly, and is not cumulative. Small dev projects often stay entirely free if you keep queries partitioned and filtered.',
  },
  {
    q: 'Are BigQuery slots the same as Snowflake credits?',
    a: 'Similar in concept but priced differently. A BigQuery slot is a unit of compute (roughly 1 CPU + memory). You rent slot-hours. A Snowflake credit is also a unit of compute, but warehouse size determines credits consumed per hour (XS=1, S=2, M=4 etc.). Both platforms let you pay-per-query (BigQuery on-demand, Snowflake per-second billing) or buy reserved capacity. The main practical difference: BigQuery has no warehouse sizing - the platform dynamically allocates slots per query up to your reservation limit.',
  },
  {
    q: 'How do BigQuery and Snowflake prices compare?',
    a: 'For predictable medium workloads they are within 20% of each other; the real cost differences come from usage patterns, not list price. Snowflake favors workloads with clear warehouse sizing boundaries (right-size to pay less). BigQuery favors workloads with wild query-pattern variance (autoscaling Enterprise Plus slots) or extremely small/intermittent workloads (stay in the 1 TB free on-demand tier). For apples-to-apples comparison, model both at your actual TB scanned and storage volumes.',
  },
];

export default function BigQueryCostPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tbScanned, setTbScanned] = useState(() => Number(searchParams.get('tb')) || 10);
  const [storageGb, setStorageGb] = useState(() => Number(searchParams.get('sg')) || 5000);
  const [longTermPct, setLongTermPct] = useState(() => Number(searchParams.get('lt')) || 30);
  const [mode, setMode] = useState(() => searchParams.get('m') || 'on-demand'); // on-demand | editions
  const [edition, setEdition] = useState(() => searchParams.get('ed') || 'standard');
  const [slots, setSlots] = useState(() => Number(searchParams.get('sl')) || 100);
  const [hoursPerDay, setHoursPerDay] = useState(() => Number(searchParams.get('h')) || 8);
  const [daysPerMonth, setDaysPerMonth] = useState(() => Number(searchParams.get('d')) || 22);
  const [streamingGb, setStreamingGb] = useState(() => Number(searchParams.get('st')) || 0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams({
        tb: String(tbScanned),
        sg: String(storageGb),
        lt: String(longTermPct),
        m: mode,
        ed: edition,
        sl: String(slots),
        h: String(hoursPerDay),
        d: String(daysPerMonth),
        st: String(streamingGb),
      }, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [tbScanned, storageGb, longTermPct, mode, edition, slots, hoursPerDay, daysPerMonth, streamingGb, setSearchParams]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  const calc = useMemo(() => {
    const billableTb = Math.max(0, tbScanned - 1);
    const onDemandQuery = billableTb * 6.25;
    const slotRate = edition === 'enterprise_plus' ? 0.10 : edition === 'enterprise' ? 0.06 : 0.04;
    const editionsCompute = slots * hoursPerDay * daysPerMonth * slotRate;

    const activeGb = storageGb * (1 - longTermPct / 100);
    const longTermGb = storageGb * (longTermPct / 100);
    const storage = activeGb * 0.02 + longTermGb * 0.01;

    const freeStream = 2048;
    const billableStream = Math.max(0, streamingGb - freeStream);
    const streaming = billableStream * 0.025;

    const compute = mode === 'on-demand' ? onDemandQuery : editionsCompute;
    const total = compute + storage + streaming;
    return { compute, storage, streaming, total, slotRate, activeGb, longTermGb, billableTb };
  }, [tbScanned, storageGb, longTermPct, mode, edition, slots, hoursPerDay, daysPerMonth, streamingGb]);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BigQuery Cost Calculator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Free BigQuery cost calculator. Model on-demand ($6.25/TB) and capacity (Standard/Enterprise/Enterprise Plus) pricing, plus storage and streaming ingest.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/bigquery-cost-calculator',
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
        title="BigQuery Cost Calculator 2026 - On-Demand & Editions Pricing"
        description="Free BigQuery pricing calculator. Model on-demand ($6.25/TB scanned), Standard/Enterprise/Enterprise Plus slot capacity, storage, and streaming inserts. Compare with Snowflake."
        keywords="bigquery cost calculator, bigquery pricing, bigquery slot cost, bigquery on-demand vs editions, bigquery storage cost, google bigquery calculator"
        url="/tools/bigquery-cost-calculator"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'BigQuery Cost Calculator', url: '/tools/bigquery-cost-calculator' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 rounded-full">
            Last updated: {LAST_UPDATED} &middot; List pricing &middot; Client-side
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Cloud className="w-8 h-8 text-blue-400" aria-hidden="true" />
            BigQuery Cost Calculator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Estimate your monthly Google BigQuery spend across <strong>on-demand</strong>
            (per-TB scanned) and <strong>capacity Editions</strong> (slot-hours). Includes active +
            long-term storage and streaming inserts. Perfect for budget planning and on-demand vs
            Editions break-even analysis.
          </p>
        </div>

        {/* Phase 2: practitioner intro + when-to-use (pSEO depth) */}
        <section className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 md:p-8">
          <h2 className="sr-only">How BigQuery pricing works and when to use this calculator</h2>
          <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300 leading-relaxed">
            {INTRO.split('\n\n').map((para, i) => {
              if (para.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-semibold text-white mt-6 mb-3">{para.replace(/^###\s+/, '')}</h3>;
              }
              const renderInline = (text) => text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>;
                if (part.startsWith('`') && part.endsWith('`')) return <code key={j} className="px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700 text-blue-300 text-[0.9em]">{part.slice(1, -1)}</code>;
                return <React.Fragment key={j}>{part}</React.Fragment>;
              });
              if (/^\d+\.\s/.test(para)) {
                return (
                  <ol key={i} className="list-decimal pl-5 space-y-2 mb-3 marker:text-gray-500">
                    {para.split('\n').map((line, k) => <li key={k}>{renderInline(line.replace(/^\d+\.\s+/, ''))}</li>)}
                  </ol>
                );
              }
              if (/^-\s/.test(para)) {
                return (
                  <ul key={i} className="list-disc pl-5 space-y-2 mb-3 marker:text-gray-500">
                    {para.split('\n').map((line, k) => <li key={k}>{renderInline(line.replace(/^-\s+/, ''))}</li>)}
                  </ul>
                );
              }
              return <p key={i} className="mb-3 last:mb-0">{renderInline(para)}</p>;
            })}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-5">
              <h3 className="text-emerald-300 font-semibold mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" aria-hidden="true" /> Use this calculator when
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {WHEN_TO_USE.use.map((item, i) => (
                  <li key={i} className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-5">
              <h3 className="text-rose-300 font-semibold mb-3 flex items-center gap-2">
                <span aria-hidden="true">⚠</span> Don't rely on it when
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {WHEN_TO_USE.avoid.map((item, i) => (
                  <li key={i} className="flex gap-2"><span className="text-rose-400 flex-shrink-0">•</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700 p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Pricing mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('on-demand')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'on-demand' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-700 text-gray-300 hover:border-blue-500/50'}`}
                >
                  On-demand ($6.25/TB)
                </button>
                <button
                  onClick={() => setMode('editions')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'editions' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-700 text-gray-300 hover:border-blue-500/50'}`}
                >
                  Capacity (Editions)
                </button>
              </div>
            </div>

            {mode === 'on-demand' ? (
              <div>
                <label className="block text-sm text-gray-300 mb-1">TB scanned per month</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={tbScanned}
                  onChange={(e) => setTbScanned(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">First 1 TB/month per project is free.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Edition</label>
                  <select
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm"
                  >
                    <option value="standard">Standard ($0.04/slot-hr)</option>
                    <option value="enterprise">Enterprise ($0.06/slot-hr)</option>
                    <option value="enterprise_plus">Enterprise Plus ($0.10/slot-hr)</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Slots</label>
                    <input type="number" min="0" value={slots} onChange={(e) => setSlots(Number(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Hours/day</label>
                    <input type="number" min="0" max="24" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Days/month</label>
                    <input type="number" min="0" max="31" value={daysPerMonth} onChange={(e) => setDaysPerMonth(Number(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3 pt-4 border-t border-slate-700">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Storage (GB)</label>
                <input type="number" min="0" value={storageGb} onChange={(e) => setStorageGb(Number(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">% Long-term (&gt;90 days)</label>
                <input type="number" min="0" max="100" value={longTermPct} onChange={(e) => setLongTermPct(Number(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Streaming Write API (GB/month)</label>
              <input type="number" min="0" value={streamingGb} onChange={(e) => setStreamingGb(Number(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm font-mono" />
              <p className="text-xs text-gray-500 mt-1">First 2 TB/month free. $0.025/GB after.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/40 rounded-2xl p-6 space-y-4">
            <div className="text-xs text-blue-300 uppercase tracking-wider">Monthly estimate</div>
              <div className="text-4xl font-bold text-white" aria-live="polite">{fmt(calc.total)}</div>
            <div className="text-xs text-gray-400">Annual: {fmt(calc.total * 12)}</div>

            <div className="pt-4 border-t border-blue-500/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Compute</span>
                <span className="text-white font-mono">{fmt(calc.compute)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Storage</span>
                <span className="text-white font-mono">{fmt(calc.storage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Streaming</span>
                <span className="text-white font-mono">{fmt(calc.streaming)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-400 pt-3 border-t border-blue-500/30">
              {mode === 'on-demand'
                ? `Billable scan: ${calc.billableTb.toFixed(2)} TB at $6.25/TB`
                : `${slots} slots x ${hoursPerDay}h x ${daysPerMonth}d x $${calc.slotRate.toFixed(2)}/slot-hr`}
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
            >
              {copied ? (<><Check className="w-4 h-4 text-green-400" aria-hidden="true" /> Link copied</>) : (<><Share2 className="w-4 h-4" aria-hidden="true" /> Share this estimate</>)}
            </button>
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <ValidateWithSqlBlock
          title="Validate this estimate against real BigQuery usage"
          description="Run this in the BigQuery console against your INFORMATION_SCHEMA to see actual bytes billed for the last 30 days. Compare to the TB scanned you entered above."
          sql={`-- BigQuery: actual bytes billed + estimated on-demand cost by day
SELECT
  DATE(creation_time) AS day,
  COUNT(*) AS queries,
  ROUND(SUM(total_bytes_billed) / POW(1024, 4), 3) AS tb_billed,
  ROUND(SUM(total_bytes_billed) / POW(1024, 4) * 6.25, 2) AS est_on_demand_usd
FROM \`region-us\`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND statement_type = 'SELECT'
  AND state = 'DONE'
GROUP BY 1
ORDER BY 1 DESC;`}
          note="Replace region-us with your dataset region. Use JOBS_BY_ORGANIZATION if you have org-level access."
        />

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How BigQuery pricing works</h2>
          <p className="text-gray-300 text-sm mb-3">
            BigQuery splits cost into three completely independent dimensions: <strong>compute</strong>
            (how queries run), <strong>storage</strong> (how tables are kept on disk), and
            <strong> streaming ingest</strong> (how new rows arrive). Compute is the dominant cost;
            storage is usually cheap; streaming is niche.
          </p>
          <h3 className="text-lg text-white font-semibold mt-4 mb-2">Compute: on-demand vs Editions</h3>
          <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
            <li><strong>On-demand</strong> - $6.25 per TB of data scanned. Pay exactly for what you query. Best for small / intermittent / unpredictable workloads. Includes 1 TB free per project per month.</li>
            <li><strong>Standard edition</strong> - $0.04/slot-hour. No BigQuery ML, no materialized views, no cross-region dataset replication. For simple SQL workloads.</li>
            <li><strong>Enterprise</strong> - $0.06/slot-hour. Full feature set including BigQuery ML, materialized views, column-level security. Most common Editions tier.</li>
            <li><strong>Enterprise Plus</strong> - $0.10/slot-hour. Adds autoscaling slots (0 to max you set), cross-region + cross-cloud queries, CMEK, assured workloads for regulated industries.</li>
          </ul>
          <h3 className="text-lg text-white font-semibold mt-4 mb-2">Storage tiers</h3>
          <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
            <li><strong>Active storage</strong> - $0.02/GB/month - any table/partition modified in the last 90 days.</li>
            <li><strong>Long-term storage</strong> - $0.01/GB/month (50% discount) - automatic on tables/partitions not modified for 90+ days. No query performance penalty.</li>
            <li><strong>Physical storage</strong> - optional billing model: pay for actual compressed bytes instead of logical, typically ~50% cheaper for well-compressed data. Opt-in per dataset.</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Worked example: when to switch to Editions</h2>
          <p className="text-gray-300 text-sm mb-3">
            You are running <strong>450 TB scanned per month</strong> on on-demand. Break-even check:
          </p>
          <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
            <li>On-demand: (450 - 1) * $6.25 = <strong>$2,806/month</strong></li>
            <li>Standard Edition: 100 slots * 730 hours * $0.04 = <strong>$2,920/month</strong></li>
            <li>Standard with autoscale (50-150 avg slots via Enterprise Plus): ~$2,190/month</li>
          </ul>
          <p className="text-gray-300 text-sm mt-3">
            If your workload is bursty (big overnight ETLs, idle during the day), Enterprise Plus
            with autoscale pays back quickly because slots drop to 0 when idle. If your workload
            is steady (BI dashboards all day), Standard at a fixed reservation is cheaper. Mid-size
            teams with $3k-10k monthly spend usually save 20-40% moving off on-demand.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools &amp; guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Snowflake Cost Calculator -&gt;</div>
              <div className="text-gray-400 text-sm">Compare against Snowflake edition + warehouse pricing.</div>
            </Link>
            <Link to="/tools/databricks-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1 flex items-center gap-2"><Cloud className="w-4 h-4" /> Databricks Cost Calculator -&gt;</div>
              <div className="text-gray-400 text-sm">DBU + VM pricing for Databricks workloads.</div>
            </Link>
            <Link to="/tools/json-to-sql-ddl" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1 flex items-center gap-2"><Wand2 className="w-4 h-4" /> JSON to SQL DDL -&gt;</div>
              <div className="text-gray-400 text-sm">Scaffold BigQuery CREATE TABLE from JSON samples.</div>
            </Link>
            <Link to="/compare/snowflake-vs-google-bigquery" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Snowflake vs BigQuery -&gt;</div>
              <div className="text-gray-400 text-sm">Full feature + cost comparison.</div>
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
