import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Mail, Linkedin, Rss, Users } from 'lucide-react';
import wordpressApi from '@/services/wordpressApi';
import { buildEmailDigest, buildLinkedInPost, selectRecentPosts } from '@/utils/weeklyDigest';

export function WeeklyDigestPage() {
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState(null);
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);

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

  const copy = async (label, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Mail className="w-7 h-7 text-blue-400" />
          Weekly digest
        </h1>
        <p className="text-gray-400">
          Signups now land in WordPress table <code className="text-slate-200">wp_newsletter_subscribers</code>.
          Send the issue from Buttondown or Brevo. Post the same three links on LinkedIn the same day.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <Users className="h-5 w-5 text-blue-300 mb-2" />
          <p className="text-sm text-gray-400">Stored emails</p>
          <p className="text-2xl font-bold text-white">
            {subscribers ? subscribers.count : 'WP table'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {subscribers
              ? 'Loaded with your export token.'
              : 'Set DEHUB_NEWSLETTER_EXPORT_TOKEN in wp-config and VITE_NEWSLETTER_EXPORT_TOKEN in the admin build to list them here. Or export from phpMyAdmin.'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <Rss className="h-5 w-5 text-orange-300 mb-2" />
          <p className="text-sm text-gray-400">RSS for auto-issues</p>
          <a
            href="https://dataengineerhub.blog/rss.xml"
            className="text-blue-400 hover:underline text-sm break-all"
            target="_blank"
            rel="noreferrer"
          >
            dataengineerhub.blog/rss.xml
          </a>
          <p className="text-xs text-gray-500 mt-2">
            Point Buttondown or Beehiiv at this feed if you want a draft when a post goes live.
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <Linkedin className="h-5 w-5 text-sky-300 mb-2" />
          <p className="text-sm text-gray-400">LinkedIn</p>
          <p className="text-sm text-white mt-1">Yes — post the digest there too.</p>
          <p className="text-xs text-gray-500 mt-2">
            Data engineers live on LinkedIn more than email. Same three links, different first line.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
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
            <h2 className="text-lg font-bold text-white">Buttondown / email draft</h2>
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

      <section className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-5 text-sm text-amber-50/90 space-y-2">
        <p className="font-semibold text-white">Where emails live, and how you send</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-300">
          <li>Signup on the site writes to WordPress. Upload the updated <code>functions.php</code>.</li>
          <li>Optional: add <code>DEHUB_BUTTONDOWN_API_KEY</code> or <code>DEHUB_BREVO_API_KEY</code> in <code>wp-config.php</code> so new signups also land in a send tool. Never put those keys in Vite — that makes Brevo check each reader&apos;s IP and reject them.</li>
          <li>
            If Brevo shows &quot;unrecognised IP address&quot;, deactivate API IP blocking at{' '}
            <a
              href="https://app.brevo.com/security/authorised_ips"
              target="_blank"
              rel="noreferrer"
              className="text-amber-200 underline"
            >
              app.brevo.com/security/authorised_ips
            </a>
            . Do not add subscriber IPs. Hostinger outbound IPs rotate, so an allowlist will break again.
          </li>
          <li>Once a week: copy the email draft into Buttondown (or Beehiiv) and send. Then paste the LinkedIn draft.</li>
        </ol>
      </section>
    </div>
  );
}

export default WeeklyDigestPage;
