/**
 * Article word counts that match crawler-facing SSG robots.
 *
 * generateSitemap used to count raw WordPress HTML. Article SSG strips an
 * elevated TL;DR / Key Takeaways section from the body (it lives in the aside)
 * before calling countIndexableWords. Those missing words are why a sitemap
 * loc can later ship with noindex and fail verifyBuild.
 */
import { countIndexableWords } from '../data/adsenseQualityGate.js';
import { analyzeKeyTakeaways, isElevatedTakeawaysSource } from './articleTakeaways.js';

export function prepareArticleIndexableHtml(html) {
  const source = html || '';
  const analysis = analyzeKeyTakeaways(source);
  return isElevatedTakeawaysSource(analysis.source) ? analysis.html : source;
}

export function countArticleIndexableWords(html) {
  return countIndexableWords(prepareArticleIndexableHtml(html));
}
