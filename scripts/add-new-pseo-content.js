/**
 * Add new high-value glossary terms and comparisons
 * Run: node scripts/add-new-pseo-content.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLOSSARY_DIR = path.join(__dirname, '..', 'src', 'data', 'pseo', 'glossary');
const COMP_DIR = path.join(__dirname, '..', 'src', 'data', 'pseo', 'comparisons');

// New glossary terms (high-traffic keywords)
const NEW_TERMS = [
    {
        category: 'data-warehousing',
        terms: [
            { id: 'delta-lake', term: 'Delta Lake', slug: 'delta-lake', shortDefinition: 'An open-source storage layer that brings ACID transactions, scalable metadata handling, and data versioning to Apache Spark and big data workloads.' },
            { id: 'apache-iceberg', term: 'Apache Iceberg', slug: 'apache-iceberg', shortDefinition: 'An open table format for large analytic datasets that provides reliable, performant table operations including schema evolution and time travel.' },
            { id: 'apache-hudi', term: 'Apache Hudi', slug: 'apache-hudi', shortDefinition: 'An open-source data lake platform that provides record-level insert, update, and delete capabilities with incremental data processing.' },
        ]
    },
    {
        category: 'data-orchestration',
        terms: [
            { id: 'prefect', term: 'Prefect', slug: 'prefect', shortDefinition: 'A modern workflow orchestration tool that provides a Pythonic way to build, schedule, and monitor data pipelines with dynamic workflows.' },
            { id: 'dagster', term: 'Dagster', slug: 'dagster', shortDefinition: 'A data orchestrator for machine learning, analytics, and ETL that enables local development and testing with production-grade deployment.' },
            { id: 'mage-ai', term: 'Mage', slug: 'mage', shortDefinition: 'An open-source data pipeline tool for transforming and integrating data, designed as a modern alternative to Airflow with a visual interface.' },
        ]
    },
    {
        category: 'analytics',
        terms: [
            { id: 'looker', term: 'Looker', slug: 'looker', shortDefinition: 'A business intelligence and data analytics platform acquired by Google that uses LookML for semantic modeling and self-service analytics.' },
            { id: 'metabase', term: 'Metabase', slug: 'metabase', shortDefinition: 'An open-source business intelligence tool that allows users to ask questions about data and embed analytics in applications.' },
            { id: 'superset', term: 'Apache Superset', slug: 'apache-superset', shortDefinition: 'An open-source data exploration and visualization platform that supports rich SQL querying and interactive dashboard creation.' },
        ]
    },
    {
        category: 'streaming',
        terms: [
            { id: 'apache-flink', term: 'Apache Flink', slug: 'apache-flink', shortDefinition: 'A distributed stream processing framework that provides high-throughput, low-latency data streaming with exactly-once semantics.' },
            { id: 'confluent', term: 'Confluent', slug: 'confluent', shortDefinition: 'A data streaming platform built on Apache Kafka that provides enterprise features for real-time data pipelines and streaming applications.' },
            { id: 'redpanda', term: 'Redpanda', slug: 'redpanda', shortDefinition: 'A Kafka-compatible streaming data platform written in C++ that eliminates ZooKeeper and provides faster performance with lower latency.' },
        ]
    },
    {
        category: 'data-integration',
        terms: [
            { id: 'stitch', term: 'Stitch', slug: 'stitch', shortDefinition: 'A cloud-based ETL service acquired by Talend that provides simple data integration from hundreds of sources to data warehouses.' },
            { id: 'matillion', term: 'Matillion', slug: 'matillion', shortDefinition: 'A cloud-native data transformation platform that provides low-code ELT for cloud data warehouses like Snowflake, BigQuery, and Redshift.' },
            { id: 'dlt', term: 'dlt (Data Load Tool)', slug: 'dlt', shortDefinition: 'An open-source Python library for building data pipelines that automatically handles schema inference, data normalization, and incremental loading.' },
        ]
    }
];

// New comparisons (high-traffic vs keywords)
const NEW_COMPARISONS = [
    {
        category: 'data-orchestration',
        comparison: {
            id: 'airflow-vs-dagster',
            slug: 'airflow-vs-dagster',
            title: 'Apache Airflow vs Dagster',
            subtitle: 'Complete orchestration platform comparison for 2025',
            tool1: { name: 'Apache Airflow', logo: '🌪️' },
            tool2: { name: 'Dagster', logo: '🔷' },
            verdict: 'Airflow for mature production pipelines, Dagster for modern data assets',
            comparisonPoints: [
                { aspect: 'Architecture', tool1: 'DAG-based task scheduling', tool2: 'Asset-based software-defined pipelines', winner: 'dagster' },
                { aspect: 'Local Development', tool1: 'Challenging setup', tool2: 'Excellent local testing', winner: 'dagster' },
                { aspect: 'Community', tool1: 'Massive ecosystem', tool2: 'Growing rapidly', winner: 'airflow' },
                { aspect: 'Learning Curve', tool1: 'Steeper', tool2: 'Developer-friendly', winner: 'dagster' },
            ]
        }
    },
    {
        category: 'data-warehousing',
        comparison: {
            id: 'snowflake-vs-bigquery',
            slug: 'snowflake-vs-bigquery',
            title: 'Snowflake vs Google BigQuery',
            subtitle: 'Cloud data warehouse showdown for 2025',
            tool1: { name: 'Snowflake', logo: '❄️' },
            tool2: { name: 'BigQuery', logo: '🔍' },
            verdict: 'Both excellent; Snowflake for multi-cloud, BigQuery for GCP-native',
            comparisonPoints: [
                { aspect: 'Pricing Model', tool1: 'Compute + Storage separate', tool2: 'On-demand or flat-rate', winner: 'tie' },
                { aspect: 'Multi-Cloud', tool1: 'AWS, Azure, GCP', tool2: 'GCP only', winner: 'snowflake' },
                { aspect: 'Serverless', tool1: 'Auto-suspend warehouses', tool2: 'Fully serverless', winner: 'bigquery' },
                { aspect: 'ML Integration', tool1: 'Snowpark', tool2: 'Native BQML', winner: 'bigquery' },
            ]
        }
    },
    {
        category: 'data-integration',
        comparison: {
            id: 'fivetran-vs-airbyte',
            slug: 'fivetran-vs-airbyte',
            title: 'Fivetran vs Airbyte',
            subtitle: 'ETL/ELT connector platform comparison',
            tool1: { name: 'Fivetran', logo: '🔌' },
            tool2: { name: 'Airbyte', logo: '🌊' },
            verdict: 'Fivetran for enterprise reliability, Airbyte for cost and flexibility',
            comparisonPoints: [
                { aspect: 'Pricing', tool1: 'Usage-based (expensive)', tool2: 'Open-source option', winner: 'airbyte' },
                { aspect: 'Connectors', tool1: '300+ managed', tool2: '350+ community', winner: 'tie' },
                { aspect: 'Self-Hosted', tool1: 'No', tool2: 'Yes', winner: 'airbyte' },
                { aspect: 'Enterprise Support', tool1: 'Excellent', tool2: 'Growing', winner: 'fivetran' },
            ]
        }
    },
    {
        category: 'streaming',
        comparison: {
            id: 'kafka-vs-redpanda',
            slug: 'kafka-vs-redpanda',
            title: 'Apache Kafka vs Redpanda',
            subtitle: 'Event streaming platform comparison',
            tool1: { name: 'Apache Kafka', logo: '📨' },
            tool2: { name: 'Redpanda', logo: '🐼' },
            verdict: 'Kafka for ecosystem maturity, Redpanda for performance',
            comparisonPoints: [
                { aspect: 'Performance', tool1: 'High throughput', tool2: '10x lower latency', winner: 'redpanda' },
                { aspect: 'Operations', tool1: 'Complex (ZooKeeper)', tool2: 'No ZooKeeper needed', winner: 'redpanda' },
                { aspect: 'Ecosystem', tool1: 'Massive', tool2: 'Kafka-compatible', winner: 'kafka' },
                { aspect: 'Resource Usage', tool1: 'JVM overhead', tool2: 'C++ efficient', winner: 'redpanda' },
            ]
        }
    },
    {
        category: 'data-warehousing',
        comparison: {
            id: 'delta-lake-vs-iceberg',
            slug: 'delta-lake-vs-iceberg',
            title: 'Delta Lake vs Apache Iceberg',
            subtitle: 'Open table format comparison for lakehouses',
            tool1: { name: 'Delta Lake', logo: '🔺' },
            tool2: { name: 'Apache Iceberg', logo: '🧊' },
            verdict: 'Delta for Databricks, Iceberg for multi-engine flexibility',
            comparisonPoints: [
                { aspect: 'Engine Support', tool1: 'Best with Spark/Databricks', tool2: 'Multi-engine (Spark, Trino, Flink)', winner: 'iceberg' },
                { aspect: 'Schema Evolution', tool1: 'Good', tool2: 'Excellent', winner: 'iceberg' },
                { aspect: 'Databricks Integration', tool1: 'Native', tool2: 'Supported', winner: 'delta-lake' },
                { aspect: 'Community Momentum', tool1: 'Strong', tool2: 'Growing faster', winner: 'iceberg' },
            ]
        }
    }
];

// Content template
function generateFullDefinition(term) {
    return `${term.term} is a critical technology in the modern data engineering stack, widely adopted by organizations building scalable data infrastructure.

## What is ${term.term}?

${term.shortDefinition}

## Key Features and Capabilities

${term.term} provides several powerful features for data engineering teams:

### Core Architecture
- Designed for cloud-native and distributed environments
- Built for scalability and high availability
- Integrates with popular data tools and platforms
- Provides comprehensive APIs and SDKs

### Data Processing
- Supports both batch and streaming workloads
- Optimized for large-scale data operations
- Native support for common data formats
- Efficient resource utilization

### Enterprise Features
- Role-based access control and security
- Audit logging and compliance support
- Monitoring and observability built-in
- High availability and disaster recovery

## Why Data Engineers Choose ${term.term}

${term.term} has become popular for several key reasons:

1. **Reliability**: Production-grade stability for mission-critical workloads
2. **Performance**: Optimized for speed and efficiency at scale
3. **Flexibility**: Adapts to various use cases and architectures
4. **Ecosystem**: Rich integration with modern data tools
5. **Community**: Active development and comprehensive documentation

## Common Use Cases

### Data Pipelines
Build reliable data pipelines that process data at scale with proper error handling and monitoring.

### Analytics Infrastructure
Power business intelligence and analytics workloads with consistent, reliable data access.

### Real-time Processing
Enable streaming analytics and real-time data processing for operational use cases.

### Machine Learning
Prepare and serve data for ML model training and inference at scale.

## Best Practices

When implementing ${term.term}, consider these recommendations:

- **Start Simple**: Begin with basic configurations and scale up
- **Monitor Everything**: Set up comprehensive observability from day one
- **Plan for Growth**: Design architecture for anticipated scale
- **Automate Operations**: Use infrastructure as code and CI/CD
- **Document Thoroughly**: Maintain clear documentation for team knowledge

## Integration Ecosystem

${term.term} integrates with the modern data stack:

- Data warehouses (Snowflake, BigQuery, Redshift)
- Data lakes (S3, GCS, Azure Blob)
- Orchestration tools (Airflow, Dagster, Prefect)
- BI platforms (Tableau, Looker, Power BI)
- ML platforms (MLflow, Kubeflow, SageMaker)

## Getting Started

To implement ${term.term} effectively:

1. **Evaluate Requirements**: Understand your specific use case needs
2. **Set Up Development**: Create a local or sandbox environment
3. **Build Incrementally**: Start with a pilot project
4. **Validate Performance**: Test at realistic scale
5. **Deploy Production**: Roll out with proper monitoring`;
}

async function main() {
    console.log('📝 Adding new pSEO content...\n');

    let termsAdded = 0;
    let compsAdded = 0;

    // Add glossary terms
    for (const group of NEW_TERMS) {
        const filePath = path.join(GLOSSARY_DIR, `${group.category}.json`);
        let existing = [];

        if (fs.existsSync(filePath)) {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        const existingIds = new Set(existing.map(t => t.id));

        for (const term of group.terms) {
            if (!existingIds.has(term.id)) {
                const fullTerm = {
                    ...term,
                    category: group.category,
                    fullDefinition: generateFullDefinition(term),
                    keyPoints: [
                        `${term.term} provides enterprise-grade reliability`,
                        'Designed for scalability and performance',
                        'Rich integration with modern data tools',
                        'Active community and ecosystem',
                        'Comprehensive documentation and support'
                    ],
                    faqs: [
                        { question: `What is ${term.term} used for?`, answer: term.shortDefinition },
                        { question: `Is ${term.term} open source?`, answer: `${term.term} is available with various licensing options. Check the official documentation for current licensing details.` },
                        { question: `How does ${term.term} compare to alternatives?`, answer: `${term.term} offers unique advantages in its category. The best choice depends on your specific requirements, existing infrastructure, and team expertise.` }
                    ],
                    relatedTerms: [],
                    relatedTools: [],
                    externalLinks: [],
                    keywords: [term.term.toLowerCase(), term.slug],
                    lastUpdated: new Date().toISOString().split('T')[0]
                };

                existing.push(fullTerm);
                termsAdded++;
                console.log(`  ✅ Added: ${term.term} (${group.category})`);
            }
        }

        fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    }

    // Add comparisons
    for (const group of NEW_COMPARISONS) {
        const filePath = path.join(COMP_DIR, `${group.category}.json`);
        let existing = [];

        if (fs.existsSync(filePath)) {
            existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        const existingIds = new Set(existing.map(c => c.id));

        if (!existingIds.has(group.comparison.id)) {
            existing.push({
                ...group.comparison,
                lastUpdated: new Date().toISOString().split('T')[0]
            });
            compsAdded++;
            console.log(`  ✅ Added: ${group.comparison.title}`);
        }

        fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    }

    console.log(`\n✨ Added ${termsAdded} glossary terms and ${compsAdded} comparisons`);
    console.log('   Run: npm run pseo:deploy to publish');
}

main().catch(console.error);
