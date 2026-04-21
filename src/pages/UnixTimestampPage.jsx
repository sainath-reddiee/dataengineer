// src/pages/UnixTimestampPage.jsx
// Unix timestamp <-> human date converter. High-volume DE / dev search term.
// Targets: unix timestamp converter, epoch converter, timestamp to date.
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Clock, Copy, Check, Calculator, BookOpen, RefreshCw } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

const PAD = (n) => String(n).padStart(2, '0');

function detectUnit(n) {
  if (!Number.isFinite(n)) return 'invalid';
  const abs = Math.abs(n);
  if (abs < 1e11) return 'seconds';
  if (abs < 1e14) return 'milliseconds';
  if (abs < 1e17) return 'microseconds';
  return 'nanoseconds';
}

function toDate(n, unit) {
  if (!Number.isFinite(n)) return null;
  let ms;
  if (unit === 'seconds') ms = n * 1000;
  else if (unit === 'milliseconds') ms = n;
  else if (unit === 'microseconds') ms = n / 1000;
  else if (unit === 'nanoseconds') ms = n / 1e6;
  else ms = n * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function fromDate(d, unit) {
  const ms = d.getTime();
  if (unit === 'seconds') return Math.floor(ms / 1000);
  if (unit === 'milliseconds') return ms;
  if (unit === 'microseconds') return ms * 1000;
  if (unit === 'nanoseconds') return ms * 1e6;
  return Math.floor(ms / 1000);
}

function formatIso(d) {
  return d.toISOString();
}
function formatUtc(d) {
  return d.toUTCString();
}
function formatLocal(d) {
  const y = d.getFullYear();
  const mo = PAD(d.getMonth() + 1);
  const da = PAD(d.getDate());
  const h = PAD(d.getHours());
  const mi = PAD(d.getMinutes());
  const s = PAD(d.getSeconds());
  const tz = -d.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  const tzh = PAD(Math.floor(Math.abs(tz) / 60));
  const tzm = PAD(Math.abs(tz) % 60);
  return `${y}-${mo}-${da} ${h}:${mi}:${s} ${sign}${tzh}:${tzm}`;
}
function formatRelative(d) {
  const diffSec = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diffSec);
  const future = diffSec > 0;
  let value, unit;
  if (abs < 60) { value = Math.round(abs); unit = 'second'; }
  else if (abs < 3600) { value = Math.round(abs / 60); unit = 'minute'; }
  else if (abs < 86400) { value = Math.round(abs / 3600); unit = 'hour'; }
  else if (abs < 2592000) { value = Math.round(abs / 86400); unit = 'day'; }
  else if (abs < 31536000) { value = Math.round(abs / 2592000); unit = 'month'; }
  else { value = Math.round(abs / 31536000); unit = 'year'; }
  if (value !== 1) unit += 's';
  return future ? `in ${value} ${unit}` : `${value} ${unit} ago`;
}

const EXAMPLES = [
  { label: 'Unix epoch', ts: 0 },
  { label: 'Y2K', ts: 946684800 },
  { label: '32-bit cutoff (2038)', ts: 2147483647 },
  { label: 'Jan 1 2026 UTC', ts: 1767225600 },
];

const FAQ = [
  {
    q: 'What is a Unix timestamp?',
    a: 'A Unix timestamp (aka Unix time, epoch time, POSIX time) is the number of seconds that have elapsed since 00:00:00 UTC on 1 January 1970, excluding leap seconds. It is the single most common way to represent a moment in time in databases, logs, and APIs because it is timezone-agnostic, sorts correctly as an integer, and is language-independent.',
  },
  {
    q: 'What is the difference between seconds, milliseconds, microseconds, and nanoseconds?',
    a: 'Unix time was originally defined in seconds, but systems often need more precision. JavaScript, Kafka, Java, and most logging systems use milliseconds (13 digits). Snowflake TIMESTAMP_NTZ stores nanosecond precision internally. Databases like Postgres and BigQuery use microseconds (16 digits). This tool auto-detects the unit from the magnitude of your number, or you can force a unit with the selector.',
  },
  {
    q: 'What timezone is a Unix timestamp in?',
    a: 'None - Unix timestamps are always UTC by definition. The ambiguity happens at display time when a system renders the timestamp in the user\'s local timezone. When debugging, always compare timestamps in UTC (ISO 8601 format with the Z suffix) to avoid mixing timezones.',
  },
  {
    q: 'What is the Year 2038 problem?',
    a: 'Systems that store Unix time as a signed 32-bit integer can only represent times up to 2^31 - 1 seconds past the epoch, which is 03:14:07 UTC on 19 January 2038. After that, the counter overflows to a negative number (December 1901). Most modern systems now use 64-bit timestamps and are unaffected, but legacy embedded systems, older databases, and poorly-written code can still be vulnerable. Check your data warehouse column types (should be BIGINT or TIMESTAMP, never INT).',
  },
  {
    q: 'How do I convert a Unix timestamp in Snowflake?',
    a: 'Use TO_TIMESTAMP_NTZ(unix_seconds) for seconds, TO_TIMESTAMP_NTZ(unix_ms, 3) for milliseconds, or TO_TIMESTAMP_NTZ(unix_ns, 9) for nanoseconds. The second argument is the scale (power of 10 for sub-second precision). To go the other way: DATE_PART(EPOCH_SECOND, my_timestamp).',
  },
  {
    q: 'How do I convert in PostgreSQL, BigQuery, and other databases?',
    a: 'PostgreSQL: TO_TIMESTAMP(unix_seconds) or EXTRACT(EPOCH FROM my_timestamp). BigQuery: TIMESTAMP_SECONDS(unix_seconds), TIMESTAMP_MILLIS(unix_ms), TIMESTAMP_MICROS(unix_us) and UNIX_SECONDS(my_timestamp). MySQL: FROM_UNIXTIME(unix_seconds) and UNIX_TIMESTAMP(my_datetime). Python: datetime.fromtimestamp(unix_seconds, tz=timezone.utc) and my_datetime.timestamp().',
  },
];

