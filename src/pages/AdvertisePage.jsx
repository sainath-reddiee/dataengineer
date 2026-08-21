// src/pages/AdvertisePage.jsx
// Dedicated "Advertise / Sponsorship" page for DataEngineer Hub.
// Premium SaaS-quality design optimized for conversion and transparency.
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { 
  Mail, Check, Sparkles, Send, 
  Users, BarChart3, Calendar, ArrowRight, CheckCircle2,
  DollarSign, Globe, ChevronDown, HelpCircle, Eye, MousePointerClick,
  Percent, Zap, Target, Star, Shield,
  Briefcase, Search, X, ListChecks, Flame, Crown,
  AlertCircle, BookOpen, FileText, RefreshCw, Scale, Clock, UserCheck,
  Newspaper, Wrench, Bell, PenLine, TrendingUp as TrendUp, Link
} from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { getFAQSchema } from '@/lib/seoConfig';
import { useStats } from '@/hooks/useStats';
import { cheatsheets } from '@/data/cheatsheetData';
import advertiseConfig from '@/data/advertiseConfig.json';
import activeSponsorsData from '@/data/activeSponsors.json';

// ─── Constants ───────────────────────────────────────────────────────────────
const OPPORTUNITIES = advertiseConfig.opportunities;
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const SPONSOR_CONTACT_EMAIL = 'sainath@dataengineerhub.blog';

const FAQS = [
  {
    category: 'Billing',
    question: 'What currency are prices in? What does a US visitor see?',
    answer: 'Every package is priced and invoiced in US dollars (USD). The large number on each card is always USD. If your browser is in India you may see an extra “≈ ₹…” line as a convenience estimate — that is not the billed amount. A visitor in the United States sees dollars only (unless they switch the local-estimate dropdown). We do not bill in INR.'
  },
  {
    category: 'Trust & Fit',
    question: 'I want to publish a guest article. Is that advertising?',
    answer: 'No. Guest tutorials are an editorial program: you write a useful technical piece, we review it, and you get a byline. That is free and it is not a sponsorship. Pitch it on the Write for Us page. This Advertise page is only for paid product placements. We will decline guest-post pitches sent through the sponsor form.'
  },
  {
    category: 'Audience',
    question: 'Who is the typical reader of DataEngineer Hub?',
    answer: 'Our audience consists of active data engineers (58%), analytics engineers (22%), data architects (12%), and engineering managers (8%). They are practitioners who design, build, and maintain data pipelines using modern cloud data stacks like Snowflake, dbt, Databricks, Spark, and major cloud services.'
  },
  {
    category: 'Placements',
    question: 'Where do my sponsorship placements appear?',
    answer: 'Depending on your package, your resource references or showcase cards are injected dynamically across relevant blog articles, cheatsheets, glossary terms, and interactive calculator tools matching your technology stack or category. This ensures your message is delivered only to high-intent readers.'
  },
  {
    category: 'Placements',
    question: 'How do you track impressions and clicks?',
    answer: 'Current sponsor links open the configured destination URL directly. Partners receive a private dashboard with placement details and preview delivery estimates while live event tracking is being rolled out.'
  },
  {
    category: 'Placements',
    question: 'Can I run multiple sponsorship packages at the same time?',
    answer: 'Yes. Many partners combine an Ecosystem Showcase directory listing with a Developer Resource Reference placement to cover both discovery and in-content, contextual mentions. Reach out and we\u2019ll put together bundled placement details for you.'
  },
  {
    category: 'Billing',
    question: 'Can I update my campaign details or links mid-run?',
    answer: 'Absolutely. You can request updates to your destination URL, platform description, logo, or target categories at any time. Changes are applied to the active sponsor configuration and usually published within 12-24 business hours.'
  },
  {
    category: 'Billing',
    question: 'What happens when my campaign duration ends?',
    answer: 'Campaign availability is controlled by start and end dates in the sponsor configuration. Once your campaign reaches its expiration date, the placement becomes inactive across matched tools, cheatsheets, and articles. We will notify you before expiry with renewal options.'
  },
  {
    category: 'Billing',
    question: 'What payment methods do you accept?',
    answer: 'We currently confirm every placement manually: after your inquiry, we\u2019ll follow up by email with an invoice and payment details (card or bank transfer). There is no self-serve checkout yet, so every campaign gets a human review first.'
  },
  {
    category: 'Billing',
    question: 'Is there a minimum commitment or lock-in period?',
    answer: 'No. Every package \u2014 including yearly tiers \u2014 runs for a fixed term with a clear end date and no auto-renewal. Renewing is always your choice once the current term ends.'
  },
  {
    category: 'Trust & Fit',
    question: 'How do you keep my placement exclusive from competitors?',
    answer: 'Each guide, cheatsheet, or comparison article shows at most one sponsor at a time, matched by category and targeting rules. We never stack competing sponsors on the same piece of content.'
  },
  {
    category: 'Trust & Fit',
    question: 'What if my product doesn\u2019t fit the data engineering audience?',
    answer: 'We manually review every inquiry before confirming a placement. If your product isn\u2019t a strong fit for a data engineering audience, we\u2019ll tell you honestly rather than take the booking.'
  }
];

const FAQ_CATEGORY_ICONS = {
  All: Sparkles,
  Audience: Users,
  Placements: Target,
  Billing: DollarSign,
  'Trust & Fit': Shield,
};

// Icon per billing term — gives the duration toggles instant visual meaning
const DURATION_ICONS = { weekly: Zap, monthly: Calendar, yearly: Crown, one_time: Sparkles };


const PROCESS_STEPS = [
  { icon: Mail, title: 'Submit Inquiry', desc: 'Fill out the form with your product details and preferred placement.' },
  { icon: Briefcase, title: 'Review & Align', desc: 'We review your request and confirm the best placement for your audience.' },
  { icon: Zap, title: 'Go Live', desc: 'Your campaign goes live with a private dashboard for placement review and delivery estimates.' },
  { icon: BarChart3, title: 'Track & Optimize', desc: 'Review placement coverage and campaign details while live reporting is being expanded.' },
];

