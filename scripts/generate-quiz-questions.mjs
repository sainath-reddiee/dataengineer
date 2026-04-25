// scripts/generate-quiz-questions.mjs
// AI-powered question generator for the practice quiz platform.
//
// Usage:
//   node scripts/generate-quiz-questions.mjs <quiz-slug> [options]
//
// Options:
//   --count N                   Number of questions to generate (default 10).
//   --topic <slug>              Restrict generation to a single topic.
//   --difficulty easy|medium|hard   Force a difficulty level.
//   --style-guide               Inject the authoring guide from _schema.js into
//                               the system prompt (strongly recommended).
//   --ground-from-articles <glob>   Glob (relative to repo root) of markdown
//                               files to extract as grounding excerpts, e.g.
//                               "src/content/posts/snowflake-*.md". Up to
//                               --ground-max (default 6) files, --ground-chars
//                               (default 2000) chars each.
//   --ground-max N              Max grounding files to include (default 6).
//   --ground-chars N            Max chars per grounding file (default 2000).
//   --max-retries N             Validator retry loop limit (default 2).
//   --provider groq|gemini      Force a specific provider (default: groq->gemini fallback).
//
// Examples:
//   node scripts/generate-quiz-questions.mjs snowpro-core --count 20 --style-guide
//   node scripts/generate-quiz-questions.mjs aws-de-associate --topic security-governance \
//       --count 5 --style-guide --ground-from-articles "src/content/posts/aws-*.md"
//
// Providers (fallback order): Groq (llama-3.3-70b) -> Gemini 2.0 Flash.
// Env vars: GROQ_API_KEY (required for groq), GEMINI_API_KEY (optional fallback).
//
// Output: writes to src/data/practice/<slug>/questions.generated.json with
// source="ai-groq"|"ai-gemini" and reviewedAt=null. A human must set
// reviewedAt to an ISO date before merging into questions.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ---------- CLI parsing ----------
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/generate-quiz-questions.mjs <quiz-slug> [--count N] [--topic slug] [--difficulty ...] [--style-guide] [--ground-from-articles <glob>]');
  process.exit(1);
}
const quizSlug = args[0];
const hasFlag = (flag) => args.includes(flag);
const getArg = (flag, fallback = null) => {
  const idx = args.indexOf(flag);
  return idx > -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const count = parseInt(getArg('--count', '10'), 10);
const onlyTopic = getArg('--topic', null);
const onlyDifficulty = getArg('--difficulty', null);
const injectStyleGuide = hasFlag('--style-guide');
const groundGlob = getArg('--ground-from-articles', null);
const groundMax = parseInt(getArg('--ground-max', '6'), 10);
const groundChars = parseInt(getArg('--ground-chars', '2000'), 10);
const maxRetries = parseInt(getArg('--max-retries', '2'), 10);
const forcedProvider = getArg('--provider', null);

// ---------- Load quiz artifacts ----------
const quizDir = path.join(ROOT, 'src', 'data', 'practice', quizSlug);
if (!fs.existsSync(quizDir)) {
  console.error(`Quiz folder not found: ${quizDir}`);
  process.exit(1);
}
const metadata = JSON.parse(fs.readFileSync(path.join(quizDir, 'metadata.json'), 'utf8'));
const topics = JSON.parse(fs.readFileSync(path.join(quizDir, 'topics.json'), 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(quizDir, 'questions.json'), 'utf8'));

const existingSlugs = new Set(existing.map((q) => q.slug));
const existingIds = new Set(existing.map((q) => q.id));
const existingStems = new Set(existing.map((q) => (q.stem || '').trim().toLowerCase()));

const filteredTopics = onlyTopic ? topics.filter((t) => t.slug === onlyTopic) : topics;
if (filteredTopics.length === 0) {
  console.error(`Topic "${onlyTopic}" not found.`);
  process.exit(1);
}
const topicSlugSet = new Set(topics.map((t) => t.slug));

// ---------- ID minting ----------
const idPrefix =
  quizSlug === 'snowpro-core' ? 'spc'
  : quizSlug === 'snowpro-genai' ? 'spg'
  : quizSlug === 'databricks-de' ? 'dbd'
  : quizSlug === 'aws-de-associate' ? 'aws-de'
  : quizSlug.slice(0, 3);
let nextIdNum = existing.length;
const takenIds = new Set(existingIds);
function nextId() {
  do {
    nextIdNum += 1;
  } while (takenIds.has(`${idPrefix}-${String(nextIdNum).padStart(3, '0')}`));
  const id = `${idPrefix}-${String(nextIdNum).padStart(3, '0')}`;
  takenIds.add(id);
  return id;
}

// ---------- Style guide extraction (from _schema.js) ----------
function extractStyleGuide() {
  const schemaPath = path.join(ROOT, 'src', 'data', 'practice', '_schema.js');
  if (!fs.existsSync(schemaPath)) return '';
  const src = fs.readFileSync(schemaPath, 'utf8');
  const start = src.indexOf('AUTHORING STYLE GUIDE');
  if (start === -1) return '';
  // Find the containing /** ... */ block.
  const blockStart = src.lastIndexOf('/**', start);
  const blockEnd = src.indexOf('*/', start);
  if (blockStart === -1 || blockEnd === -1) return '';
  return src
    .slice(blockStart, blockEnd + 2)
    .replace(/^\s*\*\/?/gm, '')
    .replace(/^\s*\/\*\*\s*/, '')
    .trim();
}

// ---------- Grounding: read matching articles ----------
function resolveGroundingFiles(globPattern) {
  if (!globPattern) return [];
  // Simple glob: only support "dir/prefix-*.ext" or "dir/**/*.ext" patterns.
  const { dir, re } = globToRegex(globPattern);
  const absDir = path.resolve(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (re.test(path.relative(ROOT, full).replace(/\\/g, '/'))) results.push(full);
    }
  }
  walk(absDir);
  return results.slice(0, groundMax);
}
function globToRegex(g) {
  const norm = g.replace(/\\/g, '/');
  const firstStar = norm.indexOf('*');
  const dir = firstStar === -1 ? path.dirname(norm) : norm.slice(0, norm.lastIndexOf('/', firstStar));
  const escaped = norm
    .split('')
    .map((c) => {
      if (c === '*') return '[^/]*';
      if (/[.+^${}()|[\]\\]/.test(c)) return '\\' + c;
      return c;
    })
    .join('')
    .replace(/\[\^\/\]\*\[\^\/\]\*/g, '.*'); // ** -> .*
  return { dir, re: new RegExp('^' + escaped + '$') };
}
function readGroundingExcerpts() {
  const files = resolveGroundingFiles(groundGlob);
  if (!files.length) return { excerpts: [], files: [] };
  const excerpts = files.map((f) => {
    const raw = fs.readFileSync(f, 'utf8');
    // Strip frontmatter if present.
    const body = raw.replace(/^---[\s\S]*?---\s*/, '');
    const clipped = body.slice(0, groundChars);
    return `--- ${path.relative(ROOT, f).replace(/\\/g, '/')} ---\n${clipped}`;
  });
  return { excerpts, files };
}

