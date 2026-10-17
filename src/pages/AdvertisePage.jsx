// Advertise / sponsorship page. Founding-sponsor prices in USD, labeled
// placements only, and only numbers the site can prove.
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import { trackEvent } from '@/utils/analytics';
import { getFAQSchema } from '@/lib/seoConfig';
import { useStats } from '@/hooks/useStats';
import advertiseConfig from '@/data/advertiseConfig.json';
import { useFormSpamGuard } from '@/hooks/useFormSpamGuard';
import { WORDPRESS_API_URL } from '@/apiConfig';
import { getCheckoutOptions } from '@/services/checkoutService';

const OPPORTUNITIES = advertiseConfig.opportunities;
const TECH_STACK = advertiseConfig.techStack || [];
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const SPONSOR_CONTACT_EMAIL = 'sainath@dataengineerhub.blog';

const NEWSLETTER = {
  packageKey: 'newsletter_sponsorship',
  title: 'Newsletter mention (waitlist)',
  price: '$19 per issue',
  desc:
    'One short, labeled mention in the email readers get when a new article is published. The list is still small, so this is a waitlist: nothing is charged until your issue is scheduled, and you will see the subscriber count first.',
  cta: 'Join the waitlist',
};

const STEPS = [
  ['Tell me about the product', 'Use the form below or email. A link and one line on who it helps is enough to start.'],
  ['I check the fit', 'Data-engineering tools, courses and services only. You get a yes or a short no within two working days.'],
  ['Pay in USD', 'By card through the secure checkout (Dodo Payments, receipt included) or a PayPal invoice. If it is not a fit, or you cancel before go-live, you get a full refund.'],
  ['Live within 48 hours', 'You get the live URL, UTM-tagged links and a private dashboard link with server-counted impressions and clicks.'],
];

const RULES = [
  'Every paid placement is labeled "Sponsored" and links use rel="sponsored nofollow".',
  'No dofollow links, link insertions or "guest post + DA" packages.',
  'No gambling, crypto trading, loans, adult content or products I would not use myself.',
  'One sponsor per page. Sponsors never get a say in what articles say.',
];

const FAQS = [
  {
    question: 'Why are prices this low?',
    answer:
      'DataEngineer Hub is a small, specialist site run by one working data engineer. These are founding-sponsor rates that match the current audience. Ask and I will send a current analytics screenshot before you pay.',
  },
  {
    question: 'Who reads the site?',
    answer:
      'Data and analytics engineers working on warehouses, orchestration, dbt and AI on data, plus people preparing for interviews and certifications in that field. I will not invent an audience pie chart.',
  },
  {
    question: 'How do I pay?',
    answer:
      'By card through the checkout on this site, handled by Dodo Payments as merchant of record (they send the tax receipt). You can pay once we agree on the fit, or straight away for an announcement. A PayPal invoice is also fine. Anything I decline is refunded in full.',
  },
  {
    question: 'How do you report results?',
    answer:
      'A private dashboard link shows viewable impressions (the card at least half on screen for a second) and clicks, counted on our server. Links carry UTM tags so you can see the same traffic in your own analytics.',
  },
  {
    question: 'Can I cancel?',
    answer:
      'Yes. Cancel before go-live for a full refund. Monthly cards do not auto-renew; I email before the end date.',
  },
  {
    question: 'Do you publish press releases?',
    answer:
      'Yes, as sponsored announcements ($49 per release) in a separate, labeled Announcements section. They are kept out of search results and article feeds, and every link is rel="sponsored nofollow".',
  },
  {
    question: 'I want to write a guest article. Is that advertising?',
    answer: 'No. Guest tutorials are free and editorial; pitch them on the Write for us page instead of this form.',
  },
];

function formatUsd(value) {
  return `$${Number(value).toLocaleString('en-US')}`;
}

function priceUnit(d) {
  if (d.key === 'monthly') return '/ month';
  if (d.key === 'yearly') return d.label === '12 months' ? 'for 12 months' : '/ year';
  return d.label === 'Per release' ? 'per release' : 'one-time';
}

function priceLine(opp) {
  return opp.durations.map((d) => `${formatUsd(d.price)} ${priceUnit(d)}`).join(' or ');
}

const PACKAGE_OPTIONS = [
  ...OPPORTUNITIES.map((o) => ({ value: o.packageKey, label: `${o.title} (${priceLine(o)})` })),
  { value: NEWSLETTER.packageKey, label: `${NEWSLETTER.title} (${NEWSLETTER.price})` },
  { value: 'other', label: 'Something else' },
];

const linkClass = 'text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500';
const inputClass = 'mt-1 w-full rounded border border-paper-500 bg-paper-50 px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink';

const Section = ({ id, title, children }) => (
  <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t-2 border-ink pt-4">
    <h2 id={`${id}-title`} className="mb-6 font-serif text-2xl font-semibold text-ink">{title}</h2>
    {children}
  </section>
);

