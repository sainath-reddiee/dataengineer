// src/hooks/useRoadmapProgress.js
// Ticked roadmap skills, stored in this browser only and synced across tabs.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { skillIds } from '@/lib/roadmaps/resourceHref';

const KEY = 'dehub:roadmaps:v1';

function readAll() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(value) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private mode or full storage: progress just does not persist.
  }
}

/**
 * Progress for every roadmap, for the hub: { [slug]: { done, total, percent } }.
 * Only skill ids that still exist count, so renamed or removed skills never
 * inflate the percentage.
 */
export function useAllRoadmapProgress(roadmaps) {
  const [all, setAll] = useState(() => (typeof window === 'undefined' ? {} : readAll()));
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setAll(readAll()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return useMemo(() => Object.fromEntries(roadmaps.map((r) => {
    const ids = skillIds(r);
    const done = ids.filter((id) => all[r.slug]?.done?.[id]).length;
    return [r.slug, { done, total: ids.length, percent: ids.length ? Math.round((done / ids.length) * 100) : 0 }];
  })), [all, roadmaps]);
}

export function useRoadmapProgress(roadmap) {
  const [all, setAll] = useState(() => (typeof window === 'undefined' ? {} : readAll()));

  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setAll(readAll()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const ids = useMemo(() => skillIds(roadmap), [roadmap]);
  const doneMap = all[roadmap?.slug]?.done || {};
  const done = ids.filter((id) => doneMap[id]).length;
  const percent = ids.length ? Math.round((done / ids.length) * 100) : 0;
  const resumeSkillId = ids.find((id) => !doneMap[id]) || null;

  const update = useCallback((mutate) => {
    const current = readAll();
    const entry = current[roadmap.slug] || { done: {} };
    mutate(entry);
    entry.updatedAt = new Date().toISOString();
    const next = { ...current, [roadmap.slug]: entry };
    writeAll(next);
    setAll(next);
  }, [roadmap]);

  const toggle = useCallback((skillId) => update((entry) => {
    entry.done = { ...entry.done };
    if (entry.done[skillId]) delete entry.done[skillId];
    else entry.done[skillId] = new Date().toISOString();
    entry.lastSkillId = skillId;
  }), [update]);

  const reset = useCallback(() => update((entry) => {
    entry.done = {};
    entry.lastSkillId = null;
  }), [update]);

  return { isDone: (id) => !!doneMap[id], toggle, reset, done, total: ids.length, percent, resumeSkillId };
}
