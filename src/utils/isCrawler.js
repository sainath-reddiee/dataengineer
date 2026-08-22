/**
 * Detect Google/AdSense and other crawlers from a user-agent string.
 * AdsBot and Mediapartners-Google must be included — those are the
 * user-agents AdSense uses when reviewing a site for approval.
 */
export const CRAWLER_UA_PATTERN =
  /googlebot|adsbot-google|mediapartners-google|bingbot|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegrambot|baiduspider|yandex|duckduckbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|archive\.org_bot|applebot|petalbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|google-extended|googleother|bytespider|ccbot|perplexity|cohere-ai|ia_archiver/i;

const REAL_BROWSER_HINT =
  /Mozilla\/5\.0.*(Chrome|Safari|Firefox|Edg|OPR|SamsungBrowser|CriOS|FxiOS)/i;

export function isCrawlerUserAgent(userAgent) {
  const agent =
    userAgent ||
    (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!agent) return false;
  if (!CRAWLER_UA_PATTERN.test(agent)) return false;
  // Gemini / ChatGPT in-app browsers are Chrome WebViews. Do not treat those
  // as crawlers or the reader is stuck on the static SSG listing.
  if (REAL_BROWSER_HINT.test(agent) && !/googlebot|adsbot-google|mediapartners-google/i.test(agent)) {
    return false;
  }
  return true;
}
