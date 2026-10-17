#!/usr/bin/env node
// Interview bank and drill: questions come from published cheat-sheet Q&A or
// approved owner entries, ids are unique and stable, links resolve, the drill
// queue orders reviews correctly, and the pages are wired and held out.
//
//   node scripts/verifyInterviewBank.js                 (part of test:community)
//   node scripts/verifyInterviewBank.js --min-approved=N   owner-written floor
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cheatsheets } from '../src/data/cheatsheetData.js';
import { buildBank, buildDrillQueue, filterBank, questionId, srsStatus, STACKS, validateOwnerQuestions } from '../src/lib/interview/bank.js';
import { loadKnownRoutes, resolveInternalHref } from './lib/knownRoutes.js';
import { buildInterviewPages } from './lib/communityPages.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const owner = JSON.parse(fs.readFileSync(path.join(root, 'src/data/interview/questions.json'), 'utf8'));
let failed = 0;
const check = (ok, msg) => {
  if (!ok) {
    console.error(`❌ ${msg}`);
    failed += 1;
  }
};

for (const problem of validateOwnerQuestions(owner)) check(false, `questions.json: ${problem}`);

const bank = buildBank(cheatsheets, owner);
const ids = bank.map((q) => q.id);
check(bank.length >= 100, `bank has questions (${bank.length})`);
check(new Set(ids).size === ids.length, 'question ids are unique');
check(bank.every((q) => STACKS.some((s) => s.id === q.stack)), 'every question has a known stack');
check(bank.every((q) => q.question && q.answer), 'every question has an answer');
check(!bank.some((q) => owner.questions.some((o) => o.id === q.id && o.status !== 'approved')), 'draft owner questions stay out of the bank');

// Every cheat-sheet question in the bank still exists verbatim in its sheet.
const routes = loadKnownRoutes();
for (const q of bank.filter((x) => x.sheetSlug)) {
  const sheet = cheatsheets.find((s) => s.slug === q.sheetSlug);
  const exists = sheet?.sections?.some((sec) => sec.type === 'qna' && sec.items.some((it) => questionId(sheet.slug, it.question) === q.id));
  check(exists, `${q.id} resolves to a Q&A item in ${q.sheetSlug}`);
  const link = resolveInternalHref(q.source, routes);
  check(link.ok, `${q.id}: source ${q.source} (${link.reason})`);
}

// Filters and drill order.
check(filterBank(bank, { stack: 'sql' }).every((q) => q.stack === 'sql'), 'stack filter');
check(filterBank(bank, { q: 'micro-partition' }).length > 0, 'search finds matching questions');
const now = Date.parse('2026-10-17T12:00:00Z');
const [a, b, c, d] = bank;
const srs = {
  [a.id]: { dueAt: '2026-10-20T00:00:00Z' }, // learning
  [b.id]: { dueAt: '2026-10-15T00:00:00Z' }, // overdue
  [c.id]: { dueAt: '2026-10-16T00:00:00Z' }, // due
};
const queue = buildDrillQueue([a, b, c, d], srs, { now });
check(queue[0] === b && queue[1] === c && queue[2] === d && queue.length === 3, 'drill: most overdue first, then due, then new; learning held back');
check(buildDrillQueue([a, b, c, d], srs, { now, includeLearning: true }).at(-1) === a, 'drill all: learning questions come last');
check(srsStatus(undefined, now) === 'new' && srsStatus(srs[b.id], now) === 'due' && srsStatus(srs[a.id], now) === 'learning', 'review status chips');

// Wiring.
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
check(app.includes("lazy(() => import('./pages/InterviewQuestionBankPage'))") && app.includes("lazy(() => import('./pages/InterviewDrillPage'))"), 'bank and drill routes are lazy-loaded');
check(app.includes('path="interview-prep/questions"') && app.includes('path="interview-prep/drill"'), 'bank and drill routes are registered');
const pages = buildInterviewPages(bank);
check(pages.find((p) => p.path === '/interview-prep/drill')?.noindex === true, 'drill page is permanently noindex');
check(!/<p>[^<]{200,}/.test(pages[0].content.replace(/<p>\d+ questions from[^<]*<\/p>/, '')), 'static bank page lists questions without answers');
check(fs.readFileSync(path.join(root, 'src/pages/InterviewDrillPage.jsx'), 'utf8').includes('noindex={true}'), 'drill page renders noindex');
check(!fs.readFileSync(path.join(root, 'src/hooks/useInterviewDrill.js'), 'utf8').includes('addAttempt('), 'drills never write practice attempts');

const minApproved = Number((process.argv.find((x) => x.startsWith('--min-approved=')) || '').split('=')[1] || 0);
const approvedOwner = owner.questions.filter((q) => q.status === 'approved').length;
check(approvedOwner >= minApproved, `at least ${minApproved} approved owner-written questions (found ${approvedOwner})`);

if (failed) {
  console.error(`\n❌ ${failed} interview bank check(s) failed`);
  process.exit(1);
}
const perStack = STACKS.map((s) => `${s.label} ${bank.filter((q) => q.stack === s.id).length}`).join(', ');
console.log(`✅ Interview bank: ${bank.length} questions (${perStack}), drill order, wiring`);
