// scripts/review-generated.mjs
// Interactive review CLI for AI-generated questions.
//
// Reads   src/data/practice/<quiz-slug>/questions.generated.json
// Writes  src/data/practice/<quiz-slug>/questions.json (approved, reviewedAt set)
//         src/data/practice/<quiz-slug>/questions.generated.json (remaining queue)
//         src/data/practice/<quiz-slug>/questions.rejected.json (history of rejects)
//
// Usage:
//   node scripts/review-generated.mjs <quiz-slug>
//   node scripts/review-generated.mjs <quiz-slug> --auto-approve   # approves ALL (use with care)
//
// Per item, commands are:
//   a  approve (sets reviewedAt = today, appends to questions.json)
//   r  reject (moves item to questions.rejected.json with a reason prompt)
//   e  edit   (opens the item in $EDITOR; defaults: code -w, notepad on Windows, vi elsewhere)
//   s  skip   (leaves item in the generated file for a later review)
//   q  quit   (save progress and exit)

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/review-generated.mjs <quiz-slug> [--auto-approve]');
  process.exit(1);
}
const quizSlug = args[0];
const autoApprove = args.includes('--auto-approve');

const quizDir = path.join(ROOT, 'src', 'data', 'practice', quizSlug);
const qPath = path.join(quizDir, 'questions.json');
const genPath = path.join(quizDir, 'questions.generated.json');
const rejPath = path.join(quizDir, 'questions.rejected.json');
const topicsPath = path.join(quizDir, 'topics.json');

if (!fs.existsSync(quizDir)) {
  console.error(`Quiz folder not found: ${quizDir}`);
  process.exit(1);
}
if (!fs.existsSync(genPath)) {
  console.log(`Nothing to review: ${path.relative(ROOT, genPath)} not found.`);
  process.exit(0);
}

const questions = JSON.parse(fs.readFileSync(qPath, 'utf8'));
const generated = JSON.parse(fs.readFileSync(genPath, 'utf8'));
const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
const rejected = fs.existsSync(rejPath) ? JSON.parse(fs.readFileSync(rejPath, 'utf8')) : [];

if (generated.length === 0) {
  console.log('Generated queue is empty.');
  process.exit(0);
}

const topicSlugSet = new Set(topics.map((t) => t.slug));

function validateQuestion(q) {
  const errs = [];
  if (!q.id) errs.push('missing id');
  if (!q.slug) errs.push('missing slug');
  if (!topicSlugSet.has(q.topicSlug)) errs.push(`topicSlug "${q.topicSlug}" not in topics.json`);
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) errs.push('bad difficulty');
  if (!['single', 'multi', 'truefalse'].includes(q.type)) errs.push('bad type');
  if (!Array.isArray(q.options) || q.options.length < 2) errs.push('bad options');
  const optIds = new Set((q.options || []).map((o) => o.id));
  for (const cid of q.correctIds || []) if (!optIds.has(cid)) errs.push(`bad correctId ${cid}`);
  if (!q.explanation) errs.push('missing explanation');
  return errs;
}

function render(q, idx, total) {
  const bar = '='.repeat(72);
  const lines = [];
  lines.push('\n' + bar);
  lines.push(`Question ${idx + 1} of ${total}   id=${q.id}  source=${q.source}  difficulty=${q.difficulty}  type=${q.type}`);
  lines.push(`slug: ${q.slug}   topic: ${q.topicSlug}`);
  lines.push(bar);
  lines.push('\nSTEM:\n  ' + (q.stem || '').replace(/\n/g, '\n  '));
  lines.push('\nOPTIONS:');
  for (const o of q.options || []) {
    const mark = (q.correctIds || []).includes(o.id) ? '[x]' : '[ ]';
    lines.push(`  ${mark} ${o.id}) ${o.text}`);
  }
  lines.push('\nEXPLANATION:');
  lines.push('  ' + (q.explanation || '').split('\n').join('\n  '));
  lines.push('\nREFERENCES:');
  for (const r of q.references || []) lines.push('  - ' + r);
  if (q.tags?.length) lines.push('\nTAGS: ' + q.tags.join(', '));
  const errs = validateQuestion(q);
  if (errs.length) lines.push('\n⚠  VALIDATION ISSUES:\n  - ' + errs.join('\n  - '));
  lines.push(bar);
  return lines.join('\n');
}

