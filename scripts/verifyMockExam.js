#!/usr/bin/env node
// Timed mock exams: lengths, timing, sampling, scoring and wiring, for every
// practice bank. Offline and fast; part of `npm run test:community`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMockExam, getMockPlan, isAnswerCorrect, MOCK_LENGTHS, restoreQuestions, scoreMock } from '../src/lib/practice/mockExam.js';
import { buildMockExamPages } from './lib/communityPages.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(root, ...p), 'utf8'));
let failed = 0;
const check = (ok, msg) => {
  if (!ok) {
    console.error(`❌ ${msg}`);
    failed += 1;
  }
};

const slugs = fs.readdirSync(path.join(root, 'src/data/practice'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const slug of slugs) {
  const quiz = {
    meta: readJson('src/data/practice', slug, 'metadata.json'),
    topics: readJson('src/data/practice', slug, 'topics.json'),
    questions: readJson('src/data/practice', slug, 'questions.json'),
  };
  const pool = quiz.questions.length;
  check(quiz.meta.durationMinutes > 0 && quiz.meta.totalOfficialQuestions > 0, `${slug}: metadata has duration and official question count`);

  for (const len of MOCK_LENGTHS) {
    const plan = getMockPlan(quiz.meta, pool, len.id);
    check(plan.count >= 1 && plan.count <= pool, `${slug} ${len.id}: ${plan.count} questions fits the ${pool}-question bank`);
    check(plan.timeLimitSec >= 60, `${slug} ${len.id}: time limit is at least a minute`);

    for (let run = 0; run < 5; run += 1) {
      const exam = buildMockExam(quiz, len.id);
      const ids = exam.questions.map((q) => q.id);
      check(ids.length === plan.count, `${slug} ${len.id}: built ${ids.length}, expected ${plan.count}`);
      check(new Set(ids).size === ids.length, `${slug} ${len.id}: no repeated questions`);
      for (const q of exam.questions) {
        const original = quiz.questions.find((x) => x.id === q.id);
        const same = original.options.length === q.options.length && original.options.every((o) => q.options.some((x) => x.id === o.id));
        check(same, `${slug}: options of ${q.id} survive shuffling`);
      }
      if (len.id !== 'quick') {
        for (const t of quiz.topics.filter((t) => t.weight > 0 && quiz.questions.some((q) => q.topicSlug === t.slug))) {
          check(exam.questions.some((q) => q.topicSlug === t.slug), `${slug} ${len.id}: domain "${t.slug}" is represented`);
        }
      }
    }
  }

  const wrong = quiz.questions.slice(0, 3).map((q) => q.id);
  const retake = buildMockExam(quiz, 'retake', { onlyIds: wrong });
  check(retake.questions.length === 3 && retake.questions.every((q) => wrong.includes(q.id)), `${slug}: retake uses exactly the wrong answers`);

  const exam = buildMockExam(quiz, 'quick');
  const saved = { ids: exam.questions.map((q) => q.id), optionOrder: Object.fromEntries(exam.questions.map((q) => [q.id, q.options.map((o) => o.id)])) };
  const restored = restoreQuestions(quiz, saved);
  check(
    restored.length === exam.questions.length && restored.every((q, i) => q.options.map((o) => o.id).join() === saved.optionOrder[saved.ids[i]].join()),
    `${slug}: a saved exam restores with the same questions and option order`,
  );
}

// Scoring rules shared with the page.
const multi = { id: 'm', topicSlug: 't', correctIds: ['a', 'c'] };
check(isAnswerCorrect(multi, ['c', 'a']), 'multi-select: exact set in any order is correct');
check(!isAnswerCorrect(multi, ['a']), 'multi-select: a partial answer is wrong');
check(!isAnswerCorrect(multi, ['a', 'b', 'c']), 'multi-select: an extra option is wrong');
check(!isAnswerCorrect(multi, undefined), 'unanswered is wrong');
const score = scoreMock([multi, { id: 's', topicSlug: 'u', correctIds: ['b'] }], { m: ['a', 'c'], s: ['a'] });
check(score.correct === 1 && score.percent === 50 && score.byTopic.t.correct === 1 && score.byTopic.u.total === 1, 'score and per-domain breakdown');

// Wiring: route, static HTML (noindex), links from the practice pages.
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
check(app.includes('path="practice/:slug/mock-exam"') && app.includes("lazy(() => import('./pages/PracticeMockExamPage'))"), 'mock exam route is lazy-loaded');
const pages = buildMockExamPages();
check(pages.length === slugs.length && pages.every((p) => p.noindex === true), 'every bank has a noindexed static mock exam page');
check(fs.readFileSync(path.join(root, 'src/pages/PracticeMockExamPage.jsx'), 'utf8').includes('noindex={true}'), 'mock exam page renders noindex');
check(fs.readFileSync(path.join(root, 'src/pages/PracticeHubPage.jsx'), 'utf8').includes('/mock-exam'), '/practice links the mock exams');

if (failed) {
  console.error(`\n❌ ${failed} mock exam check(s) failed`);
  process.exit(1);
}
console.log(`✅ Mock exams: ${slugs.length} banks, 3 lengths each, sampling, timing, scoring, resume and wiring`);
