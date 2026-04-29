// src/pages/AboutPage.jsx — Structural refactor: semantic landmarks, a11y, real social links
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Users, Target, Code, Database, Cloud, Briefcase, Award, BookOpen,
  Sparkles, Zap, ArrowRight, Linkedin, Github, Mail,
  Cpu, Layers, Settings, ShieldCheck, BarChart3, Workflow, Gauge, Lightbulb,
} from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { getPersonSchema, getBreadcrumbSchema, getFAQSchema, SITE_CONFIG } from '@/lib/seoConfig';
import { Button } from '@/components/ui/button';

// ── Static data (hoisted — no re-creation per render) ────────
const STATS = [
  { icon: Briefcase, value: '4+', label: 'Years', color: 'from-blue-500 to-purple-600' },
  { icon: Database, value: '10+', label: 'Tools', color: 'from-green-500 to-teal-500' },
  { icon: Cloud, value: '3', label: 'Clouds', color: 'from-orange-500 to-red-500' },
  { icon: Zap, value: 'Real-time', label: 'Pipelines', color: 'from-pink-500 to-rose-500' },
];

const TECH_GROUPS = [
  { icon: Cloud, title: 'Cloud Platforms', tone: 'blue',   items: ['AWS', 'Azure', 'GCP'] },
  { icon: Layers, title: 'Data Warehouses', tone: 'purple', items: ['Snowflake', 'Databricks', 'BigQuery'] },
  { icon: Settings, title: 'ETL/ELT Tools', tone: 'teal',  items: ['Airflow', 'dbt', 'Python', 'SQL'] },
  { icon: Cpu, title: 'Specialized',        tone: 'cyan',  items: ['Salesforce DC', 'Kafka', 'Spark'] },
];

const TONE_CLASSES = {
  blue:   { accent: 'text-blue-400',   chip: 'bg-blue-500/20 text-blue-300' },
  purple: { accent: 'text-purple-400', chip: 'bg-purple-500/20 text-purple-300' },
  teal:   { accent: 'text-teal-400',   chip: 'bg-teal-500/20 text-teal-300' },
  cyan:   { accent: 'text-cyan-400',   chip: 'bg-cyan-500/20 text-cyan-300' },
};

const SKILLS = [
  { icon: Layers,      title: 'Data Architecture', desc: 'Scalable end-to-end systems' },
  { icon: Workflow,    title: 'Pipeline Dev',      desc: 'ETL/ELT with Airflow & dbt' },
  { icon: Gauge,       title: 'Performance',       desc: 'Query & warehouse tuning' },
  { icon: Cloud,       title: 'Cloud Solutions',   desc: 'Multi-cloud data systems' },
  { icon: BarChart3,   title: 'Data Modeling',     desc: 'Efficient analytics schemas' },
  { icon: ShieldCheck, title: 'Governance',        desc: 'Quality, security, compliance' },
];

