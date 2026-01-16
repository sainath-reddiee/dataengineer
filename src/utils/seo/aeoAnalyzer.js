// src/utils/seo/aeoAnalyzer.js
/**
 * Answer Engine Optimization (AEO) Analyzer
 * Analyzes content for featured snippets, voice search, and Q&A optimization
 */

import { SEVERITY } from './seoScanner';

export const AEO_CATEGORIES = {
    FEATURED_SNIPPET: 'Featured Snippet Potential',
    QA_FORMAT: 'Q&A Formatting',
    VOICE_SEARCH: 'Voice Search Optimization',
    FAQ_SCHEMA: 'FAQ Schema',
    DIRECT_ANSWERS: 'Direct Answer Formatting'
};

export class AEOAnalyzer {
    constructor() {
        this.checks = [];
        this.score = 0;
    }

    analyze(article, doc = null) {
        this.checks = [];
        this.article = article;
        const content = article.content || '';

        this.checkFeaturedSnippetPotential(content);
        this.checkQuestionBasedHeadings(content);
        this.checkListFormatting(content);
        this.checkFAQSchema(content);
        this.checkVoiceSearchOptimization(content);
        this.checkParagraphLength(content);

        this.calculateScore();
        return this.getReport();
    }

    addCheck(name, category, severity, message, recommendation = null, details = null) {
        this.checks.push({ name, category, severity, message, recommendation, details, passed: severity === SEVERITY.GOOD });
    }

    checkFeaturedSnippetPotential(content) {
        const indicators = {
            definitionPattern: /(?:is|are|means?|refers? to)\s+[^.]{20,200}\./i.test(content),
            numberList: /<ol|step 1/i.test(content),
            bulletList: /<ul/i.test(content),
            table: /<table/i.test(content)
        };
        const score = Object.values(indicators).filter(Boolean).length;

        if (score >= 2) {
            this.addCheck('Snippet Potential', AEO_CATEGORIES.FEATURED_SNIPPET, SEVERITY.GOOD, 'High featured snippet potential', null, indicators);
        } else {
            this.addCheck('Snippet Potential', AEO_CATEGORIES.FEATURED_SNIPPET, SEVERITY.WARNING, 'Low snippet potential', 'Add definitions, lists, or tables', indicators);
        }
    }

    checkQuestionBasedHeadings(content) {
        const headings = content.match(/<h[2-4][^>]*>[^<]+<\/h[2-4]>/gi) || [];
        const questions = headings.filter(h => /^(what|why|how|when|where|who|can|is)\s/i.test(h.replace(/<[^>]+>/g, '')));

        if (questions.length >= 2) {
            this.addCheck('Question Headings', AEO_CATEGORIES.QA_FORMAT, SEVERITY.GOOD, `${questions.length} question headings`, null);
        } else {
            this.addCheck('Question Headings', AEO_CATEGORIES.QA_FORMAT, SEVERITY.WARNING, 'Few question headings', 'Use "What is X?", "How to Y?"');
        }
    }

    checkListFormatting(content) {
        const lists = (content.match(/<[ou]l/gi) || []).length;
        if (lists >= 1) {
            this.addCheck('List Formatting', AEO_CATEGORIES.FEATURED_SNIPPET, SEVERITY.GOOD, `${lists} list(s) found`, null);
        } else {
            this.addCheck('List Formatting', AEO_CATEGORIES.FEATURED_SNIPPET, SEVERITY.WARNING, 'No lists found', 'Add numbered/bullet lists');
        }
    }

    checkFAQSchema(content) {
        const hasFAQ = content.includes('FAQPage') || content.includes('"@type":"Question"');
        if (hasFAQ) {
            this.addCheck('FAQ Schema', AEO_CATEGORIES.FAQ_SCHEMA, SEVERITY.GOOD, 'FAQ schema detected', null);
        } else {
            this.addCheck('FAQ Schema', AEO_CATEGORIES.FAQ_SCHEMA, SEVERITY.INFO, 'No FAQ schema', 'Add FAQPage schema for rich results');
        }
    }

    checkVoiceSearchOptimization(content) {
        const title = this.article.title || '';
        const conversational = /^(how|what|why|when|where|who)\s/i.test(title);
        if (conversational) {
            this.addCheck('Voice Search', AEO_CATEGORIES.VOICE_SEARCH, SEVERITY.GOOD, 'Conversational title', null);
        } else {
            this.addCheck('Voice Search', AEO_CATEGORIES.VOICE_SEARCH, SEVERITY.INFO, 'Title not conversational', 'Use question-format titles');
        }
    }

    checkParagraphLength(content) {
        const paragraphs = content.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
        const short = paragraphs.filter(p => p.replace(/<[^>]+>/g, '').length <= 300).length;
        const ratio = paragraphs.length > 0 ? short / paragraphs.length : 0;

        if (ratio >= 0.5) {
            this.addCheck('Paragraph Length', AEO_CATEGORIES.FEATURED_SNIPPET, SEVERITY.GOOD, 'Good paragraph lengths', null);
        } else {
            this.addCheck('Paragraph Length', AEO_CATEGORIES.FEATURED_SNIPPET, SEVERITY.INFO, 'Paragraphs may be long', 'Use shorter paragraphs');
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
            type: 'AEO',
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

export default AEOAnalyzer;
