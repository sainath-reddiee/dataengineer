// src/pages/CostCalculatorPage.jsx
// Snowflake Cost Calculator — public interactive tool.
// Targets "snowflake cost calculator" / "snowflake pricing calculator" queries.
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Calculator,
  Cloud,
  Database,
  Clock,
  Layers,
  HardDrive,
  Zap,
  TrendingDown,
  Download,
  Share2,
  Check,
  Info,
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import {
  EDITIONS,
  REGIONS,
  WAREHOUSE_SIZES,
  DEFAULT_INPUTS,
  calculateCost,
  formatUSD,
} from '@/data/snowflakePricing';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// --- Query-param helpers for shareable URLs ---------------------------------
const QP_KEYS = {
  e: 'editionId',
  r: 'regionId',
  s: 'sizeId',
  h: 'hoursPerDay',
  d: 'daysPerMonth',
  c: 'clusters',
  g: 'storageGB',
  cs: 'cloudServicesPct',
  t: 'storageTier',
};

function inputsToParams(inputs) {
  const params = {};
  for (const [k, v] of Object.entries(QP_KEYS)) {
    params[k] = String(inputs[v]);
  }
  return params;
}

function paramsToInputs(searchParams) {
  const next = { ...DEFAULT_INPUTS };
  for (const [k, v] of Object.entries(QP_KEYS)) {
    const raw = searchParams.get(k);
    if (raw === null) continue;
    if (typeof DEFAULT_INPUTS[v] === 'number') {
      const n = Number(raw);
      if (!isNaN(n)) next[v] = n;
    } else {
      next[v] = raw;
    }
  }
  return next;
}

// --- FAQ content (surfaced as FAQPage schema) -------------------------------
const FAQ = [
  {
    q: 'How are Snowflake credits calculated?',
    a: 'Credits are consumed per second of warehouse run time, billed at a rate determined by warehouse size (XS = 1 credit/hour, doubling with each size). A 60-second minimum applies when a warehouse resumes.',
  },
  {
    q: 'What is the cheapest Snowflake edition?',
    a: 'Standard Edition at 1.0x credit rate. Enterprise (1.5x) adds multi-cluster, time travel up to 90 days, and materialized views. Business Critical (2.0x) adds HIPAA/PCI compliance and customer-managed keys. VPS (2.5x) isolates your account at the infrastructure level.',
  },
  {
    q: 'Does auto-suspend really save money?',
    a: 'Yes — significantly. A warehouse running 24/7 at size Medium costs roughly 4 credits/hour × 720 hours = 2,880 credits/month (~$5,760 at Enterprise rates). Auto-suspend after 60 seconds of idle can cut compute costs by 70–90% for bursty workloads.',
  },
  {
    q: 'What counts as "cloud services" billing?',
    a: 'Cloud Services handle query compilation, metadata management, authentication, and transaction coordination. Snowflake includes a 10% free allowance against your compute credits — only usage above 10% is billed.',
  },
  {
    q: 'Is on-demand or capacity storage cheaper?',
    a: 'On-demand storage is ~$23/TB/month (pay-as-you-go). Capacity storage requires a pre-purchased commitment but drops to roughly $40/TB/month on flat terms — not always cheaper; it depends on contract length and volume.',
  },
  {
    q: 'How do I estimate Cortex AI costs?',
    a: 'Cortex AI is billed per million tokens at roughly 3 credits per million tokens (varies by model). A chatbot handling 10M prompt+response tokens/month would cost about 30 credits (~$60–$90 depending on edition and region).',
  },
  {
    q: 'Why is my Snowflake bill higher than the calculator estimate?',
    a: 'Common culprits: warehouses not auto-suspending, cloud services >10%, replication and data transfer costs, serverless features (Snowpipe, Tasks), materialized view maintenance, and Search Optimization Service. Use the Account Usage views to audit actual credits.',
  },
  {
    q: 'Does this calculator include multi-cluster warehouses?',
    a: 'Yes — the cluster count multiplies compute credits linearly. A Medium warehouse with 3 clusters running 8 hours consumes 4 × 8 × 3 = 96 credits (before edition multiplier).',
  },
];

