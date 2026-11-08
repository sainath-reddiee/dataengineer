import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { extractPipelineInstrument } from '@/utils/extractPipelineInstrument';
import { ADSENSE_REVIEW_MODE, isReviewAllowlistedTool } from '@/data/adsenseQualityGate';

const MODE_LABELS = {
  trace: 'Execution trace',
  billing: '60s billing window',
  storage: 'Partition pruning',
  incident: 'Failure & retry diff',
};

const FDN_PARTITIONS = [
  { id: 'fdn_01', range: '2025-01 .. 2025-02', sizeMb: 16, keepOnPrune: false },
  { id: 'fdn_02', range: '2025-03 .. 2025-04', sizeMb: 16, keepOnPrune: false },
  { id: 'fdn_03', range: '2025-05 .. 2025-06', sizeMb: 16, keepOnPrune: false },
  { id: 'fdn_04', range: '2025-07 .. 2025-08', sizeMb: 16, keepOnPrune: false },
  { id: 'fdn_05', range: '2025-09 .. 2025-10', sizeMb: 16, keepOnPrune: false },
  { id: 'fdn_06', range: '2025-11 .. 2025-12', sizeMb: 16, keepOnPrune: false },
  { id: 'fdn_07', range: '2026-01 .. 2026-02', sizeMb: 16, keepOnPrune: true },
  { id: 'fdn_08', range: '2026-03 .. 2026-04', sizeMb: 16, keepOnPrune: true },
];

