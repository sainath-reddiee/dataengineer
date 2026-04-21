// src/pages/CronBuilderPage.jsx
// Visual cron expression builder with human-readable parsing and next-run preview.
// Targets "cron expression builder", "cron generator", "airflow cron", "snowflake task cron".
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, Copy, Check, Calculator, BookOpen, Zap } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const PRESETS = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every 15 minutes', expr: '*/15 * * * *' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Every 4 hours', expr: '0 */4 * * *' },
  { label: 'Daily at 2 AM', expr: '0 2 * * *' },
  { label: 'Daily at 9 AM (business)', expr: '0 9 * * *' },
  { label: 'Weekdays 9 AM', expr: '0 9 * * 1-5' },
  { label: 'Weekly Monday 8 AM', expr: '0 8 * * 1' },
  { label: 'Monthly 1st at midnight', expr: '0 0 1 * *' },
  { label: 'Quarterly (Jan/Apr/Jul/Oct 1st)', expr: '0 0 1 */3 *' },
];

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parse a single cron field into the set of matching integers.
function expandField(expr, min, max, names = null) {
  if (expr === '*' || expr === '?') {
    const out = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
  }
  const result = new Set();
  for (const part of expr.split(',')) {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart ? Number(stepPart) : 1;
    if (!isFinite(step) || step < 1) throw new Error(`Invalid step: ${stepPart}`);
    let start, end;
    if (rangePart === '*') {
      start = min;
      end = max;
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-');
      start = parseNumberOrName(a, names, min, max);
      end = parseNumberOrName(b, names, min, max);
    } else {
      start = parseNumberOrName(rangePart, names, min, max);
      end = stepPart ? max : start;
    }
    if (start < min || end > max || start > end) throw new Error(`Out of range: ${rangePart}`);
    for (let i = start; i <= end; i += step) result.add(i);
  }
  return [...result].sort((a, b) => a - b);
}

function parseNumberOrName(s, names, min, max) {
  const n = Number(s);
  if (isFinite(n)) return n;
  if (names) {
    const idx = names.findIndex((v) => v.toLowerCase() === s.toLowerCase());
    if (idx >= 0) return idx + min;
  }
  throw new Error(`Bad token: ${s}`);
}

function parseCron(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('Cron must have 5 fields: minute hour day month weekday');
  const [m, h, dom, mo, dow] = parts;
  return {
    minutes: expandField(m, 0, 59),
    hours: expandField(h, 0, 23),
    daysOfMonth: expandField(dom, 1, 31),
    months: expandField(mo, 1, 12, MONTH_NAMES),
    daysOfWeek: expandField(dow === '7' ? '0' : dow, 0, 6, DOW_NAMES),
    dowSpecified: dow !== '*' && dow !== '?',
    domSpecified: dom !== '*' && dom !== '?',
  };
}

function humanize(parsed, raw) {
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid (needs 5 fields)';
  const [m, h] = parts;
  const freq =
    m === '*' ? 'every minute' :
    /^\*\/\d+$/.test(m) ? `every ${m.split('/')[1]} minute(s)` :
    h === '*' ? `at minute ${m} of every hour` :
    /^\*\/\d+$/.test(h) ? `at minute ${m}, every ${h.split('/')[1]} hour(s)` :
    parsed.hours.length === 1 && parsed.minutes.length === 1
      ? `at ${String(parsed.hours[0]).padStart(2, '0')}:${String(parsed.minutes[0]).padStart(2, '0')}`
      : 'custom schedule';

  const days =
    parts[4] === '*' && parts[2] === '*' ? 'every day' :
    parts[4] !== '*' ? `on ${parsed.daysOfWeek.map((d) => DOW_NAMES[d]).join(', ')}` :
    parts[2] !== '*' ? `on day(s) ${parsed.daysOfMonth.join(', ')} of the month` :
    'every day';

  const months =
    parts[3] === '*' ? '' :
    ` in ${parsed.months.map((mm) => MONTH_NAMES[mm - 1]).join(', ')}`;

  return `Runs ${freq}, ${days}${months}.`;
}

