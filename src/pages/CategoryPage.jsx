// src/pages/CategoryPage.jsx - ENHANCED WITH BREADCRUMBS
import React, { useMemo, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RecentPosts from '@/components/RecentPosts';
import MetaTags from '@/components/SEO/MetaTags';
import Breadcrumbs from '@/components/SEO/Breadcrumbs';
import { generateBreadcrumbs } from '@/lib/seoConfig';
import { getFAQSchema } from '@/lib/seoConfig';

// Lazy load AdPlacement
const AdPlacement = React.lazy(() => import('@/components/AdPlacement'));

// Spark component for animation
const Spark = ({ x, y, rotate, color }) => {
  const variants = {
    rest: { x: 0, y: 0, scale: 0, opacity: 0 },
    hover: {
      x, y, scale: 1,
      opacity: [0, 1, 0.5, 0],
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] },
    },
  };
  return (
    <motion.div
      variants={variants}
      className="absolute top-1/2 left-1/2 h-[3px] w-[3px] rounded-full"
      style={{ backgroundColor: color, rotate }}
    />
  );
};

const categoryConfig = {
  snowflake: {
    name: 'Snowflake',
    color: 'from-blue-500 to-cyan-500',
    path: '/category/snowflake',
    description: "Master Snowflake with comprehensive tutorials on data warehousing, analytics, and cloud data platform features.",
    longDescription: "Snowflake is the **cloud-native data platform** that redefined how teams build warehouses, data lakes, and applications on top of governed data. Unlike legacy on-prem warehouses, Snowflake separates **storage, compute, and services** into independent layers — so you can scale compute up for a heavy transform, down for idle hours, run a dozen workloads simultaneously without contention, and pay only for the seconds you actually run a query.\n\nThe tutorials in this category cover the **full breadth of Snowflake as a 2026 data platform**: core warehouse features (virtual warehouses, micro-partitions, clustering keys, query profile reading), ELT and streaming ingest (Snowpipe, Snowpipe Streaming, Openflow, the Kafka connector), transformation (Streams + Tasks, Dynamic Tables, dbt on Snowflake, Snowpark Python), governance (RBAC, masking policies, row access policies, Horizon Catalog, Trust Center), cost optimization (auto-suspend, resource monitors, serverless selection), data sharing (Secure Data Sharing, Marketplace, Data Clean Rooms), lakehouse features (Iceberg tables, external tables, catalog integrations), and the new wave of **Cortex AI** features (LLM functions, Cortex Search, Cortex Analyst, Document AI, Cortex Agents).\n\n### What you'll learn here\n\n**If you're new to Snowflake**, start with the architecture fundamentals — the three-layer separation, how credits are billed, how warehouses suspend/resume, and why this matters for your bill and your query performance. The \"Snowflake for beginners\" tutorials walk through account setup, user/role creation, your first warehouse, and your first MERGE + COPY INTO flow.\n\n**If you're already running Snowflake in production**, the deeper content covers patterns that actually move the needle: query profile reading for diagnosing slow queries, clustering vs Search Optimization vs Materialized View decision trees, governance at scale with tag-based masking policies, cost attribution via QUERY_TAG and WAREHOUSE_METERING_HISTORY, disaster recovery with failover groups, and multi-engine architectures using Snowflake-managed Iceberg tables.\n\n**If you're interviewing for Snowflake roles**, the SnowPro-aligned content maps to the Core, Advanced: Architect, and Advanced: Data Engineer exam objectives — plus the real-world interview questions that don't appear in the official study guides (QUERY_PROFILE screenshots, cost-breakdown case studies, RBAC design exercises).",
    faqs: [
      { question: 'What makes Snowflake different from traditional data warehouses?', answer: 'Snowflake separates storage from compute, so you can scale each independently. Multiple workloads run on isolated virtual warehouses without contention, you pay per-second of compute you actually use, and you get zero-copy cloning, Time Travel, and built-in secure data sharing natively — none of which traditional warehouses (Teradata, Exadata, on-prem SQL Server) offer out of the box.' },
      { question: 'How do I start learning Snowflake from scratch?', answer: 'Sign up for a free 30-day trial at signup.snowflake.com, then work through the architecture fundamentals, create your first warehouse and database, and write basic COPY INTO + MERGE statements using sample data from the SNOWFLAKE_SAMPLE_DATA shared database. Our beginner tutorials walk you through each step with working SQL.' },
      { question: 'What are credits in Snowflake and how am I billed?', answer: 'Credits are Snowflake\'s unit of compute consumption. Each virtual warehouse size consumes a fixed credit rate per hour (XS = 1 credit/hr, S = 2, M = 4, L = 8, XL = 16, 2XL = 32, 3XL = 64, 4XL = 128, 5XL = 256, 6XL = 512). Warehouses bill per-second with a 60-second minimum after resume. Storage is billed separately per TB-month. Serverless features (Snowpipe, Tasks, Cortex, replication) are billed against their own credit categories.' },
      { question: 'Should I use Snowflake or Databricks?', answer: 'Snowflake wins when SQL is your primary interface, you want minimal operational overhead, and governance matters from day one. Databricks wins when you\'re heavy on Spark/ML notebooks, want to own your lakehouse storage, and have the team to run the platform. With Snowflake Iceberg Tables and Snowpark, plus Databricks Serverless SQL, the two platforms increasingly overlap — many enterprises run both for different workloads.' },
      { question: 'What is a virtual warehouse in Snowflake?', answer: 'A virtual warehouse is a cluster of compute resources (CPU, memory, temporary storage) that executes SQL queries, performs DML, and loads data. Warehouses are independent of storage and of each other, can be resized on-demand, auto-suspend when idle, auto-resume on query, and can be multi-cluster for high concurrency. You can have dozens of warehouses in one account, each tuned for a different workload.' },
      { question: 'How does Snowflake compare to Redshift or BigQuery?', answer: 'Snowflake vs Redshift: Snowflake has true separation of storage/compute, instant elasticity, and cross-cloud support — Redshift\'s new serverless offerings are catching up but still lag on multi-engine interop. Snowflake vs BigQuery: BigQuery is serverless-first (no warehouses to manage), charges per-TB scanned rather than per-second of compute, and is tightly coupled to GCP — Snowflake is multi-cloud, more predictable for steady workloads, and has richer governance and data sharing.' },
      { question: 'What Snowflake certifications should I pursue?', answer: 'Start with SnowPro Core — the foundation cert covering architecture, SQL, loading, governance, and performance basics. Then pick an Advanced specialty: SnowPro Advanced: Architect for platform design, Advanced: Data Engineer for pipeline engineering, Advanced: Administrator for platform operations, or Advanced: Data Analyst for BI/analytics. In 2026 there are also newer AI-focused specialties covering Cortex, Document AI, and agentic workflows.' }
    ]
  },
  aws: {
    name: 'AWS',
    color: 'from-orange-500 to-red-500',
    path: '/category/aws',
    description: "Learn AWS data services: S3, Redshift, Glue, Lambda. Master cloud data engineering with Amazon Web Services.",
    longDescription: "Amazon Web Services is the **dominant cloud platform for data engineering** in 2026, and the data-engineering-relevant surface area is far smaller than the full AWS catalog. The services that actually matter day-to-day for data work are: **S3** (the object-storage lake of record that underlies almost every AWS data pipeline), **Glue** (managed Spark + the Glue Data Catalog), **Athena** (serverless SQL over S3), **Redshift** (the managed data warehouse, increasingly serverless), **EMR** (managed Hadoop/Spark/Hive/Presto), **MWAA** (managed Airflow), **Kinesis** and **MSK** (streaming), **Lambda** (serverless compute), and **IAM** (the security layer that touches everything).\n\nOn top of those, the supporting cast you'll wire into production pipelines: **Lake Formation** (fine-grained data lake access control), **DMS** (database migration / CDC), **Step Functions** (state-machine orchestration), **EventBridge** (event routing), **SNS / SQS** (messaging), **Secrets Manager** (credential storage), **CloudWatch** (logs + metrics + alarms), **CloudTrail** (audit logging), and **KMS** (encryption keys).\n\n### What you'll learn in this category\n\n**For beginners**: the AWS data foundations — what S3 actually is, how to design bucket layouts that don't bite you three years later, how IAM roles and policies differ from traditional users + groups, and how to stand up your first Glue + Athena pipeline that reads Parquet from S3 and serves SQL to BI tools.\n\n**For intermediate engineers**: the patterns that separate a working pipeline from a production-ready one — S3 partitioning strategies (event-date vs ingestion-date, Hive-style paths, low-cardinality partition keys), Glue Catalog hygiene, Iceberg and Delta table formats on S3, Redshift Serverless vs provisioned clusters, Kinesis Data Streams vs Firehose vs MSK decision trees, and MWAA cost management.\n\n**For senior / staff engineers**: architecture decisions at scale — multi-account landing zone design, cross-account data sharing via Lake Formation + resource policies, disaster recovery across regions, **SCP guardrails** at the org level, and how to integrate AWS services with external data platforms (Snowflake storage integrations, Databricks on AWS, Fivetran + AWS).\n\n**For interview prep**: AWS-certification-aligned content (Solutions Architect, Data Analytics Specialty, Security Specialty) plus the real-world interview questions about S3 consistency, IAM trust policies, VPC endpoint selection, and cost modeling across Glue vs EMR vs Lambda for a given workload.",
    faqs: [
      { question: 'What AWS services should a data engineer learn first?', answer: 'Start with the core four: S3 (object storage — the foundation of every AWS data pipeline), IAM (security and access — you cannot avoid it), Athena (serverless SQL over S3 — the quickest way to query data), and Glue (managed Spark + the Glue Data Catalog — the metadata backbone). Once those click, add Lambda (serverless compute), Redshift or Redshift Serverless (warehouse), and MWAA (managed Airflow) based on your team\'s stack.' },
      { question: 'Should I use Redshift or Snowflake on AWS?', answer: 'Redshift is AWS-native, integrates tightly with S3, Lake Formation, IAM, and the rest of the AWS ecosystem — pick it if you\'re all-in on AWS and want one vendor for support and billing. Snowflake runs on AWS too (plus Azure and GCP), has true independent storage/compute separation, better multi-engine interop via Iceberg, and stronger cross-account data sharing. For multi-cloud or data-sharing-heavy use cases, Snowflake typically wins; for deep AWS integration, Redshift is fine.' },
      { question: 'What is the Glue Data Catalog and why does it matter?', answer: 'The Glue Data Catalog is a managed Apache Hive-compatible metastore — a central registry of databases, tables, and their schemas/partitions/locations. It underlies Athena queries, Redshift Spectrum external tables, EMR Spark/Hive reads, and Lake Formation access control. Keep it clean: define tables once, avoid duplicate entries, and use Iceberg via Glue for transactional lakehouse tables.' },
      { question: 'When should I use Lambda vs Glue vs EMR for data processing?', answer: 'Lambda: event-driven, <15 minutes, <10 GB memory, <10 GB disk — great for small transforms, webhook handlers, S3 event responders. Glue: Spark jobs without cluster management, per-minute billing, good for scheduled ETL in the 1-100 GB range. EMR: large Spark at scale, cheaper per-core if you run continuously, but you own the cluster operations. ECS/Fargate: custom runtimes or long-running services. Pick based on job duration, memory footprint, and how much ops you want to own.' },
      { question: 'How should I structure S3 partitions for analytics?', answer: 'Partition by event date (not ingestion date) for time-series tables: s3://bucket/table/year=2026/month=04/day=28/. Keep partition cardinality low (100s not millions — a million tiny partitions wrecks performance). Use Hive-style key=value paths so Athena, Redshift Spectrum, and Glue crawlers auto-detect them. For lakehouse tables, use Iceberg or Delta — their hidden partitioning is smarter and avoids the classic over-partitioning trap.' },
      { question: 'What is AWS Lake Formation and do I need it?', answer: 'Lake Formation adds fine-grained access control (row-level, column-level, tag-based) on top of the Glue Data Catalog and S3. It replaces the brittle pattern of ACL-ing IAM roles against S3 prefixes with a proper grant-based model. You need it when you have regulated data (PII, finance, healthcare), multiple teams sharing a lake, or cross-account access requirements. For simple single-team lakes, plain IAM + S3 bucket policies may be enough.' },
      { question: 'What AWS certifications matter for data engineers?', answer: 'AWS Certified Data Engineer — Associate is the modern DE cert (replaced the older Big Data Specialty). AWS Certified Solutions Architect — Associate is a strong general baseline. AWS Certified Data Analytics — Specialty (retired but still referenced) covered analytics services deeply. For security-heavy roles, add AWS Certified Security — Specialty. Certs prove breadth; production experience proves depth. Aim for one cert plus hands-on project work.' }
    ]
  },
  azure: {
    name: 'Azure',
    color: 'from-blue-600 to-indigo-600',
    path: '/category/azure',
    description: "Explore Azure data services from Data Factory to Synapse Analytics. Complete guide for data engineers.",
    longDescription: "Microsoft Azure is the **#2 cloud for data engineering** and the #1 cloud inside most Microsoft-heavy enterprises. In 2026 the Azure data stack has consolidated around two poles: the new **Microsoft Fabric** unified SaaS platform (OneLake + Data Factory + Spark notebooks + Power BI + Synapse Real-Time Intelligence, all on a single SKU) and the classic services that still run most production workloads: **ADLS Gen2** (storage), **Azure Data Factory** (orchestration + ingest), **Synapse Analytics** (warehouse + Spark + Serverless SQL), **Databricks on Azure**, **Event Hubs** (Kafka-compatible streaming), **Azure Functions** (serverless compute), and **Azure SQL / Postgres / Cosmos DB** (operational stores).\n\nThe tutorials in this category cover **both poles**: Fabric as the forward-looking default for greenfield Microsoft-shop projects, and the classic services for the massive installed base that won't migrate overnight — plus the integration patterns that matter when a project spans both (OneLake shortcuts into ADLS, Fabric Lakehouse reading Synapse Spark tables, cross-workspace data sharing).\n\n### What you'll find here\n\n**Foundations**: ADLS Gen2 setup (always enable Hierarchical Namespace at account creation — you can't add it later), AAD / Entra ID identity and role assignment, managed identities for service-to-service auth, Azure Key Vault for secrets, and the networking basics (private endpoints, VNet integration, firewall rules) that a pipeline engineer must understand.\n\n**Ingest and orchestration**: Azure Data Factory Copy Activity for bulk moves, Mapping Data Flows for visual ETL (compiled to Spark under the hood), Self-Hosted Integration Runtime for on-prem sources, pipeline triggers (schedule, tumbling window, event), parameters and variables, and Git integration for CI/CD.\n\n**Compute choices**: Synapse Dedicated SQL vs Serverless SQL vs Spark Pools vs Databricks vs Fabric Lakehouse — when each is the right pick, cost modeling, and how to avoid the classic trap of choosing Synapse Dedicated for workloads that should have been Fabric or Databricks.\n\n**Power BI integration**: DirectLake mode over OneLake, DirectQuery vs Import vs DirectLake decision trees, semantic models in Fabric, and how to structure a gold layer that Power BI can consume cleanly.\n\n**Migration**: moving from Synapse dedicated SQL pools to Fabric Warehouse, from ADF to Fabric Data Factory, and cross-cloud migrations from AWS/GCP into Azure-native stacks.",
    faqs: [
      { question: 'Should I start with Microsoft Fabric or classic Azure Synapse/ADF?', answer: 'For greenfield Microsoft-shop projects in 2026, default to Microsoft Fabric — it\'s where Microsoft is investing, it unifies OneLake + Data Factory + Spark + Power BI under one bill, and it has tight Entra ID + Purview + Power BI integration out of the box. Stay on classic Synapse/ADF only if you have a large existing estate with inertia, specific dedicated SQL pool features you can\'t replace yet, or hard regulatory constraints that Fabric doesn\'t meet.' },
      { question: 'What is Microsoft Fabric and how is it different from Azure Synapse?', answer: 'Fabric is Microsoft\'s unified SaaS data platform: OneLake (Delta Lake based storage), Data Factory (pipelines + dataflows), Synapse engines (warehouse + lakehouse + real-time), Data Science workspaces, and Power BI — all on one SKU (capacity units). Classic Synapse is a bundle of independent services (dedicated SQL pools, serverless SQL, Spark pools, ADF). Fabric simplifies billing, identity, and storage unification but abstracts away some of the lower-level control Synapse gave you.' },
      { question: 'What is ADLS Gen2 and how does it differ from Blob Storage?', answer: 'ADLS Gen2 is Azure Data Lake Storage Gen2 — Azure Blob Storage with a Hierarchical Namespace (HNS) enabled. HNS gives you real directories (not prefix flattening), POSIX-like permissions via ACLs, and faster operations for rename/delete across folders. HNS must be enabled at account creation time — you cannot convert a regular blob account into ADLS Gen2 later. For any data-lake workload, always create the account with HNS enabled.' },
      { question: 'Should I use Azure Databricks or Azure Synapse Spark?', answer: 'Azure Databricks is the full Databricks product (Delta Lake, Unity Catalog, MLflow, Photon, Mosaic AI) running on Azure infrastructure with deep Entra ID integration — pick it when you want the Databricks feature set and can pay the Databricks premium. Synapse Spark Pools are Microsoft-managed Spark tightly integrated with Synapse Analytics — simpler and cheaper but lag Databricks on features. In Fabric, the Spark compute is also Microsoft-managed and shares the OneLake storage layer.' },
      { question: 'What is Azure Data Factory used for?', answer: 'Azure Data Factory is Microsoft\'s managed orchestration + ingest service — think "visual SSIS for the cloud" plus pipeline scheduling. Copy Activity moves data between 90+ sources/sinks, Mapping Data Flows provide visual ETL that compiles to Spark, and Integration Runtimes give you both cloud-hosted and self-hosted compute for on-prem sources. In Fabric, this functionality is re-packaged as Fabric Data Factory with tighter OneLake integration.' },
      { question: 'What Azure certifications matter for data engineers?', answer: 'Microsoft Certified: Azure Data Engineer Associate (DP-203, or its 2026 replacement) is the baseline DE cert — covers ADLS, Databricks, Synapse, Data Factory, Stream Analytics. Microsoft Certified: Fabric Analytics Engineer Associate (DP-600) covers Fabric specifically. AZ-104 (Azure Administrator) is useful for platform roles. For security-heavy roles, SC-200 or SC-300. Certs are a good forcing function for breadth; pair them with hands-on project work.' },
      { question: 'How do I choose between Synapse Dedicated SQL, Serverless SQL, and Spark?', answer: 'Dedicated SQL Pool: always-on MPP warehouse, high query performance, expensive to leave running — use for steady BI workloads with known concurrency. Serverless SQL: pay-per-TB scanned over ADLS Parquet, cheap for ad-hoc and exploration — use when workloads are bursty or data already lives in ADLS. Spark Pool: notebook-style distributed Python/Scala/SQL for ETL and ML, great for transformation. In Fabric, all three converge under capacity-based pricing.' }
    ]
  },
  sql: {
    name: 'SQL',
    color: 'from-slate-400 to-gray-500',
    path: '/category/sql',
    description: "Master SQL with advanced queries, optimization techniques, and best practices for data transformation.",
    longDescription: "**SQL is the single most durable skill in data engineering.** Cloud warehouses come and go, orchestrators get replaced, Python libraries churn every two years — but the SQL you write against Snowflake today reads almost identically to what ran on Oracle in 2005, and the analytical queries you learn in 2026 will still be running in 2040. If you're choosing one language to master as a data engineer, make it SQL.\n\nThis category covers SQL across the spectrum: **query authoring** (SELECT, joins, subqueries, CTEs, window functions, aggregations, UNIONs, set operations), **modern dialects** (Snowflake, BigQuery, Postgres, Databricks SQL, DuckDB, Redshift, MySQL, SQL Server — where they diverge and why), **performance tuning** (reading EXPLAIN plans, understanding cardinality estimates, index design, partition pruning, predicate pushdown), **patterns for data engineering** (CTEs for modular transforms, window functions for top-N / running totals / deduplication, MERGE/UPSERT for idempotent loads, recursive CTEs for hierarchies), and **interview prep** (the question patterns that separate candidates in SQL screens).\n\n### What makes the content here different\n\n**Dialect-aware**: Most SQL tutorials on the web assume MySQL or Postgres and silently break on warehouses. Our content flags where Snowflake's QUALIFY, BigQuery's ARRAY functions, Postgres's LATERAL, or SQL Server's CROSS APPLY diverge from ANSI, so you write portable SQL where possible and dialect-specific SQL where it's worth it.\n\n**Performance-first**: Every non-trivial query tutorial walks through the query plan, not just the result. You'll learn to read Snowflake's QUERY_PROFILE, BigQuery's execution details, Postgres's EXPLAIN ANALYZE, and Databricks' Spark UI — because knowing why a query is slow is how you become the SQL expert on your team.\n\n**Data-engineering-focused patterns**: deduplication with ROW_NUMBER + QUALIFY, SCD Type 2 merging with MERGE + deterministic business keys, gap-filling with calendar spines, session-ization with LAG + conditional aggregation, top-N-per-group with QUALIFY + PARTITION BY, and the accounting-style patterns for running totals and period-over-period deltas that every dashboard needs.\n\n**Interview-ready**: Every major SQL interview question pattern (second-highest salary, consecutive logins, hierarchical reports-to, cumulative metrics, top-N, deduplication) with multiple solutions, edge-case analysis, and dialect-portability notes.",
    faqs: [
      { question: 'What SQL topics should a data engineer master?', answer: 'The core eight: (1) joins (inner, left, right, full, cross, semi, anti — plus when each is appropriate), (2) window functions (ROW_NUMBER, RANK, LEAD, LAG, running totals, frame clauses), (3) CTEs and recursive CTEs, (4) aggregation and GROUP BY (including GROUPING SETS / ROLLUP / CUBE), (5) subqueries and correlated subqueries, (6) set operations (UNION, INTERSECT, EXCEPT), (7) MERGE / UPSERT, (8) data types and casting. Master those and 95% of SQL tasks are trivial.' },
      { question: 'How do I get better at writing SQL?', answer: 'Four steps, in order. (1) Write SQL every day — on real datasets, not tutorial examples. (2) Always look at the query plan after the result — EXPLAIN, EXPLAIN ANALYZE, QUERY_PROFILE, whatever your engine offers. (3) Do SQL katas on StrataScratch, LeetCode SQL, or DataLemur for 30 minutes a day. (4) Read other people\'s SQL — pull requests in dbt projects and Snowflake sample queries are gold. Volume + plan-reading + puzzle practice is the combination.' },
      { question: 'What is a window function and why do they matter?', answer: 'Window functions compute per-row aggregates that respect a partition and ordering without collapsing rows with GROUP BY. Running totals, rolling averages, row rankings, top-N per group, period-over-period deltas, deduplication, session-ization — all become one-liners. They\'re the single highest-leverage SQL feature most engineers learn, and fluency with them separates intermediate from advanced SQL skills.' },
      { question: 'Should I learn Postgres, MySQL, or a cloud warehouse SQL first?', answer: 'If you\'re going into data engineering, start with a cloud warehouse dialect — Snowflake, BigQuery, or Databricks SQL — because that\'s what production analytics looks like in 2026. Postgres is a strong second choice (free, widely deployed, great for OLTP and operational stores). MySQL is fine but has the quirkiest SQL dialect of the major databases and teaches bad habits. SQL Server is important if you\'re in a Microsoft shop. ANSI SQL is the shared foundation; dialect details come later.' },
      { question: 'What is a CTE and how is it different from a subquery?', answer: 'A Common Table Expression (CTE) is a named, SELECT-defined temporary result set declared with WITH at the top of a query. It\'s semantically similar to a subquery but vastly more readable, supports recursion, and many engines materialize the CTE once for multiple references. Subqueries are inline and re-evaluated per reference. Modern SQL strongly prefers CTEs for any non-trivial query — they\'re the basis of clean, modular dbt and stored-procedure code.' },
      { question: 'How do I tune a slow SQL query?', answer: 'Four-step runbook: (1) Read the query plan (EXPLAIN on Postgres, QUERY_PROFILE on Snowflake, Spark UI on Databricks) — find the most-expensive operator. (2) Check for accidental cartesian joins or fanout — aggregate cardinalities should match your expectations. (3) Check for missing predicates that would prune partitions / use indexes. (4) Rewrite to reduce intermediate result size (push filters earlier, avoid SELECT *, split into staged CTEs). Only after these four should you reach for heavier tools (clustering keys, materialized views, indexes, partitioning changes).' },
      { question: 'What is MERGE / UPSERT and when do I use it?', answer: 'MERGE (ANSI standard; UPSERT in Postgres/MySQL parlance) is a single-statement INSERT-if-not-exists / UPDATE-if-exists / DELETE-if-matched operation. It\'s the backbone of idempotent data pipelines: rerunning a MERGE produces the same end state as running it once. Essential for CDC pipelines, SCD merges, and any incremental load pattern. The key is a reliable business key — without one, MERGE produces duplicates or updates the wrong rows.' }
    ]
  },
  airflow: {
    name: 'Airflow',
    color: 'from-purple-500 to-violet-500',
    path: '/category/airflow',
    description: "Apache Airflow tutorials for workflow orchestration. Build, schedule, and monitor data pipelines effectively.",
    longDescription: "**Apache Airflow is the incumbent data orchestrator** — the Airbnb-born, Apache-governed, now-ubiquitous scheduler that powers more production data pipelines than any other tool in 2026. It didn't invent workflow orchestration, but it defined what modern data teams expect from one: pipelines-as-Python-code, DAGs of tasks with explicit dependencies, a UI that actually shows you what ran and why it failed, sensible retries and SLAs, and a massive operator ecosystem that can talk to virtually every data system you'll encounter.\n\nThe tutorials in this category cover Airflow across three axes: **authoring** (how to write DAGs that survive production — idempotency, TaskFlow API, operators vs sensors, XCom patterns, dynamic task mapping), **operations** (cluster sizing, scheduler tuning, DAG parsing performance, Celery vs Kubernetes executors, self-hosted vs managed), and **integration** (the managed flavors — MWAA, Composer, Astronomer — plus how Airflow plays with dbt, Snowflake, Databricks, Spark, and the rest of the stack).\n\n### What you'll learn here\n\n**For beginners**: the core Airflow mental model — DAGs, tasks, operators, task instances, execution dates vs data intervals (the #1 thing everyone gets wrong), retries, and the web UI. The getting-started tutorials walk through installing Airflow locally with Docker, writing your first DAG, and triggering it via CLI and UI.\n\n**For intermediate engineers**: the TaskFlow API (the modern 2.x way to author DAGs with @task decorators), dynamic task mapping for variable-width fanout, sensors vs deferrable operators (the 2026 default for anything waiting on external state — massively cheaper than classic sensors), XCom patterns that don't break at scale, and the difference between operators and providers.\n\n**For senior / staff engineers**: scheduler tuning (parser processes, min_file_process_interval, pool sizing), Celery vs Kubernetes executor tradeoffs, self-hosted Helm chart operations, migration from 1.x to 2.x to 3.x, cost modeling across MWAA / Composer / Astronomer, and orchestrator-of-orchestrators patterns where Airflow kicks off dbt, Spark, or Snowflake Tasks.\n\n**For interview prep**: the common Airflow interview questions (what happens if a DAG parse fails, how deferrable operators work, how to handle backfills with date-specific data, how to avoid XCom pitfalls) and the DAG review checklist that engineering managers use when promoting Airflow code to production.",
    faqs: [
      { question: "What is Apache Airflow and why is it so popular?", answer: "Airflow is a Python-based workflow orchestrator that turned cron-plus-bash-scripts-plus-hope into a real discipline: DAGs of tasks with explicit dependencies, retries, SLAs, a UI showing every run and failure, and a massive operator ecosystem. It's popular because it was the first tool to treat pipelines as code (not XML / drag-and-drop), has a massive open-source community, and is available as managed services (MWAA, Composer, Astronomer) on every major cloud." },
      { question: "Should I use Airflow, Dagster, or Prefect?", answer: "Airflow: largest ecosystem, most operators, widest hiring market — safest default for 2026 if your team values maturity and interoperability. Dagster: best developer experience, strongest data-asset model, growing fast — pick if your team is starting fresh and cares about data-asset semantics. Prefect: cleanest Python API, great for smaller teams, but smaller ecosystem. Airflow is still the market leader by a wide margin; the other two are legitimate choices but not default." },
      { question: "What is a DAG in Airflow?", answer: "DAG stands for Directed Acyclic Graph. In Airflow terms, a DAG is a Python file that defines a schedule, a set of tasks, and their dependencies (which tasks must run before which). Airflow scans your dags/ folder every few minutes, parses the DAGs, and schedules them according to their schedule parameter. 'Acyclic' is literal: the graph cannot have cycles, so no task can (directly or transitively) depend on itself." },
      { question: "What is the TaskFlow API and should I use it?", answer: "TaskFlow API is the modern (Airflow 2.0+) way to author DAGs using @task and @dag decorators. Instead of manually instantiating PythonOperators and managing XCom push/pull, you write plain Python functions and Airflow auto-generates the operators and XCom wiring. For new code, always use TaskFlow — it's cleaner, has fewer gotchas, and is what Airflow docs are moving to. Classic operator syntax still works for complex cases where you need custom operator behavior." },
      { question: "MWAA vs Composer vs Astronomer — which managed Airflow should I pick?", answer: "MWAA (AWS): deeply integrated with AWS services (VPC, IAM, CloudWatch), moderate cost, slightly older Airflow versions. Composer (GCP): tight GCP + Kubernetes integration, good for GCP-heavy shops, can be pricey. Astronomer (cloud-agnostic): best developer experience, best CI/CD (Astro CLI), fastest to new Airflow versions, highest price point. Pick MWAA if you're AWS-native, Composer if GCP-native, Astronomer if you want the best DX and can pay for it." },
      { question: "What is execution_date and why does it trip up new engineers?", answer: "execution_date (now renamed to logical_date in 2.2+) is the START of the interval the DAG run covers, not the end. A daily DAG with schedule='@daily' that runs at midnight Feb 5 has execution_date = Feb 4 00:00 (it's processing yesterday's data). Use data_interval_start / data_interval_end instead of execution_date in new code. This naming confusion is the #1 cause of off-by-one-day bugs in Airflow pipelines." },
      { question: "How do I make Airflow tasks idempotent?", answer: "Idempotent = rerunning a task produces the same result. Patterns: (1) Use MERGE/UPSERT with dedup keys, not INSERT-only. (2) Delete-then-insert for batch loads. (3) Parameterize every task by data_interval_start/end — never by current time. (4) Make filenames / table names deterministic from the interval, not from the run time. (5) Assume every task will run 2-3 times (retries, manual clears) and verify the end state is identical each time." }
    ]
  },
  dbt: {
    name: 'dbt',
    color: 'from-pink-500 to-rose-500',
    path: '/category/dbt',
    description: "Data Build Tool (dbt) tutorials for modern data transformation and analytics engineering best practices.",
    longDescription: "**dbt (data build tool)** turned SQL engineers into software engineers. Before dbt, data transformations were a pile of stored procedures, hand-scheduled DDL, and duct-taped airflow tasks with no version control, no tests, and no documentation. After dbt, transformations became **modular SELECT statements in git, with unit-test-like assertions, auto-generated lineage docs, and a DAG-aware runner** that handles dependencies automatically. It's the single biggest productivity shift in analytics engineering of the last decade.\n\nThis category covers dbt across the whole lifecycle: **getting started** (dbt Core vs dbt Cloud, project init, first model, first test, first docs), **authoring** (models, sources, ref(), tests, seeds, snapshots, macros, materializations), **scaling** (Slim CI with state:modified+, incremental materializations, performance tuning, multi-project with dbt Mesh), **operations** (scheduling, monitoring, CI/CD, cost management), and **ecosystem** (dbt-on-Snowflake, dbt-on-BigQuery, dbt-on-Databricks, dbt + Airflow, dbt + Dagster).\n\n### What you'll find here\n\n**Foundations**: the project structure dbt Labs recommends (staging → intermediate → marts), how ref() and source() build the DAG automatically, why YAML descriptions and tests are not optional, and the four materializations you actually use in production (view, table, incremental, ephemeral).\n\n**Intermediate patterns**: Jinja macros that remove SQL boilerplate without making models unreadable, incremental materializations with the right unique_key and merge/insert_overwrite strategy, snapshots for SCD Type 2 with dbt_valid_from / dbt_valid_to, sources with freshness thresholds for monitoring, and generic tests (unique, not_null, relationships, accepted_values) that catch 90% of data quality issues.\n\n**Scaling**: Slim CI (the single biggest productivity win after the 100-model mark — rebuild only state:modified+), dbt-on-Snowflake with Dynamic Tables + Streams, dbt Mesh for multi-project dbt at 1000+ models, and cost management (warehouse sizing per dbt environment, --defer patterns for dev).\n\n**Ecosystem integrations**: calling dbt from Airflow (not the other way around), calling dbt from Dagster with native asset integration, dbt + Snowflake best practices, dbt + BigQuery BI Engine, dbt + Databricks Unity Catalog.\n\n**Interview prep**: dbt interview questions (materializations, incremental strategies, macro patterns, Slim CI) and the engineering manager's code-review checklist for dbt PRs.",
    faqs: [
      { question: "What is dbt and why has it become the standard?", answer: "dbt is a Python-based tool that compiles SQL templates (Jinja) into executable SQL and runs them in dependency order inside your warehouse. It turned data transformation into software engineering: version control, modular models with ref() dependencies, automated testing, auto-generated lineage docs, and a CLI that ties it all together. It became the standard because it solved the real pain of unscheduled stored procedures + broken lineage + no tests, with a workflow that feels like git-based software development." },
      { question: "Should I use dbt Core or dbt Cloud?", answer: "dbt Core: free, open-source CLI. You bring your own git repo, CI/CD, scheduler, and hosting. Great for teams that already have those and want full control. dbt Cloud: managed service from dbt Labs with a web IDE, scheduler, CI checks, documentation hosting, semantic layer, and paid support. Pick Cloud if you want to skip the platform work and can pay the per-seat cost; pick Core if you want zero vendor lock-in and have the platform capacity." },
      { question: "What is Slim CI in dbt?", answer: "Slim CI = running dbt build --select state:modified+ --defer --state path/to/prod-manifest.json on pull requests. It rebuilds only the models that changed in the PR plus everything downstream, using the production versions of upstream models via --defer. Without Slim CI, every PR rebuilds the entire warehouse — CI takes hours. With it, CI takes minutes. It's the single biggest productivity win once you're past ~100 models." },
      { question: "What are dbt materializations?", answer: "Materialization is how dbt physically represents a model in the warehouse. Four main types: view (CREATE OR REPLACE VIEW — cheap, always fresh), table (CREATE OR REPLACE TABLE — recomputes every run), incremental (appends/merges only new rows — cheap for large tables), and ephemeral (inlined as a CTE into downstream models — never materialized). Pick based on data size, query frequency, and freshness requirements. There are also adapter-specific types like dynamic_table on Snowflake." },
      { question: "How do I write my first dbt project?", answer: "1. Install dbt Core or sign up for dbt Cloud. 2. Run dbt init my_project — scaffolds a project. 3. Configure profiles.yml with your warehouse credentials. 4. Replace the example models with your own: add sources YAML pointing at your raw tables, write staging models (one per source), write mart models on top. 5. Add tests (unique + not_null on PKs, relationships on FKs). 6. Run dbt build to execute everything. 7. Run dbt docs generate && dbt docs serve to view lineage. Our beginner tutorials walk through each step." },
      { question: "What's the difference between a source, a model, and a seed in dbt?", answer: "Source: a raw table ingested into your warehouse by an external tool (Fivetran, Snowpipe, etc.) — you declare it in sources YAML and reference it with source(). Model: a transformed SELECT statement in your dbt project that dbt will materialize — referenced by other models via ref(). Seed: a CSV file committed to the repo that dbt loads into the warehouse as a table — use for small reference data (mappings, dimension values) that rarely change." },
      { question: "Can I use dbt with Airflow?", answer: "Yes — this is one of the most common dbt patterns. Airflow orchestrates the pipeline end-to-end (ingest → dbt → reverse-ETL) while dbt handles the in-warehouse transformation step. Use the official Cosmos library (astronomer-cosmos) to auto-generate one Airflow task per dbt model with proper dependencies, or use BashOperator to call dbt run / dbt build directly for simpler setups. Avoid cramming the whole dbt project into a single BashOperator — you lose per-model retries and observability." }
    ]
  },
  python: {
    name: 'Python',
    color: 'from-yellow-500 to-orange-500',
    path: '/category/python',
    description: "Python for data engineering with pandas, NumPy, and more. Master data processing with Python libraries.",
    longDescription: "**Python is the lingua franca of data engineering.** In 2026 it shows up in every layer of the stack: orchestration (Airflow, Dagster, Prefect), transformation (Snowpark, PySpark, dbt Python models, Polars, DuckDB), ML (scikit-learn, PyTorch, XGBoost, MLflow), ingestion (custom extractors, API consumers, CDC scripts), and glue code tying everything together. A senior data engineer doesn't have to be a Python expert, but fluency with a specific set of idioms separates the engineers who ship reliable Python pipelines from those who ship flaky ones.\n\nThis category covers the DE-relevant subset of Python: the idioms, libraries, and patterns you reach for weekly — not a general Python tutorial. **Core language patterns**: type hints, dataclasses, Pydantic, context managers, decorators, async/await, generators, exception handling. **Data libraries**: pandas, Polars (the 2026 default for medium-data work), DuckDB (embedded analytics over pandas/arrow/parquet), Apache Arrow, NumPy. **Database connectivity**: SQLAlchemy 2.x, psycopg, snowflake-connector-python, google-cloud-bigquery, databricks-sql-connector. **Tooling**: uv (the 2026 default — ~100× faster than pip), poetry, pyproject.toml, ruff for linting, mypy for type checking, pytest for testing. **Patterns**: retries with tenacity, observability with OpenTelemetry, secrets management, structured logging, config management with Pydantic Settings.\n\n### What you'll learn in this category\n\n**For beginners**: Python fundamentals aimed at DE workloads — reading/writing CSV and JSON, connecting to a database, basic pandas DataFrame ops, environment setup with uv + pyproject.toml, running your first script in production, and the minimum pytest skills every DE needs.\n\n**For intermediate engineers**: the patterns that separate working code from reliable code — type hints and mypy, Pydantic for config and data validation, retries with tenacity, structured logging, chunking large datasets, memory-efficient iteration, async HTTP for parallel API calls, and avoiding pandas performance traps (iterrows, apply, chained assignment).\n\n**For senior / staff engineers**: the tools you reach for at scale — Polars for datasets that break pandas, DuckDB for embedded analytics, packaging Python for Snowpark UDFs, writing reusable dbt macros vs Python models, debugging production Python, profiling slow scripts, and the tradeoffs between sync and async for I/O-bound workloads.\n\n**For interview prep**: Python coding questions tuned for DE interviews (CSV parsing, log-file analysis, rate-limited API calls, retry logic, date-range iteration) with working solutions and edge-case discussion.",
    faqs: [
      { question: "Do I need to learn Python for data engineering?", answer: "Yes. SQL is still the primary interface for analytics and transformation, but nearly every modern orchestrator, ingestion tool, and cloud SDK expects Python code. Airflow DAGs, Snowpark UDFs, dbt Python models, Dagster assets, PySpark jobs — all Python. You don't need to be a Python expert; you need to be fluent enough to read, modify, and write DE-specific scripts (data loaders, pipeline logic, glue code, tests). Aim for intermediate Python: enough to write a 200-line pipeline without looking up basic syntax." },
      { question: "Should I use pandas, Polars, or DuckDB?", answer: "pandas: the default for small-to-medium datasets, most documentation and Stack Overflow coverage, works everywhere. Polars: 5-10× faster than pandas, cleaner API, multithreaded by default — use for medium-to-large datasets where pandas gets slow. DuckDB: embedded SQL engine over Parquet/CSV/pandas/arrow, excellent for analytics-style queries on files. In 2026, the rule of thumb: start with pandas, move to Polars if perf bites, use DuckDB when you want SQL over files without a warehouse." },
      { question: "What Python version should I use in 2026?", answer: "Python 3.12 is the modern default — good perf, solid typing support, long upstream support. Python 3.13 ships with experimental free-threaded mode (no-GIL) which is interesting but not yet stable for production. Avoid 3.8 and earlier (EOL, missing modern syntax). For library compatibility, check your stack: PySpark, Snowpark, Airflow all have version constraints. Most DE projects are safe on 3.11 or 3.12." },
      { question: "Should I use pip, poetry, or uv?", answer: "uv (from Astral) is the 2026 default — ~100× faster than pip, drop-in pyproject.toml support, single binary, handles virtualenvs and dependency locking cleanly. Poetry is the established predecessor with similar features but slower. Plain pip + requirements.txt is legacy — fine for trivial scripts, painful for real projects. For any project beyond a single file, use uv + pyproject.toml." },
      { question: "How do I avoid common pandas performance traps?", answer: "Five rules: (1) Never use iterrows() for large DataFrames — it's 100× slower than vectorized ops. (2) Avoid apply() with Python lambdas — use native pandas/numpy ops where possible. (3) Avoid chained assignment (df[df.x > 0]['y'] = 1) — use .loc instead. (4) Set appropriate dtypes on load (CSV readers default to object for many columns). (5) For >1 GB datasets, switch to Polars or DuckDB — pandas becomes the bottleneck, not the warehouse." },
      { question: "How should I test my Python data pipelines?", answer: "Three layers: (1) Unit tests with pytest for pure functions (transformations, parsers, validators) — fast, run on every commit. (2) Integration tests against a sandbox database or sample Parquet files — slower, run on CI. (3) End-to-end tests with a small representative dataset flowing through the full pipeline — slowest, run nightly. Use pytest fixtures for test data, mock external APIs, and assert on output shapes and a handful of spot-checked values rather than full result equality." },
      { question: "What is Pydantic and should I use it?", answer: "Pydantic is a Python library for data validation using type hints — you define a class with typed fields, Pydantic validates inputs and coerces types. It's the de facto standard for config files, API request/response validation, and typed data structures in modern Python. Use it for any structured input (YAML/JSON config, external API responses) — it catches errors at the boundary instead of silently propagating bad data deeper into your pipeline." }
    ]
  },
  gcp: {
    name: 'GCP',
    color: 'from-green-500 to-blue-500',
    path: '/category/gcp',
    description: "Explore Google Cloud Platform services for data engineers, including BigQuery, Dataflow, and Dataproc.",
    longDescription: "**Google Cloud Platform** is the #3 cloud overall but often the #1 cloud for data engineering in analytics-heavy shops, because BigQuery remains arguably the best cloud data warehouse for ad-hoc analytics workloads. The 2026 GCP data stack centers on: **BigQuery** (serverless warehouse — still the benchmark for SQL-over-TB-scale), **Cloud Storage** (object storage, GCS), **Dataflow** (managed Apache Beam for streaming + batch), **Dataproc** (managed Spark/Hadoop), **Composer** (managed Airflow), **Pub/Sub** (streaming), **Cloud Functions** and **Cloud Run** (serverless compute), **Dataplex** (governance + lakehouse), and **Vertex AI** (ML platform with strong Gemini + agent integration).\n\nThe tutorials here cover GCP for data engineers — not the broader GCP application-dev surface. **BigQuery** gets the most coverage because it's the center of most GCP data shops: query optimization, partitioning, clustering, BI Engine, slots vs on-demand pricing, streaming inserts, materialized views, authorized views, row/column-level security, BigLake for external tables over GCS. **Dataflow**: when to pick it over Dataproc, streaming patterns with windowing and triggers, Apache Beam Python vs Java, cost modeling. **Ingestion**: Pub/Sub → Dataflow → BigQuery as the canonical streaming pattern, Datastream for CDC, Data Transfer Service for SaaS connectors, and the newer BigQuery-native Continuous Queries.\n\n### What you'll find here\n\n**Foundations**: GCS bucket design, IAM basics (service accounts, predefined roles, resource hierarchy), setting up a BigQuery dataset, writing your first query, understanding the on-demand pricing trap (you can rack up a big bill scanning TBs by accident).\n\n**BigQuery at scale**: slot reservations, edition selection (Standard / Enterprise / Enterprise Plus), partitioning vs clustering decision trees, materialized views, BI Engine, search indexes, query history analysis, cost attribution via labels, and the newer features (BigQuery ML, vector search, Continuous Queries, BigQuery Studio notebooks).\n\n**Dataflow and streaming**: Pub/Sub → Dataflow → BigQuery streaming pattern, windowing and late data, Beam Python SDK fundamentals, when to use Dataflow templates vs custom pipelines, and how to reason about Dataflow cost.\n\n**Governance**: Dataplex as the unified catalog + governance layer, data lineage tracking, tag templates, BigQuery row/column security, VPC Service Controls for network-level isolation.\n\n**Migration**: moving from on-prem Hadoop to GCP-native stacks, AWS-to-GCP warehouse migrations, and the canonical patterns for hybrid deployments where BigQuery consumes data from other clouds.",
    faqs: [
      { question: "What makes BigQuery different from Snowflake or Redshift?", answer: "BigQuery is fully serverless — there are no warehouses to size or manage. You submit a query, BigQuery allocates slots (compute units) dynamically, and you pay per TB scanned (on-demand) or per slot-hour (reservations). It's the most hands-off warehouse to operate and scales to massive queries without pre-provisioning. Downsides: less predictable cost on on-demand pricing (a bad query can scan TBs), fewer cross-cloud features than Snowflake, and tight GCP coupling. For analytics-heavy workloads on GCP, BigQuery is usually the right choice." },
      { question: "When should I use Dataflow vs Dataproc?", answer: "Dataflow (managed Apache Beam): fully serverless, streaming-first, great for pipelines that mix batch and streaming, autoscaling, idiomatic for GCP-native stacks. Dataproc (managed Spark/Hadoop): cluster-based, cheaper for heavy sustained batch workloads, better if your team already has Spark experience. Rule of thumb: Dataflow for streaming and greenfield batch; Dataproc for lifting-and-shifting existing Spark/Hadoop workloads or running large sustained Spark jobs." },
      { question: "How is BigQuery pricing structured?", answer: "Two compute models: (1) on-demand — pay per TB scanned ($5-$7 per TB depending on region), zero commitment, great for small/sporadic workloads but dangerous for exploration (a SELECT * on a big table can cost hundreds). (2) Editions with slot reservations — commit to slots monthly or annually for predictable cost and better performance guarantees. Storage is billed separately (active $0.02/GB-mo, long-term $0.01/GB-mo after 90 days of no modification). Set project-level cost caps to prevent runaway queries." },
      { question: "What is BigQuery partitioning vs clustering?", answer: "Partitioning: physically splits a table into partitions by a column (typically DATE or INTEGER range), enabling partition pruning when you filter on that column. Up to 4000 partitions per table. Clustering: co-locates data by up to 4 columns within each partition, enabling further pruning on filters and sorting costs. Rule of thumb: partition by event date (most common), cluster by the 2-4 most-filtered dimensions. Together they dramatically cut scan costs on large tables." },
      { question: "What is Dataplex and do I need it?", answer: "Dataplex is GCP's unified data governance and lakehouse layer — it discovers and registers data across BigQuery, GCS, and Dataproc; tracks lineage; manages data quality tasks; and supports tag-based metadata. For mid-to-large data estates with multiple sources (BQ + GCS + Spark), Dataplex gives you one catalog + governance plane. For single-team BigQuery-only setups, you can get by with native BQ features (datasets, tags, IAM) without it." },
      { question: "What GCP certifications matter for data engineers?", answer: "Google Cloud Professional Data Engineer is the flagship DE cert — covers BigQuery, Dataflow, Dataproc, Pub/Sub, Bigtable, Cloud Storage, IAM, and the broader data ecosystem. Associate Cloud Engineer is a good baseline for GCP fundamentals. Professional Cloud Architect is useful if your role spans platform design. Take Data Engineer first if you're a DE; it's the most directly relevant." },
      { question: "How does GCP compare to AWS and Azure for data engineering?", answer: "GCP strengths: BigQuery (usually the best cloud warehouse for analytics), strong AI/ML (Vertex AI, Gemini), clean networking/IAM model, competitive pricing. GCP weaknesses: smaller ecosystem than AWS, fewer enterprise-oriented services, some services are more Google-opinionated and less flexible. AWS: biggest service catalog and ecosystem. Azure: best Microsoft-shop integration (Power BI, Entra ID, Office 365). For analytics-heavy shops, GCP is often a top-2 choice alongside Snowflake on AWS." }
    ]
  },
  // ✅ NEW
  databricks: {
    name: 'Databricks',
    color: 'from-red-500 to-orange-500',
    path: '/category/databricks',
    description: "Databricks lakehouse platform tutorials: Delta Lake, Apache Spark, Unity Catalog, and MLflow for data engineering.",
    longDescription: "**Databricks** is the lakehouse platform built around **Apache Spark** and **Delta Lake** — the Berkeley AMPLab-spinoff-turned-$50B-company that defined the modern lakehouse pattern (transactional tables on object storage, one copy of data for both BI and ML). In 2026 the Databricks stack is organized around: **Unity Catalog** (governance and metastore), **Delta Lake** (the open transactional table format), **Photon** (the vectorized C++ engine that accelerates SQL + Delta workloads), **Delta Live Tables / Lakeflow** (declarative pipelines), **Databricks SQL** (BI-oriented SQL warehouses), **Mosaic AI** (GenAI + ML platform), **MLflow** (model registry / tracking), and the workspace experience (notebooks, jobs, clusters, repos).\n\nThis category covers Databricks end-to-end for data engineers — not for data scientists or ML engineers specifically, though there's overlap. **Platform fundamentals**: workspaces, compute types (all-purpose clusters vs job clusters vs SQL warehouses vs serverless), runtime versions, Unity Catalog three-level namespace (catalog.schema.table), cluster policies, and cost management.\n\n**Delta Lake core**: OPTIMIZE + ZORDER, VACUUM, Time Travel, MERGE patterns, streaming reads/writes, Change Data Feed, deletion vectors, liquid clustering (the 2024-2026 default for new tables — no more ZORDER tuning). **Pipeline authoring**: Delta Live Tables (DLT) for declarative medallion pipelines with expectations, streaming + batch unified via Structured Streaming, Auto Loader for incremental file ingestion, and the modern Lakeflow DAG.\n\n### What you'll learn in this category\n\n**For beginners**: what a lakehouse is, the Databricks workspace UI, creating your first cluster and notebook, writing PySpark and SQL, reading/writing Delta tables, Unity Catalog basics (why you should always use it, never fall back to Hive Metastore).\n\n**For intermediate engineers**: picking the right cluster type for a workload, OPTIMIZE + VACUUM + liquid clustering mechanics, Delta Lake CDC patterns, DLT vs plain notebook jobs, Structured Streaming for real-time, Auto Loader patterns, Photon enablement (free speed — always turn it on), cost management with cluster policies and auto-termination.\n\n**For senior / staff engineers**: multi-workspace designs, Unity Catalog federation, cross-cloud Delta Sharing (the Databricks equivalent of Snowflake Secure Data Sharing), large-scale ETL on Photon, Spark performance tuning (broadcast joins, skew handling, shuffle tuning), MLflow for DE-adjacent ML workflows, and the Databricks-vs-Snowflake decision for lakehouse architectures.\n\n**For interview prep**: Databricks interview questions (Delta Lake internals, when DLT vs notebook jobs, Unity Catalog model, cluster sizing) and the engineering architect's checklist for evaluating a Databricks deployment.",
    faqs: [
      { question: "What is a lakehouse and how is it different from a warehouse?", answer: "A lakehouse is a data architecture that combines the low-cost, open-format storage of a data lake (Parquet/ORC on object storage) with the transactional guarantees, SQL engine, and governance of a warehouse. Delta Lake, Apache Iceberg, and Apache Hudi are the three table formats that make this possible — they add a transaction log to Parquet files so you get ACID, schema evolution, and time travel. Databricks popularized the term and pattern; Snowflake Iceberg Tables and BigQuery BigLake do the same thing with different branding." },
      { question: "Should I use Databricks or Snowflake?", answer: "Databricks strengths: open lakehouse storage (you own your Delta files on S3/ADLS/GCS), best-in-class Spark + ML + GenAI, strong data science tooling, unified batch + streaming. Snowflake strengths: simpler SQL-first experience, lower operational burden, better governance UX, stronger data sharing, native serverless for more workloads. For ML/data-science-heavy teams and open-table-format requirements: Databricks. For SQL-heavy analytics teams wanting minimal ops: Snowflake. Many large enterprises run both for different workloads; they increasingly overlap." },
      { question: "What is Delta Lake?", answer: "Delta Lake is an open-source transactional table format built on Parquet — a Parquet file layout plus a JSON transaction log (_delta_log) that records every commit. It gives you ACID transactions, schema enforcement and evolution, time travel (query historical versions), MERGE/UPSERT/DELETE, streaming ingest, and compaction. It's the foundation of the Databricks lakehouse and interoperable with Spark, Trino, Presto, Flink, and (via Delta UniForm) readable as Iceberg." },
      { question: "What is Unity Catalog and why must I use it?", answer: "Unity Catalog is Databricks' managed metastore + fine-grained access control layer. It replaces the legacy Hive Metastore with a three-level namespace (catalog.schema.table), centralized IAM-style grants, column and row security, and audit logging. Any new Databricks workspace should use Unity Catalog exclusively — the legacy hive_metastore.default.* pattern loses all the governance features and is deprecated for new development." },
      { question: "All-purpose clusters vs job clusters vs SQL warehouses — which do I use?", answer: "All-purpose clusters: shared, interactive, for notebook development — expensive to leave running, fine for dev. Job clusters: ephemeral clusters that spin up for a single job and terminate — cheap, the right choice for scheduled ETL. SQL warehouses: serverless-ish SQL-optimized compute for BI and dashboard workloads — concurrency scaling, Photon-enabled, pay per query. Wrong choice = 2-3× cost overhead. Rule: interactive dev = all-purpose; scheduled ETL = job; BI = SQL warehouse." },
      { question: "What is Delta Live Tables (DLT) / Lakeflow?", answer: "DLT (rebranded to Lakeflow Declarative Pipelines in 2025) is Databricks' declarative pipeline framework. You write Python or SQL functions decorated with @dlt.table or @dlt.view, Databricks builds the DAG, handles incremental vs full refresh, manages expectations (data quality assertions), streams updates, and autoscales. It's the Databricks equivalent of dbt in some ways, or of Snowflake Dynamic Tables in others — great for medallion-architecture pipelines where declarative semantics fit." },
      { question: "Is Photon worth enabling?", answer: "Yes, essentially always. Photon is Databricks' vectorized C++ execution engine — it accelerates most SQL and Delta workloads by roughly 2× at no additional cost on SQL warehouses and a small premium on job clusters. Turn it on for production clusters unless you're running workloads with UDFs or operations Photon doesn't support (the list shrinks every release). For SQL warehouses it's default-on and you shouldn't disable it." }
    ]
  },
  // ✅ NEW
  salesforce: {
    name: 'Salesforce',
    color: 'from-blue-600 to-cyan-500',
    path: '/category/salesforce',
    description: "Salesforce data integration tutorials: CRM data, Apex, SOQL, MuleSoft, and Salesforce Data Cloud.",
    longDescription: "**Salesforce** is the #1 CRM platform and one of the largest sources of enterprise data that data engineers actually have to pipe into warehouses, lakehouses, and ML models. In 2026 the Salesforce data surface is big: **Sales Cloud** (accounts, leads, opportunities, contacts), **Service Cloud** (cases, knowledge articles), **Marketing Cloud** (campaigns, journeys), **Commerce Cloud** (B2C/B2B commerce data), **Data Cloud** (Salesforce's customer data platform that unifies data across clouds), **MuleSoft** (integration middleware), and the underlying platform primitives: **Apex** (server-side code), **SOQL** (the SQL-like query language), **Bulk API 2.0** (mass data extract), **Platform Events**, **Change Data Capture**, and the **Salesforce-to-Snowflake / -Databricks / -BigQuery** connectors that most DE teams end up building or buying.\n\nThis category covers Salesforce **from a data engineer's perspective** — not the admin, developer, or architect perspectives. The focus is on getting Salesforce data out cleanly, joining it with the rest of your enterprise data, and keeping the integration reliable as Salesforce schemas evolve. **Extraction patterns**: Bulk API 2.0 for full/incremental extracts, Change Data Capture for near-real-time, REST API for small lookups, Salesforce Data Cloud for zero-ETL sharing to Snowflake/Databricks/BigQuery, Fivetran + HVR + Airbyte connectors.\n\n### What you'll learn here\n\n**Foundations**: the Salesforce data model (standard vs custom objects, relationships via Account ID / Contact ID / Opportunity ID, the schema-level quirks of Tasks, Events, History objects), SOQL basics, and why you shouldn't model Salesforce data one-to-one in your warehouse.\n\n**Extraction patterns**: Bulk API 2.0 job lifecycle (create → upload → monitor → download), incremental extraction via SystemModstamp, Change Data Capture topics, compare vs Salesforce Data Cloud's zero-ETL pattern.\n\n**Modeling patterns**: the canonical staging schema for Salesforce (raw_salesforce.account, raw_salesforce.opportunity etc.), Type 2 SCD for Opportunity.StageName, modeling Activity (Task + Event), handling deletions and merges, and the dimension/fact split for marts.\n\n**MuleSoft and integration**: when MuleSoft makes sense vs Fivetran + dbt, Salesforce Platform Events for event-driven integrations, Apex-callable webhooks.\n\n**Salesforce Data Cloud**: the new CDP that zero-copy shares Salesforce data to Snowflake/Databricks/BigQuery — when to use it, when not to, and how it compares to traditional ELT connectors.",
    faqs: [
      { question: "What is the best way to extract data from Salesforce?", answer: "Depends on scale and latency requirements. For daily full/incremental loads of millions of rows: Bulk API 2.0 (highest throughput, lowest cost). For near-real-time changes: Salesforce Change Data Capture (CDC) to capture inserts/updates/deletes as events. For small ad-hoc lookups: REST API. For zero-ETL integration into Snowflake/Databricks/BigQuery: Salesforce Data Cloud (newest option). Most teams use Bulk API for nightly batches + CDC for real-time tables, often via Fivetran or Airbyte." },
      { question: "What is SOQL and how is it different from SQL?", answer: "SOQL (Salesforce Object Query Language) is Salesforce's SQL-like query language. It resembles SQL SELECT but is limited: no joins in the ANSI sense (uses relationship dot notation — Contact.Account.Name), no arbitrary UNION, no window functions, strict governor limits (max rows returned, max CPU time). Use SOQL for in-Salesforce queries and data extraction; never expect warehouse-grade query capability. Once data is out of Salesforce and in your warehouse, use real SQL." },
      { question: "What is Salesforce Data Cloud and should I use it?", answer: "Salesforce Data Cloud (formerly CDP / Genie) is Salesforce's customer data platform that unifies data across Sales/Service/Marketing Cloud and supports zero-copy sharing to Snowflake, Databricks, and BigQuery via native integrations. Use it when: (1) you want Salesforce data accessible in your warehouse without ETL, (2) you need real-time customer profiles stitched across Salesforce products, (3) you're already paying for it as part of your Salesforce contract. Don't use it purely as a replacement for Fivetran + dbt — the economics differ." },
      { question: "How do I handle Salesforce schema changes in my pipeline?", answer: "Salesforce custom fields change often — admins add and remove fields without warning. Defensive patterns: (1) Use SOQL with explicit field lists, not SELECT * equivalent. (2) Keep raw staging tables with VARIANT/JSON columns for fields you don't care about. (3) Use schema evolution features of your target table format (Delta, Iceberg, Snowflake VARIANT). (4) Alert on new fields appearing in Salesforce source metadata. (5) Version-control the field list your pipeline cares about." },
      { question: "What is MuleSoft and when does a data engineer touch it?", answer: "MuleSoft is Salesforce's integration middleware — an iPaaS (integration platform as a service) for wiring Salesforce to other systems via REST/SOAP APIs. Data engineers touch MuleSoft when their company already runs it for operational integrations (ERP-to-CRM sync, e-commerce integration) and they need to extract or transform data that flows through MuleSoft-built APIs. For pure Salesforce-to-warehouse data loads, MuleSoft is usually overkill — Fivetran / Airbyte / Bulk API are cheaper and simpler." },
      { question: "How should I model Salesforce data in my warehouse?", answer: "Two-layer pattern: (1) Raw staging layer — one table per Salesforce object (raw_salesforce.account, raw_salesforce.opportunity), schema close to Salesforce, loaded by Fivetran / Airbyte / your Bulk API pipeline. (2) Dimensional marts — business-focused dim/fact tables (dim_account, fact_opportunity, fact_activity) that aggregate, type-cast, denormalize, and join Salesforce with other sources. Never model marts directly from Salesforce — you'll couple business logic to vendor schema." },
      { question: "What is Apex and when should a data engineer learn it?", answer: "Apex is Salesforce's Java-like server-side programming language used to extend the CRM with custom business logic, triggers, and web services. Data engineers generally don't need to write Apex — extract data via Bulk API / CDC, transform in the warehouse with SQL. The only case where DEs learn Apex is when they need to build custom Platform Event publishers, callouts to enrich data in Salesforce, or integration endpoints. Otherwise, leave Apex to Salesforce developers." }
    ]
  },
  'developer-productivity': {
    name: 'Developer Productivity',
    color: 'from-emerald-500 to-teal-500',
    path: '/category/developer-productivity',
    description: "Boost your data engineering workflow with AI coding tools, IDE setups, and developer productivity tips.",
    longDescription: "**Developer productivity** for data engineers in 2026 is a real discipline — not \"use VSCode and be happy,\" but a specific set of tools, keyboard shortcuts, terminal setups, AI coding integrations, workflow patterns, and team conventions that compound into hours saved per week. The fastest data engineers ship 5-10× more than median engineers, and the gap is mostly tooling + workflow, not raw talent.\n\nThis category covers the full stack of productivity tools that actually matter: **AI coding assistants** (Cursor, Copilot, Claude Code, Cortex Code, Aider, Continue — how they differ, when each wins, how to use them without becoming dependent on autocomplete), **IDE / editor setup** (VSCode, JetBrains, Zed, Neovim — keybinding strategies, essential extensions, language-server configuration), **terminal** (zsh / fish setup, tmux, starship prompt, modern replacements — ripgrep for grep, fd for find, bat for cat, exa for ls, delta for git diff), **git workflow** (rebase vs merge, worktrees for parallel work, fzf-based branch switching, commit message discipline), **data engineering-specific tooling** (dbt Power User, Snowflake VSCode extension, SQL Tools, Jupyter + Quarto, DuckDB CLI for data exploration), and **team patterns** (code review rubrics, documentation-as-code, ADRs, runbook culture).\n\n### What you'll find here\n\n**AI coding** in 2026 is not optional — the engineers who resist it are falling behind. Our content covers the concrete workflows: inline autocomplete for boilerplate, chat for refactoring, agent mode for multi-file changes, prompt engineering for SQL and dbt, and the critical skill of reading and correcting AI-generated code without trusting it.\n\n**IDE mastery**: the 20% of VSCode features that give 80% of the value (multi-cursor, fuzzy file search, integrated terminal, task runners, SQL Tools for live DB browsing, dbt Power User for model navigation), plus keyboard-shortcut cheatsheets tuned for data engineering workflows (navigate between model and YAML, jump to upstream source, run dbt build on selection).\n\n**Terminal and shell**: zsh + starship + zoxide + fzf is the 2026 baseline. Modern CLI replacements (rg for grep, fd for find, bat for cat) are 5-10× faster and better UX. tmux for long-running sessions. The handful of aliases every DE should set up for their warehouse of choice.\n\n**Git workflow**: the rebase-vs-merge debate solved, worktrees for multi-feature work, fzf-powered branch navigation, conventional commits, and the pre-commit hook setup that catches 80% of CI failures locally.\n\n**Team patterns**: code review rubrics that actually work for SQL, ADR (architecture decision record) templates, runbook-driven on-call, documentation-as-code (Docusaurus, MkDocs), and the handful of pre-commit tooling that keeps a data repo sane (sqlfluff, dbt-checkpoint, ruff, mypy).",
    faqs: [
      { question: "Should data engineers use AI coding assistants?", answer: "Yes, essentially always. In 2026, AI coding is table stakes — not using it means shipping 2-3× slower than peers. The real skill is using AI well: treat it as a pair-programmer who drafts code you review, not as an oracle whose output you trust blindly. Inline autocomplete for boilerplate, chat for refactoring and explaining unfamiliar code, agent mode for multi-file changes. The risk is losing the ability to write code yourself, so exercise raw coding muscles periodically." },
      { question: "Cursor vs VSCode vs Claude Code vs Cortex Code — which should I use?", answer: "Cursor: fork of VSCode with deep AI integration (tab completion, composer, agents) — best general-purpose 2026 AI-first editor. VSCode + Copilot: the established incumbent, broad language support, Microsoft ecosystem integration. Claude Code: Anthropic's terminal-native coding agent — excellent for autonomous multi-file changes from the CLI. Cortex Code: Snowflake's CLI for Snowflake-tied workflows. Most DEs end up using 2-3: an AI-first IDE (Cursor or VSCode+Copilot) + a CLI agent (Claude Code / Cortex Code) for batch tasks." },
      { question: "What terminal setup do productive data engineers use?", answer: "2026 baseline: zsh or fish as the shell, starship as the prompt (fast, informative, highly configurable), zoxide for intelligent cd, fzf for fuzzy file / branch / history search, tmux for persistent sessions, and modern CLI replacements — ripgrep (rg) for grep, fd for find, bat for cat with syntax highlighting, exa / eza for ls, delta for git diff. Add warehouse-specific aliases (sf, bq, dbx) for connection shortcuts. This setup pays for itself within a week." },
      { question: "Should I use VSCode or JetBrains (DataGrip / PyCharm) for data work?", answer: "VSCode: free, faster startup, better AI integration (Cursor is a VSCode fork), enormous extension ecosystem. Best for Python + SQL + YAML + general file editing. DataGrip / PyCharm (JetBrains): more powerful refactoring, deeper language analysis, better database browsing UX, heavier (slower startup, more RAM). If you live in SQL databases, DataGrip is excellent. If you split time across Python, SQL, dbt, YAML, and shell — VSCode with SQL Tools + dbt Power User + Python extension is usually the winner." },
      { question: "What VSCode extensions should every data engineer install?", answer: "Essentials: dbt Power User (model navigation, lineage, query previews), SQL Tools (live database browsing and query execution), Python + Pylance + Ruff (Python editing), YAML + JSON + Markdown All in One (config file support), GitLens (git blame + history in editor), GitHub Copilot or equivalent AI, vscode-dbt (YAML schema validation), Better Comments (highlighted TODOs/FIXMEs), Error Lens (inline error display). Add vendor-specific ones for Snowflake / BigQuery / Databricks as needed." },
      { question: "How should I structure my git workflow as a data engineer?", answer: "Trunk-based development with short-lived feature branches. Conventional commits (feat: / fix: / refactor:) for clarity. Rebase feature branches on main before merging (clean history). Small PRs (<400 lines) — they actually get reviewed. Use git worktrees for running multiple parallel branches locally. Pre-commit hooks for fast feedback (sqlfluff, ruff, dbt-checkpoint). CI checks that run Slim CI dbt build and tests. Prefer squash merges for noisy branches." },
      { question: "What productivity habits distinguish top data engineers?", answer: "Five habits: (1) Keyboard-driven workflow — minimize mouse use; master the 30 keybindings that cover 95% of editor actions. (2) Automation discipline — if you do something three times, script it. (3) Short feedback loops — never wait >30s on a command that runs constantly; profile and fix slow parts of your loop. (4) Documentation-as-you-go — capture context in ADRs / runbooks / commit messages so future-you (or teammates) don't re-derive it. (5) Aggressive use of AI + terminal — the combo compounds into substantial throughput gains over engineers who stick to pure GUI workflows." }
    ]
  }
};

