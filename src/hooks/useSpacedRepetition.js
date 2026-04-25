// src/hooks/useSpacedRepetition.js
// SuperMemo-2 (SM-2) spaced repetition for practice questions.
//
// State shape per question: { ease, interval, reps, dueAt, lastReviewedAt }
//   ease       default 2.5, minimum 1.3
//   interval   days until next review
//   reps       consecutive successful reviews (resets to 0 on lapse)
//   dueAt      ISO string; when <= today, the question is due
//
// Grading (user rates recall):
//   0 - blackout     -> reset reps, interval=1, ease -= 0.2
//   3 - hard         -> reps++, interval=prev*ease*0.8,  ease unchanged
//   4 - good         -> reps++, interval=prev*ease,      ease unchanged
//   5 - easy         -> reps++, interval=prev*ease*1.3,  ease += 0.15
// (reps == 1: interval=1; reps == 2: interval=6; else multiplicative.)
//
// Persistence: delegated to useQuizStore (getSRS / setQuestionSRS).

import { useCallback, useMemo } from 'react';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_STATE = { ease: 2.5, interval: 0, reps: 0, dueAt: null, lastReviewedAt: null };

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDaysISO(days) {
  return new Date(today().getTime() + days * MS_PER_DAY).toISOString();
}

/**
 * Pure SM-2 step. Returns the new state without mutating input.
 */
export function stepSM2(prev, grade) {
  const state = { ...DEFAULT_STATE, ...(prev || {}) };
  const g = Math.max(0, Math.min(5, Math.round(grade)));
  if (g < 3) {
    state.reps = 0;
    state.interval = 1;
    state.ease = Math.max(1.3, (state.ease || 2.5) - 0.2);
  } else {
    state.reps = (state.reps || 0) + 1;
    if (state.reps === 1) state.interval = 1;
    else if (state.reps === 2) state.interval = 6;
    else {
      const mult = g === 3 ? state.ease * 0.8 : g === 5 ? state.ease * 1.3 : state.ease;
      state.interval = Math.max(1, Math.round(state.interval * mult));
    }
    if (g === 5) state.ease = (state.ease || 2.5) + 0.15;
  }
  state.lastReviewedAt = new Date().toISOString();
  state.dueAt = addDaysISO(state.interval);
  return state;
}

/**
 * @param {Object} cfg
 * @param {string} cfg.quizSlug
 * @param {Array}  cfg.questions     Full question pool (for filtering dues).
 * @param {Function} cfg.getSRS           store.getSRS binding.
 * @param {Function} cfg.setQuestionSRS   store.setQuestionSRS binding.
 * @param {number} [cfg.storeVersion]     store.storeVersion; include so memos
 *                                        re-run when SRS state is written.
 */
export function useSpacedRepetition({ quizSlug, questions, getSRS, setQuestionSRS, storeVersion = 0 }) {
  const state = useMemo(
    () => getSRS(quizSlug) || {},
    // storeVersion bumps on setQuestionSRS so the memo refreshes after grading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quizSlug, getSRS, storeVersion],
  );

  /** Questions whose dueAt <= now. Items never graded are NOT surfaced here. */
  const dueToday = useMemo(() => {
    const now = Date.now();
    const out = [];
    for (const q of questions || []) {
      const s = state[q.id];
      if (!s || !s.dueAt) continue; // only surface items the user has graded at least once
      if (new Date(s.dueAt).getTime() <= now) out.push(q);
    }
    return out;
  }, [questions, state]);

  /** Count of items seen + count of items due. Handy for hub UI. */
  const stats = useMemo(() => {
    const tracked = Object.keys(state).length;
    return { tracked, dueCount: dueToday.length };
  }, [state, dueToday]);

  /**
   * Grade a question's recall and persist updated SM-2 state.
   * @param {string} questionId
   * @param {number} grade  0..5 (see header comment)
   */
  const gradeQuestion = useCallback(
    (questionId, grade) => {
      const prev = state[questionId];
      const next = stepSM2(prev, grade);
      setQuestionSRS(quizSlug, questionId, next);
      return next;
    },
    [quizSlug, state, setQuestionSRS],
  );

  /**
   * Convenience: after a normal quiz submit, map correct/incorrect to SM-2
   * grades. correct+fast = 5, correct = 4, incorrect = 2 (forces a lapse).
   */
  const gradeFromAnswer = useCallback(
    (question, { correct, timeSec }) => {
      let grade;
      if (correct) grade = timeSec != null && timeSec < 30 ? 5 : 4;
      else grade = 2;
      return gradeQuestion(question.id, grade);
    },
    [gradeQuestion],
  );

  return {
    state,
    dueToday,
    stats,
    gradeQuestion,
    gradeFromAnswer,
  };
}
