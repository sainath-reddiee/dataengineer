// src/pages/CreditCostPage.jsx
// Snowflake Credit -> USD Converter. Minimal, single-purpose tool.
// Targets queries like "snowflake credit cost", "snowflake credit price",
// "how much does a snowflake credit cost".
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Coins, Cloud, Share2, Check, Calculator } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { EDITIONS, REGIONS, formatUSD } from '@/data/snowflakePricing';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const FAQ = [
  {
    q: 'How much does one Snowflake credit cost?',
    a: 'A single credit costs between $2.00 (AWS US East, Standard edition) and $7.25 (AWS Asia Pacific, VPS). Price = region base price × edition multiplier. Standard = 1.0x, Enterprise = 1.5x, Business Critical = 2.0x, VPS = 2.5x.',
  },
  {
    q: 'Why are credit prices different across regions?',
    a: 'Snowflake prices credits higher in regions with higher underlying cloud costs. US regions (us-east-1, us-west-2, us-central1) are cheapest at $2.00/credit. European regions are ~30% higher; APAC regions are ~45% higher.',
  },
  {
    q: 'Can I get a discount on credit price?',
    a: 'Yes — enterprise capacity contracts (annual or multi-year commitments) typically see 20-40% off list price. Short-term on-demand customers pay full list rate.',
  },
  {
    q: 'Is there a free Snowflake credit tier?',
    a: 'New Snowflake accounts receive $400 in free credits for 30 days. After that, all compute consumes billed credits. There is no ongoing free tier.',
  },
  {
    q: 'Do different warehouses use different credit prices?',
    a: 'No — the price-per-credit depends only on edition and region. Warehouse size changes how many credits are consumed per hour, not the price per credit.',
  },
];

