/**
 * Comparison Data for PSEO
 * Structured data for "vs" pages
 */

export const comparisons = [
    {
        id: 'airflow-vs-prefect',
        slug: 'airflow-vs-prefect',
        toolA: 'Apache Airflow',
        toolB: 'Prefect',
        category: 'Orchestration',
        winner: 'It Depends',
        shortVerdict: 'Choose Airflow for enterprise-scale, static dependencies. Choose Prefect for modern, dynamic workflows and easier developer experience.',
        intro: `
Apache Airflow has been the industry standard for code-based data orchestration for years. However, Prefect has emerged as a strong "modern" contender, fixing many of Airflow's pain points like scheduling latency and complex deployment.

This comparison breaks down the key differences to help you decide which orchestrator fits your data stack.
        `.trim(),
        features: [
            {
                name: 'Scheduling Logic',
                toolAValue: 'Interval-based (DAG runs at set times)',
                toolBValue: 'Event-driven & negative engineering (handles failure logic)',
                winner: 'Prefect'
            },
            {
                name: 'Dynamic Workflows',
                toolAValue: 'Difficult (requires Dynamic DAG generation)',
                toolBValue: 'Native (Python code *is* the workflow)',
                winner: 'Prefect'
            },
            {
                name: 'Ecosystem & Community',
                toolAValue: 'Huge (standard for years)',
                toolBValue: 'Growing rapidly',
                winner: 'Airflow'
            },
            {
                name: 'Ease of Setup',
                toolAValue: 'Complex (Scheduler, Webserver, Meta DB)',
                toolBValue: 'Simple (Pip install & start)',
                winner: 'Prefect'
            }
        ],
        pros: {
            toolA: ['Massive community support', ' extensive provider library', 'Battle-tested at scale'],
            toolB: ['Pythonic developer experience', 'Dynamic topology support', 'Hybrid execution model']
        },
        cons: {
            toolA: ['Scheduling latency', 'Complex local testing', 'Steep learning curve'],
            toolB: ['Smaller community', 'Enterprise features behind paywall (Cloud)']
        },
        finalVerdict: `
**Choose Apache Airflow if:**
- You need a battle-tested solution for a large enterprise.
- You rely heavily on existing operators (Salesforce, SAP, etc.).
- Your team is already experienced with it.

**Choose Prefect if:**
- You want a better developer experience (native Python).
- You need dynamic workflows (runtime parameterization).
- You are building a modern data stack from scratch.
        `.trim(),
        relatedComparisons: ['dbt-vs-dataform'],
        lastUpdated: '2026-01-21'
    },
    {
        id: 'snowflake-vs-bigquery',
        slug: 'snowflake-vs-bigquery',
        toolA: 'Snowflake',
        toolB: 'Google BigQuery',
        category: 'Data Warehousing',
        winner: 'It Depends',
        shortVerdict: 'Snowflake offers multi-cloud flexibility and zero-maintenance performance. BigQuery offers effortless serverless scaling and deep GCP integration.',
        intro: `
The two titans of cloud data warehousing. Snowflake brought the cloud-native separated storage/compute model to the masses. BigQuery is Google's serverless powerhouse. Both are excellent, but they serve slightly different needs.
        `.trim(),
        features: [
            {
                name: 'Cloud Infrastructure',
                toolAValue: 'Multi-cloud (AWS, Azure, GCP)',
                toolBValue: 'GCP Native (mostly)',
                winner: 'Snowflake'
            },
            {
                name: 'Pricing Model',
                toolAValue: 'Pay for Warehouse uptime (per second)',
                toolBValue: 'Pay per query (bytes scanned) or slots',
                winner: 'Tie'
            },
            {
                name: 'Maintenance',
                toolAValue: 'Near Zero (Auto-suspend/resume)',
                toolBValue: 'Zero (Serverless)',
                winner: 'BigQuery'
            },
            {
                name: 'Performance',
                toolAValue: 'Excellent (with tuning)',
                toolBValue: 'Excellent (brute force parallelism)',
                winner: 'Tie'
            }
        ],
        pros: {
            toolA: ['Cloud agnostic (no vendor lock-in)', 'Data Sharing capabilities', 'Zero-copy cloning'],
            toolB: ['True serverless (no sizing needed)', 'Integrated ML (BigQuery ML)', 'Free tier available']
        },
        cons: {
            toolA: ['Costs can spiral if not monitored', 'Not truly "serverless" (need to manage WH sizes)'],
            toolB: ['GCP lock-in', 'Slot contention in rigid flat-rate pricing']
        },
        finalVerdict: `
**Choose Snowflake if:**
- You want a multi-cloud strategy.
- You need robust data sharing features.
- You value predictable performance via Warehouse sizing.

**Choose BigQuery if:**
- You are already on GCP.
- You possess "bursty" workloads (perfect for pay-per-query).
- You want to do Machine Learning directly in SQL.
        `.trim(),
        relatedComparisons: ['airflow-vs-prefect'],
        lastUpdated: '2026-01-21'
    },
    {
        id: 'dbt-vs-dataform',
        slug: 'dbt-vs-dataform',
        toolA: 'dbt',
        toolB: 'Dataform',
        category: 'Data Transformation',
        winner: 'dbt',
        shortVerdict: 'dbt is the industry standard for analytics engineering with broad support. Dataform is a strong alternative specifically for BigQuery users.',
        intro: `
dbt (data build tool) revolutionized data transformation by bringing software engineering practices to SQL. Dataform (acquired by Google) offers a similar value prop but deeply integrated into the BigQuery ecosystem.
        `.trim(),
        features: [
            {
                name: 'Platform Support',
                toolAValue: 'Universal (Snowflake, BQ, Redshift, Postgres, Spark)',
                toolBValue: 'BigQuery Only (mostly)',
                winner: 'dbt'
            },
            {
                name: 'Language',
                toolAValue: 'Jinja + SQL',
                toolBValue: 'JavaScript + SQL',
                winner: 'Tie'
            },
            {
                name: 'Pricing',
                toolAValue: 'Open Core (Free CLI) + Cloud SaaS',
                toolBValue: 'Free (part of GCP)',
                winner: 'Dataform'
            }
        ],
        pros: {
            toolA: ['Universal standard', 'Massive package ecosystem', 'Great documentation'],
            toolB: ['Free usage', 'Fast compilation', 'Golden path for BigQuery']
        },
        cons: {
            toolA: ['Complex project structure at scale', 'Cloud pricing can be high'],
            toolB: ['Limited to GCP', 'Smaller community', 'Uncertain roadmap post-acquisition']
        },
        finalVerdict: `
**Choose dbt if:**
- You want the industry standard skill set.
- You use Snowflake, Redshift, or Databricks.
- You value community packages.

**Choose Dataform if:**
- You are 100% on BigQuery.
- You want a free, fully managed transformation tool.
- You prefer JavaScript over Jinja for templating.
        `.trim(),
        relatedComparisons: ['snowflake-vs-bigquery'],
        lastUpdated: '2026-01-21'
    }
];

export const getComparisonBySlug = (slug) => {
    return comparisons.find(c => c.slug === slug);
};

export const getAllComparisons = () => {
    return comparisons;
};