export default function UnixTimestampPage() {
  const [input, setInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [forcedUnit, setForcedUnit] = useState('auto');
  const [humanInput, setHumanInput] = useState(new Date().toISOString().slice(0, 19));
  const [humanUnit, setHumanUnit] = useState('seconds');
  const [copied, setCopied] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const n = useMemo(() => {
    const clean = String(input).trim().replace(/[, ]/g, '');
    if (!clean) return NaN;
    return Number(clean);
  }, [input]);

  const effectiveUnit = useMemo(() => {
    if (forcedUnit !== 'auto') return forcedUnit;
    return detectUnit(n);
  }, [n, forcedUnit]);

  const d = useMemo(() => toDate(n, effectiveUnit), [n, effectiveUnit]);

  const humanResult = useMemo(() => {
    const parsed = new Date(humanInput + (humanInput.endsWith('Z') ? '' : 'Z'));
    if (isNaN(parsed.getTime())) return { ok: false };
    return { ok: true, ts: fromDate(parsed, humanUnit), date: parsed };
  }, [humanInput, humanUnit]);

  const copy = useCallback(async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch { /* ignore */ }
  }, []);

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Unix Timestamp Converter',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: 'Free Unix timestamp converter. Convert epoch time (seconds, ms, us, ns) to human-readable UTC, ISO 8601, and local datetime. Reverse conversion included.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://dataengineerhub.blog/tools/unix-timestamp-converter',
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
        title="Unix Timestamp Converter 2026 - Epoch to Date (seconds, ms, us, ns)"
        description="Free Unix timestamp converter. Auto-detects seconds, milliseconds, microseconds, nanoseconds. Converts to UTC, ISO 8601, local time. Snowflake, Postgres, BigQuery SQL examples."
        keywords="unix timestamp converter, epoch converter, timestamp to date, unix time, epoch time converter, timestamp converter online"
        url="/tools/unix-timestamp-converter"
        type="website"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Unix Timestamp Converter', url: '/tools/unix-timestamp-converter' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 rounded-full">
            Last updated: April 2026 &middot; All conversions client-side
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <Clock className="w-8 h-8 text-cyan-400" />
            Unix Timestamp Converter
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl">
            Convert Unix epoch time to human-readable dates and back. Auto-detects
            <strong> seconds, milliseconds, microseconds, and nanoseconds</strong> by magnitude.
            Shows UTC, ISO 8601, local time, and a relative description (like "3 hours ago").
          </p>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Current Unix time</div>
            <div className="text-xl font-mono text-cyan-300">{Math.floor(now / 1000)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Milliseconds</div>
            <div className="text-xl font-mono text-cyan-300">{now}</div>
          </div>
          <button
            onClick={() => { setInput(String(Math.floor(Date.now() / 1000))); setForcedUnit('auto'); }}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white"
          >
            <RefreshCw className="w-4 h-4" /> Use current time
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Timestamp &rarr; Date</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="1767225600"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 font-mono text-sm"
              />
              <select
                value={forcedUnit}
                onChange={(e) => setForcedUnit(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
              >
                <option value="auto">auto</option>
                <option value="seconds">sec</option>
                <option value="milliseconds">ms</option>
                <option value="microseconds">us</option>
                <option value="nanoseconds">ns</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 mb-3">Detected unit: <span className="text-cyan-400">{effectiveUnit}</span></div>
            {d ? (
              <div className="space-y-2 text-sm">
                {[
                  { k: 'iso', label: 'ISO 8601 (UTC)', value: formatIso(d) },
                  { k: 'utc', label: 'UTC (human)', value: formatUtc(d) },
                  { k: 'local', label: 'Local time', value: formatLocal(d) },
                  { k: 'rel', label: 'Relative', value: formatRelative(d) },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-xs text-gray-500">{row.label}</div>
                      <div className="font-mono text-cyan-200 text-sm break-all">{row.value}</div>
                    </div>
                    <button
                      onClick={() => copy(row.k, row.value)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded text-gray-300"
                    >
                      {copied === row.k ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-400 text-sm">Enter a valid number.</p>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Date &rarr; Timestamp</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="datetime-local"
                step="1"
                value={humanInput}
                onChange={(e) => setHumanInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-white px-3 py-2 text-sm"
              />
              <select
                value={humanUnit}
                onChange={(e) => setHumanUnit(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm"
              >
                <option value="seconds">sec</option>
                <option value="milliseconds">ms</option>
                <option value="microseconds">us</option>
                <option value="nanoseconds">ns</option>
              </select>
            </div>
            {humanResult.ok ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-xs text-gray-500">Unix timestamp ({humanUnit})</div>
                    <div className="font-mono text-cyan-200 text-base">{humanResult.ts}</div>
                  </div>
                  <button
                    onClick={() => copy('hts', String(humanResult.ts))}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded text-gray-300"
                  >
                    {copied === 'hts' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500">Interpreted as UTC</div>
                  <div className="font-mono text-gray-300 text-xs">{formatIso(humanResult.date)}</div>
                </div>
              </div>
            ) : (
              <p className="text-red-400 text-sm">Enter a valid date.</p>
            )}
          </div>
        </div>

        <Suspense fallback={null}>
          <AdPlacement />
        </Suspense>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Common Unix timestamps (quick reference)</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.ts}
                onClick={() => { setInput(String(ex.ts)); setForcedUnit('seconds'); }}
                className="text-left p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg"
              >
                <div className="text-sm text-white font-medium">{ex.label}</div>
                <div className="text-xs font-mono text-cyan-300 mt-1">{ex.ts}</div>
                <div className="text-xs text-gray-500 mt-0.5">{new Date(ex.ts * 1000).toUTCString()}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">SQL conversion cheat sheet</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-slate-700">
                  <th className="py-2 pr-4">Database</th>
                  <th className="py-2 pr-4">Unix seconds &rarr; timestamp</th>
                  <th className="py-2">Timestamp &rarr; Unix seconds</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-slate-800 text-gray-300 font-mono text-xs">
                <tr><td>Snowflake</td><td>TO_TIMESTAMP_NTZ(epoch_s)</td><td>DATE_PART(EPOCH_SECOND, ts)</td></tr>
                <tr><td>PostgreSQL</td><td>TO_TIMESTAMP(epoch_s)</td><td>EXTRACT(EPOCH FROM ts)</td></tr>
                <tr><td>BigQuery</td><td>TIMESTAMP_SECONDS(epoch_s)</td><td>UNIX_SECONDS(ts)</td></tr>
                <tr><td>MySQL</td><td>FROM_UNIXTIME(epoch_s)</td><td>UNIX_TIMESTAMP(ts)</td></tr>
                <tr><td>Redshift</td><td>TIMESTAMP 'epoch' + epoch_s * INTERVAL '1 second'</td><td>EXTRACT(EPOCH FROM ts)</td></tr>
                <tr><td>Databricks</td><td>from_unixtime(epoch_s)</td><td>unix_timestamp(ts)</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs mt-3">
            For milliseconds: Snowflake uses <code>TO_TIMESTAMP_NTZ(epoch_ms, 3)</code>, BigQuery uses
            <code> TIMESTAMP_MILLIS()</code>, Postgres needs <code>TO_TIMESTAMP(epoch_ms / 1000.0)</code>.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Related tools &amp; guides</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/tools/cron-expression-builder" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> Cron Expression Builder -&gt;</div>
              <div className="text-gray-400 text-sm">Build cron schedules with next-fire preview.</div>
            </Link>
            <Link to="/tools/sql-formatter" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1">SQL Formatter -&gt;</div>
              <div className="text-gray-400 text-sm">Pretty-print SQL that uses epoch functions.</div>
            </Link>
            <Link to="/tools/snowflake-cost-calculator" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1 flex items-center gap-2"><Calculator className="w-4 h-4" /> Snowflake Cost Calculator -&gt;</div>
              <div className="text-gray-400 text-sm">Estimate spend on your time-series tables.</div>
            </Link>
            <Link to="/cheatsheets/snowflake-sql" className="block p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-xl">
              <div className="text-cyan-300 font-medium mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Snowflake SQL Reference -&gt;</div>
              <div className="text-gray-400 text-sm">TIMESTAMP functions and conversions.</div>
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
