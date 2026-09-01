// Advertise / sponsorship page — priced in USD, labeled placements only.
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Mail,
  PenLine,
  Scale,
  Send,
  Shield,
  X,
} from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { getFAQSchema } from '@/lib/seoConfig';
import { useStats } from '@/hooks/useStats';
import { cheatsheets } from '@/data/cheatsheetData';
import advertiseConfig from '@/data/advertiseConfig.json';

const OPPORTUNITIES = advertiseConfig.opportunities;
const TECH_STACK = advertiseConfig.techStack || [];
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const SPONSOR_CONTACT_EMAIL = 'sainath@dataengineerhub.blog';

const NEWSLETTER = {
  key: 'newsletter_sponsorship',
  title: 'Newsletter sponsorship',
  tagline: 'A labeled blurb in the weekly digest once the list is live',
  price: 79,
  priceLabel: '/ issue',
  bullets: [
    '~150 words + one CTA at the top of an issue',
    'Plain-text friendly — readable in engineering inboxes',
    'Screenshot after send as proof',
    'If the list is not live yet, we hold the slot or refund',
  ],
  cta: 'Reserve a newsletter slot',
};

const PROCESS_STEPS = [
  {
    title: 'Tell us the product',
    desc: 'Package, URL, and what a practitioner should try. Form or email.',
  },
  {
    title: 'Editorial review',
    desc: 'DE-relevant tools and courses only. A no is a short email, not silence.',
  },
  {
    title: 'Pay and schedule',
    desc: 'Invoice in USD. Dates within 48 hours of payment.',
  },
  {
    title: 'You own the clicks',
    desc: 'UTM-tagged links in your analytics. Live URL by email.',
  },
];

const SPONSOR_GETS = [
  'Manual review before anything goes live',
  'Labeled placement next to a matching stack',
  'UTM links you can see in your own analytics',
  'One free copy or URL fix after publish',
  'Email to Sainath — not a ticket queue',
  'Full refund if you cancel before go-live',
];

const FAQS = [
  {
    category: 'Billing',
    question: 'What currency are prices in?',
    answer:
      'US dollars. Invoices are always USD. Any local-currency line is an estimate only.',
  },
  {
    category: 'Billing',
    question: 'How do I pay?',
    answer:
      'We confirm fit by email, then send an invoice (card or bank transfer). There is no self-serve checkout yet.',
  },
  {
    category: 'Billing',
    question: 'Is there a lock-in?',
    answer:
      'No monthly contract. One-time packages stay up; newsletter is one send. Cancel before go-live for a full refund.',
  },
  {
    category: 'Fit',
    question: 'I want to write a guest article. Is that advertising?',
    answer:
      'No. Guest tutorials are free and editorial. Pitch on Write for Us. Do not use this form for guest posts.',
  },
  {
    category: 'Fit',
    question: 'Do you sell dofollow backlinks or “guest post + DA” packages?',
    answer:
      'No. Sponsor links are rel="sponsored nofollow". If that is the only thing you want, this is the wrong site.',
  },
  {
    category: 'Audience',
    question: 'Who reads DataEngineer Hub?',
    answer:
      'Working data and analytics engineers evaluating warehouses, orchestration, dbt, and the AI-on-data stack — plus people hiring or certifying in that world. We will not invent an audience pie chart.',
  },
  {
    category: 'Delivery',
    question: 'Where does a placement appear?',
    answer:
      'Sponsored card: matching guides, cheat sheets, and tools — not glossary or compare archives. Tools Hub: a directory card. Co-authored guide: a permanent labeled article. Newsletter: one labeled blurb per issue.',
  },
  {
    category: 'Delivery',
    question: 'How do you report results?',
    answer:
      'Live URL + UTM parameters you own. Newsletter: a send screenshot. Private impression dashboard when the campaign token is issued. We do not seed fake totals.',
  },
];

