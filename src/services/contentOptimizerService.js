// Content Optimizer Service
// Analyzes URLs for AI citation optimization

class ContentOptimizerService {
    constructor() {
        // Use a more reliable CORS proxy
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        this.currentProxyIndex = 0;
    }

    // Strip HTML tags
    stripHTML(html) {
        if (!html) return '';
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
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

    // Extract domain from URL
    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return '';
        }
    }

    // Extract keywords from content
    extractKeywords(content) {
        // Remove common words and extract meaningful keywords
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

        const words = content.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !commonWords.has(w));

        // Count frequency
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);

        // Get top 10 keywords
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    // Generate competitor suggestions
    generateCompetitorSuggestions(keywords, currentUrl) {
        const domain = this.getDomain(currentUrl);
        const suggestions = [];

        // Common competitor domains for different niches
        const competitorDomains = {
            'data': ['towardsdatascience.com', 'kdnuggets.com', 'analyticsvidhya.com'],
            'snowflake': ['medium.com', 'dev.to', 'hashnode.dev'],
            'engineering': ['stackoverflow.blog', 'dev.to', 'hackernoon.com'],
            'tutorial': ['freecodecamp.org', 'digitalocean.com', 'css-tricks.com'],
            'guide': ['smashingmagazine.com', 'sitepoint.com', 'webdev.com']
        };

        // Find relevant competitor domains based on keywords
        const relevantDomains = new Set();
        keywords.forEach(keyword => {
            Object.entries(competitorDomains).forEach(([topic, domains]) => {
                if (keyword.includes(topic)) {
                    domains.forEach(d => relevantDomains.add(d));
                }
            });
        });

        // If no specific matches, use general tech domains
        if (relevantDomains.size === 0) {
            ['medium.com', 'dev.to', 'hashnode.dev'].forEach(d => relevantDomains.add(d));
        }

        // Generate search URLs
        const topKeywords = keywords.slice(0, 3).join(' ');
        Array.from(relevantDomains).slice(0, 3).forEach(domain => {
            suggestions.push({
                domain,
                searchUrl: `https://www.google.com/search?q=site:${domain}+${encodeURIComponent(topKeywords)}`,
                reason: `Similar content about "${topKeywords}"`
            });
        });

        return suggestions;
    }

    // Calculate AI Visibility Score (0-100)
    calculateAIVisibility(analysis) {
        let visibility = 0;
        const factors = [];

        // Factor 1: Has TL;DR (20 points)
        if (analysis.hasTLDR) {
            visibility += 20;
            factors.push({ factor: 'TL;DR Summary', impact: '+20%', status: 'good' });
        } else {
            factors.push({ factor: 'TL;DR Summary', impact: '-20%', status: 'missing' });
        }

        // Factor 2: Question format (15 points)
        if (analysis.questions >= 3) {
            visibility += 15;
            factors.push({ factor: 'Q&A Format', impact: '+15%', status: 'good' });
        } else {
            factors.push({ factor: 'Q&A Format', impact: '-15%', status: 'weak' });
        }

        // Factor 3: Statistics (15 points)
        if (analysis.statistics >= 5) {
            visibility += 15;
            factors.push({ factor: 'Data & Statistics', impact: '+15%', status: 'good' });
        } else if (analysis.statistics >= 3) {
            visibility += 8;
            factors.push({ factor: 'Data & Statistics', impact: '+8%', status: 'moderate' });
        } else {
            factors.push({ factor: 'Data & Statistics', impact: '-15%', status: 'weak' });
        }

        // Factor 4: Authority links (15 points)
        if (analysis.authorityLinks >= 3) {
            visibility += 15;
            factors.push({ factor: 'Authority Citations', impact: '+15%', status: 'good' });
        } else if (analysis.authorityLinks > 0) {
            visibility += 7;
            factors.push({ factor: 'Authority Citations', impact: '+7%', status: 'moderate' });
        } else {
            factors.push({ factor: 'Authority Citations', impact: '-15%', status: 'missing' });
        }

        // Factor 5: Freshness (10 points)
        if (analysis.hasLastUpdated) {
            visibility += 10;
            factors.push({ factor: 'Freshness Signal', impact: '+10%', status: 'good' });
        } else {
            factors.push({ factor: 'Freshness Signal', impact: '-10%', status: 'missing' });
        }

        // Factor 6: Content depth (10 points)
        if (analysis.wordCount >= 1500) {
            visibility += 10;
            factors.push({ factor: 'Content Depth', impact: '+10%', status: 'good' });
        } else if (analysis.wordCount >= 800) {
            visibility += 5;
            factors.push({ factor: 'Content Depth', impact: '+5%', status: 'moderate' });
        } else {
            factors.push({ factor: 'Content Depth', impact: '-10%', status: 'weak' });
        }

        // Factor 7: Structured data (10 points)
        if (analysis.tables > 0) {
            visibility += 10;
            factors.push({ factor: 'Structured Data', impact: '+10%', status: 'good' });
        } else {
            factors.push({ factor: 'Structured Data', impact: '-10%', status: 'missing' });
        }

        // Factor 8: Code examples for technical content (5 points)
        if (analysis.codeBlocks >= 3) {
            visibility += 5;
            factors.push({ factor: 'Code Examples', impact: '+5%', status: 'good' });
        }

        return {
            score: Math.min(100, visibility),
            factors,
            citationProbability: visibility >= 80 ? 'Very High' : visibility >= 60 ? 'High' : visibility >= 40 ? 'Medium' : 'Low'
        };
    }

    // Analyze content for AI citation optimization
    analyzeContent(html, url) {
        const plainContent = this.stripHTML(html);
        const recommendations = [];
        const issues = [];
        const strengths = [];
        let score = 100;

        const currentDomain = this.getDomain(url);

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
                action: 'Add "Last Updated: January 17, 2026" at the top or bottom of article',
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

        // 6. Check for external and internal links
        const allLinks = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];

        let internalLinks = 0;
        let externalLinks = 0;
        let authorityLinks = 0;

        allLinks.forEach(link => {
            const hrefMatch = link.match(/href=["']([^"']+)["']/i);
            if (hrefMatch) {
                const href = hrefMatch[1];
                const linkDomain = this.getDomain(href);

                if (linkDomain === currentDomain || href.startsWith('/') || href.startsWith('#')) {
                    internalLinks++;
                } else if (linkDomain) {
                    externalLinks++;

                    // Check if it's an authority domain
                    if (/docs\.snowflake|aws\.amazon|cloud\.google|microsoft\.com|github\.com|wikipedia\.org|arxiv\.org|medium\.com/i.test(linkDomain)) {
                        authorityLinks++;
                    }
                }
            }
        });

        if (authorityLinks === 0) {
            score -= 10;
            issues.push('No authority citations');
            recommendations.push({
                priority: 'MEDIUM',
                type: 'Citations',
                issue: 'No links to authoritative sources',
                action: 'Add 2-3 links to official documentation or research',
                impact: 'E-E-A-T signals - builds trust with AI systems'
            });
        } else if (authorityLinks < 3) {
            score -= 5;
            issues.push(`Only ${authorityLinks} authority link(s)`);
        } else {
            strengths.push(`${authorityLinks} authority citations`);
        }

        if (internalLinks < 3) {
            score -= 5;
            issues.push(`Only ${internalLinks} internal link(s)`);
            recommendations.push({
                priority: 'LOW',
                type: 'Internal Links',
                issue: `Only ${internalLinks} internal links found`,
                action: 'Add 3-5 internal links to related articles',
                impact: 'Helps AI understand site structure and topic relationships'
            });
        } else {
            strengths.push(`${internalLinks} internal links`);
        }

        // 7. Check content length
        const wordCount = plainContent.split(/\s+/).filter(w => w.length > 0).length;
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

        // 🆕 UNIQUE CHECK 1: Snippet-Worthy Sentences
        const snippetPatterns = [
            /^[A-Z][^.!?]{20,150}[.!?]$/gm,  // Clear, concise sentences
            /(?:is|are|means|refers to|defined as)[^.]{10,100}\./gi  // Definition sentences
        ];
        let snippetSentences = 0;
        snippetPatterns.forEach(pattern => {
            const matches = plainContent.match(pattern) || [];
            snippetSentences += matches.length;
        });

        if (snippetSentences < 5) {
            score -= 5;
            issues.push('Few snippet-worthy sentences');
            recommendations.push({
                priority: 'MEDIUM',
                type: '🎯 Snippet Optimization',
                issue: `Only ${snippetSentences} clear, quotable sentences found`,
                action: 'Add 5-10 concise, definitive sentences (20-150 chars) that directly answer questions',
                impact: 'AI extracts clear, standalone sentences for answers - 40% more likely to be cited'
            });
        } else {
            strengths.push(`${snippetSentences} snippet-worthy sentences`);
        }

        // 🆕 UNIQUE CHECK 2: Voice Search Optimization
        const voiceSearchPhrases = plainContent.match(/(?:how to|what is|why does|when should|where can|who is)[^.?]{10,80}[.?]/gi) || [];
        if (voiceSearchPhrases.length < 3) {
            score -= 5;
            issues.push('Not optimized for voice search');
            recommendations.push({
                priority: 'LOW',
                type: '🎤 Voice Search',
                issue: `Only ${voiceSearchPhrases.length} voice-search-friendly phrases`,
                action: 'Add natural language questions as headings: "How to...", "What is...", "Why does..."',
                impact: 'Voice assistants prefer conversational content - growing 30% YoY'
            });
        } else {
            strengths.push(`${voiceSearchPhrases.length} voice-search phrases`);
        }

        // 🆕 UNIQUE CHECK 3: Featured Snippet Potential
        const listItems = (html.match(/<li>/gi) || []).length;
        const hasNumberedSteps = /(?:step \d|\d\.|first|second|third|finally)/gi.test(plainContent);
        const hasDefinition = /(?:is defined as|refers to|means that|is a)/gi.test(plainContent);

        let snippetScore = 0;
        if (listItems >= 3) snippetScore++;
        if (hasNumberedSteps) snippetScore++;
        if (hasDefinition) snippetScore++;
        if (tables > 0) snippetScore++;

        if (snippetScore < 2) {
            score -= 7;
            issues.push('Low featured snippet potential');
            recommendations.push({
                priority: 'HIGH',
                type: '⭐ Featured Snippet',
                issue: 'Content not structured for featured snippets',
                action: 'Add: (1) Clear definition paragraph, (2) Numbered list of steps, (3) Comparison table',
                impact: 'Featured snippets get 35% CTR - AI heavily favors this format'
            });
        } else {
            strengths.push('Featured snippet ready');
        }

        // 🆕 UNIQUE CHECK 4: Conversational Tone
        const conversationalMarkers = plainContent.match(/(?:you can|you should|you'll|let's|here's|we'll|imagine|think about)/gi) || [];
        const questionMarks = (plainContent.match(/\?/g) || []).length;
        const conversationScore = conversationalMarkers.length + questionMarks;

        if (conversationScore < 5) {
            score -= 4;
            issues.push('Formal tone (not AI-friendly)');
            recommendations.push({
                priority: 'LOW',
                type: '💬 Conversational Tone',
                issue: 'Content is too formal or academic',
                action: 'Use "you", "we", "let\'s" - write like you\'re explaining to a colleague',
                impact: 'AI prefers conversational content that matches how people ask questions'
            });
        } else {
            strengths.push('Conversational tone');
        }

        // 🆕 UNIQUE CHECK 5: Semantic Keyword Clustering
        const keywords = this.extractKeywords(plainContent);
        const hasSemanticVariations = keywords.length >= 8;

        if (!hasSemanticVariations) {
            score -= 5;
            issues.push('Limited semantic keywords');
            recommendations.push({
                priority: 'MEDIUM',
                type: '🔍 Semantic SEO',
                issue: `Only ${keywords.length} unique topic keywords found`,
                action: 'Add related terms, synonyms, and variations of your main topic (aim for 10+)',
                impact: 'AI understands context through semantic relationships - improves topic authority'
            });
        } else {
            strengths.push(`${keywords.length} semantic keywords`);
        }

        // Calculate final score (0-100)
        score = Math.max(0, Math.min(100, score));

        const analysis = {
            url,
            score,
            wordCount,
            statistics: uniqueStats.length,
            tables,
            questions: questionCount,
            internalLinks,
            externalLinks,
            authorityLinks,
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

        // Calculate AI Visibility Score
        const aiVisibility = this.calculateAIVisibility(analysis);
        analysis.aiVisibility = aiVisibility;

        // Generate competitor suggestions
        const competitorSuggestions = this.generateCompetitorSuggestions(keywords, url);
        analysis.competitorSuggestions = competitorSuggestions;
        analysis.keywords = keywords;

        return analysis;
    }

    // Fetch and analyze URL with fallback proxies
    async analyzeURL(url) {
        try {
            // Validate URL
            if (!url || !url.startsWith('http')) {
                throw new Error('Invalid URL. Please enter a valid HTTP/HTTPS URL.');
            }

            // Try direct fetch first for same-origin URLs
            let html;
            let fetchUrl = url;

            // Check if scanning current page (bypass fetch/CORS)
            if (url === window.location.href || url === 'current') {
                html = document.documentElement.outerHTML;
            }
            // If it's an external URL, use CORS proxy
            else if (!url.includes(window.location.hostname)) {
                fetchUrl = `${this.corsProxies[this.currentProxyIndex]}${encodeURIComponent(url)}`;

                try {
                    const response = await fetch(fetchUrl, {
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        },
                        mode: 'cors'
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    html = await response.text();

                    // Check if we got actual HTML content
                    if (!html || html.length < 100 || !html.includes('<')) {
                        throw new Error('Invalid HTML content received');
                    }
                } catch (proxyError) {
                    // Try next proxy
                    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;

                    if (this.currentProxyIndex === 0) {
                        // We've tried all proxies
                        throw new Error(`Failed to fetch URL. The page may be blocking automated access. Error: ${proxyError.message}`);
                    }

                    // Retry with next proxy
                    return this.analyzeURL(url);
                }
            } else {
                // Same origin fetch
                const response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                html = await response.text();
            }

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
