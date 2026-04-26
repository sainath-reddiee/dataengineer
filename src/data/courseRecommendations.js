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
  // Airflow
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
  airflowIntro: {
    id: 'airflow-intro',
    title: 'What is Apache Airflow — Complete Overview',
    platform: 'Astronomer',
    url: 'https://www.astronomer.io/airflow/',
    description: 'Free learning hub — Airflow concepts, DAGs, operators, and production deployment patterns.',
    tags: ['airflow', 'orchestration'],
    difficulty: 'Beginner',
    isFree: true,
  },
  // SQL
  sqlTutorialMode: {
    id: 'sql-tutorial-mode',
    title: 'SQL Tutorial for Data Analysis',
    platform: 'Mode',
    url: 'https://mode.com/sql-tutorial',
    description: 'Free interactive SQL tutorial — basic queries, joins, aggregations, window functions, and advanced analytics patterns.',
    tags: ['sql', 'data-engineering'],
    difficulty: 'Beginner',
    isFree: true,
  },
  // Python
  pythonCoursera: {
    id: 'python-coursera',
    title: 'Python for Applied Data Science, AI & Development',
    platform: 'Coursera',
    url: 'https://www.coursera.org/learn/python-for-applied-data-science-ai',
    description: 'IBM course on Coursera — Python fundamentals, Pandas, NumPy, APIs, and web scraping for data roles. Free to audit.',
    tags: ['python', 'data-engineering'],
    difficulty: 'Beginner',
    isFree: true,
  },
  // AWS
  awsDeOfficial: {
    id: 'aws-de-official',
    title: 'AWS Certified Data Engineer — Associate (DEA-C01)',
    platform: 'AWS Skill Builder',
    url: 'https://aws.amazon.com/certification/certified-data-engineer-associate/',
    description: 'Official exam page — exam guide, free digital training, sample questions, and official practice exams for DEA-C01.',
    tags: ['aws', 'certification'],
    difficulty: 'Intermediate',
    isFree: true,
  },
  // Databricks
  databricksLakehouse: {
    id: 'dbx-lakehouse',
    title: 'Databricks Fundamentals',
    platform: 'Databricks Academy',
    url: 'https://www.databricks.com/resources/learn/training/databricks-fundamentals',
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
  'Mode':                { bg: 'bg-emerald-900/50',text: 'text-emerald-300',border: 'border-emerald-500/30' },
  'AWS Skill Builder':   { bg: 'bg-amber-900/50',  text: 'text-amber-300',  border: 'border-amber-500/30' },
};

const DEFAULT_PLATFORM_COLOR = { bg: 'bg-slate-700/50', text: 'text-gray-300', border: 'border-slate-600/30' };

export function getPlatformColor(platform) {
  return PLATFORM_COLORS[platform] || DEFAULT_PLATFORM_COLOR;
}

// ── Sponsored slot (set to null to disable) ─────────────────
// The sponsored course is pinned as the first card in the grid
// when its targetKeys match the current article's category/tags.
export const SPONSORED_SLOT = {
  ...COURSES.snowproGenAI,
  isSponsored: true,
  targetKeys: ['snowflake', 'cortex', 'ai', 'data-warehousing', 'data-engineering', 'iceberg'],
};

// ── Category / tag → course mapping ─────────────────────────
const COURSE_MAP = {
  snowflake: [COURSES.snowproCore, COURSES.snowproGenAI],
  dbt:       [COURSES.dbtFundamentals],
  airflow:   [COURSES.astronomerCert, COURSES.airflowIntro],
  sql:       [COURSES.sqlTutorialMode, COURSES.snowproCore],
  python:    [COURSES.pythonCoursera, COURSES.sqlTutorialMode],
  pyspark:   [COURSES.pythonCoursera, COURSES.databricksLakehouse],
  aws:       [COURSES.awsDeOfficial],
  azure:     [COURSES.azureDE],
  databricks:[COURSES.databricksLakehouse],
  'data-engineering': [COURSES.sqlTutorialMode, COURSES.pythonCoursera, COURSES.dbtFundamentals],
  'data-warehousing': [COURSES.snowproCore, COURSES.databricksLakehouse],
  'data-modeling':    [COURSES.snowproCore, COURSES.sqlTutorialMode],
  etl:       [COURSES.dbtFundamentals, COURSES.astronomerCert, COURSES.pythonCoursera],
  orchestration: [COURSES.astronomerCert, COURSES.airflowIntro],
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

  // Prepend sponsored slot when its targeting keys overlap the article
  if (SPONSORED_SLOT) {
    const sponsorMatch = SPONSORED_SLOT.targetKeys.some((tk) => keys.has(tk));
    if (sponsorMatch) {
      result.push(SPONSORED_SLOT);
      seen.add(SPONSORED_SLOT.id);
    }
  }

  const organicLimit = limit - result.length;

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