// ─── New content/creator revenue channels ───────────────────────────────────
const CONTENT_CHANNELS = [
  {
    key: 'newsletter_sponsorship',
    icon: Newspaper,
    free: false,
    badge: 'Newsletter',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/30',
    accentBar: 'bg-amber-500',
    badgeStyle: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    title: 'Newsletter Sponsorship',
    tagline: 'Land in 2,500+ engineers’ inboxes — 44% average open rate',
    price: 40,
    priceLabel: 'per issue',
    bullets: [
      '150-word sponsored blurb placed at the top of our next newsletter edition',
      'Includes your logo, headline copy, and a single CTA link',
      'Sent to 2,500+ opted-in data engineers — 3× industry average open rate',
      'Plain-text format respected by engineering audiences — no ad-blocker risk',
      'Screenshot of your placement sent after delivery as proof of send',
    ],
    cta: 'Reserve a Newsletter Slot',
    ideal: 'Ideal for: product launches, free trial offers, event registrations, and new feature announcements',
  },
  {
    key: 'tool_listing',
    icon: Wrench,
    free: false,
    badge: 'Tools Hub',
    accentBg: 'bg-teal-500/10',
    accentText: 'text-teal-400',
    accentBorder: 'border-teal-500/30',
    accentBar: 'bg-teal-500',
    badgeStyle: 'bg-teal-500/15 text-teal-300 border border-teal-500/25',
    title: 'Permanent Tools Hub Listing',
    tagline: 'Featured in our interactive directory — searched daily by tool evaluators',
    price: 99,
    priceLabel: 'one-time',
    bullets: [
      'Your tool card lives permanently in the Tools Hub with logo, description, and CTA link',
      'Categorized under the correct ecosystem section (Warehousing, ETL, Orchestration, etc.)',
      'Visible to every visitor browsing tools — high purchase-intent traffic',
      'One free listing update per quarter (rename, new URL, updated description)',
      'No expiry — pay once, stay listed as long as the site runs',
    ],
    cta: 'List My Tool',
    ideal: 'Ideal for: SaaS tools, open-source projects, and cloud services wanting long-term discoverability',
  },
  {
    key: 'mention',
    icon: Link,
    free: false,
    badge: 'Backlink',
    accentBg: 'bg-rose-500/10',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/30',
    accentBar: 'bg-rose-500',
    badgeStyle: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
    title: 'In-article mention (referral, not SEO)',
    tagline: 'A labeled mention inside a matching guide — built for clicks, not link juice',
    price: 25,
    priceLabel: 'one placement',
    bullets: [
      'Your product named in a relevant, already-live article or cheat sheet',
      'Marked as sponsored / recommended resource — we never hide the disclosure',
      'Links are nofollow by default (this is not a backlink package)',
      'You approve the sentence and destination URL before it goes live',
      'Best for a product launch or a trial offer aimed at practitioners already reading that topic',
    ],
    cta: 'Book a Mention',
    ideal: 'Ideal for: indie tools and SaaS trials that want referral traffic, not a paid-link SEO play',
  },
];

// Per-package facts used in the comparison table — grounded in the real bullets
const PACKAGE_FACTS = {
  resource_reference: {
    placementType: 'In-content editorial callout',
    exclusivity: 'One sponsor per guide / article',
    newsletterPromo: false,
    githubRepo: false,
  },
  directory: {
    placementType: 'Tools Hub directory card',
    exclusivity: 'Multiple tools listed per category',
    newsletterPromo: false,
    githubRepo: false,
  },
  content: {
    placementType: 'Permanent co-authored blog post',
    exclusivity: 'Your brand as article author',
    newsletterPromo: true,
    githubRepo: true,
  },
};

