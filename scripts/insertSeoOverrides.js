/**
 * Insert missing SEO overrides into src/data/seoOverrides.js
 * Run: node scripts/insertSeoOverrides.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read current seoOverrides.js
const seoOverridesPath = join(rootDir, 'src/data/seoOverrides.js');
const content = fs.readFileSync(seoOverridesPath, 'utf8');

// Find the closing }; of the seoOverrides object
const closingBraceIndex = content.lastIndexOf('};');
if (closingBraceIndex === -1) {
  console.error('Could not find closing }; in seoOverrides.js');
  process.exit(1);
}

// The 59 missing entries to add
const newEntries = `  'sql-pattern-that-kills-data-engineer-interviews': {
    title: 'SQL Pattern That Kills Data Engineer Interviews',
    description: 'The one SQL pattern that separates junior from senior data engineers in interviews. Window functions, QUALIFY, and lateral joins explained with examples.'
  },

  'snowflake-dcm-projects-infrastructure-as-code': {
    title: 'Snowflake DCM Projects: Infrastructure as Code Guide',
    description: 'Manage Snowflake Database Change Management projects as code. GitOps workflow, CI/CD integration, and rollback strategies for production.'
  },

  '2extract-web-scraping-python-mcp': {
    title: 'Web Scraping with Python MCP: Build Data Pipelines',
    description: 'Extract web data at scale using Python Model Context Protocol. Build resilient scrapers, handle rate limits, and pipe directly to Snowflake/DuckDB.'
  },

  'dbt-state-skip-unchanged-models': {
    title: 'dbt State: Skip Unchanged Models, Cut Runtime 60%',
    description: 'Use dbt state:modified to only run changed models. Complete setup guide with selectors, CI integration, and real benchmarks from 400-model projects.'
  },

  'airflow-common-ai-provider-llm-tasks': {
    title: 'Airflow Common AI Provider: LLM Tasks in DAGs',
    description: 'Call LLMs directly from Airflow DAGs using the Common AI Provider. Prompt engineering, response parsing, and cost tracking patterns.'
  },

  'snowflake-dynamic-data-masking-row-access-policies': {
    title: 'Snowflake Dynamic Data Masking & Row Access Policies',
    description: 'Implement column-level masking and row-level security in Snowflake. Dynamic policies, external tokenization, and governance at scale.'
  },

  'ai-data-pipelines-cost-control': {
    title: 'AI Data Pipelines: Cost Control Strategies That Work',
    description: 'Control LLM costs in production data pipelines. Token budgeting, caching layers, model routing, and FinOps dashboards for AI workloads.'
  },

  'snowflake-cortex-token-usage-monitoring': {
    title: 'Snowflake Cortex Token Monitoring: Track Every Credit',
    description: 'Monitor Cortex AI token usage per query, user, and model. Build alerting dashboards, set budget guards, and optimize prompt efficiency.'
  },

  'snowflake-mcp-server-guide': {
    title: 'Build a Snowflake MCP Server: Complete Tutorial',
    description: 'Expose Snowflake as an MCP server for AI agents. Tool definitions, authentication, query execution, and agent integration patterns.'
  },

  'from-etl-pipelines-to-reusable-data-products': {
    title: 'From ETL Pipelines to Reusable Data Products',
    description: 'Transform fragile ETL into maintainable data products. Contracts, versioning, ownership, and the platform shift every team needs.'
  },

  'etl-vs-elt-vs-reverse-etl-framework': {
    title: 'ETL vs ELT vs Reverse ETL: When to Use Each',
    description: 'Decision framework for data movement patterns. Cost, latency, complexity, and tool selection for modern data architectures.'
  },

  'justify-data-platform-investment': {
    title: 'Justify Data Platform Investment: ROI Framework',
    description: 'Build the business case for your data platform. Quantify cost savings, revenue enablement, and risk reduction with stakeholder-ready metrics.'
  },

  'snowflake-cortex-ai-hidden-token-costs': {
    title: 'Snowflake Cortex AI: Hidden Token Costs Exposed',
    description: 'Uncover the token costs Cortex doesn\\'t show you. Embedding, search, and LLM call breakdowns with optimization strategies that cut spend 40%.'
  },

  'snowflake-time-travel-fail-safe': {
    title: 'Snowflake Time Travel & Fail-Safe: Complete Guide',
    description: 'Master Time Travel for recovery, cloning, and auditing. Understand Fail-Safe\\'s 7-day safety net, storage costs, and retention policies.'
  },

  'sql-patterns-that-show-up-in-interviews': {
    title: 'SQL Patterns That Show Up in Data Engineering Interviews',
    description: 'The 15 SQL patterns interviewers actually test. Recursive CTEs, window frames, pivot/unpivot, gaps-and-islands — with solutions.'
  },

  'optimizing-dbt-models-modern-warehouses': {
    title: 'Optimizing dbt Models for Modern Warehouses',
    description: 'Speed up dbt runs on Snowflake, BigQuery, Databricks. Incremental strategies, partitioning, clustering, and materialization selection.'
  },

  'what-actually-works-building-ai-agents': {
    title: 'What Actually Works Building AI Agents (2026)',
    description: 'Cut through the hype. Framework comparison, tool design patterns, memory architectures, and evaluation — from production deployments.'
  },

  '20-ai-concepts-for-data-engineers': {
    title: '20 AI Concepts Every Data Engineer Must Know',
    description: 'RAG, embeddings, vector search, agents, fine-tuning, eval — explained for data engineers. No ML PhD required, just production context.'
  },

  'why-larger-llms-give-wrong-answers-in-production': {
    title: 'Why Larger LLMs Give Wrong Answers in Production',
    description: 'The scaling paradox: bigger models, worse reliability. Hallucination patterns, context limits, and the eval frameworks that catch failures.'
  },

  'medallion-architecture-reconsidered': {
    title: 'Medallion Architecture Reconsidered: Is Bronze/Silver/Gold Dead?',
    description: 'Question the medallion dogma. When layering adds latency, when to flatten, and the streaming-first alternative gaining traction.'
  },

  '7-steps-autonomous-agent': {
    title: '7 Steps to Building Autonomous AI Agents',
    description: 'From idea to deployed agent in 7 steps. Scope definition, tool selection, memory design, eval loops, and production hardening.'
  },

  'future-of-data-engineering-ai-driven-world': {
    title: 'Future of Data Engineering in an AI-Driven World',
    description: 'How AI reshapes the data engineer role. Skills that automate, skills that compound, and the new career trajectory for 2026+.'
  },

  'how-snowflake-stores-data-internally': {
    title: 'How Snowflake Stores Data Internally: Deep Dive',
    description: 'Micro-partitions, clustering keys, columnar compression, and pruning — understand storage to write queries the optimizer loves.'
  },

  'why-senior-engineers-write-sql-differently': {
    title: 'Why Senior Engineers Write SQL Differently',
    description: 'The mental models that separate senior SQL. Set-based thinking, optimizer hints, and query patterns that scale to petabytes.'
  },

  'agentic-ai-security-data-pipelines': {
    title: 'Agentic AI Security for Data Pipelines',
    description: 'Secure AI agents that touch your data. Prompt injection defense, tool sandboxing, audit logging, and compliance patterns.'
  },

  'agent-real-memory-ollama': {
    title: 'Agent Memory with Ollama: Local LLMs That Remember',
    description: 'Build persistent agent memory with local models. Vector stores, knowledge graphs, and episodic memory — all on your infrastructure.'
  },

  'how-ai-is-reshaping-data-engineering': {
    title: 'How AI Is Reshaping Data Engineering (2026)',
    description: 'The concrete ways AI changes daily work. Code generation, test writing, documentation, pipeline debugging — with tool recommendations.'
  },

  'sql-portfolio-projects-that-get-hired': {
    title: 'SQL Portfolio Projects That Get Data Engineers Hired',
    description: 'Build a portfolio that proves production readiness. Project ideas, schema design, query complexity, and GitHub presentation tips.'
  },

  'food-data-quality-pipeline-guest-post': {
    title: 'Food Data Quality Pipeline: Guest Post Case Study',
    description: 'Real guest post: building data quality checks for food delivery data. Schema validation, anomaly detection, and stakeholder dashboards.'
  },

  'best-mcp-servers-agentic-development': {
    title: 'Best MCP Servers for Agentic Development (2026)',
    description: 'Curated list of production-ready MCP servers. GitHub, PostgreSQL, Snowflake, Slack, Jira — with setup guides and use cases.'
  },

  'introduction-to-loop-engineering': {
    title: 'Introduction to Loop Engineering for Data Teams',
    description: 'The feedback-loop mindset: build, measure, learn, iterate. Apply product thinking to data pipelines and ML systems.'
  },

  'ollama-local-llm-data-pipeline': {
    title: 'Ollama Local LLM Data Pipeline: Privacy-First AI',
    description: 'Run LLMs locally in your data pipeline. Model selection, quantization, GPU/CPU inference, and data never leaves your VPC.'
  },

  'build-mcp-server-python-fastmcp': {
    title: 'Build MCP Server with Python FastMCP',
    description: 'FastMCP tutorial: expose Python functions as MCP tools. Async patterns, type hints, authentication, and agent testing.'
  },

  'model-context-protocol-explained-3-levels': {
    title: 'Model Context Protocol Explained at 3 Levels',
    description: 'MCP for beginners, practitioners, and architects. What it solves, how it works, and why it\\'s the USB-C of AI integrations.'
  },

  'ai-agent-tool-design-patterns': {
    title: 'AI Agent Tool Design Patterns That Scale',
    description: 'Design tools agents actually use. Schema design, error handling, idempotency, and the anti-patterns that break agent loops.'
  },

  'tools-vs-subagents-ai-agents': {
    title: 'Tools vs Subagents: When to Use Each in AI Agents',
    description: 'Architectural decision: flat tool list or hierarchical subagents? Complexity tradeoffs, debugging, and real-world examples.'
  },

  'ai-coding-agents-pipeline-metadata-security': {
    title: 'AI Coding Agents: Pipeline, Metadata & Security',
    description: 'Integrate coding agents into your data workflow. Code review automation, metadata extraction, and secure sandbox execution.'
  },

  'databricks-unity-catalog-iceberg-2026': {
    title: 'Databricks Unity Catalog + Iceberg: 2026 Guide',
    description: 'Govern Iceberg tables with Unity Catalog. External locations, metastore sync, time travel, and cross-engine interoperability.'
  },

  'salesforce-data-cloud-zero-copy-snowflake': {
    title: 'Salesforce Data Cloud Zero-Copy to Snowflake',
    description: 'Query Salesforce data in Snowflake without ETL. Zero-copy integration setup, permission model, and query performance tuning.'
  },

  'airflow-etl-audit-logger-snowflake': {
    title: 'Airflow ETL Audit Logger: Snowflake Integration',
    description: 'Capture every DAG run, task instance, and XCom in Snowflake. Debugging, compliance, and pipeline observability in one table.'
  },

  'native-tables-to-dynamic-iceberg-v3-snowflake': {
    title: 'Native Tables to Dynamic Iceberg v3: Snowflake Migration',
    description: 'Migrate Snowflake native tables to Iceberg v3. Catalog integration, snapshot isolation, and zero-downtime cutover.'
  },

  'governing-ai-agents-snowflake-coco-mcp-security': {
    title: 'Governing AI Agents: Snowflake CoCo + MCP Security',
    description: 'End-to-end AI agent governance. CoCo for compute isolation, MCP for tool access, audit trails, and policy enforcement.'
  },

  'dbt-unit-testing-snowflake-credit-cost': {
    title: 'dbt Unit Testing: Cut Snowflake Credit Costs',
    description: 'Test dbt models locally with unit tests. Contract testing, mock data, CI integration, and the credit savings from catching bugs early.'
  },

  'dynamic-airflow-dags-snowflake-metadata': {
    title: 'Dynamic Airflow DAGs from Snowflake Metadata',
    description: 'Generate DAGs from Snowflake metadata. Table schemas, lineage, and freshness checks — no hardcoded pipeline definitions.'
  },

  'snowflake-zero-copy-clone-storage-cicd': {
    title: 'Snowflake Zero-Copy Clone: Storage & CI/CD Patterns',
    description: 'Leverage zero-copy clones for dev environments, testing, and CI/CD. Storage accounting, clone hierarchies, and automation.'
  },

  'snowflake-coco-mcp-guide': {
    title: 'Snowflake CoCo MCP Guide: Secure AI Compute',
    description: 'Snowflake Container Services (CoCo) for MCP servers. Secure deployment, networking, secrets, and cost optimization.'
  },

  'why-llms-give-different-answers': {
    title: 'Why LLMs Give Different Answers: Non-Determinism Explained',
    description: 'Temperature, top-p, seed, and system fingerprint — understand LLM randomness and how to get reproducible outputs when needed.'
  },

  'snowflake-interactive-tables-guide': {
    title: 'Snowflake Interactive Tables: Quick Data Exploration',
    description: 'Explore data without SQL. Interactive Tables UI, filtering, charting, and sharing — for analysts and engineers alike.'
  },

  'rag-retrieval-augmented-generation-production-guide': {
    title: 'RAG in Production: Retrieval-Augmented Generation Guide',
    description: 'Build RAG that works at scale. Chunking strategies, embedding models, reranking, eval metrics, and the gotchas that break demos.'
  },

  'airflow-dbt-snowflake-orchestration-guide': {
    title: 'Airflow + dbt + Snowflake: Orchestration Guide',
    description: 'Orchestrate dbt from Airflow with Cosmos or native operators. DAG design, failure handling, and the model-vs-job-level decision.'
  },

  'dbt-state-snowflake-configuration': {
    title: 'dbt State Configuration for Snowflake',
    description: 'Configure dbt state comparison for Snowflake. Artifact storage, manifest diffing, and selective run automation in CI/CD.'
  },

  'duckdb-vs-spark-when-to-switch': {
    title: 'DuckDB vs Spark: When to Switch Engines',
    description: 'Decision framework: local DuckDB vs distributed Spark. Data size, complexity, team skills, and the crossover points in 2026.'
  },

  'data-contracts-schema-breakage-guide': {
    title: 'Data Contracts: Stop Schema Breakage Before It Happens',
    description: 'Implement data contracts between producers and consumers. Schema registry, breaking change detection, and migration tooling.'
  },

  'why-ai-agents-forget-memory-architecture': {
    title: 'Why AI Agents Forget: Memory Architecture Fixes',
    description: 'Context window limits, retrieval failures, and state loss. Design memory systems that persist across sessions and scale.'
  },

  'dbt-state-skip-unchanged-nodes': {
    title: 'dbt State: Skip Unchanged Nodes in CI',
    description: 'Extend dbt state to skip tests, seeds, and snapshots. Full pipeline optimization with selector syntax and GitHub Actions.'
  },

  'dbr-fusion-engine-migration-guide': {
    title: 'Databricks Fusion Engine Migration Guide',
    description: 'Migrate to Databricks Fusion (Photon 2.0). Compatibility checks, performance gains, and the rollout strategy for production.'
  },

  'snowflake-iceberg-v3-migration-guide': {
    title: 'Snowflake Iceberg v3 Migration: Complete Guide',
    description: 'Migrate to Iceberg tables on Snowflake. Catalog setup, file format conversion, partitioning strategy, and validation.'
  },

  'snowflake-query-execution-architecture': {
    title: 'Snowflake Query Execution Architecture Deep Dive',
    description: 'Query parsing, optimization, execution, and profiling. Understand the optimizer to write queries that use warehouse credits wisely.'
  },

  'snowflake-warehouse-cache-explained': {
    title: 'Snowflake Warehouse Cache: Local & Result Cache',
    description: 'How local disk cache and result cache work. Cache warming, eviction policies, and the queries that benefit (or don\\'t).'
  }`;

// Insert before the closing };
const newContent = content.slice(0, closingBraceIndex) + '\n' + newEntries + '\n' + content.slice(closingBraceIndex);

fs.writeFileSync(seoOverridesPath, newContent);
console.log('✅ Successfully inserted 59 SEO overrides into seoOverrides.js');
console.log('Total lines added:', newEntries.split('\n').length);