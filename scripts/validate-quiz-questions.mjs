// scripts/validate-quiz-questions.mjs
// Validates question JSON files against the schema. Run before committing.
//
// Usage:
//   node scripts/validate-quiz-questions.mjs               # validates all quizzes
//   node scripts/validate-quiz-questions.mjs snowpro-core  # validates one quiz

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PRACTICE_DIR = path.join(ROOT, 'src', 'data', 'practice');

// Inline validator (duplicated from _schema.js so this runs plain Node with no transpile)
function validateQuestion(q, topics = []) {
  const errors = [];
  if (!q.id || typeof q.id !== 'string') errors.push('Missing/invalid id');
  if (!q.slug || typeof q.slug !== 'string') errors.push('Missing/invalid slug');
  if (!q.topicSlug) errors.push('Missing topicSlug');
  if (topics.length && !topics.find((t) => t.slug === q.topicSlug)) {
    errors.push(`topicSlug "${q.topicSlug}" not in topics.json`);
  }
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
    errors.push('difficulty must be easy|medium|hard');
  }
  if (!['single', 'multi', 'truefalse'].includes(q.type)) {
    errors.push('type must be single|multi|truefalse');
  }
  if (!q.stem || typeof q.stem !== 'string') errors.push('Missing/invalid stem');
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push('options must be an array of at least 2');
  } else {
    q.options.forEach((o, i) => {
      if (!o.id || !o.text) errors.push(`option[${i}] missing id or text`);
    });
  }
  if (!Array.isArray(q.correctIds) || q.correctIds.length === 0) {
    errors.push('correctIds must be a non-empty array');
  } else {
    const optionIds = new Set((q.options || []).map((o) => o.id));
    q.correctIds.forEach((cid) => {
      if (!optionIds.has(cid)) errors.push(`correctId "${cid}" not in options`);
    });
    if (q.type === 'single' && q.correctIds.length !== 1) {
      errors.push('single-type questions must have exactly 1 correctId');
    }
  }
  if (!q.explanation) errors.push('Missing explanation');
  return { valid: errors.length === 0, errors };
}

function validateFile(quizSlug) {
  const dir = path.join(PRACTICE_DIR, quizSlug);
  const metaPath = path.join(dir, 'metadata.json');
  const topicsPath = path.join(dir, 'topics.json');
  const qPath = path.join(dir, 'questions.json');

  if (!fs.existsSync(qPath)) {
    console.error(`  [${quizSlug}] questions.json not found`);
    return false;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
  const questions = JSON.parse(fs.readFileSync(qPath, 'utf8'));

  let ok = true;
  const ids = new Set();
  const slugs = new Set();

  questions.forEach((q, i) => {
    const { valid, errors } = validateQuestion(q, topics);
    if (!valid) {
      console.error(`  [${quizSlug}] Q#${i} (${q.id || 'no-id'}): ${errors.join('; ')}`);
      ok = false;
    }
    if (ids.has(q.id)) {
      console.error(`  [${quizSlug}] Duplicate id: ${q.id}`);
      ok = false;
    }
    if (slugs.has(q.slug)) {
      console.error(`  [${quizSlug}] Duplicate slug: ${q.slug}`);
      ok = false;
    }
    ids.add(q.id);
    slugs.add(q.slug);
  });

  console.log(`  [${quizSlug}] ${ok ? '✅' : '❌'} ${questions.length} questions, ${topics.length} topics, meta "${meta.title}"`);
  return ok;
}

const arg = process.argv[2];
const all = fs
  .readdirSync(PRACTICE_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const targets = arg ? [arg] : all;

console.log(`Validating ${targets.length} quiz${targets.length === 1 ? '' : 'zes'}...\n`);
let allOk = true;
for (const t of targets) {
  if (!validateFile(t)) allOk = false;
}
console.log(`\n${allOk ? '✅ All valid' : '❌ Validation failed'}`);
process.exit(allOk ? 0 : 1);
