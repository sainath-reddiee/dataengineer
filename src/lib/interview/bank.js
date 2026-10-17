// src/lib/interview/bank.js
// Interview question bank built from the Q&A already published in the cheat
// sheets (referenced, never copied), plus owner-written questions from
// src/data/interview/questions.json once they are marked approved.
// Pure functions: the pages, the drill hook and scripts/verifyInterviewBank.js
// all use them.

export const STACKS = [
  { id: 'snowflake', label: 'Snowflake' },
  { id: 'sql', label: 'SQL' },
  { id: 'pipelines', label: 'Pipeline design' },
  { id: 'modeling', label: 'Data modeling' },
  { id: 'spark', label: 'Spark' },
  { id: 'cloud', label: 'Cloud platforms' },
];

const SHEET_STACK = {
  'sql-interview-questions': 'sql',
  'data-engineering-interview-questions': 'pipelines',
  'data-modeling': 'modeling',
  pyspark: 'spark',
  'aws-for-data-engineers': 'cloud',
  'azure-for-data-engineers': 'cloud',
  databricks: 'cloud',
};

export function stackForSheet(slug) {
  if (SHEET_STACK[slug]) return SHEET_STACK[slug];
  return slug.startsWith('snowflake-') ? 'snowflake' : null;
}

const slugify = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Stable id from the sheet and the question text, so reordering keeps progress. */
export function questionId(sheetSlug, question) {
  return `${sheetSlug}--${slugify(question).slice(0, 72)}`;
}

/**
 * @param {Array} cheatsheets             cheatsheetData entries
 * @param {{questions?: Array, exclude?: string[]}} owner  questions.json
 */
export function buildBank(cheatsheets, owner = {}) {
  const exclude = new Set(owner.exclude || []);
  const bank = [];
  for (const sheet of cheatsheets) {
    const stack = stackForSheet(sheet.slug);
    if (!stack) continue;
    for (const section of sheet.sections || []) {
      if (section.type !== 'qna') continue;
      for (const item of section.items || []) {
        if (!item.question || !item.answer) continue;
        const id = questionId(sheet.slug, item.question);
        if (exclude.has(id)) continue;
        bank.push({
          id,
          stack,
          sheetSlug: sheet.slug,
          sheetTitle: sheet.title,
          section: section.title,
          difficulty: sheet.difficulty || 'Intermediate',
          question: item.question,
          answer: item.answer,
          tip: item.tip || null,
          source: `/cheatsheets/${sheet.slug}`,
        });
      }
    }
  }
  for (const q of owner.questions || []) {
    if (q.status !== 'approved' || exclude.has(q.id)) continue;
    bank.push({ ...q, sheetSlug: null, sheetTitle: 'Interview notes', section: q.topic, tip: q.tip || null, source: null });
  }
  return bank;
}

/** Problems with owner-written questions (empty array when valid). */
export function validateOwnerQuestions(owner) {
  const problems = [];
  const stacks = new Set(STACKS.map((s) => s.id));
  const ids = new Set();
  for (const q of owner.questions || []) {
    if (!q.id || ids.has(q.id)) problems.push(`duplicate or missing id: ${q.id}`);
    ids.add(q.id);
    if (!stacks.has(q.stack)) problems.push(`${q.id}: unknown stack ${q.stack}`);
    if (!['draft', 'approved'].includes(q.status)) problems.push(`${q.id}: status must be draft or approved`);
    if (!q.question || !q.answer) problems.push(`${q.id}: needs question and answer`);
    if (!['Intermediate', 'Advanced', 'Beginner'].includes(q.difficulty)) problems.push(`${q.id}: unknown difficulty ${q.difficulty}`);
  }
  return problems;
}

/** @param {{stack?: string, sheet?: string, level?: string, q?: string}} f */
export function filterBank(bank, f = {}) {
  const needle = (f.q || '').trim().toLowerCase();
  return bank.filter((item) =>
    (!f.stack || item.stack === f.stack)
    && (!f.sheet || item.sheetSlug === f.sheet)
    && (!f.level || item.difficulty === f.level)
    && (!needle || item.question.toLowerCase().includes(needle) || item.answer.toLowerCase().includes(needle)));
}

/** 'new' (never rated), 'due' (review date reached) or 'learning'. */
export function srsStatus(state, now = Date.now()) {
  if (!state?.dueAt) return 'new';
  return Date.parse(state.dueAt) <= now ? 'due' : 'learning';
}

/**
 * Drill order: due reviews first (most overdue first), then questions never
 * seen, then (only when `includeLearning`) the rest by due date.
 */
export function buildDrillQueue(items, srs = {}, { now = Date.now(), includeLearning = false } = {}) {
  const due = [];
  const fresh = [];
  const learning = [];
  for (const item of items) {
    const status = srsStatus(srs[item.id], now);
    if (status === 'due') due.push(item);
    else if (status === 'new') fresh.push(item);
    else learning.push(item);
  }
  const byDue = (a, b) => Date.parse(srs[a.id].dueAt) - Date.parse(srs[b.id].dueAt);
  return [...due.sort(byDue), ...fresh, ...(includeLearning ? learning.sort(byDue) : [])];
}

/** Self-rating to SM-2 grade. */
export const RATINGS = [
  { id: 'knew', key: '1', label: 'Knew it', grade: 4 },
  { id: 'partial', key: '2', label: 'Partly', grade: 3 },
  { id: 'missed', key: '3', label: 'Missed it', grade: 1 },
];
