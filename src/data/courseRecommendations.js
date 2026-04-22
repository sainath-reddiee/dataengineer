/**
 * Course Recommendations (affiliate-aware)
 * ------------------------------------------------------------
 * Maps article categories / tags to curated external courses.
 * Used by <RecommendedCourses/> on ArticlePage.jsx.
 *
 * Matching strategy mirrors articleToolMap.js:
 *   1. Normalize article category + tags to lowercase slugs.
 *   2. Look up COURSE_MAP[key] → array of course ids.
 *   3. De-duplicate, cap at `limit`.
 */

import { normalizeKey } from './articleToolMap';

// ── Course catalogue ────────────────────────────────────────
const COURSES = {
  // Snowflake
  snowproCore: {
    id: 'snowpro-core',
    title: 'SnowPro Core Certification Prep',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/snowflake-snowpro-core-certification-exam/?referralCode=54600677AA1322EA8749',
    description: 'Complete SnowPro Core (COF-C02) exam prep — architecture, virtual warehouses, storage, data loading, and security.',
    tags: ['snowflake', 'certification'],
    difficulty: 'Intermediate',
    isFree: false,
  },
  snowproGenAI: {
    id: 'snowpro-gen-ai',
    title: 'SnowPro Specialty: Gen AI Practice Tests',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/snowpro-specialty-generative-ai-practice-exams-ges-c01/?referralCode=54600677AA1322EA8749',
    description: 'Practice exams for the SnowPro Specialty Generative AI (GES-C01) certification — Cortex LLM, ML, vector search.',
    tags: ['snowflake', 'ai', 'certification'],
    difficulty: 'Advanced',
    isFree: false,
  },
  snowflakeZeroToHero: {
    id: 'sf-zero-to-hero',
    title: 'Snowflake — The Complete Masterclass',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/snowflake-the-complete-masterclass/',
    description: 'Hands-on Snowflake course: warehouses, stages, Snowpipe, streams, tasks, time travel, data sharing, and access control.',
    tags: ['snowflake'],
    difficulty: 'Beginner',
    isFree: false,
  },
  // dbt
  dbtFundamentals: {
    id: 'dbt-fundamentals',
    title: 'dbt Fundamentals',
    platform: 'dbt Learn',
    url: 'https://learn.getdbt.com/courses/dbt-fundamentals',
    description: 'Official free course from dbt Labs — models, tests, documentation, sources, and deployment basics.',
    tags: ['dbt'],
    difficulty: 'Beginner',
    isFree: true,
  },
  dbtAdvanced: {
    id: 'dbt-advanced',
    title: 'Advanced dbt — Jinja, Macros & Packages',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/complete-dbt-data-build-tool-bootcamp-zero-to-hero/',
    description: 'Deep dive into Jinja templating, custom macros, packages, incremental models, and CI/CD pipelines for dbt.',
    tags: ['dbt'],
    difficulty: 'Advanced',
    isFree: false,
  },
  // Airflow
  airflowBootcamp: {
    id: 'airflow-bootcamp',
    title: 'Apache Airflow — The Hands-On Guide',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/the-complete-hands-on-course-to-master-apache-airflow/',
    description: 'Build production DAGs with TaskFlow API, sensors, branching, XComs, and Kubernetes executor.',
    tags: ['airflow', 'orchestration'],
    difficulty: 'Intermediate',
    isFree: false,
  },
  astronomerCert: {
    id: 'astronomer-cert',
    title: 'Astronomer Certification for Apache Airflow',
    platform: 'Astronomer',
    url: 'https://www.astronomer.io/certification/',
    description: 'Free official certification covering DAG authoring, scheduling, executors, and Airflow best practices.',
    tags: ['airflow', 'certification'],
    difficulty: 'Intermediate',
    isFree: true,
  },
  // SQL
  sqlForDE: {
    id: 'sql-for-de',
    title: 'SQL for Data Engineers',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
    description: 'Master window functions, CTEs, subqueries, indexing, and query optimization — with real-world data engineering patterns.',
    tags: ['sql', 'data-engineering'],
    difficulty: 'Beginner',
    isFree: false,
  },
  // Python
  pythonForDE: {
    id: 'python-for-de',
    title: 'Python for Data Engineering',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/python-for-data-engineering/',
    description: 'Python pipelines with Pandas, PySpark, APIs, file parsing, and cloud integration for data engineers.',
    tags: ['python', 'data-engineering'],
    difficulty: 'Intermediate',
    isFree: false,
  },
  // AWS
  awsDeAssociate: {
    id: 'aws-de-associate',
    title: 'AWS Data Engineer Associate (DEA-C01)',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/aws-data-engineer/',
    description: 'Exam prep: Glue, Redshift, Kinesis, Lake Formation, Athena, EMR, and data pipeline architecture on AWS.',
    tags: ['aws', 'certification'],
    difficulty: 'Intermediate',
    isFree: false,
  },
  // Databricks
  databricksLakehouse: {
    id: 'dbx-lakehouse',
    title: 'Databricks Lakehouse Fundamentals',
    platform: 'Databricks Academy',
    url: 'https://www.databricks.com/learn/training/lakehouse-fundamentals',
    description: 'Free official course — Delta Lake, Unity Catalog, lakehouse architecture, and data governance on Databricks.',
    tags: ['databricks'],
    difficulty: 'Beginner',
    isFree: true,
  },
  // Azure
  azureDE: {
    id: 'azure-de',
    title: 'Azure Data Engineer Associate (DP-203)',
    platform: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-data-engineer/',
    description: 'Free learning path for DP-203 — Synapse, Data Factory, Databricks on Azure, and data lake architecture.',
    tags: ['azure', 'certification'],
    difficulty: 'Intermediate',
    isFree: true,
  },
};

