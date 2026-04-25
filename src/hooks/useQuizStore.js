// src/hooks/useQuizStore.js
// localStorage wrapper for practice quiz persistence.
// Stores: attempts[], bookmarks[quizSlug][], inProgress{quizSlug},
//         ratings[quizSlug][topicSlug] (Elo-lite), srs[quizSlug][questionId] (SM-2).
// All keys namespaced under `dehub:practice:*`.

import { useCallback, useEffect, useState } from 'react';

const KEYS = {
  attempts: 'dehub:practice:attempts',
  bookmarks: 'dehub:practice:bookmarks',
  inProgress: 'dehub:practice:inProgress',
  ratings: 'dehub:practice:ratings',
  srs: 'dehub:practice:srs',
  version: 'dehub:practice:version',
};

const CURRENT_VERSION = 2;

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readLS(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return safeParse(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or disabled — silently ignore
  }
}

function migrateIfNeeded() {
  if (typeof window === 'undefined') return;
  const v = readLS(KEYS.version, 0);
  if (v < 2) {
    // v1 -> v2: seed empty containers for adaptive (ratings) and spaced
    // repetition (srs). Existing attempts/bookmarks/inProgress are untouched.
    if (readLS(KEYS.ratings, null) == null) writeLS(KEYS.ratings, {});
    if (readLS(KEYS.srs, null) == null) writeLS(KEYS.srs, {});
  }
  if (v < CURRENT_VERSION) {
    writeLS(KEYS.version, CURRENT_VERSION);
  }
}

export function useQuizStore() {
  const [attempts, setAttempts] = useState(() => readLS(KEYS.attempts, []));
  const [bookmarks, setBookmarks] = useState(() => readLS(KEYS.bookmarks, {}));
  // Monotonic counter bumped whenever ratings or srs change, so consumers that
  // read those containers via the getters below can include it in memo deps
  // and re-evaluate when we write.
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    migrateIfNeeded();
  }, []);

  const addAttempt = useCallback((attempt) => {
    setAttempts((prev) => {
      const next = [...prev, attempt].slice(-200); // cap at 200 attempts
      writeLS(KEYS.attempts, next);
      return next;
    });
  }, []);

  const clearAttempts = useCallback((quizSlug) => {
    setAttempts((prev) => {
      const next = quizSlug ? prev.filter((a) => a.quizSlug !== quizSlug) : [];
      writeLS(KEYS.attempts, next);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((quizSlug, questionId) => {
    setBookmarks((prev) => {
      const list = new Set(prev[quizSlug] || []);
      if (list.has(questionId)) list.delete(questionId);
      else list.add(questionId);
      const next = { ...prev, [quizSlug]: Array.from(list) };
      writeLS(KEYS.bookmarks, next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (quizSlug, questionId) => (bookmarks[quizSlug] || []).includes(questionId),
    [bookmarks],
  );

  const saveInProgress = useCallback((quizSlug, state) => {
    const all = readLS(KEYS.inProgress, {});
    all[quizSlug] = { ...state, updatedAt: new Date().toISOString() };
    writeLS(KEYS.inProgress, all);
  }, []);

  const loadInProgress = useCallback((quizSlug) => {
    const all = readLS(KEYS.inProgress, {});
    return all[quizSlug] || null;
  }, []);

  const clearInProgress = useCallback((quizSlug) => {
    const all = readLS(KEYS.inProgress, {});
    delete all[quizSlug];
    writeLS(KEYS.inProgress, all);
  }, []);

  // Derived: best score per quiz
  const getBestScore = useCallback(
    (quizSlug) => {
      const scored = attempts.filter((a) => a.quizSlug === quizSlug).map((a) => a.score);
      return scored.length ? Math.max(...scored) : null;
    },
    [attempts],
  );

  const getLastAttempt = useCallback(
    (quizSlug) => {
      const list = attempts.filter((a) => a.quizSlug === quizSlug);
      return list.length ? list[list.length - 1] : null;
    },
    [attempts],
  );

  // ---------- Adaptive (Elo-lite) ratings per (quiz, topic) ----------
  const getRatings = useCallback(
    (quizSlug) => {
      const all = readLS(KEYS.ratings, {});
      return all[quizSlug] || {};
    },
    [],
  );

  const setTopicRating = useCallback((quizSlug, topicSlug, rating) => {
    const all = readLS(KEYS.ratings, {});
    all[quizSlug] = { ...(all[quizSlug] || {}), [topicSlug]: rating };
    writeLS(KEYS.ratings, all);
    setStoreVersion((v) => v + 1);
  }, []);

  // ---------- Spaced repetition (SM-2) state per (quiz, question) ----------
  const getSRS = useCallback((quizSlug) => {
    const all = readLS(KEYS.srs, {});
    return all[quizSlug] || {};
  }, []);

  const setQuestionSRS = useCallback((quizSlug, questionId, state) => {
    const all = readLS(KEYS.srs, {});
    all[quizSlug] = { ...(all[quizSlug] || {}), [questionId]: state };
    writeLS(KEYS.srs, all);
    setStoreVersion((v) => v + 1);
  }, []);

  return {
    attempts,
    bookmarks,
    storeVersion,
    addAttempt,
    clearAttempts,
    toggleBookmark,
    isBookmarked,
    saveInProgress,
    loadInProgress,
    clearInProgress,
    getBestScore,
    getLastAttempt,
    getRatings,
    setTopicRating,
    getSRS,
    setQuestionSRS,
  };
}