function openInEditor(obj) {
  const tmp = path.join(os.tmpdir(), `qreview-${obj.id}-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  const parts = editor.split(/\s+/);
  const res = spawnSync(parts[0], [...parts.slice(1), tmp], { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`Editor "${editor}" exited ${res.status}.`);
    return null;
  }
  try {
    const edited = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    fs.unlinkSync(tmp);
    return edited;
  } catch (e) {
    console.error(`Could not parse edited JSON: ${e.message}. Keeping original.`);
    return null;
  }
}

function saveState(remaining) {
  if (remaining.length) {
    fs.writeFileSync(genPath, JSON.stringify(remaining, null, 2) + '\n');
  } else if (fs.existsSync(genPath)) {
    fs.unlinkSync(genPath);
  }
  fs.writeFileSync(qPath, JSON.stringify(questions, null, 2) + '\n');
  if (rejected.length) fs.writeFileSync(rejPath, JSON.stringify(rejected, null, 2) + '\n');
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (prompt) => new Promise((resolve) => rl.question(prompt, (a) => resolve(a)));

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const remaining = [...generated];
  let approvedCount = 0;
  let rejectedCount = 0;

  console.log(`Reviewing ${remaining.length} generated question(s) for ${quizSlug}.`);
  if (autoApprove) console.log('  --auto-approve: all items will be approved without prompting.');

  while (remaining.length) {
    const q = remaining[0];
    if (autoApprove) {
      const errs = validateQuestion(q);
      if (errs.length) {
        console.warn(`Skipping ${q.id} (auto-approve): ${errs.join('; ')}`);
        remaining.shift();
        continue;
      }
      q.reviewedAt = today;
      questions.push(q);
      remaining.shift();
      approvedCount += 1;
      continue;
    }

    console.log(render(q, generated.length - remaining.length, generated.length));
    const ans = (await ask('\n[a]pprove  [r]eject  [e]dit  [s]kip  [q]uit > ')).trim().toLowerCase();

    if (ans === 'a' || ans === 'approve') {
      const errs = validateQuestion(q);
      if (errs.length) {
        console.warn(`Cannot approve — validation errors:\n  - ${errs.join('\n  - ')}`);
        const force = (await ask('Approve anyway? [y/N] ')).trim().toLowerCase();
        if (force !== 'y') continue;
      }
      q.reviewedAt = today;
      questions.push(q);
      remaining.shift();
      approvedCount += 1;
      console.log(`✓ approved ${q.id}`);
    } else if (ans === 'r' || ans === 'reject') {
      const reason = (await ask('Reject reason (optional): ')).trim();
      rejected.push({ ...q, rejectedAt: today, rejectReason: reason || null });
      remaining.shift();
      rejectedCount += 1;
      console.log(`✗ rejected ${q.id}`);
    } else if (ans === 'e' || ans === 'edit') {
      const edited = openInEditor(q);
      if (edited) {
        remaining[0] = edited;
        console.log('(edited — re-rendering)');
      }
    } else if (ans === 's' || ans === 'skip') {
      const head = remaining.shift();
      remaining.push(head);
      console.log(`- skipped ${q.id} (moved to end of queue)`);
    } else if (ans === 'q' || ans === 'quit') {
      break;
    } else {
      console.log('Unknown command. Use a | r | e | s | q.');
    }
  }

  rl.close();
  saveState(remaining);
  console.log(`\nDone. approved=${approvedCount}  rejected=${rejectedCount}  remaining=${remaining.length}`);
  console.log(`Run: node scripts/validate-quiz-questions.mjs ${quizSlug}`);
})();
