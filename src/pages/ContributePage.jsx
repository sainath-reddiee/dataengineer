import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Send, CheckCircle, BookOpen, Share2, Users, FileText, Code, Globe } from 'lucide-react';
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

  const benefits = [
    {
      icon: Globe,
      title: 'Author Bio & Backlink',
      desc: 'Get a dedicated author section with your bio, photo, and a do-follow link back to your site or profile.',
      color: 'from-blue-500 to-purple-600',
    },
    {
      icon: Share2,
      title: 'Social Promotion',
      desc: 'Your article will be shared across our social channels reaching thousands of data engineering professionals.',
      color: 'from-green-500 to-teal-500',
    },
    {
      icon: Users,
      title: 'Community Recognition',
      desc: 'Join a growing community of contributors and establish yourself as a thought leader in data engineering.',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const guidelines = [
    { icon: FileText, text: '1,000+ words of original, unpublished content' },
    { icon: Code, text: 'Code samples, diagrams, or screenshots encouraged' },
    { icon: BookOpen, text: 'Practical tutorials, how-tos, or architecture deep-dives preferred' },
  ];

  const topics = [
    'Snowflake', 'dbt', 'Apache Airflow', 'Apache Spark', 'AWS / Azure / GCP',
    'Data Modeling', 'ETL/ELT Pipelines', 'Data Quality', 'Data Governance',
    'Streaming (Kafka, Flink)', 'Python for Data Engineering', 'SQL Optimization',
  ];

  return (
    <>
      <MetaTags
        title="Write for Us - Contribute a Guest Post | DataEngineer Hub"
        description="Share your data engineering expertise with our community. Submit a guest post on Snowflake, dbt, Airflow, cloud platforms, and more. Get published with an author bio and backlink."
        keywords="write for us, guest post, contribute, data engineering blog, submit article, technical writing"
        type="website"
      />
      <div className="pt-4 pb-12 overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-1.5 rounded-full mb-4 border border-blue-500/30">
              <PenLine className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Guest Contributions</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Write For <span className="gradient-text">Us</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Share your data engineering knowledge with thousands of professionals.
              We publish practical tutorials, architecture guides, and tool deep-dives.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid md:grid-cols-3 gap-4 mb-12"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-xl p-5 hover:border-blue-500/40 transition-colors"
              >
                <div className={`inline-flex p-2.5 bg-gradient-to-br ${b.color} rounded-lg mb-3`}>
                  <b.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Guidelines + Form */}
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left — Guidelines */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="text-2xl font-bold mb-5 text-white">Submission Guidelines</div>

              <div className="space-y-4 mb-8">
                {guidelines.map((g) => (
                  <div key={g.text} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg mt-0.5">
                      <g.icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{g.text}</p>
                  </div>
                ))}
              </div>

              <div className="text-lg font-semibold text-white mb-3">Topics We Cover</div>
              <div className="flex flex-wrap gap-2 mb-8">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-slate-800/60 border border-slate-700/40 rounded-full text-xs font-medium text-gray-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-white">What happens next?</span>
                </div>
                <ol className="text-sm text-gray-300 space-y-1.5 list-decimal list-inside">
                  <li>We review your proposal within 3-5 business days</li>
                  <li>If approved, you write the full article</li>
                  <li>We edit collaboratively for quality and SEO</li>
                  <li>Article goes live with your author bio and backlinks</li>
                </ol>
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="blog-card p-8 rounded-2xl"
            >
              <div className="text-2xl font-bold mb-6 text-white">Submit Your Proposal</div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Jane Doe" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" required placeholder="jane@example.com" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Proposed Topic / Title *</Label>
                  <Input id="topic" placeholder="e.g. Building Real-Time Pipelines with Kafka and Snowflake" value={formData.topic} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outline">Brief Outline *</Label>
                  <Textarea
                    id="outline"
                    placeholder="Describe the key points you plan to cover, target audience, and any code samples or diagrams you'll include..."
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
        </div>
      </div>
    </>
  );
};

export default ContributePage;
