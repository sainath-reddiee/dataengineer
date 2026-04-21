// src/pages/DbtCloudCostPage.jsx
// dbt Cloud seat + run based cost calculator. Targets "dbt cloud cost",
// "dbt cloud pricing calculator", "dbt cloud vs dbt core cost".
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Users, Share2, Check, Calculator, DollarSign, Zap, BookOpen } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// dbt Cloud plan tiers (early 2026 list pricing).
// Source: getdbt.com/pricing. Uses representative seat prices; actual pricing may vary.
const PLANS = [
  {
    id: 'developer',
    label: 'Developer (Free)',
    pricePerSeat: 0,
    includedJobsMinutes: 3000,
    overageRate: 0, // No paid overage on free tier — you get cut off.
    seatsCap: 1,
    features: 'Single developer, 3,000 successful model builds/month, basic IDE',
  },
  {
    id: 'team',
    label: 'Team',
    pricePerSeat: 100,
    includedJobsMinutes: 15000,
    overageRate: 0.01,
    seatsCap: 8,
    features: 'Up to 8 developer seats, job scheduling, CI, semantic layer',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    pricePerSeat: 125,
    includedJobsMinutes: 50000,
    overageRate: 0.008,
    seatsCap: null,
    features: 'Unlimited seats, SSO, audit logs, multi-tenant, priority support',
  },
];

const formatUSD = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const FAQ = [
  {
    q: 'How much does dbt Cloud cost per user?',
    a: 'dbt Cloud charges per developer seat. Team tier is roughly $100/seat/month (capped at 8 seats); Enterprise is roughly $125/seat/month with volume discounts available. There is also a free Developer tier for a single user with 3,000 successful model-build minutes per month.',
  },
  {
    q: 'What counts as a successful model build?',
    a: 'Each model, seed, snapshot, or test that completes successfully counts as one build. Failed runs still consume IDE-run minutes but not job-run minutes. A typical medium-sized dbt project (100 models) run hourly could rack up 70k+ builds/month — well above Team tier\'s included volume.',
  },
  {
    q: 'When does dbt Cloud Team become more expensive than Enterprise?',
    a: 'Crossover point is usually around 8–10 developers (Team is hard-capped at 8 seats). If you need 9+ engineers or features like SSO, audit logs, and multi-tenancy, Enterprise is the only option. Pricing negotiable.',
  },
  {
    q: 'Can I use dbt Core for free instead?',
    a: 'Yes. dbt Core is open-source and free. You run it via CLI, Airflow, Dagster, or Prefect. You pay only for your orchestration + compute. For teams of 5+ engineers who already have an orchestrator, dbt Core + existing infra is often 50–80% cheaper than dbt Cloud Team. The trade-off: no hosted IDE, no semantic layer UI, no native CI/CD — you build those yourself.',
  },
  {
    q: 'What if I only need the IDE but no scheduled jobs?',
    a: 'dbt Cloud\'s Team tier is bundled — you cannot buy "IDE only". A common workaround: free Developer tier for individual exploration, dbt Core for production via Airflow/Dagster. Some teams use the Developer tier for architects and dbt Core for everyone else.',
  },
  {
    q: 'How is dbt Cloud usage metered under the hood?',
    a: 'Two axes: (1) Seats — monthly per-user charge. (2) Model-build minutes — time spent by the job runner. IDE time is free on paid plans. Overages are billed per successful model over your plan\'s included quota (Team ~$0.01/build, Enterprise ~$0.008/build).',
  },
];