const PACKAGE_BUDGET_OPTIONS = {
  resource_reference: [
    { value: '$79 USD / month', label: '$79 USD / month — sponsored card' },
    { value: '$699 USD / year', label: '$699 USD / year — sponsored card' },
  ],
  directory: [{ value: '$149 USD one-time', label: '$149 USD one-time — Tools Hub listing' }],
  content: [{ value: '$249 USD one-time', label: '$249 USD one-time — co-authored guide' }],
  newsletter_sponsorship: [{ value: '$79 USD / issue', label: '$79 USD per newsletter issue' }],
  other: [{ value: "Let's discuss", label: "Let's discuss" }],
};

function formatUsd(usdValue) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(usdValue);
  } catch {
    return `$${usdValue}`;
  }
}

function resolveIcon(iconName) {
  return LucideIcons[iconName] || HelpCircle;
}

function startingPrice(opp) {
  const prices = (opp.durations || []).map((d) => d.price);
  return prices.length ? Math.min(...prices) : null;
}

const AdvertisePage = () => {
  const { totalArticles } = useStats();
  const articleCount = totalArticles || 100;
  const cheatsheetCount = Array.isArray(cheatsheets) ? cheatsheets.length : 0;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    package: 'resource_reference',
    budget: '$79 USD / month',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDurations, setSelectedDurations] = useState({
    resource_reference: 'monthly',
    directory: 'one_time',
    content: 'one_time',
  });
  const [openFaq, setOpenFaq] = useState(null);
  const [faqCategory, setFaqCategory] = useState('All');

  const faqCategories = useMemo(
    () => ['All', ...Array.from(new Set(FAQS.map((f) => f.category)))],
    []
  );
  const filteredFaqs = useMemo(
    () => FAQS.filter((f) => faqCategory === 'All' || f.category === faqCategory),
    [faqCategory]
  );

  const mediaKit = [
    { surface: 'Guides & tutorials', count: `${articleCount}+`, why: 'People mid-warehouse or orchestration decision' },
    { surface: 'Cheat sheets', count: String(cheatsheetCount || '60+'), why: 'Bookmarked, interview-week traffic' },
    { surface: 'Tools & calculators', count: 'Live', why: 'Cost and SQL utilities practitioners already open' },
    { surface: 'Stacks covered', count: String(TECH_STACK.length), why: TECH_STACK.slice(0, 4).join(', ') + '…' },
    { surface: 'Machine-readable catalogs', count: 'RSS + llms.txt', why: 'Agents can cite the same tutorials' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'package') {
      const opts = PACKAGE_BUDGET_OPTIONS[value] ?? [];
      setFormData((prev) => ({
        ...prev,
        package: value,
        budget: opts.length > 0 ? opts[0].value : prev.budget,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) return;
    setLoading(true);
    setError(null);

    const payload = {
      name: formData.name,
      email: formData.email,
      company: formData.company,
      website: formData.website,
      sponsorPackage: formData.package,
      budget: formData.budget,
      message: formData.message,
    };

    if (!WEB3FORMS_KEY) {
      const subject = encodeURIComponent(`Sponsorship inquiry from ${formData.company || formData.name}`);
      const body = encodeURIComponent(
        [
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          `Company: ${payload.company || 'Not provided'}`,
          `Website: ${payload.website || 'Not provided'}`,
          `Preferred Package: ${payload.sponsorPackage}`,
          `Budget: ${payload.budget}`,
          '',
          'Message:',
          payload.message || 'No additional details provided.',
        ].join('\n')
      );
      window.location.href = `mailto:${SPONSOR_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setError('Opening your email client to send the inquiry…');
      setLoading(false);
      return;
    }

    try {
      const formattedMessage = [
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        `Company: ${formData.company || 'Not provided'}`,
        `Website: ${formData.website || 'Not provided'}`,
        `Package: ${formData.package}`,
        `Budget: ${formData.budget}`,
        '',
        '--- Message ---',
        formData.message || 'No additional details provided.',
      ].join('\n');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: formData.name,
          email: formData.email,
          subject: `Sponsorship inquiry from ${formData.company || formData.name}`,
          from_name: 'DataEngineer Hub Advertise Form',
          message: formattedMessage,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Submission failed');

      trackEvent({
        action: 'sponsorship_inquiry_submitted',
        category: 'monetization',
        label: formData.package,
      });
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        website: '',
        package: 'resource_reference',
        budget: '$79 USD / month',
        message: '',
      });
    } catch {
      setError('We could not submit your inquiry. Email sainath@dataengineerhub.blog instead.');
    } finally {
      setLoading(false);
    }
  };

  const selectPackage = (packageKey, budgetValue) => {
    const opts = PACKAGE_BUDGET_OPTIONS[packageKey] ?? [];
    setFormData((prev) => ({
      ...prev,
      package: packageKey,
      budget: budgetValue || (opts[0] && opts[0].value) || prev.budget,
    }));
    document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="advertise-page min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>Advertise — DataEngineer Hub (USD placements)</title>
        <meta
          name="description"
          content="Paid placements for data tools billed in USD. Sponsored cards, Tools Hub listings, co-authored guides, and newsletter blurbs. Guest articles are free on Write for Us."
        />
        <link rel="canonical" href="https://dataengineerhub.blog/advertise" />
        <script type="application/ld+json">{JSON.stringify(getFAQSchema(FAQS))}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/90 mb-4">
            Paid placements · billed in USD
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl leading-[1.15]">
            Reach engineers who are already costing a warehouse
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Put a tool, course, or platform in front of people reading about Snowflake, dbt,
            Airflow, and the modern data stack — not a generic banner audience. Guest tutorials
            are free and editorial on{' '}
            <Link to="/contribute" className="text-blue-300 hover:text-blue-200 underline underline-offset-2">
              Write for us
            </Link>
            . This page is for paid placements only.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              View packages <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Book a placement
            </a>
            <Link
              to="/contribute"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              <PenLine className="h-4 w-4" /> Write a guest article (free)
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Published guides', value: `${articleCount}+`, hint: 'Original tutorials and deep-dives' },
              { label: 'Cheat sheets', value: String(cheatsheetCount || '60+'), hint: 'Quick-reference traffic' },
              { label: 'Audience', value: 'Practitioners', hint: 'Engineers choosing tools this week' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <dt className="text-xs uppercase tracking-wider text-slate-400">{item.label}</dt>
                <dd className="mt-1 text-2xl font-semibold text-white">{item.value}</dd>
                <p className="mt-1 text-sm text-slate-400">{item.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Why */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">Why this audience books tools</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'They are costing a warehouse this week',
              body: 'Readers land on Query Profile, Slim CI, and cost guides — not “what is data.” A placement sits next to a decision.',
            },
            {
              title: 'The catalog is machine-readable',
              body: 'Agents are pointed at these tutorials via llms.txt and RSS. Sponsored posts sit in the same catalog, labeled.',
            },
            {
              title: 'The bar stays up',
              body: 'We decline dofollow packages and generic SEO. You are buying a labeled placement next to practitioner content.',
            },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Media kit */}
      <section className="border-y border-white/5 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Media kit — what you sit next to</h2>
          <p className="mt-2 text-sm text-slate-400">
            Live inventory. We will not invent monthly uniques we cannot show you.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Surface</th>
                  <th className="px-4 py-3 font-medium">Count</th>
                  <th className="px-4 py-3 font-medium">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {mediaKit.map((row) => (
                  <tr key={row.surface} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white font-medium">{row.surface}</td>
                    <td className="px-4 py-3 text-blue-300">{row.count}</td>
                    <td className="px-4 py-3 text-slate-300">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {TECH_STACK.map((stack) => (
              <span
                key={stack}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300"
              >
                {stack}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* For / not for */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
          <h2 className="text-xl font-semibold text-white">This page is for</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {[
              'A data tool, warehouse, or training product practitioners can try',
              'A launch or trial you can describe in one sentence',
              'Paying in USD for a labeled placement',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] p-6">
          <h2 className="text-xl font-semibold text-white">Send these somewhere else</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li className="flex gap-2">
              <X className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
              <span>
                Guest articles —{' '}
                <Link to="/contribute" className="text-blue-300 hover:underline">
                  Write for us
                </Link>{' '}
                (free)
              </span>
            </li>
            <li className="flex gap-2">
              <X className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
              <span>Paid dofollow backlinks / “guest post + DA”</span>
            </li>
            <li className="flex gap-2">
              <X className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
              <span>Generic SEO, gambling, or products that do not serve data engineers</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/5 bg-slate-900/20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-5 sm:px-8 py-14 scroll-mt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">Paid packages</h2>
        <p className="mt-2 text-sm text-slate-400">
          Starting prices in USD. Indie tools are welcome — the newsletter slot is the smallest paid test.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {OPPORTUNITIES.map((opp) => {
            const Icon = resolveIcon(opp.icon);
            const durationKey = selectedDurations[opp.packageKey] || opp.durations[0]?.key;
            const duration = opp.durations.find((d) => d.key === durationKey) || opp.durations[0];
            const from = startingPrice(opp);
            return (
              <article
                key={opp.packageKey}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  opp.popular
                    ? 'border-blue-400/40 bg-gradient-to-b from-blue-500/10 to-slate-950'
                    : 'border-white/10 bg-slate-900/40'
                }`}
              >
                {opp.popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-blue-500 px-3 py-0.5 text-[11px] font-semibold text-white">
                    Most booked
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white/5 p-2 border border-white/10">
                    <Icon className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{opp.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{opp.tagline}</p>
                  </div>
                </div>

                {opp.durations.length > 1 && (
                  <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                    {opp.durations.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() =>
                          setSelectedDurations((prev) => ({ ...prev, [opp.packageKey]: d.key }))
                        }
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          duration.key === d.key
                            ? 'bg-white text-slate-900'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    {opp.durations.length > 1 ? 'Selected' : 'From'}
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-white">
                    {formatUsd(duration.price)}
                    <span className="ml-2 text-sm font-medium text-slate-400">
                      {duration.key === 'monthly'
                        ? '/ mo'
                        : duration.key === 'yearly'
                          ? '/ yr'
                          : 'one-time'}
                    </span>
                  </p>
                  {opp.durations.length > 1 && from != null && from !== duration.price && (
                    <p className="text-xs text-slate-500 mt-1">starts from {formatUsd(from)}</p>
                  )}
                  <p className="mt-2 text-sm text-slate-400">{duration.desc}</p>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-slate-300 flex-1">
                  {opp.bullets.slice(0, 4).map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-blue-300 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() =>
                    selectPackage(
                      opp.packageKey,
                      PACKAGE_BUDGET_OPTIONS[opp.packageKey]?.find((o) =>
                        o.value.toLowerCase().includes(duration.key === 'yearly' ? 'year' : duration.key === 'monthly' ? 'month' : 'one-time')
                      )?.value
                    )
                  }
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    opp.popular
                      ? 'bg-blue-500 hover:bg-blue-400 text-white'
                      : 'border border-white/15 hover:border-white/30 bg-white/5 text-white'
                  }`}
                >
                  {opp.cta}
                </button>
              </article>
            );
          })}
        </div>

        {/* Newsletter */}
        <article className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Lower-cost channel
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">{NEWSLETTER.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{NEWSLETTER.tagline}</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-slate-300">
                {NEWSLETTER.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-amber-300 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-3xl font-semibold text-white">
                {formatUsd(NEWSLETTER.price)}
                <span className="text-sm font-medium text-slate-400">{NEWSLETTER.priceLabel}</span>
              </p>
              <button
                type="button"
                onClick={() => selectPackage('newsletter_sponsorship')}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 text-sm font-semibold"
              >
                {NEWSLETTER.cta}
              </button>
            </div>
          </div>
        </article>

        {/* Compare */}
        <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.04] text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium"> </th>
                <th className="px-4 py-3 font-medium">Card</th>
                <th className="px-4 py-3 font-medium">Tools Hub</th>
                <th className="px-4 py-3 font-medium">Guide</th>
                <th className="px-4 py-3 font-medium">Newsletter</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                ['Starting price', 'from $79/mo', '$149', '$249', '$79/issue'],
                ['How long it lasts', 'Term you book', 'Permanent card', 'Permanent article', 'One email issue'],
                ['You approve copy first', 'Yes', 'Yes', 'Yes', 'Yes'],
                ['Disclosure', 'Sponsored', 'Sponsored', 'Sponsored', 'Labeled blurb'],
                ['Link default', 'nofollow', 'nofollow', 'nofollow', 'nofollow'],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-white/5">
                  {row.map((cell, i) => (
                    <td
                      key={`${row[0]}-${i}`}
                      className={`px-4 py-3 ${i === 0 ? 'text-white font-medium' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Book on the form and we send an invoice. After payment we contact you within 48 hours.
        </p>
      </section>

      {/* What sponsors get */}
      <section className="border-y border-white/5 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
          <h2 className="text-2xl font-semibold text-white">What every sponsor gets</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {SPONSOR_GETS.map((item) => (
              <li
                key={item}
                className="flex gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-300 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">FAQ</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {faqCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFaqCategory(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                faqCategory === cat
                  ? 'bg-white text-slate-900 border-white'
                  : 'border-white/10 text-slate-300 hover:border-white/25'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {filteredFaqs.map((faq) => {
            const open = openFaq === faq.question;
            return (
              <div key={faq.question} className="rounded-xl border border-white/10 bg-slate-900/40">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : faq.question)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <p className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Policies */}
      <section id="sponsor-policies" className="border-y border-white/5 bg-slate-900/20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-300" /> Policies in plain language
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Refunds',
                body: 'Cancel before go-live for a full refund. After go-live, unused newsletter issues can be pro-rated. Published articles stay up except for legal or factual errors.',
              },
              {
                title: 'Editorial bar',
                body: 'Sponsorships do not rewrite organic tutorials. Accepted: data tools, warehouses, courses, infrastructure. Rejected: gambling, adult, generic SEO, get-rich-quick.',
              },
              {
                title: 'Timing',
                body: 'After payment and assets, we aim to schedule within 48 hours. Mentions and articles are calendar bookings, not impression buys.',
              },
              {
                title: 'Disclosure',
                body: 'Every paid placement is labeled. Links default to rel="sponsored nofollow". We will not hide an FTC disclosure.',
              },
            ].map((card) => (
              <article key={card.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{card.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs text-slate-500 flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Bookings are informal until we confirm dates by email. Run by Sainath Reddy. See also the{' '}
            <Link to="/disclaimer" className="text-blue-300 hover:underline">
              disclaimer
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-blue-300 hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Form */}
      <section id="inquiry-form" className="max-w-5xl mx-auto px-5 sm:px-8 py-14 scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">Book a paid placement</h2>
            <p className="mt-2 text-sm text-slate-400">
              We reply within 48 hours with fit, dates, and how to pay. Guest-article pitches belong on{' '}
              <Link to="/contribute" className="text-blue-300 hover:underline">
                Write for us
              </Link>
              .
            </p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-blue-300" />
                <dt className="text-slate-500 w-28">Reply window</dt>
                <dd>Within 48 hours</dd>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="h-4 w-4 text-blue-300" />
                <dt className="text-slate-500 w-28">Reporting</dt>
                <dd>Live URL + your UTMs</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-6">
            {submitted ? (
              <div className="text-center py-10">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <p className="mt-3 text-lg font-semibold text-white">Inquiry sent</p>
                <p className="mt-1 text-sm text-slate-400">We will reply within 48 hours.</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-5 text-sm text-blue-300 hover:underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs text-slate-400">
                  Your name
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Work email
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Company
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Product URL
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Package
                  <select
                    name="package"
                    value={formData.package}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  >
                    <option value="resource_reference">Sponsored card — from $79/mo</option>
                    <option value="directory">Tools Hub listing — $149</option>
                    <option value="content">Co-authored guide — $249</option>
                    <option value="newsletter_sponsorship">Newsletter — $79/issue</option>
                    <option value="other">Not sure yet</option>
                  </select>
                </label>
                <label className="block text-xs text-slate-400">
                  Budget / term
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                  >
                    {(PACKAGE_BUDGET_OPTIONS[formData.package] || PACKAGE_BUDGET_OPTIONS.other).map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="block text-xs text-slate-400">
                  What should practitioners try?
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 resize-y"
                  />
                </label>
                {error && <p className="text-sm text-amber-300">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white px-4 py-3 text-sm font-semibold"
                >
                  {loading ? 'Sending…' : 'Submit paid inquiry'}
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdvertisePage;
