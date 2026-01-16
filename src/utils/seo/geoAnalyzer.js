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

        this.checkAIReadability(content);
        this.checkStructuredData(content);
        this.checkEntityOptimization(content);
        this.checkSemanticHTML(content);
        this.checkTopicAuthority(content);
        this.checkCitationWorthiness(content);
        this.checkContentComprehensiveness(content);
        this.checkClearDefinitions(content);

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