export default function DbtCloudCostPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [planId, setPlanId] = useState(() => searchParams.get('p') || 'team');
  const [seats, setSeats] = useState(() => {
    const v = Number(searchParams.get('s'));
    return isFinite(v) && v > 0 ? v : 4;
  });
  const [buildsPerMonth, setBuildsPerMonth] = useState(() => {
    const v = Number(searchParams.get('b'));
    return isFinite(v) && v >= 0 ? v : 12000;
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(
        { p: planId, s: String(seats), b: String(buildsPerMonth) },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [planId, seats, buildsPerMonth, setSearchParams]);

  const result = useMemo(() => {
    const plan = PLANS.find((p) => p.id === planId) || PLANS[1];
    const effectiveSeats = plan.seatsCap ? Math.min(plan.seatsCap, Math.max(1, seats)) : Math.max(1, seats);
    const seatCost = effectiveSeats * plan.pricePerSeat;
    const overageBuilds = Math.max(0, buildsPerMonth - plan.includedJobsMinutes);
    const overageCost = overageBuilds * plan.overageRate;
    const total = seatCost + overageCost;
    const perSeat = total / Math.max(1, effectiveSeats);
    return {
      plan, effectiveSeats,
      seatCost,
      overageBuilds,
      overageCost,
      total,
      perSeat,
      capped: plan.seatsCap && seats > plan.seatsCap,
    };
  }, [planId, seats, buildsPerMonth]);

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
    name: 'dbt Cloud Cost Calculator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Free dbt Cloud cost calculator. Estimate monthly spend by plan (Developer/Team/Enterprise), seats, and successful model builds.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/dbt-cloud-cost-calculator',
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
        title="dbt Cloud Cost Calculator 2026 — Seat + Build Pricing"
        description="Free dbt Cloud cost calculator. Model Developer, Team, and Enterprise plans. Factor seats, model-builds, and overages. Compare dbt Cloud vs dbt Core TCO."
        keywords="dbt cloud cost, dbt cloud pricing, dbt cloud calculator, dbt cloud vs dbt core, dbt cloud team pricing, dbt cloud enterprise pricing"
        url="/tools/dbt-cloud-cost-calculator"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'dbt Cloud Cost Calculator', url: '/tools/dbt-cloud-cost-calculator' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-emerald-300 bg-emerald-900/30 border border-emerald-700/50 rounded-full">
            Updated April 2026 · dbt Labs list pricing
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" />
            dbt Cloud Cost Calculator
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Estimate monthly dbt Cloud spend across Developer, Team, and Enterprise tiers. Factor
            in developer seats, successful model-builds per month, and overage charges. Use the
            comparison table below to benchmark against dbt Core + Airflow TCO.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Plan tier
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — ${p.pricePerSeat}/seat/mo
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{result.plan.features}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Developer seats
                {result.plan.seatsCap && (
                  <span className="text-xs text-gray-500 ml-2">(capped at {result.plan.seatsCap})</span>
                )}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value) || 0)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {result.capped && (
                <p className="text-xs text-amber-400 mt-1">
                  Team tier caps at {result.plan.seatsCap} seats. Upgrade to Enterprise for more.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Successful model builds / month
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={buildsPerMonth}
                onChange={(e) => setBuildsPerMonth(Number(e.target.value) || 0)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Included: {result.plan.includedJobsMinutes.toLocaleString()}. Overage: ${result.plan.overageRate}/build.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[3000, 10000, 25000, 50000, 100000].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setBuildsPerMonth(n)}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-full text-gray-300"
                  >
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl rounded-2xl border border-emerald-700/50 p-6"
          >
            <div className="text-sm text-gray-300 mb-2">Monthly total</div>
            <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
              {formatUSD(result.total)}
            </div>
            <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
              <div className="flex justify-between"><span className="text-gray-400">Effective seats</span><span className="text-white font-mono">{result.effectiveSeats}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Seat cost</span><span className="text-white font-mono">{formatUSD(result.seatCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Overage builds</span><span className="text-white font-mono">{result.overageBuilds.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Overage cost</span><span className="text-white font-mono">{formatUSD(result.overageCost)}</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-gray-400">Annual run-rate</span><span className="text-white font-mono">{formatUSD(result.total * 12)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Per-seat all-in</span><span className="text-white font-mono">{formatUSD(result.perSeat)}</span></div>
            </div>

            <button
              onClick={handleShare}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
            >
              {copied ? (<><Check className="w-4 h-4 text-green-400" /> Link copied</>) : (<><Share2 className="w-4 h-4" /> Share this estimate</>)}
            </button>

            <p className="text-[11px] text-gray-500 mt-4">
              Pricing approximated from publicly documented dbt Cloud tiers (early 2026). Enterprise pricing typically negotiable.
            </p>
          </motion.div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">dbt Cloud vs dbt Core: when does Cloud pay off?</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            The dbt Cloud vs dbt Core decision is primarily about <strong className="text-white">team maturity + operational overhead tolerance</strong>, not raw cost. Here is the quick decision framework:
          </p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-emerald-400 font-semibold shrink-0">Choose dbt Cloud if</span>
              <span>you have no Airflow/Dagster, want to ship fast, have 1–8 engineers, need semantic layer UI, or need native CI/CD and SSO without building them.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-red-400 font-semibold shrink-0">Choose dbt Core if</span>
              <span>you already run Airflow/Dagster/Prefect, have 10+ engineers (Team tier cap), want full orchestrator flexibility, or need to keep transformation runtime inside VPC with zero external dependencies.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-semibold shrink-0">Hybrid</span>
              <span>Use dbt Cloud Developer (free) for individual architects, and dbt Core in Airflow for production. Common at larger orgs.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How to estimate your model-build volume</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Model-builds are the trickiest input. A rough formula:
          </p>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm text-emerald-300 mb-3">
            builds_per_month ≈ models × runs_per_day × 30 × 1.15
          </div>
          <ul className="list-disc pl-5 text-gray-300 space-y-1 text-sm">
            <li><strong className="text-white">models</strong>: count from <code>dbt ls --resource-type model | wc -l</code> in your repo.</li>
            <li><strong className="text-white">runs_per_day</strong>: hourly = 24, every 4h = 6, daily = 1. Include tests and snapshots.</li>
            <li><strong className="text-white">× 1.15</strong>: accounts for tests (each test = 1 build), CI runs, and re-runs on failure.</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Example: a 120-model project run hourly → 120 × 24 × 30 × 1.15 ≈ 99,360 builds/month — way over Team&apos;s 15,000 quota.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/databricks-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Databricks Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Estimate your compute cost underneath dbt.</div>
            </Link>
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Snowflake Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Snowflake is by far the most common dbt target.</div>
            </Link>
            <Link to="/cheatsheets/dbt-commands" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> dbt Commands Cheat Sheet →</div>
              <div className="text-gray-400 text-sm">Every dbt CLI command with flags and examples.</div>
            </Link>
            <Link to="/cheatsheets/dbt-best-practices" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl">
              <div className="text-emerald-300 font-medium mb-1">dbt Best Practices →</div>
              <div className="text-gray-400 text-sm">Layered modeling, tests, documentation patterns.</div>
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
                  <span className="text-emerald-400 group-open:rotate-45 transition-transform text-xl">+</span>
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