function nextRuns(parsed, fromDate, count) {
  const out = [];
  let cursor = new Date(fromDate);
  cursor.setSeconds(0, 0);
  cursor = new Date(cursor.getTime() + 60000); // start from next minute

  let safety = 0;
  while (out.length < count && safety < 525600) {
    safety++;
    const min = cursor.getMinutes();
    const hr = cursor.getHours();
    const dom = cursor.getDate();
    const mon = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    const domMatch = parsed.daysOfMonth.includes(dom);
    const dowMatch = parsed.daysOfWeek.includes(dow);
    // Cron OR-logic: if both DOM and DOW are specified, match either.
    const dayMatch =
      parsed.domSpecified && parsed.dowSpecified
        ? domMatch || dowMatch
        : domMatch && dowMatch;

    if (
      parsed.minutes.includes(min) &&
      parsed.hours.includes(hr) &&
      parsed.months.includes(mon) &&
      dayMatch
    ) {
      out.push(new Date(cursor));
    }
    cursor = new Date(cursor.getTime() + 60000);
  }
  return out;
}

const FAQ = [
  {
    q: 'What cron format does this builder use?',
    a: 'Standard 5-field Unix cron: minute (0–59), hour (0–23), day of month (1–31), month (1–12 or JAN–DEC), day of week (0–6 or SUN–SAT; 0 and 7 both mean Sunday). This is the format used by Unix crond, Airflow, dbt Cloud, Snowflake TASK USING CRON, GitHub Actions, and most orchestrators.',
  },
  {
    q: 'How do I schedule an Airflow DAG with this?',
    a: 'Set dag = DAG(schedule="0 2 * * *", ...). Airflow accepts standard cron strings. This builder will give you the exact string and show the next 5 run times so you can verify the interpretation before deploying.',
  },
  {
    q: 'How do I use this in a Snowflake TASK?',
    a: 'CREATE TASK my_task WAREHOUSE=wh SCHEDULE = \'USING CRON 0 2 * * * America/Los_Angeles\' AS SELECT ...;. Snowflake cron uses the same 5-field format but requires a timezone. The preview in this tool uses your browser timezone — if your warehouse is in a different TZ, double-check the next-run times.',
  },
  {
    q: 'Why does 0 0 * * 1-5 not run on weekends?',
    a: 'The last field (day of week) is 1-5 which is Monday through Friday. Changing it to * would mean any day of the week, and changing to 0,6 or 6,0 would mean only weekends. Day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday.',
  },
  {
    q: 'Can I schedule down to the second?',
    a: 'No — standard cron has minute resolution. For sub-minute schedules, use a streaming approach (Kafka consumer, Snowflake Streams+Tasks with SYSTEM$STREAM_HAS_DATA, a continuous process). Do not try to schedule faster than every minute in cron.',
  },
  {
    q: 'What is the difference between 0 * * * * and */60 * * * *?',
    a: 'They are equivalent: both run once at minute 0 of every hour. Prefer 0 * * * * as the idiomatic form. Similarly, 0 */1 * * * == 0 * * * *. For every-15-minutes use */15 * * * *.',
  },
];