const AdvertisePage = () => {
  // Real, live article count (cached 10 min via useStats) instead of a hardcoded figure
  const { totalArticles } = useStats();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    package: 'resource_reference',
    budget: '$30 USD / month',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // Dynamic Exchange Rates & Currency Toggles cached in localStorage
  const [exchangeRates, setExchangeRates] = useState(() => {
    try {
      const cached = localStorage.getItem('advertise_exchange_rates');
      return cached ? JSON.parse(cached) : { USD: 1 };
    } catch {
      return { USD: 1 };
    }
  });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedDurations, setSelectedDurations] = useState({
    resource_reference: 'monthly',
    directory: 'monthly',
    content: 'one_time'
  });

  // Global "quick switch" — applies Monthly/Yearly to every package that offers
  // that term in one click, instead of forcing visitors to click each card individually.
  const [globalDuration, setGlobalDuration] = useState('monthly');
  const applyGlobalDuration = (mode) => {
    setGlobalDuration(mode);
    setSelectedDurations((prev) => {
      const next = { ...prev };
      OPPORTUNITIES.forEach((opp) => {
        if (opp.durations.some((d) => d.key === mode)) {
          next[opp.packageKey] = mode;
        }
      });
      return next;
    });
  };

  // Fetch Live Global Currency Exchange Rates
  React.useEffect(() => {
    const fetchRates = async () => {
      let rates = { USD: 1 };
      try {
        const cached = localStorage.getItem('advertise_exchange_rates');
        if (cached) {
          rates = JSON.parse(cached);
        }
      } catch (e) {
        console.warn('Failed to load cached rates:', e);
      }

      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          rates = data.rates;
          setExchangeRates(data.rates);
          try {
            localStorage.setItem('advertise_exchange_rates', JSON.stringify(data.rates));
          } catch (e) {
            console.warn('Failed to cache exchange rates:', e);
          }
        }
      } catch (err) {
        console.error('Offline / rate fetch error, utilizing cached rates:', err);
        setExchangeRates(rates);
      }

      // Auto-detect local currency by checking timezone first (highest reliability)
      let detectedCurrency = 'USD';
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          const tzToCurrency = {
            'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR',
            'Europe/London': 'GBP', 'Europe/Belfast': 'GBP',
            'America/New_York': 'USD', 'America/Chicago': 'USD', 'America/Denver': 'USD', 'America/Los_Angeles': 'USD', 'America/Phoenix': 'USD',
            'America/Toronto': 'CAD', 'America/Vancouver': 'CAD', 'America/Winnipeg': 'CAD',
            'Australia/Sydney': 'AUD', 'Australia/Melbourne': 'AUD', 'Australia/Brisbane': 'AUD', 'Australia/Perth': 'AUD',
            'Asia/Singapore': 'SGD', 'Asia/Tokyo': 'JPY', 'America/Sao_Paulo': 'BRL', 'Africa/Johannesburg': 'ZAR',
            'Europe/Paris': 'EUR', 'Europe/Berlin': 'EUR', 'Europe/Rome': 'EUR', 'Europe/Madrid': 'EUR', 'Europe/Amsterdam': 'EUR', 'Europe/Dublin': 'EUR'
          };
          if (tzToCurrency[tz]) {
            detectedCurrency = tzToCurrency[tz];
          } else if (tz.startsWith('Europe/')) {
            const nonEuroTz = ['Europe/London', 'Europe/Belfast', 'Europe/Zurich', 'Europe/Oslo', 'Europe/Stockholm', 'Europe/Copenhagen'];
            if (!nonEuroTz.some(n => tz.includes(n))) {
              detectedCurrency = 'EUR';
            }
          }
        }
      } catch (e) {
        console.warn('Timezone currency detection failed:', e);
      }

      // Fallback: If timezone detection didn't match anything other than USD, check locale languages
      if (detectedCurrency === 'USD') {
        try {
          const languages = navigator.languages || [navigator.language || 'en-US'];
          for (const lang of languages) {
            const parts = lang.split(/[-_]/);
            if (parts.length > 1) {
              const country = parts[1].toUpperCase();
              const countryToCurrency = {
                IN: 'INR', US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
                CA: 'CAD', AU: 'AUD', JP: 'JPY', CN: 'CNY', BR: 'BRL', ZA: 'ZAR', SG: 'SGD', NZ: 'NZD',
                CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', TR: 'TRY'
              };
              if (countryToCurrency[country]) {
                detectedCurrency = countryToCurrency[country];
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Locale currency detection failed:', e);
        }
      }

      if (detectedCurrency && rates[detectedCurrency]) {
        setSelectedCurrency(detectedCurrency);
      }
    };
    fetchRates();
  }, []);

  // All sponsorships are billed in USD. Local amounts are estimates only.
  const formatUsd = (usdValue, maximumFractionDigits = 0) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits,
      }).format(usdValue);
    } catch (e) {
      return `$${usdValue}`;
    }
  };

  const formatLocal = (usdValue, maximumFractionDigits = 0) => {
    if (!selectedCurrency || selectedCurrency === 'USD') return null;
    try {
      const rate = exchangeRates[selectedCurrency] || 1;
      const converted = usdValue * rate;
      return new Intl.NumberFormat(navigator.language || 'en-US', {
        style: 'currency',
        currency: selectedCurrency,
        maximumFractionDigits,
      }).format(converted);
    } catch (e) {
      return null;
    }
  };

  const PriceBlock = ({ usd, suffix, large = false, digits = 0 }) => {
    const local = formatLocal(usd, digits);
    return (
      <div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={large ? 'text-3xl font-black text-white' : 'text-xl font-black text-white'}>
            {formatUsd(usd, digits)}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">USD</span>
          {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
        </div>
        {local && (
          <div className="text-xs text-gray-500 mt-0.5">≈ {local} (estimate)</div>
        )}
      </div>
    );
  };

  // Sort currency codes to show USD, INR, EUR, GBP, CAD, AUD first, then alphabetically
  const sortedCurrencyCodes = useMemo(() => {
    const ratesKeys = Object.keys(exchangeRates);
    const priority = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY'];
    const other = ratesKeys.filter(k => !priority.includes(k)).sort();
    return [...priority.filter(p => ratesKeys.includes(p)), ...other];
  }, [exchangeRates]);

  // ROI Slider State
  const [calcBudget, setCalcBudget] = useState(25);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All');
  const [showComparison, setShowComparison] = useState(false);

  const faqCategories = useMemo(() => ['All', ...Array.from(new Set(FAQS.map((f) => f.category)))], []);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesCategory = faqCategory === 'All' || faq.category === faqCategory;
      const matchesSearch = !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [faqSearch, faqCategory]);

  // Real max savings percentage parsed from the package durations data (not fabricated)
  const maxSavingsPercent = useMemo(() => {
    let max = 0;
    OPPORTUNITIES.forEach((opp) => {
      opp.durations.forEach((d) => {
        const match = /Save (\d+)%/.exec(d.savings || '');
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > max) max = val;
        }
      });
    });
    return max;
  }, []);

  // Real (non-fabricated) live-campaign counts per package, driven directly by
  // the same activeSponsors.json data that powers on-site sponsor placements.
  const liveCampaignCounts = useMemo(() => {
    const now = new Date();
    const counts = {};
    activeSponsorsData.forEach((s) => {
      if (!s.active) return;
      const startsAt = new Date(`${s.startDate}T00:00:00`);
      const endsAt = new Date(`${s.endDate}T23:59:59`);
      if (now >= startsAt && now <= endsAt) {
        counts[s.placement] = (counts[s.placement] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Memoized ROI Estimates
  const roiMetrics = useMemo(() => {
    const impressions = calcBudget * 22;
    const estCtr = 0.022; // 2.2% CTR average
    const clicks = Math.round(impressions * estCtr) || 1;
    const estCpc = (calcBudget / clicks).toFixed(2);
    return { impressions, clicks, estCpc };
  }, [calcBudget]);

  // Per-package billing options — each entry lists every valid price tier for that package.
  // The budget dropdown is filtered to only these options, so it is ALWAYS in sync with the
  // selected package. First entry = default auto-selected when package changes.
  const PACKAGE_BUDGET_OPTIONS = {
    resource_reference: [
      { value: '$30 USD / month', label: '$30 USD / month — flexible, cancel at term end' },
      { value: '$180 USD / year', label: '$180 USD / year — save 50% vs monthly' },
    ],
    directory: [
      { value: '$15 USD / week', label: '$15 USD / week — best for launches' },
      { value: '$45 USD / month', label: '$45 USD / month — save 25% vs weekly' },
      { value: '$240 USD / year', label: '$240 USD / year — save 56% vs monthly' },
    ],
    content: [
      { value: '$50 USD one-time', label: '$50 USD one-time — we co-write a sponsored integration guide' },
    ],
    newsletter_sponsorship: [
      { value: '$40 USD / issue', label: '$40 USD per newsletter issue — lowest-cost paid test' },
    ],
    tool_listing: [
      { value: '$99 USD one-time', label: '$99 USD one-time — listed in the Tools Hub' },
    ],
    mention: [
      { value: '$25 USD / mention', label: '$25 USD — one labeled in-article mention (nofollow)' },
    ],
    other: [
      { value: "Let's discuss", label: "Let's discuss — we'll figure it out together" },
    ],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'package') {
      const opts = PACKAGE_BUDGET_OPTIONS[value] ?? [];
      setFormData(prev => ({
        ...prev,
        package: value,
        // Auto-select the first (cheapest) option for the new package
        budget: opts.length > 0 ? opts[0].value : prev.budget,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
          payload.message || 'No additional details provided.'
        ].join('\n')
      );

      window.location.href = `mailto:${SPONSOR_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setError('Opening your email application to send the inquiry directly to sainath@dataengineerhub.blog...');
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
        `Billing Term / Budget: ${formData.budget}`,
        `Invoice currency: USD (local amounts on the page are estimates only)`,
        '',
        '--- Message / Pitch ---',
        formData.message || 'No additional details provided.'
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
          company: formData.company || 'Not provided',
          website: formData.website || 'Not provided',
          package: formData.package,
          budget: formData.budget,
          message: formattedMessage,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Submission failed');
      }
      
      trackEvent({
        action: 'sponsorship_inquiry_submitted',
        category: 'monetization',
        label: formData.package
      });

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        website: '',
        package: 'resource_reference',
        budget: '$30 USD / month',
        message: ''
      });
    } catch (err) {
      setError('We could not submit your inquiry. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (question) => {
    setOpenFaq(openFaq === question ? null : question);
  };

  // Resolve icon from config
  const resolveIcon = (iconName) => LucideIcons[iconName] || HelpCircle;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <Helmet>
        <title>Advertise with DataEngineer Hub — Sponsorships billed in USD</title>
        <meta name="description" content="Sponsor DataEngineer Hub. Reach data engineers who read Snowflake, dbt, Databricks, and Airflow guides. Packages from $15 USD/week. Guest articles are a separate, free editorial program." />
        <meta property="og:title" content="Advertise with DataEngineer Hub" />
        <meta property="og:description" content="Paid product placements for data-engineering tools. Prices billed in USD, from $15/week. Guest posts are not sponsorships — use Write for Us." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://dataengineerhub.blog/advertise" />
      </Helmet>

      <script type="application/ld+json">
        {JSON.stringify(getFAQSchema(FAQS.map(({ question, answer }) => ({ question, answer }))))}
      </script>

      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-600/8 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-8"
          >
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" /> Paid product placements · billed in USD
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6"
          >
            Reach the Engineers{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Building the Modern Data Stack
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Put your tool in front of engineers who are already costing a warehouse, debugging dbt, or comparing Spark vs Snowflake — not a generic banner audience. Sponsorships start at <span className="text-white font-semibold">$15 USD / week</span>. Guest articles are free and editorial; they live on <a href="/contribute" className="text-blue-400 hover:underline">Write for Us</a>, not this form.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              View USD packages <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition"
            >
              Book a paid placement <Mail className="h-4 w-4" />
            </a>
            <a
              href="/contribute"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition"
            >
              <PenLine className="h-4 w-4" /> Write a guest article (free)
            </a>
            <a
              href="#sponsor-policies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-semibold rounded-xl transition"
            >
              <FileText className="h-4 w-4" /> Policies &amp; Refunds
            </a>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 space-y-24 pb-24">

        {/* ═══════════════ AUDIENCE METRICS SECTION ═══════════════ */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Why DataEngineer Hub?</h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">High-intent, organic traffic from data professionals actively searching for tools, comparisons, and best practices.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {advertiseConfig.stats.map((stat, idx) => {
              const IconComponent = LucideIcons[stat.icon] || HelpCircle;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.08 }}
                  className="relative rounded-2xl bg-slate-900/60 border border-white/10 p-6 md:p-8 overflow-hidden backdrop-blur-sm group hover:border-blue-500/30 transition-colors"
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-purple-500/0" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-400">{stat.label}</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Audience Breakdown + Tech Stack */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Audience Roles */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" /> Audience Breakdown
              </h3>
              <div className="space-y-4">
                {advertiseConfig.audienceBreakdown.map((seg) => (
                  <div key={seg.role}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-gray-300">{seg.role}</span>
                      <span className="text-sm font-bold text-white">{seg.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${seg.percent}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-400" /> Core Tech Stack Interest
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {advertiseConfig.techStack.map((tech) => (
                  <span key={tech} className="px-3 py-1.5 bg-slate-800/80 border border-white/10 rounded-lg text-sm text-gray-300 font-medium hover:border-blue-500/30 transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-white">{totalArticles > 0 ? `${totalArticles}+` : '…'}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Published Articles</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{cheatsheets.length}+</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Cheatsheets & Guides</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h3 className="text-base font-bold text-white mb-3">This page is for</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> A data tool, cloud platform, or training product you want practitioners to try</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> A launch or trial you can describe in one sentence</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> Paying in USD — from $15/week or $40 for one newsletter issue</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
            <h3 className="text-base font-bold text-white mb-3">Send these somewhere else</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex gap-2"><X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" /> Guest articles and bylines — use <a href="/contribute" className="text-blue-400 hover:underline">Write for Us</a> (free)</li>
              <li className="flex gap-2"><X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" /> Paid dofollow backlinks / “guest post + DA” pitches — we do not sell those</li>
              <li className="flex gap-2"><X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" /> Generic SEO, gambling, or products that do not serve data engineers</li>
            </ul>
          </div>
        </div>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">How It Works</h2>
            <p className="text-sm text-gray-400">From inquiry to live campaign in under 48 hours.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="relative text-center"
              >
                {idx < PROCESS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 relative">
                  <step.icon className="h-6 w-6" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white">{idx + 1}</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">{step.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══════════════ TRANSPARENCY BANNER ═══════════════ */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 border border-blue-500/10 p-6 flex items-start gap-4 max-w-4xl mx-auto">
          <Shield className="h-6 w-6 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-white text-sm mb-1">Community Trust & Transparency</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              We only accept partners whose products genuinely serve the data engineering community. Every campaign gets a private dashboard with placement details and delivery estimates, and we only present live performance data once the tracking pipeline is enabled.
            </p>
          </div>
        </div>

        {/* ═══════════════ ROI CALCULATOR ═══════════════ */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-6 sm:p-10 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />
          
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Percent className="h-5 w-5 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">ROI & Reach Estimator</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Drag the slider. Budget is in <span className="text-white font-semibold">USD</span> (what we invoice). Figures below are illustrations, not guaranteed impressions — this is a content site, not a PPC network.
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Campaign Budget</span>
                  <span className="text-2xl font-black text-blue-400">{formatUsd(calcBudget)}</span>
                  <span className="text-[11px] font-semibold text-blue-300 ml-1">USD</span>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max="500" 
                  step="5"
                  value={calcBudget}
                  onChange={(e) => setCalcBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Min: {formatUsd(15)} USD</span>
                  <span>Max: {formatUsd(500)} USD</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-slate-950/40 border border-white/5 rounded-2xl p-6 items-center">
              <div className="text-center">
                <div className="inline-flex p-2 rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">{roiMetrics.impressions.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Impressions</div>
              </div>

              <div className="text-center border-x border-white/5 px-2">
                <div className="inline-flex p-2 rounded-xl bg-purple-500/10 text-purple-400 mb-3">
                  <MousePointerClick className="h-5 w-5" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">{roiMetrics.clicks.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Est. Clicks</div>
              </div>

              <div className="text-center">
                <div className="inline-flex p-2 rounded-xl bg-pink-500/10 text-pink-400 mb-3">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">{formatUsd(Number(roiMetrics.estCpc), 2)}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Est. CPC</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ PRICING SECTION ═══════════════ */}
        <div id="pricing">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Paid placements (billed in USD)</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-xl">
                Invoices and package prices are always US dollars. Use the selector only if you want a local estimate — a US visitor sees <span className="text-white">$30</span>, not rupees.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <label htmlFor="currency" className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Local estimate</label>
              <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <select
                id="currency"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                {sortedCurrencyCodes.map(code => (
                  <option key={code} value={code}>{code === 'USD' ? 'USD (billed)' : `${code} estimate`}</option>
                ))}
              </select>
              </div>
            </div>
          </div>

          {maxSavingsPercent > 0 && (
            <div className="flex flex-col items-center gap-2.5 mb-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Quick switch — applies to every package below</span>
              <div className="relative inline-flex items-center p-1.5 bg-slate-900/80 border border-white/10 rounded-full shadow-inner backdrop-blur-sm">
                {['monthly', 'yearly'].map((mode) => {
                  const isActive = globalDuration === mode;
                  const ModeIcon = DURATION_ICONS[mode];
                  return (
                    <motion.button
                      key={mode}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => applyGlobalDuration(mode)}
                      className={`relative z-10 px-5 sm:px-7 py-2.5 rounded-full text-sm font-bold transition-colors ${
                        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="global-duration-pill"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] -z-10"
                          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        <ModeIcon className="h-3.5 w-3.5" />
                        {mode === 'monthly' ? 'Bill Monthly' : 'Bill Yearly'}
                        {mode === 'yearly' && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-emerald-500/15 text-emerald-400'}`}>
                            <Flame className="h-2.5 w-2.5" /> Save {maxSavingsPercent}%
                          </span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {OPPORTUNITIES.map((opp, idx) => {
              const activeDuration = opp.durations.find(d => d.key === selectedDurations[opp.packageKey]) || opp.durations[0];
              const PkgIcon = resolveIcon(opp.icon);

              return (
                <div key={opp.title} className="relative">
                  {opp.popular && (
                    <motion.div
                      aria-hidden="true"
                      className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-md -z-10"
                      animate={{ opacity: [0.25, 0.55, 0.25] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    whileHover={{ y: -6 }}
                    className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden h-full transition-shadow ${
                      opp.popular 
                        ? 'bg-slate-900 border-2 border-blue-500/50 shadow-[0_12px_40px_rgba(59,130,246,0.15)]' 
                        : 'bg-slate-900/60 border border-white/10 hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]'
                    }`}
                  >
                  {/* Popular badge */}
                  {opp.popular && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  )}
                  {opp.popular && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                      <Star className="h-3 w-3" /> Most Popular
                    </div>
                  )}
                  
                  <div>
                    {/* Package icon + title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-xl ${opp.popular ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                        <PkgIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{opp.title}</h3>
                        <p className="text-[11px] text-gray-500">{opp.tagline}</p>
                      </div>
                    </div>

                    {/* Live availability signal — driven by real activeSponsors.json data, not fabricated */}
                    {liveCampaignCounts[opp.packageKey] > 0 && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-4">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        {liveCampaignCounts[opp.packageKey]} live campaign{liveCampaignCounts[opp.packageKey] > 1 ? 's' : ''} right now
                      </div>
                    )}
                    
                    {/* Price and duration */}
                    <div className="flex items-baseline gap-1.5 mb-2 border-b border-white/10 pb-4 min-h-14">
                      <PriceBlock usd={activeDuration.price} suffix={`/ ${activeDuration.label}`} large />
                    </div>

                    {/* Savings Badge */}
                    {activeDuration.savings && (
                      <div className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-4">
                        {activeDuration.savings}
                      </div>
                    )}

                    {/* Duration Option Selectors — modern sliding-pill segmented control */}
                    {opp.durations.length > 1 && (
                      <div className="relative flex gap-1 p-1.5 bg-slate-950/60 rounded-full mb-5 border border-white/5">
                        {opp.durations.map((dur) => {
                          const isActive = selectedDurations[opp.packageKey] === dur.key;
                          const durSavingsMatch = /Save (\d+)%/.exec(dur.savings || '');
                          const DurIcon = DURATION_ICONS[dur.key] || Calendar;
                          return (
                            <motion.button
                              key={dur.key}
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedDurations(prev => ({ ...prev, [opp.packageKey]: dur.key }));
                              }}
                              className={`relative flex-1 py-2 text-[11px] font-bold rounded-full transition-colors z-10 ${
                                isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId={`duration-pill-${opp.packageKey}`}
                                  className={`absolute inset-0 rounded-full -z-10 ${
                                    opp.popular
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_14px_rgba(99,102,241,0.5)]'
                                      : 'bg-blue-600 shadow-sm'
                                  }`}
                                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                />
                              )}
                              <span className="relative inline-flex items-center justify-center gap-1">
                                <DurIcon className="h-3 w-3" />
                                {dur.label}
                                {durSavingsMatch && (
                                  <span className={`text-[9px] px-1 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-emerald-500/15 text-emerald-400'}`}>
                                    -{durSavingsMatch[1]}%
                                  </span>
                                )}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Description */}
                    <div className="min-h-[72px] mb-6 flex items-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={activeDuration.key}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.12 }}
                          className="text-sm text-gray-400 leading-relaxed"
                        >
                          {activeDuration.desc}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    
                    {/* Feature bullets */}
                    <ul className="space-y-3 mb-8">
                      {opp.bullets.map(bullet => (
                        <li key={bullet} className="flex items-start gap-2.5 text-xs text-gray-300">
                          <Check className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* CTA Button */}
                  <a
                    href="#inquiry-form"
                    onClick={() => {
                      const opts = PACKAGE_BUDGET_OPTIONS[opp.packageKey] ?? [];
                      const match = opts.find((o) => o.value.toLowerCase().includes(activeDuration.key === 'yearly' ? 'year' : activeDuration.key === 'weekly' ? 'week' : activeDuration.key === 'one_time' ? 'one-time' : 'month')) || opts[0];
                      setFormData(prev => ({ 
                        ...prev, 
                        package: opp.packageKey,
                        budget: match?.value || prev.budget,
                        message: `Interested in "${opp.title}" at ${match?.value || activeDuration.label} (USD).`
                      }));
                    }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition flex items-center justify-center gap-1.5 ${
                      opp.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    }`}
                  >
                    {opp.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Compare all packages toggle + table */}
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setShowComparison((prev) => !prev)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-gray-300 hover:text-white transition"
            >
              <ListChecks className="h-4 w-4 text-blue-400" />
              {showComparison ? 'Hide package comparison' : 'Compare all packages'}
              <ChevronDown className={`h-4 w-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showComparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-sm border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-slate-900/80">
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-gray-400 p-4 w-40">Package</th>
                        {OPPORTUNITIES.map((opp) => (
                          <th
                            key={opp.title}
                            className={`text-left p-4 align-bottom ${opp.popular ? 'bg-blue-500/10 border-x border-blue-500/30' : ''}`}
                          >
                            {opp.popular && (
                              <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full mb-1.5">
                                <Star className="h-2.5 w-2.5" /> Recommended
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                              {React.createElement(resolveIcon(opp.icon), { className: 'h-4 w-4 text-blue-400 shrink-0' })}
                              {opp.title}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="bg-slate-950/30">
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Best For</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 text-gray-300 text-xs leading-relaxed ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>{opp.tagline}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Starting At</td>
                        {OPPORTUNITIES.map((opp) => {
                          const cheapest = opp.durations.reduce((min, d) => (d.price < min.price ? d : min), opp.durations[0]);
                          return (
                            <td key={opp.title} className={`p-4 text-white font-bold text-sm ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>
                              {formatUsd(cheapest.price)} USD <span className="text-gray-500 font-normal text-xs">/ {cheapest.label}</span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-slate-950/30">
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Available Terms</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 text-gray-300 text-xs ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>{opp.durations.map((d) => d.label).join(' / ')}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Placement Type</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 text-gray-300 text-xs ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>{PACKAGE_FACTS[opp.packageKey]?.placementType}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-950/30">
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Exclusivity</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 text-gray-300 text-xs ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>{PACKAGE_FACTS[opp.packageKey]?.exclusivity}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Newsletter & Social Promo</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>
                            {PACKAGE_FACTS[opp.packageKey]?.newsletterPromo
                              ? <Check className="h-4 w-4 text-emerald-400" />
                              : <span className="text-gray-600 text-xs">—</span>}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-slate-950/30">
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Companion GitHub Repo</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>
                            {PACKAGE_FACTS[opp.packageKey]?.githubRepo
                              ? <Check className="h-4 w-4 text-emerald-400" />
                              : <span className="text-gray-600 text-xs">—</span>}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400">Key Benefit</td>
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 text-gray-300 text-xs leading-relaxed ${opp.popular ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>{opp.bullets[0]}</td>
                        ))}
                      </tr>
                      <tr className="bg-slate-950/30">
                        <td className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400" />
                        {OPPORTUNITIES.map((opp) => (
                          <td key={opp.title} className={`p-4 ${opp.popular ? 'bg-blue-500/5 border-x border-b border-blue-500/20 rounded-b-lg' : ''}`}>
                            <a
                              href="#inquiry-form"
                              onClick={() => {
                                const activeDuration = opp.durations.find(d => d.key === selectedDurations[opp.packageKey]) || opp.durations[0];
                                setFormData(prev => ({
                                  ...prev,
                                  package: opp.packageKey,
                                  message: `Interested in the "${opp.title}" package with the "${activeDuration.label}" option.`
                                }));
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                            >
                              {opp.cta} <ArrowRight className="h-3 w-3" />
                            </a>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════════ CONTENT & CREATOR REVENUE CHANNELS ═══════════════ */}
        <div id="content-channels">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4">
              <Zap className="h-3.5 w-3.5" /> Lower-cost paid tests
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Start smaller if a monthly package feels heavy</h2>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              These are still paid product placements in USD — a one-issue newsletter, a Tools Hub card, or a single labeled mention. They are meant for launches and indie tools, not for guest-post SEO.
            </p>
          </div>

          <div className="mb-10 max-w-3xl mx-auto rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 flex items-start gap-4">
            <PenLine className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300 leading-relaxed">
              <span className="text-white font-semibold">Looking to write a tutorial?</span> That is not a sponsorship.
              Guest articles are free, editorially reviewed, and billed at $0. Pitch them on{' '}
              <a href="/contribute" className="text-blue-400 hover:underline font-semibold">Write for Us</a>.
              Do not use the form below for guest posts — we will send you there anyway.
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {CONTENT_CHANNELS.map((ch, idx) => {
              const ChIcon = ch.icon;
              return (
                <motion.div
                  key={ch.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden backdrop-blur-sm transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20"
                >
                  {/* Thin left accent bar */}
                  <div className={`absolute top-0 left-0 w-[3px] h-full ${ch.accentBar}`} />

                  <div className="pl-5 pr-6 pt-6 pb-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${ch.accentBg}`}>
                          <ChIcon className={`h-5 w-5 ${ch.accentText}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${ch.badgeStyle}`}>
                              {ch.badge}
                            </span>
                            {ch.free && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                <Check className="h-2.5 w-2.5" /> Free
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-white leading-snug">{ch.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{ch.tagline}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {ch.free ? (
                          <>
                            <div className="text-xl font-black text-emerald-400">Free</div>
                            <div className="text-[10px] text-gray-500">{ch.priceLabel}</div>
                          </>
                        ) : (
                          <>
                            <PriceBlock usd={ch.price} suffix={`/ ${ch.priceLabel}`} />
                          </>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-5">
                      {ch.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs text-gray-300">
                          <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${ch.accentText}`} />
                          {b}
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-white/5 pt-4 mb-4">
                      <p className="text-[11px] text-gray-500 italic">{ch.ideal}</p>
                    </div>

                    <a
                      href="#inquiry-form"
                      onClick={() => {
                        const opts = PACKAGE_BUDGET_OPTIONS[ch.key] ?? [];
                        setFormData(prev => ({
                          ...prev,
                          package: ch.key,
                          budget: opts[0]?.value || prev.budget,
                          message: `Interested in "${ch.title}" (${opts[0]?.value || ''} USD).`,
                        }));
                      }}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm text-center transition flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border ${ch.accentBorder} ${ch.accentText} hover:text-white`}
                    >
                      {ch.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Creator mindset nudge */}
          <div className="mt-8 max-w-3xl mx-auto rounded-2xl border border-white/10 bg-slate-900/30 p-5 flex items-start gap-4">
            <Bell className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400 leading-relaxed">
              <span className="text-white font-semibold">Indie tools are welcome.</span> You do not need an enterprise marketing budget.
              The newsletter slot at $40 USD is the cheapest paid test. If you only have a tutorial to share, use{' '}
              <a href="/contribute" className="text-blue-400 hover:underline">Write for Us</a> instead of buying a placement.
            </p>
          </div>
        </div>

        {/* ═══════════════ FAQs SECTION ═══════════════ */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-400 mt-2">Everything you need to know about sponsoring DataEngineer Hub.</p>
          </div>

          {/* Search box */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search questions (e.g. payment, tracking, exclusivity)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {faqSearch && (
              <button
                type="button"
                onClick={() => setFaqSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {faqCategories.map((cat) => {
              const CatIcon = FAQ_CATEGORY_ICONS[cat] || HelpCircle;
              const isActive = faqCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFaqCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <CatIcon className="h-3.5 w-3.5" />
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredFaqs.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-500">
                No questions match "{faqSearch}". Try a different keyword, or{' '}
                <a href="#inquiry-form" className="text-blue-400 hover:underline">ask us directly</a>.
              </div>
            )}
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.question}
                className="border border-white/10 rounded-2xl bg-slate-900/40 overflow-hidden backdrop-blur-sm hover:border-white/15 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(faq.question)}
                  className="w-full flex items-center justify-between p-5 text-left text-white hover:text-blue-400 transition-colors focus:outline-none"
                >
                  <span className="font-semibold text-sm sm:text-base flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-blue-400 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${openFaq === faq.question ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {openFaq === faq.question && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 border-t border-white/5 text-sm text-gray-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Still have questions CTA */}
          <div className="mt-10 text-center rounded-2xl border border-white/10 bg-slate-900/30 p-6">
            <p className="text-sm text-gray-300 font-semibold mb-1">Still have questions?</p>
            <p className="text-xs text-gray-500 mb-4">We're happy to talk through placement fit before you commit.</p>
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              Ask us directly <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* ═══════════════ SPONSOR POLICIES ═══════════════ */}
        <div id="sponsor-policies" className="space-y-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Sponsorship Policies</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              We believe in being fully transparent about how this works — no fine print buried at the bottom. Everything you need to know before committing is right here.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">

            {/* Refund & Cancellation Policy */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white">Refund &amp; Cancellation Policy</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                <p><span className="text-white font-semibold">Cancellation before go-live:</span> You may cancel at any time before your campaign is published and receive a full refund, no questions asked.</p>
                <p><span className="text-white font-semibold">Partial refunds after go-live:</span> If your campaign has been live for less than 7 days and you are unsatisfied, contact us and we will issue a pro-rated refund for the unused portion of your term.</p>
                <p><span className="text-white font-semibold">No refunds after 7 days:</span> Once a campaign has been active for more than 7 days, it is considered fulfilled. Placements are manual-review and editorial in nature, so delivery cannot be undone.</p>
                <p><span className="text-white font-semibold">Yearly packages:</span> Yearly terms are non-refundable after the first month unless there is a failure on our end to deliver the agreed placement.</p>
                <p className="text-xs text-gray-500 pt-2 border-t border-white/5">To request a refund, email <a href="mailto:sainath@dataengineerhub.blog" className="text-blue-400 hover:underline">sainath@dataengineerhub.blog</a> with your campaign token and reason.</p>
              </div>
            </div>

            {/* Editorial Standards & Content Policy */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/15 text-blue-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white">Editorial Standards &amp; Content Policy</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                <p><span className="text-white font-semibold">Editorial independence:</span> Sponsorships never influence our editorial content. Articles, comparisons, and tutorials are written independently. Sponsored placements are always visually distinct and marked &quot;Sponsored&quot; or &quot;Recommended Resource.&quot;</p>
                <p><span className="text-white font-semibold">Accepted categories:</span> Developer tools, cloud data platforms, SaaS products, training/certification programs, and infrastructure services relevant to the data engineering stack.</p>
                <p><span className="text-white font-semibold">Rejected categories:</span> We do not accept ads for financial products, gambling, adult content, get-rich-quick schemes, generic SEO services, or products that compete with the trust and educational mission of this site.</p>
                <p><span className="text-white font-semibold">Right to decline:</span> We reserve the right to decline any campaign inquiry that does not meet our community standards, even after initial review.</p>
              </div>
            </div>

            {/* Campaign Delivery & Timing */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/15 text-purple-400">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white">Campaign Delivery &amp; Timing</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                <p><span className="text-white font-semibold">Go-live timeline:</span> Campaigns are typically activated within 24–48 business hours after payment confirmation and campaign details are received.</p>
                <p><span className="text-white font-semibold">Start and end dates:</span> Your campaign runs from the agreed start date to the end date shown in your private dashboard. Duration is calendar-based (not impression-based), so the clock does not pause on weekends.</p>
                <p><span className="text-white font-semibold">Delays:</span> If activation is delayed by more than 48 hours due to our side, the campaign end date will be extended accordingly at no cost.</p>
                <p><span className="text-white font-semibold">Mid-campaign updates:</span> Logo, URL, or description changes can be requested at any time. Changes are applied within 12–24 business hours.</p>
              </div>
            </div>

            {/* Advertiser Responsibilities & Legal */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-400">
                  <Scale className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white">Advertiser Responsibilities &amp; Legal</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                <p><span className="text-white font-semibold">Accuracy of claims:</span> You are responsible for ensuring all content, logos, and links provided are accurate, up to date, and compliant with applicable laws in your jurisdiction.</p>
                <p><span className="text-white font-semibold">Indemnification:</span> By submitting a campaign, you agree that DataEngineer Hub is not liable for any consequences arising from your product, service, or linked content.</p>
                <p><span className="text-white font-semibold">FTC disclosure:</span> All sponsored placements are marked as such in compliance with FTC guidelines. We will not remove or obscure any sponsorship disclosure at an advertiser&apos;s request.</p>
                <p><span className="text-white font-semibold">Privacy:</span> We do not share your email, company details, or payment information with third parties. See our <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a> for full details.</p>
              </div>
            </div>

          </div>

          {/* What you're not paying for */}
          <div className="max-w-5xl mx-auto mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400">
                <AlertCircle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white">What This Sponsorship Does <em>Not</em> Include</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Guaranteed traffic numbers', note: 'Impressions and clicks are estimates, not guarantees. This is a developer content site, not a PPC ad network.' },
                { label: 'Guaranteed search rankings', note: "We cannot and do not promise that a placement will affect your product's Google search rankings." },
                { label: 'Exclusive site-wide ownership', note: 'Your placement is targeted to relevant content. Other sponsors may appear in unrelated sections.' },
                { label: 'Dofollow backlinks by default', note: 'Sponsor links use rel="noopener noreferrer". If you need link attribution, discuss with us before booking.' },
                { label: 'Unlimited mid-campaign edits', note: 'Up to 3 content edits per campaign term are included. Additional changes may be discussed case by case.' },
                { label: 'Real-time analytics dashboard', note: 'Full live click/impression tracking is in development. Current dashboard shows placement details and estimated delivery.' },
              ].map(({ label, note }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What IS included every time */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white">What Every Sponsor Gets — Guaranteed</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Manual review of your campaign before it goes live — no auto-approval',
                'Private dashboard access token emailed within 48 hours',
                'Campaign placement in content contextually relevant to your product category',
                '"Sponsored" disclosure on every placement, compliant with FTC guidelines',
                'At least 1 free mid-campaign content update (URL, description, or logo)',
                'Renewal reminder 7 days before your campaign expires',
                'Direct email access to the site author — not a support ticket system',
                'Pro-rated refund eligibility within the first 7 days if not satisfied',
                'Your campaign data kept private and never sold to third parties',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-white/5 bg-slate-900/20 p-5 text-xs text-gray-500 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <FileText className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
              <p>
                <span className="text-gray-400 font-semibold">Legal Disclaimer:</span> All sponsorship agreements are informal business arrangements and do not constitute a formal advertising contract unless explicitly agreed in writing via email. DataEngineer Hub (operated by Sainath Reddy) is a sole-proprietor independent publisher. Placements are editorial in nature and are subject to removal if they are found to violate community standards at any point. By submitting an inquiry and making payment, you acknowledge that you have read and agree to these policies. These policies may be updated at any time; the version published on this page at the time of your booking applies to your current campaign.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════ CONTACT / INQUIRY SECTION ═══════════════ */}
        <div id="inquiry-form" className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Book a paid placement</h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Tell us the product and the USD package. We reply within 24 business hours with fit, dates, and an invoice in US dollars. Guest-article pitches belong on <a href="/contribute" className="text-blue-400 hover:underline">Write for Us</a>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-300">Direct Contact</div>
                    <a href="mailto:sainath@dataengineerhub.blog" className="hover:underline">sainath@dataengineerhub.blog</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-300">Response Window</div>
                    <div>Normally within 24 business hours</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-300">Private Dashboard</div>
                    <div>Secure token + placement overview</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center flex flex-col items-center justify-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Inquiry submitted</h3>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                    Thanks. We will reply with whether the product is a fit, the USD invoice, and campaign dates. If you meant to pitch a tutorial, use Write for Us instead.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Business Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Company Name</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label htmlFor="website" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Website URL</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        required
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="https://acme.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="package" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">What are you interested in?</label>
                      <select
                        id="package"
                        name="package"
                        value={formData.package}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="newsletter_sponsorship">Try it: Newsletter — $40 USD / issue</option>
                        <option value="resource_reference">Developer Resource Reference — $30 USD/mo or $180 USD/yr</option>
                        <option value="directory">Tools Hub card — $15 USD/wk · $45 USD/mo · $240 USD/yr</option>
                        <option value="mention">In-article mention (nofollow) — $25 USD</option>
                        <option value="tool_listing">Tools Hub listing — $99 USD one-time</option>
                        <option value="content">Sponsored integration guide (we co-write) — $50 USD</option>
                        <option value="other">Custom / not sure yet</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        {(PACKAGE_BUDGET_OPTIONS[formData.package] ?? []).length > 1 ? 'USD billing term' : 'USD price'}
                      </label>
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        {(PACKAGE_BUDGET_OPTIONS[formData.package] ?? PACKAGE_BUDGET_OPTIONS.other).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Product and what you want to promote
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                      placeholder="Product name, who it is for (e.g. Snowflake cost / dbt Cloud), and a preferred start month..."
                    />
                  </div>

                  {error && <div className="text-red-400 text-xs">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                  >
                    {loading ? (
                      <>Submitting...</>
                    ) : (
                      <>Submit paid inquiry <Send className="h-4 w-4" /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdvertisePage;
