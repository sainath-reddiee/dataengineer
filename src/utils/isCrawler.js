/**
 * Detect Google/AdSense and other crawlers from a user-agent string.
 * AdsBot and Mediapartners-Google must be included — those are the
 * user-agents AdSense uses when reviewing a site for approval.
 */
export const CRAWLER_UA_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegrambot|baiduspider|yandex|duckduckbot|googlebot|bingbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|archive\.org_bot|applebot|petalbot|gptbot|claudebot|bytespider|ia_archiver|mediapartners-google|adsbot-google/i;

export function isCrawlerUserAgent(userAgent) {
  const agent =
    userAgent ||
    (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!agent) return false;
  return CRAWLER_UA_PATTERN.test(agent);
}
