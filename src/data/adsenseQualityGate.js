/**
 * AdSense review quality gate.
 *
 * Adding more original articles did not clear repeated "low value content"
 * rejections because reviewers sample the whole URL set. Practitioner
 * tutorials were diluted by templated glossary / compare pages, tag and
 * category archives, a 30-sheet Q&A cluster, 16 calculators, and quiz
 * landings. Google's thin-content guidelines treat scaled, near-identical
 * pages as low-value even when each page is 400+ words.
 *
 * While ADSENSE_REVIEW_MODE is true:
 * - glossary, compare, tags, categories, interview-prep, practice quizzes,
 *   news, newsletter, reading-list, most cheat sheets, and utility tools
 *   are noindexed
 * - they are omitted from sitemap.xml
 * - header / in-article CTAs stop walking reviewers into that inventory
 * - indexable word counts ignore code so a script dump cannot pad a thin page
 *
 * Crawlers and humans always receive the same page. Nothing here branches on
 * user agent or rewrites content for bots; that would be cloaking.
 *
 * Flagship pages stay indexable: articles, about/trust pages, the tools and
 * cheat-sheet hubs, a short allowlist of calculators and reference sheets,
 * and the certification hub.
 *
 * Pages stay live for human visitors. Flip the flag after AdSense approval
 * to reopen those sections for organic search.
 */
/**
 * ADSENSE_REVIEW_MODE = true during AdSense review process.
 * 
 * When TRUE:
 * - Glossary, Compare, Tag, Category, Interview Prep, Practice, 
 *   News, Newsletter, Reading List, most Cheatsheets, most Tools
 *   are NOINDEXED via robots meta + X-Robots-Tag header
 * - Only flagship pages indexed: Articles, About, Contact, Privacy,
 *   Terms, Disclaimer, Editorial Standards, Certification, Advertise,
 *   Contribute, Contributors, Tools Hub, Cheatsheets Hub, 
 *   allowlisted Tools/Cheatsheets
 * 
 * SET TO FALSE ONLY AFTER ADSENSE APPROVAL.
 * Then gradually reopen sections while monitoring.
 */
export const ADSENSE_REVIEW_MODE = true;
/** Bump when held-out paths change so incremental SSG rewrites stale robots meta. */
export const ADSENSE_GATE_VERSION = 4;

export const ADSENSE_REVIEW_CHEATSHEETS = [
  'snowflake-sql',
  'sql-window-functions',
  'dbt-commands',
  'airflow-essentials',
  'snowflake-best-practices',
  'databricks',
  'python-for-data-engineers',
  'data-modeling',
];

export const ADSENSE_REVIEW_TOOLS = [
  'snowflake-cost-calculator',
  'cloud-data-warehouse-cost-comparison',
  'sql-playground',
  'databricks-cost-calculator',
  'bigquery-cost-calculator',
];

const REVIEW_CHEATSHEET_SET = new Set(ADSENSE_REVIEW_CHEATSHEETS);
const REVIEW_TOOL_SET = new Set(ADSENSE_REVIEW_TOOLS);

function normalizePath(pathname) {
  return String(pathname || '')
    .toLowerCase()
    .replace(/\/+$/, '') || '/';
}

export function isReviewAllowlistedTool(slug) {
  return REVIEW_TOOL_SET.has(String(slug || ''));
}

export function isReviewAllowlistedCheatsheet(slug) {
  return REVIEW_CHEATSHEET_SET.has(String(slug || ''));
}

export function isAdSenseNoindexPath(pathname) {
  if (!ADSENSE_REVIEW_MODE) return false;
  const path = normalizePath(pathname);

  if (path === '/glossary' || path.startsWith('/glossary/')) return true;
  if (path === '/compare' || path.startsWith('/compare/')) return true;
  if (path === '/tags' || path === '/tag' || path.startsWith('/tag/')) return true;
  if (path.startsWith('/cheatsheets/category/')) return true;
  if (path === '/category' || path.startsWith('/category/')) return true;
  if (path === '/interview-prep' || path.startsWith('/interview-prep/')) return true;
  if (path === '/practice' || path.startsWith('/practice/')) return true;
  if (path === '/advertise' || path.startsWith('/advertise/')) return true;
  if (path === '/contribute' || path.startsWith('/contribute/')) return true;
  if (path === '/contributors' || path.startsWith('/contributors/')) return true;
  if (path === '/news' || path.startsWith('/news/')) return true;
  if (path === '/newsletter' || path.startsWith('/newsletter/')) return true;
  if (path === '/reading-list') return true;

  if (path.startsWith('/cheatsheets/')) {
    const slug = path.slice('/cheatsheets/'.length);
    return !REVIEW_CHEATSHEET_SET.has(slug);
  }

  if (path.startsWith('/tools/')) {
    const slug = path.slice('/tools/'.length);
    return !REVIEW_TOOL_SET.has(slug);
  }

  return false;
}

export const ADSENSE_REVIEW_ROBOTS = 'noindex, follow';
export const ADSENSE_INDEX_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

export function countIndexableWords(...values) {
  const text = values
    .flat(Infinity)
    .filter((value) => value != null)
    .map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
    .join(' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code\b[\s\S]*?<\/code>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/[#*_`[\]()>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function getCheatsheetIndexableWordCount(sheet) {
  if (!sheet) return 0;
  const parts = [sheet.intro, sheet.shortDescription];

  for (const section of sheet.sections || []) {
    if (section.type === 'table') {
      parts.push(section.columns, section.items);
    } else if (section.type === 'code') {
      parts.push(section.code);
    } else if (Array.isArray(section.items)) {
      for (const item of section.items) {
        if (typeof item === 'string') parts.push(item);
        else parts.push(item?.question, item?.answer, item?.text);
      }
    }
  }

  for (const faq of sheet.faqs || []) {
    parts.push(faq.question, faq.answer);
  }

  return countIndexableWords(parts);
}
