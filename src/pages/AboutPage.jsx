// src/pages/AboutPage.jsx — the author page, set like a writer's profile
import { Link } from 'react-router-dom';
import { Linkedin, Github, Mail } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { getPersonSchema, getBreadcrumbSchema, getFAQSchema, SITE_CONFIG } from '@/lib/seoConfig';
import { useStats } from '@/hooks/useStats';

const YOE = Math.max(5, new Date().getFullYear() - 2021);

// ── Content ───────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'agentos',
    title: 'Agentos',
    for: 'Knowledge base, build time, and runtime',
    value: 'Manual source onboarding dropped 60–70%. Modeling that took days, and pipeline setup that took weeks, comes back in minutes. A failed Airflow run is acted on without waiting for someone to read the log. The knowledge base holds the canonical model, the source-to-target mapping, the business definitions, the critical data elements, and every action an agent has already taken. Build-time agents read that base and draft the Silver model, the dbt project, the data-quality rules, and the standards review before a pipeline is scheduled. The runtime agent stays on after the DAG is live.',
  },
  {
    id: 'runtime-agent',
    title: 'Runtime agent',
    for: 'Airflow logs, after the pipeline is live',
    value: 'Build-time agents finish before the schedule starts. This one does not. It monitors Airflow task logs, acts when a run fails, and writes that action into the Agentos knowledge base. The next run, and the next source, start from what already happened instead of a log nobody kept.',
  },
  {
    id: 'canonical-modeler',
    title: 'Canonical modeler',
    for: 'Silver model from a landing schema',
    value: 'The landing table is not the model the platform publishes. This agent reads the raw schema and the knowledge base and drafts the Silver canonical model and the column mapping. A pass that took days comes back in minutes.',
  },
  {
    id: 'dbt-generator',
    title: 'dbt generator',
    for: 'A mapping that still has to become a pipeline',
    value: 'A finished source-to-target mapping was still rewritten by hand as dbt models, tests, and project structure, once per source. This agent turns the mapping into that project. Across 27 sources, that was weeks of SQL.',
  },
  {
    id: 'dq-accelerator',
    title: 'Data quality accelerator',
    for: 'A critical data element with no check',
    value: 'Collibra already names the elements that matter. SODA is what checks them at the Bronze-to-Silver gate. This agent maps each element to a rule, at better than 60% accuracy, and drafts the business definition that rule is enforcing.',
  },
  {
    id: 'model-validator',
    title: 'Model validator',
    for: 'A model that looks done and is still wrong',
    value: 'An ERD can satisfy the diagram and still miss the industry standard, or disagree with the rows that actually landed. This agent reviews the model against OSCRE, profiles the source, and returns a compliance checklist.',
  },
  {
    id: 'remediation',
    title: 'Root cause and remediation',
    for: 'A failed check with no next step',
    value: 'A quality failure says something is wrong. It does not say where, or what to change, across Staging, Refined, and Reporting. This agent writes that diagnosis and the remediation.',
  },
  {
    id: 'self-service-skills',
    title: 'Self-service skills',
    for: 'The same work, for someone who did not build the agent',
    value: 'Drafting a mapping, generating dbt, or reading a codebase you did not write should not depend on one person. These skills run on the same knowledge base, so a teammate starts from the source instead of a blank page.',
  },
];

const TIMELINE = [
  {
    year: 'Oct 2025 – Present',
    role: 'Engineer III - Data & AI',
    company: 'Anblicks',
    location: 'Hyderabad, India',
    highlights: [
      'Global Data Platform: Delivered Phase 1 of a Snowflake medallion platform — Landing, Bronze, Silver, Gold, and Platinum — on managed Apache Iceberg, with Reltio MDM. Brought 27 source systems in within six months. Bronze is the system of record, with full history through SCD-2 and soft deletes. Silver is the domain canonical model, before and after MDM. Gold publishes the data products and KPI aggregates. dbt runs those layers through Airflow, and SODA checks the Bronze-to-Silver gate.',
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
    <h2 id={id} className="mb-6 scroll-mt-24 font-serif text-2xl font-semibold text-ink">{title}</h2>
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
                      {item.company === 'Anblicks' && (
                        <>
                          <li>
                            Agentos, build time: a knowledge base per source — canonical model, source-to-target mapping, business definitions, and critical data elements. The{' '}
                            <a href="#agents-built" className={linkClass}>agents built</a>{' '}
                            on it draft the Silver model, the dbt project, the data-quality rules, and the standards review. Manual onboarding dropped 60–70%. Days of modeling and weeks of SQL come back in minutes.
                          </li>
                          <li>
                            Agentos, runtime: an agent monitors Airflow logs and acts when a task fails. Every action is written back into the knowledge base, so the next run starts from what already happened.
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="agents-built" title="Agents built">
            <p className="mb-2 text-[15px] leading-relaxed text-ink-body">
              Build-time agents draft the platform artifacts before a pipeline is scheduled. The runtime agent monitors Airflow after it is live, and writes what it did back into the knowledge base.
            </p>
            <ul className="divide-y divide-paper-500 border-y border-paper-500">
              {AGENTS.map((agent) => (
                <li key={agent.id} id={agent.id} className="scroll-mt-24 py-5">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-rust-600">{agent.for}</p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-ink">{agent.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-body">{agent.value}</p>
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
