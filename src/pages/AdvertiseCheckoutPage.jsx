// Pay for an advertise package by card. WordPress creates a Dodo Payments
// checkout session and the buyer pays on Dodo's hosted page, then returns
// here with ?order=<ref> to see the confirmed status.
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import advertiseConfig from '@/data/advertiseConfig.json';
import { trackEvent } from '@/utils/analytics';
import { getCheckoutOptions, getOrderStatus, isDodoCheckoutUrl, startCheckout } from '@/services/checkoutService';

const OPPORTUNITIES = advertiseConfig.opportunities;
const CONTACT_EMAIL = 'sainath@dataengineerhub.blog';
const linkClass = 'text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500';
const inputClass = 'mt-1 w-full rounded border border-paper-500 bg-paper-50 px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink';

function planLabel(opp, d) {
  if (d.key === 'monthly') return `$${d.price} for 30 days`;
  if (d.key === 'yearly') return `$${d.price} for 12 months`;
  return opp.packageKey === 'announcement' ? `$${d.price} per release` : `$${d.price} one-time`;
}

const NEXT_STEPS = {
  announcement: 'Reply to the confirmation email with the release text (up to 800 words) and one image or logo. It goes live within 3 working days.',
  default: 'I will email you within two working days to agree the copy, link and start date. Nothing goes live until you approve it.',
};

