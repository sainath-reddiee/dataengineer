import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';

// ─── 9 data roles with full roadmap content ───────────────────────────────────

const ROLES = [
  {
    id: 'data-analyst',
    tags: 'SQL, GRAIN, BI',
    name: 'Data Analyst',
    desc: 'SQL you can defend, a metric someone will argue with, and a BI-shaped interview loop.',
    color: 'emerald',
    steps: [
      { phase: 'Foundation', items: ['SQL fundamentals (SELECT, WHERE, GROUP BY)', 'Joins: INNER, LEFT, self-joins', 'Window functions: ROW_NUMBER, LAG, SUM OVER', 'Data types and NULL handling'] },
      { phase: 'Analytics', items: ['Metrics design: grain, aggregation, dedup', 'BI tools: Tableau, Looker, Power BI basics', 'Dashboard design principles', 'Cohort analysis & funnel metrics'] },
      { phase: 'Warehouse', items: ['Snowflake or BigQuery query patterns', 'Cost awareness: bytes scanned, credits', 'dbt basics: models, tests, documentation', 'Data quality checks & reconciliation'] },
      { phase: 'Interview', items: ['SQL screening: 45 min take-home', 'Case study: define a metric end-to-end', 'Behavioral: handling metric disagreements', 'Practice the question bank for your role'] },
    ],
  },
  {
    id: 'bi-analyst',
    tags: 'DASHBOARDS, GRAIN, WAREHOUSE',
    name: 'BI Analyst',
    desc: 'Warehouse SQL at dashboard grain. Windows, ranking, and a refresh that does not lie.',
    color: 'blue',
    steps: [
      { phase: 'Foundation', items: ['SQL at dashboard grain (one row = one entity)', 'Window functions for time-series metrics', 'JOIN patterns for dimension enrichment', 'Incremental vs full refresh logic'] },
      { phase: 'BI Layer', items: ['LookML / Looker Explores', 'Power BI DAX basics for DE context', 'Tableau calculated fields & LOD expressions', 'Semantic layer design'] },
      { phase: 'Warehouse', items: ['Snowflake clustering keys for BI queries', 'Materialized views vs dynamic tables', 'Query profile reading', 'Cost per dashboard refresh'] },
      { phase: 'Interview', items: ['SQL: window functions, ranking, dedup', 'Case: design a revenue dashboard schema', 'BI tool deep-dive: your primary tool', 'Question bank: BI Analyst track'] },
    ],
  },
  {
    id: 'analytics-engineer',
    tags: 'DBT, TESTS, METRICS',
    name: 'Analytics Engineer',
    desc: 'Mart SQL, tests that page someone, and a metric finance can trust.',
    color: 'orange',
    steps: [
      { phase: 'Foundation', items: ['dbt: models, refs, sources, snapshots', 'Testing: not_null, unique, accepted_values', 'SQL grain design for marts', 'Documentation and lineage'] },
      { phase: 'Metrics', items: ['Metrics layer: dbt Semantic Layer / MetricFlow', 'SCD Type 2 for slowly changing dims', 'Incremental models and merge strategies', 'Data contracts'] },
      { phase: 'Warehouse', items: ['Snowflake dynamic tables', 'BigQuery partition and cluster strategy', 'CI/CD for dbt in GitHub Actions', 'Query optimization for mart tables'] },
      { phase: 'Interview', items: ['dbt model review: production incident', 'Case: design a metrics mart for finance', 'Testing strategy: what do you always test?', 'Question bank: Analytics Engineer track'] },
    ],
  },
  {
    id: 'data-engineer',
    tags: 'PIPELINES, WAREHOUSES, ON-CALL',
    name: 'Data Engineer',
    desc: 'SQL, orchestration, streaming, and the platform sketch they ask at 5pm.',
    color: 'purple',
    steps: [
      { phase: 'Foundation', items: ['Python: pandas, PySpark, data pipeline patterns', 'SQL: advanced joins, CTEs, window functions', 'Airflow: DAGs, operators, sensors, XComs', 'Git and CI/CD basics'] },
      { phase: 'Orchestration', items: ['Airflow production patterns: retries, SLAs', 'dbt + Airflow integration', 'Prefect / Dagster concepts', 'Incident response: stuck pipeline at 3am'] },
      { phase: 'Warehouse & Streaming', items: ['Snowflake: pipes, streams, tasks', 'Kafka: producers, consumers, offsets', 'Spark: AQE, skew, partition tuning', 'Delta Lake: ACID, OPTIMIZE, ZORDER'] },
      { phase: 'Interview', items: ['System design: design an ingestion pipeline', 'Debug: explain a slow Spark job', 'Cost: warehouse sizing decision', 'Question bank: Data Engineer track'] },
    ],
  },
  {
    id: 'data-scientist',
    tags: 'SQL, STATS, EXPERIMENTS',
    name: 'Data Scientist',
    desc: "SQL for features, stats without vibes, and a holdout you would defend.",
    color: 'teal',
    steps: [
      { phase: 'Foundation', items: ['SQL for feature extraction', 'Python: NumPy, pandas, scikit-learn', 'Statistics: distributions, hypothesis testing, p-values', 'A/B testing: power, sample size, MDE'] },
      { phase: 'Modeling', items: ['Supervised learning: trees, forests, gradient boosting', 'Feature engineering and selection', 'Cross-validation and leakage prevention', 'Model evaluation: precision, recall, AUC'] },
      { phase: 'Production', items: ['Feature stores basics', 'Model serving: FastAPI, batch scoring', 'ML pipelines in Airflow', 'Monitoring: drift detection, data quality'] },
      { phase: 'Interview', items: ['Stats quiz: when does p-value lie?', 'ML system design: recommendation engine', 'SQL take-home: feature engineering query', 'Question bank: Data Scientist track'] },
    ],
  },
  {
    id: 'ml-engineer',
    tags: 'TRAIN, SERVE, ROLLBACK',
    name: 'ML Engineer',
    desc: 'Features as tables. Latency as an SLA. Metrics you can put in CI.',
    color: 'pink',
    steps: [
      { phase: 'Foundation', items: ['Python: PyTorch, NumPy, model training loops', 'ML fundamentals: loss functions, optimizers', 'Containerization: Docker for ML', 'Git LFS and model versioning'] },
      { phase: 'Training Platform', items: ['Distributed training: DDP, FSDP basics', 'MLflow / Weights & Biases experiment tracking', 'Hyperparameter tuning: Optuna', 'GPU cost management'] },
      { phase: 'Serving', items: ['FastAPI + model serving patterns', 'Latency SLAs: p50/p99 budgets', 'Canary deployments for models', 'Rollback strategy on metric regression'] },
      { phase: 'Interview', items: ['ML system design: real-time recommendation', 'Debug: model regressed after retraining', 'Cost: training run cost estimation', 'Question bank: ML Engineer track'] },
    ],
  },
  {
    id: 'mlops-engineer',
    tags: 'GATES, SERVING, INCIDENTS',
    name: 'MLOps Engineer',
    desc: 'The SQL that proves training and serving agree, then the gate that blocks a bad model.',
    color: 'yellow',
    steps: [
      { phase: 'Foundation', items: ['CI/CD for ML: GitHub Actions + model tests', 'MLflow: experiments, models, registry', 'Docker + Kubernetes basics for ML', 'Data validation: Great Expectations, Soda'] },
      { phase: 'Platform', items: ['Feature store: Feast / Tecton patterns', 'Training pipelines: Kubeflow / SageMaker', 'Model registry and promotion gates', 'Shadow mode and A/B deployment'] },
      { phase: 'Monitoring', items: ['Data drift: PSI, KS test, JS divergence', 'Prediction monitoring dashboards', 'Alert routing for model degradation', 'On-call runbooks for ML incidents'] },
      { phase: 'Interview', items: ['System design: MLOps platform from scratch', 'Incident: model silently degrading in prod', 'Gate: what metrics block a model deploy?', 'Question bank: MLOps Engineer track'] },
    ],
  },
  {
    id: 'ai-engineer',
    tags: 'RAG, EVAL, RETRIEVAL',
    name: 'AI Engineer',
    desc: 'Retrieval is a pipeline. Eval is a job. The model brand is not the incident.',
    color: 'indigo',
    steps: [
      { phase: 'Foundation', items: ['LLM APIs: OpenAI, Anthropic, Gemini patterns', 'Prompt engineering and chain-of-thought', 'Embeddings: semantic search, cosine similarity', 'LangChain / LlamaIndex basics'] },
      { phase: 'RAG Systems', items: ['Vector databases: Pinecone, Weaviate, pgvector', 'Chunking strategies for retrieval', 'Hybrid search: BM25 + semantic', 'Context window management'] },
      { phase: 'Evaluation', items: ['LLM evals: RAGAS, TruLens, custom metrics', 'Hallucination detection patterns', 'A/B testing for LLM responses', 'Cost per query optimization'] },
      { phase: 'Interview', items: ['System design: enterprise RAG architecture', 'Debug: retrieval quality degraded after index update', 'Eval: how do you score LLM output?', 'Question bank: AI Engineer track'] },
    ],
  },
  {
    id: 'data-architect',
    tags: 'GRAIN, COST, PAVED ROADS',
    name: 'Data Architect',
    desc: 'You still have to query the mart you designed. Quality SQL and a time you said no.',
    color: 'rose',
    steps: [
      { phase: 'Foundation', items: ['Data modeling: Kimball, Inmon, Data Vault 2.0', 'SQL: complex mart queries, performance tuning', 'Warehouse architecture: medallion, lake, lakehouse', 'Metadata management and data catalog'] },
      { phase: 'Platform Design', items: ['Snowflake: account strategy, RBAC, cost allocation', 'Databricks: Unity Catalog, workspace design', 'Ingestion patterns: CDC, bulk load, streaming', 'Paved roads: standards teams actually adopt'] },
      { phase: 'Governance', items: ['Data contracts and SLA definitions', 'Data lineage: dbt + Atlan / DataHub', 'Cost governance: per-team billing', 'Deprecation strategy for legacy models'] },
      { phase: 'Interview', items: ['Architecture review: critique a given design', 'Case: migrate from on-prem to Snowflake', 'Governance: how do you enforce data quality at scale?', 'Question bank: Data Architect track'] },
    ],
  },
];

