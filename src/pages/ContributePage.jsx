import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PenLine, Send, CheckCircle, BookOpen, Share2, Users, FileText, Code, Globe,
  Star, Award, TrendingUp, ArrowRight, Sparkles, Heart, MessageSquare, Zap,
  Target, Lightbulb, Rocket, Coffee, Building2
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
    authorType: 'individual',
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
    if (formData.authorType === 'vendor') return;

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
      `Submission Type: Individual Practitioner`,
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
      setFormData({ authorType: 'individual', name: '', email: '', topic: '', incident: '', outline: '', repo: '', portfolio: '', briefId: '' });
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
      title: 'Personal Author Bio & Profile',
      desc: 'Get a dedicated author bio with your photo, credentials, social links, and practitioner profile. (Commercial tool features belong on Paid Placements).',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Share2,
      title: 'Multi-Channel Promotion',
      desc: 'Your article gets shared across LinkedIn, Twitter, and our social channels to practicing data engineers.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Community Recognition',
      desc: 'Join a growing network of contributors and build your reputation as a thought leader in data engineering.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Visibility & Career Reach',
      desc: 'Reach thousands of working data engineers searching for Snowflake, dbt, Airflow, and lakehouse solutions.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Award,
      title: 'Portfolio Building',
      desc: 'Add published work to your professional portfolio. Great for career growth, speaking opportunities, and job applications.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: MessageSquare,
      title: 'Editorial Support',
      desc: 'Our team helps refine your article with feedback on structure, clarity, and SEO — making your best work even better.',
      color: 'from-indigo-500 to-blue-500',
    },
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Submit Your Idea',
      desc: 'Fill out the proposal form with your topic, outline, and background. Takes about 5 minutes.',
      icon: Lightbulb,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: '02',
      title: 'Review & Feedback',
      desc: 'We review your proposal within 3-5 business days and provide feedback or approval.',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: '03',
      title: 'Write & Collaborate',
      desc: 'Write the full article with our editorial guidelines. We collaborate on revisions for quality and clarity.',
      icon: PenLine,
      color: 'from-green-500 to-emerald-500',
    },
    {
      step: '04',
      title: 'Publish & Promote',
      desc: 'Your article goes live with your author bio, profile links, and gets promoted across our channels.',
      icon: Rocket,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const guidelines = [
    { icon: FileText, title: 'Length', text: '1,600+ words of original, unpublished content. No vendor rewrites.' },
    { icon: Code, title: 'Code & Visuals', text: 'Working samples, Query Profile / logs, or architecture you actually ran' },
    { icon: BookOpen, title: 'Focus', text: 'A production incident, a number, or a decision you would make again' },
    { icon: Zap, title: 'Quality', text: 'Clear headings, a FAQ with real questions, and an honest "when not to do this"' },
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
        title="Write for Us - Contribute a Guest Post"
        description="Share your data engineering expertise with practicing engineers. Submit a guest post on Snowflake, dbt, Airflow, cloud platforms, and more. Get published with an author bio and multi-channel promotion."
        keywords="write for us, guest post, contribute, data engineering blog, submit article, technical writing, guest author"
        type="website"
      />
      <div className="pt-4 pb-16 overflow-hidden">
        <div className="container mx-auto px-6">
          {/* HERO */}
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
              Share Your <span className="gradient-text">Expertise</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8">
              Join our community of data engineering authors. Write practical tutorials,
              share real-world insights, and help fellow practitioners level up.
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
            <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-indigo-900/40 p-5 text-left shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Representing a company or product?</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Guest posts are strictly non-commercial practitioner tutorials. Commercial product features, launch blurbs, and vendor listings belong on <strong>Paid Placements</strong>.
                    </p>
                  </div>
                </div>
                <Link
                  to="/advertise"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-md shadow-blue-500/20"
                >
                  Paid Placements <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
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

          {/* STATS BAR */}
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

          {/* WHY CONTRIBUTE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-16 max-w-6xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Why Write for <span className="gradient-text">DataEngineer Hub</span>?
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                More than just a guest post — it's an investment in your professional brand.
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

          {/* HOW IT WORKS */}
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

          {/* OPEN BRIEFS — CENTERED FULL-WIDTH SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mb-16 max-w-6xl mx-auto scroll-mt-24"
            id="open-briefs-section"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300 mb-3">
                <Sparkles className="h-3.5 w-3.5" /> High-Demand Topics
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Open Editorial <span className="gradient-text">Briefs</span>
              </h2>
              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                Pick an open brief below to auto-fill your proposal form, or write your own incident pitch.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EDITORIAL_BRIEFS.map((brief) => {
                const selected = formData.briefId === brief.id;
                return (
                  <button
                    key={brief.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        briefId: brief.id,
                        topic: brief.title,
                      }));
                      document.getElementById('submit-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex flex-col justify-between text-left rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                      selected
                        ? 'border-blue-400 bg-blue-500/15 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400'
                        : 'border-slate-700/60 bg-slate-900/50 hover:border-blue-400/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                          {brief.stack}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{brief.length}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2 leading-snug">{brief.title}</h3>
                      <p className="text-xs text-gray-300 leading-relaxed mb-4">{brief.ask}</p>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-blue-400">
                      <span>{selected ? '✓ Selected' : 'Pitch this brief'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* GUIDELINES + FORM (2-col) */}
          <div id="submit-form" className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto scroll-mt-24">
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

              <h3 className="text-lg font-semibold text-white mb-3">Topics We Cover</h3>
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
                  <li>We review your proposal within <strong className="text-white">3-5 business days</strong></li>
                  <li>If approved, you write the full article with our guidelines</li>
                  <li>Collaborative editing for quality, clarity, and depth</li>
                  <li>Article published with your personal author bio & profile</li>
                  <li>Multi-channel promotion across our social networks</li>
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

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="authorType">Submission Type *</Label>
                  <select
                    id="authorType"
                    value={formData.authorType || 'individual'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, authorType: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="individual">Individual Practitioner (Personal Tutorial)</option>
                    <option value="vendor">Company / Vendor / Product Pitch</option>
                  </select>
                </div>

                {formData.authorType === 'vendor' ? (
                  <div className="rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 p-6 text-slate-100 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Vendor & Product Sponsorships</h3>
                        <p className="text-xs text-blue-300 font-medium">Billed in USD · Fit confirmed in 48h</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-5">
                      Guest posts on Write for Us are strictly non-commercial practitioner tutorials. Product announcements, directory cards, and sponsored placements are processed directly on our <strong>Paid Placements</strong> portal.
                    </p>
                    <div className="space-y-2.5 bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
                      <p className="text-xs font-semibold text-white uppercase tracking-wider">Placement Options:</p>
                      <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> Sponsored card in matching guides</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> Permanent listing in Tools Hub</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" /> Co-authored Integration Guide</li>
                      </ul>
                    </div>
                    <Link
                      to="/advertise#inquiry-form"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-300"
                    >
                      Book a Paid Placement <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
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
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold group cursor-pointer"
                    >
                      {submitting ? 'Sending…' : 'Submit Proposal'}
                      <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Editorial only. Product pitches belong on{' '}
                      <Link to="/advertise" className="text-blue-400 hover:underline">Advertise</Link>.
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>

          {/* CTA BANNER */}
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
              Whether you're a seasoned data engineer or just getting started, your unique
              perspective can help others learn and grow. Every contribution matters.
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
