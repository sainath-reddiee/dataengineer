// src/data/glossaryData.js
/**
 * Glossary Data for PSEO (Programmatic SEO)
 * Each term is a first-class entity with full metadata for SEO optimization
 * 
 * Structure:
 * - id: Unique identifier (used for internal linking)
 * - term: Display name of the term
 * - slug: URL-safe version (used in /glossary/:slug)
 * - category: Grouping for hub page navigation
 * - shortDefinition: 1-2 sentence definition (for cards/previews)
 * - fullDefinition: Detailed explanation (300+ words)
 * - keyPoints: Array of important highlights
 * - faqs: Frequently asked questions (for schema markup)
 * - relatedTerms: Array of related term slugs (for internal linking)
 * - relatedTools: External tools/products related to this term
 * - externalLinks: Authoritative sources for citations
 * - keywords: SEO keywords for this term
 * - lastUpdated: Date for freshness signals
 */

export const GLOSSARY_CATEGORIES = [
    { id: 'data-warehousing', name: 'Data Warehousing', icon: '🏢' },
    { id: 'etl-elt', name: 'ETL & ELT', icon: '🔄' },
    { id: 'data-orchestration', name: 'Data Orchestration', icon: '🎯' },
    { id: 'data-modeling', name: 'Data Modeling', icon: '📐' },
    { id: 'cloud-platforms', name: 'Cloud Platforms', icon: '☁️' },
    { id: 'data-governance', name: 'Data Governance', icon: '🛡️' },
    { id: 'data-quality', name: 'Data Quality', icon: '✅' },
    { id: 'data-observability', name: 'Data Observability', icon: '👁️' },
    { id: 'streaming', name: 'Real-time & Streaming', icon: '⚡' },
    { id: 'analytics', name: 'Analytics & BI', icon: '📊' },
    { id: 'data-integration', name: 'Data Integration', icon: '🔗' },
];

