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

const Shell = ({ children }) => (
  <>
    <MetaTags
      title="Pay for a sponsorship"
      description="Card checkout for DataEngineer Hub sponsorship packages, handled by Dodo Payments."
      noindex={true}
    />
    <div className="px-4 pb-16 pt-10 sm:px-6">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  </>
);

const OrderStatus = ({ orderRef, providerStatus }) => {
  const [order, setOrder] = useState(null);
  const [checks, setChecks] = useState(0);

  // The webhook usually lands within seconds of the redirect; poll briefly.
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
      if (n < 10 && (!data || data.status === 'pending' || data.status === 'created')) {
        timer = setTimeout(() => check(n + 1), 3000);
      }
    };
    check(1);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [orderRef]);

  const opp = OPPORTUNITIES.find((o) => o.packageKey === order?.package);
  const status = order?.status;
  const waiting = !order || status === 'pending' || status === 'created';

  return (
    <Shell>
      <p className="kicker mb-3">Checkout</p>
      {status === 'paid' && (
        <>
          <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink">Payment received, thank you</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-body">
            {opp ? `"${opp.title}" is paid.` : 'Your package is paid.'} A confirmation email is on its way, and Dodo Payments sends the tax receipt separately.
          </p>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-body">{NEXT_STEPS[order.package] || NEXT_STEPS.default}</p>
        </>
      )}
      {waiting && (
        <>
          <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink">Confirming your payment…</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-body" role="status">
            {checks >= 10 && providerStatus === 'succeeded'
              ? 'Dodo Payments reported the payment as successful; the confirmation is taking longer than usual. You will still get an email, and there is no need to pay again.'
              : checks >= 10
                ? 'I could not confirm the payment yet. If you were charged, you will get an email shortly; there is no need to pay again.'
                : 'This usually takes a few seconds.'}
          </p>
        </>
      )}
      {(status === 'failed' || status === 'cancelled' || status === 'error') && (
        <>
          <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink">The payment did not go through</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-body">
            Nothing was charged. You can <Link to="/advertise/checkout" className={linkClass}>try again</Link> or email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a> for a PayPal invoice.
          </p>
        </>
      )}
      {status === 'refunded' && (
        <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink">This order was refunded</h1>
      )}
      <p className="mt-8 text-sm text-ink-faint">
        Order reference <span className="font-mono">{orderRef}</span>
        {order?.mode === 'test' && ' (test mode, no real charge)'}. Questions: <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a>.
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
      .map((d) => ({ value: `${opp.packageKey}:${d.key}`, label: `${opp.title}, ${planLabel(opp, d)}`, opp })));
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

  return (
    <Shell>
      <p className="kicker mb-3">Checkout</p>
      <h1 className="font-serif text-[34px] font-semibold leading-tight text-ink sm:text-[40px]">Pay for a sponsorship</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-body">
        Card payment through Dodo Payments, which acts as the merchant of record and sends the tax receipt. Prices are in
        USD. If I decide a placement is not a fit, or you cancel before it goes live, you get a full refund.
      </p>
      <p className="mt-2 text-sm text-ink-faint">
        Not sure yet? <Link to="/advertise#inquiry" className={linkClass}>Send an inquiry first</Link>; there is no obligation.
      </p>

      {options === null && <p className="mt-8 text-ink-muted">Loading packages…</p>}
      {options && choices.length === 0 && (
        <div className="mt-8 border-l-2 border-rust-500 bg-paper-100 px-4 py-4 text-[16px] text-ink-body">
          Card checkout is not available right now. Email <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a> and
          I will send a PayPal invoice instead.
        </div>
      )}

      {choices.length > 0 && (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input type="text" name="company_url" value={form.company_url} onChange={onChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <label className="block text-sm text-ink-muted">
            Package
            <select value={choice} onChange={(e) => setChoice(e.target.value)} className={inputClass}>
              {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          {selected && <p className="text-[15px] text-ink-muted">{selected.opp.tagline}.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-ink-muted">
              Your name
              <input required name="name" value={form.name} onChange={onChange} className={inputClass} autoComplete="name" maxLength={120} />
            </label>
            <label className="block text-sm text-ink-muted">
              Work email
              <input required type="email" name="email" value={form.email} onChange={onChange} className={inputClass} autoComplete="email" />
            </label>
            <label className="block text-sm text-ink-muted">
              Company or product
              <input name="company" value={form.company} onChange={onChange} className={inputClass} autoComplete="organization" maxLength={160} />
            </label>
            <label className="block text-sm text-ink-muted">
              Website
              <input type="url" name="website" value={form.website} onChange={onChange} className={inputClass} placeholder="https://" />
            </label>
          </div>
          <label className="block text-sm text-ink-muted">
            Anything I should know (link, headline, start date)
            <textarea name="notes" rows={4} value={form.notes} onChange={onChange} className={inputClass} maxLength={4000} />
          </label>
          <label className="flex items-start gap-3 text-[15px] text-ink-body">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-rust-600" required />
            <span>
              I have read the <Link to="/advertise#rules" className={linkClass}>house rules</Link>: placements are labeled
              "Sponsored", links are nofollow, and the copy needs approval before it goes live.
            </span>
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading || !agreed || !selected}
            className="inline-flex min-h-11 items-center rounded bg-ink px-6 text-[15px] font-medium text-paper hover:bg-rust-600 disabled:opacity-60"
          >
            {loading ? 'Opening secure checkout…' : 'Continue to payment'}
          </button>
          {options?.mode === 'test' && (
            <p className="text-sm text-ink-faint">Test mode: use a Dodo test card, nothing is charged.</p>
          )}
        </form>
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
