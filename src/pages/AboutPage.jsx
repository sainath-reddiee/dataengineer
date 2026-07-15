// src/pages/AboutPage.jsx — Rich premium about page
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Users, Target, Code, Database, Cloud, Briefcase, Award, BookOpen,
  Sparkles, Zap, ArrowRight, Linkedin, Github, Mail, Globe,
  Cpu, Layers, Settings, ShieldCheck, BarChart3, Workflow, Gauge, Lightbulb,
  MapPin, Calendar, Star, TrendingUp, CheckCircle2, ExternalLink, Rocket,
  PenLine, Heart,
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { getPersonSchema, getBreadcrumbSchema, getFAQSchema, SITE_CONFIG } from '@/lib/seoConfig';
import { Button } from '@/components/ui/button';

// ── Static data ───────────────────────────────────────────────
const STATS = [
  { icon: Briefcase,   value: '4+',       label: 'Years Experience',    color: 'from-blue-500 to-purple-600' },
  { icon: Database,    value: '15+',      label: 'Tools Mastered',      color: 'from-green-500 to-teal-500' },
  { icon: Cloud,       value: '3',        label: 'Cloud Platforms',     color: 'from-orange-500 to-red-500' },
  { icon: PenLine,     value: '20+',      label: 'Articles Published',  color: 'from-pink-500 to-rose-500' },
];

const TIMELINE = [
  {
    year: '2024 – Present',
    role: 'Data Engineer',
    company: 'Anblicks',
    location: 'Hyderabad, India',
    color: 'from-blue-500 to-purple-600',
    highlights: [
      'Building cloud-native data pipelines on Snowflake & AWS',
      'Salesforce Data Cloud integrations at enterprise scale',
      'Architecting real-time streaming solutions with Kafka',
    ],
  },
  {
    year: '2022 – 2024',
    role: 'Data Engineer',
    company: 'Previous Role',
    location: 'Hyderabad, India',
    color: 'from-teal-500 to-cyan-500',
    highlights: [
      'ETL/ELT pipeline development with Apache Airflow & dbt',
      'Azure Synapse Analytics data warehouse implementation',
      'Python-based data quality frameworks',
    ],
  },
  {
    year: '2020 – 2022',
    role: 'Junior Data Engineer',
    company: 'Early Career',
    location: 'India',
    color: 'from-purple-500 to-pink-500',
    highlights: [
      'SQL analytics and reporting for business intelligence',
      'Learned core data warehousing and ETL patterns',
      'Built foundational expertise in Python & SQL',
    ],
  },
];

const TECH_GROUPS = [
  { icon: Cloud,    title: 'Cloud Platforms', tone: 'blue',   items: ['AWS', 'Azure', 'GCP'] },
  { icon: Layers,   title: 'Data Warehouses', tone: 'purple', items: ['Snowflake', 'Databricks', 'BigQuery', 'Redshift'] },
  { icon: Settings, title: 'ETL / ELT',       tone: 'teal',  items: ['Apache Airflow', 'dbt', 'Glue', 'ADF'] },
  { icon: Cpu,      title: 'Languages & Tools', tone: 'cyan', items: ['Python', 'SQL', 'Spark', 'Kafka'] },
  { icon: Database, title: 'Specializations',  tone: 'rose',  items: ['Salesforce Data Cloud', 'Delta Lake', 'Unity Catalog'] },
  { icon: ShieldCheck, title: 'Practices',     tone: 'green', items: ['Data Governance', 'CI/CD', 'DataOps'] },
];

const TONE_CLASSES = {
  blue:   { accent: 'text-blue-400',   chip: 'bg-blue-500/20 text-blue-300   border border-blue-500/20' },
  purple: { accent: 'text-purple-400', chip: 'bg-purple-500/20 text-purple-300 border border-purple-500/20' },
  teal:   { accent: 'text-teal-400',   chip: 'bg-teal-500/20 text-teal-300   border border-teal-500/20' },
  cyan:   { accent: 'text-cyan-400',   chip: 'bg-cyan-500/20 text-cyan-300   border border-cyan-500/20' },
  rose:   { accent: 'text-rose-400',   chip: 'bg-rose-500/20 text-rose-300   border border-rose-500/20' },
  green:  { accent: 'text-green-400',  chip: 'bg-green-500/20 text-green-300 border border-green-500/20' },
};

