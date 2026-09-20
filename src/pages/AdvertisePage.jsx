// Advertise / sponsorship page — refined paid placements & instant DodoPayments checkout.
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coffee,
  Code,
  HelpCircle,
  Layers,
  Mail,
  PenLine,
  Scale,
  Send,
  Shield,
  X,
  CreditCard,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { getFAQSchema } from '@/lib/seoConfig';
import { useStats } from '@/hooks/useStats';
import advertiseConfig from '@/data/advertiseConfig.json';
import SupportPanel from '@/components/Support/SupportPanel';

const PACKAGE_ICONS = { BookOpen, Layers, Code };

const OPPORTUNITIES = advertiseConfig.opportunities;
const TECH_STACK = advertiseConfig.techStack || [];
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const SPONSOR_CONTACT_EMAIL = 'sainath@dataengineerhub.blog';

const PROCESS_STEPS = [
  {
    title: 'Tell us the product',
    desc: 'Package, URL, and what a practitioner should try. Submit via the inquiry form or instant checkout.',
  },
  {
    title: 'Editorial review',
    desc: 'DE-relevant tools and courses only. A no is a short email, not silence.',
  },
  {
    title: 'Pay and schedule',
    desc: 'Pay via DodoPayments or invoice. Dates confirmed within 48 hours.',
  },
  {
    title: 'You own the clicks',
    desc: 'UTM-tagged links in your analytics. Live URL provided upon publishing.',
  },
];

const SPONSOR_GETS = [
  'Manual review before anything goes live',
  'Labeled placement next to a matching stack',
  'UTM links you can see in your own analytics',
  'One free copy or URL fix after publish',
  'Direct email response from Sainath — no ticket queue',
  'Full refund if you cancel before go-live',
];

const FAQS = [
  {
    category: 'Billing',
    question: 'What currency are prices in?',
    answer:
      'US dollars. Payments and invoices are always in USD.',
  },
  {
    category: 'Billing',
    question: 'How do I pay?',
    answer:
      'You can pay instantly via DodoPayments checkout (cards, bank transfer, PayPal, UPI) or request an invoice by email.',
  },
  {
    category: 'Billing',
    question: 'Is there a lock-in?',
    answer:
      'No monthly contract. Placements stay active for the agreed package duration. Cancel before go-live for a full refund.',
  },
  {
    category: 'Fit',
    question: 'I want to write a guest article. Is that advertising?',
    answer:
      'No. Guest tutorials are free and editorial for individual engineers. Pitch on Write for Us. Do not use this form for guest posts.',
  },
  {
    category: 'Fit',
    question: 'Do you sell dofollow backlinks or "guest post + DA" packages?',
    answer:
      'No. Sponsor links are rel="sponsored nofollow". If that is the only thing you want, this is the wrong site.',
  },
  {
    category: 'Audience',
    question: 'Who reads DataEngineer Hub?',
    answer:
      'Working data and analytics engineers evaluating warehouses, orchestration, dbt, and the AI-on-data stack — plus engineers certifying or building production pipelines.',
  },
  {
    category: 'Delivery',
    question: 'Where does a placement appear?',
    answer:
      'Sponsored card: matching guides, cheat sheets, and tools — not glossary or compare archives. Tools Hub: a directory card. Co-authored guide: a permanent labeled article.',
  },
  {
    category: 'Delivery',
    question: 'How do you report results?',
    answer:
      'Live URL + UTM parameters you own. Private impression dashboard when the campaign token is issued. We do not seed fake totals.',
  },
];

function resolveIcon(iconName) {
  return PACKAGE_ICONS[iconName] || HelpCircle;
}

