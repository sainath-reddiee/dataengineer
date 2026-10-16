// src/pages/AboutPage.jsx — the author page, set like a writer's profile
import { Link } from 'react-router-dom';
import { Linkedin, Github, Mail } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { getPersonSchema, getBreadcrumbSchema, getFAQSchema, SITE_CONFIG } from '@/lib/seoConfig';
import { useStats } from '@/hooks/useStats';

const YOE = Math.max(5, new Date().getFullYear() - 2021);

// ── Content ───────────────────────────────────────────────────
const FEATURED_PROJECTS = [
  {
    title: 'AI Data Canonical Modeler',
    category: 'Snowflake Cortex AI',
    desc: 'Autonomous LLM agent native to Snowflake Cortex that generates canonical data models, Silver layer dbt models, and column mappings automatically from raw landing schemas — reducing modeling time from days to minutes.',
    badge: '60-70% Efficiency Boost',
    tech: ['Snowflake Cortex', 'Python', 'dbt', 'Streamlit'],
  },
  {
    title: 'AI dbt Code Generator',
    category: 'Pipeline Automation',
    desc: 'Transforms complex Source-to-Target Mapping (STTM) files directly into production-ready, modular dbt project structures, eliminating weeks of manual SQL development.',
    badge: 'Weeks Saved',
    tech: ['dbt', 'Python', 'Snowflake', 'STTM'],
  },
  {
    title: 'Data Model Validator Agent',
    category: 'Data Governance & Standards',
    desc: 'AI co-reviewer Streamlit application that inspects uploaded ERDs, orchestrates multi-agent evaluation against OSCRE industry compliance standards, profiles source data, and generates structured compliance checklists.',
    badge: 'OSCRE Standard',
    tech: ['Streamlit', 'Python', 'Multi-Agent', 'OSCRE'],
  },
  {
    title: 'Automated Data Quality Accelerator',
    category: 'Data Quality & Lineage',
    desc: 'End-to-end automation engine linking Collibra Critical Data Elements (CDEs) with SODA CL rule definitions via semantic Cortex LLM mapping with >60% accuracy.',
    badge: 'Collibra + SODA CL',
    tech: ['Collibra', 'SODA CL', 'Snowflake', 'Python'],
  },
  {
    title: 'Root-Cause & Remediation Engine',
    category: 'Data Quality Analytics',
    desc: 'Automated AI-generated JSON diagnostic engine leveraging Snowflake Cortex (AI_COMPLETE, AI_SIMILARITY) to diagnose data failures, location patterns, and generate actionable remediation plans.',
    badge: '>60% Mapping Accuracy',
    tech: ['Snowflake Cortex', 'AI_COMPLETE', 'JSON Analytics'],
  },
  {
    title: 'Self-Service Custom AI Skills',
    category: 'DataOps Productivity',
    desc: 'Library of reusable, custom AI skills empowering team members to automate repetitive DataOps tasks: rapid STTM creation, dbt generation, and reverse-analysis of complex codebases.',
    badge: 'Reusable AI Skills',
    tech: ['Custom AI Skills', 'DataOps', 'Reverse Engineering'],
  }
];

const TIMELINE = [
  {
    year: 'Oct 2025 – Present',
    role: 'Engineer III - Data & AI',
    company: 'Anblicks',
    location: 'Hyderabad, India',
    highlights: [
      'GDP Project (Jan 2026 – Present): Independently developed and deployed groundbreaking AI accelerators natively on Snowflake using Cortex & agentic AI, driving 60-70% team efficiency gains.',
      'AI Canonical Modeler & dbt Generator: Cut data modeling and dbt pipeline setup from weeks/days down to mere minutes.',
      'Data Model Validator Agent: Built multi-agent Streamlit app that evaluates ERDs against OSCRE industry standards, profiles real source data, and produces actionable compliance reports.',
      'DQ Accelerator & AI Mapping: Integrated Collibra CDEs with SODA CL rules via Cortex LLMs (AI_COMPLETE, AI_SIMILARITY), achieving >60% semantic mapping accuracy.',
      'Data Quality Uplift (Nov – Dec 2025): Engineered automated AI JSON summaries diagnosing data failures (location patterns, dimensions) and providing step-by-step remediation plans across Staging, Refined, and Reporting layers.',
      'Self-Service AI Skills: Built reusable AI skill library enabling rapid STTM generation, automated dbt code creation, and codebase reverse-analysis.'
    ],
  },
  {
    year: 'Jun 2025 – Oct 2025',
    role: 'Senior Data Engineer',
    company: 'Relanto',
    location: 'Hyderabad, India',
    highlights: [
      'Architected real-time and batch ingestion pipelines using Snowflake Streams, Tasks, and Snowpipe, improving data freshness by 30%.',
      'Optimized query execution time for large datasets by 50% utilizing advanced Snowflake features like clustering keys and zero-copy cloning.',
      'Automated complex ETL workflows across Informatica and Talend using Autosys to seamlessly load data from S3 to Snowflake.',
    ],
  },
  {
    year: '2021 – 2025',
    role: 'Data Engineer',
    company: 'Cognizant (Client: The Hartford)',
    location: 'India',
    highlights: [
      'Engineered and optimized complex Oracle database structures (normalized tables, indexed views), accelerating data retrieval by 30%.',
      'Implemented rigorous SQL-based end-to-end data validation frameworks between Oracle and Snowflake to guarantee 100% data accuracy.',
      'Reduced system downtime by 40% through proactive monitoring, log analysis, and robust cross-environment synchronization.',
    ],
  },
];