const Shell = ({ children, wide = false }) => (
  <>
    <MetaTags
      title="Pay for a sponsorship"
      description="Card checkout for DataEngineer Hub sponsorship packages, handled by Dodo Payments."
      noindex={true}
    />
    <div className="px-4 pb-16 pt-10 sm:px-6">
      <div className={`mx-auto ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>{children}</div>
    </div>
  </>
);

const MAX_CHECKS = 10;
const HEADING = 'font-serif text-[34px] font-semibold leading-tight text-ink';
const BODY = 'mt-4 text-[17px] leading-relaxed text-ink-body';

const OrderStatus = ({ orderRef, providerStatus }) => {
  const [order, setOrder] = useState(null);
  const [checks, setChecks] = useState(0);
  const [round, setRound] = useState(0);

  // The webhook usually lands within seconds of the redirect; poll briefly,
  // and let the buyer start another round if it takes longer.
  useEffect(() => {
    let cancelled = false;
    let timer;
    const check = async (n) => {
      const data = await getOrderStatus(orderRef).catch(() => null);
      if (cancelled) return;
      setOrder(data);
      setChecks(n);
      if (data?.status === 'paid') {
        trackEvent({ action: 'sponsorship_paid', category: 'monetization', label: `${data.package}:${data.plan}` });
        return;
      }
      if (data?.notFound) return;
      if (n < MAX_CHECKS && (!data || data.status === 'pending' || data.status === 'created')) {
        timer = setTimeout(() => check(n + 1), 3000);
      }
    };
    check(1);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [orderRef, round]);

  const opp = OPPORTUNITIES.find((o) => o.packageKey === order?.package);
  // Dodo appends ?status=failed|cancelled when the buyer backs out; a
  // cancelled checkout may never send a webhook, so trust it unless paid.
  const providerGaveUp = providerStatus === 'failed' || providerStatus === 'cancelled';
  const status = order?.notFound ? 'not_found' : order?.status !== 'paid' && providerGaveUp ? 'failed' : order?.status;
  const waiting = !order || status === 'pending' || status === 'created';
  const gaveUpChecking = waiting && checks >= MAX_CHECKS;
  const retryPath = order?.package ? `/advertise/checkout?package=${order.package}&plan=${order.plan}` : '/advertise/checkout';
  const known = ['paid', 'pending', 'created', 'failed', 'cancelled', 'error', 'expired', 'refunded', 'partially_refunded', 'not_found'];
  const mail = <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a>;

  return (
    <Shell>
      <p className="kicker mb-3">Checkout</p>
      {status === 'paid' && (
        <>
          <h1 className={HEADING}>Payment received, thank you</h1>
          <p className={BODY}>
            {opp ? `"${opp.title}" is paid.` : 'Your package is paid.'} A confirmation email is on its way, and Dodo Payments sends the tax receipt separately.
          </p>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-body">{NEXT_STEPS[order.package] || NEXT_STEPS.default}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {order.package === 'announcement' ? (
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Announcement for order ${orderRef}`)}`}
                className="inline-flex min-h-11 items-center rounded bg-ink px-5 text-[15px] font-medium text-paper hover:bg-rust-600"
              >
                Email the release now
              </a>
            ) : (
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Sponsorship order ${orderRef}`)}`}
                className="inline-flex min-h-11 items-center rounded bg-ink px-5 text-[15px] font-medium text-paper hover:bg-rust-600"
              >
                Send the copy and link
              </a>
            )}
            <Link to="/articles" className="text-[15px] text-ink-soft underline decoration-paper-600 underline-offset-4 hover:text-rust-600">
              Back to the articles
            </Link>
          </div>
        </>
      )}
      {waiting && (
        <>
          <h1 className={HEADING}>Confirming your payment…</h1>
          <p className={BODY} role="status">
            {gaveUpChecking && providerStatus === 'succeeded'
              ? 'Dodo Payments reported the payment as successful; the confirmation is taking longer than usual. You will still get an email, and there is no need to pay again.'
              : gaveUpChecking
                ? 'I could not confirm the payment yet. If you were charged, you will get an email shortly; there is no need to pay again.'
                : 'This usually takes a few seconds.'}
          </p>
          {gaveUpChecking && (
            <button
              type="button"
              onClick={() => { setChecks(0); setRound((r) => r + 1); }}
              className="mt-5 inline-flex min-h-11 items-center rounded border border-ink px-5 text-[15px] font-medium text-ink hover:border-rust-600 hover:text-rust-600"
            >
              Check again
            </button>
          )}
        </>
      )}
      {(status === 'failed' || status === 'cancelled' || status === 'error' || status === 'expired') && (
        <>
          <h1 className={HEADING}>The payment did not go through</h1>
          <p className={BODY}>
            Nothing was charged. You can <Link to={retryPath} className={linkClass}>try again</Link> or email {mail} for a PayPal invoice.
          </p>
        </>
      )}
      {(status === 'refunded' || status === 'partially_refunded') && (
        <>
          <h1 className={HEADING}>{status === 'refunded' ? 'This order was refunded' : 'This order was partly refunded'}</h1>
          <p className={BODY}>
            Dodo Payments returns the money, including any tax, to the card you paid with. Banks usually take 5 to 10 working days to show it.
            See the <Link to="/refund-policy" className={linkClass}>refund policy</Link>, or email {mail} with any question.
          </p>
        </>
      )}
      {status === 'not_found' && (
        <>
          <h1 className={HEADING}>I could not find this order</h1>
          <p className={BODY}>
            Check that the link is complete. If you paid, email {mail} with this reference and I will sort it out; there is no need to pay again.
          </p>
        </>
      )}
      {order && !waiting && !known.includes(status) && (
        <>
          <h1 className={HEADING}>Order status: {String(status).replace(/_/g, ' ')}</h1>
          <p className={BODY}>If this looks wrong, email {mail} with the reference below.</p>
        </>
      )}
      <p className="mt-8 text-sm text-ink-faint">
        Order reference <span className="font-mono">{orderRef}</span>
        {order?.mode === 'test' && ' (test mode, no real charge)'}. Questions: {mail}.
      </p>
    </Shell>
  );
};

const CheckoutForm = ({ initialPackage, initialPlan }) => {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', notes: '', company_url: '' });
  const [choice, setChoice] = useState(initialPackage && initialPlan ? `${initialPackage}:${initialPlan}` : '');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCheckoutOptions().then((data) => { if (!cancelled) setOptions(data); });
    return () => { cancelled = true; };
  }, []);

  const choices = useMemo(() => {
    const enabled = new Set(options?.plans || []);
    return OPPORTUNITIES.flatMap((opp) => opp.durations
      .filter((d) => enabled.has(`${opp.packageKey}:${d.key}`))
      .map((d) => ({ value: `${opp.packageKey}:${d.key}`, label: `${opp.title}, ${planLabel(opp, d)}`, opp, d })));
  }, [options]);

  // Preselect the package from the link, or the first plan of that package.
  useEffect(() => {
    if (!choices.length || choices.some((c) => c.value === choice)) return;
    const match = choices.find((c) => c.opp.packageKey === initialPackage) || choices[0];
    setChoice(match.value);
  }, [choices, choice, initialPackage]);

  const selected = choices.find((c) => c.value === choice);
  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !agreed) return;
    const [pkg, plan] = selected.value.split(':');
    setLoading(true);
    setError(null);
    try {
      const { checkout_url: url } = await startCheckout({ ...form, package: pkg, plan });
      if (!isDodoCheckoutUrl(url)) throw new Error('Unexpected checkout address. Please email me instead.');
      trackEvent({ action: 'sponsorship_checkout_started', category: 'monetization', label: selected.value });
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const busy = loading;

  return (
    <Shell wide>
      <p className="kicker mb-3">Checkout</p>
      <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink sm:text-[40px]">Pay for a sponsorship</h1>
      <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-body">
        A few details for the order, then you pay on Dodo Payments' secure page. Not sure yet?{' '}
        <Link to="/advertise#inquiry" className={linkClass}>Send an inquiry first</Link>; there is no obligation.
      </p>

      {options === null && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-busy="true" aria-label="Loading packages">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded bg-paper-300" />)}
          </div>
          <div className="h-56 rounded bg-paper-300" />
        </div>
      )}
      {options && choices.length === 0 && (
        <div className="mt-8 max-w-2xl border-l-2 border-rust-500 bg-paper-100 px-4 py-4 text-[16px] text-ink-body">
          Card checkout is not available right now. Email <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a> and
          I will send a PayPal invoice instead.
        </div>
      )}

      {choices.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <form onSubmit={onSubmit} className="space-y-4" aria-describedby="checkout-summary">
            <input type="text" name="company_url" value={form.company_url} onChange={onChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm text-ink-muted">
                Package
                <select value={choice} onChange={(e) => setChoice(e.target.value)} className={inputClass}>
                  {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-ink-muted">
                  Your name
                  <input required name="name" value={form.name} onChange={onChange} className={inputClass} autoComplete="name" maxLength={120} />
                </label>
                <label className="block text-sm text-ink-muted">
                  Work email <span className="text-ink-faint">(receipt and next steps)</span>
                  <input required type="email" name="email" value={form.email} onChange={onChange} className={inputClass} autoComplete="email" inputMode="email" />
                </label>
                <label className="block text-sm text-ink-muted">
                  Company or product
                  <input name="company" value={form.company} onChange={onChange} className={inputClass} autoComplete="organization" maxLength={160} />
                </label>
                <label className="block text-sm text-ink-muted">
                  Website
                  <input type="url" name="website" value={form.website} onChange={onChange} className={inputClass} placeholder="https://" inputMode="url" />
                </label>
              </div>
              <label className="block text-sm text-ink-muted">
                {selected?.opp.packageKey === 'announcement'
                  ? 'Headline or a short note (you send the full release after paying)'
                  : 'Anything I should know (link, headline, preferred start date)'}
                <textarea name="notes" rows={4} value={form.notes} onChange={onChange} className={inputClass} maxLength={4000} />
              </label>
              <label className="flex items-start gap-3 text-[15px] text-ink-body">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-rust-600" required />
                <span>
                  I have read the <Link to="/advertise#rules" className={linkClass}>house rules</Link>: placements are labeled
                  "Sponsored", links are nofollow, and the copy needs approval before it goes live. I agree to the{' '}
                  <Link to="/terms-of-service" className={linkClass}>terms</Link> and{' '}
                  <Link to="/refund-policy" className={linkClass}>refund policy</Link>.
                </span>
              </label>
            </fieldset>
            {error && (
              <p className="border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p>
            )}
            <button
              type="submit"
              disabled={busy || !selected}
              className="inline-flex min-h-12 w-full items-center justify-center rounded bg-ink px-6 text-[16px] font-medium text-paper hover:bg-rust-600 disabled:opacity-60 sm:w-auto"
            >
              {busy ? 'Opening secure checkout…' : selected ? `Continue to payment · $${selected.d.price} + tax` : 'Continue to payment'}
            </button>
            <p className="text-sm text-ink-faint">
              You enter card details on Dodo Payments, not on this site. One payment, and a full refund if I decline the placement.
              Applicable tax (VAT, GST or sales tax) is added at checkout, and you may be charged in your local currency.
              {options?.mode === 'test' && ' Test mode is on: use a Dodo test card, nothing is charged.'}
            </p>
          </form>

          {selected && (
            <aside id="checkout-summary" className="order-first h-fit rounded border border-ink bg-paper-50 p-5 lg:sticky lg:top-24 lg:order-none" aria-label="Order summary">
              <p className="kicker">Order summary</p>
              <p className="mt-2 font-serif text-xl font-semibold leading-snug text-ink">{selected.opp.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{selected.d.desc}</p>
              <div className="mt-4 border-y border-paper-500 py-3">
                <p className="flex items-baseline justify-between">
                  <span className="text-[15px] text-ink-body">Price (USD)</span>
                  <span className="font-mono text-2xl text-ink">${selected.d.price}</span>
                </p>
                <p className="mt-1 flex items-baseline justify-between text-[13px] text-ink-muted">
                  <span>Tax</span>
                  <span>added at checkout where applicable</span>
                </p>
              </div>
              <p className="mt-2 text-[13px] leading-snug text-ink-muted">
                Dodo Payments shows the final total, possibly in your local currency, before you pay.
              </p>
              <ul className="mt-4 hidden space-y-2 text-[14px] leading-relaxed text-ink-body lg:block">
                {selected.opp.bullets.slice(0, 3).map((b) => (
                  <li key={b} className="flex gap-2"><span aria-hidden="true" className="text-rust-600">✓</span><span>{b}</span></li>
                ))}
              </ul>
              <ul className="mt-5 hidden space-y-1.5 border-t border-paper-500 pt-4 text-[13px] text-ink-muted lg:block">
                <li>One payment, no auto-renewal.</li>
                <li>Full refund if I decline it or you cancel before go-live.</li>
                <li>Tax receipt from Dodo Payments, the merchant of record.</li>
              </ul>
            </aside>
          )}
        </div>
      )}
    </Shell>
  );
};

const AdvertiseCheckoutPage = () => {
  const [params] = useSearchParams();
  const orderRef = params.get('order');
  if (orderRef && /^deh_[a-f0-9]{24}$/.test(orderRef)) {
    return <OrderStatus orderRef={orderRef} providerStatus={params.get('status')} />;
  }
  return <CheckoutForm initialPackage={params.get('package')} initialPlan={params.get('plan')} />;
};

export default AdvertiseCheckoutPage;