// --- HowTo steps (surfaced as HowTo schema) ---------------------------------
const HOWTO_STEPS = [
  {
    name: 'Choose your edition',
    text: 'Select Standard, Enterprise, Business Critical, or VPS. Higher editions multiply the credit rate.',
  },
  {
    name: 'Pick your cloud region',
    text: 'Credit prices vary by region. US regions are typically cheapest; APAC regions cost more.',
  },
  {
    name: 'Set warehouse size and usage',
    text: 'Choose warehouse size (XS through 6XL) and estimate hours per day and days per month the warehouse runs.',
  },
  {
    name: 'Add storage and serverless features',
    text: 'Enter total storage in GB and toggle any serverless features you use (Snowpipe, Cortex AI, Auto-Clustering).',
  },
  {
    name: 'Review monthly and annual estimate',
    text: 'The calculator shows compute, storage, cloud services, and serverless costs — plus potential savings from right-sizing.',
  },
];

// --- Field components -------------------------------------------------------
const Label = ({ icon: Icon, children }) => (
  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
    {Icon && <Icon className="w-4 h-4 text-blue-400" />}
    {children}
  </label>
);

const Select = ({ value, onChange, options, idKey = 'id', labelKey = 'label' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {options.map(opt => (
      <option key={opt[idKey]} value={opt[idKey]}>
        {opt[labelKey]}
      </option>
    ))}
  </select>
);

const Slider = ({ value, onChange, min, max, step = 1, unit = '' }) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="flex-1 accent-blue-500"
    />
    <div className="w-20 text-right font-mono text-white">
      {value}
      {unit}
    </div>
  </div>
);

