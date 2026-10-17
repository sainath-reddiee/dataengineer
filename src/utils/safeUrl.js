// Links that come from WordPress user meta or other editable data must never
// become javascript:/data: URLs, which React still renders as clickable links.
export function safeExternalUrl(value) {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : null;
}
