// src/hooks/useAdaptiveQuiz.js
// Adaptive practice hook. Uses an Elo-lite per-topic rating to sample
// questions that target the user's current weak spots, while keeping enough
// variety to avoid locking onto a single topic.
//
// Rating model (Elo-lite):
//   - Each (quizSlug, topicSlug) has a rating, default 1000.
//   - After each answer: expected = 1 / (1 + 10^((qDifficulty - rating) / 400))
//     where qDifficulty maps easy=900, medium=1000, hard=1100.
//   - Update: rating += K * (actual - expected), K=24. actual=1 if correct, 0 otherwise.
//
// Sampling:
//   - Weight each topic's quota by (1 - accuracy) + epsilon so weak topics get
//     more questions. Fall back to uniform if no history.
//
// Persistence is delegated to useQuizStore (getRatings / setTopicRating).

import { useCallback, useMemo } from 'react';
import { shuffle } from './useQuiz';

const K_FACTOR = 24;
const DIFFICULTY_ELO = { easy: 900, medium: 1000, hard: 1100 };

/**
 * @param {Object} cfg
 * @param {string} cfg.quizSlug
 * @param {Array} cfg.questions   Full question pool for this quiz.
 * @param {Array} cfg.topics      topics.json entries.
 * @param {Array} cfg.attempts    Prior attempts from useQuizStore (any mode).
 * @param {Function} cfg.setTopicRating   store.setTopicRating binding.
 * @param {Function} cfg.getRatings       store.getRatings binding.
 * @param {number} [cfg.storeVersion]     store.storeVersion; include so memos
 *                                        re-run when ratings are written.
 * @param {number} [cfg.size]     Session size (default 15).
 */
export function useAdaptiveQuiz({
  quizSlug,
  questions,
  topics,
  attempts,
  setTopicRating,
  getRatings,
  storeVersion = 0,
  size = 15,
}) {
  // Per-topic accuracy from prior attempts.
  const topicAccuracy = useMemo(() => {
    const buckets = {};
    const byId = new Map((questions || []).map((q) => [q.id, q]));
    for (const a of attempts || []) {
      if (a.quizSlug !== quizSlug) continue;
      for (const [qid, r] of Object.entries(a.answers || {})) {
        const q = byId.get(qid);
        if (!q) continue;
        const b = (buckets[q.topicSlug] ||= { correct: 0, total: 0 });
        b.total += 1;
        if (r.correct) b.correct += 1;
      }
    }
    const out = {};
    for (const t of topics || []) {
      const b = buckets[t.slug];
      out[t.slug] = b && b.total ? b.correct / b.total : null;
    }
    return out;
  }, [quizSlug, questions, topics, attempts]);

  /**
   * Pick `size` questions biased toward weak topics.
   */
  const buildSession = useCallback(() => {
    if (!questions?.length || !topics?.length) return [];
    const byTopic = {};
    for (const q of questions) (byTopic[q.topicSlug] ||= []).push(q);

    // Weight per topic: weaker topics get higher weight. epsilon avoids zero.
    const weights = topics.map((t) => {
      const acc = topicAccuracy[t.slug];
      const w = acc == null ? 1 : (1 - acc) + 0.1;
      return { slug: t.slug, weight: Math.max(0.1, w) };
    });
    const wSum = weights.reduce((s, w) => s + w.weight, 0) || 1;

    const picked = [];
    const used = new Set();
    for (const w of weights) {
      const quota = Math.round((w.weight / wSum) * size);
      const bucket = shuffle(byTopic[w.slug] || []);
      for (const q of bucket.slice(0, quota)) {
        picked.push(q);
        used.add(q.id);
      }
    }
    // Backfill shortfall.
    if (picked.length < size) {
      const rest = shuffle(questions.filter((q) => !used.has(q.id)));
      for (const q of rest) {
        if (picked.length >= size) break;
        picked.push(q);
      }
    }
    return shuffle(picked).slice(0, size);
  }, [questions, topics, topicAccuracy, size]);

  /**
   * Call after a question is graded. Mutates the rating for that topic.
   */
  const recordAnswer = useCallback(
    (question, wasCorrect) => {
      const ratings = getRatings(quizSlug) || {};
      const current = ratings[question.topicSlug] ?? 1000;
      const qElo = DIFFICULTY_ELO[question.difficulty] ?? 1000;
      const expected = 1 / (1 + 10 ** ((qElo - current) / 400));
      const next = Math.round(current + K_FACTOR * ((wasCorrect ? 1 : 0) - expected));
      setTopicRating(quizSlug, question.topicSlug, next);
      return next;
    },
    [quizSlug, getRatings, setTopicRating],
  );

  const ratingsSnapshot = useMemo(
    () => getRatings(quizSlug) || {},
    // storeVersion bumps when setTopicRating writes, forcing a fresh read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quizSlug, getRatings, storeVersion],
  );

  return {
    buildSession,
    recordAnswer,
    topicAccuracy,
    ratings: ratingsSnapshot,
  };
}
