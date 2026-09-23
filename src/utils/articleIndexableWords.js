/**
 * Article word counts that match crawler-facing SSG robots.
 *
 * generateSitemap used to count raw WordPress HTML. Article SSG strips an
 * elevated TL;DR / Key Takeaways section from the body (it lives in the aside)
 * and collapses long code dumps before calling countIndexableWords. Those
 * missing words are why a sitemap loc can later ship with noindex and fail
 * verifyBuild.
 */
import { ADSENSE_REVIEW_MODE, countIndexableWords } from '../data/adsenseQualityGate.js';
import { collapseLongCodeBlocks } from './adsenseCodeRatio.js';
import { analyzeKeyTakeaways, isElevatedTakeawaysSource } from './articleTakeaways.js';

export function prepareArticleIndexableHtml(html, { title } = {}) {
  const source = html || '';
  const analysis = analyzeKeyTakeaways(source);
  let body = isElevatedTakeawaysSource(analysis.source) ? analysis.html : source;
  if (ADSENSE_REVIEW_MODE) {
    body = collapseLongCodeBlocks(body, { title });
  }
  return body;
}

export function countArticleIndexableWords(html, options) {
  return countIndexableWords(prepareArticleIndexableHtml(html, options));
}
