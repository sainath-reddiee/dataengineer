import { useState } from 'react';
import { Send, CheckCircle, Rss, AlertCircle, Loader2 } from 'lucide-react';
import { useNewsletter } from '@/hooks/useWordPress';
import { trackNewsletterSignup } from '@/utils/analytics';

const EmailDigestBanner = () => {
  const [email, setEmail] = useState('');
  const { subscribe, loading, error, success, pending, reset } = useNewsletter();

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

  return (
    <section
      aria-labelledby="article-newsletter-heading"
      className="mx-auto my-10 max-w-2xl rounded border border-paper-500 border-t-2 border-t-ink bg-paper-300 p-5 sm:p-6"
    >
      {success ? (
        <div className="flex items-center gap-2 py-2 text-sm font-medium text-ink" role="status">
          <CheckCircle className="h-5 w-5 text-rust-600" aria-hidden="true" />
          <span>
            {pending
              ? 'Check your inbox (and spam folder) for a confirmation link.'
              : 'Subscribed. New production notes will arrive by email.'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-rust-600">
              Weekly notebook
            </p>
            <h2
              id="article-newsletter-heading"
              className="mt-1 font-serif text-lg font-semibold text-ink"
            >
              Get new Snowflake, dbt and Airflow notes by email
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              One practical digest when a new tutorial goes live. No popups or vendor spam.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto sm:max-w-sm">
            <label htmlFor="article-digest-email" className="sr-only">
              Email address
            </label>
            <input
              id="article-digest-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={loading}
              className="min-w-0 flex-1 rounded border border-paper-600 bg-paper-50 px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="compact-control inline-flex shrink-0 items-center gap-1.5 rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-rust-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{loading ? 'Sending…' : 'Subscribe'}</span>
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-rust-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{typeof error === 'string' ? error : 'Subscription failed. Please try again.'}</span>
          <span className="text-xs text-ink-muted">
            · Or follow via{' '}
            <a href="/rss.xml" className="text-rust-600 underline underline-offset-2">
              <Rss className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
              RSS
            </a>
          </span>
        </div>
      )}
    </section>
  );
};

export default EmailDigestBanner;
