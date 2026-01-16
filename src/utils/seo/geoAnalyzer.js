// src/utils/seo/geoAnalyzer.js
/**
 * Generative Engine Optimization (GEO) Analyzer
 * Analyzes content for AI-readability, structured data, and entity optimization
 */

import { SEVERITY } from './seoScanner';

export const GEO_CATEGORIES = {
    AI_READABILITY: 'AI Readability',
    STRUCTURED_DATA: 'Structured Data',
    ENTITIES: 'Entity Optimization',
    SEMANTIC: 'Semantic HTML',
    AUTHORITY: 'Topic Authority'
};

export class GEOAnalyzer {
    constructor() {
        this.checks = [];
        this.score = 0;
    }

    analyze(article, doc = null) {
        this.checks = [];
        this.article = article;
        const content = article.content || '';

        // Existing checks
        this.checkAIReadability(content);
        this.checkStructuredData(content);
        this.checkEntityOptimization(content);
        this.checkSemanticHTML(content);
        this.checkTopicAuthority(content);
        this.checkCitationWorthiness(content);
        this.checkContentComprehensiveness(content);
        this.checkClearDefinitions(content);

        // Phase 1: New AI Citation Checks
        this.checkTLDRSummary(content);
        this.checkDataTables(content);
        this.checkStatistics(content);
        this.checkLastUpdated(content);
        this.checkFirstAnswerLength(content);
        this.checkExternalCitations(content);

        this.calculateScore();
        return this.getReport();
    }

    addCheck(name, category, severity, message, recommendation = null, details = null) {
        this.checks.push({ name, category, severity, message, recommendation, details, passed: severity === SEVERITY.GOOD });
    }

    checkAIReadability(content) {
        // AI models prefer clear, structured content
        const indicators = {
            hasHeadings: /<h[2-6]/i.test(content),
            hasLists: /<[ou]l/i.test(content),
            hasParagraphs: /<p/i.test(content),
            hasCodeBlocks: /<pre|<code/i.test(content),
            clearSentences: content.split(/[.!?]/).filter(s => s.trim().length > 10 && s.trim().length < 200).length >= 5
        };
        const score = Object.values(indicators).filter(Boolean).length;

        if (score >= 4) {
            this.addCheck('AI Readability', GEO_CATEGORIES.AI_READABILITY, SEVERITY.GOOD, 'Content is AI-readable', null, indicators);
        } else if (score >= 2) {
            this.addCheck('AI Readability', GEO_CATEGORIES.AI_READABILITY, SEVERITY.INFO, 'Moderate AI readability', 'Add more structure (headings, lists)', indicators);
        } else {
            this.addCheck('AI Readability', GEO_CATEGORIES.AI_READABILITY, SEVERITY.WARNING, 'Low AI readability', 'Structure content with headings, lists, paragraphs', indicators);
        }
    }

    checkStructuredData(content) {
        const schemaTypes = [];
        const patterns = [
            { type: 'Article', pattern: /"@type"\s*:\s*"Article"/i },
            { type: 'FAQPage', pattern: /FAQPage/i },
            { type: 'HowTo', pattern: /"@type"\s*:\s*"HowTo"/i },
            { type: 'BreadcrumbList', pattern: /BreadcrumbList/i },
            { type: 'Organization', pattern: /"@type"\s*:\s*"Organization"/i },
        ];

        patterns.forEach(({ type, pattern }) => {
            if (pattern.test(content)) schemaTypes.push(type);
        });

        if (schemaTypes.length >= 2) {
            this.addCheck('Structured Data', GEO_CATEGORIES.STRUCTURED_DATA, SEVERITY.GOOD, `Rich schema: ${schemaTypes.join(', ')}`, null, { schemaTypes });
        } else if (schemaTypes.length === 1) {
            this.addCheck('Structured Data', GEO_CATEGORIES.STRUCTURED_DATA, SEVERITY.INFO, `Schema found: ${schemaTypes[0]}`, 'Add more schema types (FAQ, HowTo)', { schemaTypes });
        } else {
            this.addCheck('Structured Data', GEO_CATEGORIES.STRUCTURED_DATA, SEVERITY.WARNING, 'No schema markup detected', 'Add JSON-LD structured data', null);
        }
    }