export default function CronBuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expr, setExpr] = useState(() => searchParams.get('c') || '0 2 * * *');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams({ c: expr }, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [expr, setSearchParams]);

  const { parsed, error, human, upcoming } = useMemo(() => {
    try {
      const p = parseCron(expr);
      return {
        parsed: p,
        error: null,
        human: humanize(p, expr),
        upcoming: nextRuns(p, new Date(), 5),
      };
    } catch (e) {
      return { parsed: null, error: e.message, human: null, upcoming: [] };
    }
  }, [expr]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(expr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [expr]);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cron Expression Builder',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description:
      'Free cron expression builder. Parse and validate 5-field cron. Next-run preview. Works with Airflow, Snowflake TASK, dbt Cloud, Unix crontab.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/cron-expression-builder',
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
        title="Cron Expression Builder 2026 — Airflow, Snowflake, dbt, Unix"
        description="Free cron expression builder. Validate 5-field cron, see the next 5 run times, copy-paste into Airflow, Snowflake TASK, dbt Cloud, or crontab. Preset library included."
        keywords="cron expression builder, cron generator, airflow cron, snowflake task cron, dbt cloud schedule, crontab generator, cron validator"
        url="/tools/cron-expression-builder"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Cron Expression Builder', url: '/tools/cron-expression-builder' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 rounded-full">
            5-field Unix cron · Airflow / Snowflake / dbt / crontab compatible
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Clock className="w-8 h-8 text-cyan-400" />
            Cron Expression Builder
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Build, validate, and preview cron schedules. Type any 5-field expression and see the
            next 5 run times in your timezone — or start from a preset. Copy directly into Airflow
            DAG schedules, Snowflake TASK clauses, dbt Cloud schedules, or crontab entries.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-300">Cron expression</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-white px-4 py-3 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              spellCheck={false}
            />
            <button
              onClick={handleCopy}
              className="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-white text-sm flex items-center gap-2"
            >
              {copied ? (<><Check className="w-4 h-4 text-green-400" /> Copied</>) : (<><Copy className="w-4 h-4" /> Copy</>)}
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
              <div className="text-gray-500 mb-1">Minute</div>
              <div className="text-white font-mono">0-59</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
              <div className="text-gray-500 mb-1">Hour</div>
              <div className="text-white font-mono">0-23</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
              <div className="text-gray-500 mb-1">Day of Month</div>
              <div className="text-white font-mono">1-31</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
              <div className="text-gray-500 mb-1">Month</div>
              <div className="text-white font-mono">1-12</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
              <div className="text-gray-500 mb-1">Day of Week</div>
              <div className="text-white font-mono">0-6</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Human reading</h2>
            {error ? (
              <div className="text-red-300 text-sm bg-red-900/30 border border-red-700/50 rounded-lg p-3">
                {error}
              </div>
            ) : (
              <p className="text-cyan-300 text-lg leading-relaxed">{human}</p>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Next 5 runs (local time)</h2>
            {upcoming.length === 0 ? (
              <p className="text-gray-500 text-sm">Fix the expression to see next runs.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-mono">{d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', weekday: 'short' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Preset schedules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                onClick={() => setExpr(p.expr)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  expr === p.expr
                    ? 'bg-cyan-900/30 border-cyan-500 text-cyan-100'
                    : 'bg-slate-900/50 border-slate-700 text-gray-300 hover:border-cyan-600'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">{p.label}</div>
                <div className="font-mono text-sm">{p.expr}</div>
              </button>
            ))}
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Cron syntax quick reference</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><code className="text-cyan-300 font-mono">*</code> — any value (wildcard)</li>
            <li><code className="text-cyan-300 font-mono">,</code> — list separator (e.g., <code>1,15,30</code>)</li>
            <li><code className="text-cyan-300 font-mono">-</code> — range (e.g., <code>1-5</code> = Mon-Fri)</li>
            <li><code className="text-cyan-300 font-mono">/</code> — step (e.g., <code>*/15</code> = every 15)</li>
            <li><code className="text-cyan-300 font-mono">0 0 * * 0</code> — every Sunday at midnight</li>
            <li><code className="text-cyan-300 font-mono">0 2 1 * *</code> — 2 AM on the 1st of every month</li>
            <li><code className="text-cyan-300 font-mono">0 9 * * 1-5</code> — 9 AM weekdays</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Platform-specific notes</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="text-white font-semibold mb-1">Apache Airflow</h3>
              <p>
                Pass the cron string directly to <code>schedule=</code> or <code>schedule_interval=</code>
                in DAG(). Airflow&apos;s next-run logic is based on the logical date (start of the
                interval), not the wall-clock time.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Snowflake TASK</h3>
              <p>
                <code>SCHEDULE = &apos;USING CRON 0 2 * * * America/Los_Angeles&apos;</code>. You
                must include a valid IANA timezone. Snowflake does NOT run on the wildcard minute
                within an hour — it runs exactly at the crontab time.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">dbt Cloud</h3>
              <p>
                In Job settings, choose "Custom cron schedule" and paste the expression. dbt Cloud
                uses UTC by default — account for TZ offset when scheduling business-hour runs.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Unix crontab</h3>
              <p>
                Standard. The left-most field is minute. 6-field variants (with seconds) are
                non-standard and NOT supported in crontab(5) — use them only with tools that
                explicitly accept them (Spring Scheduler, Quartz).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools & guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/dbt-cloud-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> dbt Cloud Cost Calculator →</div>
              <div className="text-gray-400 text-sm">See how your schedule maps to builds/month.</div>
            </Link>
            <Link to="/cheatsheets/airflow-essentials" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Airflow Essentials →</div>
              <div className="text-gray-400 text-sm">DAG patterns, operators, scheduling pitfalls.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-streams-tasks-interview" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1 flex items-center gap-2"><Zap className="w-4 h-4" /> Snowflake Streams & Tasks →</div>
              <div className="text-gray-400 text-sm">Event-driven alternative to cron scheduling.</div>
            </Link>
            <Link to="/cheatsheets/dbt-commands" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1">dbt Commands Reference →</div>
              <div className="text-gray-400 text-sm">All dbt CLI commands for scheduled runs.</div>
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
                  <span className="text-cyan-400 group-open:rotate-45 transition-transform text-xl">+</span>
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
