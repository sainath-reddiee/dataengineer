/**
 * Who may keep the static SSG HTML (no React).
 *
 * Default is ALWAYS React. Manual users, Gemini/ChatGPT/Claude in-app
 * Chrome, and AdSense human reviewers must never stay on the static listing.
 *
 * Only documented crawlers skip React — those bots read the pre-rendered
 * article-body, which is what AdSense/Googlebot need for approval.
 * AdsBot / Mediapartners / Googlebot stay in this list on purpose.
 */
export const CRAWLER_UA_PATTERN =
  /googlebot|adsbot-google|mediapartners-google|bingbot|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegrambot|baiduspider|yandex|duckduckbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|archive\.org_bot|applebot|petalbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|google-extended|googleother|bytespider|ccbot|perplexity|cohere-ai|ia_archiver/i;

const REAL_BROWSER_HINT =
  /Mozilla\/5\.0.*(Chrome|Safari|Firefox|Edg|OPR|SamsungBrowser|CriOS|FxiOS)/i;

const ADSENSE_REVIEW_CRAWLER =
  /googlebot|adsbot-google|mediapartners-google/i;

export function isCrawlerUserAgent(userAgent) {
  const agent =
    userAgent ||
    (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!agent) return false;
  if (!CRAWLER_UA_PATTERN.test(agent)) return false;
  if (REAL_BROWSER_HINT.test(agent) && !ADSENSE_REVIEW_CRAWLER.test(agent)) {
    return false;
  }
  return true;
}