const SKILLS = [
  { icon: Layers,      title: 'Data Architecture',  desc: 'Scalable end-to-end systems from ingestion to BI' },
  { icon: Workflow,    title: 'Pipeline Dev',        desc: 'ETL/ELT with Airflow, dbt, Glue & ADF' },
  { icon: Gauge,       title: 'Performance Tuning',  desc: 'Query & warehouse optimization at scale' },
  { icon: Cloud,       title: 'Multi-Cloud',         desc: 'AWS · Azure · GCP native architectures' },
  { icon: BarChart3,   title: 'Data Modeling',       desc: 'Star schema, OBT, lakehouse patterns' },
  { icon: ShieldCheck, title: 'Governance & Quality', desc: 'DQ frameworks, lineage & compliance' },
];

const WHAT_I_WRITE = [
  { icon: '❄️', label: 'Snowflake deep-dives' },
  { icon: '☁️', label: 'AWS & Azure tutorials' },
  { icon: '🐍', label: 'Python for data pipelines' },
  { icon: '🔁', label: 'Airflow & dbt workflows' },
  { icon: '⚡', label: 'Real-time & streaming' },
  { icon: '📊', label: 'Data modeling patterns' },
];

const SOCIAL_LINKS = [
  { icon: Linkedin, label: 'LinkedIn', href: SITE_CONFIG.social.linkedin,        color: 'hover:border-blue-500/60 hover:text-blue-300' },
  { icon: Github,   label: 'GitHub',   href: SITE_CONFIG.social.github,          color: 'hover:border-gray-500/60 hover:text-gray-200' },
  { icon: Globe,    label: 'Website',  href: 'https://dataengineerhub.blog',     color: 'hover:border-teal-500/60 hover:text-teal-300' },
  { icon: Mail,     label: 'Email',    href: 'mailto:sainath@dataengineerhub.blog', color: 'hover:border-pink-500/60 hover:text-pink-300' },
];

const FAQS = [
  {
    question: 'Who is Sainath Reddy?',
    answer: 'Sainath Reddy is a Data Engineer at Anblicks with 4+ years of experience specializing in cloud-native data architectures, ETL/ELT pipelines, and modern data stack technologies.',
  },
  {
    question: 'What technologies does Sainath specialize in?',
    answer: 'Snowflake, Databricks, AWS, Azure, GCP, Apache Airflow, dbt, Python, SQL, Kafka, Spark, and Salesforce Data Cloud.',
  },
  {
    question: 'What is DataEngineer Hub?',
    answer: 'A platform for sharing practical tutorials, insights, and best practices in modern data engineering — built to help professionals master cutting-edge technologies.',
  },
];

const BREADCRUMBS = [
  { name: 'Home', url: `${SITE_CONFIG.url}/` },
  { name: 'About', url: `${SITE_CONFIG.url}/about` },
];

// ── Motion helpers ────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: 'easeOut' },
});

