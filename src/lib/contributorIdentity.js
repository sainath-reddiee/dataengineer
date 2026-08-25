// Shared identity for the blog owner vs guest contributors.
// Sainath Reddy is WordPress user 1; job_title is often empty on that profile,
// so the directory must not fall back to "Guest Contributor".

const OWNER_NAMES = new Set([
  'sainath reddy',
  'sainath',
  'sainath reddy pogaku',
]);

const OWNER_SLUGS = new Set([
  'psainath123gmail-com',
  'sainath-reddy',
  'sainath',
]);

export const OWNER_DISPLAY_NAME = 'Sainath Reddy';
export const OWNER_BADGE_LABEL = 'Founder & Data Engineer';
export const OWNER_ROLE = 'Data Engineer at Anblicks';
export const OWNER_PROFILE_PATH = '/about';

function normalizeName(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isBlogOwner(person = {}) {
  const id = person.id;
  if (id === 1 || id === '1') return true;

  const name = normalizeName(person.name);
  if (OWNER_NAMES.has(name)) return true;
  if (name.includes('sainath') && name.includes('reddy')) return true;

  const slug = normalizeName(person.slug);
  if (OWNER_SLUGS.has(slug)) return true;

  return false;
}

export function contributorRole(person = {}, fallback = 'Guest Contributor') {
  if (isBlogOwner(person)) return OWNER_ROLE;
  const titled = person.role
    || person.meta?.job_title
    || person.job_title
    || '';
  return titled.trim() || fallback;
}