    checkEntityOptimization(content) {
        // Check for entity-rich content (proper nouns, technical terms)
        const entityPatterns = [
            /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, // Proper nouns
            /\b(?:Snowflake|AWS|Azure|Python|SQL|dbt|Airflow|Databricks|Kafka|Spark)\b/gi, // Tech entities
        ];

        let entityCount = 0;
        entityPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            entityCount += matches.length;
        });

        if (entityCount >= 10) {
            this.addCheck('Entity Density', GEO_CATEGORIES.ENTITIES, SEVERITY.GOOD, `Rich entity content (${entityCount}+ entities)`, null, { count: entityCount });
        } else if (entityCount >= 3) {
            this.addCheck('Entity Density', GEO_CATEGORIES.ENTITIES, SEVERITY.INFO, `Moderate entities (${entityCount})`, 'Reference more tools, brands, concepts', { count: entityCount });
        } else {
            this.addCheck('Entity Density', GEO_CATEGORIES.ENTITIES, SEVERITY.INFO, 'Low entity density', 'Add specific tools, technologies, brands', null);
        }
    }

    checkSemanticHTML(content) {
        const semanticElements = {
            article: /<article/i.test(content),
            section: /<section/i.test(content),
            header: /<header/i.test(content),
            nav: /<nav/i.test(content),
            main: /<main/i.test(content),
            aside: /<aside/i.test(content),
            figure: /<figure/i.test(content),
        };
        const count = Object.values(semanticElements).filter(Boolean).length;

        if (count >= 3) {
            this.addCheck('Semantic HTML', GEO_CATEGORIES.SEMANTIC, SEVERITY.GOOD, `Good semantic structure (${count} elements)`, null, semanticElements);
        } else if (count >= 1) {
            this.addCheck('Semantic HTML', GEO_CATEGORIES.SEMANTIC, SEVERITY.INFO, `Limited semantics (${count} elements)`, 'Use more semantic HTML5 tags', semanticElements);
        } else {
            this.addCheck('Semantic HTML', GEO_CATEGORIES.SEMANTIC, SEVERITY.INFO, 'No semantic elements detected', 'Wrap content in semantic tags', null);
        }
    }

    checkTopicAuthority(content) {
        const title = this.article.title || '';
        const wordCount = content.split(/\s+/).length;
        const hasExpertSignals = /expert|professional|years of experience|guide|complete|comprehensive/i.test(content + title);
        const hasDataSignals = /according to|research|study|statistics|data shows|benchmark/i.test(content);

        const authorityScore = [wordCount >= 1000, hasExpertSignals, hasDataSignals].filter(Boolean).length;

        if (authorityScore >= 2) {
            this.addCheck('Topic Authority', GEO_CATEGORIES.AUTHORITY, SEVERITY.GOOD, 'Strong authority signals', null, { wordCount, hasExpertSignals, hasDataSignals });
        } else {
            this.addCheck('Topic Authority', GEO_CATEGORIES.AUTHORITY, SEVERITY.INFO, 'Limited authority signals', 'Add expert insights and data references', { wordCount });
        }
    }

    checkCitationWorthiness(content) {
        // Content that AI models would cite
        const indicators = {
            hasStats: /\d+%|\d+\s*(million|billion|thousand)/i.test(content),
            hasQuotes: /<blockquote|"[^"]{20,}"/i.test(content),
            hasUniqueInsight: /however|in contrast|importantly|notably|surprisingly/i.test(content),
            hasConclusion: /conclusion|summary|key takeaway|in summary/i.test(content)
        };
        const score = Object.values(indicators).filter(Boolean).length;

        if (score >= 2) {
            this.addCheck('Citation Worthiness', GEO_CATEGORIES.AUTHORITY, SEVERITY.GOOD, 'Content is citation-worthy', null, indicators);
        } else {
            this.addCheck('Citation Worthiness', GEO_CATEGORIES.AUTHORITY, SEVERITY.INFO, 'Limited citation signals', 'Add stats, quotes, unique insights', indicators);
        }
    }

    checkContentComprehensiveness(content) {
        const wordCount = content.split(/\s+/).length;
        const headingCount = (content.match(/<h[2-6]/gi) || []).length;
        const sectionDepth = headingCount >= 5;

        if (wordCount >= 1500 && sectionDepth) {
            this.addCheck('Comprehensiveness', GEO_CATEGORIES.AI_READABILITY, SEVERITY.GOOD, `Comprehensive content (${wordCount} words, ${headingCount} sections)`, null);
        } else if (wordCount >= 800) {
            this.addCheck('Comprehensiveness', GEO_CATEGORIES.AI_READABILITY, SEVERITY.INFO, `Moderate depth (${wordCount} words)`, 'Expand with more sections', { wordCount });
        } else {
            this.addCheck('Comprehensiveness', GEO_CATEGORIES.AI_READABILITY, SEVERITY.WARNING, `Thin content (${wordCount} words)`, 'Expand to 1000+ words', { wordCount });
        }
    }

    checkClearDefinitions(content) {
        const definitionPatterns = /(?:is defined as|refers to|means|is a|are)\s+/gi;
        const definitions = (content.match(definitionPatterns) || []).length;

        if (definitions >= 3) {
            this.addCheck('Clear Definitions', GEO_CATEGORIES.AI_READABILITY, SEVERITY.GOOD, `${definitions} clear definitions`, null);
        } else if (definitions >= 1) {
            this.addCheck('Clear Definitions', GEO_CATEGORIES.AI_READABILITY, SEVERITY.INFO, `${definitions} definition(s)`, 'Add more "X is Y" definitions');
        } else {
            this.addCheck('Clear Definitions', GEO_CATEGORIES.AI_READABILITY, SEVERITY.INFO, 'No clear definitions', 'Define key terms explicitly');
        }
    }

    // ============================================================================
    // PHASE 1: AI CITATION OPTIMIZATION CHECKS
    // ============================================================================

    checkTLDRSummary(content) {
        // Check for TL;DR or summary at beginning
        const hasTLDR = /(?:^|\n|<p>)(TL;?DR|Summary|Key Takeaways?|In Brief)[:;.\s]/i.test(content);
        const firstParagraph = content.match(/<p[^>]*>([^<]+)<\/p>/i);
        const hasOpeningSummary = firstParagraph && firstParagraph[1].split('.').length >= 2;

        if (hasTLDR) {
            this.addCheck(
                'TL;DR Summary',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.GOOD,
                'TL;DR/Summary found - AI can extract key points',
                null,
                { hasTLDR: true }
            );
        } else if (hasOpeningSummary) {
            this.addCheck(
                'TL;DR Summary',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.INFO,
                'Opening summary exists but no TL;DR label',
                'Add "TL;DR:" or "Key Takeaways:" label at start for better AI extraction'
            );
        } else {
            this.addCheck(
                'TL;DR Summary',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.WARNING,
                'Missing TL;DR summary',
                'Add 2-3 sentence summary at article start with "TL;DR:" label'
            );
        }
    }

    checkDataTables(content) {
        const tables = (content.match(/<table/gi) || []).length;
        const hasTableHeaders = /<th/i.test(content);

        if (tables >= 1 && hasTableHeaders) {
            this.addCheck(
                'Data Tables',
                GEO_CATEGORIES.STRUCTURED_DATA,
                SEVERITY.GOOD,
                `${tables} structured table(s) - AI can cite tabular data`,
                null,
                { tableCount: tables, hasHeaders: true }
            );
        } else if (tables >= 1) {
            this.addCheck(
                'Data Tables',
                GEO_CATEGORIES.STRUCTURED_DATA,
                SEVERITY.INFO,
                `${tables} table(s) found but missing headers`,
                'Add <th> headers to tables for better AI understanding'
            );
        } else {
            this.addCheck(
                'Data Tables',
                GEO_CATEGORIES.STRUCTURED_DATA,
                SEVERITY.INFO,
                'No data tables found',
                'Add comparison/data tables for AI citation (e.g., tool comparisons, benchmarks)'
            );
        }
    }

    checkStatistics(content) {
        // Match percentages, large numbers, and measurements
        const statPatterns = [
            /\d+(?:\.\d+)?%/g,  // Percentages: 40%, 3.5%
            /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|MB|GB|TB|ms|seconds?|minutes?|hours?)/gi,  // Large numbers with units
            /\$\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|thousand|k|M|B))?/gi  // Money amounts
        ];

        let allStats = [];
        statPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            allStats = allStats.concat(matches);
        });

        // Remove duplicates
        const uniqueStats = [...new Set(allStats)];

        if (uniqueStats.length >= 5) {
            this.addCheck(
                'Statistics & Data',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.GOOD,
                `${uniqueStats.length} statistics found - highly citable`,
                null,
                { count: uniqueStats.length, examples: uniqueStats.slice(0, 5) }
            );
        } else if (uniqueStats.length >= 2) {
            this.addCheck(
                'Statistics & Data',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.INFO,
                `${uniqueStats.length} statistics found`,
                'Add more specific numbers, percentages, or benchmarks for AI citation',
                { count: uniqueStats.length }
            );
        } else {
            this.addCheck(
                'Statistics & Data',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.WARNING,
                'Few or no statistics',
                'Add specific numbers, percentages, benchmarks (e.g., "40% faster", "$30K/month")'
            );
        }
    }

    checkLastUpdated(content) {
        // Check for visible last updated date
        const hasVisibleDate = /(?:last |recently )?updated:?\s*(?:on\s*)?(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i.test(content);
        // Check for schema dateModified
        const hasSchemaDate = /dateModified|datePublished/i.test(content);

        if (hasVisibleDate && hasSchemaDate) {
            this.addCheck(
                'Freshness Signals',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.GOOD,
                'Last updated date visible + schema markup',
                null,
                { visible: true, schema: true }
            );
        } else if (hasVisibleDate || hasSchemaDate) {
            this.addCheck(
                'Freshness Signals',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.INFO,
                hasVisibleDate ? 'Date visible but no schema' : 'Schema date but not visible',
                hasVisibleDate ? 'Add dateModified to Article schema' : 'Add visible "Last Updated: [DATE]" on page'
            );
        } else {
            this.addCheck(
                'Freshness Signals',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.WARNING,
                'No freshness signals',
                'Add visible "Last Updated: [DATE]" and dateModified schema property'
            );
        }
    }

    checkFirstAnswerLength(content) {
        // Find question headings followed by paragraphs
        const questionPattern = /<h[2-3][^>]*>([^<]*\?[^<]*)<\/h[2-3]>\s*<p[^>]*>([^<]+)<\/p>/gi;
        const matches = [...content.matchAll(questionPattern)];

        if (matches.length === 0) {
            this.addCheck(
                'Answer Format',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.INFO,
                'No question-answer format detected',
                'Use question headings ("What is X?") followed by direct answers'
            );
            return;
        }

        // Check first answer length
        const firstAnswer = matches[0][2];
        const wordCount = firstAnswer.trim().split(/\s+/).length;

        if (wordCount >= 40 && wordCount <= 80) {
            this.addCheck(
                'Answer Format',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.GOOD,
                `Perfect answer length (${wordCount} words) - ideal for AI snippets`,
                null,
                { wordCount, questionCount: matches.length }
            );
        } else if (wordCount < 40) {
            this.addCheck(
                'Answer Format',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.INFO,
                `Answer may be too brief (${wordCount} words)`,
                'Expand first answer to 40-60 words for better AI extraction',
                { wordCount }
            );
        } else {
            this.addCheck(
                'Answer Format',
                GEO_CATEGORIES.AI_READABILITY,
                SEVERITY.INFO,
                `Answer may be too long (${wordCount} words)`,
                'Keep first answer concise (40-60 words), then elaborate below',
                { wordCount }
            );
        }
    }

    checkExternalCitations(content) {
        // Find external links (not to own domain)
        const externalLinks = content.match(/<a[^>]+href=["']https?:\/\/(?!dataengineerhub)[^"']+["']/gi) || [];

        // Check for authority domains
        const authorityDomains = externalLinks.filter(link =>
            /docs\.snowflake|aws\.amazon|cloud\.google|microsoft\.com|github\.com|wikipedia\.org|arxiv\.org|medium\.com|towardsdatascience/i.test(link)
        );

        if (authorityDomains.length >= 3) {
            this.addCheck(
                'Source Citations',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.GOOD,
                `${authorityDomains.length} authority citations - builds trust`,
                null,
                { total: externalLinks.length, authority: authorityDomains.length }
            );
        } else if (authorityDomains.length >= 1) {
            this.addCheck(
                'Source Citations',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.INFO,
                `${authorityDomains.length} authority citation(s)`,
                'Add more links to official docs, research papers, or trusted sources',
                { authority: authorityDomains.length }
            );
        } else if (externalLinks.length >= 1) {
            this.addCheck(
                'Source Citations',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.INFO,
                `${externalLinks.length} external link(s) but no authority sources`,
                'Link to official documentation (Snowflake docs, AWS, etc.)'
            );
        } else {
            this.addCheck(
                'Source Citations',
                GEO_CATEGORIES.AUTHORITY,
                SEVERITY.WARNING,
                'No external citations',
                'Add links to official documentation, research, or trusted sources'
            );
        }
    }

    calculateScore() {
        const weights = { [SEVERITY.CRITICAL]: 0, [SEVERITY.WARNING]: 0.3, [SEVERITY.GOOD]: 1, [SEVERITY.INFO]: 0.6 };
        const total = this.checks.length;
        if (total === 0) { this.score = 0; return; }
        const raw = this.checks.reduce((acc, c) => acc + (weights[c.severity] || 0), 0);
        this.score = Math.round((raw / total) * 100);
    }

    getReport() {
        return {
            type: 'GEO',
            score: this.score,
            grade: this.score >= 80 ? 'A' : this.score >= 60 ? 'B' : this.score >= 40 ? 'C' : 'D',
            summary: {
                total: this.checks.length,
                good: this.checks.filter(c => c.severity === SEVERITY.GOOD).length,
                warning: this.checks.filter(c => c.severity === SEVERITY.WARNING).length
            },
            checks: this.checks,
            analyzedAt: new Date().toISOString()
        };
    }
}

export default GEOAnalyzer;
