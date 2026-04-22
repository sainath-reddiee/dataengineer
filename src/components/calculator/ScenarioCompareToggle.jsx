// src/components/calculator/ScenarioCompareToggle.jsx
// Lightweight A/B scenario compare primitive. Renders two tabs (A and B) that
// swap which scenario is currently being edited, plus a diff summary row.
// The parent owns both scenario state objects; this component is presentational.
import React from 'react';
import { GitCompare } from 'lucide-react';

const ScenarioCompareToggle = ({
  enabled,
  onToggle,
  activeScenario,
  onScenarioChange,
  totalA,
  totalB,
  formatValue = (v) => String(v),
  labelA = 'Scenario A',
  labelB = 'Scenario B',
}) => {
  const delta = (totalB ?? 0) - (totalA ?? 0);
  const deltaPct = totalA ? (delta / totalA) * 100 : 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-purple-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-white">Compare two scenarios</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-purple-600' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div
            className="grid grid-cols-2 gap-2 p-1 bg-slate-900/60 rounded-xl"
            role="tablist"
            aria-label="Scenario selector"
          >
            {[
              { id: 'A', label: labelA, total: totalA },
              { id: 'B', label: labelB, total: totalB },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={activeScenario === s.id}
                onClick={() => onScenarioChange(s.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeScenario === s.id
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{s.label}</span>
                  <span className="text-xs font-mono text-gray-300">
                    {s.total != null ? formatValue(s.total) : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {totalA != null && totalB != null && (
            <div
              className={`text-xs flex items-center justify-between px-3 py-2 rounded-lg ${
                delta < 0
                  ? 'bg-green-900/30 text-green-300 border border-green-800/50'
                  : delta > 0
                    ? 'bg-red-900/30 text-red-300 border border-red-800/50'
                    : 'bg-slate-900/40 text-gray-400 border border-slate-700'
              }`}
              aria-live="polite"
            >
              <span>B vs A</span>
              <span className="font-mono">
                {delta > 0 ? '+' : ''}
                {formatValue(delta)}
                {totalA !== 0 && (
                  <>
                    {' '}({deltaPct > 0 ? '+' : ''}
                    {deltaPct.toFixed(1)}%)
                  </>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScenarioCompareToggle;