// ── Platform colors (Tailwind class fragments) ──────────────
export const PLATFORM_COLORS = {
  'Udemy':               { bg: 'bg-purple-900/50', text: 'text-purple-300', border: 'border-purple-500/30' },
  'dbt Learn':           { bg: 'bg-orange-900/50', text: 'text-orange-300', border: 'border-orange-500/30' },
  'Astronomer':          { bg: 'bg-indigo-900/50', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  'Databricks Academy':  { bg: 'bg-red-900/50',    text: 'text-red-300',    border: 'border-red-500/30' },
  'Microsoft Learn':     { bg: 'bg-sky-900/50',    text: 'text-sky-300',    border: 'border-sky-500/30' },
  'Coursera':            { bg: 'bg-blue-900/50',   text: 'text-blue-300',   border: 'border-blue-500/30' },
};

const DEFAULT_PLATFORM_COLOR = { bg: 'bg-slate-700/50', text: 'text-gray-300', border: 'border-slate-600/30' };

export function getPlatformColor(platform) {
  return PLATFORM_COLORS[platform] || DEFAULT_PLATFORM_COLOR;
}

// ── Category / tag → course mapping ─────────────────────────
const COURSE_MAP = {
  snowflake: [COURSES.snowproCore, COURSES.snowproGenAI, COURSES.snowflakeZeroToHero],
  dbt:       [COURSES.dbtFundamentals, COURSES.dbtAdvanced],
  airflow:   [COURSES.airflowBootcamp, COURSES.astronomerCert],
  sql:       [COURSES.sqlForDE, COURSES.snowflakeZeroToHero],
  python:    [COURSES.pythonForDE, COURSES.sqlForDE],
  pyspark:   [COURSES.pythonForDE, COURSES.databricksLakehouse],
  aws:       [COURSES.awsDeAssociate],
  azure:     [COURSES.azureDE],
  databricks:[COURSES.databricksLakehouse],
  'data-engineering': [COURSES.sqlForDE, COURSES.pythonForDE, COURSES.dbtFundamentals],
  'data-warehousing': [COURSES.snowflakeZeroToHero, COURSES.snowproCore],
  'data-modeling':    [COURSES.snowflakeZeroToHero, COURSES.sqlForDE],
  etl:       [COURSES.dbtFundamentals, COURSES.airflowBootcamp, COURSES.pythonForDE],
  orchestration: [COURSES.airflowBootcamp, COURSES.astronomerCert],
  iceberg:   [COURSES.databricksLakehouse, COURSES.snowproCore],
  ai:        [COURSES.snowproGenAI],
  cortex:    [COURSES.snowproGenAI, COURSES.snowproCore],
};

/**
 * Resolve recommended courses for a given article.
 *
 * @param {object} post            Article object.
 * @param {string} post.category   WordPress category name or slug.
 * @param {string[]} [post.tags]   Optional tag list (names or slugs).
 * @param {number}   [limit]       Max courses to return (default 3).
 * @returns {Array} Matched course objects, de-duplicated.
 */
export function getRecommendedCourses(post = {}, limit = 3) {
  if (!post) return [];

  const keys = new Set();
  const primary = normalizeKey(post.category);
  if (primary) keys.add(primary);
  (post.tags || []).forEach((t) => {
    const k = normalizeKey(typeof t === 'string' ? t : t?.name || t?.slug);
    if (k) keys.add(k);
  });

  const result = [];
  const seen = new Set();

  for (const key of keys) {
    const courses = COURSE_MAP[key];
    if (!courses) continue;
    for (const course of courses) {
      if (seen.has(course.id)) continue;
      seen.add(course.id);
      result.push(course);
      if (result.length >= limit) return result;
    }
  }

  return result;
}
