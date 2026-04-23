import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PenLine, Send, CheckCircle, BookOpen, Share2, Users, FileText, Code, Globe,
  Star, Award, TrendingUp, ArrowRight, Sparkles, Heart, MessageSquare, Zap,
  Target, Lightbulb, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/utils/analytics';
import MetaTags from '@/components/SEO/MetaTags';

const ContributePage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    outline: '',
    portfolio: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.topic || !formData.outline) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const subject = encodeURIComponent(`Guest Post Proposal: ${formData.topic}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nProposed Topic:\n${formData.topic}\n\nOutline:\n${formData.outline}${formData.portfolio ? `\n\nPortfolio / Blog:\n${formData.portfolio}` : ''}`
    );
    window.location.href = `mailto:sainath@dataengineerhub.blog?subject=${subject}&body=${body}`;

    trackEvent({
      action: 'submit_guest_post',
      category: 'engagement',
      label: formData.topic,
    });

    setFormData({ name: '', email: '', topic: '', outline: '', portfolio: '' });
  };

  const stats = [
    { value: '50+', label: 'Published Articles', icon: FileText },
    { value: '10K+', label: 'Monthly Readers', icon: Users },
    { value: '100+', label: 'Community Members', icon: Heart },
    { value: '15+', label: 'Tech Topics', icon: Code },
  ];

  const benefits = [
    {
      icon: Globe,
      title: 'Author Bio & Do-Follow Backlink',
      desc: 'Get a dedicated author section with your photo, bio, social links, and a valuable do-follow backlink to your site.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Share2,
      title: 'Multi-Channel Promotion',
      desc: 'Your article gets shared across LinkedIn, Twitter, newsletter, and our social channels reaching thousands of data professionals.',
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
      title: 'SEO & Visibility Boost',
      desc: 'Benefit from our domain authority and SEO optimization. Your content reaches audiences searching for data engineering topics.',
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
      desc: 'Write the full article with our editorial guidelines. We collaborate on revisions for quality and SEO.',
      icon: PenLine,
      color: 'from-green-500 to-emerald-500',
    },
    {
      step: '04',
      title: 'Publish & Promote',
      desc: 'Your article goes live with your author bio, backlinks, and gets promoted across all our channels.',
      icon: Rocket,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const guidelines = [
    { icon: FileText, title: 'Length', text: '1,000+ words of original, unpublished content' },
    { icon: Code, title: 'Code & Visuals', text: 'Include code samples, diagrams, screenshots, or architecture visuals' },
    { icon: BookOpen, title: 'Focus', text: 'Practical tutorials, how-tos, architecture deep-dives, or best practices' },
    { icon: Zap, title: 'Quality', text: 'Well-structured with clear headings, concise paragraphs, and actionable takeaways' },
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
        title="Write for Us - Contribute a Guest Post | DataEngineer Hub"
        description="Share your data engineering expertise with our community of 10K+ monthly readers. Submit a guest post on Snowflake, dbt, Airflow, cloud platforms, and more. Get published with an author bio, backlinks, and multi-channel promotion."
        keywords="write for us, guest post, contribute, data engineering blog, submit article, technical writing, guest author"
        type="website"
      />
      <div className="pt-4 pb-16 overflow-hidden">
        <div className="container mx-auto px-6">
          {/* ═══════════════════ HERO ═══════════════════ */}
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
              share real-world insights, and help thousands of professionals level up.
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
          </motion.div>

          {/* ═══════════════════ STATS BAR ═══════════════════ */}
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

          {/* ═══════════════════ WHY CONTRIBUTE ═══════════════════ */}
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

          {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
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

          {/* ═══════════════════ GUIDELINES + FORM (2-col) ═══════════════════ */}
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

              <h3 className="text-lg font-semibold text-white mb-3">Topics We Love</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/40 rounded-full text-xs font-medium text-gray-300 hover:border-blue-500/40 hover:text-blue-300 transition-colors cursor-default"
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
                  <li>Collaborative editing for quality, clarity, and SEO optimization</li>
                  <li>Article published with your author bio, photo, and backlinks</li>
                  <li>Multi-channel promotion across our social networks and newsletter</li>
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
                  <Input id="topic" placeholder="e.g. Building Real-Time Pipelines with Kafka and Snowflake" value={formData.topic} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outline">Brief Outline *</Label>
                  <Textarea
                    id="outline"
                    placeholder="Key points, target audience, code samples or diagrams you plan to include..."
                    rows={5}
                    value={formData.outline}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio / Blog URL (optional)</Label>
                  <Input id="portfolio" type="url" placeholder="https://yourblog.com" value={formData.portfolio} onChange={handleChange} />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold group"
                >
                  Submit Proposal
                  <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Your email client will open with the proposal pre-filled. No data is stored on our servers.
                </p>
              </form>
            </motion.div>
          </div>

          {/* ═══════════════════ CTA BANNER ═══════════════════ */}
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