const AboutPage = () => {
  const reduced = useReducedMotion();
  const mv = (delay) => (reduced ? {} : fadeUp(delay));

  return (
    <>
      <MetaTags
        title="About Sainath Reddy — Data Engineer & DataEngineer Hub Founder"
        description="Meet Sainath Reddy, a Data Engineer at Anblicks with 4+ years of experience in Snowflake, AWS, Azure, Databricks, Salesforce Data Cloud, and modern data engineering."
        keywords="sainath reddy, data engineer, anblicks, snowflake expert, databricks expert, aws data engineer, azure data engineer, salesforce data cloud, dataengineer hub"
        type="website"
      />

      <script type="application/ld+json">{JSON.stringify(getPersonSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(getBreadcrumbSchema(BREADCRUMBS))}</script>
      <script type="application/ld+json">{JSON.stringify(getFAQSchema(FAQS))}</script>

      <main id="main" className="pt-6 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-12">

          {/* ── HERO ─────────────────────────────────────── */}
          <motion.section aria-labelledby="about-hero-title" {...mv(0)}>
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90 p-8 md:p-12 text-center shadow-2xl shadow-blue-900/10">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5 rounded-3xl" />
              <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/6 rounded-full blur-3xl" />

              <div className="relative">
                {/* Avatar */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-md opacity-60 scale-110" />
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center border-4 border-slate-900 shadow-2xl">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tight select-none">SR</span>
                    </div>
                    {/* Online badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Name & title */}
                <h1 id="about-hero-title" className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 leading-tight">
                  Hi, I'm{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Sainath Reddy
                  </span>
                </h1>

                <p className="text-lg text-blue-400 font-bold mb-1">Data Engineer at Anblicks</p>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-sm text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-400" /> Hyderabad, India
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" /> 4+ Years Experience
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400" /> Open to Collaborations
                  </span>
                </div>

                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6">
                  I build scalable, cloud-native data pipelines and warehouses — and share everything I learn
                  on <strong className="text-white">DataEngineer Hub</strong>, so others can grow faster in data engineering.
                </p>

                {/* Social links */}
                <nav aria-label="Social profiles" className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  {SOCIAL_LINKS.map(({ icon: Icon, label, href, color }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      aria-label={label}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-700/60 bg-slate-800/60 text-gray-300 text-sm font-medium transition-all ${color} focus:outline-none focus:ring-2 focus:ring-blue-400/60`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </a>
                  ))}
                </nav>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg px-6">
                    <Link to="/articles"><BookOpen className="mr-2 h-4 w-4" />Read My Articles</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-2 border-blue-400/40 text-blue-300 hover:bg-blue-500/15 font-semibold px-6">
                    <a href="mailto:sainath@dataengineerhub.blog"><Mail className="mr-2 h-4 w-4" />Get in Touch</a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── STATS ─────────────────────────────────────── */}
          <motion.section aria-label="Quick facts" {...mv(0.05)}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-700/60 hover:from-slate-800 hover:to-slate-700 border border-slate-700/40 hover:border-slate-600/60 rounded-2xl p-4 sm:p-5 text-center transition-all group"
                >
                  <div className={`inline-flex p-2.5 bg-gradient-to-br ${stat.color} rounded-xl mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── ABOUT ME ──────────────────────────────────── */}
          <motion.section aria-labelledby="about-me-title" {...mv(0.1)}>
            <div className="grid md:grid-cols-2 gap-4">
              <article className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <h2 id="about-me-title" className="text-base font-bold text-white">My Mission</h2>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  To make complex data engineering concepts <strong className="text-blue-300">accessible and practical</strong>.
                  I share real-world patterns I use daily — not theory, but battle-tested approaches that work in production.
                </p>
              </article>

              <article className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-2xl p-6 hover:border-green-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-white">Why I Blog</h2>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  When I was learning data engineering, quality tutorials were scarce.
                  <strong className="text-green-300"> DataEngineer Hub</strong> is the resource I wish I had —
                  practical, focused, and always up to date with the modern data stack.
                </p>
              </article>
            </div>
          </motion.section>

          {/* ── EXPERIENCE TIMELINE ───────────────────────── */}
          <motion.section aria-labelledby="about-experience-title" {...mv(0.15)}>
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Briefcase className="h-5 w-5 text-blue-400" aria-hidden="true" />
              <h2 id="about-experience-title" className="text-2xl sm:text-3xl font-black text-white">Experience</h2>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/30 to-transparent" />

              <div className="space-y-6">
                {TIMELINE.map((item, i) => (
                  <motion.div key={i} {...mv(0.15 + i * 0.05)} className="relative flex gap-5 md:gap-7">
                    {/* Dot */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg border border-white/10 z-10`}>
                        <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-base font-bold text-white">{item.role}</h3>
                          <p className="text-sm text-blue-400 font-semibold">{item.company}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-slate-700/60 px-2.5 py-1 rounded-full">
                            <Calendar className="h-3 w-3" /> {item.year}
                          </span>
                          <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                            <MapPin className="h-3 w-3" /> {item.location}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {item.highlights.map((h, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ── TECH STACK ────────────────────────────────── */}
          <motion.section aria-labelledby="about-stack-title" {...mv(0.2)}>
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Code className="h-5 w-5 text-purple-400" aria-hidden="true" />
              <h2 id="about-stack-title" className="text-2xl sm:text-3xl font-black text-white">Tech Stack</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TECH_GROUPS.map(({ icon: Icon, title, tone, items }) => {
                const t = TONE_CLASSES[tone];
                return (
                  <article key={title} className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`h-4 w-4 ${t.accent}`} aria-hidden="true" />
                      <h3 className={`font-bold text-sm ${t.accent}`}>{title}</h3>
                    </div>
                    <ul className="flex flex-wrap gap-1.5" aria-label={`${title} list`}>
                      {items.map((tech) => (
                        <li key={tech} className={`px-2.5 py-1 ${t.chip} rounded-lg text-xs font-medium`}>{tech}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </motion.section>

          {/* ── CORE SKILLS ───────────────────────────────── */}
          <motion.section aria-labelledby="about-skills-title" {...mv(0.25)}>
            <div className="flex items-center gap-2 mb-6 justify-center">
              <Award className="h-5 w-5 text-green-400" aria-hidden="true" />
              <h2 id="about-skills-title" className="text-2xl sm:text-3xl font-black text-white">Core Skills</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SKILLS.map(({ icon: Icon, title, desc }) => (
                <article
                  key={title}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-2xl p-4 hover:border-blue-500/40 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-sm text-white leading-tight mb-1">{title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </article>
              ))}
            </div>
          </motion.section>

          {/* ── WHAT I WRITE ABOUT ────────────────────────── */}
          <motion.section aria-labelledby="about-blog-title" {...mv(0.3)}>
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-700/60 p-6 md:p-8">
              <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-blue-500/6 rounded-full blur-3xl" />

              <div className="relative flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <h2 id="about-blog-title" className="text-xl font-bold text-white">What I Write About</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                    Every article on DataEngineer Hub is a practical guide based on real projects. No filler — just hands-on tutorials you can apply immediately.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WHAT_I_WRITE.map(({ icon, label }) => (
                      <div key={label} className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2 border border-slate-600/30">
                        <span className="text-base">{icon}</span>
                        <span className="text-xs font-medium text-gray-300">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg">
                    <Link to="/articles"><TrendingUp className="mr-2 h-4 w-4" />Browse Articles</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-2 border-blue-400/40 text-blue-300 hover:bg-blue-500/15 font-semibold">
                    <Link to="/contact"><Rocket className="mr-2 h-4 w-4" />Collaborate</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── PHILOSOPHY QUOTE ──────────────────────────── */}
          <motion.section aria-label="Philosophy" {...mv(0.35)}>
            <div className="text-center relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 md:p-12">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl" />
              <Lightbulb className="h-8 w-8 text-yellow-300 mx-auto mb-4" />
              <blockquote className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed max-w-3xl mx-auto mb-4">
                "Data engineering isn't just moving data —{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  it's transforming information into insights that drive real business value.
                </span>"
              </blockquote>
              <footer className="text-blue-400 font-semibold">— Sainath Reddy</footer>
            </div>
          </motion.section>

          {/* ── CTA ───────────────────────────────────────── */}
          <motion.section aria-labelledby="about-cta-title" {...mv(0.4)} className="text-center">
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 via-slate-800/60 to-purple-900/20 p-8 md:p-12">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl" />
              <div className="relative">
                <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h2 id="about-cta-title" className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Let's Build Something Together
                </h2>
                <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                  Have a data engineering challenge, a collaboration idea, or just want to say hello? I'm always happy to connect.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg px-8">
                    <a href="mailto:sainath@dataengineerhub.blog">
                      <Mail className="mr-2 h-4 w-4" /> Say Hello
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="border-2 border-blue-400/40 text-blue-300 hover:bg-blue-500/15 font-semibold px-8">
                    <a href={SITE_CONFIG.social.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="mr-2 h-4 w-4" /> Connect on LinkedIn
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.section>

        </div>
      </main>
    </>
  );
};

export default AboutPage;
