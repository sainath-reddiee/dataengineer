const STORAGE_KEY = 'deh-reading-list';
const CHANGE_EVENT = 'deh-reading-list-changed';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getReadingList() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item?.slug && item?.title) : [];
  } catch {
    return [];
  }
}

export function isOnReadingList(slug) {
  if (!slug) return false;
  return getReadingList().some((item) => item.slug === slug);
}

function persist(list) {
  if (!canUseStorage()) return list;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  return list;
}

export function toggleReadingListItem({ slug, title }) {
  if (!slug || !title) return getReadingList();
  const current = getReadingList();
  const exists = current.some((item) => item.slug === slug);
  const next = exists
    ? current.filter((item) => item.slug !== slug)
    : [{ slug, title, savedAt: new Date().toISOString() }, ...current].slice(0, 40);
  return persist(next);
}

export function subscribeReadingList(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {};
  }

  const handler = () => callback(getReadingList());
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
