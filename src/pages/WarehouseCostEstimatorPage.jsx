// src/pages/WarehouseCostEstimatorPage.jsx
// Warehouse cost estimator v2: one workload, four platforms, every unit and
// unit price visible and sourced. Describes the lowest list-price estimate;
// it never recommends a platform.
import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import StickyToolTotal from '@/components/StickyToolTotal';
import { PLATFORM_ORDER, WAREHOUSE_PRICING } from '@/data/warehousePricing';
import { DEFAULT_INPUTS, estimateAll, SHAPES } from '@/lib/estimator/warehouseEstimate';

const usd = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const PARAMS = { tb: 'tb', hours: 'h', storageGB: 'g', shape: 'c', sfCreditsPerHour: 'sf', dbxDBUsPerHour: 'dbx', bqSlots: 'bq', rsRPUs: 'rs' };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 tabular-nums';

const UNIT_FIELDS = [
  ['sfCreditsPerHour', 'Snowflake credits per hour'],
  ['dbxDBUsPerHour', 'Databricks DBUs per hour'],
  ['bqSlots', 'BigQuery slots (Editions)'],
  ['rsRPUs', 'Redshift Serverless RPUs'],
];

const PRICE_ROWS = [
  ['snowflake', 'Credit', (p) => `$${p.creditPrice} per credit`],
  ['snowflake', 'Storage', (p) => `$${p.storagePerGB} per GB-month`],
  ['databricks', 'DBU (SQL Pro)', (p) => `$${p.dbuPrice} per DBU`],
  ['databricks', 'Storage', (p) => `$${p.storagePerGB} per GB-month`],
  ['bigquery', 'On-demand', (p) => `$${p.onDemandPerTB} per TB scanned`],
  ['bigquery', 'Editions (Enterprise)', (p) => `$${p.editionsPerSlotHour} per slot-hour`],
  ['bigquery', 'Storage (active)', (p) => `$${p.storagePerGB} per GB-month`],
  ['redshift', 'Serverless compute', (p) => `$${p.rpuHourPrice} per RPU-hour`],
  ['redshift', 'Managed storage', (p) => `$${p.storagePerGB} per GB-month`],
];