// ---------- Prompt construction ----------
const topicsForPrompt = filteredTopics
  .map((t) => `- ${t.slug}: ${t.name}${t.description ? ' - ' + t.description : ''}`)
  .join('\n');

const difficultyClause = onlyDifficulty
  ? `All questions MUST have difficulty="${onlyDifficulty}".`
  : 'Distribute difficulty: ~40% medium, ~30% easy, ~30% hard.';

const styleGuideText = injectStyleGuide ? extractStyleGuide() : '';
const { excerpts: groundingExcerpts, files: groundingFiles } = readGroundingExcerpts();

function buildSystemPrompt(retryErrors) {
  const parts = [];
  parts.push(`You are an expert certification exam writer for the ${metadata.title} (${metadata.examCode}).
Generate scenario-based, technically accurate multiple-choice practice questions that mirror the rigor of the real exam.`);

  if (styleGuideText) {
    parts.push(`AUTHORING STYLE GUIDE (follow strictly):\n${styleGuideText}`);
  } else {
    parts.push(`Rules:
- Scenario-framed stems ("A pipeline does X with constraints Y - what is the best fix?"), not trivia.
- Plausible distractors (no "all of the above", no obviously absurd options).
- Explanation 200-350 words with **why right** + one **X wrong**: paragraph per incorrect option.
- Exactly one correct answer for "single"; 2-4 for "multi".
- 1-3 official doc URLs in "references".
- Do NOT duplicate any existing question.`);
  }

  parts.push(`Topics (use the slug as topicSlug):
${topicsForPrompt}

${difficultyClause}`);

  if (groundingExcerpts.length) {
    parts.push(`GROUNDING SOURCES (use these as factual anchors; do not invent facts beyond them or official docs):
${groundingExcerpts.join('\n\n')}`);
  }

  parts.push(`Forbidden:
- Verbatim/near-verbatim copies from commercial question banks.
- Private beta / NDA content.
- "All of the above" / "None of the above".

Existing slugs to avoid: ${[...existingSlugs].slice(0, 80).join(', ')}${existingSlugs.size > 80 ? ', ...' : ''}.`);

  parts.push(`Output ONLY valid JSON - an object {"questions": [...]} where each item matches this schema exactly (no markdown fencing, no commentary):
{
  "slug": "kebab-case-descriptive-slug",
  "topicSlug": "<one of the topic slugs above>",
  "difficulty": "easy" | "medium" | "hard",
  "type": "single" | "multi",
  "stem": "Scenario-framed question text.",
  "options": [
    { "id": "a", "text": "..." },
    { "id": "b", "text": "..." },
    { "id": "c", "text": "..." },
    { "id": "d", "text": "..." }
  ],
  "correctIds": ["a"],
  "explanation": "**why right**: ...\\n\\n**b wrong**: ...\\n\\n**c wrong**: ...\\n\\n**d wrong**: ...",
  "references": ["https://docs..."],
  "tags": ["tag1", "tag2"]
}`);

  if (retryErrors && retryErrors.length) {
    parts.push(`PREVIOUS ATTEMPT FAILED VALIDATION. Fix these problems and regenerate the full batch:
${retryErrors.slice(0, 20).map((e, i) => `${i + 1}. ${e}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

const userPrompt = `Generate ${count} new practice questions for ${metadata.title}. Ensure technical accuracy, scenario framing, per-distractor rationales, and no duplication with existing content.`;

// ---------- Provider calls ----------
async function callGroq(systemPrompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { raw: content, provider: 'ai-groq' };
}

async function callGemini(systemPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { raw: text, provider: 'ai-gemini' };
}

async function callProvider(systemPrompt) {
  if (forcedProvider === 'groq') return callGroq(systemPrompt);
  if (forcedProvider === 'gemini') return callGemini(systemPrompt);
  try {
    console.log('-> Trying Groq...');
    return await callGroq(systemPrompt);
  } catch (err) {
    console.warn(`Groq failed: ${err.message}`);
    console.log('-> Falling back to Gemini...');
    return await callGemini(systemPrompt);
  }
}

// ---------- JSON guardrail parsing ----------
function parseQuestionsFromRaw(raw) {
  let text = (raw || '').trim();
  // Strip accidental markdown fencing.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Last-ditch: find the first { or [ and try again.
    const firstBracket = text.search(/[\[{]/);
    if (firstBracket > 0) parsed = JSON.parse(text.slice(firstBracket));
    else throw new Error(`Model did not return valid JSON: ${e.message}`);
  }
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  throw new Error('Response not in expected shape {"questions": [...]} or [...]');
}

// ---------- Inline per-question validator (mirrors validate-quiz-questions.mjs) ----------
function validateGenerated(q) {
  const errs = [];
  if (!q.slug || typeof q.slug !== 'string') errs.push('missing/invalid slug');
  else if (existingSlugs.has(q.slug)) errs.push(`duplicate slug "${q.slug}"`);
  if (!q.topicSlug) errs.push('missing topicSlug');
  else if (!topicSlugSet.has(q.topicSlug)) errs.push(`topicSlug "${q.topicSlug}" not in topics.json`);
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) errs.push('difficulty must be easy|medium|hard');
  if (!['single', 'multi', 'truefalse'].includes(q.type)) errs.push('type must be single|multi|truefalse');
  if (!q.stem || typeof q.stem !== 'string') errs.push('missing stem');
  else if (existingStems.has(q.stem.trim().toLowerCase())) errs.push('stem duplicates an existing question');
  if (!Array.isArray(q.options) || q.options.length < 2) errs.push('options must have >=2 entries');
  else {
    q.options.forEach((o, i) => {
      if (!o.id || !o.text) errs.push(`option[${i}] missing id/text`);
    });
  }
  if (!Array.isArray(q.correctIds) || q.correctIds.length === 0) errs.push('correctIds must be non-empty array');
  else {
    const optIds = new Set((q.options || []).map((o) => o.id));
    q.correctIds.forEach((cid) => { if (!optIds.has(cid)) errs.push(`correctId "${cid}" not in options`); });
    if (q.type === 'single' && q.correctIds.length !== 1) errs.push('single-type must have exactly 1 correctId');
    if (q.type === 'multi' && q.correctIds.length < 2) errs.push('multi-type must have >=2 correctIds');
  }
  if (!q.explanation || typeof q.explanation !== 'string') errs.push('missing explanation');
  else {
    const words = q.explanation.split(/\s+/).filter(Boolean).length;
    if (words < 100) errs.push(`explanation too short (${words} words, need >=100)`);
    const wrongs = (q.options || []).filter((o) => !q.correctIds?.includes(o.id));
    for (const w of wrongs) {
      const re = new RegExp(`\\*\\*${w.id}\\s+wrong\\*\\*`, 'i');
      if (!re.test(q.explanation)) errs.push(`explanation missing "**${w.id} wrong**:" rationale`);
    }
  }
  if (!Array.isArray(q.references) || q.references.length === 0) errs.push('references must be non-empty array');
  return errs;
}

// ---------- Main ----------
(async () => {
  console.log(`Generating ${count} questions for "${metadata.title}"...`);
  if (injectStyleGuide) console.log('  -> injecting _schema.js style guide');
  if (groundingFiles.length) console.log(`  -> grounding from ${groundingFiles.length} file(s)`);

  let retryErrors = [];
  let generated = [];
  let provider = 'ai-groq';
  let success = false;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) console.log(`\n-> Retry ${attempt}/${maxRetries} with ${retryErrors.length} validation error(s) fed back...`);
    const systemPrompt = buildSystemPrompt(retryErrors);
    let raw;
    try {
      const out = await callProvider(systemPrompt);
      raw = out.raw;
      provider = out.provider;
    } catch (e) {
      console.error(`Provider failure: ${e.message}`);
      process.exit(1);
    }

    let batch;
    try {
      batch = parseQuestionsFromRaw(raw);
    } catch (e) {
      retryErrors = [`JSON parse failure: ${e.message}. Output must be {"questions": [...]} with no prose.`];
      continue;
    }

    // Validate each question and split into accepted / rejected.
    const accepted = [];
    const rejected = [];
    for (const q of batch) {
      const errs = validateGenerated(q);
      if (errs.length === 0) accepted.push(q);
      else rejected.push({ slug: q.slug || '(no-slug)', errs });
    }

    generated = accepted;
    retryErrors = rejected.flatMap((r) => r.errs.map((e) => `[${r.slug}] ${e}`));

    if (accepted.length >= count || retryErrors.length === 0) {
      success = true;
      break;
    }
    console.warn(`  attempt ${attempt + 1}: ${accepted.length}/${batch.length} passed validation`);
  }

  if (generated.length === 0) {
    console.error('\n❌ No valid questions after retries. Last errors:');
    for (const e of retryErrors.slice(0, 10)) console.error('  - ' + e);
    process.exit(1);
  }

  // Enrich with id + provenance and write to review file.
  const now = new Date().toISOString();
  const fresh = generated.map((q) => ({
    id: nextId(),
    slug: q.slug,
    topicSlug: q.topicSlug,
    difficulty: q.difficulty,
    type: q.type || 'single',
    stem: q.stem,
    options: q.options,
    correctIds: q.correctIds,
    explanation: q.explanation,
    references: q.references || [],
    tags: Array.isArray(q.tags) ? q.tags.slice(0, 5) : [],
    source: provider,
    generatedAt: now,
    reviewedAt: null,
  }));
  for (const q of fresh) existingSlugs.add(q.slug);

  const outPath = path.join(quizDir, 'questions.generated.json');
  const prior = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : [];
  const combined = [...prior, ...fresh];
  fs.writeFileSync(outPath, `${JSON.stringify(combined, null, 2)}\n`);

  console.log(`\n✅ ${fresh.length} questions written to ${path.relative(ROOT, outPath)} (source=${provider})`);
  if (!success && retryErrors.length) {
    console.log(`   (${retryErrors.length} question(s) dropped for validation errors across ${maxRetries + 1} attempts)`);
  }
  console.log('\nNext steps:');
  console.log('  1. node scripts/review-generated.mjs ' + quizSlug + '   # interactive approve/reject');
  console.log('  2. node scripts/validate-quiz-questions.mjs ' + quizSlug);
  console.log('  3. Merge approved items (with reviewedAt set) into questions.json.');
})();
