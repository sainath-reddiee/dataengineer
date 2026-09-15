import { useCallback, useEffect, useState } from 'react';

export const SAVED_KEY = 'dehub:saved:v1';

function readSaved() {
  if (typeof window === 'undefined') return { coding: [], questions: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_KEY) || '{}');
    return {
      coding: Array.isArray(parsed.coding) ? parsed.coding : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    };
  } catch {
    return { coding: [], questions: [] };
  }
}

function writeSaved(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('dehub-saved'));
  } catch {
    /* quota */
  }
}

function toggleIn(list, id) {
  if (!id) return list;
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function useSavedItems() {
  const [state, setState] = useState(readSaved);

  useEffect(() => {
    const refresh = () => setState(readSaved());
    window.addEventListener('storage', refresh);
    window.addEventListener('dehub-saved', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('dehub-saved', refresh);
    };
  }, []);

  const toggleCoding = useCallback((slug) => {
    setState((prev) => {
      const next = { ...prev, coding: toggleIn(prev.coding, slug) };
      writeSaved(next);
      return next;
    });
  }, []);

  const toggleQuestion = useCallback((id) => {
    setState((prev) => {
      const next = { ...prev, questions: toggleIn(prev.questions, id) };
      writeSaved(next);
      return next;
    });
  }, []);

  const isCodingSaved = useCallback((slug) => state.coding.includes(slug), [state.coding]);
  const isQuestionSaved = useCallback((id) => state.questions.includes(id), [state.questions]);

  return {
    ...state,
    toggleCoding,
    toggleQuestion,
    isCodingSaved,
    isQuestionSaved,
    count: state.coding.length + state.questions.length,
  };
}
