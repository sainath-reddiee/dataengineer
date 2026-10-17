// src/lib/practice/mockExam.js
// Timed mock exams over a practice bank. Pure functions (no React), so the
// page, the hook and scripts/verifyMockExam.js share the same rules.
import { sampleDomainWeighted, shuffle } from './sampling.js';

export const QUICK_COUNT = 20;
export const MIN_TIME_SEC = 60;

export const MOCK_LENGTHS = [
  { id: 'quick', label: 'Quick', blurb: `${QUICK_COUNT} questions for a fast check` },
  { id: 'standard', label: 'Standard', blurb: 'Half the real exam' },
  { id: 'full', label: 'Full', blurb: 'Real exam length and time' },
];

/** Seconds allowed for `count` questions at the official exam pace. */
export function paceSeconds(meta, count) {
  const official = meta.totalOfficialQuestions || count || 1;
  return Math.max(MIN_TIME_SEC, Math.round((meta.durationMinutes * 60 * count) / official));
}

/**
 * Question count and time limit for a length. Full is the official length,
 * capped at the bank size, at the official pace per question.
 */
export function getMockPlan(meta, poolSize, lengthId) {
  const official = meta.totalOfficialQuestions || poolSize;
  const wanted = lengthId === 'quick' ? QUICK_COUNT : lengthId === 'standard' ? Math.round(official / 2) : official;
  const count = Math.max(1, Math.min(wanted, poolSize));
  return { count, timeLimitSec: paceSeconds(meta, count) };
}

/**
 * Builds an exam: domain-weighted questions with shuffled options. With
 * `onlyIds` (retake wrong answers) it uses exactly those questions.
 */
export function buildMockExam(quiz, lengthId, { onlyIds } = {}) {
  if (onlyIds?.length) {
    const wanted = new Set(onlyIds);
    const pool = quiz.questions.filter((q) => wanted.has(q.id));
    return {
      questions: shuffle(pool).map((q) => ({ ...q, options: shuffle(q.options) })),
      timeLimitSec: paceSeconds(quiz.meta, pool.length),
    };
  }
  const { count, timeLimitSec } = getMockPlan(quiz.meta, quiz.questions.length, lengthId);
  const picked = sampleDomainWeighted(quiz.questions, quiz.topics, count);
  return { questions: picked.map((q) => ({ ...q, options: shuffle(q.options) })), timeLimitSec };
}

/** Multi-select counts only when exactly the right set is chosen. */
export function isAnswerCorrect(question, selectedIds) {
  const chosen = new Set(selectedIds || []);
  const right = question.correctIds || [];
  return chosen.size === right.length && right.every((id) => chosen.has(id));
}

/**
 * @param {Array} questions                    Questions in the exam.
 * @param {Record<string, string[]>} answers  Selected option ids per question.
 */
export function scoreMock(questions, answers) {
  const byTopic = {};
  let correct = 0;
  for (const q of questions) {
    const ok = isAnswerCorrect(q, answers[q.id]);
    if (ok) correct += 1;
    byTopic[q.topicSlug] ||= { correct: 0, total: 0 };
    byTopic[q.topicSlug].total += 1;
    if (ok) byTopic[q.topicSlug].correct += 1;
  }
  const total = questions.length;
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0, byTopic };
}

/** Restores an exam saved as question ids plus option order. */
export function restoreQuestions(quiz, saved) {
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  return (saved.ids || [])
    .map((id) => {
      const q = byId.get(id);
      if (!q) return null;
      const order = saved.optionOrder?.[id];
      const options = order ? order.map((oid) => q.options.find((o) => o.id === oid)).filter(Boolean) : q.options;
      return { ...q, options: options.length === q.options.length ? options : q.options };
    })
    .filter(Boolean);
}
