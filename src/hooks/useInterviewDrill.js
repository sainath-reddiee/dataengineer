// src/hooks/useInterviewDrill.js
// One-question-at-a-time drill with self-rating feeding SM-2 spaced
// repetition. State lives in the practice store under the 'interview'
// namespace. Drills never write quiz attempts, so practice scores and
// streaks are unaffected.
import { useCallback, useMemo, useState } from 'react';
import { buildDrillQueue, RATINGS } from '@/lib/interview/bank';
import { stepSM2 } from '@/hooks/useSpacedRepetition';
import { useQuizStore } from '@/hooks/useQuizStore';

export const SRS_NAMESPACE = 'interview';

export function useInterviewDrill(items, { includeLearning = false } = {}) {
  const { getSRS, setQuestionSRS } = useQuizStore();
  // Freeze the queue for the session so rating a card does not reshuffle it.
  const [queue] = useState(() => buildDrillQueue(items, getSRS(SRS_NAMESPACE), { includeLearning }));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState({}); // id -> rating id

  const current = queue[idx] || null;
  const finished = queue.length > 0 && idx >= queue.length;

  const go = useCallback((next) => {
    setIdx(Math.max(0, Math.min(next, queue.length)));
    setRevealed(false);
  }, [queue.length]);

  const reveal = useCallback(() => setRevealed(true), []);

  const rate = useCallback((ratingId) => {
    if (!current) return;
    const rating = RATINGS.find((r) => r.id === ratingId);
    if (!rating) return;
    const prev = getSRS(SRS_NAMESPACE)[current.id];
    setQuestionSRS(SRS_NAMESPACE, current.id, stepSM2(prev, rating.grade));
    setRatings((r) => ({ ...r, [current.id]: ratingId }));
    go(idx + 1);
  }, [current, getSRS, setQuestionSRS, go, idx]);

  const summary = useMemo(() => {
    const counts = { knew: 0, partial: 0, missed: 0 };
    for (const id of Object.values(ratings)) counts[id] += 1;
    return counts;
  }, [ratings]);

  return { queue, idx, current, revealed, reveal, rate, next: () => go(idx + 1), prev: () => go(idx - 1), finished, summary, ratings };
}
