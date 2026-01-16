// Content Optimizer Service
// Analyzes URLs for AI citation optimization

class ContentOptimizerService {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
    }

    // Strip HTML tags
    stripHTML(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#8217;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&#8230;/g, '...')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Analyze content for AI citation optimization
    analyzeContent(html, url) {
        const plainContent = this.stripHTML(html);
        const recommendations = [];
        const issues = [];
        const strengths = [];
        let score = 100;

        // 1. Check for TL;DR / Summary
        const hasTLDR = /(?:^|\n|<p>)(TL;?DR|Summary|Key Takeaways?|In Brief)[:;.\s]/i.test(html);
        if (!hasTLDR) {
            score -= 15;
            issues.push('Missing TL;DR summary');
            recommendations.push({
                priority: 'HIGH',
                type: 'TL;DR',
                issue: 'No TL;DR or summary section found',
                action: 'Add a "TL;DR:" section at the start with 2-3 key sentences (40-60 words)',
                impact: 'AI systems extract opening summaries for quick answers'
            });
        } else {
            strengths.push('Has TL;DR summary');
        }

        // 2. Check for statistics and numbers
        const statPatterns = [
            /\d+(?:\.\d+)?%/g,
            /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|MB|GB|TB|ms|seconds?|minutes?|hours?)/gi,
            /\$\d+(?:,\d{3})*(?:\.\d+)?/gi
        ];

        let allStats = [];
        statPatterns.forEach(pattern => {
            const matches = plainContent.match(pattern) || [];
            allStats = allStats.concat(matches);
        });
        const uniqueStats = [...new Set(allStats)];

        if (uniqueStats.length < 3) {
            score -= 10;
            issues.push(`Only ${uniqueStats.length} statistics found`);
            recommendations.push({
                priority: 'MEDIUM',
                type: 'Statistics',
                issue: `Only ${uniqueStats.length} statistics/numbers found`,
                action: 'Add 3-5 specific statistics, percentages, or benchmarks',
                impact: 'AI loves citing specific data - increases citation rate by 25%'
            });
        } else if (uniqueStats.length >= 5) {
            strengths.push(`${uniqueStats.length} statistics (excellent)`);
        }

        // 3. Check for data tables
        const tables = (html.match(/<table/gi) || []).length;
        if (tables === 0) {
            score -= 8;
            issues.push('No data tables');
            recommendations.push({
                priority: 'MEDIUM',
                type: 'Data Tables',
                issue: 'No comparison or data tables found',
                action: 'Add 1-2 tables comparing tools, features, or performance metrics',
                impact: 'AI can directly cite structured data from tables'
            });
        } else {
            strengths.push(`${tables} table(s)`);
        }

        // 4. Check for "Last Updated" date
        const hasLastUpdated = /(?:last |recently )?updated:?\s*(?:on\s*)?(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i.test(html);
        if (!hasLastUpdated) {
            score -= 12;
            issues.push('Missing "Last Updated" date');
            recommendations.push({
                priority: 'HIGH',
                type: 'Freshness',
                issue: 'No visible "Last Updated" date',
                action: 'Add "Last Updated: January 16, 2026" at the top or bottom of article',
                impact: 'Recent content gets 2x more AI citations - freshness is critical'
            });
        } else {
            strengths.push('Has Last Updated date');
        }

        // 5. Check for FAQ section or Q&A format
        const hasQuestions = /<h[2-3][^>]*>[^<]*\?[^<]*<\/h[2-3]>/gi.test(html);
        const questionCount = (html.match(/<h[2-3][^>]*>[^<]*\?[^<]*<\/h[2-3]>/gi) || []).length;

        if (questionCount === 0) {
            score -= 15;
            issues.push('No Q&A format');
            recommendations.push({
                priority: 'HIGH',
                type: 'FAQ Section',
                issue: 'No question-based headings or FAQ section',
                action: 'Add a "Frequently Asked Questions" section with 3-5 common questions',
                impact: 'Enables FAQ schema + 36% higher AI citation rate'
            });
        } else if (questionCount < 3) {
            score -= 8;
            issues.push(`Only ${questionCount} question(s)`);
            recommendations.push({
                priority: 'MEDIUM',
                type: 'FAQ Section',
                issue: `Only ${questionCount} question heading(s) found`,
                action: 'Add 2-3 more question-based headings',
                impact: 'More questions = more FAQ schema entries = more citations'
            });
        } else {
            strengths.push(`${questionCount} question headings`);
        }

        // 6. Check for external authority links
        const externalLinks = html.match(/<a[^>]+href=["']https?:\/\/(?!dataengineerhub)[^"']+["']/gi) || [];
        const authorityDomains = externalLinks.filter(link =>
            /docs\.snowflake|aws\.amazon|cloud\.google|microsoft\.com|github\.com|wikipedia\.org|arxiv\.org/i.test(link)
        );

        if (authorityDomains.length === 0) {
            score -= 10;
            issues.push('No authority citations');
            recommendations.push({
                priority: 'MEDIUM',
                type: 'Citations',
                issue: 'No links to authoritative sources',
                action: 'Add 2-3 links to official documentation or research',
                impact: 'E-E-A-T signals - builds trust with AI systems'
            });
        } else if (authorityDomains.length < 3) {
            score -= 5;
            issues.push(`Only ${authorityDomains.length} authority link(s)`);
        } else {
            strengths.push(`${authorityDomains.length} authority citations`);
        }

        // 7. Check content length
        const wordCount = plainContent.split(/\s+/).length;
        if (wordCount < 800) {
            score -= 10;
            issues.push('Content too short');
            recommendations.push({
                priority: 'MEDIUM',
                type: 'Content Length',
                issue: `Only ${wordCount} words (minimum 800 recommended)`,
                action: 'Expand content with more examples, use cases, or detailed explanations',
                impact: 'Longer, comprehensive content gets cited more often'
            });
        } else if (wordCount >= 1500) {
            strengths.push(`${wordCount} words (comprehensive)`);
        }

        // 8. Check for code examples
        const codeBlocks = (html.match(/<pre|<code/gi) || []).length;
        if (codeBlocks === 0 && /snowflake|sql|python|javascript|data|code|script/i.test(plainContent)) {
            score -= 8;
            issues.push('No code examples');
            recommendations.push({
                priority: 'LOW',
                type: 'Code Examples',
                issue: 'Technical article without code examples',
                action: 'Add 2-3 code snippets showing implementation',
                impact: 'Code examples make content more actionable and citable'
            });
        } else if (codeBlocks >= 3) {
            strengths.push(`${codeBlocks} code examples`);
        }

        // Calculate final score (0-100)
        score = Math.max(0, Math.min(100, score));

        return {
            url,
            score,
            wordCount,
            statistics: uniqueStats.length,
            tables,
            questions: questionCount,
            externalLinks: externalLinks.length,
            authorityLinks: authorityDomains.length,
            codeBlocks,
            hasTLDR,
            hasLastUpdated,
            issues,
            strengths,
            recommendations: recommendations.sort((a, b) => {
                const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                return priority[a.priority] - priority[b.priority];
            })
        };
    }

    // Fetch and analyze URL
    async analyzeURL(url) {
        try {
            // Validate URL
            if (!url || !url.startsWith('http')) {
                throw new Error('Invalid URL. Please enter a valid HTTP/HTTPS URL.');
            }

            // Fetch content (with CORS proxy for external URLs)
            const fetchUrl = url.includes('dataengineerhub.blog') ? url : `${this.corsProxy}${encodeURIComponent(url)}`;

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();

            // Analyze content
            const analysis = this.analyzeContent(html, url);

            return {
                success: true,
                data: analysis
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new ContentOptimizerService();