const getCategoryIcon = (category, className = 'h-10 w-10') => {
  const lowerCategory = category.toLowerCase();
  const iconUrls = {
    snowflake: 'https://cdn.brandfetch.io/idJz-fGD_q/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B',
    aws: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    azure: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    airflow: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/apacheairflow/apacheairflow-original.svg',
    dbt: 'https://docs.getdbt.com/img/dbt-logo.svg',
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    gcp: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg',
    // ✅ NEW: Databricks
    databricks: 'https://cdn.brandfetch.io/idSUrLOWbH/idEHbzBDZC.svg?c=1dxbfHSJFAPEGdCLU4o5B',
    // ✅ NEW: Salesforce  
    salesforce: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/salesforce/salesforce-original.svg',
    'developer-productivity': null
  };

  const iconUrl = iconUrls[lowerCategory];

  // Special case for SQL to ensure visibility
  if (lowerCategory === 'sql') {
    return (
      <div className={`${className} bg-slate-200 rounded-full p-1.5 flex items-center justify-center`}>
        <img src={iconUrls.sql} alt="SQL logo" className="h-full w-full object-contain" width={24} height={24} loading="lazy" />
      </div>
    );
  }

  // Emoji-based icons for topic categories (no brand logo)
  if (lowerCategory === 'developer-productivity') {
    return (
      <div className={`${className} bg-emerald-500/20 rounded-lg flex items-center justify-center text-2xl`}>⚡</div>
    );
  }
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={`${category} logo`}
        className={`${className} object-contain`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentNode.innerHTML = `<div class="${className} bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">📁</div>`;
        }}
        width={24}
        height={24}
        loading="lazy"
      />
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path fill="#6366F1" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
};

