import crypto from 'crypto';
import db, { addQuestion, getAllQuestions } from './db.js';

const QUESTIONS = [
  // ── SQL: Aggregation & Grouping ──
  { difficulty: 'EASY',   type: 'SQL', topic: 'Aggregation',       role: 'Data Analyst',       platform: 'Snowflake', company: 'Stripe', question: 'Write a query to find the top 5 products by total revenue in 2025. Include product name, order count, and total revenue.', proOnly: false },
  { difficulty: 'EASY',   type: 'SQL', topic: 'Joins',             role: 'BI Analyst',         platform: 'BigQuery',  company: 'Amazon', question: 'Join the orders and customers tables. Return customers who placed more than 3 orders in the last 30 days.', proOnly: false },
  { difficulty: 'EASY',   type: 'SQL', topic: 'Aggregation',       role: 'Data Engineer',      platform: 'Spark SQL', company: 'Uber', question: 'Count distinct active users per day and compute 7-day rolling distinct user count.', proOnly: false },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Pivoting',          role: 'Analytics Engineer', platform: 'dbt',       company: 'Stripe', question: 'Pivot monthly sales rows into columns (Jan, Feb, Mar...) using conditional aggregation (CASE WHEN) without using PIVOT keyword.', proOnly: false },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Aggregation',       role: 'Data Analyst',       platform: 'PostgreSQL',company: 'Shopify', question: 'Calculate the average basket size per customer cohort (grouped by acquisition month).', proOnly: false },

  // ── SQL: Window Functions & Ranking ──
  { difficulty: 'EASY',   type: 'SQL', topic: 'Window functions',  role: 'Data Analyst',       platform: 'Snowflake', company: 'Meta', question: 'Add a running total of revenue to each order row, partitioned by customer_id and ordered by order_date.', proOnly: false },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Window functions',  role: 'Data Analyst',       platform: 'Snowflake', company: 'Airbnb', question: 'Deduplicate to the latest customer record using ROW_NUMBER(). Why can you not put ROW_NUMBER() directly in the WHERE clause?', proOnly: true },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Ranking',           role: 'BI Analyst',         platform: 'BigQuery',  company: 'Google', question: 'Write top-3 orders per country by amount. What breaks if you use RANK() vs DENSE_RANK() vs ROW_NUMBER() when ties exist?', proOnly: true },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Window functions',  role: 'Analytics Engineer', platform: 'dbt',       company: 'Netflix', question: 'Calculate month-over-month percentage growth in subscriber count using LAG(). Handle division by zero.', proOnly: true },
  { difficulty: 'HARD',   type: 'SQL', topic: 'Gaps & Islands',    role: 'Data Engineer',      platform: 'PostgreSQL',company: 'Apple', question: 'Find the consecutive streak of days each user logged in (Gaps and Islands problem) using difference of ROW_NUMBERs.', proOnly: true },

  // ── SQL: Sessionization & Anti-Joins ──
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Sessionization',    role: 'Data Engineer',      platform: 'Spark SQL', company: 'DoorDash', question: 'Sessionize user click events into session IDs defined by a 30-minute inactivity gap between consecutive timestamps.', proOnly: true },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Anti-joins',        role: 'Analytics Engineer', platform: 'dbt',       company: 'Snowflake', question: 'Find customers who bought product A but never bought product B. Contrast NOT IN (with NULL trap) vs LEFT JOIN / IS NULL.', proOnly: true },
  { difficulty: 'MEDIUM', type: 'SQL', topic: 'Data quality',      role: 'Data Engineer',      platform: 'Snowflake', company: 'Databricks', question: 'A 1:N join exploded metric revenue values by 4x. How do you detect and fix the fan-out grain mismatch in 5 minutes?', proOnly: true },
  { difficulty: 'HARD',   type: 'SQL', topic: 'Semi-structured',   role: 'Data Engineer',      platform: 'Snowflake', company: 'Snowflake', question: 'Flatten a nested JSON payload containing order line items and extract discount rates using Snowflake LATERAL FLATTEN.', proOnly: true },
  { difficulty: 'HARD',   type: 'SQL', topic: 'Time series',       role: 'Analytics Engineer', platform: 'BigQuery',  company: 'Google', question: 'Write a cumulative retention matrix (Day 1, Day 7, Day 30 retention) for user signups across weekly cohorts.', proOnly: true },

  // ── PySpark & Data Engineering Pipelines ──
  { difficulty: 'EASY',   type: 'Python', topic: 'PySpark',           role: 'Data Engineer',      platform: 'Spark',     company: 'Amazon', question: 'Write PySpark code to read 500GB of JSON logs from S3, filter status=500, partition by event_date, and write out as Parquet.', proOnly: false },
  { difficulty: 'MEDIUM', type: 'Python', topic: 'PySpark Tuning',    role: 'Data Engineer',      platform: 'Spark',     company: 'Uber', question: 'Explain data skew in PySpark joins. How do you use salting or broadcast joins to fix a executor OOM error?', proOnly: true },
  { difficulty: 'MEDIUM', type: 'Python', topic: 'PySpark Windowing', role: 'Data Engineer',      platform: 'Databricks',company: 'LinkedIn', question: 'Write PySpark code to calculate a 7-day trailing average revenue per user using PySpark Window spec.', proOnly: true },
  { difficulty: 'HARD',   type: 'Python', topic: 'PySpark Streaming', role: 'Data Engineer',      platform: 'Spark',     company: 'Databricks', question: 'Write a Structured Streaming job reading Kafka events with 10-minute watermarking to handle late-arriving event data.', proOnly: true },
  { difficulty: 'HARD',   type: 'Python', topic: 'Memory Optimization',role: 'Data Architect',     platform: 'Spark',     company: 'Apple', question: 'Analyze a PySpark DAG execution plan. Distinguish between repartition vs coalesce and explain when shuffle occurs.', proOnly: true },

  // ── Python, NumPy, Stats & ML Metrics ──
  { difficulty: 'EASY',   type: 'Python', topic: 'Statistics',        role: 'Data Scientist',     platform: 'NumPy',     company: 'Meta', question: 'Implement arithmetic mean, median, and variance from scratch without using numpy or scipy built-ins.', proOnly: false },
  { difficulty: 'EASY',   type: 'Python', topic: 'ML Metrics',        role: 'ML Engineer',        platform: 'PyTorch',   company: 'Tesla', question: 'Implement Mean Squared Error (MSE) and Root Mean Squared Error (RMSE) loss functions from scratch with vectorization.', proOnly: false },
  { difficulty: 'MEDIUM', type: 'Python', topic: 'ML Metrics',        role: 'ML Engineer',        platform: 'PyTorch',   company: 'OpenAI', question: 'Implement softmax and cross-entropy loss from scratch. Show numerical stability tricks (subtracting max value).', proOnly: true },
  { difficulty: 'MEDIUM', type: 'Python', topic: 'Data Structures',   role: 'Data Engineer',      platform: 'Python',    company: 'Bloomberg', question: 'Implement an LRU Cache with O(1) get and put operations using a doubly linked list and dictionary.', proOnly: true },
  { difficulty: 'HARD',   type: 'Python', topic: 'Vector Search',     role: 'AI Engineer',        platform: 'PyTorch',   company: 'Anthropic', question: 'Implement batch cosine similarity matrix computation for RAG embeddings. Handle large batch sizes efficiently.', proOnly: true },

  // ── System Design & Data Warehousing ──
  { difficulty: 'MEDIUM', type: 'System design',topic: 'Orchestration',     role: 'Data Engineer',      platform: 'Airflow',   company: 'Astronomer', question: 'An Airflow sensor burned $2,000 of compute over the weekend. How do you replace it with deferred operators or dataset triggers?', proOnly: true },
  { difficulty: 'HARD',   type: 'System design',topic: 'Streaming',         role: 'Data Engineer',      platform: 'Kafka',     company: 'Confluent', question: 'Design an exactly-once Kafka consumer pipeline to a Snowflake warehouse. Where do you draw the idempotency boundary?', proOnly: true },
  { difficulty: 'HARD',   type: 'System design',topic: 'dbt CI/CD',         role: 'Analytics Engineer', platform: 'dbt',       company: 'dbt Labs', question: 'A dbt CI check passed locally but failed in production. Name the adapter, test, and environment variable that drifted.', proOnly: true },
  { difficulty: 'HARD',   type: 'System design',topic: 'Lakehouse',         role: 'Data Architect',     platform: 'Databricks',company: 'Databricks', question: 'Design a Delta Lake or Apache Iceberg lakehouse architecture for 10TB/day log ingestion with SLA < 5 minutes.', proOnly: true },
  { difficulty: 'MEDIUM', type: 'System design',topic: 'Data Quality',      role: 'Data Engineer',      platform: 'Great Expectations', company: 'Monte Carlo', question: 'How do you design an automated data observability engine that detects schema drift and anomaly volume shifts before reporting dashboards break?', proOnly: true },

  // ── Behavioral & Incident Response ──
  { difficulty: 'EASY',   type: 'Behavioral',   topic: 'Communication',     role: 'Data Analyst',       platform: 'General',   company: 'Slack', question: 'Tell me about a time you disagreed with a stakeholder over a metric definition. How did you resolve it?', proOnly: false },
  { difficulty: 'EASY',   type: 'Behavioral',   topic: 'Incident Response', role: 'Data Engineer',      platform: 'General',   company: 'PagerDuty', question: 'Describe a data pipeline failure you had to debug during an on-call rotation. What was your triage process?', proOnly: false },
  { difficulty: 'MEDIUM', type: 'Behavioral',   topic: 'Prioritization',    role: 'Analytics Engineer', platform: 'General',   company: 'Linear', question: 'How do you prioritize between technical debt (refactoring dbt models) and urgent stakeholder ad-hoc requests?', proOnly: true },
  { difficulty: 'HARD',   type: 'Behavioral',   topic: 'Architecture',      role: 'Data Architect',     platform: 'General',   company: 'Snowflake', question: 'Tell me about a time you had to say NO to a vice president asking for an unsustainable custom pipeline.', proOnly: true },
];

const existing = getAllQuestions();
if (existing.length === 0) {
  console.log('Seeding database with initial interview questions...');
  QUESTIONS.forEach(q => {
    q.id = crypto.randomUUID();
    addQuestion(q);
  });
  console.log(`Seeded ${QUESTIONS.length} questions successfully!`);
} else {
  console.log(`Database already has ${existing.length} questions. Skipping seed.`);
}