const AdvertisePage = () => {
  const { totalArticles } = useStats();
  const articleCount = totalArticles || advertiseConfig.inventory.guides;
  const [subscribers, setSubscribers] = useState(null);
  const [cardPlans, setCardPlans] = useState([]);

  const [formData, setFormData] = useState({ name: '', email: '', company: '', website: '', package: 'resource_reference', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const { checkSpam, recordSuccess, honeypotProps } = useFormSpamGuard('advertise');

  // Real, live subscriber count (confirmed only). Hidden if unavailable.
  useEffect(() => {
    let cancelled = false;
    fetch(`${WORDPRESS_API_URL}/wp-json/dehub/v1/newsletter/stats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data && Number.isFinite(data.subscribers)) setSubscribers(data.subscribers); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Card checkout buttons appear only for packages with a Dodo product set up.
  useEffect(() => {
    let cancelled = false;
    getCheckoutOptions().then((data) => { if (!cancelled) setCardPlans(data.enabled ? data.plans : []); });
    return () => { cancelled = true; };
  }, []);

  const choosePackage = (packageKey) => {
    setFormData((prev) => ({ ...prev, package: packageKey }));
    trackEvent({ action: 'sponsorship_package_selected', category: 'monetization', label: packageKey });
    document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) return;
    // Honeypot, too-fast and duplicate submissions are dropped quietly.
    if (checkSpam({ ...formData, email: formData.email.trim().toLowerCase() }).blocked) return;
    setLoading(true);
    setError(null);

    const chosen = PACKAGE_OPTIONS.find((o) => o.value === formData.package)?.label || formData.package;
    const lines = [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Company: ${formData.company || 'Not provided'}`,
      `Website: ${formData.website || 'Not provided'}`,
      `Option: ${chosen}`,
      '',
      'Message:',
      formData.message || 'No additional details provided.',
    ].join('\n');
    const subject = `Sponsorship inquiry from ${formData.company || formData.name}`;

    if (!WEB3FORMS_KEY) {
      window.location.href = `mailto:${SPONSOR_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: formData.name,
          email: formData.email,
          subject,
          from_name: 'DataEngineer Hub Advertise Form',
          message: lines,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Submission failed');
      trackEvent({ action: 'sponsorship_inquiry_submitted', category: 'monetization', label: formData.package });
      recordSuccess({ ...formData, email: formData.email.trim().toLowerCase() });
      setSubmitted(true);
    } catch {
      setError(`The form did not send. Email ${SPONSOR_CONTACT_EMAIL} instead and I will reply the same way.`);
    } finally {
      setLoading(false);
    }
  };

  const facts = [
    [`${articleCount}+`, 'published tutorials'],
    [String(advertiseConfig.inventory.cheatsheets), 'cheat sheets'],
    ...(subscribers !== null ? [[String(subscribers), 'newsletter subscribers']] : []),
    ['1', 'author, who reads every sponsor request'],
  ];

  return (
    <>
      <MetaTags
        title="Advertise on DataEngineer Hub"
        description="Founding-sponsor rates for labeled placements on DataEngineer Hub: sponsored cards, Tools Hub listings and co-authored integration guides for data-engineering products."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(getFAQSchema(FAQS))}</script>
      </Helmet>

      <div className="px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-14">
          <header>
            <p className="kicker mb-3">Advertise</p>
            <h1 className="font-serif text-[36px] font-semibold leading-tight text-ink sm:text-[46px]">
              Sponsor DataEngineer Hub
            </h1>
            <div className="mt-5 space-y-4 font-serif text-[19px] leading-relaxed text-ink-body">
              <p>
                This is a small, specialist site written by one working data engineer. Readers come here to fix a
                Snowflake bill, debug a dbt build or prepare for an interview, which makes them a good audience for
                tools and courses that genuinely help with that work.
              </p>
              <p>
                The prices below are founding-sponsor rates that match the current audience. I would rather start
                small and honest than quote numbers the site cannot back up.
              </p>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-y-4 border-y border-paper-500 py-5 sm:grid-cols-4">
              {facts.map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-serif text-3xl font-semibold text-ink">{value}</dd>
                  <dd className="text-sm text-ink-faint">{label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-ink-faint">
              Topics covered: {TECH_STACK.join(', ')}.
            </p>
          </header>

          <Section id="options" title="What you can sponsor">
            <ol className="divide-y divide-paper-500 border-b border-paper-500">
              {OPPORTUNITIES.map((opp) => (
                <li key={opp.packageKey} className="py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="font-serif text-xl font-semibold text-ink">{opp.title}</h3>
                    <p className="font-mono text-[14px] text-rust-600">{priceLine(opp)}</p>
                  </div>
                  <p className="mt-1 text-[16px] text-ink-muted">{opp.tagline}</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-body marker:text-paper-600">
                    {opp.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                  {opp.durations.length > 1 && (
                    <p className="mt-3 text-sm text-ink-faint">{opp.durations.map((d) => `${d.label}: ${d.desc}`).join(' ')}</p>
                  )}
                  {opp.durations.length === 1 && <p className="mt-3 text-sm text-ink-faint">{opp.durations[0].desc}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <button
                      type="button"
                      onClick={() => choosePackage(opp.packageKey)}
                      className="text-[15px] font-medium text-rust-600 underline decoration-rust-200 underline-offset-4 hover:decoration-rust-500"
                    >
                      {opp.cta} →
                    </button>
                    {cardPlans.some((plan) => plan.startsWith(`${opp.packageKey}:`)) && (
                      <Link
                        to={`/advertise/checkout?package=${opp.packageKey}`}
                        className="text-[15px] text-ink-muted underline decoration-paper-600 underline-offset-4 hover:text-ink"
                      >
                        {opp.packageKey === 'announcement' ? 'Pay now by card' : 'Already agreed? Pay by card'}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
              <li className="py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="font-serif text-xl font-semibold text-ink">{NEWSLETTER.title}</h3>
                  <p className="font-mono text-[14px] text-rust-600">{NEWSLETTER.price}</p>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-body">{NEWSLETTER.desc}</p>
                <button
                  type="button"
                  onClick={() => choosePackage(NEWSLETTER.packageKey)}
                  className="mt-4 text-[15px] font-medium text-rust-600 underline decoration-rust-200 underline-offset-4 hover:decoration-rust-500"
                >
                  {NEWSLETTER.cta} →
                </button>
              </li>
            </ol>
          </Section>

          <Section id="process" title="How it works">
            <ol className="space-y-5">
              {STEPS.map(([title, desc], i) => (
                <li key={title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-[14px] text-rust-600">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-serif text-lg font-semibold text-ink">{title}</p>
                    <p className="text-[15px] leading-relaxed text-ink-body">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="rules" title="House rules">
            <ul className="list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-ink-body marker:text-paper-600">
              {RULES.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </Section>

          <Section id="inquiry" title="Send an inquiry">
            {submitted ? (
              <div className="border-l-2 border-green-600 bg-green-50 px-4 py-4 text-[16px] text-green-900" role="status">
                Thanks, it's in my inbox. I reply to every inquiry within two working days from {SPONSOR_CONTACT_EMAIL}.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input {...honeypotProps} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-ink-muted">
                    Your name
                    <input required name="name" value={formData.name} onChange={handleChange} className={inputClass} autoComplete="name" />
                  </label>
                  <label className="block text-sm text-ink-muted">
                    Work email
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} autoComplete="email" />
                  </label>
                  <label className="block text-sm text-ink-muted">
                    Company or product
                    <input name="company" value={formData.company} onChange={handleChange} className={inputClass} autoComplete="organization" />
                  </label>
                  <label className="block text-sm text-ink-muted">
                    Website
                    <input name="website" value={formData.website} onChange={handleChange} className={inputClass} placeholder="https://" />
                  </label>
                </div>
                <label className="block text-sm text-ink-muted">
                  What you're interested in
                  <select name="package" value={formData.package} onChange={handleChange} className={inputClass}>
                    {PACKAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm text-ink-muted">
                  Who does your product help, and how?
                  <textarea name="message" rows={5} value={formData.message} onChange={handleChange} className={inputClass} />
                </label>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-11 items-center rounded bg-ink px-6 text-[15px] font-medium text-paper hover:bg-rust-600 disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Send inquiry'}
                </button>
                <p className="text-sm text-ink-faint">
                  Prefer email? Write to <a href={`mailto:${SPONSOR_CONTACT_EMAIL}`} className={linkClass}>{SPONSOR_CONTACT_EMAIL}</a>.
                </p>
              </form>
            )}
          </Section>

          <Section id="faq" title="Questions sponsors ask">
            <div className="divide-y divide-paper-500 border-b border-paper-500">
              {FAQS.map(({ question, answer }) => (
                <details key={question} className="group py-4">
                  <summary className="cursor-pointer list-none font-serif text-lg font-semibold text-ink marker:hidden">
                    <span className="mr-2 font-mono text-rust-600 group-open:hidden">+</span>
                    <span className="mr-2 hidden font-mono text-rust-600 group-open:inline">−</span>
                    {question}
                  </summary>
                  <p className="mt-2 pl-6 text-[15px] leading-relaxed text-ink-body">{answer}</p>
                </details>
              ))}
            </div>
          </Section>

          <p className="text-[15px] text-ink-muted">
            Writing a tutorial rather than buying a placement? Guest articles are free and editorial: see{' '}
            <Link to="/contribute" className={linkClass}>Write for us</Link>.
          </p>
        </div>
      </div>
    </>
  );
};

export default AdvertisePage;
