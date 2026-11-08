const KEY = 'deh-reading-place';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function readReadingPlace() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const place = JSON.parse(raw);
    if (!place || typeof place.slug !== 'string' || typeof place.title !== 'string') return null;
    if (!place.slug || !place.title) return null;
    if (place.updated && Date.now() - Number(place.updated) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return place;
  } catch {
    return null;
  }
}

export function writeReadingPlace(place) {
  if (typeof window === 'undefined' || !place?.slug || !place?.title) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({
      slug: place.slug,
      title: place.title,
      headingId: place.headingId || '',
      heading: place.heading || '',
      stage: place.stage || '',
      updated: Date.now(),
    }));
  } catch {
    // Private mode and full storage can refuse the write. Reading still works.
  }
}