const COLOR_MAP = {
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  blue:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  orange:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  purple:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  teal:    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  pink:    'bg-pink-500/20 text-pink-300 border-pink-500/30',
  yellow:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  indigo:  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  rose:    'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EngineeringRoadmapsPage = () => {
  const [expandedRole, setExpandedRole] = useState(null);

  return (
    <>
      <MetaTags
        title="Role Roadmaps — DataEngineer Hub"
        description="Pick a data role — Data Analyst, BI Analyst, Analytics Engineer, Data Engineer, Data Scientist, ML Engineer, MLOps, AI Engineer, or Data Architect — and follow the exact learning path."
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-14">

          {/* ── Hero ── */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              ROLES
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Role roadmaps
            </h1>
            <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
              Analyst, BI, analytics engineer, data engineer, scientist, ML, MLOps, AI engineer, and architect —
              connected graphs you can click and check off. Pick the job you want next.
            </p>
          </div>

          {/* ── Role grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {ROLES.map((role) => {
              const colorClass = COLOR_MAP[role.color] || COLOR_MAP.emerald;
              const isExpanded = expandedRole === role.id;

              return (
                <div
                  key={role.id}
                  className={`rounded-2xl border bg-slate-900/40 overflow-hidden transition-all shadow-lg hover:shadow-xl ${
                    isExpanded ? 'border-emerald-500/40 bg-slate-900/80 lg:col-span-3 shadow-2xl' : 'border-white/5 hover:border-white/15 cursor-pointer'
                  }`}
                >
                  {/* Role header */}
                  <button
                    onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                    className="w-full text-left p-6 sm:p-8"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                      {role.tags}
                    </p>
                    <h2 className="text-xl font-bold text-white mb-2">{role.name}</h2>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">{role.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/roadmaps"
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${colorClass}`}
                      >
                        Roadmap
                      </Link>
                      <Link
                        to="/coding"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Coding
                      </Link>
                      <Link
                        to="/interview"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Interview
                      </Link>
                    </div>
                    {!isExpanded && (
                      <p className="text-sm font-semibold text-emerald-400 mt-5 hover:text-emerald-300 transition-colors">
                        View complete roadmap →
                      </p>
                    )}
                  </button>

                  {/* Expanded roadmap phases */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-6 sm:p-8 bg-slate-950/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                        {role.steps.map((phase, i) => (
                          <div key={phase.phase}>
                            <div className="flex items-center gap-3 mb-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-400">
                                {i + 1}
                              </span>
                              <p className="text-sm font-bold uppercase tracking-widest text-gray-300">
                                {phase.phase}
                              </p>
                            </div>
                            <ul className="space-y-3">
                              {phase.items.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed">
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 flex flex-wrap gap-4 pt-8 border-t border-white/10">
                        <Link
                          to="/coding"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-colors"
                        >
                          Start coding practice
                        </Link>
                        <Link
                          to="/interview"
                          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-bold text-gray-200 transition-colors"
                        >
                          Interview bank for {role.name}
                        </Link>
                        <button
                          onClick={() => setExpandedRole(null)}
                          className="rounded-xl border border-white/10 bg-transparent hover:bg-white/5 px-6 py-3 text-sm font-semibold text-gray-400 transition-colors"
                        >
                          Collapse roadmap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── CTA ── */}
          <div className="rounded-2xl border border-white/8 bg-slate-900/40 px-8 py-8 text-center">
            <h2 className="text-lg font-bold text-white mb-2">Not sure where to start?</h2>
            <p className="text-sm text-gray-400 mb-5">
              Pick a role above, or go to Start Here for a guided five-step path.
            </p>
            <Link
              to="/start-here"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-colors"
            >
              Go to Start Here
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default EngineeringRoadmapsPage;
