/**
 * SEO Metadata Overrides
 * 
 * Hand-crafted titles (<60 chars) and descriptions (120-155 chars)
 * optimized for CTR in Google search results.
 * 
 * Rules applied:
 * - Titles: Under 60 chars (before " | DataEngineer Hub" suffix), 
 *   use numbers, power words, and clear value props
 * - Descriptions: 120-155 chars, lead with value/outcome, end with CTA
 * - No keyword stuffing — natural, compelling copy
 */

const seoOverrides = {
  // === 2026 Articles ===

  'snowflake-cortex-code-cost-control-2026': {
    title: 'Snowflake Cortex Code Cost Control: Set Limits Right',
    description: 'Control Snowflake Cortex Code costs with budget limits, token caps, and warehouse guards. Practical setup guide to avoid surprise credit burns.'
  },

  'why-i-stopped-using-snowflake-tasks-orchestration': {
    title: 'Why I Stopped Using Snowflake Tasks for Orchestration',
    description: 'Snowflake Tasks worked fine — until they didn\'t. Real experience on where native orchestration breaks down and what replaced it in production.'
  },

  'snowflake-expert-interview-questions': {
    title: 'Snowflake Expert Interview Questions (2026)',
    description: 'Expert-level Snowflake interview questions on architecture, optimization, streams, and security. Detailed answers with the depth senior roles demand.'
  },

  'snowflake-dbt-projects-airflow-orchestration': {
    title: 'Orchestrate Snowflake dbt Projects with Airflow',
    description: 'Wire Snowflake\'s native dbt projects to Apache Airflow for true end-to-end orchestration. Step-by-step pipeline setup with real configuration examples.'
  },

  'snowflake-cortex-code-guide-real-examples': {
    title: 'Snowflake Cortex Code: Hands-On Guide + Examples',
    description: 'Learn Snowflake Cortex Code through real examples. Step-by-step tutorial covering setup, prompts, and practical use cases for data engineers.'
  },

  'snowflake-cortex-code-dbt-optimization-guide': {
    title: 'Cortex Code for dbt: Cut Build Time 48%',
    description: 'Optimize your dbt project with Snowflake Cortex Code. Real results: 147 models, 48% faster builds. Step-by-step guide with SQL examples.'
  },

  'snowflake-managed-iceberg-tables-complete-guide-2026': {
    title: 'Snowflake Managed Iceberg Tables Guide (2026)',
    description: 'Store data in your own cloud storage while Snowflake manages Iceberg metadata. Setup guide with S3, GCS, and Azure examples included.'
  },

  'snowflake-parse-document-complete-guide-2026': {
    title: 'Snowflake AI_PARSE_DOCUMENT: Full Tutorial',
    description: 'Process PDFs, invoices, and scanned documents directly in Snowflake. End-to-end guide covering setup, extraction, and production deployment.'
  },

  'snowflake-cortex-cost-comparison': {
    title: 'Snowflake Cortex Pricing Guide 2026: Full Cost Breakdown',
    description: 'Compare Snowflake Cortex AI costs across AISQL, Cortex Search, Analyst, and Document AI. Credit usage breakdowns and optimization tips included.'
  },

  'snowflake-streams-tasks-pipeline-guide': {
    title: 'Snowflake Streams & Tasks: Build SCD2 Pipelines',
    description: 'Build automated data pipelines with Snowflake Streams and Tasks. Includes SCD Type 2 implementation with real SQL code and error handling.'
  },

  'how-i-passed-snowpro-gen-ai-certification-guide': {
    title: 'How I Passed SnowPro Gen AI Cert (GES-C01)',
    description: 'Passed the SnowPro Specialty Gen AI exam on the first attempt. Study plan, key topics, practice resources, and tips that actually work.'
  },

  'snowpro-specialty-gen-ai-practice-exams': {
    title: 'SnowPro Gen AI Practice Exams — Free Questions (2026)',
    description: 'Free SnowPro Specialty Gen AI practice questions with detailed explanations. Test yourself on Cortex, LLMs, RAG, and vector search before the real exam.'
  },

  'build-a-simple-rag-application-in-snowflake-using-streamlit-and-snowflake-cortex': {
    title: 'Build a RAG App with Snowflake Cortex + Streamlit',
    description: 'Build a working RAG application in Snowflake using Cortex and Streamlit. Weekend project with complete code for searching meeting notes.'
  },

  'snowflake-cost-optimization-techniques-2026': {
    title: '12 Ways to Cut Your Snowflake Bill by 40%',
    description: 'Proven Snowflake cost optimization techniques that saved real teams 40%+. Warehouse sizing, query patterns, storage tricks, and monitoring setup.'
  },

  'snowflake-query-optimization-guide-2026': {
    title: 'Snowflake Query Optimization: What Works in 2026',
    description: 'Practical Snowflake query tuning from 3 years of experience. Fix slow queries, reduce costs, and stop warehouses from timing out.'
  },

  'snowflake-interview-questions-answers-2026': {
    title: '10 Snowflake Interview Questions (Real 2026 Asks)',
    description: 'Real Snowflake interview questions from Senior Data Engineer interviews. Detailed answers with the reasoning interviewers actually want to hear.'
  },

  'snowflake-cortex-ai-complete-guide-2026': {
    title: 'Snowflake Cortex AI: Complete 2026 Guide',
    description: 'Master Snowflake Cortex AI — sentiment analysis, LLM functions, embeddings, and search. Practical examples with SQL code you can run today.'
  },

  'meeting-notes-rag-snowflake-ai-assistant': {
    title: 'Build a Meeting Notes AI Assistant in Snowflake',
    description: 'Build an AI-powered meeting intelligence system in Snowflake. Search meeting notes with natural language using Cortex RAG and Streamlit.'
  },

  'build-rag-snowflake-documentation': {
    title: 'Build a RAG System with Snowflake Docs (Tutorial)',
    description: 'Step-by-step guide to building a RAG system over 500+ Snowflake documentation pages. Search docs with natural language using Cortex AI.'
  },

  // === November 2025 Articles ===

  'snowflake-openflow-ai-data-ingestion-guide': {
    title: 'Snowflake OpenFlow: AI-Powered Data Ingestion',
    description: 'Deep dive into Snowflake OpenFlow announced at BUILD. How it compares to dbt, Airflow, and Fivetran for data ingestion workflows.'
  },

  'build-rag-snowflake-cortex-search-guide': {
    title: 'Build RAG in Snowflake: Cortex Search Guide 2026',
    description: 'Build production-ready RAG applications using Snowflake Cortex Search. Complete guide with vector embeddings, chunking strategies, and Streamlit UI.'
  },

  'snowflake-cortex-aisql-query-optimization-guide': {
    title: '7 Ways to Optimize Snowflake Cortex AISQL Queries',
    description: 'Cut Cortex AISQL costs and boost performance with 7 proven strategies. Query unstructured data efficiently with optimized SQL patterns.'
  },

  'snowflake-intelligence-guide-setup-optimization': {
    title: 'Snowflake Intelligence: Setup & Optimization Guide',
    description: 'Practical Snowflake Intelligence setup guide. Stop being the SQL bottleneck — let business users query data with natural language. Real examples inside.'
  },

  // === October 2025 Articles ===

  'snowflake-openflow-tutorial': {
    title: 'Snowflake OpenFlow Tutorial: Get Started in 2026',
    description: 'Hands-on Snowflake OpenFlow tutorial with step-by-step setup. Learn the new data ingestion paradigm with practical SQL and configuration examples.'
  },

  'snowflake-performance': {
    title: 'Snowflake Performance & SQL Tuning Handbook 2026',
    description: 'Data engineer\'s handbook to Snowflake performance optimization. Clustering, warehouse sizing, query profiling, and SQL improvements that matter.'
  },

  'snowflake-native-dbt-integration-2025-guide': {
    title: 'Snowflake Native dbt Integration: 2026 Setup Guide',
    description: 'Run dbt Core directly inside Snowflake — no containers or VMs needed. Complete setup guide with configuration, examples, and migration tips.'
  },

  'salesforce-copilot-custom-action-guide': {
    title: 'Build Your First Salesforce Copilot Action (5 Steps)',
    description: 'Create a custom Salesforce Copilot action in 5 steps. Go from zero to a working AI-powered CRM assistant with this practical guide.'
  },

  'build-databricks-ai-agent-gpt5-guide': {
    title: 'Build a Databricks AI Agent with GPT-5',
    description: 'Build an AI agent on Databricks that executes tasks, not just chats. Step-by-step guide using GPT-5, Unity Catalog, and MLflow.'
  },

  'salesforce-agentforce-complete-guide-2025': {
    title: 'Salesforce Agentforce: Complete 2026 Guide',
    description: 'Master Salesforce Agentforce — autonomous AI agents for CRM. Setup guide, real examples, and how it transforms customer engagement in 2026.'
  },

  'snowflake-unique-aggregations-hidden-functions': {
    title: 'Snowflake Hidden Aggregation Functions You Need',
    description: 'Go beyond SUM and COUNT. Discover Snowflake\'s unique aggregation functions like APPROXIMATE_SIMILARITY, MINHASH, and HLL for advanced analytics.'
  },

  'build-a-snowflake-agent-in-10-minutes': {
    title: 'Build a Snowflake Agent in 10 Minutes',
    description: 'Go from zero to a working Snowflake AI agent in 10 minutes. Use Cortex LLM functions to build an agent that queries data autonomously.'
  },

  'snowflake-dynamic-tables-complete-guide-2025': {
    title: 'Snowflake Dynamic Tables: Complete 2026 Guide',
    description: 'Build automated data pipelines with Snowflake Dynamic Tables. Covers target lag, refresh modes, monitoring, and real-world ETL patterns.'
  },

  'snowflake-hybrid-tables-unify-transactional-analytical-data': {
    title: 'Snowflake Hybrid Tables: End of the ETL Era?',
    description: 'Snowflake Hybrid Tables unify OLTP and OLAP in one platform. Learn when to use them, performance benchmarks, and migration strategies.'
  },

  'snowflake-sql-tutorial-2025-complete-guide': {
    title: 'Snowflake SQL Tutorial: MERGE ALL BY NAME & More',
    description: 'Master the latest Snowflake SQL features including MERGE ALL BY NAME, GROUP BY ALL, and new query patterns every data engineer needs.'
  },

  'snowflake-optima-automatic-query-optimization-guide': {
    title: 'Snowflake Optima: 15x Faster Queries, Zero Effort',
    description: 'Snowflake Optima automatically optimizes your queries for up to 15x faster performance. How it works, what it changes, and real benchmarks.'
  },

  'open-semantic-interchange-snowflake-ai-problem-solved': {
    title: 'Open Semantic Interchange: Solving AI\'s $1T Problem',
    description: 'Tech giants unite to solve AI\'s biggest data bottleneck. What Open Semantic Interchange means for Snowflake users and the data ecosystem.'
  },

  'synapse-to-fabric-migration-adx-eventhouse-guide': {
    title: 'Synapse to Fabric Migration Guide (ADX & Eventhouse)',
    description: 'Azure Synapse ADX is retiring. Complete migration guide to Microsoft Fabric Eventhouse with step-by-step planning, data transfer, and testing.'
  },

  'build-snowflake-cortex-ai-agent-guide': {
    title: 'Build a Snowflake Cortex AI Agent (2026 Tutorial)',
    description: 'Build a conversational AI data agent with Snowflake Cortex. Complete tutorial covering setup, natural language queries, and deployment.'
  },

  'mastering-real-time-etl-with-google-cloud-dataflow': {
    title: 'Real-Time ETL with Google Cloud Dataflow (Tutorial)',
    description: 'Master real-time ETL with Google Cloud Dataflow. Build streaming pipelines with Apache Beam, handle windowing, and deploy to production.'
  },

  'star-schema-vs-snowflake-schema-comparison': {
    title: 'Star Schema vs Snowflake Schema: Key Differences',
    description: 'Star schema vs snowflake schema compared side by side. Performance, storage, query complexity, and when to use each in your data warehouse.'
  },

  'data-pipelines-python': {
    title: 'Python Data Pipelines: APIs to S3 & Snowflake',
    description: 'Build Python data pipelines that extract from APIs and databases, then load to S3 and Snowflake. Production-ready code with error handling.'
  },

  'snowflake-cortex-ai-financial-services': {
    title: 'Snowflake Cortex AI for Financial Services',
    description: 'How financial institutions use Snowflake Cortex AI for sentiment analysis, fraud detection, and risk assessment. Real use cases and SQL examples.'
  },

  'snowflake-data-science-agent-automate-ml-2025': {
    title: 'Snowflake Data Science Agent: Automate ML in 2026',
    description: 'Automate the 60-80% of data science work that kills productivity. Build ML workflows with Snowflake\'s Data Science Agent and Cortex AI.'
  },

  'snowflake-mcp-server-agentic-ai-guide-2025': {
    title: 'Snowflake MCP Server: Enterprise AI Agents Guide',
    description: 'Connect AI agents to your Snowflake data with MCP Server. Setup guide for context-aware enterprise AI with security and governance built in.'
  },

  // === September-October 2025 Articles ===

  'snowflake-query-optimization-2025': {
    title: 'Snowflake Query Optimization Tips for 2026',
    description: 'Fix slow Snowflake queries with practical optimization tips. Clustering keys, warehouse sizing, query profiling, and cost reduction strategies.'
  },

  'snowflake-merge-optimization-techniques': {
    title: '5 Techniques to Optimize Snowflake MERGE Queries',
    description: 'Stop Snowflake MERGE queries from taking hours. 5 advanced optimization techniques with before/after benchmarks and production-tested SQL.'
  },

  'what-is-incremental-data-processing-a-data-engineers-guide': {
    title: 'Incremental Data Processing: A Data Engineer\'s Guide',
    description: 'Build efficient, scalable pipelines with incremental data processing. CDC, watermarks, merge patterns, and real implementation examples.'
  },

  'data-modeling-modern-data-warehouse': {
    title: 'Data Modeling for Modern Data Warehouses',
    description: 'Design effective data models before building pipelines. Dimensional modeling, slowly changing dimensions, and modern warehouse best practices.'
  },

  'dynamic-data-masking-snowflake': {
    title: 'Dynamic Data Masking in Snowflake (How-To Guide)',
    description: 'Protect PII data with Snowflake dynamic data masking. Step-by-step setup for masking policies on emails, phone numbers, and credit cards.'
  },

  'snowflake-data-sharing-governance': {
    title: 'Snowflake Data Sharing & Governance Guide',
    description: 'Master Snowflake secure data sharing and governance. Set up shares, manage access policies, and build a governed data mesh architecture.'
  },

  'querying-data-in-snowflake': {
    title: 'Query Data in Snowflake: JSON & Time Travel Guide',
    description: 'Master Snowflake querying — parse JSON with FLATTEN, use Time Travel for point-in-time queries, and write efficient analytical SQL.'
  },

  'load-data-into-snowflake': {
    title: 'Load Data into Snowflake: Stages & File Formats',
    description: 'Complete guide to loading data into Snowflake. Warehouses, stages, file formats, COPY INTO, and bulk loading best practices explained.'
  },

  'what-is-snowflake-guide': {
    title: 'What Is Snowflake? Beginner\'s Guide to the Platform',
    description: 'New to Snowflake? Understand the cloud data platform from scratch — architecture, key features, pricing, and why data teams choose it.'
  },

  'loading-data-from-s3-to-snowflake': {
    title: 'Load Data from S3 to Snowflake (Step-by-Step)',
    description: 'Load data from Amazon S3 to Snowflake with external stages, COPY INTO, and Snowpipe. Complete guide with IAM setup and automation tips.'
  },

  'aws-data-pipeline-cost-optimization-strategies': {
    title: 'AWS Data Pipeline Cost Optimization (7 Strategies)',
    description: 'Cut AWS data pipeline costs without sacrificing performance. 7 strategies covering Glue, EMR, Lambda, S3, and Redshift cost optimization.'
  },

  'snowflake-performance-tuning-techniques': {
    title: 'Snowflake Performance Tuning: Proven Techniques',
    description: 'Tune Snowflake for peak performance. Warehouse optimization, clustering keys, result caching, and query profiling techniques that reduce costs.'
  },

  'advanced-snowflake-interview-questions-experienced': {
    title: 'Advanced Snowflake Interview Questions (Senior Level)',
    description: 'Go beyond basic syntax. Advanced Snowflake interview questions on architecture, optimization, streams, tasks, and system design for senior roles.'
  },

  'automated-etl-airflow-python': {
    title: 'Automated ETL with Airflow & Python (Guide)',
    description: 'Build automated ETL pipelines with Apache Airflow and Python. DAG creation, scheduling, error handling, and production deployment covered.'
  },

  'sql-window-functions-guide': {
    title: 'SQL Window Functions: The Ultimate Guide',
    description: 'Master SQL window functions — ROW_NUMBER, RANK, LAG, LEAD, running totals, and moving averages. Clear examples for data analysts.'
  },

  'build-data-lakehouse-on-azure': {
    title: 'How to Build a Data Lakehouse on Azure',
    description: 'Build a data lakehouse on Azure combining warehouse performance with data lake flexibility. Architecture, setup, and Delta Lake integration.'
  },

  'serverless-data-pipeline-aws': {
    title: 'Build a Serverless Data Pipeline on AWS (Guide)',
    description: 'Build scalable, cost-effective data pipelines on AWS without managing servers. Lambda, Glue, Step Functions, and S3 architecture walkthrough.'
  },

  'dbt-projects-snowflake-structure': {
    title: 'How to Structure dbt Projects in Snowflake',
    description: 'Structure dbt projects the right way in Snowflake. Folder layout, naming conventions, staging/marts pattern, and team collaboration tips.'
  },

  'snowflake-architecture': {
    title: 'Snowflake Architecture Explained Simply',
    description: 'Understand Snowflake\'s 3-layer architecture — storage, compute, and services. How separation of concerns enables performance and scalability.'
  }
};

/**
 * Get SEO override for a given article slug.
 * Returns { title, description } or null if no override exists.
 */
export function getSEOOverride(slug) {
  if (!slug) return null;
  // Normalize: strip leading/trailing slashes and "articles/" prefix
  const normalized = slug.replace(/^\/?(articles\/)?/, '').replace(/\/$/, '');
  return seoOverrides[normalized] || null;
}

/**
 * Get optimized title for a slug, falling back to the original title.
 * @param {string} slug - Article slug
 * @param {string} originalTitle - Fallback title from WordPress
 * @returns {string} Optimized or original title
 */
export function getOptimizedTitle(slug, originalTitle) {
  const override = getSEOOverride(slug);
  return override?.title || originalTitle;
}

/**
 * Get optimized description for a slug, falling back to the original.
 * @param {string} slug - Article slug
 * @param {string} originalDescription - Fallback description
 * @returns {string} Optimized or original description
 */
export function getOptimizedDescription(slug, originalDescription) {
  const override = getSEOOverride(slug);
  return override?.description || originalDescription;
}

export default seoOverrides;
