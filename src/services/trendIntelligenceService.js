// src/services/trendIntelligenceService.js
// Orchestrates multiple data sources (TinyFish Search, GSC, AI) to surface
// trending topics, content gaps, competitor intelligence, and article ideas
// for the data engineering niche.

import tinyfishService from './tinyfishService';
import gscService from './gscService';
import keywordTrendService from './keywordTrendService';
import aiService from './aiService';

// Competitor domains to monitor
const COMPETITOR_DOMAINS = [
    'medium.com',
    'towardsdatascience.com',
    'blog.getdbt.com',
    'www.startdataengineering.com',
    'dataengineeringweekly.substack.com',
];

// Niche seed keywords for trend discovery
const SEED_TOPICS = [
    'snowflake', 'dbt', 'data engineering', 'airflow', 'spark',
    'data pipeline', 'data warehouse', 'ELT', 'data lakehouse',
    'iceberg', 'delta lake', 'databricks', 'fivetran',
];

class TrendIntelligenceService {

    /**
     * Discover trending topics via web search.
     * Searches seed keywords + "2025/2026", extracts related searches and top results.
     * FREE — uses TinyFish Search API only.
     */
    async discoverTrendingTopics() {
        if (!tinyfishService.isEnabled) throw new Error('TinyFish API key required for trend discovery.');

        const results = [];

        // Search for trending combinations
        const searches = [
            'data engineering trends 2026',
            'snowflake new features 2025 2026',
            'dbt best practices 2026',
            'data engineering interview questions',
            'modern data stack 2026',
            'data pipeline automation tools',
            'snowflake cost optimization',
            'dbt vs dataform vs sqlmesh',
        ];

        // Community buzz searches
        const communitySearches = [
            '"data engineering" site:reddit.com',
            '"snowflake" OR "dbt" site:news.ycombinator.com',
        ];

        // Run searches in batches of 3 (respect rate limits)
        const allSearches = [...searches, ...communitySearches];
        for (let i = 0; i < allSearches.length; i += 3) {
            const batch = allSearches.slice(i, i + 3);
            const batchResults = await Promise.all(
                batch.map(q => tinyfishService.search(q).catch(() => ({ results: [], query: q })))
            );

            batchResults.forEach((searchResult, idx) => {
                const query = batch[idx];
                const isCommunity = query.includes('site:reddit') || query.includes('site:news.ycombinator');
                const topResults = (searchResult.results || []).slice(0, 5);

                topResults.forEach(r => {
                    results.push({
                        title: r.title,
                        url: r.url,
                        snippet: r.snippet || '',
                        source: isCommunity ? 'community' : 'web',
                        sourceQuery: query,
                        domain: r.site_name || (() => { try { return new URL(r.url || '').hostname; } catch { return 'unknown'; } })(),
                    });
                });
            });

            // Small delay between batches to respect rate limits
            if (i + 3 < allSearches.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        return results;
    }

    /**
     * Get GSC rising keywords — queries growing in impressions.
     * Requires GSC connection.
     */
    async getGSCRisingOpportunities() {
        if (!gscService.isConnected()) throw new Error('GSC not connected.');
        return keywordTrendService.detectRisingKeywords({
            recentDays: 7,
            baselineDays: 28,
            minImpressions: 10,
            minGrowthRate: 0.2,
        });
    }

    /**
     * Monitor competitor blogs for recent data engineering articles.
     * Uses TinyFish Search (FREE) with site: operator.
     */
    async monitorCompetitors(topic = 'data engineering') {
        if (!tinyfishService.isEnabled) throw new Error('TinyFish API key required.');

        const competitorArticles = [];

        for (const domain of COMPETITOR_DOMAINS) {
            try {
                const results = await tinyfishService.search(
                    `site:${domain} ${topic}`,
                    { location: 'US', language: 'en' }
                );

                (results.results || []).slice(0, 5).forEach(r => {
                    competitorArticles.push({
                        title: r.title,
                        url: r.url,
                        snippet: r.snippet || '',
                        domain: domain,
                        position: r.position,
                    });
                });

                // Small delay between domains
                await new Promise(r => setTimeout(r, 300));
            } catch { /* skip failed domain */ }
        }

        return competitorArticles;
    }

    /**
     * Find content gaps — topics competitors rank for that you don't cover.
     * Compares your GSC keywords against competitor SERP presence.
     */
    async findContentGaps(yourSlugs = []) {
        if (!tinyfishService.isEnabled) throw new Error('TinyFish API key required.');

        const gaps = [];

        // Use seed topics to find what competitors cover
        const gapSearches = [
            'snowflake tutorial beginner',
            'dbt incremental models',
            'data engineering portfolio projects',
            'snowflake certification guide',
            'data pipeline monitoring',
            'dbt testing strategies',
            'snowflake performance tuning',
            'data engineering system design',
        ];

        for (const query of gapSearches) {
            try {
                const results = await tinyfishService.search(query);
                const topResults = (results.results || []).slice(0, 10);

                // Check if YOU rank for this
                const yourResult = topResults.find(r => r.url?.includes('dataengineerhub.blog'));
                const competitors = topResults.filter(r => !r.url?.includes('dataengineerhub.blog')).slice(0, 3);

                if (!yourResult && competitors.length > 0) {
                    gaps.push({
                        keyword: query,
                        yourRanking: null,
                        competitors: competitors.map(c => ({ title: c.title, url: c.url, domain: c.site_name })),
                        opportunity: 'high',
                        totalResults: results.total_results || topResults.length,
                    });
                } else if (yourResult && yourResult.position > 5) {
                    gaps.push({
                        keyword: query,
                        yourRanking: yourResult.position,
                        yourUrl: yourResult.url,
                        competitors: competitors.map(c => ({ title: c.title, url: c.url, domain: c.site_name })),
                        opportunity: 'medium',
                        totalResults: results.total_results || topResults.length,
                    });
                }

                await new Promise(r => setTimeout(r, 400));
            } catch { /* skip */ }
        }

        // Sort: high opportunity first, then by total_results as volume proxy
        gaps.sort((a, b) => {
            if (a.opportunity === 'high' && b.opportunity !== 'high') return -1;
            if (b.opportunity === 'high' && a.opportunity !== 'high') return 1;
            return (b.totalResults || 0) - (a.totalResults || 0);
        });

        return gaps;
    }

    /**
     * Generate a full article outline using AI + web search context.
     */
    async generateArticleOutline(topic, targetKeyword) {
        if (!aiService.isEnabled) throw new Error('AI API key required.');

        // Get competitor context
        let competitorContext = '';
        if (tinyfishService.isEnabled) {
            try {
                const results = await tinyfishService.search(targetKeyword);
                const top5 = (results.results || [])
                    .filter(r => !r.url?.includes('dataengineerhub.blog'))
                    .slice(0, 5);
                if (top5.length > 0) {
                    competitorContext = `\n\nCURRENT TOP RESULTS FOR "${targetKeyword}":\n${top5.map((r, i) => `${i + 1}. "${r.title}" (${r.site_name}) — ${r.snippet || ''}`).join('\n')}\n`;
                }
            } catch { /* optional */ }
        }

        const prompt = `You are a senior data engineering content strategist for the blog dataengineerhub.blog. Generate a comprehensive article outline.

TOPIC: ${topic}
TARGET KEYPHRASE: "${targetKeyword}"
${competitorContext}

Generate:

1. **SEO-OPTIMIZED TITLE** (50-60 chars, keyphrase near front, compelling with number/year/power word) — 3 options

2. **META DESCRIPTION** (120-155 chars, action verb start, includes keyphrase)

3. **TARGET AUDIENCE** (who reads this and why)

4. **ARTICLE OUTLINE** (H2 headings with 2-3 bullet points each):
   - Include keyphrase in 2-3 headings naturally
   - 8-12 H2 sections minimum
   - Include: intro, main content sections, practical examples, common mistakes, FAQ section, conclusion
   - Each section: 200-400 words target

5. **SECONDARY KEYWORDS** (8-10 LSI keywords to weave throughout)

6. **INTERNAL LINK OPPORTUNITIES** (which existing dataengineerhub.blog articles to link from)

7. **SCHEMA RECOMMENDATIONS** (Article, FAQ, HowTo — which applies)

8. **ESTIMATED WORD COUNT** and **DIFFICULTY TO RANK** (easy/medium/hard based on competition)

Be specific to data engineering. Include Snowflake, dbt, or other tools where relevant.`;

        return aiService.generateSuggestion(prompt, '');
    }

    /**
     * Generate AI-powered article ideas from trend data.
     */
    async generateArticleIdeas(trendData) {
        if (!aiService.isEnabled) throw new Error('AI API key required.');

        const trendSummary = trendData.slice(0, 20).map(t => `- "${t.title}" (${t.source}: ${t.domain})`).join('\n');

        const prompt = `You are a data engineering content strategist. Based on these trending topics and recent articles in the data engineering space, suggest 15 NEW article ideas for the blog dataengineerhub.blog.

TRENDING TOPICS & RECENT COMPETITOR ARTICLES:
${trendSummary}

EXISTING BLOG FOCUS: Snowflake, dbt, data pipelines, cost optimization, interviews, best practices, modern data stack.

For each article idea, provide:
1. **Title** (SEO-optimized, 50-60 chars, with number/year)
2. **Target Keyphrase** (what someone would search)
3. **Why Now** (why this topic is timely)
4. **Difficulty** (Easy/Medium/Hard to rank)
5. **Content Type** (Tutorial, Guide, Comparison, Opinion, List, Case Study)

Sort by: highest impact opportunities first (trending + low competition + fits blog niche).
Format as a numbered list.`;

        return aiService.generateSuggestion(prompt, '');
    }
}

export const trendIntelligenceService = new TrendIntelligenceService();
export default trendIntelligenceService;