const CategoryPage = () => {
  const { categoryName } = useParams();
  const lowerCategoryName = categoryName.toLowerCase();
  const currentCategory = categoryConfig[lowerCategoryName] || {
    name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
    description: `Discover articles and tutorials about ${categoryName}.`
  };
  const isKnownCategory = !!categoryConfig[lowerCategoryName];

  const sparkContainerVariants = {
    rest: {},
    hover: { transition: { staggerChildren: 0.04 } }
  };

  const sparks = useMemo(() =>
    Array.from({ length: 12 }).map(() => ({
      x: Math.random() * 50 - 25,
      y: Math.random() * 50 - 25,
      rotate: Math.random() * 360,
      color: ['#60a5fa', '#a78bfa', '#ffffff'][Math.floor(Math.random() * 3)]
    })),
    []);

  const MotionLink = motion(Link);

  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs(`/category/${categoryName}`, `${currentCategory.name} Tutorials`);

  // FAQPage JSON-LD — emitted when the category has authored FAQs
  // so Google can surface FAQ rich results on the category SERP.
  const faqSchema = Array.isArray(currentCategory.faqs) && currentCategory.faqs.length > 0
    ? getFAQSchema(currentCategory.faqs)
    : null;

  return (
    <>
      <MetaTags
        title={`${currentCategory.name} Tutorials`}
        description={currentCategory.description}
        keywords={`${lowerCategoryName}, data engineering, ${currentCategory.name} tutorials`}
        type="website"
        breadcrumbs={breadcrumbs}
        faqSchema={faqSchema}
        noindex={!isKnownCategory}
      />

      <div className="pt-1 pb-8">
        <div className="container mx-auto px-6">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Button
              asChild
              variant="outline"
              className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 backdrop-blur-sm"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </motion.div>

          {/* Category Header */}
          <motion.div
            key={`header-${categoryName}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 mb-6">
              {getCategoryIcon(categoryName, 'h-8 w-8 md:h-10 md:w-10')}
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-4">
              <span className="gradient-text">{currentCategory.name} Tutorials & Articles</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {currentCategory.description}
            </p>
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/30 px-4 py-2 rounded-full">
                <Folder className="h-4 w-4" />
                <span>Category: {currentCategory.name}</span>
              </div>
            </div>
          </motion.div>

          {/* Posts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RecentPosts
              category={lowerCategoryName}
              showCategoryError={true}
              initialLimit={9}
              title={`All ${currentCategory.name} Articles`}
              showLoadMore={true}
              showViewToggle={true}
            />
          </motion.div>

          {/* Long Description — in-depth category overview (Phase 2 pSEO depth) */}
          {currentCategory.longDescription && (
            <motion.section
              key={`longdesc-${categoryName}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-12 bg-slate-800/40 border border-slate-700 rounded-xl p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                About {currentCategory.name}
              </h2>
              <div className="prose prose-invert prose-sm md:prose-base max-w-none text-gray-300 leading-relaxed">
                {currentCategory.longDescription.split('\n\n').map((para, i) => {
                  if (para.startsWith('### ')) {
                    return (
                      <h3 key={i} className="text-white text-lg font-semibold mt-5 mb-2">
                        {para.replace(/^###\s+/, '')}
                      </h3>
                    );
                  }
                  const parts = para.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={i} className="mb-3 last:mb-0">
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={j} className="text-white font-semibold">
                            {part.slice(2, -2)}
                          </strong>
                        ) : (
                          <React.Fragment key={j}>{part}</React.Fragment>
                        )
                      )}
                    </p>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* FAQs — long-tail question targeting (Phase 2 pSEO depth) */}
          {Array.isArray(currentCategory.faqs) && currentCategory.faqs.length > 0 && (
            <motion.section
              key={`faqs-${categoryName}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 bg-slate-800/40 border border-slate-700 rounded-xl p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {currentCategory.faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group border border-slate-700 rounded-lg overflow-hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 font-medium text-white hover:bg-slate-700/30 transition-colors">
                      <span className="flex-1">{faq.question}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 text-sm md:text-base text-gray-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </motion.section>
          )}

          {/* Explore Other Categories Section */}
          <motion.div
            key={`explore-${categoryName}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm border border-blue-400/20 rounded-2xl"
          >
            <div className="text-xl font-bold mb-4 text-center gradient-text">
              Explore Other Categories
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(categoryConfig).map(([slug, config]) => {
                const isActive = slug === lowerCategoryName;
                return (
                  <MotionLink
                    key={slug}
                    to={config.path}
                    initial="rest"
                    whileHover="hover"
                    className={`relative p-4 rounded-xl text-center transition-all duration-300 overflow-hidden group ${isActive
                      ? 'border-2 border-blue-400 shadow-lg shadow-blue-500/30'
                      : 'border border-gray-700 hover:border-blue-400/50'
                      }`}
                    aria-label={`View ${config.name} articles`}
                  >
                    {/* Spark emitters in corners */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        variants={sparkContainerVariants}
                        className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'} w-12 h-12`}
                      >
                        {sparks.map((spark, j) => <Spark key={j} {...spark} />)}
                      </motion.div>
                    ))}

                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="flex justify-center mb-2">
                        {getCategoryIcon(slug, 'h-8 w-8 md:h-10 md:w-10')}
                      </div>
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-300' : 'text-gray-300'}`}>
                        {config.name}
                      </div>
                    </div>
                  </MotionLink>
                );
              })}
            </div>

            {/* View All Articles Button */}
            <div className="text-center mt-6">
              <Button
                asChild
                variant="outline"
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20"
              >
                <Link to="/articles">View All Articles</Link>
              </Button>
            </div>
          </motion.div>

          {/* Ad at bottom of page */}
          <Suspense fallback={null}>
            <div className="mt-8">
              <AdPlacement />
            </div>
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;