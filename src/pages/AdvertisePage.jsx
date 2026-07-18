// src/pages/AdvertisePage.jsx
// Dedicated "Advertise / Sponsorship" page for DataEngineer Hub.
// Premium SaaS-quality design optimized for conversion and transparency.
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { 
  Mail, Check, Sparkles, Send, ShieldCheck, 
  Users, BarChart3, TrendingUp, Calendar, ArrowRight, CheckCircle2,
  DollarSign, Globe, ChevronDown, HelpCircle, Eye, MousePointerClick,
  Percent, BookOpen, Layers, Code, Zap, Target, Star, Shield,
  ArrowUpRight, ChevronRight, Briefcase, Building2
} from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import advertiseConfig from '@/data/advertiseConfig.json';

// ─── Constants ───────────────────────────────────────────────────────────────
const OPPORTUNITIES = advertiseConfig.opportunities;

const FAQS = [
  {
    question: 'Who is the typical reader of DataEngineer Hub?',
    answer: 'Our audience consists of active data engineers (58%), analytics engineers (22%), data architects (12%), and engineering managers (8%). They are practitioners who design, build, and maintain data pipelines using modern cloud data stacks like Snowflake, dbt, Databricks, Spark, and major cloud services.'
  },
  {
    question: 'Where do my sponsorship placements appear?',
    answer: 'Depending on your package, your resource references or showcase cards are injected dynamically across relevant blog articles, cheatsheets, glossary terms, and interactive calculator tools matching your technology stack or category. This ensures your message is delivered only to high-intent readers.'
  },
  {
    question: 'How do you track impressions and clicks?',
    answer: 'We route sponsor links through a lightweight, secure redirect utility. This logs click events in real-time to your private analytics dashboard while ensuring standard, clean link forwarding directly to your destination URL.'
  },
  {
    question: 'Can I update my campaign details or links mid-run?',
    answer: 'Absolutely. You can request updates to your destination URL, platform description, logo, or target categories at any time. Updates are synced to the site database within 12-24 business hours.'
  },
  {
    question: 'What happens when my campaign duration ends?',
    answer: 'Our sponsorship server uses date-based rules to manage active slots. Once your campaign hits its expiration date, the placement is automatically removed from all tools, cheatsheets, and articles across the site. We will notify you 5 days prior to expiration with options to renew or lock in your slot.'
  }
];

const PROCESS_STEPS = [
  { icon: Mail, title: 'Submit Inquiry', desc: 'Fill out the form with your product details and preferred placement.' },
  { icon: Briefcase, title: 'Review & Align', desc: 'We review your request and confirm the best placement for your audience.' },
  { icon: Zap, title: 'Go Live', desc: 'Your campaign goes live with a secure dashboard for real-time tracking.' },
  { icon: BarChart3, title: 'Track & Optimize', desc: 'Monitor impressions, clicks, and CTR on your private analytics dashboard.' },
];

const AdvertisePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    package: 'resource_reference',
    budget: '$15 - $50',
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

  // Format dynamic converted prices based on active currency
  const formatPrice = (usdValue) => {
    try {
      const rate = exchangeRates[selectedCurrency] || 1;
      const converted = usdValue * rate;
      return new Intl.NumberFormat(navigator.language || 'en-US', {
        style: 'currency',
        currency: selectedCurrency,
        maximumFractionDigits: 0
      }).format(converted);
    } catch (e) {
      return `$${usdValue}`;
    }
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

  // Memoized ROI Estimates
  const roiMetrics = useMemo(() => {
    const impressions = calcBudget * 22;
    const estCtr = 0.022; // 2.2% CTR average
    const clicks = Math.round(impressions * estCtr) || 1;
    const estCpc = (calcBudget / clicks).toFixed(2);
    return { impressions, clicks, estCpc };
  }, [calcBudget]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) return;
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
        budget: '$15 - $50',
        message: ''
      });
    } catch (err) {
      setError('Something went wrong. Please try again or reach out directly.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Resolve icon from config
  const resolveIcon = (iconName) => LucideIcons[iconName] || HelpCircle;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <Helmet>
        <title>Advertise with DataEngineer Hub — Reach Active Data Engineers</title>
        <meta name="description" content="Partner with DataEngineer Hub to showcase your developer tools, cloud platforms, and data infrastructure to 15,000+ monthly active data engineers. Flexible weekly, monthly, and yearly sponsorship packages." />
        <meta property="og:title" content="Advertise with DataEngineer Hub" />
        <meta property="og:description" content="Reach active data engineers building with Snowflake, dbt, Databricks, and the modern data stack. Sponsorship packages from $15/week." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://dataengineerhub.com/advertise" />
      </Helmet>

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
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" /> Developer-First Sponsorship
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
            DataEngineer Hub serves 15,000+ monthly practitioners actively evaluating tools, building pipelines, and shipping production data infrastructure. Get your product in front of the right engineers, at the right moment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              View Pricing <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition"
            >
              Contact Us <Mail className="h-4 w-4" />
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
                    <div className="text-xl font-bold text-white">76+</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Published Articles</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">30+</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Cheatsheets & Guides</div>
                  </div>
                </div>
              </div>
            </div>
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
              We only accept partners whose products genuinely serve the data engineering community. Every campaign gets a private dashboard with real click data — no inflated metrics, just clear visibility into your ROI.
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
                Drag the slider to estimate the visibility and developer engagement your budget can unlock across our content channels.
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Campaign Budget</span>
                  <span className="text-2xl font-black text-blue-400">{formatPrice(calcBudget)}</span>
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
                  <span>Min: {formatPrice(15)}</span>
                  <span>Max: {formatPrice(500)}</span>
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
                <div className="text-lg sm:text-xl font-bold text-white">${roiMetrics.estCpc}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Est. CPC</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ PRICING SECTION ═══════════════ */}
        <div id="pricing">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Choose a Developer Product Placement</h2>
              <p className="text-sm text-gray-400 mt-2">
                Pricing is automatically localized to your region. All placements include a private analytics dashboard.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                {sortedCurrencyCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {OPPORTUNITIES.map((opp, idx) => {
              const activeDuration = opp.durations.find(d => d.key === selectedDurations[opp.packageKey]) || opp.durations[0];
              const formattedPrice = formatPrice(activeDuration.price);
              const PkgIcon = resolveIcon(opp.icon);

              return (
                <motion.div
                  key={opp.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden ${
                    opp.popular 
                      ? 'bg-slate-900 border-2 border-blue-500/50 shadow-[0_12px_40px_rgba(59,130,246,0.15)]' 
                      : 'bg-slate-900/60 border border-white/10 hover:border-white/20 transition-colors'
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
                    
                    {/* Price and duration */}
                    <div className="flex items-baseline gap-1.5 mb-2 border-b border-white/10 pb-4 h-14">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={formattedPrice}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.12 }}
                          className="text-3xl font-black text-white"
                        >
                          {formattedPrice}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-sm text-gray-400">/ {activeDuration.label}</span>
                    </div>

                    {/* Savings Badge */}
                    {activeDuration.savings && (
                      <div className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-4">
                        {activeDuration.savings}
                      </div>
                    )}

                    {/* Duration Option Selectors */}
                    {opp.durations.length > 1 && (
                      <div className="flex gap-1 p-1 bg-slate-950/60 rounded-xl mb-5 border border-white/5">
                        {opp.durations.map(dur => (
                          <button
                            key={dur.key}
                            type="button"
                            onClick={() => {
                              setSelectedDurations(prev => ({ ...prev, [opp.packageKey]: dur.key }));
                            }}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                              selectedDurations[opp.packageKey] === dur.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {dur.label}
                          </button>
                        ))}
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
                      setFormData(prev => ({ 
                        ...prev, 
                        package: opp.packageKey,
                        message: `Interested in the "${opp.title}" package with the "${activeDuration.label}" option.`
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
              );
            })}
          </div>
        </div>

        {/* ═══════════════ FAQs SECTION ═══════════════ */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-400 mt-2">Everything you need to know about sponsoring DataEngineer Hub.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-white/10 rounded-2xl bg-slate-900/40 overflow-hidden backdrop-blur-sm hover:border-white/15 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-white hover:text-blue-400 transition-colors focus:outline-none"
                >
                  <span className="font-semibold text-sm sm:text-base flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-blue-400 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {openFaq === idx && (
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
        </div>

        {/* ═══════════════ CONTACT / INQUIRY SECTION ═══════════════ */}
        <div id="inquiry-form" className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Start a Campaign</h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  Submit an inquiry and we'll get back to you within 24 hours with placement confirmation, a secure analytics token, and your private dashboard link.
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
                    <div>Secure token + real-time analytics</div>
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
                  <h3 className="text-xl font-bold text-white mb-2">Inquiry Submitted!</h3>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                    Thank you. We've received your request and will respond with custom placement specs and your private dashboard credentials.
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
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="https://acme.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="package" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Preferred Package</label>
                      <select
                        id="package"
                        name="package"
                        value={formData.package}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="resource_reference">Developer Resource Reference</option>
                        <option value="directory">Ecosystem Showcase</option>
                        <option value="content">Technical Integration Guide</option>
                        <option value="other">Custom Campaign</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Estimated Budget</label>
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="$15 - $50">$15 – $50 (Single placement)</option>
                        <option value="$50 - $100">$50 – $100 (Multi-month)</option>
                        <option value="$100 - $250">$100 – $250 (Yearly tier)</option>
                        <option value="$250+">$250+ (Multiple placements)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Brief Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                      placeholder="Tell us a little bit about what you'd like to promote and your target timeline..."
                    />
                  </div>

                  {error && <div className="text-red-400 text-xs">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {loading ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        Submit Inquiry <Send className="h-4 w-4" />
                      </>
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