export default function PipelineInstrument({ post, slug }) {
  const spec = useMemo(() => extractPipelineInstrument(post, slug), [post, slug]);

  const [activeMode, setActiveMode] = useState(spec?.primaryMode || 'trace');
  const [traceIdx, setTraceIdx] = useState(2);
  const [isPlayingTrace, setIsPlayingTrace] = useState(false);
  const [billingMode, setBillingMode] = useState('single'); // 'single' | 'burst'
  const [sweepKey, setSweepKey] = useState(0);
  const [storageState, setStorageState] = useState('pruned'); // 'pruned' | 'unclustered' | 'cow'
  const [incidentState, setIncidentState] = useState('compare'); // 'failed' | 'compare'
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (spec?.primaryMode) {
      setActiveMode(spec.primaryMode);
      setTraceIdx(Math.min(2, (spec.trace?.steps?.length || 1) - 1));
      setIsPlayingTrace(false);
      setBillingMode('single');
      setStorageState('pruned');
      setIncidentState('compare');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [spec?.slug, spec?.primaryMode, spec?.trace?.steps?.length]);

  useEffect(() => {
    if (!isPlayingTrace) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const total = spec?.trace?.steps?.length || 4;
    if (prefersReduced) {
      setTraceIdx(total - 1);
      setIsPlayingTrace(false);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setTraceIdx((prev) => {
        if (prev >= total - 1) {
          setIsPlayingTrace(false);
          return prev;
        }
        return prev + 1;
      });
    }, 680);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlayingTrace, spec?.trace?.steps?.length]);

  if (!spec) return null;

  const steps = spec.trace.steps;
  const safeTraceIdx = Math.min(traceIdx, Math.max(0, steps.length - 1));
  const currentStep = steps[safeTraceIdx] || steps[0];

  const querySec = spec.billing.querySeconds || 3;
  const minSec = spec.billing.minimumSeconds || 60;
  const burstCount = spec.billing.burstCount || 20;
  const workTotal = billingMode === 'burst' ? querySec * burstCount : querySec;
  const billedTotal = billingMode === 'burst' ? minSec * burstCount : minSec;
  const idlePercent = Math.round(((billedTotal - workTotal) / billedTotal) * 100);

  const allowToolLink = !ADSENSE_REVIEW_MODE || isReviewAllowlistedTool(spec.toolSlug);

  return (
    <details
      className="deh-instrument-disclosure"
      onToggle={(event) => {
        const next = event.currentTarget.open;
        setOpen(next);
        if (!next) setIsPlayingTrace(false);
      }}
    >
      <summary className="deh-instrument-summary">
        <span className="deh-instrument-summary-kicker">Pipeline schematic</span>
        <span className="deh-instrument-summary-meta">
          {MODE_LABELS[spec.primaryMode] || 'Diagram'} · {open ? 'Hide' : 'Show'}
        </span>
      </summary>
      {open && (
    <figure
      className="deh-instrument"
      aria-label={`Interactive engineering schematic: ${spec.kicker}`}
    >
      <div className="deh-instrument-header">
        <div>
          <p className="deh-instrument-kicker">{spec.kicker}</p>
          <p className="deh-instrument-sub">{spec.subtitle}</p>
        </div>

        {spec.modes.length > 1 && (
          <div className="deh-instrument-tabs" role="group" aria-label="Diagram view">
            {spec.modes.map((mode) => (
              <button
                key={mode}
                type="button"
                className="deh-instrument-tab"
                aria-pressed={activeMode === mode}
                onClick={() => {
                  setIsPlayingTrace(false);
                  setActiveMode(mode);
                }}
              >
                {MODE_LABELS[mode] || mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeMode === 'trace' && (
        <div className="deh-instrument-body">
          <div className="deh-trace-grid">
            <div className="deh-pane">
              <div className="deh-pane-head">
                <span>{spec.trace.fileLabel}</span>
                <span>
                  Step {safeTraceIdx + 1} of {steps.length}
                </span>
              </div>
              <ol className="deh-code-list">
                {steps.map((step, idx) => {
                  const active = idx === safeTraceIdx;
                  return (
                    <li
                      key={step.id}
                      className={`deh-code-row ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        setIsPlayingTrace(false);
                        setTraceIdx(idx);
                      }}
                    >
                      <button
                        type="button"
                        className="deh-code-row-btn"
                        aria-pressed={active}
                      >
                        <span className="deh-ln">{step.line}</span>
                        <code>{step.code}</code>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="deh-wire-payload">
                <span className="deh-wire-label">Active SQL / wire payload</span>
                <code>{currentStep.payload}</code>
              </div>
            </div>

            <div className="deh-pane">
              <div className="deh-pane-head">
                <span>Execution boundary</span>
                <span>{currentStep.status}</span>
              </div>
              <svg
                viewBox="0 0 340 188"
                width="100%"
                className="deh-svg"
                role="img"
                aria-label={`Execution boundary from ${spec.trace.leftZone} to ${spec.trace.rightZone}`}
              >
                <rect x="8" y="10" width="112" height="168" rx="3" className="deh-svg-zone" />
                <text x="16" y="26" className="deh-svg-zone-title">
                  {spec.trace.leftZone}
                </text>
                <rect x="148" y="10" width="184" height="168" rx="3" className="deh-svg-zone deh-svg-zone-alt" />
                <text x="158" y="26" className="deh-svg-zone-title">
                  {spec.trace.rightZone}
                </text>

                {[54, 90, 126, 160].map((y, idx) => (
                  <line
                    key={y}
                    x1="120"
                    y1={y}
                    x2="158"
                    y2={y}
                    className={idx === safeTraceIdx ? 'deh-svg-wire-active' : 'deh-svg-wire'}
                  />
                ))}

                <g
                  className="deh-svg-pulse"
                  style={{ transform: `translateY(${safeTraceIdx * 36}px)` }}
                >
                  <circle cx="120" cy="54" r="4" className="deh-svg-pin" />
                  <circle cx="158" cy="54" r="4" className="deh-svg-pin" />
                </g>

                {steps.map((step, idx) => {
                  const y = 40 + idx * 36 - (idx === 3 ? 2 : 0);
                  const textY = y + 17;
                  const active = idx === safeTraceIdx;
                  return (
                    <g key={step.id}>
                      <g
                        className={`deh-svg-node ${active ? 'is-current' : ''}`}
                        onClick={() => {
                          setIsPlayingTrace(false);
                          setTraceIdx(idx);
                        }}
                      >
                        <rect x="16" y={y} width="96" height="26" rx="2" />
                        <text x="22" y={textY}>
                          {idx + 1}. {step.id.slice(0, 10)}
                        </text>
                      </g>
                      <g
                        className={`deh-svg-node ${active ? 'is-current' : ''}`}
                        onClick={() => {
                          setIsPlayingTrace(false);
                          setTraceIdx(idx);
                        }}
                      >
                        <rect x="158" y={y} width="164" height="26" rx="2" />
                        <text x="166" y={textY}>
                          {step.target}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="deh-instrument-controls">
            <div className="deh-btn-group">
              <button
                type="button"
                className="deh-ctrl-btn deh-ctrl-btn-primary"
                onClick={() => {
                  setIsPlayingTrace(false);
                  setTraceIdx((prev) => (prev + 1) % steps.length);
                }}
              >
                Advance step
              </button>
              <button
                type="button"
                className="deh-ctrl-btn"
                onClick={() => {
                  if (isPlayingTrace) {
                    setIsPlayingTrace(false);
                  } else {
                    setTraceIdx(0);
                    setIsPlayingTrace(true);
                  }
                }}
              >
                {isPlayingTrace ? 'Pause trace' : 'Play trace'}
              </button>
            </div>
            <div className="deh-telemetry" aria-live="polite">
              <span>
                Duration <strong>{currentStep.duration}</strong>
              </span>
              <span>
                Compute <strong>{currentStep.warehouse}</strong>
              </span>
              <span>
                Est. credits <strong>{currentStep.credits}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'billing' && (
        <div className="deh-instrument-body">
          <div className="deh-pane">
            <div className="deh-pane-head">
              <span>
                60-second minimum billing window ({querySec}s query after warehouse auto-suspend)
              </span>
              <span>
                {billingMode === 'burst'
                  ? `${burstCount} spaced dashboard refreshes`
                  : spec.billing.warehouseLabel}
              </span>
            </div>

            <svg
              viewBox="0 0 640 164"
              width="100%"
              className="deh-svg"
              role="img"
              aria-label={`Comparison of ${workTotal} seconds active query work versus ${billedTotal} seconds billed warehouse time`}
            >
              <defs>
                <pattern
                  id={`deh-idle-hatch-${spec.slug}`}
                  width="8"
                  height="8"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="8" className="deh-hatch-stroke" strokeWidth="2" />
                </pattern>
              </defs>

              <line x1="128" y1="28" x2="616" y2="28" className="deh-axis-line" />
              <text x="128" y="19" className="deh-axis-txt">0s</text>
              <text x="156" y="19" className="deh-axis-txt">{querySec}s</text>
              <text x="250" y="19" className="deh-axis-txt">15s</text>
              <text x="372" y="19" className="deh-axis-txt">30s</text>
              <text x="494" y="19" className="deh-axis-txt">45s</text>
              <text x="596" y="19" className="deh-axis-txt">60s</text>

              <text x="12" y="62" className="deh-lane-title">Cold resume</text>
              <text x="12" y="78" className="deh-lane-sub">60s floor</text>
              <rect x="128" y="42" width="488" height="42" rx="2" className="deh-meter-bg" />
              <rect x="128" y="42" width="28" height="42" className="deh-meter-work" />
              <rect
                x="156"
                y="42"
                width="460"
                height="42"
                fill={`url(#deh-idle-hatch-${spec.slug})`}
              />
              <text x="166" y="67" className="deh-meter-alert">
                {minSec - querySec}s billed idle tail per cold resume ({idlePercent}% idle tax)
              </text>

              <text x="12" y="124" className="deh-lane-title">Optimized</text>
              <text x="12" y="140" className="deh-lane-sub">{spec.billing.altLabel.slice(0, 18)}</text>
              <rect x="128" y="104" width="488" height="42" rx="2" className="deh-meter-bg" />
              <rect x="128" y="104" width="24" height="42" className="deh-meter-work" />
              <text x="162" y="129" className="deh-meter-note">
                {spec.billing.altNote}
              </text>

              <g
                key={sweepKey}
                className="deh-playhead"
              >
                <line x1="616" y1="24" x2="616" y2="152" className="deh-playhead-line" />
                <rect x="588" y="4" width="48" height="16" rx="2" className="deh-playhead-tag" />
                <text x="612" y="15" textAnchor="middle" className="deh-playhead-txt">
                  {billedTotal}s
                </text>
              </g>
            </svg>
          </div>

          <div className="deh-instrument-controls">
            <div className="deh-btn-group">
              <button
                type="button"
                className="deh-ctrl-btn deh-ctrl-btn-primary"
                onClick={() => {
                  setBillingMode('single');
                  setSweepKey((k) => k + 1);
                }}
              >
                Sweep 60s window
              </button>
              <button
                type="button"
                className="deh-ctrl-btn"
                aria-pressed={billingMode === 'burst'}
                onClick={() =>
                  setBillingMode((prev) => (prev === 'burst' ? 'single' : 'burst'))
                }
              >
                {billingMode === 'burst'
                  ? 'Show 1 query resume'
                  : `Simulate ${burstCount} BI refreshes`}
              </button>
            </div>
            <div className="deh-telemetry" aria-live="polite">
              <span>
                Active query work <strong>{workTotal}s</strong>
              </span>
              <span>
                Billed compute <strong>{billedTotal.toLocaleString()}s</strong>
              </span>
              <span>
                Idle tail <strong className="is-rust">{idlePercent}%</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'storage' && (
        <div className="deh-instrument-body">
          <div className="deh-pane">
            <div className="deh-pane-head">
              <code>
                {storageState === 'pruned'
                  ? spec.storage.prunedQuery
                  : storageState === 'unclustered'
                  ? spec.storage.unclusteredQuery
                  : spec.storage.cowQuery}
              </code>
              <span>
                {storageState === 'pruned'
                  ? 'FDN metadata skip: 6 pruned, 2 scanned'
                  : storageState === 'unclustered'
                  ? 'Min/max range overlap: 8 of 8 scanned'
                  : 'Copy-on-write forks fdn_07 (+16 MB)'}
              </span>
            </div>

            <div className="deh-fdn-grid">
              {FDN_PARTITIONS.map((part, idx) => {
                let cellState = 'scanned';
                let statusText = 'Scanned I/O';
                if (storageState === 'pruned') {
                  cellState = part.keepOnPrune ? 'scanned' : 'pruned';
                  statusText = part.keepOnPrune ? 'Scanned I/O' : 'Header skip';
                } else if (storageState === 'unclustered') {
                  cellState = 'scanned';
                  statusText = 'Full scan I/O';
                } else if (storageState === 'cow') {
                  cellState = idx === 6 ? 'cow' : 'scanned';
                  statusText = idx === 6 ? 'Forked (+16 MB)' : 'Shared pointer';
                }

                return (
                  <div
                    key={part.id}
                    className={`deh-fdn-cell is-${cellState}`}
                  >
                    <div className="deh-fdn-top">
                      <span>{part.id}.fdn</span>
                      <span>{part.sizeMb} MB</span>
                    </div>
                    <div className="deh-fdn-range">{part.range}</div>
                    <div className="deh-fdn-foot">{statusText}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="deh-instrument-controls">
            <div className="deh-btn-group">
              <button
                type="button"
                className="deh-ctrl-btn deh-ctrl-btn-primary"
                aria-pressed={storageState === 'pruned'}
                onClick={() => setStorageState('pruned')}
              >
                Run pruned scan
              </button>
              <button
                type="button"
                className="deh-ctrl-btn"
                aria-pressed={storageState === 'unclustered'}
                onClick={() => setStorageState('unclustered')}
              >
                Run unclustered scan
              </button>
              <button
                type="button"
                className="deh-ctrl-btn"
                aria-pressed={storageState === 'cow'}
                onClick={() => setStorageState('cow')}
              >
                Mutate clone block
              </button>
            </div>
            <div className="deh-telemetry" aria-live="polite">
              <span>
                I/O read{' '}
                <strong>
                  {storageState === 'pruned'
                    ? '32 MB / 128 MB'
                    : storageState === 'unclustered'
                    ? '128 MB / 128 MB'
                    : '16 MB written'}
                </strong>
              </span>
              <span>
                Clone delta{' '}
                <strong className={storageState === 'cow' ? 'is-rust' : ''}>
                  {storageState === 'cow' ? '+16 MB owned' : '0 MB (shared)'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'incident' && (
        <div className="deh-instrument-body">
          <div className="deh-pane">
            <div className="deh-pane-head">
              <span>{spec.incident.scenarioTitle}</span>
              <span>
                {incidentState === 'failed'
                  ? `Halted at step ${spec.incident.failIndex + 1}`
                  : 'Recovery path comparison'}
              </span>
            </div>

            <div className="deh-incident-tracks">
              {[
                {
                  label: spec.incident.topLabel,
                  sub: spec.incident.topSub,
                  isRootRerun: true,
                },
                {
                  label: spec.incident.bottomLabel,
                  sub: spec.incident.bottomSub,
                  isRootRerun: false,
                },
              ].map((lane) => (
                <div key={lane.label} className="deh-track-row">
                  <div className="deh-track-meta">
                    <strong>{lane.label}</strong>
                    <span>{lane.sub}</span>
                  </div>
                  <ol className="deh-dag-chain">
                    {spec.incident.steps.map((stepName, idx) => {
                      const failIdx = spec.incident.failIndex;
                      let stateClass = 'is-ok';
                      let badge = 'Completed';

                      if (incidentState === 'failed') {
                        if (idx < failIdx) {
                          stateClass = 'is-ok';
                          badge = 'Done (upstream)';
                        } else if (idx === failIdx) {
                          stateClass = 'is-alert';
                          badge = 'FAILED';
                        } else {
                          stateClass = 'is-muted';
                          badge = 'Blocked';
                        }
                      } else if (idx < failIdx) {
                        if (lane.isRootRerun) {
                          stateClass = 'is-alert';
                          badge = 'Re-run (dup)';
                        } else {
                          stateClass = 'is-muted';
                          badge = 'Preserved';
                        }
                      } else if (idx === failIdx) {
                        stateClass = 'is-ok';
                        badge = lane.isRootRerun ? 'Re-ran' : 'Cleared & ran';
                      }

                      return (
                        <li key={stepName} className={`deh-dag-node ${stateClass}`}>
                          <span>{stepName}</span>
                          <small>{badge}</small>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          <div className="deh-instrument-controls">
            <div className="deh-btn-group">
              <button
                type="button"
                className="deh-ctrl-btn deh-ctrl-btn-primary"
                aria-pressed={incidentState === 'failed'}
                onClick={() => setIncidentState('failed')}
              >
                Trigger failure at step {spec.incident.failIndex + 1}
              </button>
              <button
                type="button"
                className="deh-ctrl-btn"
                aria-pressed={incidentState === 'compare'}
                onClick={() => setIncidentState('compare')}
              >
                Compare recovery cost
              </button>
            </div>
            <div className="deh-telemetry" aria-live="polite">
              <span>
                {spec.incident.topLabel}:{' '}
                <strong className="is-rust">
                  {incidentState === 'failed' ? 'Halted' : spec.incident.topCost}
                </strong>
              </span>
              <span>
                {spec.incident.bottomLabel}:{' '}
                <strong>
                  {incidentState === 'failed' ? 'Halted' : spec.incident.bottomCost}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      <figcaption className="deh-instrument-footer">
        <p className="deh-instrument-verify">{spec.verificationNote}</p>
        {allowToolLink && spec.toolSlug && (
          <Link
            to={`/tools/${spec.toolSlug}`}
            reloadDocument={ADSENSE_REVIEW_MODE}
            className="deh-instrument-tool-link"
          >
            {spec.toolLabel} →
          </Link>
        )}
      </figcaption>
    </figure>
      )}
    </details>
  );
}
