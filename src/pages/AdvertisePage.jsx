// src/pages/AdvertisePage.jsx
// Dedicated "Advertise / Sponsorship" page for DataEngineer Hub.
// Fully optimized for conversion rate (CRO) and AdSense compliance.
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, MessageSquare, Check, Sparkles, Send, ShieldCheck, 
  Users, BarChart3, TrendingUp, Calendar, ArrowRight, CheckCircle2,
  DollarSign, Globe, Award, ChevronDown, HelpCircle, Eye, MousePointerClick,
  Percent, AlertCircle
} from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

// ─── Constants ───────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Monthly Pageviews', value: '15,000+', desc: 'High-intent search traffic', icon: BarChart3 },
  { label: 'Newsletter Subscribers', value: '2,500+', desc: 'Engaged active developers', icon: Users },
  { label: 'Average Open Rate', value: '44.2%', desc: 'Industry leading open rates', icon: TrendingUp },
];

const OPPORTUNITIES = [
  {
    title: 'Newsletter Sponsorship',
    price: '$45',
    frequency: 'per issue (Beta Rate)',
    availability: 'Only 2 slots left this month',
    description: 'Get featured in our weekly newsletter. Showcase your data tools or open-source projects directly to active data engineers. (Normally $150)',
    bullets: [
      'Top-of-email placement',
      'Up to 150 words of custom copy',
      'Exclusive: Only 1 sponsor per issue',
      'Sponsor badge & click tracking'
    ],
    cta: 'Book Newsletter Spot',
    packageKey: 'newsletter',
    popular: true
  },
  {
    title: 'Contextual Tool Banner',
    price: '$75',
    frequency: 'per month (Beta Rate)',
    availability: '3 slots remaining',
    description: 'Place a native text ad or small banner directly within our popular interactive cost calculators and tools. (Normally $200)',
    bullets: [
      'Visible on cost calculator pages',
      'Reach users calculating platform spend',
      'Static native placement (no intrusive ads)',
      'Highly targeted B2B traffic'
    ],
    cta: 'Book Banner Spot',
    packageKey: 'banner',
    popular: false
  },
  {
    title: 'Sponsored Content / Review',
    price: '$190',
    frequency: 'one-time fee (Beta Rate)',
    availability: '1 slot open next month',
    description: 'A deep-dive tutorial or product review of your data tool written by an expert data engineer. (Normally $500)',
    bullets: [
      'In-depth 1,500+ word article',
      'SEO optimized long-tail focus',
      'Permanent post with clear disclaimer',
      'Shared across newsletter & social channels'
    ],
    cta: 'Submit Content Brief',
    packageKey: 'content',
    popular: false
  }
];

const FAQS = [
  {
    question: 'Who is the typical reader of DataEngineer Hub?',
    answer: 'Our audience consists of active data engineers (58%), analytics engineers (22%), data architects (12%), and engineering managers (8%). They primarily work with modern data stack utilities like Snowflake, dbt, Databricks, Apache Spark, and AWS/Azure/GCP cloud services.'
  },
  {
    question: 'How do you structure outbound sponsor links?',
    answer: 'To protect your brand and ours, all sponsored links use the Google-compliant rel="sponsored" attribute. This completely satisfies search engine policies while maintaining clean routing paths for your campaigns.'
  },
  {
    question: 'Can we track the performance of our campaign?',
    answer: 'Absolutely. We provide a custom dashboard link containing real-time metrics showing total impressions, click volume, and click-through rates (CTR) at the end of each newsletter or tool banner campaign.'
  },
  {
    question: 'What is the lead time for sponsored articles?',
    answer: 'Typically 10-14 days. This allows our technical writers to research, build code examples, and perform quality checks on the post before publication.'
  }
];

