// src/components/InlineToolWidget.jsx - Contextual tool card shown on article pages
// Maps article categories to relevant interactive tools on the site
import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ArrowRight } from 'lucide-react';

const TOOL_MAP = {
  'Spark': { label: 'Spark vs Flink Comparison Tool', to: '/compare', desc: 'Compare big data frameworks side-by-side' },
  'Apache Spark': { label: 'Spark vs Flink Comparison Tool', to: '/compare', desc: 'Compare big data frameworks side-by-side' },
  'Databricks': { label: 'Cloud Platform Comparison', to: '/compare', desc: 'Compare Databricks, Snowflake, BigQuery & more' },
  'Snowflake': { label: 'Cloud Platform Comparison', to: '/compare', desc: 'Compare Snowflake vs Databricks vs others' },
  'Data Engineering': { label: 'DE Tool Comparison', to: '/compare', desc: 'Compare data engineering platforms head-to-head' },
  'Python': { label: 'Python for DE Guide', to: '/articles', desc: 'Explore Python tutorials for data engineering' },
  'SQL': { label: 'SQL Resource Hub', to: '/articles', desc: 'Browse SQL guides and best practices' },
  'Cloud': { label: 'Cloud Platform Comparison', to: '/compare', desc: 'Compare AWS, Azure, and GCP services' },
  'AWS': { label: 'Cloud Platform Comparison', to: '/compare', desc: 'Compare AWS services with other cloud providers' },
  'Azure': { label: 'Cloud Platform Comparison', to: '/compare', desc: 'Compare Azure vs AWS vs GCP' },
  'GCP': { label: 'Cloud Platform Comparison', to: '/compare', desc: 'Compare GCP with other cloud platforms' },
  'Airflow': { label: 'Orchestration Tool Comparison', to: '/compare', desc: 'Compare Airflow, Dagster, Prefect & more' },
  'Kafka': { label: 'Streaming Tools Comparison', to: '/compare', desc: 'Compare Kafka, Flink, Pulsar side-by-side' },
  'BigQuery': { label: 'Cloud Warehouse Comparison', to: '/compare', desc: 'Compare BigQuery vs Snowflake vs Redshift' },
  'dbt': { label: 'Transformation Tool Comparison', to: '/compare', desc: 'Compare dbt, Dataform, and other transform tools' },
};

// Fallback for articles that don't match any category
const DEFAULT_TOOL = { label: 'Explore Comparison Tools', to: '/compare', desc: 'Compare data engineering tools and platforms' };

/**
 * Shows a contextual "Try this tool" card based on the article's category/tags.
 * @param {{ post: { category?: string, tags?: string[] } }} props
 */
export default function InlineToolWidget({ post }) {
  if (!post) return null;

  // Try to find a matching tool from category first, then tags
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
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Related Tool</p>
          <p className="text-white font-bold text-base mb-1">{tool.label}</p>
          <p className="text-gray-400 text-sm mb-3">{tool.desc}</p>
          <Link
            to={tool.to}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors group"
          >
            Try it now
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
