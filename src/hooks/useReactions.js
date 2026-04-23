// src/hooks/useReactions.js - localStorage-based article reactions for engagement signals
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'deh_reactions';

const getStoredReactions = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveReactions = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — silently ignore */ }
};

/**
 * Hook for per-article emoji reactions.
 * @param {string} slug - Article slug used as the storage key.
 * @returns {{ reactions: Record<string,number>, userReaction: string|null, react: (emoji:string)=>void }}
 */
export default function useReactions(slug) {
  const [allData, setAllData] = useState(getStoredReactions);

  // Re-read on mount in case another tab changed it
  useEffect(() => {
    setAllData(getStoredReactions());
  }, [slug]);

  const articleData = allData[slug] || { counts: {}, userChoice: null };
  const reactions = articleData.counts;
  const userReaction = articleData.userChoice;

  const react = useCallback((emoji) => {
    setAllData((prev) => {
      const current = prev[slug] || { counts: {}, userChoice: null };
      const counts = { ...current.counts };
      const wasSelected = current.userChoice === emoji;

      // Toggle off if same emoji clicked again
      if (wasSelected) {
        counts[emoji] = Math.max((counts[emoji] || 1) - 1, 0);
        const next = { ...prev, [slug]: { counts, userChoice: null } };
        saveReactions(next);
        return next;
      }

      // Remove previous reaction if any
      if (current.userChoice && counts[current.userChoice]) {
        counts[current.userChoice] = Math.max(counts[current.userChoice] - 1, 0);
      }

      // Add new reaction
      counts[emoji] = (counts[emoji] || 0) + 1;
      const next = { ...prev, [slug]: { counts, userChoice: emoji } };
      saveReactions(next);
      return next;
    });
  }, [slug]);

  return { reactions, userReaction, react };
}