// Stylized inline logos of typical MDS systems (safely built with SVG)
const SPONSOR_LOGOS = [
  { name: 'Snowflake', svg: <svg viewBox="0 0 24 24" className="h-6 fill-current"><path d="M12 2L9.5 7.5h5L12 2zm0 20l2.5-5.5h-5L12 22zM2 12l5.5 2.5v-5L2 12zm20 0l-5.5-2.5v5L22 12zM5.5 5.5l5 1.5-1.5-5-3.5 3.5zm13 13l-5-1.5 1.5 5 3.5-3.5zm-13 0l3.5 3.5 1.5-5-5 1.5zm13-13l-3.5-3.5-1.5 5 5-1.5z"/></svg> },
  { name: 'Databricks', svg: <svg viewBox="0 0 24 24" className="h-6 fill-current"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm8 13.8l-8 4-8-4V8.2l8-4 8 4v7.6z"/></svg> },
  { name: 'dbt Labs', svg: <svg viewBox="0 0 24 24" className="h-6 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2V7h2v2.5z"/></svg> },
  { name: 'Apache Spark', svg: <svg viewBox="0 0 24 24" className="h-6 fill-current"><path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm6 15l-6 3-6-3V7.5l6-3 6 3V17z"/></svg> },
];

const AdvertisePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    package: 'newsletter',
    budget: '$500 - $1,000',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // ROI Slider State
  const [calcBudget, setCalcBudget] = useState(75);
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
        package: 'newsletter',
        budget: '$500 - $1,000',
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

  return (
    <div className="min-h-screen bg-slate-950 text-white relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6"
          >
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" /> Partnership Opportunities
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-6"
          >
            Reach Active{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Data Engineers
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 leading-relaxed"
          >
            Partner with DataEngineer Hub to showcase your platforms, developer tooling, and cloud infrastructure services directly to the builders and architects shaping the modern data stack.
          </motion.p>
        </div>

        {/* Brand Trust Bar */}
        <div className="mb-20 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-6">Audience Stack Familiarity</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale hover:opacity-50 transition-opacity">
            {SPONSOR_LOGOS.map((logo) => (
              <div key={logo.name} className="flex items-center gap-2 text-white">
                {logo.svg}
                <span className="font-bold text-sm tracking-wider">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                className="relative rounded-2xl bg-slate-900/60 border border-white/10 p-6 md:p-8 overflow-hidden backdrop-blur-sm group"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-purple-500/0" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-400">{stat.label}</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ROI Calculator Section (High Converting Feature) */}
        <div className="mb-24 rounded-3xl border border-white/10 bg-slate-900/30 p-6 sm:p-10 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />
          
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Percent className="h-5 w-5 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">ROI & Reach Estimator</h2>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Move the slider to match your growth target. See the estimated visibility and lead potential you can unlock across our channels.
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Campaign Budget</span>
                  <span className="text-2xl font-black text-blue-400">${calcBudget}</span>
                </div>
                <input 
                  type="range" 
                  min="45" 
                  max="1000" 
                  step="15"
                  value={calcBudget}
                  onChange={(e) => setCalcBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Min: $45</span>
                  <span>Max: $1,000</span>
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

        {/* AdSense Compliance Banner */}
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-5 mb-16 flex items-start gap-3.5 max-w-4xl mx-auto">
          <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-300">Google AdSense Policy Compliance:</span> All sponsored links, paid reviews, and placement campaigns strictly adhere to Google Search guidelines. We require sponsored outbound links to use the proper <code>rel="sponsored"</code> or <code>rel="nofollow"</code> attributes to safeguard search authenticity and guarantee the security of our community.
          </div>
        </div>

        {/* Sponsorship Pricing Cards */}
        <div className="mb-24">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-white mb-12">Sponsorship Channels</h2>
          
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {OPPORTUNITIES.map((opp, idx) => (
              <motion.div
                key={opp.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden ${
                  opp.popular 
                    ? 'bg-slate-900 border-2 border-blue-500/50 shadow-[0_12px_40px_rgba(59,130,246,0.15)]' 
                    : 'bg-slate-900/60 border border-white/10'
                }`}
              >
                {opp.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{opp.title}</h3>
                  <div className="flex items-baseline gap-1.5 mb-2 border-b border-white/10 pb-4">
                    <span className="text-3xl font-black text-white">{opp.price}</span>
                    <span className="text-sm text-gray-400">{opp.frequency}</span>
                  </div>
                  
                  {/* Availability Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-semibold mb-5">
                    <AlertCircle className="h-3 w-3" /> {opp.availability}
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    {opp.description}
                  </p>
                  
                  <ul className="space-y-3 mb-8">
                    {opp.bullets.map(bullet => (
                      <li key={bullet} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <Check className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <a
                  href="#inquiry-form"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, package: opp.packageKey }));
                  }}
                  className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition flex items-center justify-center gap-1.5 ${
                    opp.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                  }`}
                >
                  {opp.cta} <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQs Accordion Section */}
        <div className="mb-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-400 mt-2">Everything you need to know about sponsoring DataEngineer Hub.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-white/10 rounded-2xl bg-slate-900/40 overflow-hidden backdrop-blur-sm"
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

        {/* Contact/Inquiry Section */}
        <div id="inquiry-form" className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
          
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Start a Campaign</h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                  Ready to reach our specialized data engineering audience? Submit an inquiry to lock in your spots or request our full Media Kit.
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
                    Thank you. We've received your request and our team will get back to you with custom placement specs and details.
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
                        <option value="newsletter">Newsletter Sponsorship</option>
                        <option value="banner">Contextual Tool Banner</option>
                        <option value="content">Sponsored Content / Review</option>
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
                        <option value="<$500">Less than $500</option>
                        <option value="$500 - $1,000">$500 - $1,000</option>
                        <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                        <option value="$2,500+">$2,500+</option>
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
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
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
