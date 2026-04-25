// src/hooks/useQuiz.js
// Core quiz state machine. Pure client-side, framework-free logic.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Fisher-Yates unbiased shuffle. Returns a new array; does not mutate input.
 * Replaces `arr.sort(() => Math.random() - 0.5)` which is biased and unstable.
 */
export function shuffle(input) {
  const arr = [...(input || [])];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Domain-weighted sample of questions for exam mode v2.
 * Given a pool of questions, an array of topics with `weight` (percent), and a
 * target total count, returns a shuffled list whose per-topic counts mirror the
 * official domain weights. Falls back to uniform sampling for any shortfall.
 *
 * @param {Array} pool           Full question pool.
 * @param {Array} topics         topics.json entries with `slug` and `weight`.
 * @param {number} total         Target number of questions.
 * @returns {Array}              Sampled, shuffled questions.
 */
export function sampleDomainWeighted(pool, topics, total) {
  if (!pool?.length || !total) return [];
  const weightSum = (topics || []).reduce((s, t) => s + (t.weight || 0), 0) || 100;
  const byTopic = {};
  for (const q of pool) {
    (byTopic[q.topicSlug] ||= []).push(q);
  }
  const picked = [];
  const used = new Set();
  for (const t of topics || []) {
    const bucket = shuffle(byTopic[t.slug] || []);
    const quota = Math.round(((t.weight || 0) / weightSum) * total);
    for (const q of bucket.slice(0, quota)) {
      picked.push(q);
      used.add(q.id);
    }
  }
  // Backfill shortfall from the full pool (e.g. when rounding leaves a gap).
  if (picked.length < total) {
    const rest = shuffle(pool.filter((q) => !used.has(q.id)));
    for (const q of rest) {
      if (picked.length >= total) break;
      picked.push(q);
    }
  }
  return shuffle(picked).slice(0, total);
}

/**
 * @param {Object} cfg
 * @param {import('@/data/practice/_schema').Question[]} cfg.questions
 * @param {'practice'|'exam'|'topic'|'review'} cfg.mode
 * @param {number} [cfg.timeLimitSec]   If set, timer counts down from this.
 * @param {boolean} [cfg.shuffleQuestions]
 * @param {boolean} [cfg.shuffleOptions]
 */
export function useQuiz({
  questions,
  mode = 'practice',
  timeLimitSec = null,
  shuffleQuestions = true,
  shuffleOptions = true,
}) {
  // Stable ordered question list (unbiased Fisher-Yates, applied once per ref change)
  const orderedQuestions = useMemo(() => {
    const arr = shuffleQuestions ? shuffle(questions || []) : [...(questions || [])];
    return arr.map((q) => {
      if (!shuffleOptions) return q;
      return { ...q, options: shuffle(q.options) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const [status, setStatus] = useState('idle'); // 'idle' | 'inProgress' | 'complete'
  const [currentIdx, setCurrentIdx] = useState(0);
  /** @type {Record<string, {selectedIds: string[], submitted: boolean, correct: boolean, timeSec: number}>} */
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLimitSec);
  const [elapsedSec, setElapsedSec] = useState(0);
  /** Set of question IDs the user flagged for review (exam mode v2). */
  const [flags, setFlags] = useState(() => new Set());

  const startedAtRef = useRef(null);
  const questionStartRef = useRef(null);

  const currentQuestion = orderedQuestions[currentIdx] || null;
  const total = orderedQuestions.length;

  const start = useCallback(() => {
    setStatus('inProgress');
    setCurrentIdx(0);
    setAnswers({});
    setFlags(new Set());
    setElapsedSec(0);
    setTimeLeft(timeLimitSec);
    startedAtRef.current = new Date().toISOString();
    questionStartRef.current = Date.now();
  }, [timeLimitSec]);

  // Timer tick
  useEffect(() => {
    if (status !== 'inProgress') return undefined;
    const id = setInterval(() => {
      setElapsedSec((s) => s + 1);
      setTimeLeft((t) => (t == null ? t : Math.max(0, t - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Auto-finish when timer hits 0 (exam mode)
  useEffect(() => {
    if (timeLeft === 0 && status === 'inProgress') {
      setStatus('complete');
    }
  }, [timeLeft, status]);

  const selectAnswer = useCallback(
    (questionId, optionId, isMulti) => {
      setAnswers((prev) => {
        const existing = prev[questionId] || { selectedIds: [], submitted: false };
        if (existing.submitted) return prev; // lock after submit in practice mode
        let selectedIds;
        if (isMulti) {
          const set = new Set(existing.selectedIds);
          if (set.has(optionId)) set.delete(optionId);
          else set.add(optionId);
          selectedIds = Array.from(set);
        } else {
          selectedIds = [optionId];
        }
        return { ...prev, [questionId]: { ...existing, selectedIds } };
      });
    },
    [],
  );

  const submitAnswer = useCallback(
    (questionId) => {
      const q = orderedQuestions.find((x) => x.id === questionId);
      if (!q) return;
      const ans = answers[questionId] || { selectedIds: [] };
      const selected = new Set(ans.selectedIds);
      const correctSet = new Set(q.correctIds);
      const correct =
        selected.size === correctSet.size && [...correctSet].every((id) => selected.has(id));
      const timeSec = Math.round((Date.now() - (questionStartRef.current || Date.now())) / 1000);
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...(prev[questionId] || { selectedIds: [] }), submitted: true, correct, timeSec },
      }));
    },
    [answers, orderedQuestions],
  );

  const next = useCallback(() => {
    setCurrentIdx((i) => Math.min(i + 1, total - 1));
    questionStartRef.current = Date.now();
  }, [total]);

  const prev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
    questionStartRef.current = Date.now();
  }, []);

  const goTo = useCallback(
    (idx) => {
      setCurrentIdx(Math.max(0, Math.min(idx, total - 1)));
      questionStartRef.current = Date.now();
    },
    [total],
  );

  const toggleFlag = useCallback((questionId) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const finish = useCallback(() => {
    // In exam mode, evaluate any unsubmitted answers now
    if (mode === 'exam') {
      setAnswers((prev) => {
        const next = { ...prev };
        orderedQuestions.forEach((q) => {
          if (!next[q.id] || !next[q.id].submitted) {
            const selected = new Set((next[q.id] || {}).selectedIds || []);
            const correctSet = new Set(q.correctIds);
            const correct =
              selected.size === correctSet.size && [...correctSet].every((id) => selected.has(id));
            next[q.id] = {
              selectedIds: Array.from(selected),
              submitted: true,
              correct,
              timeSec: next[q.id]?.timeSec ?? 0,
            };
          }
        });
        return next;
      });
    }
    setStatus('complete');
  }, [mode, orderedQuestions]);

  // Derived: score
  const score = useMemo(() => {
    const submitted = Object.values(answers).filter((a) => a.submitted);
    const correct = submitted.filter((a) => a.correct).length;
    return {
      correct,
      total,
      answered: submitted.length,
      percent: total ? Math.round((correct / total) * 100) : 0,
    };
  }, [answers, total]);

  // Derived: per-topic breakdown for weakness heatmap
  const topicBreakdown = useMemo(() => {
    const buckets = {};
    orderedQuestions.forEach((q) => {
      const a = answers[q.id];
      if (!a || !a.submitted) return;
      if (!buckets[q.topicSlug]) buckets[q.topicSlug] = { correct: 0, total: 0 };
      buckets[q.topicSlug].total += 1;
      if (a.correct) buckets[q.topicSlug].correct += 1;
    });
    return buckets;
  }, [answers, orderedQuestions]);

  // Build an Attempt record for persistence
  const buildAttempt = useCallback(
    (quizSlug, extra = {}) => {
      return {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        quizSlug,
        mode,
        score: score.percent,
        correct: score.correct,
        total: score.total,
        durationSec: elapsedSec,
        startedAt: startedAtRef.current || new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        answers: Object.fromEntries(
          Object.entries(answers).map(([qid, a]) => [
            qid,
            { correct: !!a.correct, selectedIds: a.selectedIds, timeSec: a.timeSec || 0 },
          ]),
        ),
        flaggedIds: Array.from(flags),
        ...extra,
      };
    },
    [answers, elapsedSec, flags, mode, score.correct, score.percent, score.total],
  );

  return {
    status,
    mode,
    currentIdx,
    currentQuestion,
    total,
    orderedQuestions,
    answers,
    flags,
    toggleFlag,
    timeLeft,
    elapsedSec,
    score,
    topicBreakdown,
    start,
    selectAnswer,
    submitAnswer,
    next,
    prev,
    goTo,
    finish,
    buildAttempt,
  };
}
