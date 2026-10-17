// src/hooks/useKeyboardShortcuts.js
// Single-key shortcuts for a page. Ignored while typing in a field and when a
// modifier is held, so browser and site shortcuts (Ctrl+K search) still work.
import { useEffect, useRef } from 'react';

const isTyping = (target) => {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

/** @param {Record<string, (e: KeyboardEvent) => void>} map  key -> handler ('Space' for space) */
export function useKeyboardShortcuts(map, enabled = true) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const key = e.key === ' ' ? 'Space' : e.key;
      const handler = ref.current[key];
      if (!handler) return;
      // Leave Space/Enter alone on buttons and links: they activate them.
      if ((key === 'Space' || key === 'Enter') && e.target?.closest?.('button, a')) return;
      e.preventDefault();
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