export default function CreditCostPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [credits, setCredits] = useState(() => {
    const v = Number(searchParams.get('c'));
    return isFinite(v) && v > 0 ? v : 100;
  });
  const [editionId, setEditionId] = useState(() => searchParams.get('e') || 'enterprise');
  const [regionId, setRegionId] = useState(() => searchParams.get('r') || 'aws-us-east');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(
        { c: String(credits), e: editionId, r: regionId },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [credits, editionId, regionId, setSearchParams]);

  const result = useMemo(() => {
    const ed = EDITIONS.find(e => e.id === editionId) || EDITIONS[1];
    const rg = REGIONS.find(r => r.id === regionId) || REGIONS[0];
    const pricePerCredit = rg.creditPrice * ed.multiplier;
    const total = Math.max(0, credits) * pricePerCredit;
    return { edition: ed, region: rg, pricePerCredit, total };
  }, [credits, editionId, regionId]);

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
    name: 'Snowflake Credit Cost Converter',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Free Snowflake credit to USD converter. Enter credits, pick edition and region, see instant cost.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/snowflake-credit-cost',
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
        title="Snowflake Credit Cost Converter 2026 — Instant USD Calculator"
        description="How much does a Snowflake credit cost? Convert credits to USD by edition (Standard/Enterprise/BC/VPS) and region. Live price calculator."
        keywords="snowflake credit cost, snowflake credit price, snowflake credit to usd, how much is a snowflake credit, snowflake pricing per credit"
        url="/tools/snowflake-credit-cost"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Credit Cost Converter', url: '/tools/snowflake-credit-cost' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 rounded-full">
            Updated April 2026 · Snowflake list pricing
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Coins className="w-8 h-8 text-yellow-400" aria-hidden="true" />
            Snowflake Credit → USD Converter
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Convert any number of Snowflake credits to US dollars. Price depends on edition
            (Standard, Enterprise, Business Critical, VPS) and your cloud region.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Credits</label>
              <input
                type="number"
                min="0"
                step="1"
                value={credits}
                onChange={e => setCredits(Number(e.target.value) || 0)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 10, 100, 1000, 10000].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCredits(n)}
                    className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-full text-gray-300"
                  >
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
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
                  <option key={ed.id} value={ed.id}>
                    {ed.label} ({ed.multiplier}x)
                  </option>
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
                  <option key={r.id} value={r.id}>
                    {r.label} — ${r.creditPrice.toFixed(2)}/credit (Standard)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border border-blue-700/50 p-6"
          >
            <div className="text-sm text-gray-300 mb-2">Total cost</div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4" aria-live="polite">
                {formatUSD(result.total)}
            </div>
            <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
              <div className="flex justify-between"><span className="text-gray-400">Credits</span><span className="text-white font-mono">{credits.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Price per credit</span><span className="text-white font-mono">{formatUSD(result.pricePerCredit)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Edition multiplier</span><span className="text-white font-mono">{result.edition.multiplier}x</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Region base price</span><span className="text-white font-mono">{formatUSD(result.region.creditPrice)}</span></div>
            </div>

            <button
              onClick={handleShare}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-medium"
            >
              {copied ? (<><Check className="w-4 h-4 text-green-400" aria-hidden="true" /> Link copied</>) : (<><Share2 className="w-4 h-4" aria-hidden="true" /> Share this calculation</>)}
            </button>

            <p className="text-[11px] text-gray-500 mt-4">
              List pricing. Enterprise capacity contracts typically see 20–40% discounts.
            </p>
          </motion.div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Credit price reference table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-slate-700">
                  <th className="py-2 pr-4">Region</th>
                  {EDITIONS.map(e => (
                    <th key={e.id} className="py-2 pr-4">
                      {e.label}{e.multiplier !== 1 ? ` (${e.multiplier}x)` : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.map(r => (
                  <tr key={r.id} className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-gray-300">{r.label}</td>
                    {EDITIONS.map(e => (
                      <td key={e.id} className="py-2 pr-4 text-white font-mono">
                        ${(r.creditPrice * e.multiplier).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">How the calculation works</h2>
          <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Snowflake bills compute in <strong>credits</strong>. A credit is not a fixed dollar
              amount — its USD value is a product of three inputs: the <strong>region base price</strong>
              {' '}(what AWS us-east-1 charges vs. Azure West Europe), the <strong>edition multiplier</strong>
              {' '}(Standard 1.0x → Enterprise 1.5x → Business Critical 2.0x → VPS 2.5x), and the
              number of credits consumed.
            </p>
            <p className="font-mono text-xs bg-slate-900/70 border border-slate-700 rounded-lg p-3 text-blue-300">
              total_usd = credits × region.base_price × edition.multiplier
            </p>
            <p>
              This calculator applies <em>list</em> pricing — the same number Snowflake shows on its
              public pricing page. On-demand accounts pay list. Capacity (committed) contracts
              typically see 20–40% negotiated discounts on top of these numbers.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Worked example</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Suppose your team burns <strong>5,000 credits in a month</strong> on the Enterprise
              edition running in AWS us-east-1 (base price $2.00/credit).
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Base rate: <span className="font-mono text-white">$2.00/credit</span></li>
              <li>Edition multiplier (Enterprise): <span className="font-mono text-white">1.5x</span></li>
              <li>Effective rate: <span className="font-mono text-white">$2.00 × 1.5 = $3.00/credit</span></li>
              <li>Monthly bill: <span className="font-mono text-green-400">5,000 × $3.00 = $15,000</span></li>
            </ul>
            <p>
              Upgrading that same workload to Business Critical (2.0x) would move the bill to
              $20,000 — a 33% increase — which is why you should only elect Business Critical when
              you genuinely need HIPAA/PCI compliance, tri-secret-secure, or failover.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Full Snowflake Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Factor in warehouse size, hours, storage and serverless features.</div>
            </Link>
            <Link to="/tools/snowflake-warehouse-sizing" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Warehouse Sizing Estimator →</div>
              <div className="text-gray-400 text-sm">Pick the right T-shirt size for your workload.</div>
            </Link>
            <Link to="/articles/snowflake-cost-optimization-techniques-2026" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">12 proven Snowflake cost optimization techniques →</div>
              <div className="text-gray-400 text-sm">Cut credit consumption by 30–60% without hurting performance.</div>
            </Link>
            <Link to="/tools/snowflake-query-cost-estimator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Query Cost Estimator →</div>
              <div className="text-gray-400 text-sm">Estimate the cost of a single query from bytes scanned.</div>
            </Link>
            <Link to="/tools/databricks-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">Databricks Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Compare Snowflake credits to Databricks DBUs + VM hours.</div>
            </Link>
            <Link to="/tools/bigquery-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">BigQuery Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Compare on-demand $/TB vs slot-based editions.</div>
            </Link>
            <Link to="/tools/dbt-cloud-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl">
              <div className="text-blue-300 font-medium mb-1">dbt Cloud Cost Calculator →</div>
              <div className="text-gray-400 text-sm">Price the transformation layer running on top of Snowflake.</div>
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
