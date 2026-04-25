// src/hooks/useStreak.js
// Derives daily streak from attempt history in useQuizStore.

import { useMemo } from 'react';

/**
 * Returns { current, longest, lastActiveDate } based on attempts.
 * "Streak day" = any day with at least one completed attempt.
 * @param {Array<{finishedAt: string}>} attempts
 */
export function useStreak(attempts) {
  return useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return { current: 0, longest: 0, lastActiveDate: null };
    }

    // Unique YYYY-MM-DD dates (UTC) with attempts, sorted ascending
    const dateSet = new Set(
      attempts
        .map((a) => a.finishedAt || a.startedAt)
        .filter(Boolean)
        .map((iso) => iso.slice(0, 10)),
    );
    const dates = Array.from(dateSet).sort();

    if (dates.length === 0) return { current: 0, longest: 0, lastActiveDate: null };

    // Longest consecutive run
    let longest = 1;
    let run = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const cur = new Date(dates[i]);
      const diff = (cur - prev) / 86_400_000;
      if (diff === 1) {
        run += 1;
        longest = Math.max(longest, run);
      } else if (diff > 1) {
        run = 1;
      }
    }

    // Current streak: count consecutive days ending today or yesterday
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const lastDate = dates[dates.length - 1];
    let current = 0;
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      current = 1;
      for (let i = dates.length - 2; i >= 0; i--) {
        const cur = new Date(dates[i + 1]);
        const prev = new Date(dates[i]);
        const diff = (cur - prev) / 86_400_000;
        if (diff === 1) current += 1;
        else break;
      }
    }

    return { current, longest, lastActiveDate: lastDate };
  }, [attempts]);
}
