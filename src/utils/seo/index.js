// src/utils/seo/index.js
/**
 * SEO Toolkit - Main exports
 */

export { SEOScanner, SEVERITY, CATEGORIES, scanUrl, scanDocument } from './seoScanner';
export { PSEOAnalyzer, PSEO_CATEGORIES } from './pseoAnalyzer';
export { AEOAnalyzer, AEO_CATEGORIES } from './aeoAnalyzer';
export { GEOAnalyzer, GEO_CATEGORIES } from './geoAnalyzer';
export { exportToMarkdown, exportToCSV, exportToJSON, downloadFile, copyToClipboard } from './exportUtils';

/**
 * Run full SEO analysis on an article
 */
export async function analyzeArticleFull(article, htmlContent = null) {
    const { SEOScanner } = await import('./seoScanner');
    const { PSEOAnalyzer } = await import('./pseoAnalyzer');
    const { AEOAnalyzer } = await import('./aeoAnalyzer');
    const { GEOAnalyzer } = await import('./geoAnalyzer');

    const results = {
        traditional: null,
        pseo: null,
        aeo: null,
        geo: null,
        overallScore: 0
    };

    // Traditional SEO (needs HTML)
    if (htmlContent) {
        const scanner = new SEOScanner();
        results.traditional = await scanner.analyze(article.url || article.link || '', htmlContent);
    }

    // PSEO Analysis
    const pseoAnalyzer = new PSEOAnalyzer();
    results.pseo = pseoAnalyzer.analyze(article);

    // AEO Analysis
    const aeoAnalyzer = new AEOAnalyzer();
    results.aeo = aeoAnalyzer.analyze(article);

    // GEO Analysis
    const geoAnalyzer = new GEOAnalyzer();
    results.geo = geoAnalyzer.analyze(article);

    // Calculate overall score
    const scores = [
        results.traditional?.score,
        results.pseo?.score,
        results.aeo?.score,
        results.geo?.score
    ].filter(s => s !== null && s !== undefined);

    results.overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    results.overallGrade = results.overallScore >= 80 ? 'A' :
        results.overallScore >= 60 ? 'B' :
            results.overallScore >= 40 ? 'C' : 'D';

    return results;
}