const SOCIAL_LINKS = [
  { icon: Linkedin, label: 'LinkedIn', href: SITE_CONFIG.social.linkedin },
  { icon: Github,   label: 'GitHub',   href: SITE_CONFIG.social.github },
  { icon: Mail,     label: 'Email',    href: 'mailto:sainath@dataengineerhub.blog' },
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

// ── Motion helpers ───────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const AboutPage = () => {
  const reduced = useReducedMotion();
  const mv = (delay) => (reduced ? {} : fadeUp(delay));

  return (
    <>
      <MetaTags
        title="About Sainath Reddy - Expert Data Engineer"
        description="Meet Sainath Reddy, a passionate Data Engineer at Anblicks with 4+ years of experience in Snowflake, AWS, Azure, Databricks, Salesforce Data Cloud, and modern data engineering technologies."
        keywords="sainath reddy, data engineer, anblicks, snowflake expert, databricks expert, aws data engineer, azure data engineer, salesforce data cloud"
        type="website"
      />

      {/* Structured data — Person + Breadcrumbs + FAQPage for E-E-A-T */}
      <script type="application/ld+json">{JSON.stringify(getPersonSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(getBreadcrumbSchema(BREADCRUMBS))}</script>
      <script type="application/ld+json">{JSON.stringify(getFAQSchema(FAQS))}</script>

      <main id="main" className="pt-4 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">

          {/* ── HERO ────────────────────────────────────── */}
          <motion.section
            aria-labelledby="about-hero-title"
            {...mv(0)}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-1.5 rounded-full mb-3 border border-blue-500/30">
              <Sparkles className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium text-blue-300">Data Engineering Expert</span>
            </div>

            <h1 id="about-hero-title" className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 leading-tight">
              Hi, I'm{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sainath Reddy
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 mb-2">
              Data Engineer at <span className="text-blue-400 font-bold">Anblicks</span>
            </p>

            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto mb-4">
              Transforming raw data into business intelligence through modern engineering.
              Cloud-native architectures • Real-time pipelines • Scalable solutions.
            </p>

            {/* Social proof strip — real URLs from SITE_CONFIG */}
            <nav aria-label="Social profiles" className="flex flex-wrap items-center justify-center gap-2">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  aria-label={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 hover:bg-slate-700/60 hover:border-blue-500/50 text-gray-300 hover:text-white text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </motion.section>

          {/* ── STATS ─────────────────────────────────────── */}
          <motion.section
            aria-label="Quick facts"
            {...mv(0.1)}
            className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 hover:from-slate-800 hover:to-slate-700 border border-slate-700/40 hover:border-slate-600/60 rounded-lg p-3 sm:p-4 text-center transition-all"
              >
                <div className={`inline-flex p-2 bg-gradient-to-br ${stat.color} rounded-lg mb-2`}>
                  <stat.icon className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">{stat.value}</div>
                <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </motion.section>

          {/* ── MISSION & WHO I AM ───────────────────────── */}
          <motion.section
            aria-labelledby="about-mission-title"
            {...mv(0.15)}
            className="grid md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            <h2 id="about-mission-title" className="sr-only">Mission and background</h2>

            <article className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4 hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Target className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">My Mission</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Empowering organizations with scalable data solutions that transform challenges into actionable insights.
              </p>
            </article>

            <article className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4 hover:border-green-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Who I Am</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Passionate Data Engineer specializing in architectures, ETL/ELT workflows, and optimization across clouds.
              </p>
            </article>
          </motion.section>

          {/* ── TECH STACK ────────────────────────────────── */}
          <motion.section aria-labelledby="about-stack-title" {...mv(0.2)} className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Code className="h-5 w-5 text-purple-400" aria-hidden="true" />
              <h2 id="about-stack-title" className="text-xl sm:text-2xl font-bold text-white">Tech Stack</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {TECH_GROUPS.map(({ icon: Icon, title, tone, items }) => {
                const t = TONE_CLASSES[tone];
                return (
                  <article
                    key={title}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`h-4 w-4 ${t.accent}`} aria-hidden="true" />
                      <h3 className={`font-bold text-sm ${t.accent}`}>{title}</h3>
                    </div>
                    <ul className="flex flex-wrap gap-2" aria-label={`${title} list`}>
                      {items.map((tech) => (
                        <li
                          key={tech}
                          className={`px-2.5 py-1 ${t.chip} rounded text-xs font-medium`}
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </motion.section>

          {/* ── CORE SKILLS ───────────────────────────────── */}
          <motion.section aria-labelledby="about-skills-title" {...mv(0.25)} className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Award className="h-5 w-5 text-green-400" aria-hidden="true" />
              <h2 id="about-skills-title" className="text-xl sm:text-2xl font-bold text-white">Core Skills</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {SKILLS.map(({ icon: Icon, title, desc }) => (
                <article
                  key={title}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 hover:border-blue-500/50 transition-colors"
                >
                  <Icon className="h-6 w-6 text-blue-400 mb-1.5" aria-hidden="true" />
                  <h3 className="font-bold text-xs sm:text-sm text-white leading-tight mb-0.5">{title}</h3>
                  <p className="text-xs text-gray-400">{desc}</p>
                </article>
              ))}
            </div>
          </motion.section>

          {/* ── HUB + PHILOSOPHY (merged into a single card) ── */}
          <motion.section
            aria-labelledby="about-hub-title"
            {...mv(0.3)}
            className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-4 sm:p-5 mb-6 sm:mb-8"
          >
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 px-3 py-1.5 rounded-full mb-3 border border-pink-500/30">
                <BookOpen className="h-4 w-4 text-pink-400" aria-hidden="true" />
                <span className="text-xs font-medium text-pink-300">Knowledge Sharing</span>
              </div>
              <h2 id="about-hub-title" className="text-lg sm:text-xl font-bold mb-2 text-white">DataEngineer Hub</h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl mx-auto">
                My platform for sharing practical tutorials, insights, and best practices in modern data engineering.
                Helping professionals master cutting-edge technologies.
              </p>
            </div>

            <blockquote className="border-t border-slate-700/60 pt-4 text-center">
              <Lightbulb className="h-5 w-5 text-yellow-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-gray-300 italic leading-relaxed mb-2">
                “Data engineering isn't just moving data—it's transforming information into insights that drive value.”
              </p>
              <footer className="text-blue-400 font-semibold text-sm">— Sainath Reddy</footer>
            </blockquote>
          </motion.section>

          {/* ── CTA ───────────────────────────────────────── */}
          <motion.section aria-labelledby="about-cta-title" {...mv(0.4)} className="text-center">
            <h2 id="about-cta-title" className="text-lg sm:text-xl font-bold mb-3 text-white">Let's Connect</h2>
            <p className="text-sm text-gray-300 mb-4">
              Interested in data engineering or collaboration opportunities?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
              >
                <a href="mailto:sainath@dataengineerhub.blog">
                  Get in Touch
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 font-semibold"
              >
                <a href="/articles">Read My Articles</a>
              </Button>
            </div>
          </motion.section>
        </div>
      </main>
    </>
  );
};

export default AboutPage;