const TECH_GROUPS = [
  { title: 'Cloud platforms', items: ['AWS', 'Azure', 'GCP'] },
  { title: 'Data warehouses', items: ['Snowflake', 'Databricks', 'BigQuery', 'Oracle'] },
  { title: 'ETL / ELT', items: ['Apache Airflow', 'dbt', 'Informatica', 'Autosys'] },
  { title: 'Languages and APIs', items: ['Python', 'SQL', 'Snowpark API', 'Kafka'] },
  { title: 'AI and analytics', items: ['Snowflake Cortex (LLMs)', 'AI-assisted data quality', 'Semantic mapping'] },
  { title: 'Practices', items: ['Data governance', 'CI/CD', 'DataOps'] },
];

const SKILLS = [
  { title: 'AI in DataOps', desc: 'Snowflake Cortex for JSON analytics and LLM-driven executive summaries' },
  { title: 'Pipeline automation', desc: 'ETL/ELT orchestration with Airflow, dbt and Snowpark Python' },
  { title: 'Data quality and governance', desc: 'End-to-end DQ pipelines, CDE-to-rule mapping and automated lineage' },
  { title: 'Advanced SQL', desc: 'Dynamic SQL, LATERAL FLATTEN, RESULT_SCAN and performance tuning' },
  { title: 'Data architecture', desc: 'Scalable cloud-native models across Snowflake and Oracle' },
  { title: 'Scorecards', desc: 'Parameterized procedures for aggregated KPI and remediation reporting' },
];

const WHAT_I_WRITE = [
  'Snowflake deep dives',
  'AWS and Azure tutorials',
  'Python for data pipelines',
  'Airflow and dbt workflows',
  'Real-time and streaming',
  'Data modeling patterns',
];

const SOCIAL_LINKS = [
  { icon: Linkedin, label: 'LinkedIn', href: SITE_CONFIG.social.linkedin },
  { icon: Github, label: 'GitHub', href: SITE_CONFIG.social.github },
  { icon: Mail, label: 'sainath@dataengineerhub.blog', href: 'mailto:sainath@dataengineerhub.blog' },
];

