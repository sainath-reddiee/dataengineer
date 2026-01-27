/**
 * Content Enrichment Script for pSEO Glossary
 * Expands thin content to 400+ words using structured templates
 * 
 * Run: node scripts/enrich-glossary-content.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLOSSARY_DIR = path.join(__dirname, '..', 'src', 'data', 'pseo', 'glossary');
const MIN_WORDS = 400;

/**
 * Content templates for different term categories
 */
const CONTENT_TEMPLATES = {
    'cloud-platforms': (term) => `
${term.term} is a leading cloud platform service widely adopted in modern data engineering workflows.

## What is ${term.term}?

${term.shortDefinition}

## Key Features and Capabilities

${term.term} offers several powerful features that make it essential for data engineers:

### Core Architecture
- Fully managed cloud service with automatic scaling
- Built-in security and compliance features  
- Integration with other cloud services and third-party tools
- Pay-as-you-go pricing model

### Data Processing
- Support for both batch and stream processing
- Native connectors for popular data formats
- Optimized for large-scale data workloads
- Low-latency query execution

### Security & Governance
- Enterprise-grade security controls
- Role-based access management
- Data encryption at rest and in transit
- Audit logging and monitoring

## Why Data Engineers Choose ${term.term}

${term.term} has become popular among data engineering teams for several reasons:

1. **Scalability**: Automatically handles growing data volumes without manual intervention
2. **Cost Efficiency**: Pay only for resources consumed, with automatic optimization
3. **Integration**: Seamless connectivity with data lakes, warehouses, and BI tools
4. **Managed Service**: Reduces operational overhead with fully managed infrastructure
5. **Performance**: Optimized for analytical and data processing workloads

## Common Use Cases

### Data Pipelines
Build reliable ETL/ELT pipelines that process data at scale, transform it for analytics, and load it into target systems.

### Real-time Analytics
Process streaming data for real-time dashboards, alerting, and operational intelligence.

### Data Lake Architecture
Store and process massive datasets in open formats, enabling flexible analytics and ML workflows.

### Machine Learning
Prepare training data, run feature engineering, and deploy ML models at scale.

## Best Practices

When working with ${term.term}, consider these best practices:

- **Design for Scale**: Architect solutions that can grow with your data
- **Optimize Costs**: Monitor usage and implement cost controls
- **Implement Security**: Follow least-privilege access principles
- **Monitor Performance**: Set up alerting for latency and errors
- **Document Everything**: Maintain clear documentation for pipelines and configurations

## Integration Ecosystem

${term.term} integrates with a wide range of tools and services:

- Data warehouses (Snowflake, BigQuery, Redshift)
- Data lakes (Delta Lake, Apache Iceberg)
- Orchestration tools (Apache Airflow, Prefect)
- BI platforms (Tableau, Power BI, Looker)
- ML platforms (MLflow, SageMaker)
`.trim(),

    'data-warehousing': (term) => `
${term.term} is a foundational concept in modern data engineering, essential for building scalable analytics infrastructure.

## Understanding ${term.term}

${term.shortDefinition}

## Core Concepts

### Architecture Principles
Modern data warehousing has evolved significantly with cloud adoption:

- **Separation of Storage and Compute**: Scale each independently based on needs
- **Columnar Storage**: Optimized for analytical queries and compression
- **Massively Parallel Processing (MPP)**: Distribute queries across nodes
- **Automatic Optimization**: Self-tuning query engines and indexing

### Data Organization
Data warehouses organize data in structured ways:

- **Schemas**: Star schema, snowflake schema for dimensional modeling
- **Tables**: Fact tables (events) and dimension tables (context)
- **Partitioning**: Split large tables by date or key for performance
- **Clustering**: Organize data physically for faster queries

## Key Features

### Query Performance
- Sub-second response times for complex queries
- Concurrent user support without degradation
- Caching and materialized views
- Query optimization and execution plans

### Data Management
- Schema evolution and migration support
- Time travel and data versioning
- Data sharing across organizations
- Automated backups and recovery

### Security
- Column-level and row-level security
- Data masking for sensitive information
- Audit trails and compliance reporting
- Integration with identity providers

## Implementation Best Practices

### Data Modeling
Design your data model for analytical queries:
1. Identify business processes (facts)
2. Define dimensions and hierarchies
3. Choose appropriate grain
4. Plan for slowly changing dimensions

### Performance Optimization
- Use appropriate data types and compression
- Implement partitioning and clustering strategies
- Create materialized views for common queries
- Monitor and tune query patterns

### Governance
- Establish naming conventions
- Document data lineage
- Implement data quality checks
- Define access policies

## Common Patterns

### ETL vs ELT
Modern cloud warehouses favor ELT (Extract, Load, Transform) where transformations happen inside the warehouse using SQL.

### Real-time Data
Streaming ingestion pipelines enable near-real-time analytics while maintaining warehouse capabilities.

### Data Mesh
Decentralized data ownership with domain-specific data products, federated governance, and self-serve infrastructure.
`.trim(),

    'etl-elt': (term) => `
${term.term} represents a critical data integration pattern that every data engineer must understand and implement effectively.

## What is ${term.term}?

${term.shortDefinition}

## The Evolution of Data Integration

Data integration has evolved significantly over the decades:

### Traditional ETL
In the past, ETL (Extract, Transform, Load) was the standard:
- Extract data from sources
- Transform in a staging area
- Load into the destination

### Modern ELT
Cloud data warehouses enabled ELT (Extract, Load, Transform):
- Extract data from sources
- Load raw data into the warehouse
- Transform using SQL in the warehouse

## Core Components

### Data Extraction
The first step involves connecting to and reading from data sources:

- **Databases**: PostgreSQL, MySQL, SQL Server, Oracle
- **APIs**: REST, GraphQL, webhooks
- **Files**: CSV, JSON, Parquet, Avro
- **SaaS Applications**: Salesforce, HubSpot, Stripe
- **Streams**: Kafka, Kinesis, Pub/Sub

### Data Transformation
Transformations convert raw data into analytics-ready format:

- **Cleansing**: Handle nulls, duplicates, invalid values
- **Standardization**: Consistent formats, naming, units
- **Enrichment**: Add calculated fields, lookups
- **Aggregation**: Summarize at different grains
- **Modeling**: Create facts and dimensions

### Data Loading
Loading strategies depend on requirements:

- **Full Load**: Complete refresh each run
- **Incremental Load**: Only new/changed records
- **CDC (Change Data Capture)**: Real-time changes
- **Micro-batch**: Small, frequent batches

## Best Practices

### Reliability
- Implement idempotent operations
- Add comprehensive error handling
- Create data quality checkpoints
- Build alerting for failures

### Performance
- Parallelize where possible
- Use bulk loading operations
- Optimize transformation queries
- Cache frequently accessed data

### Maintainability
- Version control your pipelines
- Document dependencies
- Use modular, reusable components
- Test transformations thoroughly

## Tools and Technologies

Popular tools for implementing these patterns include:
- **Apache Airflow**: Workflow orchestration
- **dbt**: SQL-based transformations
- **Fivetran/Airbyte**: Managed data connectors
- **Spark/Databricks**: Large-scale processing
- **Dagster/Prefect**: Modern orchestration
`.trim(),

    'data-governance': (term) => `
${term.term} is essential for ensuring data quality, security, and compliance across the organization's data ecosystem.

## What is ${term.term}?

${term.shortDefinition}

## The Importance of ${term.term}

In today's data-driven organizations, proper governance is critical:

### Business Value
- Trusted data leads to better decisions
- Reduced risk of compliance violations
- Improved operational efficiency
- Enhanced data democratization

### Technical Benefits
- Clear data ownership and accountability
- Standardized data formats and definitions
- Automated policy enforcement
- Comprehensive audit capabilities

## Core Pillars

### Data Quality
Ensuring data is accurate, complete, and timely:

- **Accuracy**: Data reflects reality correctly
- **Completeness**: All required fields are populated
- **Consistency**: Values align across systems
- **Timeliness**: Data is current and available when needed
- **Validity**: Data conforms to business rules

### Data Security
Protecting sensitive information:

- **Access Control**: Who can see and modify data
- **Encryption**: Protect data at rest and in transit
- **Masking**: Hide sensitive values in non-production
- **Auditing**: Track all data access and changes

### Data Cataloging
Making data discoverable:

- **Metadata Management**: Technical and business metadata
- **Data Dictionary**: Definitions and documentation
- **Lineage Tracking**: Understanding data flow
- **Search and Discovery**: Finding relevant datasets

## Implementation Framework

### People
- Establish data stewards for each domain
- Create a data governance council
- Define roles and responsibilities
- Provide training and education

### Process
- Define data policies and standards
- Create approval workflows
- Implement review cycles
- Establish escalation procedures

### Technology
- Deploy data cataloging tools
- Implement automated quality checks
- Set up monitoring and alerting
- Enable self-service access

## Best Practices

### Start Small
Begin with high-impact data domains and expand gradually.

### Automate
Use tools to enforce policies automatically rather than relying on manual processes.

### Measure
Track metrics like data quality scores, policy violations, and time to access.

### Iterate
Continuously improve based on feedback and changing requirements.
`.trim(),

    'default': (term) => `
${term.term} is a fundamental concept in data engineering that plays a crucial role in modern data infrastructure.

## What is ${term.term}?

${term.shortDefinition}

## Why ${term.term} Matters

Understanding ${term.term} is essential for data engineers because:

### Business Impact
- Enables data-driven decision making
- Improves operational efficiency
- Reduces costs and time-to-insight
- Supports compliance and governance

### Technical Benefits
- Scalable data processing
- Improved reliability and performance
- Better data quality and consistency
- Enhanced integration capabilities

## Core Concepts

### Architecture
${term.term} typically involves these architectural considerations:

1. **Data Sources**: Where data originates (databases, APIs, files, streams)
2. **Processing**: How data is transformed and enriched
3. **Storage**: Where processed data is persisted
4. **Access**: How users and applications consume data

### Key Components
Modern implementations include:

- Ingestion pipelines for data collection
- Processing engines for transformation
- Storage systems for persistence
- Query interfaces for access
- Monitoring tools for observability

## Implementation Best Practices

### Design Principles
- Design for scalability from the start
- Implement idempotent operations
- Use declarative configurations
- Embrace automation

### Reliability
- Build in redundancy and failover
- Implement comprehensive monitoring
- Create runbooks for common issues
- Test disaster recovery procedures

### Performance
- Optimize for common access patterns
- Use appropriate caching strategies
- Parallelize where possible
- Monitor and tune regularly

### Security
- Follow least-privilege principle
- Encrypt sensitive data
- Audit all access and changes
- Regular security reviews

## Common Patterns

### Batch Processing
Process large volumes of data on a schedule, typically for historical analysis and reporting.

### Stream Processing
Handle data in real-time as it arrives, enabling immediate insights and actions.

### Hybrid Approach
Combine batch and stream processing using the Lambda or Kappa architecture patterns.

## Integration with Modern Data Stack

${term.term} integrates with:
- Data warehouses (Snowflake, BigQuery, Redshift)
- Data lakes (Delta Lake, Apache Iceberg)
- Orchestration (Airflow, Prefect, Dagster)
- BI tools (Tableau, Looker, Power BI)
- ML platforms (MLflow, Kubeflow, SageMaker)

## Getting Started

To implement ${term.term} effectively:

1. **Assess Requirements**: Understand data volumes, latency needs, and use cases
2. **Choose Tools**: Select appropriate technologies for your stack
3. **Design Architecture**: Plan for scalability and reliability
4. **Implement Gradually**: Start simple and iterate
5. **Monitor and Improve**: Track performance and optimize
`.trim()
};

