import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Award, BookOpen, Target, Calendar, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const FAQ = [
  {
    q: 'Which Snowflake certification should I take first?',
    a: 'Start with SnowPro Core (COF-C02). It is the foundational credential and a prerequisite for every SnowPro Advanced and Specialty track. Most candidates pass it after 3-6 weeks of part-time study if they already have working SQL experience.',
  },
  {
    q: 'How many questions are on the SnowPro Core exam and what is the passing score?',
    a: 'The SnowPro Core exam (COF-C02) has 100 questions, 115 minutes to complete, and requires a scaled score of 750 out of 1000 to pass. Questions are multiple choice and multiple select, with no penalty for guessing.',
  },
  {
    q: 'How much does the SnowPro Core exam cost?',
    a: 'SnowPro Core costs $175 USD. SnowPro Advanced exams (Data Engineer, Architect, Administrator, Data Scientist, Data Analyst) cost $375 USD each. SnowPro Specialty exams (Gen AI, for example) cost $225 USD.',
  },
  {
    q: 'How long is a SnowPro certification valid?',
    a: 'SnowPro Core and Advanced certifications are valid for two years from the date you pass. You can recertify by passing the current version of the exam or, for some tracks, by earning continuing education credits before expiry.',
  },
  {
    q: 'Do I need hands-on Snowflake experience before taking SnowPro Core?',
    a: 'Snowflake recommends at least six months of hands-on practice. In reality, most candidates who pass have loaded real data, written non-trivial queries, managed warehouses, and set up at least one role hierarchy. The exam heavily tests micro-partitions, caching, zero-copy cloning, and time travel — concepts that are hard to memorize from a PDF.',
  },
  {
    q: 'What topics carry the most weight on SnowPro Core?',
    a: 'Snowflake publishes the domain weights in the official study guide: Snowflake Cloud Data Platform Features and Architecture (~25%), Account Access and Security (~20%), Performance Concepts (~15%), Data Loading and Unloading (~10%), Data Transformations (~20%), and Data Protection and Data Sharing (~10%).',
  },
  {
    q: 'Is the practice tool free?',
    a: 'Yes. The interactive practice app embedded on this page is free and runs in your browser. It covers SnowPro Core, SnowPro Advanced: Data Engineer, SnowPro Advanced: Architect, and the SnowPro Specialty: Generative AI exam pool.',
  },
  {
    q: 'What is the best way to use practice questions without just memorizing answers?',
    a: 'Practice questions are most useful as diagnostics, not answer keys. After every question, read the rationale, open the Snowflake documentation for the underlying concept, and write a one-line summary in your own words. If you cannot explain why the wrong answers are wrong, you do not understand the topic yet.',
  },
];

