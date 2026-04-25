import React, { useState } from 'react';
import { Mail, Send, X, CheckCircle, Rss, AlertCircle, Loader2 } from 'lucide-react';
import { useNewsletter } from '@/hooks/useWordPress';
import { trackNewsletterSignup } from '@/utils/analytics';

const STORAGE_KEY = 'email_digest_dismissed';

const EmailDigestBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [email, setEmail] = useState('');
  const { subscribe, loading, error, success, reset } = useNewsletter();

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* noop */ }
    setDismissed(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    const result = await subscribe(email);
    if (result.success) {
      trackNewsletterSignup('article_inline');
      setEmail('');
      setTimeout(() => reset(), 5000);
    }
  };

  if (dismissed) return null;

  return (
    <section className="my-10 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-5 sm:p-6 relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss email digest banner"
        className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {success ? (
        <div className="flex items-center justify-center gap-2 text-green-400 font-medium py-2">
          <CheckCircle className="h-5 w-5" />
          You're subscribed — welcome to the Data Digest!
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Get the Weekly Data Digest</p>
              <p className="text-xs text-gray-400 hidden sm:block">Tutorials &amp; insights, no spam.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 flex-1 w-full sm:w-auto sm:max-w-sm">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {loading ? 'Wait...' : 'Subscribe'}
            </button>
          </form>

          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-400 transition-colors"
          >
            <Rss className="h-3.5 w-3.5" />
            RSS
          </a>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center gap-2 text-red-400 text-sm mt-2">
          <AlertCircle className="h-4 w-4" />
          {typeof error === 'string' ? error : 'Subscription failed. Please try again.'}
        </div>
      )}
    </section>
  );
};

export default EmailDigestBanner;