export const glossaryTerms = [
    {
        id: 'snowflake',
        term: 'Snowflake',
        slug: 'snowflake',
        category: 'data-warehousing',
        shortDefinition: 'A cloud-native data warehouse platform that separates storage and compute, enabling elastic scaling and pay-per-use pricing.',
        fullDefinition: `
Snowflake is a cloud-native data warehouse platform built for the modern data stack. Unlike traditional data warehouses, Snowflake was designed from the ground up for the cloud, offering unique architecture that separates storage and compute resources.

## Key Architecture Features

Snowflake uses a **multi-cluster shared data architecture** that consists of three layers:

1. **Database Storage Layer**: Data is stored in a compressed, columnar format in cloud object storage (AWS S3, Azure Blob, or Google Cloud Storage). This layer is fully managed and automatically optimized.

2. **Query Processing Layer (Virtual Warehouses)**: Compute clusters that execute queries independent of storage. You can spin up multiple warehouses of different sizes without affecting each other.

3. **Cloud Services Layer**: Handles authentication, infrastructure management, metadata, query optimization, and access control.

## Why Data Engineers Choose Snowflake

- **Zero Management**: No indexes to tune, no partitions to manage
- **Instant Elasticity**: Scale compute up/down in seconds
- **Concurrency**: Multiple workloads without resource contention
- **Time Travel**: Query historical data up to 90 days back
- **Data Sharing**: Share live data across organizations securely
- **Semi-structured Data**: Native support for JSON, Avro, Parquet

## Snowflake vs Traditional Data Warehouses

Traditional on-premise solutions like Teradata or Oracle require significant hardware investment and maintenance. Snowflake eliminates this with its SaaS model, offering true pay-per-second pricing and automatic performance optimization.

## Common Use Cases

- **Data Lakes**: Combine structured and semi-structured data
- **Data Engineering**: Build scalable ETL/ELT pipelines
- **Data Science**: Run ML workloads with Snowpark
- **Business Intelligence**: Power dashboards with fast queries
    `.trim(),
        keyPoints: [
            'Cloud-native architecture separating storage and compute',
            'Pay-per-second pricing model',
            'Zero-maintenance with automatic optimization',
            'Time Travel feature for historical data access',
            'Native support for semi-structured data (JSON, Parquet)',
        ],
        faqs: [
            {
                question: 'What is Snowflake used for?',
                answer: 'Snowflake is primarily used as a cloud data warehouse for storing, processing, and analyzing large volumes of structured and semi-structured data. It supports data engineering, analytics, data science, and data sharing use cases.',
            },
            {
                question: 'Is Snowflake a database or data warehouse?',
                answer: 'Snowflake is a cloud data warehouse, not a traditional transactional database. It is optimized for analytical workloads (OLAP) rather than transactional operations (OLTP). However, it can store and query data like a database.',
            },
            {
                question: 'How does Snowflake pricing work?',
                answer: 'Snowflake uses a consumption-based pricing model. You pay separately for storage (per TB/month) and compute (per credit consumed). Compute is charged per-second with a 60-second minimum, so you only pay when queries are running.',
            },
            {
                question: 'What is Snowflake Time Travel?',
                answer: 'Time Travel is a Snowflake feature that lets you access historical data at any point within a defined retention period (up to 90 days). You can query, clone, or restore data as it existed at a specific timestamp.',
            },
        ],
        relatedTerms: ['data-warehouse', 'snowpark', 'dbt', 'etl', 'data-lake'],
        relatedTools: ['dbt', 'Fivetran', 'Airbyte', 'Tableau', 'Power BI'],
        externalLinks: [
            { title: 'Snowflake Official Documentation', url: 'https://docs.snowflake.com/' },
            { title: 'Snowflake Architecture Overview', url: 'https://docs.snowflake.com/en/user-guide/intro-key-concepts' },
        ],
        keywords: ['snowflake', 'cloud data warehouse', 'snowflake data platform', 'snowflake architecture', 'snowflake pricing'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'dbt',
        term: 'dbt (Data Build Tool)',
        slug: 'dbt',
        category: 'etl-elt',
        shortDefinition: 'An open-source transformation tool that enables data analysts and engineers to transform data in their warehouse using SQL and software engineering best practices.',
        fullDefinition: `
dbt (data build tool) is an open-source command-line tool that enables data analysts and engineers to transform data in their data warehouse more effectively. It brings software engineering best practices like version control, testing, and documentation to analytics workflows.

## What Makes dbt Different

Traditional ETL tools require you to write transformations in proprietary languages or drag-and-drop interfaces. dbt takes a different approach:

- **SQL-first**: Write transformations in pure SQL (or Python in dbt Core 1.3+)
- **ELT, not ETL**: Assumes data is already loaded; focuses only on the T (transform)
- **Modular**: Build reusable models that reference each other
- **Version Controlled**: Store all code in Git for collaboration
- **Tested**: Define tests to validate data quality
- **Documented**: Auto-generate documentation from your code

## Core Concepts

1. **Models**: SQL files that define transformations. Each model compiles to a SELECT statement and creates a table or view.

2. **Sources**: Declare raw tables loaded by your ingestion tools (Fivetran, Airbyte, etc.)

3. **Tests**: Assertions about your data (unique, not null, relationships)

4. **Documentation**: Describe models and columns; dbt generates a searchable doc site

5. **Macros**: Reusable SQL snippets (like functions) using Jinja templating

## dbt Core vs dbt Cloud

- **dbt Core**: Free, open-source CLI tool you run locally or in CI/CD
- **dbt Cloud**: Managed platform with IDE, scheduling, and collaboration features

## Common dbt Commands

\`\`\`bash
dbt run          # Execute all models
dbt test         # Run all tests
dbt docs generate  # Generate documentation
dbt build        # Run + test in dependency order
\`\`\`

## Why Teams Adopt dbt

- **Speed**: Analysts can own transformations without waiting for engineers
- **Quality**: Tests catch data issues before they reach dashboards
- **Collaboration**: Git-based workflow enables code review and teamwork
- **Maintainability**: Modular, documented code is easier to understand and update
    `.trim(),
        keyPoints: [
            'SQL-first transformation tool for data warehouses',
            'Follows ELT pattern (transform after loading)',
            'Built-in testing framework for data quality',
            'Auto-generated documentation from code',
            'Git-based workflow for version control',
        ],
        faqs: [
            {
                question: 'What is dbt used for?',
                answer: 'dbt is used for transforming raw data in a data warehouse into analytics-ready datasets. It allows data teams to write modular SQL, test data quality, and generate documentation—all using software engineering best practices.',
            },
            {
                question: 'Is dbt ETL or ELT?',
                answer: 'dbt is an ELT tool. It focuses only on the T (Transform) step, assuming data has already been Extracted and Loaded into your warehouse by other tools like Fivetran or Airbyte.',
            },
            {
                question: 'Is dbt free to use?',
                answer: 'dbt Core is 100% free and open-source. dbt Cloud offers a free tier for individuals, with paid plans for teams that need scheduling, IDE, and collaboration features.',
            },
            {
                question: 'What databases does dbt support?',
                answer: 'dbt supports all major cloud data warehouses including Snowflake, BigQuery, Redshift, Databricks, and many others through community-maintained adapters.',
            },
        ],
        relatedTerms: ['snowflake', 'data-warehouse', 'etl', 'data-modeling', 'sql'],
        relatedTools: ['Snowflake', 'BigQuery', 'Redshift', 'Fivetran', 'Airbyte'],
        externalLinks: [
            { title: 'dbt Documentation', url: 'https://docs.getdbt.com/' },
            { title: 'dbt Learn (Free Courses)', url: 'https://courses.getdbt.com/' },
        ],
        keywords: ['dbt', 'data build tool', 'dbt tutorial', 'dbt vs etl', 'dbt testing'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-warehouse',
        term: 'Data Warehouse',
        slug: 'data-warehouse',
        category: 'data-warehousing',
        shortDefinition: 'A centralized repository designed to store, integrate, and analyze large volumes of structured data from multiple sources for business intelligence and reporting.',
        fullDefinition: `
A data warehouse is a centralized repository that stores integrated data from multiple sources, optimized for analytical queries and reporting. Unlike operational databases designed for transactions (OLTP), data warehouses are built for analysis (OLAP).

## Key Characteristics

1. **Subject-Oriented**: Organized around business subjects (customers, products, sales) rather than applications

2. **Integrated**: Data from disparate sources is cleansed, transformed, and unified into a consistent format

3. **Time-Variant**: Historical data is preserved, enabling trend analysis over time

4. **Non-Volatile**: Once data enters the warehouse, it's stable and doesn't change (unlike operational systems)

## Data Warehouse Architecture

Modern data warehouses typically follow a layered architecture:

- **Raw/Staging Layer**: Stores data as-is from source systems
- **Integration Layer**: Cleaned and transformed data
- **Presentation Layer**: Business-ready datasets for reporting and analytics
- **Semantic Layer**: Business definitions and metrics

## Cloud Data Warehouses

The industry has shifted from on-premise solutions to cloud-native platforms:

| Platform | Provider | Key Feature |
|----------|----------|-------------|
| Snowflake | Independent | Separate storage/compute |
| BigQuery | Google Cloud | Serverless, pay-per-query |
| Redshift | AWS | Tight AWS integration |
| Synapse | Azure | Unified analytics |
| Databricks | Independent | Lakehouse architecture |

## Data Warehouse vs Data Lake

- **Data Warehouse**: Structured data, schema-on-write, optimized for BI
- **Data Lake**: All data types, schema-on-read, optimized for data science
- **Data Lakehouse**: Combines benefits of both (e.g., Databricks, Snowflake)

## Benefits for Organizations

- **Single Source of Truth**: Unified view across business domains
- **Historical Analysis**: Track trends and patterns over time
- **Performance**: Optimized for complex analytical queries
- **Governance**: Centralized security and access control
    `.trim(),
        keyPoints: [
            'Centralized repository for analytical data',
            'Optimized for OLAP (analytical) workloads',
            'Stores historical data for trend analysis',
            'Integrates data from multiple source systems',
            'Cloud options include Snowflake, BigQuery, Redshift',
        ],
        faqs: [
            {
                question: 'What is the purpose of a data warehouse?',
                answer: 'A data warehouse serves as a central repository for integrated data from multiple sources, enabling organizations to run complex analytical queries, generate reports, and make data-driven decisions.',
            },
            {
                question: 'What is the difference between a database and a data warehouse?',
                answer: 'Databases (OLTP) are optimized for transactional operations like inserts and updates. Data warehouses (OLAP) are optimized for analytical queries across large datasets. Warehouses store historical data; databases typically store current state.',
            },
            {
                question: 'What is ETL in data warehousing?',
                answer: 'ETL stands for Extract, Transform, Load—the process of pulling data from source systems, transforming it into a consistent format, and loading it into the data warehouse for analysis.',
            },
            {
                question: 'Is Snowflake a data warehouse?',
                answer: 'Yes, Snowflake is a cloud-native data warehouse platform. It provides all traditional data warehouse capabilities with modern features like separation of storage and compute, and native support for semi-structured data.',
            },
        ],
        relatedTerms: ['snowflake', 'etl', 'data-lake', 'olap', 'data-modeling'],
        relatedTools: ['Snowflake', 'BigQuery', 'Redshift', 'Azure Synapse', 'Databricks'],
        externalLinks: [
            { title: 'What is a Data Warehouse? - AWS', url: 'https://aws.amazon.com/data-warehouse/' },
            { title: 'Data Warehouse Concepts - Google Cloud', url: 'https://cloud.google.com/learn/what-is-a-data-warehouse' },
        ],
        keywords: ['data warehouse', 'data warehousing', 'cloud data warehouse', 'data warehouse vs data lake'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'etl',
        term: 'ETL (Extract, Transform, Load)',
        slug: 'etl',
        category: 'etl-elt',
        shortDefinition: 'A data integration process that extracts data from source systems, transforms it into a suitable format, and loads it into a target data warehouse or database.',
        fullDefinition: `
ETL stands for Extract, Transform, Load—the traditional process for moving and preparing data for analytics. It's the backbone of data warehousing and has been used for decades to integrate data from multiple sources.

## The Three Stages

### 1. Extract
Pull data from various source systems:
- Databases (MySQL, PostgreSQL, Oracle)
- SaaS applications (Salesforce, HubSpot)
- APIs (REST, GraphQL)
- Files (CSV, JSON, XML)
- Streaming sources (Kafka, webhooks)

### 2. Transform
Apply business logic to prepare data:
- **Cleaning**: Remove duplicates, handle nulls
- **Standardization**: Unify formats (dates, currencies)
- **Aggregation**: Summarize data for reporting
- **Enrichment**: Add calculated fields or lookups
- **Validation**: Apply business rules

### 3. Load
Write transformed data to the target:
- Data warehouses (Snowflake, BigQuery)
- Data lakes (S3, Azure Data Lake)
- Operational databases

## ETL vs ELT

The rise of cloud data warehouses has popularized ELT:

| Aspect | ETL | ELT |
|--------|-----|-----|
| Transform Location | Before loading (staging server) | After loading (in warehouse) |
| Best For | Limited warehouse compute | Powerful cloud warehouses |
| Flexibility | Less flexible (predefined) | More flexible (transform anytime) |
| Tools | Informatica, SSIS, Talend | dbt, Snowflake, BigQuery |

Modern data stacks often use **ELT**: load raw data first, then transform using tools like dbt.

## Popular ETL/ELT Tools

- **Fivetran**: Automated, fully managed connectors
- **Airbyte**: Open-source data integration platform
- **Stitch**: Simple, developer-friendly pipelines
- **dbt**: Transformation layer (the T in ELT)
- **Apache Airflow**: Workflow orchestration for custom ETL

## Best Practices

1. **Incremental Loading**: Only process new/changed data
2. **Idempotency**: Running the same job twice should produce the same result
3. **Monitoring**: Track data quality and pipeline health
4. **Documentation**: Maintain data lineage and transformation logic
    `.trim(),
        keyPoints: [
            'Three-step process: Extract, Transform, Load',
            'Foundational process for data warehousing',
            'Modern alternative is ELT (transform in warehouse)',
            'Key tools: Fivetran, Airbyte, dbt',
            'Enables single source of truth for analytics',
        ],
        faqs: [
            {
                question: 'What is ETL in simple terms?',
                answer: 'ETL is a process that pulls data from various sources (Extract), cleans and transforms it into a usable format (Transform), and stores it in a data warehouse for analysis (Load).',
            },
            {
                question: 'What is the difference between ETL and ELT?',
                answer: 'In ETL, data is transformed before loading into the target. In ELT, raw data is loaded first, then transformed inside the data warehouse. ELT is preferred for cloud warehouses with powerful compute.',
            },
            {
                question: 'What tools are used for ETL?',
                answer: 'Popular ETL tools include Fivetran, Airbyte, Stitch, Talend, Informatica, and Apache NiFi. For the transformation layer, dbt is widely used in modern data stacks.',
            },
            {
                question: 'Why is ETL important?',
                answer: 'ETL ensures that data from different sources is cleaned, standardized, and integrated into a single repository. This enables accurate reporting, analytics, and data-driven decision making.',
            },
        ],
        relatedTerms: ['data-warehouse', 'dbt', 'data-pipeline', 'data-integration'],
        relatedTools: ['Fivetran', 'Airbyte', 'dbt', 'Stitch', 'Talend'],
        externalLinks: [
            { title: 'ETL Explained - IBM', url: 'https://www.ibm.com/topics/etl' },
            { title: 'ETL vs ELT - Fivetran', url: 'https://www.fivetran.com/blog/etl-vs-elt' },
        ],
        keywords: ['etl', 'extract transform load', 'etl vs elt', 'etl tools', 'etl process'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'apache-airflow',
        term: 'Apache Airflow',
        slug: 'apache-airflow',
        category: 'data-orchestration',
        shortDefinition: 'An open-source platform to programmatically author, schedule, and monitor workflows, commonly used for orchestrating data pipelines and ETL jobs.',
        fullDefinition: `
Apache Airflow is an open-source workflow orchestration platform created at Airbnb and now maintained by the Apache Software Foundation. It allows you to define, schedule, and monitor complex data workflows as code.

## Core Concepts

### DAGs (Directed Acyclic Graphs)
Workflows in Airflow are defined as DAGs—collections of tasks with dependencies. The "acyclic" property ensures no circular dependencies.

\`\`\`python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG('my_etl_dag', start_date=datetime(2024, 1, 1), schedule='@daily') as dag:
    extract = PythonOperator(task_id='extract', python_callable=extract_data)
    transform = PythonOperator(task_id='transform', python_callable=transform_data)
    load = PythonOperator(task_id='load', python_callable=load_data)
    
    extract >> transform >> load
\`\`\`

### Operators
Pre-built task types for common operations:
- **PythonOperator**: Run Python functions
- **BashOperator**: Execute shell commands
- **SQLOperator**: Run SQL queries
- **S3/GCS Operators**: Interact with cloud storage
- **Provider Operators**: Snowflake, BigQuery, dbt, etc.

### Executors
How Airflow runs tasks:
- **SequentialExecutor**: One task at a time (development)
- **LocalExecutor**: Parallel on single machine
- **CeleryExecutor**: Distributed across workers
- **KubernetesExecutor**: Pods per task for isolation

## Key Features

- **Workflows as Code**: Version control your pipelines
- **Rich UI**: Visual DAG graph, logs, retry handling
- **Extensible**: Build custom operators and sensors
- **Integrations**: 1000+ provider packages
- **Backfills**: Re-run historical data processing

## Airflow vs Alternatives

| Tool | Strength | Best For |
|------|----------|----------|
| Airflow | Flexibility, ecosystem | Complex custom workflows |
| Prefect | Python-native, cloud-first | Modern data apps |
| Dagster | Software-defined assets | Data platform teams |
| dbt Cloud | SQL transformations | Analytics engineering |

## Common Use Cases

1. **ETL/ELT Pipelines**: Orchestrate data movement and transformation
2. **ML Workflows**: Training, validation, deployment pipelines
3. **Reporting**: Schedule automated report generation
4. **Data Quality**: Trigger validation checks on new data
    `.trim(),
        keyPoints: [
            'Workflow orchestration platform written in Python',
            'Defines pipelines as DAGs (Directed Acyclic Graphs)',
            'Rich ecosystem with 1000+ integration providers',
            'Web UI for monitoring and troubleshooting',
            'Created at Airbnb, now Apache project',
        ],
        faqs: [
            {
                question: 'What is Apache Airflow used for?',
                answer: 'Apache Airflow is used for orchestrating complex workflows, particularly data pipelines. It schedules tasks, manages dependencies, handles retries, and provides monitoring through a web interface.',
            },
            {
                question: 'Is Airflow an ETL tool?',
                answer: 'Airflow is an orchestration tool, not an ETL tool. It schedules and monitors ETL jobs but does not extract, transform, or load data itself. You use Airflow to coordinate tools like dbt, Python scripts, or SQL queries.',
            },
            {
                question: 'What is a DAG in Airflow?',
                answer: 'A DAG (Directed Acyclic Graph) is a collection of tasks with defined dependencies. It represents a complete workflow where each task runs after its upstream dependencies complete successfully.',
            },
            {
                question: 'Is Airflow free to use?',
                answer: 'Yes, Apache Airflow is 100% free and open-source. Managed versions like Astronomer, MWAA (AWS), and Cloud Composer (Google) offer paid hosting with additional features.',
            },
        ],
        relatedTerms: ['etl', 'data-pipeline', 'dbt', 'data-orchestration'],
        relatedTools: ['Prefect', 'Dagster', 'dbt Cloud', 'AWS MWAA', 'Astronomer'],
        externalLinks: [
            { title: 'Apache Airflow Documentation', url: 'https://airflow.apache.org/docs/' },
            { title: 'Airflow Tutorial - Astronomer', url: 'https://docs.astronomer.io/learn' },
        ],
        keywords: ['apache airflow', 'airflow dag', 'airflow tutorial', 'airflow vs prefect', 'workflow orchestration'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-lake',
        term: 'Data Lake',
        slug: 'data-lake',
        category: 'data-warehousing',
        shortDefinition: 'A centralized storage repository that holds vast amounts of raw data in its native format until needed for analysis, supporting structured, semi-structured, and unstructured data.',
        fullDefinition: `
A data lake is a centralized repository designed to store, process, and secure large volumes of data in any format—structured, semi-structured, or unstructured. Unlike data warehouses that require data to be structured before storage, data lakes accept raw data as-is.

## Data Lake vs Data Warehouse

| Aspect | Data Lake | Data Warehouse |
|--------|-----------|----------------|
| Data Format | Raw, any format | Structured only |
| Schema | Schema-on-read | Schema-on-write |
| Users | Data scientists, engineers | Analysts, business users |
| Processing | Batch and streaming | Primarily batch |
| Cost | Lower storage cost | Higher, optimized storage |
| Query Performance | Variable | Optimized for BI |

## Data Lake Architecture

### Zones
Modern data lakes organize data into zones:

1. **Raw/Bronze Zone**: Data exactly as received from sources
2. **Cleansed/Silver Zone**: Validated, deduplicated, standardized data
3. **Curated/Gold Zone**: Business-ready, aggregated datasets

### Data Lakehouse
A new architecture combining data lake flexibility with warehouse performance:
- **Delta Lake** (Databricks): ACID transactions on data lakes
- **Apache Iceberg**: Open table format for huge datasets
- **Apache Hudi**: Incremental data processing

## Cloud Data Lake Platforms

- **AWS**: S3 + Glue + Athena + EMR
- **Azure**: Data Lake Storage + Synapse + Databricks
- **Google Cloud**: GCS + Dataproc + BigQuery

## Common Use Cases

1. **Machine Learning**: Store training data in any format
2. **Data Archival**: Cost-effective long-term storage
3. **Data Exploration**: Analyze raw data before structuring
4. **IoT Data**: Ingest high-volume sensor data
5. **Log Analytics**: Store and analyze application logs

## Challenges and Solutions

- **Data Swamp**: Without governance, lakes become unusable → Use data catalogs
- **Query Performance**: Raw files are slow → Use table formats (Delta, Iceberg)
- **Security**: Sensitive data exposure → Implement row/column level security
    `.trim(),
        keyPoints: [
            'Stores raw data in any format (structured, unstructured)',
            'Schema-on-read approach (define structure at query time)',
            'Lower cost than data warehouses for storage',
            'Lakehouse architecture combines lake + warehouse benefits',
            'Key platforms: S3, Azure Data Lake, Google Cloud Storage',
        ],
        faqs: [
            {
                question: 'What is a data lake in simple terms?',
                answer: 'A data lake is a large storage system that holds raw data in its original format until you need to analyze it. Think of it as a "dump" for all your data—structured or unstructured—that can be processed later.',
            },
            {
                question: 'What is the difference between data lake and data warehouse?',
                answer: 'Data warehouses store structured, processed data ready for BI. Data lakes store raw data in any format for flexible analysis. Warehouses are faster for queries; lakes are cheaper for storage.',
            },
            {
                question: 'What is a data lakehouse?',
                answer: 'A data lakehouse combines the low-cost, flexible storage of a data lake with the performance and ACID transactions of a data warehouse. Technologies like Delta Lake, Iceberg, and Hudi enable this architecture.',
            },
            {
                question: 'What are the benefits of a data lake?',
                answer: 'Benefits include: storing any data type, lower storage costs, flexibility for data science, scalability, and the ability to keep raw data for future use cases you have not yet defined.',
            },
        ],
        relatedTerms: ['data-warehouse', 'snowflake', 'databricks', 'delta-lake', 's3'],
        relatedTools: ['AWS S3', 'Azure Data Lake', 'Databricks', 'Delta Lake', 'Apache Iceberg'],
        externalLinks: [
            { title: 'What is a Data Lake? - AWS', url: 'https://aws.amazon.com/big-data/datalakes-and-analytics/what-is-a-data-lake/' },
            { title: 'Data Lake vs Lakehouse - Databricks', url: 'https://www.databricks.com/glossary/data-lakehouse' },
        ],
        keywords: ['data lake', 'data lakehouse', 'data lake vs data warehouse', 'delta lake', 'data lake architecture'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'apache-spark',
        term: 'Apache Spark',
        slug: 'apache-spark',
        category: 'analytics',
        shortDefinition: 'A unified analytics engine for large-scale data processing, providing high-level APIs for batch processing, streaming, machine learning, and graph computation.',
        fullDefinition: `
Apache Spark is a unified analytics engine designed for large-scale data processing. It provides high-level APIs in Python, Scala, Java, and R, along with an optimized engine that supports general execution graphs. Spark can run on clusters of thousands of machines.

## Why Spark?

Spark was created to address limitations of Hadoop MapReduce:
- **Speed**: 100x faster than Hadoop for in-memory processing
- **Ease of Use**: Rich APIs vs low-level MapReduce code
- **Unified Platform**: Batch, streaming, ML, and graph in one engine
- **Versatility**: Works with any data source and storage system

## Core Components

### 1. Spark Core
The foundation providing:
- Distributed task dispatching and scheduling
- Memory management
- Fault recovery
- I/O operations

### 2. Spark SQL
Query structured data using SQL or DataFrames:
\`\`\`python
df = spark.read.parquet("s3://data/users")
df.filter(df.age > 21).groupBy("city").count().show()
\`\`\`

### 3. Spark Streaming (Structured Streaming)
Process real-time data streams:
\`\`\`python
stream_df = spark.readStream.format("kafka").load()
query = stream_df.writeStream.format("console").start()
\`\`\`

### 4. MLlib
Machine learning at scale:
- Classification, regression, clustering
- Feature engineering pipelines
- Model persistence

### 5. GraphX
Graph computation for:
- Social network analysis
- Fraud detection
- Recommendation engines

## Spark Ecosystem

- **PySpark**: Python API (most popular)
- **Spark on Databricks**: Managed Spark with collaboration features
- **Spark on EMR**: AWS managed clusters
- **Spark on Kubernetes**: Cloud-native deployment

## Common Use Cases

1. **ETL at Scale**: Process terabytes of data
2. **Data Lake Processing**: Transform raw lake data
3. **Real-time Analytics**: Stream processing pipelines
4. **Machine Learning**: Train models on big data
5. **Log Analysis**: Process application and server logs
    `.trim(),
        keyPoints: [
            'Unified engine for batch, streaming, ML, and graph processing',
            '100x faster than Hadoop MapReduce for in-memory tasks',
            'APIs available in Python (PySpark), Scala, Java, and R',
            'Can process petabytes of data across clusters',
            'Foundation for Databricks and many cloud platforms',
        ],
        faqs: [
            {
                question: 'What is Apache Spark used for?',
                answer: 'Apache Spark is used for processing large-scale data. Common use cases include ETL pipelines, real-time stream processing, machine learning, data lake transformations, and big data analytics.',
            },
            {
                question: 'Is Apache Spark better than Hadoop?',
                answer: 'For most modern use cases, yes. Spark is faster (especially for iterative tasks), easier to program, and more versatile. However, Hadoop ecosystem components like HDFS and YARN are still used alongside Spark.',
            },
            {
                question: 'What is PySpark?',
                answer: 'PySpark is the Python API for Apache Spark. It allows data engineers and scientists to write Spark jobs in Python, which is the most popular language for Spark development.',
            },
            {
                question: 'Is Spark free to use?',
                answer: 'Yes, Apache Spark is open-source and free. Commercial platforms like Databricks offer managed Spark with additional features and support.',
            },
        ],
        relatedTerms: ['databricks', 'pyspark', 'hadoop', 'data-lake', 'etl'],
        relatedTools: ['Databricks', 'AWS EMR', 'Google Dataproc', 'Azure HDInsight', 'Apache Hadoop'],
        externalLinks: [
            { title: 'Apache Spark Documentation', url: 'https://spark.apache.org/docs/latest/' },
            { title: 'PySpark Tutorial - Databricks', url: 'https://docs.databricks.com/spark/latest/spark-sql/index.html' },
        ],
        keywords: ['apache spark', 'pyspark', 'spark sql', 'spark streaming', 'spark vs hadoop'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'databricks',
        term: 'Databricks',
        slug: 'databricks',
        category: 'cloud-platforms',
        shortDefinition: 'A unified data analytics platform that combines data engineering, data science, and machine learning on a lakehouse architecture, built on Apache Spark.',
        fullDefinition: `
Databricks is a unified data analytics platform founded by the creators of Apache Spark. It combines data engineering, data science, and machine learning capabilities on a lakehouse architecture—merging the best of data lakes and data warehouses.

## What Makes Databricks Unique

### Lakehouse Architecture
Databricks pioneered the "lakehouse" concept:
- **Open Data Lake**: Store data in open formats (Delta Lake, Parquet)
- **Warehouse Performance**: ACID transactions, fast SQL queries
- **Unified Platform**: Same data for BI, ML, and streaming

### Delta Lake
Databricks' open-source storage layer:
- ACID transactions on data lakes
- Time travel (query historical data)
- Schema enforcement and evolution
- Optimized for Spark performance

## Key Components

### 1. Databricks SQL
- Run SQL queries on lakehouse data
- Connect BI tools (Tableau, Power BI)
- Serverless SQL warehouses

### 2. Databricks Notebooks
- Interactive coding in Python, SQL, Scala, R
- Collaboration features (comments, versions)
- Scheduled job execution

### 3. MLflow
- Track ML experiments
- Package and deploy models
- Model registry for governance

### 4. Unity Catalog
- Centralized governance for data and AI
- Fine-grained access control
- Data lineage tracking

## Databricks vs Snowflake

| Feature | Databricks | Snowflake |
|---------|------------|-----------|
| Architecture | Lakehouse | Cloud DW |
| ML/AI | Built-in (MLflow, AutoML) | Limited |
| Streaming | Native Spark Streaming | Limited |
| Open Formats | Delta Lake, Parquet | Proprietary |
| SQL Performance | Good | Excellent |
| Data Science | Excellent | Basic |

## Common Use Cases

1. **Unified Data Platform**: Single platform for all data workloads
2. **ML at Scale**: Train models on large datasets
3. **Real-time Analytics**: Process streaming data
4. **Data Lakehouse**: Query lake data with warehouse performance
5. **Collaborative Data Science**: Team notebooks and experiments
    `.trim(),
        keyPoints: [
            'Unified platform for data engineering, science, and ML',
            'Built on Apache Spark with Lakehouse architecture',
            'Delta Lake provides ACID transactions on data lakes',
            'Includes MLflow for ML lifecycle management',
            'Founded by the creators of Apache Spark',
        ],
        faqs: [
            {
                question: 'What is Databricks used for?',
                answer: 'Databricks is used for unified data analytics—combining data engineering, data science, and machine learning on one platform. It is particularly strong for large-scale data processing, ML workflows, and lakehouse architecture.',
            },
            {
                question: 'Is Databricks a data warehouse?',
                answer: 'Databricks is a data lakehouse, not a traditional data warehouse. It combines data lake flexibility with warehouse features like ACID transactions and fast SQL queries, enabled by Delta Lake.',
            },
            {
                question: 'Is Databricks the same as Spark?',
                answer: 'Databricks is built on Apache Spark but adds a managed cloud platform, collaboration features, Delta Lake, MLflow, and Unity Catalog. Think of it as "Spark++" with enterprise features.',
            },
            {
                question: 'Databricks vs Snowflake: which is better?',
                answer: 'Snowflake excels at SQL analytics and is simpler to use. Databricks is better for data science, ML, and when you need open formats and advanced Spark capabilities. Many organizations use both.',
            },
        ],
        relatedTerms: ['apache-spark', 'delta-lake', 'data-lake', 'snowflake', 'mlflow'],
        relatedTools: ['Apache Spark', 'Delta Lake', 'MLflow', 'Snowflake', 'AWS EMR'],
        externalLinks: [
            { title: 'Databricks Documentation', url: 'https://docs.databricks.com/' },
            { title: 'Delta Lake Documentation', url: 'https://docs.delta.io/' },
        ],
        keywords: ['databricks', 'databricks vs snowflake', 'delta lake', 'databricks tutorial', 'data lakehouse'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'kafka',
        term: 'Apache Kafka',
        slug: 'apache-kafka',
        category: 'streaming',
        shortDefinition: 'A distributed event streaming platform used for building real-time data pipelines and streaming applications, handling trillions of events per day.',
        fullDefinition: `
Apache Kafka is a distributed event streaming platform capable of handling trillions of events per day. Originally developed at LinkedIn, Kafka is now used by thousands of companies for real-time data pipelines, streaming analytics, and event-driven architectures.

## Core Concepts

### Topics
Data streams are organized into **topics**—named feeds of messages:
- Producers write to topics
- Consumers read from topics
- Topics can have multiple partitions for parallelism

### Partitions
Topics are split into partitions for scalability:
- Each partition is an ordered, immutable sequence of records
- Consumers can read partitions in parallel
- Partition count determines parallelism

### Consumer Groups
Consumers form groups to divide work:
- Each partition is consumed by exactly one consumer in the group
- Allows horizontal scaling of consumers
- Multiple groups can read the same topic independently

## Kafka Architecture

\`\`\`
Producers → [Topic: orders] → Consumers
                  │
            ┌─────┴─────┐
            │ Partition │
            │     0     │
            ├───────────┤
            │ Partition │
            │     1     │
            ├───────────┤
            │ Partition │
            │     2     │
            └───────────┘
\`\`\`

## Key Features

- **High Throughput**: Millions of messages per second
- **Low Latency**: Sub-millisecond message delivery
- **Durability**: Data replicated across brokers
- **Scalability**: Add brokers without downtime
- **Fault Tolerance**: Automatic leader election

## Kafka Ecosystem

- **Kafka Connect**: Pre-built connectors to data sources/sinks
- **Kafka Streams**: Stream processing library
- **ksqlDB**: SQL interface for stream processing
- **Schema Registry**: Manage message schemas

## Kafka Use Cases

1. **Event Sourcing**: Store all state changes as events
2. **Change Data Capture (CDC)**: Capture database changes
3. **Microservices Communication**: Async event-driven messaging
4. **Real-time Analytics**: Process events as they arrive
5. **Log Aggregation**: Collect logs from distributed systems
    `.trim(),
        keyPoints: [
            'Distributed event streaming platform',
            'Handles millions of messages per second with low latency',
            'Core concepts: Topics, Partitions, Consumer Groups',
            'Foundation for real-time data pipelines',
            'Ecosystem includes Connect, Streams, and ksqlDB',
        ],
        faqs: [
            {
                question: 'What is Apache Kafka used for?',
                answer: 'Kafka is used for building real-time data pipelines and streaming applications. Common use cases include event sourcing, log aggregation, change data capture (CDC), and microservices communication.',
            },
            {
                question: 'Is Kafka a message queue?',
                answer: 'Kafka can function as a message queue, but it is more accurately an event log. Unlike traditional queues, Kafka retains messages after consumption, allowing replay and multiple consumer groups.',
            },
            {
                question: 'What is a Kafka topic?',
                answer: 'A topic is a named stream of events in Kafka. Producers write events to topics, and consumers subscribe to topics to read events. Topics are divided into partitions for parallelism.',
            },
            {
                question: 'Is Kafka difficult to learn?',
                answer: 'Kafka basic concepts can be learned quickly, but mastering it takes time. Key challenges include understanding partitioning, consumer groups, replication, and operational best practices.',
            },
        ],
        relatedTerms: ['streaming', 'event-driven', 'data-pipeline', 'apache-spark', 'cdc'],
        relatedTools: ['Confluent', 'AWS MSK', 'Redpanda', 'Apache Pulsar', 'RabbitMQ'],
        externalLinks: [
            { title: 'Apache Kafka Documentation', url: 'https://kafka.apache.org/documentation/' },
            { title: 'Confluent Developer Tutorials', url: 'https://developer.confluent.io/tutorials/' },
        ],
        keywords: ['apache kafka', 'kafka streaming', 'kafka topics', 'kafka vs rabbitmq', 'kafka tutorial'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-modeling',
        term: 'Data Modeling',
        slug: 'data-modeling',
        category: 'data-modeling',
        shortDefinition: 'The process of creating a visual representation of data structures and relationships, defining how data is stored, organized, and accessed in databases and warehouses.',
        fullDefinition: `
Data modeling is the process of creating a visual representation of how data is structured, stored, and accessed in a system. It defines entities, attributes, relationships, and constraints—serving as the blueprint for databases and data warehouses.

## Types of Data Models

### 1. Conceptual Model
High-level business view:
- Entities and relationships
- No technical details
- Understood by business stakeholders

### 2. Logical Model
Detailed structure without platform specifics:
- Attributes and data types
- Primary and foreign keys
- Normalization rules

### 3. Physical Model
Implementation-ready design:
- Table definitions with exact data types
- Indexes and partitions
- Platform-specific optimizations

## Data Modeling Techniques

### Dimensional Modeling (Kimball)
Optimized for analytics and BI:
- **Fact Tables**: Metrics and measurements
- **Dimension Tables**: Descriptive attributes
- **Star Schema**: Fact table surrounded by dimensions
- **Snowflake Schema**: Normalized dimensions

### Data Vault
Scalable, auditable modeling:
- **Hubs**: Business keys
- **Links**: Relationships
- **Satellites**: Descriptive data with history

### One Big Table (OBT)
Modern, denormalized approach:
- Single wide table with all data
- Optimized for cloud warehouses
- Simple, fast queries

## Best Practices

1. **Start with Business Questions**: Model for how data will be used
2. **Document Everything**: Maintain a data dictionary
3. **Think About Change**: Design for schema evolution
4. **Test with Real Queries**: Validate performance early
5. **Use dbt for Implementation**: Transform raw to modeled data

## Common Mistakes

- Over-normalization for analytical workloads
- Ignoring query performance during design
- Not involving business stakeholders
- Skipping documentation
    `.trim(),
        keyPoints: [
            'Blueprint for database and warehouse design',
            'Three levels: Conceptual, Logical, Physical',
            'Dimensional modeling (Kimball) popular for analytics',
            'Data Vault provides scalability and auditability',
            'Modern trend: simpler, denormalized "One Big Table"',
        ],
        faqs: [
            {
                question: 'What is data modeling in simple terms?',
                answer: 'Data modeling is designing how data is organized and stored. It defines what data exists (entities), what properties it has (attributes), and how pieces relate to each other (relationships).',
            },
            {
                question: 'What are the types of data models?',
                answer: 'The three main types are: Conceptual (business view), Logical (detailed structure), and Physical (implementation-ready). Additionally, there are methodologies like Dimensional Modeling and Data Vault.',
            },
            {
                question: 'What is a star schema?',
                answer: 'A star schema is a dimensional modeling design where a central fact table (containing metrics) is surrounded by dimension tables (containing descriptive attributes). It resembles a star shape and is optimized for BI queries.',
            },
            {
                question: 'What tools are used for data modeling?',
                answer: 'Popular tools include dbt (for transformation modeling), Erwin, Lucidchart, dbdiagram.io, SqlDBM, and Draw.io. In modern stacks, dbt is often used to define and document models as code.',
            },
        ],
        relatedTerms: ['data-warehouse', 'dbt', 'star-schema', 'fact-table', 'dimension-table'],
        relatedTools: ['dbt', 'Erwin', 'Lucidchart', 'dbdiagram.io', 'SqlDBM'],
        externalLinks: [
            { title: 'Dimensional Modeling - Kimball Group', url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/' },
            { title: 'Data Modeling with dbt', url: 'https://docs.getdbt.com/docs/build/models' },
        ],
        keywords: ['data modeling', 'star schema', 'dimensional modeling', 'data vault', 'data model design'],
        lastUpdated: '2026-01-21',
    },
    // DATA QUALITY TERMS
    {
        id: 'data-quality',
        term: 'Data Quality',
        slug: 'data-quality',
        category: 'data-quality',
        shortDefinition: 'The measure of how well data meets the requirements for its intended use, encompassing accuracy, completeness, consistency, timeliness, and validity.',
        fullDefinition: `
Data quality refers to the overall fitness of data for its intended purpose. High-quality data is accurate, complete, consistent, timely, and valid. Poor data quality can lead to flawed analytics, bad business decisions, and compliance issues.

## Key Dimensions of Data Quality

1. **Accuracy**: Data correctly represents the real-world entity or event
2. **Completeness**: All required data is present without gaps
3. **Consistency**: Data is uniform across different systems and datasets
4. **Timeliness**: Data is available when needed and reflects current state
5. **Validity**: Data conforms to defined formats, types, and business rules
6. **Uniqueness**: No duplicate records exist

## Why Data Quality Matters

- **Business Decisions**: 40% of business initiatives fail due to poor data quality
- **Compliance**: Regulations like GDPR require accurate data handling
- **Customer Trust**: Incorrect data damages relationships
- **Operational Efficiency**: Clean data reduces manual corrections

## Data Quality Management Process

1. **Assessment**: Measure current data quality levels
2. **Profiling**: Analyze data patterns and anomalies
3. **Cleansing**: Correct or remove erroneous data
4. **Monitoring**: Continuously track quality metrics
5. **Governance**: Establish policies and ownership

## Modern Data Quality Tools

- **Great Expectations**: Open-source Python framework for data testing
- **dbt tests**: Built-in data quality assertions
- **Monte Carlo**: Data observability platform
- **Soda**: Data quality checks for data pipelines
- **Atlan**: Data governance and quality platform
    `.trim(),
        keyPoints: [
            'Measures fitness of data for intended use',
            'Six dimensions: accuracy, completeness, consistency, timeliness, validity, uniqueness',
            'Critical for reliable analytics and compliance',
            'Requires ongoing monitoring and governance',
            'Modern tools: Great Expectations, dbt tests, Monte Carlo',
        ],
        faqs: [
            {
                question: 'What is data quality in simple terms?',
                answer: 'Data quality is a measure of how good your data is for its intended purpose. High-quality data is accurate, complete, consistent, and available when needed. Poor data quality leads to wrong decisions and wasted resources.',
            },
            {
                question: 'How do you measure data quality?',
                answer: 'Data quality is measured across dimensions like accuracy (correctness), completeness (no missing values), consistency (uniform across systems), timeliness (up-to-date), and validity (correct format). Tools like Great Expectations and dbt tests automate these checks.',
            },
            {
                question: 'What causes poor data quality?',
                answer: 'Common causes include manual data entry errors, system integration issues, lack of validation rules, outdated information, duplicate records, and missing governance processes.',
            },
            {
                question: 'What is the difference between data quality and data integrity?',
                answer: 'Data quality focuses on the overall fitness of data for use (accuracy, completeness). Data integrity ensures data remains unchanged and consistent throughout its lifecycle, often through constraints and transaction controls.',
            },
        ],
        relatedTerms: ['data-governance', 'data-observability', 'great-expectations', 'data-testing'],
        relatedTools: ['Great Expectations', 'dbt', 'Monte Carlo', 'Soda', 'Atlan'],
        externalLinks: [
            { title: 'Data Quality - Wikipedia', url: 'https://en.wikipedia.org/wiki/Data_quality' },
            { title: 'Great Expectations Documentation', url: 'https://docs.greatexpectations.io/' },
        ],
        keywords: ['data quality', 'data quality dimensions', 'data quality management', 'data quality tools', 'data accuracy'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-governance',
        term: 'Data Governance',
        slug: 'data-governance',
        category: 'data-governance',
        shortDefinition: 'A framework of policies, processes, and standards for managing data assets across an organization, ensuring data is secure, compliant, and properly used.',
        fullDefinition: `
Data governance is the framework that defines who can take what actions, on what data, under what circumstances, using what methods. It establishes accountability, policies, and procedures for managing enterprise data assets.

## Core Components of Data Governance

1. **Data Ownership**: Assigning accountability for data assets to specific individuals or teams
2. **Data Stewardship**: Day-to-day management and quality oversight
3. **Data Policies**: Rules governing data usage, retention, and access
4. **Data Standards**: Naming conventions, formats, and definitions
5. **Data Catalog**: Inventory of data assets with metadata

## Key Governance Domains

- **Data Quality**: Ensuring data meets defined standards
- **Data Security**: Protecting sensitive information
- **Data Privacy**: Compliance with regulations (GDPR, CCPA)
- **Master Data Management**: Maintaining single source of truth
- **Metadata Management**: Documenting data lineage and definitions

## Why Data Governance Matters

- **Compliance**: Meet regulatory requirements (GDPR, HIPAA, SOX)
- **Trust**: Users can rely on data for decisions
- **Efficiency**: Reduce time spent searching for and validating data
- **Risk Reduction**: Prevent data breaches and misuse

## Modern Data Governance Tools

- **Atlan**: Modern data governance and catalog platform
- **Alation**: Data intelligence and cataloging
- **Collibra**: Enterprise data governance
- **Databricks Unity Catalog**: Governance for lakehouse
- **Snowflake Horizon**: Governance features in Snowflake

## Data Governance Framework

| Role | Responsibility |
|------|----------------|
| Data Owner | Strategic decisions, accountability |
| Data Steward | Quality, standards, day-to-day |
| Data Custodian | Technical implementation, security |
| Data User | Responsible use, feedback |
    `.trim(),
        keyPoints: [
            'Framework for managing data across the organization',
            'Defines ownership, policies, and standards',
            'Essential for compliance (GDPR, HIPAA, SOX)',
            'Includes data quality, security, and privacy',
            'Enabled by data catalogs and governance platforms',
        ],
        faqs: [
            {
                question: 'What is data governance in simple terms?',
                answer: 'Data governance is a set of rules and processes that define who can access what data, how data should be managed, and who is responsible for data quality and security. Think of it as the "government" for your data.',
            },
            {
                question: 'Why is data governance important?',
                answer: 'Data governance ensures data is accurate, secure, and compliant with regulations. Without it, organizations face risks like data breaches, compliance fines, poor decisions from bad data, and inefficient operations.',
            },
            {
                question: 'What is the difference between data governance and data management?',
                answer: 'Data governance defines the "what" and "why" (policies, standards, ownership). Data management is the "how" (actual implementation of storage, processing, and delivery of data). Governance is strategic; management is operational.',
            },
            {
                question: 'What is a data steward?',
                answer: 'A data steward is responsible for the day-to-day management and quality of specific data domains. They ensure data meets quality standards, maintain documentation, and act as a point of contact for data-related questions.',
            },
        ],
        relatedTerms: ['data-quality', 'data-catalog', 'data-lineage', 'metadata'],
        relatedTools: ['Atlan', 'Alation', 'Collibra', 'Databricks Unity Catalog', 'Monte Carlo'],
        externalLinks: [
            { title: 'Data Governance - Gartner', url: 'https://www.gartner.com/en/information-technology/glossary/data-governance' },
            { title: 'Data Governance Framework - DAMA', url: 'https://www.dama.org/cpages/body-of-knowledge' },
        ],
        keywords: ['data governance', 'data governance framework', 'data steward', 'data governance tools', 'enterprise data governance'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-observability',
        term: 'Data Observability',
        slug: 'data-observability',
        category: 'data-observability',
        shortDefinition: 'The ability to understand the health and state of data in your systems by monitoring data quality, freshness, volume, schema changes, and lineage in real-time.',
        fullDefinition: `
Data observability is an organization's ability to fully understand the health of data across their data systems. Inspired by software observability principles, it applies monitoring, alerting, and root cause analysis to data pipelines and datasets.

## The Five Pillars of Data Observability

1. **Freshness**: Is the data up-to-date? When was it last updated?
2. **Volume**: Is the expected amount of data present?
3. **Schema**: Has the structure of data changed unexpectedly?
4. **Distribution**: Are values within expected ranges?
5. **Lineage**: Where did this data come from and what depends on it?

## Why Data Observability Matters

Traditional data quality checks run after problems occur. Data observability provides:
- **Proactive Detection**: Catch issues before they impact dashboards
- **Faster Resolution**: Trace problems to their source quickly
- **Reduced Downtime**: Alert on anomalies automatically
- **Trust**: Stakeholders can rely on data availability

## Data Observability vs Data Quality

| Aspect | Data Quality | Data Observability |
|--------|--------------|-------------------|
| Focus | Data content (accuracy, completeness) | System health and behavior |
| Timing | Often batch/scheduled checks | Real-time monitoring |
| Scope | Individual datasets | End-to-end pipelines |
| Approach | Rule-based tests | Anomaly detection + rules |

## Data Observability Tools

- **Monte Carlo**: Leading data observability platform
- **Bigeye**: Automated data quality monitoring
- **Acceldata**: Data observability for enterprises
- **Datadog**: Extending APM to data pipelines
- **Great Expectations**: Open-source data testing

## Implementing Data Observability

1. **Instrument Pipelines**: Add monitoring to key data flows
2. **Establish Baselines**: Understand normal patterns
3. **Set Alerts**: Notify teams of anomalies
4. **Build Lineage**: Map dependencies between datasets
5. **Create Runbooks**: Document resolution procedures
    `.trim(),
        keyPoints: [
            'Applies software observability principles to data',
            'Five pillars: freshness, volume, schema, distribution, lineage',
            'Proactive anomaly detection vs reactive quality checks',
            'Enables faster incident resolution with lineage',
            'Key tools: Monte Carlo, Bigeye, Great Expectations',
        ],
        faqs: [
            {
                question: 'What is data observability?',
                answer: 'Data observability is the ability to monitor and understand the health of your data in real-time. It tracks freshness, volume, schema changes, and data quality anomalies across your entire data platform.',
            },
            {
                question: 'How is data observability different from data quality?',
                answer: 'Data quality focuses on whether data meets defined standards (accuracy, completeness). Data observability monitors the entire data system health including pipeline performance, freshness, and automatic anomaly detection.',
            },
            {
                question: 'What tools are used for data observability?',
                answer: 'Popular data observability tools include Monte Carlo, Bigeye, Acceldata, and Great Expectations. Some data platforms like Databricks and Snowflake also offer built-in observability features.',
            },
            {
                question: 'What is data downtime?',
                answer: 'Data downtime refers to periods when data is missing, incorrect, or stale. Similar to application downtime, data downtime impacts business operations and can lead to wrong decisions. Data observability helps minimize data downtime.',
            },
        ],
        relatedTerms: ['data-quality', 'data-lineage', 'data-pipeline', 'monte-carlo'],
        relatedTools: ['Monte Carlo', 'Bigeye', 'Great Expectations', 'Acceldata', 'Datadog'],
        externalLinks: [
            { title: 'What is Data Observability? - Monte Carlo', url: 'https://www.montecarlodata.com/data-observability/' },
            { title: 'Data Observability - Gartner', url: 'https://www.gartner.com/en/documents/4009814' },
        ],
        keywords: ['data observability', 'data observability tools', 'data monitoring', 'data freshness', 'data downtime'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-lineage',
        term: 'Data Lineage',
        slug: 'data-lineage',
        category: 'data-governance',
        shortDefinition: 'The documentation and visualization of data as it flows from source to destination, showing transformations, dependencies, and ownership at each step.',
        fullDefinition: `
Data lineage is the complete lifecycle of data from origin to consumption. It documents where data comes from, how it moves through systems, what transformations are applied, and what depends on it. Think of it as a visual map of your data's journey.

## Types of Data Lineage

1. **Technical Lineage**: Column-to-column mappings, SQL transformations
2. **Business Lineage**: High-level flow between business concepts
3. **Operational Lineage**: Runtime execution details and timing

## Why Data Lineage Matters

- **Impact Analysis**: Know what breaks if you change a source
- **Root Cause Analysis**: Trace data issues to their origin
- **Compliance**: Demonstrate data handling for audits
- **Trust**: Understand where dashboard numbers come from
- **Migration**: Plan system changes with confidence

## Data Lineage Components

- **Source**: Where data originates (database, API, file)
- **Transformation**: How data is modified (joins, aggregations)
- **Destination**: Where data lands (warehouse, dashboard)
- **Dependencies**: What downstream systems rely on this data
- **Metadata**: Column names, types, descriptions

## Lineage Capture Methods

| Method | Pros | Cons |
|--------|------|------|
| SQL Parsing | Accurate, automatic | Complex to implement |
| API Integration | Real-time | Vendor-specific |
| Manual Documentation | Flexible | Outdated quickly |
| Log Analysis | Runtime truth | Incomplete picture |

## Data Lineage Tools

- **Atlan**: Active metadata platform with lineage
- **Alation**: Data catalog with lineage
- **OpenLineage**: Open standard for lineage
- **dbt**: Built-in lineage for SQL models
- **DataHub**: Open-source metadata platform
    `.trim(),
        keyPoints: [
            'Documents data flow from source to destination',
            'Shows transformations and dependencies',
            'Essential for impact analysis and debugging',
            'Required for compliance and audits',
            'Captured via SQL parsing, APIs, or manual documentation',
        ],
        faqs: [
            {
                question: 'What is data lineage in simple terms?',
                answer: 'Data lineage is a map showing where your data comes from, how it changes as it moves through systems, and where it ends up. It answers "where did this number in my dashboard come from?"',
            },
            {
                question: 'Why is data lineage important?',
                answer: 'Data lineage helps you understand data origin for trust, trace issues to their source for debugging, assess impact of changes, and demonstrate compliance for audits. Without lineage, you are flying blind.',
            },
            {
                question: 'How do you implement data lineage?',
                answer: 'Data lineage can be implemented through SQL parsing tools, data catalog platforms like Atlan or Alation, open standards like OpenLineage, or tools like dbt that track lineage automatically for transformations.',
            },
            {
                question: 'What is the difference between data lineage and data provenance?',
                answer: 'Data lineage shows the flow and transformation of data. Data provenance focuses on the origin and history of a specific data point, including who created it and when. Provenance is a subset of lineage.',
            },
        ],
        relatedTerms: ['data-governance', 'data-catalog', 'metadata', 'dbt'],
        relatedTools: ['Atlan', 'Alation', 'OpenLineage', 'dbt', 'DataHub'],
        externalLinks: [
            { title: 'OpenLineage', url: 'https://openlineage.io/' },
            { title: 'Data Lineage - Atlan', url: 'https://atlan.com/data-lineage/' },
        ],
        keywords: ['data lineage', 'data lineage tools', 'data lineage diagram', 'data provenance', 'data flow'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-catalog',
        term: 'Data Catalog',
        slug: 'data-catalog',
        category: 'data-governance',
        shortDefinition: 'A centralized inventory of data assets in an organization, providing metadata, documentation, search capabilities, and lineage to enable data discovery and governance.',
        fullDefinition: `
A data catalog is like a search engine for your organization's data. It provides a centralized inventory of data assets with metadata, documentation, and lineage information, making it easy to find, understand, and trust data.

## Core Capabilities

1. **Data Discovery**: Search and browse across all data sources
2. **Metadata Management**: Store technical and business metadata
3. **Data Documentation**: Descriptions, owners, and classifications
4. **Data Lineage**: Visualize data flow and dependencies
5. **Access Control**: Manage who can see and use data

## Types of Metadata in Catalogs

- **Technical Metadata**: Schema, data types, row counts
- **Business Metadata**: Descriptions, owners, domains
- **Operational Metadata**: Update frequency, job history
- **Social Metadata**: User ratings, comments, usage stats

## Why Data Catalogs Matter

- **Self-Service**: Users find data without asking engineers
- **Governance**: Track ownership and access policies
- **Productivity**: Reduce time spent searching for data
- **Trust**: Understand data quality and freshness
- **Compliance**: Document sensitive data locations

## Modern Data Catalog Features

- **AI-Powered Search**: Natural language queries
- **Auto-Documentation**: ML-generated descriptions
- **Collaboration**: Comments, Q&A, annotations
- **Lineage Integration**: End-to-end data flow
- **Access Requests**: Self-service data access

## Popular Data Catalog Tools

| Tool | Type | Best For |
|------|------|----------|
| Atlan | Active Metadata | Modern data teams |
| Alation | Enterprise | Large organizations |
| DataHub | Open Source | Technical teams |
| Unity Catalog | Built-in | Databricks users |
| Collibra | Enterprise | Governance-focused |
    `.trim(),
        keyPoints: [
            'Centralized inventory of data assets',
            'Enables data discovery and self-service',
            'Stores technical, business, and operational metadata',
            'Integrates lineage and governance features',
            'Key tools: Atlan, Alation, DataHub, Unity Catalog',
        ],
        faqs: [
            {
                question: 'What is a data catalog?',
                answer: 'A data catalog is a centralized inventory of an organization\'s data assets. It provides search, metadata, documentation, and lineage to help users find, understand, and trust data without asking engineers.',
            },
            {
                question: 'Why do organizations need a data catalog?',
                answer: 'Data catalogs enable self-service data discovery, reduce time finding data, improve governance through documented ownership, and build trust by showing data quality and lineage.',
            },
            {
                question: 'What is the difference between a data catalog and a data dictionary?',
                answer: 'A data dictionary focuses on technical definitions (column names, types). A data catalog is broader, including business context, ownership, lineage, quality metrics, and social features like ratings and comments.',
            },
            {
                question: 'What are the best data catalog tools?',
                answer: 'Popular data catalog tools include Atlan (modern, collaborative), Alation (enterprise), Collibra (governance), DataHub (open-source), and Databricks Unity Catalog (for Databricks users).',
            },
        ],
        relatedTerms: ['data-governance', 'data-lineage', 'metadata', 'data-discovery'],
        relatedTools: ['Atlan', 'Alation', 'DataHub', 'Collibra', 'Unity Catalog'],
        externalLinks: [
            { title: 'What is a Data Catalog? - Atlan', url: 'https://atlan.com/what-is-a-data-catalog/' },
            { title: 'DataHub Open Source', url: 'https://datahubproject.io/' },
        ],
        keywords: ['data catalog', 'data catalog tools', 'data discovery', 'metadata management', 'enterprise data catalog'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'data-contracts',
        term: 'Data Contracts',
        slug: 'data-contracts',
        category: 'data-quality',
        shortDefinition: 'Formal agreements between data producers and consumers that define the structure, semantics, and quality expectations of data, enabling reliable data collaboration.',
        fullDefinition: `
Data contracts are formal agreements between data producers (teams generating data) and data consumers (teams using data). They define what data will look like, its quality guarantees, and how changes will be communicated.

## What Data Contracts Include

1. **Schema Definition**: Column names, types, constraints
2. **Semantic Meaning**: Business definitions and context
3. **Quality SLAs**: Freshness, completeness, accuracy guarantees
4. **Ownership**: Who is responsible for the data
5. **Change Management**: How breaking changes are handled

## Why Data Contracts Matter

Traditional data pipelines are fragile:
- Upstream changes break downstream systems
- No clear ownership or accountability
- Quality issues discovered too late
- Implicit expectations cause confusion

Data contracts solve this by making expectations explicit.

## Data Contract Example

\`\`\`yaml
name: orders
version: 1.0.0
owner: commerce-team
schema:
  - name: order_id
    type: string
    required: true
  - name: total_amount
    type: decimal
    required: true
quality:
  freshness: 1 hour
  completeness: 99%
\`\`\`

## Implementing Data Contracts

1. **Define Standards**: Create a contract template
2. **Identify Critical Data**: Start with key datasets
3. **Negotiate Terms**: Producers and consumers agree
4. **Validate Automatically**: Check contracts in CI/CD
5. **Monitor Compliance**: Track SLA adherence

## Data Contract Tools

- **Soda**: Data quality with contracts
- **Great Expectations**: Contract-like expectations
- **dbt Contracts**: Schema contracts in dbt
- **Datacontract.com**: Open standard and CLI
- **Monte Carlo**: SLA monitoring
    `.trim(),
        keyPoints: [
            'Formal agreements between data producers and consumers',
            'Define schema, semantics, and quality SLAs',
            'Prevent breaking changes and unclear ownership',
            'Validated automatically in CI/CD pipelines',
            'Part of Data Mesh and modern data architectures',
        ],
        faqs: [
            {
                question: 'What is a data contract?',
                answer: 'A data contract is a formal agreement between data producers and consumers that specifies the expected schema, quality guarantees, and change management process for a dataset. It makes implicit expectations explicit.',
            },
            {
                question: 'Why are data contracts important?',
                answer: 'Data contracts prevent breaking changes, establish clear ownership, define quality SLAs, and enable reliable data collaboration. They shift quality left by validating data at the source.',
            },
            {
                question: 'How do data contracts relate to Data Mesh?',
                answer: 'Data contracts are a core principle of Data Mesh architecture. They enable domain teams to publish reliable data products that other teams can consume with confidence, treating data as a product.',
            },
            {
                question: 'What tools support data contracts?',
                answer: 'Tools supporting data contracts include Soda, Great Expectations, dbt (model contracts), Datacontract.com (open standard), and Monte Carlo for SLA monitoring.',
            },
        ],
        relatedTerms: ['data-quality', 'data-mesh', 'schema', 'data-governance'],
        relatedTools: ['Soda', 'Great Expectations', 'dbt', 'Monte Carlo'],
        externalLinks: [
            { title: 'Data Contracts - Datacontract.com', url: 'https://datacontract.com/' },
            { title: 'Data Contracts Explained', url: 'https://www.dataengineeringweekly.com/p/data-contracts' },
        ],
        keywords: ['data contracts', 'data contract specification', 'data mesh contracts', 'schema contracts', 'data SLA'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'great-expectations',
        term: 'Great Expectations',
        slug: 'great-expectations',
        category: 'data-quality',
        shortDefinition: 'An open-source Python framework for defining, documenting, and validating data quality expectations against datasets in data pipelines.',
        fullDefinition: `
Great Expectations (GX) is an open-source Python library for data testing, documentation, and profiling. It helps data teams define "expectations" about their data and validate those expectations automatically in pipelines.

## Core Concepts

1. **Expectations**: Assertions about data (e.g., "column A should not be null")
2. **Expectation Suites**: Collections of expectations for a dataset
3. **Data Sources**: Connections to your data (Pandas, Spark, SQL)
4. **Checkpoints**: Validation runbooks that execute expectations
5. **Data Docs**: Auto-generated documentation of expectations and results

## Example Expectations

\`\`\`python
import great_expectations as gx

# Create a Data Source
context = gx.get_context()
validator = context.sources.add_pandas("my_data").read_dataframe(df)

# Define Expectations
validator.expect_column_values_to_not_be_null("user_id")
validator.expect_column_values_to_be_in_set("status", ["active", "inactive"])
validator.expect_column_mean_to_be_between("order_total", 50, 200)
\`\`\`

## Why Teams Use Great Expectations

- **Catch Issues Early**: Validate data before it reaches downstream
- **Documentation**: Auto-generate data quality docs
- **Collaboration**: Share expectations across teams
- **Integration**: Works with Airflow, dbt, Spark, and more
- **Open Source**: Free to use with commercial support

## Great Expectations GX Cloud

The SaaS version adds:
- Hosted expectation management
- Collaboration features
- Alerting and notifications
- Metrics and dashboards

## Integration with Data Tools

- **Airflow**: GX operators for pipeline validation
- **dbt**: Run GX after dbt models
- **Spark**: Validate large-scale data
- **Prefect/Dagster**: Native integrations
    `.trim(),
        keyPoints: [
            'Open-source Python library for data testing',
            'Define "expectations" as assertions about data',
            'Auto-generates data documentation (Data Docs)',
            'Integrates with Airflow, dbt, Spark, and more',
            'GX Cloud offers hosted management and alerting',
        ],
        faqs: [
            {
                question: 'What is Great Expectations used for?',
                answer: 'Great Expectations is used for testing and validating data quality in pipelines. It lets you define expectations (assertions) about your data and automatically validate them, catching issues before they impact downstream systems.',
            },
            {
                question: 'Is Great Expectations free?',
                answer: 'Yes, Great Expectations (GX Core) is open-source and free. GX Cloud is a commercial product that adds hosted management, collaboration, and alerting features.',
            },
            {
                question: 'How does Great Expectations compare to dbt tests?',
                answer: 'dbt tests are simpler and SQL-based, great for basic checks. Great Expectations offers more advanced expectations, profiling, auto-documentation, and works with any data source beyond SQL warehouses.',
            },
            {
                question: 'What is an Expectation Suite?',
                answer: 'An Expectation Suite is a collection of expectations (tests) for a specific dataset. For example, an "orders" suite might include expectations for non-null order_id, valid status values, and reasonable amounts.',
            },
        ],
        relatedTerms: ['data-quality', 'data-testing', 'dbt', 'data-observability'],
        relatedTools: ['dbt', 'Soda', 'Monte Carlo', 'Apache Airflow', 'Pandas'],
        externalLinks: [
            { title: 'Great Expectations Documentation', url: 'https://docs.greatexpectations.io/' },
            { title: 'GX GitHub', url: 'https://github.com/great-expectations/great_expectations' },
        ],
        keywords: ['great expectations', 'great expectations python', 'data testing', 'data validation', 'gx cloud'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'fivetran',
        term: 'Fivetran',
        slug: 'fivetran',
        category: 'data-integration',
        shortDefinition: 'A fully managed data integration platform that automatically syncs data from hundreds of sources to data warehouses and lakes with minimal configuration.',
        fullDefinition: `
Fivetran is a fully managed ELT (Extract, Load) platform that automates data replication from SaaS applications, databases, and other sources to data warehouses and lakes. It handles the E and L, leaving the T to tools like dbt.

## How Fivetran Works

1. **Connect**: Select a source (e.g., Salesforce, PostgreSQL)
2. **Configure**: Provide credentials and select tables
3. **Sync**: Fivetran automatically extracts and loads data
4. **Transform**: Use dbt or SQL for transformations

## Key Features

- **Automated Schema Migration**: Handles source changes automatically
- **Incremental Updates**: Syncs only new/changed data
- **300+ Connectors**: Pre-built integrations to popular sources
- **Normalized Schemas**: Standardized table structures
- **Transformations**: Built-in dbt Core for basic transforms

## Popular Connectors

| Category | Sources |
|----------|---------|
| CRM | Salesforce, HubSpot |
| Marketing | Google Ads, Facebook Ads |
| Databases | PostgreSQL, MySQL, MongoDB |
| SaaS | Stripe, Zendesk, Jira |
| Files | Google Sheets, S3 |

## Fivetran vs Alternatives

- **vs Airbyte**: Fivetran is managed, Airbyte is open-source
- **vs Stitch**: Similar but Fivetran has more enterprise features
- **vs Custom Code**: Fivetran eliminates maintenance overhead

## Pricing Model

Fivetran uses Monthly Active Rows (MAR) pricing:
- Pay based on rows updated each month
- Predictable costs for stable datasets
- Can be expensive for high-change data
    `.trim(),
        keyPoints: [
            'Fully managed data integration platform',
            '300+ pre-built connectors to sources',
            'Handles schema changes automatically',
            'Syncs to Snowflake, BigQuery, Redshift, Databricks',
            'Monthly Active Rows (MAR) pricing model',
        ],
        faqs: [
            {
                question: 'What is Fivetran used for?',
                answer: 'Fivetran is used for automatically syncing data from various sources (SaaS apps, databases) to data warehouses. It handles the Extract and Load steps, letting you focus on transformations with tools like dbt.',
            },
            {
                question: 'Is Fivetran an ETL tool?',
                answer: 'Fivetran is an EL (Extract, Load) or ELT tool. It extracts and loads data to your warehouse, but transformations happen after loading using tools like dbt, not before loading like traditional ETL.',
            },
            {
                question: 'How does Fivetran pricing work?',
                answer: 'Fivetran uses Monthly Active Rows (MAR) pricing. You pay based on the number of unique rows that are updated or inserted each month, not total data volume.',
            },
            {
                question: 'Fivetran vs Airbyte: which is better?',
                answer: 'Fivetran is fully managed with enterprise support and more polished connectors. Airbyte is open-source and cheaper but requires self-hosting. Choose Fivetran for reliability; Airbyte for cost savings.',
            },
        ],
        relatedTerms: ['etl', 'airbyte', 'dbt', 'data-warehouse', 'data-integration'],
        relatedTools: ['Airbyte', 'Stitch', 'dbt', 'Snowflake', 'BigQuery'],
        externalLinks: [
            { title: 'Fivetran Documentation', url: 'https://fivetran.com/docs' },
            { title: 'Fivetran Connectors', url: 'https://fivetran.com/connectors' },
        ],
        keywords: ['fivetran', 'fivetran connectors', 'fivetran vs airbyte', 'data integration', 'managed etl'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'airbyte',
        term: 'Airbyte',
        slug: 'airbyte',
        category: 'data-integration',
        shortDefinition: 'An open-source data integration platform with 300+ connectors for syncing data from APIs, databases, and files to data warehouses and lakes.',
        fullDefinition: `
Airbyte is an open-source data integration platform that moves data from sources (databases, APIs, SaaS apps) to destinations (data warehouses, lakes). It's the leading open-source alternative to Fivetran.

## Deployment Options

1. **Self-Hosted (OSS)**: Free, deploy on your infrastructure
2. **Airbyte Cloud**: Managed SaaS version
3. **Airbyte Enterprise**: Self-hosted with enterprise features

## Key Features

- **300+ Connectors**: Community and Airbyte-maintained
- **Connector Builder**: Create custom connectors without code
- **Incremental Sync**: Only sync new/changed data
- **Schema Normalization**: Optional data normalization
- **CDC Support**: Change Data Capture for databases
- **Airbyte Protocol**: Open standard for connectors

## Why Teams Choose Airbyte

- **Cost**: Self-hosted version is free
- **Flexibility**: Deploy anywhere, customize everything
- **Community**: Active open-source community
- **Transparency**: Know exactly how data is moved
- **Extensibility**: Build custom connectors easily

## Airbyte Architecture

\`\`\`
Sources → Airbyte Workers → Destinations
           (Docker)
             ↓
         Connector
        (Singer, etc.)
\`\`\`

## Airbyte vs Fivetran

| Aspect | Airbyte | Fivetran |
|--------|---------|----------|
| Pricing | Free (OSS) or Cloud | MAR-based |
| Hosting | Self or Cloud | Managed only |
| Connectors | 300+ (community) | 300+ (maintained) |
| Support | Community + Enterprise | Enterprise |
    `.trim(),
        keyPoints: [
            'Open-source data integration platform',
            '300+ connectors maintained by community',
            'Self-hosted (free) or Airbyte Cloud options',
            'Connector Builder for custom integrations',
            'Leading open-source alternative to Fivetran',
        ],
        faqs: [
            {
                question: 'What is Airbyte?',
                answer: 'Airbyte is an open-source data integration platform that syncs data from sources (APIs, databases, SaaS apps) to destinations (data warehouses, data lakes). It is a popular free alternative to Fivetran.',
            },
            {
                question: 'Is Airbyte free?',
                answer: 'Airbyte Core (self-hosted) is free and open-source. Airbyte Cloud is a paid managed service. Airbyte Enterprise adds commercial features to self-hosted deployments.',
            },
            {
                question: 'How does Airbyte compare to Fivetran?',
                answer: 'Airbyte is open-source and can be self-hosted for free. Fivetran is fully managed with more polished connectors. Choose Airbyte for cost savings and control; Fivetran for reliability and support.',
            },
            {
                question: 'What is the Airbyte Connector Builder?',
                answer: 'The Connector Builder is a no-code tool for creating custom Airbyte connectors. You can define API sources visually without writing code, then use them like any other connector.',
            },
        ],
        relatedTerms: ['fivetran', 'etl', 'data-integration', 'dbt', 'cdc'],
        relatedTools: ['Fivetran', 'Stitch', 'dbt', 'Snowflake', 'BigQuery'],
        externalLinks: [
            { title: 'Airbyte Documentation', url: 'https://docs.airbyte.com/' },
            { title: 'Airbyte GitHub', url: 'https://github.com/airbytehq/airbyte' },
        ],
        keywords: ['airbyte', 'airbyte connectors', 'airbyte vs fivetran', 'open source etl', 'data integration'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'cdc',
        term: 'Change Data Capture (CDC)',
        slug: 'cdc',
        category: 'data-integration',
        shortDefinition: 'A technique for identifying and capturing changes made to data in a database, enabling real-time or near-real-time data replication to other systems.',
        fullDefinition: `
Change Data Capture (CDC) is a technique that identifies and captures changes (inserts, updates, deletes) made to data in a database. Instead of copying entire tables, CDC streams only the changes, enabling efficient real-time data replication.

## Why CDC Matters

Traditional batch extraction is inefficient:
- **Full loads**: Copy entire tables repeatedly
- **Timestamp-based**: Misses deletes, requires modification tracking
- **Performance impact**: Heavy queries on source systems

CDC solves these issues by capturing changes at the source.

## CDC Methods

1. **Log-Based CDC**: Read database transaction logs (most efficient)
2. **Trigger-Based CDC**: Database triggers capture changes
3. **Timestamp-Based**: Query for recently modified rows (not true CDC)
4. **Diff-Based**: Compare snapshots (resource intensive)

## Log-Based CDC Flow

\`\`\`
Source DB → Transaction Log → CDC Tool → Target System
(MySQL,      (binlog, WAL)    (Debezium)   (Kafka, DW)
 Postgres)
\`\`\`

## Popular CDC Tools

| Tool | Type | Best For |
|------|------|----------|
| Debezium | Open Source | Kafka integration |
| Fivetran | Managed | Easy setup |
| Airbyte | Open Source | Self-hosted |
| AWS DMS | Cloud | AWS ecosystems |
| Striim | Enterprise | Complex transforms |

## CDC Use Cases

- **Data Warehousing**: Near-real-time warehouse updates
- **Microservices**: Sync data between services
- **Event Sourcing**: Capture all state changes
- **Cache Invalidation**: Update caches on data change
- **Search Indexing**: Keep Elasticsearch in sync
    `.trim(),
        keyPoints: [
            'Captures database changes (insert, update, delete) in real-time',
            'More efficient than full table extracts',
            'Log-based CDC reads transaction logs directly',
            'Enables near-real-time data replication',
            'Key tools: Debezium, Fivetran, Airbyte, AWS DMS',
        ],
        faqs: [
            {
                question: 'What is Change Data Capture (CDC)?',
                answer: 'CDC is a technique for capturing changes made to data in a database (inserts, updates, deletes) and streaming them to other systems. It enables real-time data replication without copying entire tables.',
            },
            {
                question: 'Why is CDC better than batch extraction?',
                answer: 'CDC is more efficient because it only transfers changed data, not entire tables. It captures deletes (which timestamp methods miss), has lower impact on source systems, and enables near-real-time data freshness.',
            },
            {
                question: 'What is Debezium?',
                answer: 'Debezium is an open-source CDC platform that reads database transaction logs and streams changes to Apache Kafka. It supports MySQL, PostgreSQL, MongoDB, SQL Server, and other databases.',
            },
            {
                question: 'What is log-based CDC?',
                answer: 'Log-based CDC reads the database transaction log (binlog in MySQL, WAL in PostgreSQL) to capture changes. This is the most efficient CDC method as it does not query the database directly.',
            },
        ],
        relatedTerms: ['data-replication', 'kafka', 'debezium', 'etl', 'streaming'],
        relatedTools: ['Debezium', 'Fivetran', 'Airbyte', 'AWS DMS', 'Kafka'],
        externalLinks: [
            { title: 'Debezium Documentation', url: 'https://debezium.io/documentation/' },
            { title: 'CDC Explained - Confluent', url: 'https://www.confluent.io/learn/change-data-capture/' },
        ],
        keywords: ['change data capture', 'cdc', 'cdc database', 'debezium', 'log-based cdc', 'data replication'],
        lastUpdated: '2026-01-21',
    },
    // AWS Terms
    {
        id: 'amazon-s3',
        term: 'Amazon S3',
        slug: 'amazon-s3',
        category: 'aws-cloud',
        shortDefinition: 'Amazon Simple Storage Service (S3) is an object storage service offering industry-leading scalability, data availability, security, and performance.',
        fullDefinition: `
Amazon S3 (Simple Storage Service) is the backbone of most data lakes on AWS. It stores data as objects within buckets and is designed for 99.999999999% (11 9s) of durability.

## Key Features
- **Object Storage**: Stores data of any type (JSON, CSV, Parquet, Images)
- **Tiered Storage**: S3 Standard, S3 Intelligent-Tiering, S3 Glacier for cost optimization
- **Event Notifications**: Trigger Lambda functions on file uploads
- **Security**: Server-side encryption, IAM policies, Bucket policies

## Use Cases
- **Data Lakes**: Primary storage for raw and processed data
- **Backup & Archive**: Long-term retention using Glacier
- **Static Website Hosting**: Host frontend apps directly
- **Big Data Analytics**: Storage for EMR, Athena, and Redshift Spectrum
        `.trim(),
        keyPoints: ['11 9s Durability', 'Infinite Scalability', 'Integration with all AWS data tools', 'Lifecycle policies'],
        faqs: [
            { question: 'What is an S3 Bucket?', answer: 'A bucket is a container for objects stored in Amazon S3. Every object is contained in a bucket.' },
            { question: 'What is the difference between S3 and EBS?', answer: 'S3 is object storage (files, metadata) accessible via API over the web. EBS is block storage (like a hard drive) attached to EC2 instances.' },
        ],
        relatedTerms: ['data-lake', 'aws-glue', 'amazon-athena', 'object-storage'],
        relatedTools: ['AWS CLI', 'Boto3', 'Terraform'],
        externalLinks: [{ title: 'Amazon S3 Documentation', url: 'https://docs.aws.amazon.com/s3/' }],
        keywords: ['s3', 'aws s3', 'object storage', 'data lake', 'storage tiers'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'amazon-redshift',
        term: 'Amazon Redshift',
        slug: 'amazon-redshift',
        category: 'aws-cloud',
        shortDefinition: 'A fully managed, petabyte-scale cloud data warehouse service in the cloud.',
        fullDefinition: `
Amazon Redshift is a column-oriented, massively parallel processing (MPP) data warehouse. It is based on PostgreSQL but optimized for OLAP workloads.

## Key Architecture
- **Leader Node**: Manages communications and query parsing
- **Compute Nodes**: Execute queries in parallel
- **Redshift Spectrum**: Query data directly in S3 without loading it
- **Aqua**: Hardware accelerated cache

## Pricing
- On-demand or Reserved Instances
- Redshift Serverless (pay for usage)
        `.trim(),
        keyPoints: ['MPP Architecture', 'Columnar Storage', 'SQL Interface', 'Integration with S3 via Spectrum'],
        relatedTerms: ['data-warehouse', 'olap', 'snowflake', 'mpp'],
        relatedTools: ['dbt', 'Tableau', 'QuickSight'],
        externalLinks: [{ title: 'Redshift Documentation', url: 'https://docs.aws.amazon.com/redshift/' }],
        keywords: ['redshift', 'data warehouse', 'aws dw', 'olap'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'aws-glue',
        term: 'AWS Glue',
        slug: 'aws-glue',
        category: 'aws-cloud',
        shortDefinition: 'A serverless data integration service that makes it easy to discover, prepare, and combine data for analytics, machine learning, and application development.',
        fullDefinition: `
AWS Glue is a fully managed ETL (Extract, Transform, and Load) service. It provides both visual and code-based interfaces for data integration.

## Key Components
- **Glue Data Catalog**: A centralized metadata repository for all data assets
- **Glue Jobs**: Serverless Spark or Python shell jobs for processing
- **Glue Crawlers**: Automatically discover schema from S3 and populate the Catalog
- **Glue Studio**: Visual interface for building ETL workflows
        `.trim(),
        keyPoints: ['Serverless ETL', 'Centralized Data Catalog', 'Automatic Schema Discovery', 'Apache Spark under the hood'],
        relatedTerms: ['etl', 'apache-spark', 'meta-store', 'schema-registry'],
        relatedTools: ['Apache Spark', 'Athena', 'EMR'],
        externalLinks: [{ title: 'AWS Glue Documentation', url: 'https://docs.aws.amazon.com/glue/' }],
        keywords: ['aws glue', 'etl', 'serverless', 'data catalog', 'glue crawler'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'amazon-emr',
        term: 'Amazon EMR',
        slug: 'amazon-emr',
        category: 'aws-cloud',
        shortDefinition: 'A cloud big data platform for running large-scale distributed data processing jobs, interactive SQL queries, and machine learning applications using open-source analytics frameworks.',
        fullDefinition: `
Amazon EMR (Elastic MapReduce) allows you to easily run open-source big data frameworks such as Apache Spark, Hive, Presto, and HBase on AWS.

## Features
- **Managed Clusters**: Automates provisioning and scaling of EC2 instances
- **Transient or Long-running**: Spin up for a job and terminate, or keep running
- **EMR Serverless**: Run applications without managing clusters
        `.trim(),
        keyPoints: ['Managed Hadoop/Spark', 'Cost-effective with Spot Instances', ' decoupling of storage (S3) and compute'],
        relatedTerms: ['apache-spark', 'hadoop', 'hive', 'big-data'],
        relatedTools: ['Apache Spark', 'Hadoop', 'Presto'],
        externalLinks: [{ title: 'Amazon EMR Documentation', url: 'https://docs.aws.amazon.com/emr/' }],
        keywords: ['emr', 'hadoop', 'spark', 'big data cluster'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'amazon-athena',
        term: 'Amazon Athena',
        slug: 'amazon-athena',
        category: 'aws-cloud',
        shortDefinition: 'A serverless, interactive analytics service built on open-source frameworks, supporting open-table and file formats.',
        fullDefinition: `
Amazon Athena allows you to analyze data in Amazon S3 using standard SQL. It is serverless, meaning there is no infrastructure to manage, and you pay only for the queries that you run.

## How it works
- Built on **Presto/Trino** engine
- Queries data directly in S3 (no loading required)
- Uses **Glue Data Catalog** for schema definitions
- Supports CSV, JSON, ORC, Parquet, Avro

## Use Cases
- Ad-hoc analysis of logs
- Quick exploration of data lake
        `.trim(),
        keyPoints: ['Serverless SQL', 'Query S3 directly', 'Pay-per-query', 'Presto engine'],
        relatedTerms: ['sql', 'data-lake', 'presto', 'trino', 'amazon-s3'],
        relatedTools: ['QuickSight', 'Tableau'],
        externalLinks: [{ title: 'Amazon Athena Documentation', url: 'https://docs.aws.amazon.com/athena/' }],
        keywords: ['athena', 'serverless sql', 'query s3', 'presto'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'aws-lambda',
        term: 'AWS Lambda',
        slug: 'aws-lambda',
        category: 'aws-cloud',
        shortDefinition: 'A serverless, event-driven compute service that lets you run code for virtually any type of application or backend service without provisioning or managing servers.',
        fullDefinition: `
AWS Lambda runs your code in response to events and automatically manages the underlying compute resources.

## Data Engineering Use Cases
- **Event-driven ETL**: Trigger processing when file lands in S3
- **Stream Processing**: Process records from Kinesis or DynamoDB Streams
- **Orchestration**: Lightweight tasks in Step Functions
        `.trim(),
        keyPoints: ['Serverless Compute', 'Event-driven', '15-minute execution limit', 'Pay per request/duration'],
        relatedTerms: ['serverless', 'event-driven', 'microservices'],
        relatedTools: ['Serverless Framework', 'SAM'],
        externalLinks: [{ title: 'AWS Lambda Documentation', url: 'https://docs.aws.amazon.com/lambda/' }],
        keywords: ['lambda', 'serverless', 'faas', 'compute'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'amazon-kinesis',
        term: 'Amazon Kinesis',
        slug: 'amazon-kinesis',
        category: 'aws-cloud',
        shortDefinition: 'A managed service for processing and analyzing real-time streaming data.',
        fullDefinition: `
Amazon Kinesis makes it easy to collect, process, and analyze real-time, streaming data.

## Kinesis Capabilities
- **Kinesis Data Streams**: Low latency streaming ingestion (similar to Kafka)
- **Kinesis Data Firehose**: Load streams into S3, Redshift, Elasticsearch
- **Kinesis Data Analytics**: Analyze streams with SQL or Flink
        `.trim(),
        keyPoints: ['Real-time streaming', 'Managed service', 'Integration with Redshift/S3'],
        relatedTerms: ['streaming', 'apache-kafka', 'real-time'],
        relatedTools: ['Kafka', 'Spark Streaming'],
        externalLinks: [{ title: 'Amazon Kinesis Documentation', url: 'https://docs.aws.amazon.com/kinesis/' }],
        keywords: ['kinesis', 'streaming data', 'real-time analytics'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'amazon-dynamodb',
        term: 'Amazon DynamoDB',
        slug: 'amazon-dynamodb',
        category: 'aws-cloud',
        shortDefinition: 'A serverless, NoSQL, fully managed database with single-digit millisecond performance at any scale.',
        fullDefinition: `
DynamoDB is a key-value and document database that delivers single-digit millisecond performance at any scale.

## Key Features
- **Serverless**: No provisioning (On-demand mode)
- **Global Tables**: Multi-region replication
- **Streams**: Capture item-level changes (CDC)
        `.trim(),
        keyPoints: ['NoSQL', 'Key-Value', 'Single-digit ms latency', 'Infinite scaling'],
        relatedTerms: ['nosql', 'database', 'key-value store'],
        relatedTools: ['MongoDB', 'Cassandra'],
        externalLinks: [{ title: 'DynamoDB Documentation', url: 'https://docs.aws.amazon.com/dynamodb/' }],
        keywords: ['dynamodb', 'nosql', 'key-value', 'aws database'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'aws-iam',
        term: 'AWS IAM',
        slug: 'aws-iam',
        category: 'aws-cloud',
        shortDefinition: 'Identity and Access Management (IAM) securely manages access to AWS services and resources.',
        fullDefinition: `
AWS IAM provides fine-grained access control across all AWS services.

## Core Concepts
- **Users**: Individuals
- **Roles**: Temporary credentials for services or federated users
- **Policies**: JSON documents defining permissions
- **Groups**: Collections of users
        `.trim(),
        keyPoints: ['Access Control', 'Least Privilege Principle', 'Role-based Access Control (RBAC)'],
        relatedTerms: ['security', 'data-governance', 'rbac'],
        relatedTools: ['Okta', 'Active Directory'],
        externalLinks: [{ title: 'AWS IAM Documentation', url: 'https://docs.aws.amazon.com/iam/' }],
        keywords: ['iam', 'aws security', 'permissions', 'access control'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'aws-lake-formation',
        term: 'AWS Lake Formation',
        slug: 'aws-lake-formation',
        category: 'aws-cloud',
        shortDefinition: 'A service to set up, secure, and manage data lakes composed of data in Amazon S3.',
        fullDefinition: `
Lake Formation simplifies setting up a data lake by providing a layer of security and management over S3 and Glue.

## Features
- **Centralized Permission**: Manage access to tables/columns in one place
- **Blueprints**: Templates to ingest data from databases
- **Row-level and Column-level Security**: Fine grained access control
        `.trim(),
        keyPoints: ['Data Lake Security', 'Simplified Management', 'Fine-grained access control'],
        relatedTerms: ['data-lake', 'data-governance', 'security'],
        relatedTools: ['Ranger', 'Sentry'],
        externalLinks: [{ title: 'Lake Formation Documentation', url: 'https://docs.aws.amazon.com/lake-formation/' }],
        keywords: ['lake formation', 'data lake security', 'governance'],
        lastUpdated: '2026-01-21',
    },
    // Azure Terms
    {
        id: 'azure-data-factory',
        term: 'Azure Data Factory',
        slug: 'azure-data-factory',
        category: 'azure-cloud',
        shortDefinition: 'A fully managed, serverless data integration service for building ETL, ELT, and data integration pipelines.',
        fullDefinition: `
Azure Data Factory (ADF) is Microsoft's cloud-based ETL service. It allows you to create data-driven workflows for orchestrating and automating data movement and data transformation.

## Key Features
- **Visual Interface**: Drag-and-drop authoring
- **90+ Connectors**: Native connectivity to most data sources
- **Mapping Data Flows**: Code-free data transformation logic
- **SSIS Integration**: Run legacy SSIS packages in the cloud
        `.trim(),
        keyPoints: ['Cloud ETL', 'Visual orchestration', 'SSIS Lift-and-shift'],
        relatedTerms: ['etl', 'orchestration', 'ssis'],
        relatedTools: ['SSIS', 'Informatica', 'Talend'],
        externalLinks: [{ title: 'ADF Documentation', url: 'https://learn.microsoft.com/en-us/azure/data-factory/' }],
        keywords: ['azure data factory', 'adf', 'etl', 'data pipelines'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'azure-synapse-analytics',
        term: 'Azure Synapse Analytics',
        slug: 'azure-synapse-analytics',
        category: 'azure-cloud',
        shortDefinition: 'An enterprise analytics service that brings together data integration, enterprise data warehousing, and big data analytics.',
        fullDefinition: `
Azure Synapse Analytics is simply Azure SQL Data Warehouse evolution. It merges enterprise data warehousing and Big Data analytics.

## Capabilities
- **Synapse SQL**: Serverless and Dedicated resource models
- **Spark**: Deeply integrated Apache Spark engine
- **Synapse Pipelines**: Built-in data integration (ADF)
- **Synapse Studio**: Unified workspace for everything
        `.trim(),
        keyPoints: ['Unified Analytics', 'SQL + Spark', 'Integrated Power BI'],
        relatedTerms: ['data-warehouse', 'apache-spark', 'big-data', 'power-bi'],
        relatedTools: ['Databricks', 'Snowflake'],
        externalLinks: [{ title: 'Synapse Documentation', url: 'https://learn.microsoft.com/en-us/azure/synapse-analytics/' }],
        keywords: ['synapse', 'azure dw', 'analytics', 'spark'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'azure-blob-storage',
        term: 'Azure Blob Storage',
        slug: 'azure-blob-storage',
        category: 'azure-cloud',
        shortDefinition: 'Massively scalable and secure object storage for cloud-native workloads, archives, high-performance computing, and machine learning.',
        fullDefinition: `
Azure Blob Storage is Microsoft's object storage solution for the cloud. It is optimized for storing massive amounts of unstructured data.

## Features
- **Data Lake Storage Gen2**: Hierarchical namespace on top of Blob storage (HDFS compatible)
- **Access Tiers**: Hot, Cool, Cold, Archive
- **Immutable Storage**: WORM support for compliance
        `.trim(),
        keyPoints: ['Object Storage', 'Data Lake Gen2', 'HDFS Compatibility'],
        relatedTerms: ['data-lake', 'object-storage', 'hdfs'],
        relatedTools: ['Amazon S3', 'Google Cloud Storage'],
        externalLinks: [{ title: 'Blob Storage Documentation', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/' }],
        keywords: ['azure blob', 'object storage', 'adls', 'data lake'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'azure-cosmos-db',
        term: 'Azure Cosmos DB',
        slug: 'azure-cosmos-db',
        category: 'azure-cloud',
        shortDefinition: 'A fully managed NoSQL and relational database for modern app development.',
        fullDefinition: `
Azure Cosmos DB is a fully managed NoSQL database for modern app development. It offers single-digit millisecond response times, and automatic and instant scalability.

## Key APIs
- NoSQL (Document)
- MongoDB
- PostgreSQL
- Cassandra
- Gremlin (Graph)
- Table
        `.trim(),
        keyPoints: ['Multi-model', 'Global Distribution', 'Single-digit latency'],
        relatedTerms: ['nosql', 'database', 'mongodb', 'cassandra'],
        relatedTools: ['DynamoDB', 'MongoDB Atlas'],
        externalLinks: [{ title: 'Cosmos DB Documentation', url: 'https://learn.microsoft.com/en-us/azure/cosmos-db/' }],
        keywords: ['cosmos db', 'nosql', 'multi-model database'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'azure-event-hubs',
        term: 'Azure Event Hubs',
        slug: 'azure-event-hubs',
        category: 'azure-cloud',
        shortDefinition: 'A big data streaming platform and event ingestion service.',
        fullDefinition: `
Azure Event Hubs is a fully managed, real-time data ingestion service. It can ingest millions of events per second to be processed by any real-time analytics provider.

## Features
- **Kafka Compatible**: Use existing Kafka producers/consumers
- **Capture**: Automatically save data to Blob Storage
- **Scalable**: Auto-inflate throughput units
        `.trim(),
        keyPoints: ['Event Ingestion', 'Kafka Compatibility', 'Real-time'],
        relatedTerms: ['apache-kafka', 'streaming', 'real-time'],
        relatedTools: ['Kafka', 'Kinesis'],
        externalLinks: [{ title: 'Event Hubs Documentation', url: 'https://learn.microsoft.com/en-us/azure/event-hubs/' }],
        keywords: ['event hubs', 'streaming', 'kafka', 'azure streaming'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'azure-stream-analytics',
        term: 'Azure Stream Analytics',
        slug: 'azure-stream-analytics',
        category: 'azure-cloud',
        shortDefinition: 'A fully managed real-time analytics service designed to process millions of events per second.',
        fullDefinition: `
Azure Stream Analytics is an easy-to-use, real-time analytics service that is designed for mission-critical workloads.

## Capabilities
- **SQL-like Language**: Query streams with familiar SQL
- **Integration**: Input from Event Hubs/IoT Hub, Output to Power BI/SQL/Cosmos
- **Reference Data**: Join streams with static data
        `.trim(),
        keyPoints: ['Stream Processing', 'SQL Syntax', 'Real-time Dashboards'],
        relatedTerms: ['streaming', 'sql', 'real-time'],
        relatedTools: ['Flink', 'Spark Streaming'],
        externalLinks: [{ title: 'Stream Analytics Documentation', url: 'https://learn.microsoft.com/en-us/azure/stream-analytics/' }],
        keywords: ['stream analytics', 'asa', 'real-time sql'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'azure-hdinsight',
        term: 'Azure HDInsight',
        slug: 'azure-hdinsight',
        category: 'azure-cloud',
        shortDefinition: 'A managed, full-spectrum, open-source analytics service in the cloud for enterprises.',
        fullDefinition: `
Azure HDInsight is a cloud distribution of Hadoop components. It makes it easy, fast, and cost-effective to process massive amounts of data.

## Supported Frameworks
- Apache Spark
- Apache Hadoop
- Apache Kafka
- Apache HBase
- Apache Hive (LLAP)
        `.trim(),
        keyPoints: ['Managed Hadoop', 'Open Source Ecosystem', 'Enterprise Security'],
        relatedTerms: ['hadoop', 'spark', 'kafka', 'big-data'],
        relatedTools: ['EMR', 'Dataproc'],
        externalLinks: [{ title: 'HDInsight Documentation', url: 'https://learn.microsoft.com/en-us/azure/hdinsight/' }],
        keywords: ['hdinsight', 'hadoop', 'spark', 'azure big data'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'microsoft-purview',
        term: 'Microsoft Purview',
        slug: 'microsoft-purview',
        category: 'azure-cloud',
        shortDefinition: 'A comprehensive family of data governance, risk, and compliance solutions.',
        fullDefinition: `
Microsoft Purview provides a unified data governance solution to help manage and govern your on-premises, multi-cloud, and SaaS data.

## Key Features
- **Data Map**: Automated data discovery and lineage
- **Data Catalog**: Find and understand data
- **Data Insights**: Overview of data estate health
        `.trim(),
        keyPoints: ['Data Governance', 'Data Catalog', 'Lineage'],
        relatedTerms: ['data-governance', 'data-catalog', 'data-lineage'],
        relatedTools: ['Atlan', 'Alation'],
        externalLinks: [{ title: 'Purview Documentation', url: 'https://learn.microsoft.com/en-us/purview/' }],
        keywords: ['purview', 'governance', 'catalog', 'lineage'],
        lastUpdated: '2026-01-21',
    },
    // GCP Terms
    {
        id: 'google-bigquery',
        term: 'Google BigQuery',
        slug: 'google-bigquery',
        category: 'gcp-cloud',
        shortDefinition: 'A serverless, highly scalable, and cost-effective multi-cloud data warehouse designed for business agility.',
        fullDefinition: `
BigQuery is Google's fully managed, serverless data warehouse that enables scalable analysis over petabytes of data.

## Key Features
- **Serverless**: No infrastructure to manage
- **Separation of Compute and Storage**: Scale independently
- **BigQuery ML**: Create and run ML models using SQL
- **Omni**: Analyze data across clouds (AWS, Azure) without moving it
        `.trim(),
        keyPoints: ['Serverless DW', 'SQL Interface', 'Machine Learning via SQL', 'Real-time ingestion'],
        relatedTerms: ['data-warehouse', 'sql', 'ml', 'serverless'],
        relatedTools: ['Snowflake', 'Redshift'],
        externalLinks: [{ title: 'BigQuery Documentation', url: 'https://cloud.google.com/bigquery/' }],
        keywords: ['bigquery', 'gcp dw', 'analytics', 'serverless'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-storage',
        term: 'Google Cloud Storage',
        slug: 'google-cloud-storage',
        category: 'gcp-cloud',
        shortDefinition: 'Managed, secure, and scalable object storage for all your unstructured data needs.',
        fullDefinition: `
Google Cloud Storage (GCS) is a RESTful online file storage web service for storing and accessing data on Google Cloud Platform infrastructure.

## Classes
- **Standard**: High frequency access
- **Nearline**: Access once a month
- **Coldline**: Access once a quarter
- **Archive**: Access once a year
        `.trim(),
        keyPoints: ['Object Storage', 'Global Consistency', 'Lifecycle Management'],
        relatedTerms: ['object-storage', 'data-lake'],
        relatedTools: ['Amazon S3', 'Azure Blob'],
        externalLinks: [{ title: 'Cloud Storage Documentation', url: 'https://cloud.google.com/storage/' }],
        keywords: ['gcs', 'cloud storage', 'object storage'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-dataflow',
        term: 'Google Cloud Dataflow',
        slug: 'google-cloud-dataflow',
        category: 'gcp-cloud',
        shortDefinition: 'Unified stream and batch data processing that\'s serverless, fast, and cost-effective.',
        fullDefinition: `
Dataflow is a fully managed service for executing Apache Beam pipelines within the Google Cloud Platform ecosystem.

## Features
- **Unified Model**: Same code for batch and stream
- **Autoscaling**: Horizontal autoscaling of worker resources
- **Exact-once processing**: Reliable data processing
        `.trim(),
        keyPoints: ['Apache Beam', 'Unified Batch/Stream', 'Serverless'],
        relatedTerms: ['streaming', 'batch-processing', 'etl'],
        relatedTools: ['Apache Beam', 'Spark', 'Flink'],
        externalLinks: [{ title: 'Dataflow Documentation', url: 'https://cloud.google.com/dataflow/' }],
        keywords: ['dataflow', 'apache beam', 'streaming', 'etl'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-dataproc',
        term: 'Google Cloud Dataproc',
        slug: 'google-cloud-dataproc',
        category: 'gcp-cloud',
        shortDefinition: 'A fully managed and highly scalable service for running Apache Spark, Apache Flink, Presto, and 30+ open source tools and frameworks.',
        fullDefinition: `
Dataproc is a managed Spark and Hadoop service that lets you take advantage of open source data tools for batch processing, querying, streaming, and machine learning.

## Benefits
- **Fast Startup**: Clusters start in seconds
- **Cost**: Per-second billing
- **Integration**: Native connectors for GCS, Bigtable, BigQuery
        `.trim(),
        keyPoints: ['Managed Hadoop/Spark', 'Fast Spin-up', 'Open Source Ecosystem'],
        relatedTerms: ['hadoop', 'spark', 'hive'],
        relatedTools: ['EMR', 'HDInsight'],
        externalLinks: [{ title: 'Dataproc Documentation', url: 'https://cloud.google.com/dataproc/' }],
        keywords: ['dataproc', 'spark', 'hadoop', 'gcp big data'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-pubsub',
        term: 'Google Cloud Pub/Sub',
        slug: 'google-cloud-pubsub',
        category: 'gcp-cloud',
        shortDefinition: 'A scalable, durable, and secure ingestion service for event streaming and analytics.',
        fullDefinition: `
Pub/Sub is an asynchronous messaging service that decouples services that produce events from services that process events.

## Concepts
- **Topic**: Feed of messages
- **Subscription**: Receive messages from topic
- **Message**: The data itself
        `.trim(),
        keyPoints: ['Global Messaging', 'Asynchronous', 'Decoupled Architecture'],
        relatedTerms: ['messaging', 'streaming', 'event-driven'],
        relatedTools: ['Kafka', 'Kinesis'],
        externalLinks: [{ title: 'Pub/Sub Documentation', url: 'https://cloud.google.com/pubsub/' }],
        keywords: ['pub/sub', 'messaging', 'queue', 'streaming'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-composer',
        term: 'Google Cloud Composer',
        slug: 'google-cloud-composer',
        category: 'gcp-cloud',
        shortDefinition: 'A fully managed workflow orchestration service built on Apache Airflow.',
        fullDefinition: `
Cloud Composer is a managed version of Apache Airflow. It helps you create, schedule, monitor, and manage workflows.

## Features
- **Managed Airflow**: Google handles the infrastructure
- **Python**: Write DAGs in Python
- **Integration**: Deep hooks into BigQuery, Dataflow, Dataproc
        `.trim(),
        keyPoints: ['Managed Airflow', 'Orchestration', 'Python DAGs'],
        relatedTerms: ['apache-airflow', 'orchestration', 'etl'],
        relatedTools: ['Apache Airflow', 'Prefect', 'Dagster'],
        externalLinks: [{ title: 'Composer Documentation', url: 'https://cloud.google.com/composer/' }],
        keywords: ['composer', 'airflow', 'orchestration'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-functions',
        term: 'Google Cloud Functions',
        slug: 'google-cloud-functions',
        category: 'gcp-cloud',
        shortDefinition: 'A serverless execution environment for building and connecting cloud services.',
        fullDefinition: `
Cloud Functions is a lightweight compute solution for developers to create single-purpose, stand-alone functions that respond to cloud events.

## Use Cases
- Data processing via triggers (GCS uploads)
- Webhooks
- Lightweight APIs
        `.trim(),
        keyPoints: ['Serverless', 'Event-driven', 'FaaS'],
        relatedTerms: ['serverless', 'faas'],
        relatedTools: ['AWS Lambda', 'Azure Functions'],
        externalLinks: [{ title: 'Cloud Functions Documentation', url: 'https://cloud.google.com/functions/' }],
        keywords: ['cloud functions', 'serverless', 'compute'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'google-cloud-bigtable',
        term: 'Google Cloud Bigtable',
        slug: 'google-cloud-bigtable',
        category: 'gcp-cloud',
        shortDefinition: 'A fully managed, wide-column and key-value NoSQL database service for large analytical and operational workloads.',
        fullDefinition: `
Bigtable is the same database that powers Google Search, Analytics, Maps, and Gmail. It is designed for high throughput and low latency.

## Best For
- Time-series data
- Marketing data
- IoT data
- Financial data history
        `.trim(),
        keyPoints: ['NoSQL', 'Wide-column', 'Petabyte scale'],
        relatedTerms: ['nosql', 'big-data', 'hbase'],
        relatedTools: ['HBase', 'Cassandra'],
        externalLinks: [{ title: 'Bigtable Documentation', url: 'https://cloud.google.com/bigtable/' }],
        keywords: ['bigtable', 'nosql', 'wide-column'],
        lastUpdated: '2026-01-21',
    },
    // General Concepts
    {
        id: 'data-mesh',
        term: 'Data Mesh',
        slug: 'data-mesh',
        category: 'data-governance',
        shortDefinition: 'A decentralized sociotechnical approach to sharing, accessing, and managing analytical data in complex and large-scale environments.',
        fullDefinition: `
Data Mesh is an organizational and architectural shift that challenges the centralized monolithic data lake/warehouse paradigm.

## Four Principles
1. **Domain-oriented ownership**: Teams own their data
2. **Data as a product**: Treat data with product thinking
3. **Self-serve data infrastructure**: Platform for domains to build on
4. **Federated computational governance**: Global standards, local ownership
        `.trim(),
        keyPoints: ['Decentralization', 'Domain Ownership', 'Data Product'],
        relatedTerms: ['data-governance', 'microservices'],
        relatedTools: ['Datahub', 'Amundsen'],
        externalLinks: [{ title: 'Data Mesh Principles', url: 'https://martinfowler.com/articles/data-mesh-principles.html' }],
        keywords: ['data mesh', 'decentralization', 'data architecture'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'reverse-etl',
        term: 'Reverse ETL',
        slug: 'reverse-etl',
        category: 'data-integration',
        shortDefinition: 'The process of moving data from a data warehouse back into operational systems (SaaS tools) used for business.',
        fullDefinition: `
Reverse ETL operationalizes data by syncing it from the Data Warehouse to tools like Salesforce, HubSpot, or Marketo.

## Why?
- **Operational Analytics**: Give sales teams data where they work
- **Personalization**: Push customer segments to marketing tools
        `.trim(),
        keyPoints: ['Warehouse to App', 'Operational Analytics', 'Data Activation'],
        relatedTerms: ['etl', 'data-warehouse'],
        relatedTools: ['Census', 'Hightouch'],
        externalLinks: [{ title: 'What is Reverse ETL?', url: 'https://hightouch.com/blog/reverse-etl' }],
        keywords: ['reverse etl', 'data activation', 'operational analytics'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'cap-theorem',
        term: 'CAP Theorem',
        slug: 'cap-theorem',
        category: 'data-modeling',
        shortDefinition: 'A theorem stating that a distributed data store can only guarantee two of the three: Consistency, Availability, and Partition Tolerance.',
        fullDefinition: `
The CAP theorem is fundamental to understanding distributed systems and NoSQL databases.

## The Three Properties
- **Consistency**: Every read receives the most recent write or an error.
- **Availability**: Every request receives a (non-error) response, without the guarantee that it contains the most recent write.
- **Partition Tolerance**: The system continues to operate despite an arbitrary number of messages being dropped/delayed by the network.

**Rule**: In a distributed system (P), you must choose between C and A.
        `.trim(),
        keyPoints: ['Distributed Systems', 'Trade-offs', 'NoSQL Design'],
        relatedTerms: ['nosql', 'acid', 'base'],
        relatedTools: ['Cassandra', 'DynamoDB', 'MongoDB'],
        externalLinks: [{ title: 'CAP Theorem Explained', url: 'https://en.wikipedia.org/wiki/CAP_theorem' }],
        keywords: ['cap theorem', 'distributed systems', 'consistency', 'availability'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'acid',
        term: 'ACID Transactions',
        slug: 'acid',
        category: 'data-modeling',
        shortDefinition: 'A set of properties of database transactions intended to guarantee data validity despite errors, power failures, and other mishaps.',
        fullDefinition: `
ACID stands for Atomicity, Consistency, Isolation, Durability. These properties ensure reliable processing of database transactions.

## The Properties
- **Atomicity**: All or nothing.
- **Consistency**: Data remains valid before and after.
- **Isolation**: Concurrent transactions don't interfere.
- **Durability**: Committed data is saved permanently.
        `.trim(),
        keyPoints: ['Transaction Integrity', 'Relational Databases', 'Data Validity'],
        relatedTerms: ['database', 'sql', 'oltp'],
        relatedTools: ['PostgreSQL', 'MySQL', 'Oracle'],
        externalLinks: [{ title: 'ACID Properties', url: 'https://en.wikipedia.org/wiki/ACID' }],
        keywords: ['acid', 'transactions', 'database properties'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'scd',
        term: 'Slowly Changing Dimensions (SCD)',
        slug: 'scd',
        category: 'data-warehousing',
        shortDefinition: 'A concept in data warehousing to manage how data that changes slowly over time is stored and tracked.',
        fullDefinition: `
SCDs are used to track historical data in dimension tables.

## Common Types
- **Type 0**: Fixed (No changes allowed)
- **Type 1**: Overwrite (No history)
- **Type 2**: Add new row (Full history with validity dates)
- **Type 3**: Add new column (Limited history)
        `.trim(),
        keyPoints: ['History Tracking', 'Dimensional Modeling', 'Data Warehousing'],
        relatedTerms: ['data-warehouse', 'data-modeling', 'star-schema'],
        relatedTools: ['dbt', 'Informatica'],
        externalLinks: [{ title: 'SCD Types', url: 'https://en.wikipedia.org/wiki/Slowly_changing_dimension' }],
        keywords: ['scd', 'slowly changing dimensions', 'type 2 dimension'],
        lastUpdated: '2026-01-21',
    },
    {
        id: 'columnar-storage',
        term: 'Columnar Storage',
        slug: 'columnar-storage',
        category: 'data-warehousing',
        shortDefinition: 'A database management system that stores data in columns rather than rows, optimized for analytics.',
        fullDefinition: `
Columnar storage saves data by column rather than by row. This is highly efficient for analytical queries (OLAP) which typically aggregate a few columns over many rows.

## Benefits
- **Compression**: Similar data types in columns compress very well (10x-50x).
- **IO Efficiency**: Only read usage columns, ignore the rest.
        `.trim(),
        keyPoints: ['OLAP optimization', 'Compression', 'Analytics'],
        relatedTerms: ['olap', 'data-warehouse', 'row-oriented'],
        relatedTools: ['Snowflake', 'Redshift', 'BigQuery', 'Parquet'],
        externalLinks: [{ title: 'Columnar Database', url: 'https://en.wikipedia.org/wiki/Column-oriented_DBMS' }],
        keywords: ['columnar', 'olap', 'compression', 'parquet'],
        lastUpdated: '2026-01-21',
    },
];

// Helper functions for glossary operations
export const getTermBySlug = (slug) => {
    return glossaryTerms.find((term) => term.slug === slug);
};

export const getTermsByCategory = (categoryId) => {
    return glossaryTerms.filter((term) => term.category === categoryId);
};

export const getAllTerms = () => {
    return glossaryTerms;
};

export const getCategoryById = (categoryId) => {
    return GLOSSARY_CATEGORIES.find((cat) => cat.id === categoryId);
};

export const getRelatedTerms = (termSlug) => {
    const term = getTermBySlug(termSlug);
    if (!term) return [];
    return term.relatedTerms
        .map((slug) => getTermBySlug(slug))
        .filter(Boolean);
};

export default glossaryTerms;
