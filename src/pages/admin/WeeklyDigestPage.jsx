import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Mail, Linkedin, Rss, Users, Download, Search } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { buildEmailDigest, buildLinkedInPost, selectRecentPosts } from '@/utils/weeklyDigest';

function toCsv(rows) {
  const header = 'email,subscribed_date,status';
  const body = (rows || []).map((row) => {
    const email = String(row.email || '').replace(/"/g, '""');
    const date = String(row.subscribed_date || '');
    const status = String(row.status || 'active');
    return `"${email}",${date},${status}`;
  });
  return [header, ...body].join('\n');
}

function downloadCsv(rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dataengineerhub-subscribers.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function WeeklyDigestPage() {
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState(null);
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await wordpressApi.getAllPosts(1, 20);
        if (!cancelled) setPosts(data.posts || []);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const token = import.meta.env.VITE_NEWSLETTER_EXPORT_TOKEN;
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await wordpressApi.getNewsletterSubscribers(token);
        if (!cancelled && data?.success) setSubscribers(data);
      } catch {
        if (!cancelled) setSubscribers(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const recent = useMemo(() => selectRecentPosts(posts, 7, 6), [posts]);
  const emailDraft = useMemo(() => buildEmailDigest(recent), [recent]);
  const linkedInDraft = useMemo(() => buildLinkedInPost(recent), [recent]);
  const rows = subscribers?.subscribers || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => String(row.email || '').toLowerCase().includes(q));
  }, [rows, query]);

  const copy = async (label, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 2000);
  };

  const allEmails = rows.map((row) => row.email).filter(Boolean).join('\n');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Mail className="w-7 h-7 text-blue-400" />
          Newsletter
        </h1>
        <p className="text-gray-400">
          Every signup is stored on your site. No Brevo, no IP allowlist, no extra fee.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
          <Users className="h-5 w-5 text-blue-300 mb-2" />
          <p className="text-sm text-gray-400">Subscribers</p>
          <p className="text-3xl font-bold text-white mt-1">
            {subscribers ? subscribers.count : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {subscribers
              ? 'Live from your WordPress list'
              : 'Add the export token once to see emails here'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
          <Rss className="h-5 w-5 text-orange-300 mb-2" />
          <p className="text-sm text-gray-400">Public signup</p>
          <a
            href="https://dataengineerhub.blog/newsletter"
            className="text-blue-400 hover:underline text-sm break-all"
            target="_blank"
            rel="noreferrer"
          >
            /newsletter
          </a>
          <p className="text-xs text-gray-500 mt-2">
            Anyone can subscribe. Their email lands in the table below.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
          <Linkedin className="h-5 w-5 text-sky-300 mb-2" />
          <p className="text-sm text-gray-400">Share the same links</p>
          <p className="text-sm text-white mt-1">Copy the LinkedIn draft each week.</p>
          <p className="text-xs text-gray-500 mt-2">
            Data engineers live on LinkedIn more than email.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Your list</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This is the source of truth. Download CSV if you later want Kit or beehiiv to send.
            </p>
          </div>
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy('emails', allEmails)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-gray-200 hover:text-white"
              >
                {copied === 'emails' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'emails' ? 'Copied' : 'Copy emails'}
              </button>
              <button
                type="button"
                onClick={() => downloadCsv(rows)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs text-white font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </div>
          )}
        </div>

        {subscribers ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search email…"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                        {rows.length === 0 ? 'No signups yet.' : 'No emails match that search.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <tr key={row.email} className="border-t border-slate-800 text-gray-200">
                        <td className="px-3 py-2 font-medium text-white">{row.email}</td>
                        <td className="px-3 py-2 text-gray-400">{row.subscribed_date || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{row.status || 'active'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-gray-300 space-y-2">
            <p className="font-semibold text-white">One-time setup to see emails here</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>
                In WordPress <code className="text-slate-200">wp-config.php</code> add{' '}
                <code className="text-slate-200">define(&apos;DEHUB_NEWSLETTER_EXPORT_TOKEN&apos;, &apos;a-long-random-string&apos;);</code>
              </li>
              <li>Put the same string in the admin build as <code className="text-slate-200">VITE_NEWSLETTER_EXPORT_TOKEN</code>.</li>
              <li>Upload the latest <code className="text-slate-200">functions.php</code> and rebuild admin.</li>
            </ol>
            <p className="text-xs text-gray-500">
              Until then you can still open the table <code>wp_newsletter_subscribers</code> in phpMyAdmin.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-5">
        <h2 className="text-lg font-bold text-white mb-2">Articles from the last 7 days</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-gray-400 text-sm">Nothing new this week. Use the archive links in the drafts below.</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-300">
            {recent.map((post) => (
              <li key={post.slug}>{post.title}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Email draft</h2>
            <button
              type="button"
              onClick={() => copy('email', emailDraft)}
              className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-white"
            >
              {copied === 'email' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </button>
          </div>
          <textarea readOnly rows={16} value={emailDraft} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">LinkedIn draft</h2>
            <button
              type="button"
              onClick={() => copy('li', linkedInDraft)}
              className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-white"
            >
              {copied === 'li' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </button>
          </div>
          <textarea readOnly rows={16} value={linkedInDraft} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200" />
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 text-sm text-emerald-50/90 space-y-2">
        <p className="font-semibold text-white">Want a pretty send inbox later?</p>
        <p className="text-gray-300">
          Stay here for free. If you later want a hosted send UI,{' '}
          <a href="https://kit.com" target="_blank" rel="noreferrer" className="text-emerald-300 underline">Kit</a>
          {' '}is free up to 10,000 subscribers, or{' '}
          <a href="https://www.beehiiv.com" target="_blank" rel="noreferrer" className="text-emerald-300 underline">beehiiv</a>
          {' '}is free up to 2,500. Download the CSV and import. Do not put those API keys in the website.
        </p>
      </section>
    </div>
  );
}

export default WeeklyDigestPage;
