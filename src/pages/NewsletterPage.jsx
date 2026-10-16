import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Rss } from 'lucide-react';
import Newsletter from '@/components/Newsletter';
import MetaTags from '@/components/SEO/MetaTags';
import { WORDPRESS_API_URL } from '@/apiConfig';

const UNSUBSCRIBE_URL = `${WORDPRESS_API_URL}/wp-json/dehub/v1/newsletter/unsubscribe`;

// Result of the emailed confirmation link (?confirmed=1 or ?confirm=invalid).
const ConfirmNotice = ({ ok }) => (
  <div className={`mb-10 border-l-2 px-4 py-3 text-[16px] ${ok ? 'border-green-600 bg-green-50 text-green-900' : 'border-red-600 bg-red-50 text-red-900'}`} role="status">
    {ok
      ? "You're subscribed. The next article will arrive in your inbox."
      : 'That confirmation link is not valid any more. Subscribe again below and use the newest email.'}
  </div>
);

// Unsubscribe needs a click on this page: link scanners in mail clients
// follow GET links, so a bare link must never remove anyone.
const UnsubscribePanel = ({ token }) => {
  const [state, setState] = useState('idle');
  const unsubscribe = async () => {
    setState('working');
    try {
      const res = await fetch(UNSUBSCRIBE_URL, { method: 'POST', body: new URLSearchParams({ token }) });
      const body = await res.json().catch(() => ({}));
      setState(res.ok && body.success ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="mb-10 border-y border-paper-500 py-6">
      {state === 'done' ? (
        <p className="text-[17px] text-ink-body">You're unsubscribed and won't get more emails. Sorry to see you go.</p>
      ) : (
        <>
          <p className="mb-4 text-[17px] text-ink-body">Stop getting an email when a new article is published?</p>
          <button
            type="button"
            onClick={unsubscribe}
            disabled={state === 'working'}
            className="inline-flex min-h-11 items-center rounded bg-ink px-5 text-[15px] font-medium text-paper hover:bg-rust-600 disabled:opacity-60"
          >
            {state === 'working' ? 'Unsubscribing…' : 'Unsubscribe'}
          </button>
          {state === 'error' && (
            <p className="mt-3 text-sm text-red-700">
              That didn't work. Reply to any newsletter email and I'll remove you by hand.
            </p>
          )}
        </>
      )}
    </div>
  );
};

const NewsletterPage = () => {
  const [searchParams] = useSearchParams();
  const unsubscribeToken = searchParams.get('unsubscribe') || '';
  const confirmed = searchParams.get('confirmed') === '1';
  const confirmInvalid = searchParams.get('confirm') === 'invalid';

  return (
    <>
      <MetaTags
        title="Newsletter: new articles by email"
        noindex={true}
        description="Get an email when DataEngineer Hub publishes a new article on Snowflake, dbt, Airflow, or the modern data stack. No spam, unsubscribe in one click."
        keywords="data engineering newsletter, Snowflake tutorials, dbt guides, data engineering updates"
      />
      <div className="px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <p className="kicker mb-3">Newsletter</p>
          <h1 className="font-serif text-[36px] font-semibold leading-tight text-ink sm:text-[44px]">
            New articles, by email
          </h1>

          {(confirmed || confirmInvalid) && <div className="mt-8"><ConfirmNotice ok={confirmed} /></div>}
          {unsubscribeToken && <div className="mt-8"><UnsubscribePanel token={unsubscribeToken} /></div>}

          <div className="mt-6 space-y-4 font-serif text-[19px] leading-relaxed text-ink-body">
            <p>
              When I publish a new article on Snowflake, dbt, Airflow or the rest of the data stack, you get one
              short email with the title, a summary and the link. That is the whole newsletter: no daily noise, no
              promotions, no tracking pixels.
            </p>
            <p>
              Subscribing takes two steps: enter your email, then click the confirmation link I send you. Every
              email has a one-click unsubscribe, and your address is never sold or shared with sponsors.
            </p>
          </div>

          <div className="mt-10">
            <Newsletter />
          </div>

          <p className="mt-8 text-[15px] text-ink-muted">
            Prefer RSS?{' '}
            <a href="/rss.xml" className="inline-flex items-center gap-1 text-rust-600 underline decoration-rust-200 underline-offset-2">
              <Rss className="h-3.5 w-3.5" aria-hidden="true" />
              Use the feed
            </a>
            . New articles are also shared on{' '}
            <a
              href="https://www.linkedin.com/in/sainathreddypogaku/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rust-600 underline decoration-rust-200 underline-offset-2"
            >
              LinkedIn
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default NewsletterPage;