const WarehouseCostEstimatorPage = () => {
  const [params, setParams] = useSearchParams();
  const inputs = useMemo(() => {
    const out = { ...DEFAULT_INPUTS };
    for (const [key, p] of Object.entries(PARAMS)) {
      const v = params.get(p);
      if (v !== null && v !== '') out[key] = key === 'shape' ? v : Number(v);
    }
    return out;
  }, [params]);
  const { results, lowestId, units } = useMemo(() => estimateAll(inputs), [inputs]);
  const sorted = [...results].sort((a, b) => a.total - b.total);
  const lowest = results.find((r) => r.id === lowestId);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === undefined) next.delete(PARAMS[key]);
    else next.set(PARAMS[key], value);
    // Changing the workload shape resets per-platform overrides to its defaults.
    if (key === 'shape') for (const [k] of UNIT_FIELDS) next.delete(PARAMS[k]);
    setParams(next, { replace: true });
  };

  return (
    <>
      <MetaTags
        title="Warehouse Cost Estimator: Snowflake, Databricks, BigQuery, Redshift"
        description="Estimate one workload's monthly list-price cost on Snowflake, Databricks, BigQuery and Redshift Serverless, with every unit price, source and formula shown."
        url="/tools/warehouse-cost-estimator"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Warehouse cost estimator</h1>
            <p className="text-slate-300 max-w-3xl">
              Describe one monthly workload and compare list-price estimates for Snowflake, Databricks, BigQuery and
              Redshift Serverless. Every unit and price is shown below with its source and the date it was checked.
              Contract discounts, egress and reserved capacity are not included.
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <section aria-label="Workload" className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 h-fit space-y-4">
              <h2 className="text-white font-semibold">Workload per month</h2>
              <label className="block text-sm text-slate-300">
                Data scanned (TB)
                <input type="number" min="0" value={inputs.tb} onChange={(e) => update('tb', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm text-slate-300">
                Compute hours
                <input type="number" min="0" value={inputs.hours} onChange={(e) => update('hours', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm text-slate-300">
                Storage (GB)
                <input type="number" min="0" value={inputs.storageGB} onChange={(e) => update('storageGB', e.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm text-slate-300">
                Workload shape
                <select value={inputs.shape} onChange={(e) => update('shape', e.target.value)} className={inputClass}>
                  {Object.entries(SHAPES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                </select>
              </label>
              <details className="border-t border-slate-800 pt-3">
                <summary className="cursor-pointer text-sm text-blue-300">Platform units per hour (optional)</summary>
                <p className="text-xs text-slate-400 mt-2">Defaults come from the workload shape. Change them if you know your own sizing.</p>
                {UNIT_FIELDS.map(([key, label]) => (
                  <label key={key} className="block text-sm text-slate-300 mt-3">
                    {label}
                    <input type="number" min="0" value={units[key]} onChange={(e) => update(key, e.target.value)} className={inputClass} />
                  </label>
                ))}
              </details>
            </section>

            <div>
              <p className="text-sm text-slate-300 mb-3" aria-live="polite">
                Lowest list-price estimate for these inputs: <strong className="text-white">{lowest.label}</strong> at{' '}
                <strong className="text-white">{usd(lowest.total)}</strong> per month.
              </p>
              <ol className="grid gap-4 sm:grid-cols-2">
                {sorted.map((r) => (
                  <li key={r.id} className={`bg-slate-900/70 border rounded-xl p-5 ${r.id === lowestId ? 'border-emerald-500/70' : 'border-slate-800'}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-white font-semibold">{r.label}</h2>
                      {r.id === lowestId && <span className="text-xs text-emerald-300">Lowest estimate</span>}
                    </div>
                    <p className="mt-2 text-3xl font-bold text-white tabular-nums">{usd(r.total)}<span className="text-sm text-slate-400 font-normal"> /month</span></p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <dt className="text-slate-400">Compute</dt><dd className="text-slate-200 tabular-nums text-right">{usd(r.compute)}</dd>
                      <dt className="text-slate-400">Storage</dt><dd className="text-slate-200 tabular-nums text-right">{usd(r.storage)}</dd>
                      {r.other > 0 && (<><dt className="text-slate-400">Cloud services</dt><dd className="text-slate-200 tabular-nums text-right">{usd(r.other)}</dd></>)}
                    </dl>
                    <p className="mt-3 text-xs text-slate-400">{r.units}</p>
                    <p className="mt-1 text-xs text-slate-500 font-mono break-words">{r.formula}</p>
                  </li>
                ))}
              </ol>

              <section className="mt-8 bg-slate-900/70 border border-slate-800 rounded-xl p-5 overflow-x-auto">
                <h2 className="text-white font-semibold mb-3">Price assumptions</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-1 pr-3 font-normal">Platform</th>
                      <th className="py-1 pr-3 font-normal">Item</th>
                      <th className="py-1 pr-3 font-normal">List price</th>
                      <th className="py-1 font-normal">Source, checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICE_ROWS.map(([id, item, fmt]) => {
                      const p = WAREHOUSE_PRICING[id];
                      return (
                        <tr key={`${id}-${item}`} className="border-t border-slate-800 text-slate-200">
                          <td className="py-1.5 pr-3">{p.label}</td>
                          <td className="py-1.5 pr-3">{item}</td>
                          <td className="py-1.5 pr-3 tabular-nums">{fmt(p)}</td>
                          <td className="py-1.5">
                            <a href={p.source.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">{p.source.title}</a>
                            <span className="text-slate-500">, {p.verifiedOn}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-slate-400">
                  Regions and tiers: {PLATFORM_ORDER.map((id) => `${WAREHOUSE_PRICING[id].label}: ${WAREHOUSE_PRICING[id].region}`).join('; ')}.
                </p>
              </section>

              <section className="mt-6 text-sm text-slate-300 space-y-2">
                <h2 className="text-white font-semibold">What this does not include</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Negotiated discounts, which are common on Snowflake and Databricks contracts and rare on BigQuery on-demand.</li>
                  <li>Data egress, networking, backup and long-term storage tiers.</li>
                  <li>BigQuery's free 1 TB of on-demand scanning per month, and Redshift's minimum billing per query.</li>
                  <li>How each platform actually performs on your queries: equal hours on different engines do not do equal work.</li>
                </ul>
                <p>
                  For a single platform in more detail, use the <Link to="/tools/snowflake-cost-calculator" className="text-blue-300 underline">Snowflake</Link>,{' '}
                  <Link to="/tools/databricks-cost-calculator" className="text-blue-300 underline">Databricks</Link> or{' '}
                  <Link to="/tools/bigquery-cost-calculator" className="text-blue-300 underline">BigQuery</Link> calculators, or the original{' '}
                  <Link to="/tools/cloud-data-warehouse-cost-comparison" className="text-blue-300 underline">three-platform comparison</Link>.
                </p>
              </section>
            </div>
          </div>
        </div>
        <StickyToolTotal label={`Lowest: ${lowest.label}`} value={`${usd(lowest.total)}/mo`} />
      </div>
    </>
  );
};

export default WarehouseCostEstimatorPage;