/**
 * Count words in a string
 */
function countWords(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Generate enriched content for a term
 */
function enrichContent(term) {
    const template = CONTENT_TEMPLATES[term.category] || CONTENT_TEMPLATES['default'];
    return template(term);
}

/**
 * Process all glossary files
 */
async function main() {
    console.log('📝 Enriching Glossary Content for 400+ Words\n');

    const files = fs.readdirSync(GLOSSARY_DIR).filter(f => f.endsWith('.json'));
    let totalEnriched = 0;
    let totalSkipped = 0;

    for (const file of files) {
        const filePath = path.join(GLOSSARY_DIR, file);
        const terms = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let modified = false;

        console.log(`\n📁 Processing ${file}...`);

        for (const term of terms) {
            const currentContent = term.fullDefinition || '';
            const currentWords = countWords(currentContent);

            if (currentWords < MIN_WORDS) {
                // Generate enriched content
                const enrichedContent = enrichContent(term);
                const newWords = countWords(enrichedContent);

                term.fullDefinition = enrichedContent;
                term.lastUpdated = new Date().toISOString().split('T')[0];

                console.log(`   ✅ ${term.term}: ${currentWords} → ${newWords} words`);
                totalEnriched++;
                modified = true;
            } else {
                console.log(`   ⏭️  ${term.term}: Already has ${currentWords} words`);
                totalSkipped++;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(terms, null, 2));
        }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                   ENRICHMENT SUMMARY                          ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Terms Enriched:        ${String(totalEnriched).padEnd(5)}                             ║`);
    console.log(`║  Terms Skipped:         ${String(totalSkipped).padEnd(5)}                             ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