const NumberInput = ({ value, onChange, min = 0, step = 1 }) => (
  <input
    type="number"
    value={value}
    min={min}
    step={step}
    onChange={e => onChange(Number(e.target.value) || 0)}
    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors ${
      checked
        ? 'bg-blue-600/20 border-blue-500 text-white'
        : 'bg-slate-700/30 border-slate-600 text-gray-300'
    }`}
  >
    <span className="text-sm font-medium">{label}</span>
    <span
      className={`w-10 h-6 rounded-full relative transition-colors ${
        checked ? 'bg-blue-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
);

// --- Main page --------------------------------------------------------------
export default function CostCalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputs, setInputs] = useState(() => paramsToInputs(searchParams));
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const result = useMemo(() => calculateCost(inputs), [inputs]);

  // Sync inputs -> URL (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(inputsToParams(inputs), { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [inputs, setSearchParams]);

  const update = useCallback((patch) => {
    setInputs(prev => ({ ...prev, ...patch }));
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  const handlePDF = useCallback(async () => {
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text('Snowflake Cost Estimate', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
      y += 4;
      doc.text('dataengineerhub.blog/tools/snowflake-cost-calculator', 20, y);
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Configuration', 20, y);
      y += 7;
      doc.setFontSize(10);
      const config = [
        ['Edition', result.edition.label],
        ['Region', result.region.label],
        ['Warehouse size', result.size.label],
        ['Hours/day', String(inputs.hoursPerDay)],
        ['Days/month', String(inputs.daysPerMonth)],
        ['Clusters', String(inputs.clusters)],
        ['Storage', `${inputs.storageGB} GB (${inputs.storageTier})`],
        ['Credit price', formatUSD(result.creditPrice)],
      ];
      config.forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, 22, y);
        y += 5;
      });

      y += 5;
      doc.setFontSize(12);
      doc.text('Monthly breakdown', 20, y);
      y += 7;
      doc.setFontSize(10);
      const rows = [
        ['Compute', formatUSD(result.computeCost)],
        ['Storage', formatUSD(result.storageCost)],
        ['Cloud Services', formatUSD(result.cloudServicesCost)],
        ['Serverless', formatUSD(result.serverlessCost)],
      ];
      rows.forEach(([k, v]) => {
        doc.text(`${k}:`, 22, y);
        doc.text(v, 120, y);
        y += 5;
      });

      y += 3;
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text(`Total monthly: ${formatUSD(result.totalMonthly)}`, 20, y);
      y += 7;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Projected annual: ${formatUSD(result.totalAnnual)}`, 20, y);
      y += 12;

      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        'Estimate based on public Snowflake list pricing. Actual costs depend on contract, discounts, and usage patterns.',
        20,
        y,
        { maxWidth: 170 }
      );

      doc.save(`snowflake-cost-estimate-${Date.now()}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }, [inputs, result]);

  // JSON-LD: SoftwareApplication + HowTo + FAQPage
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Snowflake Cost Calculator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Free Snowflake cost calculator to estimate monthly warehouse credits, storage, cloud services, and serverless feature costs by edition and region.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/snowflake-cost-calculator',
    publisher: {
      '@type': 'Organization',
      name: 'DataEngineer Hub',
      url: 'https://dataengineerhub.blog',
    },
  };
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to estimate Snowflake costs',
    step: HOWTO_STEPS.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
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
        title="Snowflake Cost Calculator 2026 — Free Pricing Estimator"
        description="Free Snowflake cost calculator. Estimate warehouse credits, storage, and cloud services costs by edition (Standard/Enterprise/BC) and region. Instant monthly + annual estimates."
        keywords="snowflake cost calculator, snowflake pricing calculator, snowflake credit cost, warehouse cost estimator, snowflake pricing, snowflake credits price"
        url="/tools/snowflake-cost-calculator"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Snowflake Cost Calculator', url: '/tools/snowflake-cost-calculator' },
        ]}
        howToSchema={howToSchema}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 rounded-full">
            Updated April 2026 · Based on Snowflake list pricing
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-400" />
            Snowflake Cost Calculator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Estimate your monthly Snowflake spend across compute, storage, cloud services, and
            serverless features. Change any input and totals update live. Share the URL to send
            your estimate to a teammate.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inputs column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Workload configuration</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label icon={Cloud}>Edition</Label>
                  <Select
                    value={inputs.editionId}
                    onChange={v => update({ editionId: v })}
                    options={EDITIONS}
                  />
                </div>
                <div>
                  <Label icon={Cloud}>Region / Cloud</Label>
                  <Select
                    value={inputs.regionId}
                    onChange={v => update({ regionId: v })}
                    options={REGIONS}
                  />
                </div>
                <div>
                  <Label icon={Database}>Warehouse size</Label>
                  <Select
                    value={inputs.sizeId}
                    onChange={v => update({ sizeId: v })}
                    options={WAREHOUSE_SIZES}
                  />
                </div>
                <div>
                  <Label icon={Layers}>Clusters (multi-cluster)</Label>
                  <NumberInput
                    value={inputs.clusters}
                    min={1}
                    onChange={v => update({ clusters: Math.max(1, v) })}
                  />
                </div>
                <div>
                  <Label icon={Clock}>Hours per day</Label>
                  <Slider
                    value={inputs.hoursPerDay}
                    min={0}
                    max={24}
                    onChange={v => update({ hoursPerDay: v })}
                    unit="h"
                  />
                </div>
                <div>
                  <Label icon={Clock}>Days per month</Label>
                  <Slider
                    value={inputs.daysPerMonth}
                    min={1}
                    max={31}
                    onChange={v => update({ daysPerMonth: v })}
                    unit="d"
                  />
                </div>
                <div>
                  <Label icon={HardDrive}>Storage (GB)</Label>
                  <NumberInput
                    value={inputs.storageGB}
                    min={0}
                    step={50}
                    onChange={v => update({ storageGB: v })}
                  />
                </div>
                <div>
                  <Label icon={HardDrive}>Storage tier</Label>
                  <Select
                    value={inputs.storageTier}
                    onChange={v => update({ storageTier: v })}
                    options={[
                      { id: 'onDemand', label: 'On-Demand' },
                      { id: 'capacity', label: 'Capacity (pre-purchased)' },
                    ]}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label icon={Info}>
                    Cloud Services usage (% of compute) — first 10% is free
                  </Label>
                  <Slider
                    value={inputs.cloudServicesPct}
                    min={0}
                    max={30}
                    onChange={v => update({ cloudServicesPct: v })}
                    unit="%"
                  />
                </div>
              </div>
            </div>

            {/* Serverless */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Serverless features
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Toggle
                  checked={inputs.enableSnowpipe}
                  onChange={v => update({ enableSnowpipe: v })}
                  label="Snowpipe"
                />
                <Toggle
                  checked={inputs.enableCortex}
                  onChange={v => update({ enableCortex: v })}
                  label="Cortex AI"
                />
                <Toggle
                  checked={inputs.enableAutoClustering}
                  onChange={v => update({ enableAutoClustering: v })}
                  label="Auto-Clustering"
                />
                {inputs.enableSnowpipe && (
                  <div>
                    <Label>Snowpipe files/day</Label>
                    <NumberInput
                      value={inputs.snowpipeFilesPerDay}
                      min={0}
                      step={100}
                      onChange={v => update({ snowpipeFilesPerDay: v })}
                    />
                  </div>
                )}
                {inputs.enableCortex && (
                  <div>
                    <Label>Cortex tokens/month (millions)</Label>
                    <NumberInput
                      value={inputs.cortexTokensPerMonth}
                      min={0}
                      step={1}
                      onChange={v => update({ cortexTokensPerMonth: v })}
                    />
                  </div>
                )}
                {inputs.enableAutoClustering && (
                  <div>
                    <Label>Reclustering credits/day</Label>
                    <NumberInput
                      value={inputs.autoClusteringCreditsPerDay}
                      min={0}
                      step={0.5}
                      onChange={v => update({ autoClusteringCreditsPerDay: v })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results column (1/3, sticky on desktop) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border border-blue-700/50 p-6 lg:sticky lg:top-4"
            >
              <h2 className="text-lg font-semibold text-white mb-3">Monthly estimate</h2>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {formatUSD(result.totalMonthly)}
              </div>
              <p className="text-gray-400 text-sm mb-5">
                Projected annual:{' '}
                <span className="text-white font-medium">{formatUSD(result.totalAnnual)}</span>
              </p>

              <div className="space-y-2 mb-5 text-sm">
                <Row label="Compute" value={formatUSD(result.computeCost)} sub={`${result.computeCredits.toLocaleString()} credits`} />
                <Row label="Storage" value={formatUSD(result.storageCost)} sub={`${result.storageTB.toFixed(2)} TB`} />
                <Row label="Cloud Services" value={formatUSD(result.cloudServicesCost)} />
                {result.serverlessCost > 0 && (
                  <Row label="Serverless" value={formatUSD(result.serverlessCost)} />
                )}
              </div>

              {result.potentialSavings > 0 && (
                <div className="p-3 mb-4 bg-green-900/30 border border-green-700/50 rounded-xl flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-200">
                    Downsizing to <strong>{result.smallerSize.label}</strong> could save{' '}
                    <strong>{formatUSD(result.potentialSavings)}</strong>/month.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" /> Link copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> Share this estimate
                    </>
                  )}
                </button>
                <button
                  onClick={handlePDF}
                  disabled={pdfLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {pdfLoading ? 'Building PDF...' : 'Download PDF estimate'}
                </button>
              </div>

              <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                Estimate based on public list pricing. Enterprise contracts often include
                discounts of 20–40%.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Ad placement */}
        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        {/* Optimization tips */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Cut your Snowflake bill — proven techniques
          </h2>
          <p className="text-gray-300 mb-5">
            These strategies from our most popular guides consistently reduce Snowflake costs by
            30–60% without hurting performance:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <TipLink
              to="/articles/snowflake-cost-optimization-12-proven-techniques"
              title="12 proven Snowflake cost optimization techniques"
              desc="The full playbook: auto-suspend, resource monitors, query tagging, and more."
            />
            <TipLink
              to="/articles/snowflake-query-optimization-2025"
              title="Snowflake query optimization in 2025"
              desc="Partition pruning, clustering, and materialized views done right."
            />
            <TipLink
              to="/articles/why-i-stopped-using-snowflake-tasks-orchestration"
              title="Why tasks-only orchestration burns credits"
              desc="When to use Airflow or dbt Cloud instead of bare Snowflake Tasks."
            />
            <TipLink
              to="/articles/snowflake-cortex-code-cost-control-2026"
              title="Cortex Code cost control in 2026"
              desc="Stop runaway AI spend with budgets, quotas, and model selection."
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group border border-slate-700 rounded-xl px-4 py-3 open:bg-slate-800/70"
              >
                <summary className="cursor-pointer text-white font-medium list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-blue-400 group-open:rotate-45 transition-transform text-xl">
                    +
                  </span>
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

function Row({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <div className="text-gray-300">{label}</div>
        {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
      </div>
      <div className="text-white font-mono">{value}</div>
    </div>
  );
}

function TipLink({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl transition-colors"
    >
      <div className="text-blue-300 font-medium mb-1">{title} →</div>
      <div className="text-gray-400 text-sm">{desc}</div>
    </Link>
  );
}
