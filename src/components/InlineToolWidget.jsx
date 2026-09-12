// src/components/InlineToolWidget.jsx - Contextual tool card shown on article pages
// Maps article categories to the matching calculator or playground.
import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ArrowRight } from 'lucide-react';

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

const DEFAULT_TOOL = { label: 'Free Data Engineering Tools', to: '/tools', desc: 'Cost calculators, SQL helpers, converters, and generators' };

export default function InlineToolWidget({ post }) {
  if (!post) return null;

  let tool = TOOL_MAP[post.category];
  if (!tool && post.tags) {
    for (const tag of post.tags) {
      tool = TOOL_MAP[tag];
      if (tool) break;
    }
  }
  if (!tool) tool = DEFAULT_TOOL;

  return (
    <div className="my-8 p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Try this tool</p>
          <p className="text-white font-bold text-base mb-1">{tool.label}</p>
          <p className="text-gray-400 text-sm mb-3">{tool.desc}</p>
          <Link
            to={tool.to}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors group"
          >
            Open it now
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
