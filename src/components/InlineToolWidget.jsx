// src/components/InlineToolWidget.jsx - Contextual tool card shown on article pages
// Maps article categories to the matching calculator or playground.
import { Link } from 'react-router-dom';
import { Wrench, ArrowRight } from 'lucide-react';
import { ADSENSE_REVIEW_MODE, isAdSenseNoindexPath } from '@/data/adsenseQualityGate';

const TOOL_MAP = {
  Spark: { label: 'SQL Playground', to: '/tools/sql-playground', desc: 'Practice window functions and joins in the browser' },
  'Apache Spark': { label: 'SQL Playground', to: '/tools/sql-playground', desc: 'Practice window functions and joins in the browser' },
  Databricks: { label: 'Databricks Cost Calculator', to: '/tools/databricks-cost-calculator', desc: 'Model DBU spend before you resize a cluster' },
  Snowflake: { label: 'Snowflake Cost Calculator', to: '/tools/snowflake-cost-calculator', desc: 'Turn warehouse hours into a monthly bill' },
  'Data Engineering': { label: 'Free Data Engineering Tools', to: '/tools', desc: 'Cost, cron, SQL, and format converters' },
  Python: { label: 'CSV → SQL Converter', to: '/tools/csv-to-sql', desc: 'Turn a sample file into CREATE TABLE + INSERT' },
  SQL: { label: 'SQL Playground', to: '/tools/sql-playground', desc: 'Run QUALIFY, windows, and CTEs on sample tables' },
  Cloud: { label: 'Cloud Warehouse Cost Comparison', to: '/tools/cloud-data-warehouse-cost-comparison', desc: 'Same workload on Snowflake, BigQuery, and Databricks' },
  AWS: { label: 'Cloud Warehouse Cost Comparison', to: '/tools/cloud-data-warehouse-cost-comparison', desc: 'Compare warehouse bills before a migration' },
  Azure: { label: 'Cloud Warehouse Cost Comparison', to: '/tools/cloud-data-warehouse-cost-comparison', desc: 'Compare warehouse bills before a migration' },
  GCP: { label: 'BigQuery Cost Calculator', to: '/tools/bigquery-cost-calculator', desc: 'On-demand vs Editions on the same TB scanned' },
  Airflow: { label: 'Cron Expression Builder', to: '/tools/cron-expression-builder', desc: 'Preview the next five Airflow or TASK runs' },
  Kafka: { label: 'JSON / Parquet / Avro Converter', to: '/tools/json-parquet-avro-converter', desc: 'Inspect Avro and Parquet in the browser' },
  BigQuery: { label: 'BigQuery Cost Calculator', to: '/tools/bigquery-cost-calculator', desc: 'On-demand vs Editions on the same TB scanned' },
  dbt: { label: 'dbt Schema.yml Generator', to: '/tools/dbt-schema-generator', desc: 'Scaffold schema.yml and a staging model from DDL' },
};

const REVIEW_FALLBACK_TOOL = {
  label: 'SQL Playground',
  to: '/tools/sql-playground',
  desc: 'Run QUALIFY, window functions, and CTEs in the browser on DuckDB',
};

const DEFAULT_TOOL = { label: 'Free Data Engineering Tools', to: '/tools', desc: 'Cost calculators, SQL helpers, converters, and generators' };

export default function InlineToolWidget({ post }) {
  if (!post) return null;

  let tool = TOOL_MAP[post.category];
  if (!tool && post.tags) {
    for (const tag of post.tags) {
      const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.slug || '');
      tool = TOOL_MAP[tagName];
      if (tool) break;
    }
  }
  if (!tool) tool = DEFAULT_TOOL;

  if (ADSENSE_REVIEW_MODE && isAdSenseNoindexPath(tool.to)) {
    tool = REVIEW_FALLBACK_TOOL;
  }

  return (
    <div className="my-8 rounded border border-paper-500 bg-paper-300 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-paper-500 bg-paper text-rust-600">
          <Wrench className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-rust-600"> Companion tool</p>
          <p className="mb-1 font-serif text-lg font-semibold text-ink">{tool.label}</p>
          <p className="mb-3 text-sm text-ink-muted">{tool.desc}</p>
          <Link
            to={tool.to}
            reloadDocument={ADSENSE_REVIEW_MODE}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-rust-600 hover:text-rust-700"
          >
            Open it now
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