const FAQS = [
  {
    question: 'Who is Sainath Reddy?',
    answer: `Sainath Reddy is a Data Engineer at Anblicks with ${YOE}+ years of experience specializing in cloud-native data architectures, ETL/ELT pipelines, and modern data stack technologies.`,
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


// Ruled section heading shared by every block on the page.
const Section = ({ id, title, children }) => (
  <section aria-labelledby={id} className="border-t-2 border-ink pt-4">
    <h2 id={id} className="mb-6 font-serif text-2xl font-semibold text-ink">{title}</h2>
    {children}
  </section>
);

const linkClass = 'text-rust-600 underline decoration-rust-200 underline-offset-2 hover:decoration-rust-500';

const AboutPage = () => {
  const { totalArticles } = useStats();

  return (
    <>
      <MetaTags
        title="About Sainath Reddy — Data Engineer & DataEngineer Hub Founder"
        description={`Meet Sainath Reddy, a Data Engineer at Anblicks with ${YOE}+ years of experience in Snowflake, AWS, Azure, Databricks, Salesforce Data Cloud, and modern data engineering.`}
        keywords="sainath reddy, data engineer, anblicks, snowflake expert, databricks expert, aws data engineer, azure data engineer, salesforce data cloud, dataengineer hub"
        type="website"
      />

      <script type="application/ld+json">{JSON.stringify(getPersonSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(getBreadcrumbSchema(BREADCRUMBS))}</script>
      <script type="application/ld+json">{JSON.stringify(getFAQSchema(FAQS))}</script>

      <div className="px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-14">

          {/* Profile */}
          <header className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="kicker mb-3">About the author</p>
              <h1 className="font-serif text-[40px] font-semibold leading-tight text-ink sm:text-[48px]">Sainath Reddy</h1>
              <p className="mt-2 font-mono text-[13px] text-ink-faint">
                Data Engineer at Anblicks · Hyderabad, India · {YOE}+ years
              </p>
            </div>
            <img
              src="https://secure.gravatar.com/avatar/344a01fa4bf69414fd1de0aee6e1fce9d00a2400bdf76d73f895120142dbd47a?s=256&d=mm&r=g"
              alt="Sainath Reddy"
              width={128}
              height={128}
              className="h-28 w-28 shrink-0 rounded-full object-cover sm:h-32 sm:w-32"
            />
          </header>

          {/* In his words: the original hero, mission and "why I blog" text. */}
          <div className="space-y-5 font-serif text-[19px] leading-relaxed text-ink-body">
            <p>
              I build scalable, cloud-native data pipelines and warehouses, and I share what I learn on
              DataEngineer Hub so others can grow faster in data engineering.
            </p>
            <p>
              When I was learning data engineering, quality tutorials were scarce. This site is the resource I
              wish I had: practical, focused, and kept current with the modern data stack. I share the
              patterns I use daily, not theory, but approaches that hold up in production.
            </p>
            <p>
              {totalArticles > 0 ? `There are ${totalArticles}+ articles here so far. ` : ''}
              Each one follows our <Link to="/editorial-standards" className={linkClass}>editorial standards</Link>.
              If something is wrong or out of date, <Link to="/contact" className={linkClass}>tell me</Link> and I will fix it.
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className={`inline-flex items-center gap-2 ${linkClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <Section id="about-experience-title" title="Experience">
            <ol className="space-y-10">
              {TIMELINE.map((item) => (
                <li key={item.year} className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                  <p className="font-mono text-[12px] text-ink-faint sm:pt-1">{item.year}</p>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-ink">{item.role}</h3>
                    <p className="text-[15px] text-ink-muted">{item.company} · {item.location}</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-body marker:text-paper-600">
                      {item.highlights.map((h) => <li key={h}>{h}</li>)}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="featured-projects-title" title="Recent work: AI and DataOps accelerators">
            <ul className="divide-y divide-paper-500 border-y border-paper-500">
              {FEATURED_PROJECTS.map((project) => (
                <li key={project.title} className="py-5">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-rust-600">
                    {project.category} · {project.badge}
                  </p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-ink">{project.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-body">{project.desc}</p>
                  <p className="mt-2 font-mono text-[12px] text-ink-faint">{project.tech.join(' · ')}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="about-stack-title" title="Tools I work with">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {TECH_GROUPS.map(({ title, items }) => (
                <div key={title}>
                  <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{title}</dt>
                  <dd className="mt-1 text-[15px] text-ink-body">{items.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="about-skills-title" title="What I am good at">
            <dl className="space-y-4">
              {SKILLS.map(({ title, desc }) => (
                <div key={title} className="grid gap-1 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-serif text-[17px] font-semibold text-ink">{title}</dt>
                  <dd className="text-[15px] leading-relaxed text-ink-body">{desc}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="about-blog-title" title="What I write about">
            <p className="mb-4 text-[17px] leading-relaxed text-ink-body">
              Every article is a practical guide based on real projects, written so you can apply it the same day.
            </p>
            <p className="text-[15px] text-ink-muted">{WHAT_I_WRITE.join(' · ')}</p>
            <p className="mt-5">
              <Link to="/articles" className={linkClass}>Browse all articles →</Link>
            </p>
          </Section>

          <blockquote className="border-l-2 border-rust-500 pl-5 font-serif text-2xl italic leading-snug text-ink">
            “Data engineering isn't just moving data. It's transforming information into insights that drive real business value.”
            <footer className="mt-3 font-sans text-sm not-italic text-ink-faint">Sainath Reddy</footer>
          </blockquote>

          <Section id="about-faq-title" title="Questions people ask">
            <dl className="space-y-5">
              {FAQS.map(({ question, answer }) => (
                <div key={question}>
                  <dt className="font-serif text-lg font-semibold text-ink">{question}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-ink-body">{answer}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="about-cta-title" title="Get in touch">
            <p className="text-[17px] leading-relaxed text-ink-body">
              Have a data engineering problem, a collaboration idea, or a correction? Email{' '}
              <a href="mailto:sainath@dataengineerhub.blog" className={linkClass}>sainath@dataengineerhub.blog</a>{' '}
              or <a href={SITE_CONFIG.social.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>connect on LinkedIn</a>.
            </p>
          </Section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
