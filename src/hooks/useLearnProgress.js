import { useCallback, useEffect, useState } from 'react';

const KEY = 'dehub:learn:v1';

function readState() {
  if (typeof window === 'undefined') return { solved: {}, lastRunAt: null };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return {
      solved: parsed.solved && typeof parsed.solved === 'object' ? parsed.solved : {},
      lastRunAt: parsed.lastRunAt || null,
    };
  } catch {
    return { solved: {}, lastRunAt: null };
  }
}

function writeState(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('dehub-learn-progress'));
  } catch {
    /* quota */
  }
}

export function useLearnProgress() {
  const [state, setState] = useState(readState);

  useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener('storage', refresh);
    window.addEventListener('dehub-learn-progress', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('dehub-learn-progress', refresh);
    };
  }, []);

  const markSolved = useCallback((slug) => {
    if (!slug) return;
    setState((prev) => {
      const next = {
        ...prev,
        solved: { ...prev.solved, [slug]: new Date().toISOString() },
        lastRunAt: new Date().toISOString(),
      };
      writeState(next);
      return next;
    });
  }, []);

  const recordRun = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, lastRunAt: new Date().toISOString() };
      writeState(next);
      return next;
    });
  }, []);

  const clearProgress = useCallback(() => {
    const next = { solved: {}, lastRunAt: null };
    writeState(next);
    setState(next);
  }, []);

  const solvedCount = Object.keys(state.solved || {}).length;
  const isSolved = useCallback((slug) => Boolean(state.solved?.[slug]), [state.solved]);

  return { ...state, solvedCount, markSolved, recordRun, clearProgress, isSolved };
}
