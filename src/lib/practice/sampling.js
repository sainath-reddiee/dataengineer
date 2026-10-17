// src/lib/practice/sampling.js
// Pure sampling helpers shared by the quiz hook, mock exams and the Node
// verifiers (no React import, so scripts can load this file directly).

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
