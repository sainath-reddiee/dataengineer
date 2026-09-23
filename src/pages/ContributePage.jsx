import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PenLine, Send, CheckCircle, BookOpen, Share2, Users, FileText, Code, Globe,
  Star, Award, ArrowRight, Sparkles, Heart, MessageSquare, Zap,
  Target, Lightbulb, Rocket, Coffee, Scale, X
} from 'lucide-react';
import SupportButton from '@/components/Support/SupportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/utils/analytics';
import MetaTags from '@/components/SEO/MetaTags';

import { useStats } from '@/hooks/useStats';
import { EDITORIAL_BRIEFS } from '@/data/editorialBriefs';
import { addGuestProposal } from '@/utils/guestProposals';

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

const ContributePage = () => {
  const { toast } = useToast();
  const { totalArticles, totalCategories } = useStats();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    incident: '',
    outline: '',
    repo: '',
    portfolio: '',
    briefId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.topic || !formData.incident || !formData.outline) {
      toast({
        title: 'Incomplete Form',
        description: 'Name, email, topic, the production incident, and an outline are required.',
        variant: 'destructive',
      });
      return;
    }

    addGuestProposal(formData);
    trackEvent({
      action: 'submit_guest_post',
      category: 'engagement',
      label: formData.topic,
    });

    const message = [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Brief: ${formData.briefId || 'original idea'}`,
      `Topic: ${formData.topic}`,
      `Production incident:\n${formData.incident}`,
      `Outline:\n${formData.outline}`,
      formData.repo ? `Repo: ${formData.repo}` : '',
      formData.portfolio ? `Portfolio: ${formData.portfolio}` : '',
    ].filter(Boolean).join('\n\n');

    setSubmitting(true);
    try {
      if (WEB3FORMS_KEY) {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            name: formData.name,
            email: formData.email,
            subject: `Guest post proposal: ${formData.topic}`,
            message,
            from_name: 'DataEngineer Hub Contribute',
          }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Submit failed');
      } else {
        window.location.href = `mailto:sainath@dataengineerhub.blog?subject=${encodeURIComponent(`Guest Post Proposal: ${formData.topic}`)}&body=${encodeURIComponent(message)}`;
      }
      setSubmitted(true);
      setFormData({ name: '', email: '', topic: '', incident: '', outline: '', repo: '', portfolio: '', briefId: '' });
      toast({ title: 'Proposal sent', description: 'We review pitches in 3–5 business days.' });
    } catch (err) {
      toast({
        title: 'Could not send',
        description: err.message || 'Try emailing sainath@dataengineerhub.blog',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { value: totalArticles > 0 ? `${totalArticles}` : '…', label: 'Published Articles', icon: FileText },
    { value: 'Weekly', label: 'New Tutorials', icon: Users },
    { value: 'Practitioner', label: 'Audience', icon: Heart },
    { value: totalCategories > 0 ? `${totalCategories}+` : '15+', label: 'Tech Topics', icon: Code },
  ];

  const benefits = [
    {
      icon: Globe,
      title: 'Your name on the piece',
      desc: 'Photo, bio, and optional LinkedIn / GitHub / site links on the article and on /contributors after it ships. Not a paid SEO package.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Share2,
      title: 'Shown to practitioners',
      desc: 'Live URL in RSS. We share strong pieces on LinkedIn and in the weekly digest when the topic fits that week.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Award,
      title: 'A cite you can keep',
      desc: 'Use the published URL on a resume, interview loop, or conference bio. We do not ghost-write and we do not hide the byline.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: MessageSquare,
      title: 'An editor who ran the stack',
      desc: 'Sainath reviews claims, code, and whether the piece says anything a first-page Google result does not already say.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Scale,
      title: 'You keep the copyright',
      desc: 'You own the words. We get a perpetual license to publish, update numbers, and keep the URL live. Ask before syndicating elsewhere in the first 30 days.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Heart,
      title: 'Unpaid, on purpose',
      desc: 'No kill fee and no invoice. If you need a labeled product placement, that is Advertise — a different page and a USD invoice.',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Send the incident',
      desc: 'Topic, what broke, warehouse/tool versions, and the H2s you will write. Five minutes if you already have the notes.',
      icon: Lightbulb,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: '02',
      title: 'Yes, no, or a rewrite',
      desc: 'Reply in 3–5 weekday IST days. A no is a short email. A yes names the length, the FAQ, and the one number we need on the page.',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: '03',
      title: 'Draft, then one edit pass',
      desc: 'You write. We check facts, code, and whether a first-page Google result already said it. Expect one round, not a rewrite committee.',
      icon: PenLine,
      color: 'from-green-500 to-emerald-500',
    },
    {
      step: '04',
      title: 'Ship with your byline',
      desc: 'Live URL, RSS, /contributors card, optional newsletter mention. We patch numbers later the same way we patch staff posts.',
      icon: Rocket,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const guidelines = [
    { icon: FileText, title: 'Length', text: '1,600+ words of original, unpublished prose. Code samples do not count toward the floor.' },
    { icon: Code, title: 'Proof', text: 'Working SQL/Python, a Query Profile, a log line, or a cost screenshot you actually captured.' },
    { icon: BookOpen, title: 'Focus', text: 'One production incident, one number, or one decision you would make again.' },
    { icon: Zap, title: 'Shape', text: 'H2s a practitioner can scan, 2–5 real FAQ questions, and an honest “when not to do this”.' },
  ];

  const weWant = [
    'A Query Profile, dbt log, or Airflow task that lied — and what you changed',
    'Warehouse size, edition, region, and the bill or runtime before vs after',
    'The command, SQL, or config you would paste into a teammate’s PR',
    'A “do not do this” that you learned the expensive way',
  ];

  const weReject = [
    'Vendor-doc rewrites, AI drafts, or “X vs Y” with no production numbers',
    'Certification dumps, scraped lists, or pages whose only job is a keyword',
    'Product pitches, sold backlink packages, or a byline you did not write',
    'Anything you already published elsewhere without saying so up front',
  ];

  const topics = [
    'Snowflake', 'dbt', 'Apache Airflow', 'Apache Spark', 'AWS', 'Azure', 'GCP',
    'Data Modeling', 'ETL/ELT Pipelines', 'Data Quality', 'Data Governance',
    'Kafka / Flink', 'Python for DE', 'SQL Optimization', 'Databricks',
    'Data Lakehouse', 'CI/CD for Data', 'Cost Optimization',
  ];

  return (
    <>
      <MetaTags
        title="Write for Us — Guest tutorials for DataEngineer Hub"
        description="Pitch a production incident, not a vendor rewrite. Guest tutorials are unpaid editorial: your byline, editorial review, and a slot on /contributors after the piece ships. Product pitches belong on Advertise."
        keywords="write for us, guest post, contribute, data engineering blog, submit article, technical writing, guest author"
        type="website"
      />
      <div className="pt-4 pb-16 overflow-hidden">
        <div className="container mx-auto px-6">
          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-5 py-2 rounded-full mb-6 border border-blue-500/30">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Community Contributions</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight">
              Write the incident you <span className="gradient-text">actually debugged</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
              Guest tutorials are unpaid editorial. We want a warehouse size, an error
              message, a dollar figure, or a decision you would make again — not a
              rewrite of the Snowflake or dbt docs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#submit-form"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Submit a Proposal
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 border-2 border-slate-600 hover:border-blue-400/50 text-gray-300 hover:text-white px-8 py-3 rounded-full font-semibold text-base transition-all duration-300"
              >
                Read Published Articles
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-6 max-w-2xl mx-auto">
              Same bar as staff posts:{' '}
              <Link to="/editorial-standards" className="text-blue-400 hover:underline">editorial standards</Link>
              {' '}· live authors on{' '}
              <Link to="/contributors" className="text-blue-400 hover:underline">/contributors</Link>
              . Want to promote a product instead? That is a paid USD placement on{' '}
              <Link to="/advertise" className="text-blue-400 hover:underline">Advertise</Link>.
            </p>
            <div className="mt-8 mx-auto max-w-xl rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-5 py-5 text-left">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-amber-500/15 p-2 border border-amber-500/25">
                  <Coffee className="h-5 w-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Not writing this month? A coffee still helps.</p>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed text-pretty">
                    Guest posts are one way to give back. If you just want to keep the playground,
                    cheat sheets, and articles free for the next engineer, a small UPI or PayPal
                    coffee is a real dent in hosting.
                  </p>
                  <div className="mt-4">
                    <SupportButton
                      variant="cta"
                      source="contribute_page"
                      label="Buy me a coffee"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• STATS BAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="text-center p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl"
              >
                <stat.icon className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="grid md:grid-cols-2 gap-4 mb-16 max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                We will publish
              </h2>
              <ul className="space-y-2 text-sm text-slate-200">
                {weWant.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-emerald-400 mt-0.5">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <X className="h-5 w-5 text-rose-400" />
                We will not publish
              </h2>
              <ul className="space-y-2 text-sm text-slate-200">
                {weReject.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-rose-400 mt-0.5">−</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="mb-16 max-w-5xl mx-auto rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-3">A pitch that gets a yes</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              “On an Enterprise Medium in us-east-1, Query Profile said 0 bytes spilled while
              the warehouse burned 47 credits. I will show the profile screenshot, the
              <code className="text-pink-300">WAREHOUSE_LOAD_HISTORY</code> query, and the XS
              change that cut the bill 61%.”
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              A pitch that gets a no: “A complete guide to Snowflake Time Travel for beginners,
              with a backlink to my agency.” If the only number in the email is a domain rating,
              use{' '}
              <Link to="/advertise" className="text-blue-400 hover:underline">Advertise</Link>.
            </p>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• WHY CONTRIBUTE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-16 max-w-6xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                What you get — and what you do not
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Same review as staff tutorials. No sold bylines. Full rulebook on{' '}
                <Link to="/editorial-standards" className="text-blue-400 hover:underline">editorial standards</Link>.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-xl p-5 hover:border-blue-500/40 transition-all duration-300"
                >
                  <div className={`inline-flex p-2.5 bg-gradient-to-br ${b.color} rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                    <b.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HOW IT WORKS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16 max-w-5xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                From idea to published article in four simple steps.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.1 }}
                  className="relative text-center"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl mb-4 shadow-lg`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-xs font-bold text-blue-400 mb-1 tracking-wider">STEP {step.step}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  {i < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 -right-3 w-6">
                      <ArrowRight className="h-5 w-5 text-slate-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• GUIDELINES + FORM (2-col) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div id="submit-form" className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* Left — Guidelines & Topics */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-white">Submission Guidelines</h2>

              <div className="space-y-4 mb-8">
                {guidelines.map((g) => (
                  <div key={g.title} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5 flex-shrink-0">
                      <g.icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{g.title}</div>
                      <p className="text-gray-400 text-sm leading-relaxed">{g.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-white mb-3">Open briefs — pitch these first</h3>
              <div className="space-y-3 mb-8">
                {EDITORIAL_BRIEFS.map((brief) => (
                  <button
                    key={brief.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      briefId: brief.id,
                      topic: brief.title,
                    }))}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      formData.briefId === brief.id
                        ? 'border-blue-400/60 bg-blue-500/10'
                        : 'border-slate-700/40 bg-slate-800/40 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{brief.title}</div>
                    <div className="text-xs text-blue-300 mt-1">{brief.stack} · {brief.length}</div>
                    <p className="text-xs text-gray-400 mt-1">{brief.ask}</p>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/40 rounded-full text-xs font-medium text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* What Happens Next */}
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-bold text-white">What happens after you submit?</span>
                </div>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Review in <strong className="text-white">3–5 weekday IST days</strong> — a no is a short email, not silence</li>
                  <li>If approved, you write the draft (usually 10–14 days)</li>
                  <li>One edit pass for facts, code, and whether the piece is already on page one</li>
                  <li>Published with your byline, bio, and optional profile links</li>
                  <li>RSS + /contributors. Newsletter only when that week’s digest matches</li>
                </ol>
              </div>
            </motion.div>

            {/* Right — Proposal Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="blog-card p-8 rounded-2xl h-fit sticky top-24"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Submit Your Proposal</h2>
                  <p className="text-xs text-gray-400">Takes about 5 minutes</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="Jane Doe" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required placeholder="jane@example.com" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Proposed Topic / Title *</Label>
                  <Input id="topic" placeholder="Pick an open brief or write your own incident title" value={formData.topic} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident">What broke in production? *</Label>
                  <Textarea
                    id="incident"
                    placeholder="Warehouse size, error message, dollar figure, or the decision you would not make again..."
                    rows={4}
                    value={formData.incident}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outline">Outline *</Label>
                  <Textarea
                    id="outline"
                    placeholder="H2s, the FAQ questions, and the code or Query Profile you will show..."
                    rows={5}
                    value={formData.outline}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo">GitHub / gist with the code (optional)</Label>
                  <Input id="repo" type="url" placeholder="https://github.com/you/repro" value={formData.repo} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio / writing sample (optional)</Label>
                  <Input id="portfolio" type="url" placeholder="https://yourblog.com" value={formData.portfolio} onChange={handleChange} />
                </div>
                {submitted && (
                  <p className="text-sm text-green-300">Proposal received. We will reply in 3–5 business days.</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold group"
                >
                  {submitting ? 'Sending…' : 'Submit Proposal'}
                  <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Editorial only. Product pitches belong on{' '}
                  <Link to="/advertise" className="text-blue-400 hover:underline">Advertise</Link>.
                </p>
              </form>
            </motion.div>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CTA BANNER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-16 max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-blue-500/20 rounded-2xl p-8 md:p-12"
          >
            <Star className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Share Your Knowledge?
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto mb-6">
              If you have the Query Profile, the dbt log, or the invoice line, you have
              enough. Pitch the incident — we will tell you if the outline is tight enough.
            </p>
            <a
              href="#submit-form"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContributePage;