const AdvertisePage = () => {
  const { totalArticles } = useStats();
  const articleCount = totalArticles || advertiseConfig.inventory?.guides || 100;
  const cheatsheetCount = advertiseConfig.inventory?.cheatsheets || 30;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    package: 'resource_reference',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqCategory, setFaqCategory] = useState('All');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPackageKey, setCheckoutPackageKey] = useState('resource_reference');

  const handleOpenCheckout = (packageKey = 'resource_reference') => {
    setCheckoutPackageKey(packageKey);
    setIsCheckoutOpen(true);
  };

  const faqCategories = useMemo(
    () => ['All', ...Array.from(new Set(FAQS.map((f) => f.category)))],
    []
  );
  const filteredFaqs = useMemo(
    () => FAQS.filter((f) => faqCategory === 'All' || f.category === faqCategory),
    [faqCategory]
  );

  const mediaKit = [
    { surface: 'Guides & tutorials', count: `${articleCount}+`, why: 'Engineers mid-warehouse or orchestration decision' },
    { surface: 'Cheat sheets', count: String(cheatsheetCount || '60+'), why: 'Bookmarked, high-intent reference traffic' },
    { surface: 'Tools & calculators', count: 'Live', why: 'Cost and SQL utilities practitioners actively use' },
    { surface: 'Stacks covered', count: String(TECH_STACK.length), why: TECH_STACK.slice(0, 4).join(', ') + '…' },
    { surface: 'Machine-readable catalogs', count: 'RSS + llms.txt', why: 'Agents can cite the same tutorials' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      message: formData.message,
    };

    if (!WEB3FORMS_KEY) {
      const subject = encodeURIComponent(`Paid Placement Inquiry from ${formData.company || formData.name}`);
      const body = encodeURIComponent(
        [
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          `Company: ${payload.company || 'Not provided'}`,
          `Website: ${payload.website || 'Not provided'}`,
          `Placement of Interest: ${payload.sponsorPackage}`,
          '',
          'What practitioners should try:',
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
        `Placement of Interest: ${formData.package}`,
        '',
        '--- What practitioners should try ---',
        formData.message || 'No additional details provided.',
      ].join('\n');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: formData.name,
          email: formData.email,
          subject: `Paid Placement Inquiry from ${formData.company || formData.name}`,
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
        message: '',
      });
    } catch {
      setError('We could not submit your inquiry. Email sainath@dataengineerhub.blog directly.');
    } finally {
      setLoading(false);
    }
  };

  const selectPackage = (packageKey) => {
    setFormData((prev) => ({
      ...prev,
      package: packageKey,
    }));
    document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="advertise-page min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-slate-100">
      <Helmet>
        <title>Advertise — DataEngineer Hub (Paid Placements)</title>
        <meta
          name="description"
          content="Paid placements for data tools. Sponsored cards, Tools Hub listings, and co-authored guides. Guest articles are free on Write for us."
        />
        <link rel="canonical" href="https://dataengineerhub.blog/advertise" />
        <script type="application/ld+json">
          {JSON.stringify(getFAQSchema(FAQS))}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/90 mb-3">
            Paid placements
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl leading-[1.15]">
            Reach engineers who are already costing a warehouse
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Put a tool, course, or platform in front of practitioners reading about Snowflake, dbt,
            Airflow, and the modern data stack. Guest tutorials are free and editorial on{' '}
            <Link to="/contribute" className="text-blue-300 hover:text-blue-200 underline underline-offset-2 font-medium">
              Write for us
            </Link>
            . This page is for paid placements only.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              Get pricing <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Book a placement
            </a>
            <Link
              to="/contribute"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <PenLine className="h-4 w-4" /> Write a guest article (free)
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Published guides', value: `${articleCount}+`, hint: 'Original tutorials and deep-dives' },
              { label: 'Cheat sheets', value: String(cheatsheetCount || '60+'), hint: 'Quick-reference traffic' },
              { label: 'Audience', value: 'Practitioners', hint: 'Engineers choosing tools this week' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <dt className="text-xs uppercase tracking-wider text-slate-400">{item.label}</dt>
                <dd className="mt-1 text-2xl font-semibold text-white">{item.value}</dd>
                <p className="mt-1 text-sm text-slate-400">{item.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Why */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">Why this audience books tools</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'They are costing a warehouse this week',
              body: 'Readers land on Query Profile, Slim CI, and cost guides — not "what is data". A placement sits right next to an active decision.',
            },
            {
              title: 'The catalog is machine-readable',
              body: 'Agents cite these tutorials via llms.txt and RSS. Sponsored posts sit in the exact same catalog, clearly labeled.',
            },
            {
              title: 'The bar stays high',
              body: 'We decline dofollow packages and generic SEO. You are buying a labeled placement next to authentic practitioner content.',
            },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2.5 text-sm text-slate-300 leading-relaxed">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Media kit */}
      <section className="border-y border-white/5 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Media kit — what you sit next to</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Live inventory. We do not invent traffic totals or audience charts.
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
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
                    <td className="px-4 py-3 text-blue-300 font-semibold">{row.count}</td>
                    <td className="px-4 py-3 text-slate-300">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
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

      {/* Target Audience ROI Highlights */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 p-8 shadow-2xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider">01 · High-Purchase Intent</div>
              <h3 className="text-xl font-bold text-white">Active Tool Evaluators</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Our readers are mid-query or building dbt pipelines — actively comparing Snowflake vs Databricks, orchestration tools, and cost optimizers.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider">02 · Contextual Relevance</div>
              <h3 className="text-xl font-bold text-white">Zero Generic Ad Noise</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your placement sits directly alongside hands-on code examples, query profiles, and architecture deep-dives matching your exact stack.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider">03 · Verifiable Proof</div>
              <h3 className="text-xl font-bold text-white">Full Analytics Control</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Every click carries your custom UTMs directly into your analytics. Transparent proof of impression and engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Placement options */}
      <section id="packages" className="max-w-6xl mx-auto px-5 sm:px-8 py-10 scroll-mt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">Placement options</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Targeted ways to reach data engineers — each labeled, trackable, and editorially reviewed.
          Submit an inquiry form below for placement details and scheduling.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {OPPORTUNITIES.map((opp) => {
            const Icon = resolveIcon(opp.icon);
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
                  <span className="absolute -top-3 left-5 rounded-full bg-blue-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow-md">
                    Most booked
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white/5 p-2 border border-white/10">
                    <Icon className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{opp.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{opp.tagline}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-slate-300 flex-1">
                  {opp.bullets.slice(0, 4).map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-blue-300 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => selectPackage(opp.packageKey)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white px-5 py-3 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <span>Inquire for placement</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="border-y border-white/5 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <h2 className="text-2xl font-semibold text-white">Placement Feature Matrix</h2>
          <p className="mt-1.5 text-sm text-slate-400">Everything included across our paid sponsorship tiers.</p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-slate-300">
                <tr>
                  <th className="px-5 py-4 font-bold">Feature / Capability</th>
                  <th className="px-4 py-4 font-bold text-center">Sponsored Card</th>
                  <th className="px-4 py-4 font-bold text-center">Tools Hub Listing</th>
                  <th className="px-4 py-4 font-bold text-center">Co-Authored Guide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: 'Targeted Stack Placement (Snowflake/dbt/Airflow)', card: true, hub: true, guide: true },
                  { name: 'Custom UTM Link Tracking', card: true, hub: true, guide: true },
                  { name: 'Private Impression Token Dashboard', card: true, hub: true, guide: true },
                  { name: 'Machine-Readable RSS + llms.txt Indexing', card: true, hub: true, guide: true },
                  { name: 'Permanent Indexed Page on Site', card: false, hub: true, guide: true },
                  { name: 'Dedicated 1,800+ Word Deep Dive Tutorial', card: false, hub: false, guide: true },
                  { name: 'Companion Working Code GitHub Repository', card: false, hub: false, guide: true },
                  { name: 'Manual Review & Fast 48h Calendar Booking', card: true, hub: true, guide: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-white font-medium">{row.name}</td>
                    <td className="px-4 py-3.5 text-center">
                      {row.card ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.hub ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.guide ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What sponsors get */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <h2 className="text-2xl font-semibold text-white">What every sponsor gets</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
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
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">FAQ</h2>
        <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-5 space-y-2">
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
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-300" /> Policies in plain language
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Refunds',
                body: 'Cancel before go-live for a full refund. Published articles stay up permanently except for legal or factual errors.',
              },
              {
                title: 'Editorial bar',
                body: 'Sponsorships do not rewrite organic tutorials. Accepted: data tools, warehouses, courses, infrastructure. Rejected: gambling, adult, generic SEO, get-rich-quick.',
              },
              {
                title: 'Timing',
                body: 'After payment and assets, we aim to schedule within 48 hours. Placements are scheduled calendar bookings.',
              },
              {
                title: 'Disclosure',
                body: 'Every paid placement is labeled. Links default to rel="sponsored nofollow". We will not hide disclosures.',
              },
            ].map((card) => (
              <article key={card.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{card.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500 flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Bookings are informal until we confirm dates by email. See also the{' '}
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

      {/* Form Section */}
      <section id="inquiry-form" className="max-w-6xl mx-auto px-5 sm:px-8 py-10 scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">Book a paid placement</h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              We reply within 48 hours with fit, dates, and how to pay. Guest-article pitches belong on{' '}
              <Link to="/contribute" className="text-blue-300 hover:underline font-medium">
                Write for us
              </Link>
              .
            </p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Clock className="h-4 w-4 text-blue-300" />
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reply window</dt>
                  <dd className="font-semibold text-white mt-0.5">Within 48 hours</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Mail className="h-4 w-4 text-blue-300" />
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reporting</dt>
                  <dd className="font-semibold text-white mt-0.5">Live URL + your UTMs</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 sm:p-7 shadow-2xl backdrop-blur-sm">
            {submitted ? (
              <div className="text-center py-10">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <p className="mt-4 text-xl font-semibold text-white">Inquiry sent</p>
                <p className="mt-2 text-sm text-slate-300">We will reply within 48 hours with fit, dates, and pricing.</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-sm text-blue-300 hover:underline font-medium"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1">
                    Your name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="name"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
                    Work email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="email"
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-xs font-medium text-slate-300 mb-1">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-xs font-medium text-slate-300 mb-1">
                    Product URL
                  </label>
                  <input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="package" className="block text-xs font-medium text-slate-300 mb-1">
                    Placement of interest
                  </label>
                  <select
                    id="package"
                    name="package"
                    value={formData.package}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  >
                    <option value="resource_reference">Sponsored card in matching guides</option>
                    <option value="directory">Tools Hub listing</option>
                    <option value="content">Co-authored integration guide</option>
                    <option value="other">Custom / Not sure yet</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-medium text-slate-300 mb-1">
                    What should practitioners try?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors resize-y"
                  />
                </div>

                {error && <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white px-5 py-3 text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
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
