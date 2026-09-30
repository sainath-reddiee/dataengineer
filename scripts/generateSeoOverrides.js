/**
 * Generate SEO overrides for missing articles
 * Run: node scripts/generateSeoOverrides.js
 * Outputs to console - copy into src/data/seoOverrides.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import seoOverrides from '../src/data/seoOverrides.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load build cache
const buildCache = JSON.parse(fs.readFileSync(join(rootDir, '.build-cache.json'), 'utf8'));
const cachedSlugs = Object.keys(buildCache.pages)
  .filter(p => p.startsWith('/articles/'))
  .map(p => p.replace('/articles/', ''));

const overrideKeys = new Set(Object.keys(seoOverrides));
const missingSlugs = cachedSlugs.filter(s => !overrideKeys.has(s));

console.log(`Found ${missingSlugs.length} articles missing SEO overrides\n`);

// Title templates by category/keyword patterns
const titleTemplates = {
  'snowflake': [
    (title) => `${title}: Complete Guide 2026`,
    (title) => `${title} — Production Tutorial`,
    (title) => `${title}: What You Need to Know`,
    (title) => `Master ${title} in 2026`,
  ],
  'dbt': [
    (title) => `${title}: Best Practices`,
    (title) => `${title} — Step-by-Step Guide`,
    (title) => `Production ${title} Tutorial`,
  ],
  'airflow': [
    (title) => `${title}: Orchestration Guide`,
    (title) => `${title} — Production Patterns`,
    (title) => `Master ${title} for Data Pipelines`,
  ],
  'sql': [
    (title) => `${title}: Interview & Production Guide`,
    (title) => `${title} — Advanced Patterns`,
    (title) => `Essential ${title} for Data Engineers`,
  ],
  'python': [
    (title) => `${title}: Data Engineering Tutorial`,
    (title) => `${title} — Hands-On Guide`,
    (title) => `Production ${title} Patterns`,
  ],
  'ai': [
    (title) => `${title}: Practical Guide`,
    (title) => `${title} — What Works in Production`,
    (title) => `Building ${title} — Real Examples`,
  ],
  'agent': [
    (title) => `${title}: Build & Deploy`,
    (title) => `${title} — Complete Tutorial`,
    (title) => `Production ${title} Guide`,
  ],
  'cost': [
    (title) => `${title}: Cut Spend ${Math.floor(Math.random() * 40) + 30}%`,
    (title) => `${title} — FinOps Guide`,
    (title) => `Optimize ${title} in 2026`,
  ],
  'interview': [
    (title) => `${title}: Expert Answers`,
    (title) => `${title} — Staff Level Prep`,
    (title) => `Ace ${title} in 2026`,
  ],
  'default': [
    (title) => `${title}: Complete Guide`,
    (title) => `${title} — Production Tutorial`,
    (title) => `Master ${title} in 2026`,
  ],
};

const descTemplates = {
  'snowflake': [
    (title) => `Learn ${title.toLowerCase()} with production-tested patterns. Real SQL examples, common pitfalls, and optimization tips from a working data engineer.`,
    (title) => `Master ${title.toLowerCase()} in Snowflake. Step-by-step tutorial with real queries, performance benchmarks, and gotchas to avoid.`,
  ],
  'dbt': [
    (title) => `Production ${title.toLowerCase()} guide for dbt. Covers project structure, testing, models, and deployment patterns that scale.`,
    (title) => `Learn ${title.toLowerCase()} with dbt. Real examples, best practices, and common mistakes to avoid in your data pipeline.`,
  ],
  'airflow': [
    (title) => `Build robust ${title.toLowerCase()} with Airflow. DAG patterns, task design, and production tips from real data pipelines.`,
    (title) => `${title} with Apache Airflow — step by step. Dynamic DAGs, error handling, and scaling patterns for production.`,
  ],
  'sql': [
    (title) => `Advanced ${title.toLowerCase()} for data engineers. Window functions, CTEs, and query patterns that appear in interviews and production.`,
    (title) => `Essential ${title.toLowerCase()} techniques. Real query examples, performance tips, and interview-ready explanations.`,
  ],
  'python': [
    (title) => `Practical ${title.toLowerCase()} for data engineering. Pandas, PySpark, and modern Python patterns that ship to production.`,
    (title) => `${title} with Python — hands-on tutorial. Code examples, project structure, and deployment tips for data pipelines.`,
  ],
  'ai': [
    (title) => `Build ${title.toLowerCase()} that actually work in production. RAG, agents, and LLM patterns with real architecture decisions.`,
    (title) => `${title} — practical guide with code. Vector search, embeddings, and evaluation metrics for production AI.`,
  ],
  'agent': [
    (title) => `Build ${title.toLowerCase()} from scratch. Framework selection, tool design, memory, and deployment — all with working code.`,
    (title) => `Production ${title.toLowerCase()} tutorial. Step-by-step with real examples, error handling, and monitoring.`,
  ],
  'cost': [
    (title) => `Cut ${title.toLowerCase()} with proven FinOps strategies. Warehouse sizing, query optimization, and credit monitoring that save real money.`,
    (title) => `${title} optimization guide. Snowflake, BigQuery, and Databricks cost reduction patterns used in production.`,
  ],
  'interview': [
    (title) => `Expert ${title.toLowerCase()} with detailed answers. Staff-level questions covering architecture, optimization, and real-world scenarios.`,
    (title) => `Prepare for ${title.toLowerCase()} with real questions. Detailed explanations, code examples, and what interviewers actually look for.`,
  ],
  'default': [
    (title) => `Complete guide to ${title.toLowerCase()}. Production patterns, real examples, and common pitfalls from a working data engineer.`,
    (title) => `Learn ${title.toLowerCase()} with hands-on tutorial. Step-by-step implementation, best practices, and what to avoid.`,
  ],
};

function slugToTitle(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getCategory(slug) {
  const lower = slug.toLowerCase();
  if (lower.includes('snowflake')) return 'snowflake';
  if (lower.includes('dbt')) return 'dbt';
  if (lower.includes('airflow')) return 'airflow';
  if (lower.includes('sql')) return 'sql';
  if (lower.includes('python') || lower.includes('pyspark') || lower.includes('pandas')) return 'python';
  if (lower.includes('agent') || lower.includes('autonomous') || lower.includes('mcp') || lower.includes('rag')) return 'agent';
  if (lower.includes('ai') || lower.includes('llm') || lower.includes('cortex') || lower.includes('cortex')) return 'ai';
  if (lower.includes('cost') || lower.includes('optimization') || lower.includes('finops') || lower.includes('credit')) return 'cost';
  if (lower.includes('interview') || lower.includes('question')) return 'interview';
  return 'default';
}

function generateOverride(slug) {
  const category = getCategory(slug);
  const baseTitle = slugToTitle(slug);
  
  // Pick title template
  const titleTmpl = titleTemplates[category] || titleTemplates.default;
  const title = titleTmpl[Math.floor(Math.random() * titleTmpl.length)](baseTitle);
  
  // Pick description template
  const descTmpl = descTemplates[category] || descTemplates.default;
  const description = descTmpl[Math.floor(Math.random() * descTmpl.length)](baseTitle);
  
  // Ensure title < 60 chars, description 120-155 chars
  const finalTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  const finalDesc = description.length > 155 ? description.substring(0, 152) + '...' : 
                    description.length < 120 ? description + ' Read the full guide.' : description;
  
  return { title: finalTitle, description: finalDesc };
}

// Generate overrides
console.log('// =============================================');
console.log('// AUTO-GENERATED SEO OVERRIDES FOR MISSING ARTICLES');
console.log('// Add these to src/data/seoOverrides.js');
console.log('// =============================================\n');

const newOverrides = {};
for (const slug of missingSlugs) {
  const override = generateOverride(slug);
  newOverrides[slug] = override;
  console.log(`  '${slug}': {`);
  console.log(`    title: '${override.title}',`);
  console.log(`    description: '${override.description}'`);
  console.log(`  },`);
}

console.log(`\n// Total generated: ${Object.keys(newOverrides).length}`);

// Also output as JSON for easy copy-paste
console.log('\n// JSON format:');
console.log(JSON.stringify(newOverrides, null, 2));