const Certification = () => {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dataengineerhub.blog/' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://dataengineerhub.blog/tools' },
      { '@type': 'ListItem', position: 3, name: 'Snowflake Certification Prep', item: 'https://dataengineerhub.blog/certification' },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const learningSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'Snowflake Certification Prep - SnowPro Core, Advanced & Specialty',
    description:
      'Free interactive practice tool and study guide for SnowPro Core (COF-C02), SnowPro Advanced: Data Engineer (DEA-C01), SnowPro Advanced: Architect (ARA-C01), and SnowPro Specialty: Generative AI exams.',
    educationalLevel: 'Professional',
    learningResourceType: 'Practice Exam',
    teaches: [
      'Snowflake Cloud Data Platform architecture',
      'Micro-partitions and query pruning',
      'Virtual warehouses and performance optimization',
      'Role-based access control (RBAC)',
      'Zero-copy cloning and time travel',
      'Data loading with COPY INTO and Snowpipe',
      'Streams, tasks, and dynamic tables',
      'Secure data sharing and the Snowflake Marketplace',
    ],
    provider: {
      '@type': 'Organization',
      name: 'DataEngineer Hub',
      url: 'https://dataengineerhub.blog',
    },
    url: 'https://dataengineerhub.blog/certification',
  };

  return (
    <>
      <MetaTags
        title="Snowflake Certification Prep 2026 - Free SnowPro Core, Advanced & Gen AI Practice"
        description="Free Snowflake certification prep for SnowPro Core (COF-C02), SnowPro Advanced: Data Engineer, Architect, and SnowPro Specialty: Gen AI. Study plan, exam breakdown, and interactive practice questions."
        keywords="snowflake certification, snowpro core, snowpro advanced, snowpro data engineer, snowpro architect, snowpro gen ai, COF-C02, DEA-C01, ARA-C01, snowflake certification practice, snowflake exam prep"
        url="/certification"
        type="article"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: 'Snowflake Certification Prep', url: '/certification' },
        ]}
        faqSchema={faqSchema}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(learningSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 text-gray-200">
        {/* Hero */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-medium text-blue-300 bg-blue-900/30 border border-blue-700/50 rounded-full">
            <Award className="w-3.5 h-3.5" /> Updated 2026 · COF-C02, DEA-C01, ARA-C01
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Snowflake Certification Prep: SnowPro Core, Advanced & Specialty
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
            Everything you need to pass a SnowPro exam on the first attempt: the current exam
            blueprint for each track, a four-week study plan, the concepts that trip up most
            candidates, and a free interactive practice question bank covering SnowPro Core,
            SnowPro Advanced: Data Engineer, SnowPro Advanced: Architect, and the SnowPro
            Specialty: Generative AI exam.
          </p>
        </header>

        {/* Exam family breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" /> The SnowPro Certification Family
          </h2>
          <p className="text-gray-300 mb-4">
            Snowflake organizes its credentials into three tiers. Every Advanced and Specialty
            exam requires an active SnowPro Core credential as a prerequisite, so Core is the
            mandatory first step for everyone.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-lg font-semibold text-white mb-1">SnowPro Core (COF-C02)</h3>
              <p className="text-sm text-gray-400 mb-3">Entry level · 100 questions · 115 min · $175 USD · Passing score 750/1000</p>
              <p className="text-gray-300 text-sm">
                The foundation exam. Tests architecture, storage, virtual warehouses, data loading,
                transformations, RBAC, and data protection. Recommended for data engineers, analysts,
                and anyone working daily inside Snowflake.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-lg font-semibold text-white mb-1">SnowPro Advanced: Data Engineer (DEA-C01)</h3>
              <p className="text-sm text-gray-400 mb-3">Advanced · 65 questions · 115 min · $375 USD · Requires Core</p>
              <p className="text-gray-300 text-sm">
                Deep pipeline focus: Snowpipe, Streams, Tasks, Dynamic Tables, external tables,
                stored procedures, UDFs, and performance tuning. The most popular Advanced track
                for practitioners who build production pipelines.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-lg font-semibold text-white mb-1">SnowPro Advanced: Architect (ARA-C01)</h3>
              <p className="text-sm text-gray-400 mb-3">Advanced · 65 questions · 115 min · $375 USD · Requires Core</p>
              <p className="text-gray-300 text-sm">
                Solution design focus: multi-account architecture, replication, failover, private
                connectivity, data sharing, Iceberg tables, and cost governance at scale. Targets
                senior engineers and cloud architects.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-lg font-semibold text-white mb-1">SnowPro Specialty: Generative AI</h3>
              <p className="text-sm text-gray-400 mb-3">Specialty · 55 questions · 90 min · $225 USD · Requires Core</p>
              <p className="text-gray-300 text-sm">
                Cortex AI focus: LLM functions, Cortex Search, Cortex Analyst, document AI,
                embeddings, vector similarity search, and RAG patterns on Snowflake. Newest exam,
                rapidly growing in demand.
              </p>
            </div>
          </div>
        </section>

        {/* Domain weights */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" /> SnowPro Core Domain Weights
          </h2>
          <p className="text-gray-300 mb-4">
            The official COF-C02 study guide breaks the exam into six domains. Plan your study
            hours proportionally — architecture and transformations alone account for nearly half
            the exam.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-700">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left p-3 border-b border-gray-700">Domain</th>
                  <th className="text-left p-3 border-b border-gray-700">Weight</th>
                  <th className="text-left p-3 border-b border-gray-700">Key topics</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="p-3 font-medium">Snowflake Cloud Data Platform Features & Architecture</td>
                  <td className="p-3">~25%</td>
                  <td className="p-3">Editions, regions, micro-partitions, metadata, caching layers, Snowgrid</td>
                </tr>
                <tr className="border-b border-gray-800 bg-gray-900/40">
                  <td className="p-3 font-medium">Account Access & Security</td>
                  <td className="p-3">~20%</td>
                  <td className="p-3">Roles, grants, network policies, MFA, SSO, masking, row access</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-3 font-medium">Data Transformations</td>
                  <td className="p-3">~20%</td>
                  <td className="p-3">SQL functions, semi-structured data (VARIANT), UDFs, stored procedures</td>
                </tr>
                <tr className="border-b border-gray-800 bg-gray-900/40">
                  <td className="p-3 font-medium">Performance Concepts</td>
                  <td className="p-3">~15%</td>
                  <td className="p-3">Warehouse sizing, scaling, clustering, search optimization, query profile</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-3 font-medium">Data Loading & Unloading</td>
                  <td className="p-3">~10%</td>
                  <td className="p-3">COPY INTO, Snowpipe, stages, file formats, external tables</td>
                </tr>
                <tr className="bg-gray-900/40">
                  <td className="p-3 font-medium">Data Protection & Data Sharing</td>
                  <td className="p-3">~10%</td>
                  <td className="p-3">Time travel, fail-safe, cloning, secure shares, Marketplace</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4-week plan */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" /> A Realistic 4-Week Study Plan (SnowPro Core)
          </h2>
          <p className="text-gray-300 mb-4">
            This plan assumes you can commit 6-8 hours per week — roughly one hour on weekdays
            plus a two-hour weekend deep-dive. Adjust the pace if you already have production
            Snowflake experience.
          </p>

          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-white font-semibold mb-2">Week 1 - Architecture & Storage</h3>
              <p className="text-gray-300 text-sm">
                Read the official architecture overview and the sections on micro-partitions,
                clustering, and storage layers. Create a free Snowflake trial account. Load a
                sample dataset via the UI and inspect the table's <code>INFORMATION_SCHEMA.TABLE_STORAGE_METRICS</code>.
                Objective: you can explain why Snowflake decouples compute and storage, what a
                micro-partition is, and how metadata enables zero-copy cloning.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-white font-semibold mb-2">Week 2 - Warehouses, Caching & Performance</h3>
              <p className="text-gray-300 text-sm">
                Focus on virtual warehouses, multi-cluster scaling, auto-suspend/resume, and the
                three cache layers (result cache, local disk cache, remote storage). Run a query
                twice and inspect the Query Profile to see the result cache hit. Resize a warehouse
                mid-query to observe credit burn. Objective: you can predict which cache serves a
                given query and choose the right warehouse size for a workload.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-white font-semibold mb-2">Week 3 - Security, RBAC & Data Loading</h3>
              <p className="text-gray-300 text-sm">
                Build a role hierarchy (SYSADMIN → analyst → analyst_read) and practice
                <code>GRANT</code>/<code>REVOKE</code>. Create a masking policy on a PII column.
                Set up an internal stage and load a CSV with <code>COPY INTO</code>. Configure a
                Snowpipe for continuous ingest from an external stage. Objective: you can design
                a least-privilege role model and explain when to use Snowpipe vs bulk COPY.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-gray-700 bg-gray-800/40">
              <h3 className="text-white font-semibold mb-2">Week 4 - Data Protection, Sharing & Full-Length Practice</h3>
              <p className="text-gray-300 text-sm">
                Experiment with time travel (<code>AT</code>, <code>BEFORE</code>) and zero-copy
                clones. Set up a secure share between two accounts (or a reader account). Take
                two full-length practice exams — one at the start of the week to find weak spots,
                one at the end as a final dress rehearsal. Review every missed question and write
                a one-line explanation in your own words.
              </p>
            </div>
          </div>
        </section>

        {/* Common mistakes */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" /> Six Mistakes That Cost Candidates the Exam
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Confusing fail-safe with time travel.</strong> Time travel is user-queryable (up to 90 days on Enterprise). Fail-safe is a 7-day Snowflake-only recovery window. You cannot query fail-safe data — only Snowflake Support can restore it.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Assuming clustering keys always help.</strong> Clustering only pays off on very large tables (&gt;1 TB) where the key aligns with frequent filter predicates. On small tables the maintenance credits exceed the query savings.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Mixing up SYSADMIN and ACCOUNTADMIN.</strong> ACCOUNTADMIN owns billing, resource monitors, and top-level account settings. SYSADMIN should own databases, warehouses, and schemas. Daily work should never happen in ACCOUNTADMIN.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Forgetting the 60-second minimum on warehouse resume.</strong> A suspended warehouse that resumes bills a minimum of 60 seconds even if the query runs in 2 seconds. This matters for cost questions.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Misreading result cache rules.</strong> The result cache (24 hours) is invalidated when the underlying data changes, when the query uses non-deterministic functions like <code>CURRENT_TIMESTAMP()</code>, or when UDFs marked as non-deterministic are present.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Memorizing answers instead of concepts.</strong> Snowflake rotates exam pools. If your study relies on leaked dumps, you will fail the real exam. Understand <em>why</em> each answer is correct.</span>
            </li>
          </ul>
        </section>

        {/* Practice tool */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Interactive Practice Questions</h2>
          <p className="text-gray-300 mb-4">
            The embedded app below is a free practice question bank covering SnowPro Core, Advanced:
            Data Engineer, Advanced: Architect, and Specialty: Gen AI. It runs entirely in your
            browser, gives instant feedback with rationales, and tracks your readiness by topic.
          </p>
          <div className="w-full rounded-lg border border-gray-700 overflow-hidden" style={{ height: '720px' }}>
            <iframe
              src="https://snowcert.streamlit.app/?embed=true"
              title="Snowflake Certification Practice App"
              width="100%"
              height="720"
              style={{ border: 'none', height: '720px', display: 'block' }}
              loading="lazy"
              allow="clipboard-read; clipboard-write;"
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Tool opens in-page via Streamlit Community Cloud. If it takes a moment to wake from
            idle, reload after ~10 seconds.
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-700 bg-gray-800/40">
                <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related resources */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Related Resources on DataEngineer Hub</h2>
          <ul className="space-y-2 text-blue-400">
            <li>
              <Link to="/tools" className="hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> All Snowflake & Data Engineering Tools
              </Link>
            </li>
            <li>
              <Link to="/category/snowflake" className="hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Snowflake Articles & Tutorials
              </Link>
            </li>
            <li>
              <Link to="/cheatsheet" className="hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Data Engineering Cheatsheets
              </Link>
            </li>
            <li>
              <Link to="/interview-prep" className="hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Snowflake Interview Prep
              </Link>
            </li>
            <li>
              <Link to="/tools/snowflake-cost-calculator" className="hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Snowflake Cost Calculator
              </Link>
            </li>
          </ul>
        </section>

        <p className="text-gray-500 text-xs border-t border-gray-800 pt-4">
          Exam details (question counts, duration, pricing, domain weights) reflect Snowflake's
          published study guides as of 2026. Always verify current specifications on the official
          Snowflake Certifications page before registering. DataEngineer Hub is an independent
          community resource and is not affiliated with or endorsed by Snowflake Inc.
        </p>
      </div>
    </>
  );
};

export default Certification;
