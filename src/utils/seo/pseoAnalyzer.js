// src/utils/seo/pseoAnalyzer.js
/**
 * Programmatic SEO (PSEO) Analyzer
 * Analyzes content for programmatic SEO patterns and scalability
 */

import { SEVERITY } from './seoScanner';

export const PSEO_CATEGORIES = {
    TEMPLATE: 'Template Consistency',
    AUTOMATION: 'Automation Quality',
    SCALABILITY: 'Scalability',
    TAXONOMY: 'Taxonomy Health',
    LINKING: 'Internal Linking Matrix'
};

/**
 * PSEO Analyzer class
 */
export class PSEOAnalyzer {
    constructor() {
        this.checks = [];
        this.score = 0;
    }

    /**
     * Analyze content for PSEO patterns
     * @param {Object} article - Article data with title, content, category, tags, etc.
     * @param {Array} allArticles - All articles for comparison (optional)
     */
    analyze(article, allArticles = []) {
        this.checks = [];
        this.article = article;
        this.allArticles = allArticles;

        // Run PSEO checks
        this.checkTemplateConsistency();
        this.checkTitlePattern();
        this.checkContentStructure();
        this.checkMetadataCompleteness();
        this.checkCategoryTaxonomy();
        this.checkTagUsage();
        this.checkInternalLinkingMatrix();
        this.checkURLTemplating();
        this.checkContentAutomationQuality();
        this.checkScalabilityPatterns();

        this.calculateScore();
        return this.getReport();
    }

    addCheck(name, category, severity, message, recommendation = null, details = null) {
        this.checks.push({
            name,
            category,
            severity,
            message,
            recommendation,
            details,
            passed: severity === SEVERITY.GOOD
        });
    }

    // ============================================================================
    // TEMPLATE CONSISTENCY CHECKS
    // ============================================================================

    checkTemplateConsistency() {
        const title = this.article.title || '';
        const content = this.article.content || '';

        // Check for template patterns in title
        const templatePatterns = [
            /^(.+):\s*(.+)$/,           // "Topic: Subtitle"
            /^(.+)\s*-\s*(.+)$/,        // "Topic - Subtitle"
            /^How to\s+(.+)/i,          // "How to..."
            /^What is\s+(.+)/i,         // "What is..."
            /^(.+)\s+Guide(\s|$)/i,     // "... Guide"
            /^Complete\s+(.+)/i,        // "Complete..."
            /^(.+)\s+Tutorial(\s|$)/i,  // "... Tutorial"
        ];

        const matchedPattern = templatePatterns.find(p => p.test(title));

        if (matchedPattern) {
            this.addCheck(
                'Title Template',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.GOOD,
                'Title follows a recognizable template pattern',
                null,
                { pattern: matchedPattern.toString(), title }
            );
        } else {
            this.addCheck(
                'Title Template',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.INFO,
                'Title doesn\'t follow common template patterns',
                'Consider using consistent title patterns for scalability',
                { title }
            );
        }

        // Check for consistent heading patterns
        const headingMatches = content.match(/<h[2-3][^>]*>([^<]+)<\/h[2-3]>/gi) || [];
        const headings = headingMatches.map(h => h.replace(/<\/?h[2-3][^>]*>/gi, ''));

        if (headings.length >= 3) {
            this.addCheck(
                'Heading Structure',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.GOOD,
                `Consistent heading structure (${headings.length} subheadings)`,
                null,
                { count: headings.length }
            );
        } else if (headings.length > 0) {
            this.addCheck(
                'Heading Structure',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.WARNING,
                `Only ${headings.length} subheading(s) found`,
                'Add more structured subheadings for better PSEO',
                { count: headings.length }
            );
        } else {
            this.addCheck(
                'Heading Structure',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.WARNING,
                'No subheadings found in content',
                'Add H2/H3 headings to structure content',
                null
            );
        }
    }

    checkTitlePattern() {
        if (this.allArticles.length < 2) return;

        // Analyze title patterns across all articles
        const titles = this.allArticles.map(a => a.title || '');
        const patterns = {
            colonPattern: titles.filter(t => t.includes(':')).length,
            dashPattern: titles.filter(t => t.includes(' - ')).length,
            howToPattern: titles.filter(t => /^how to/i.test(t)).length,
            guidePattern: titles.filter(t => /guide/i.test(t)).length,
        };

        const totalArticles = this.allArticles.length;
        const patternConsistency = Math.max(...Object.values(patterns)) / totalArticles;

        if (patternConsistency >= 0.6) {
            this.addCheck(
                'Cross-Article Title Consistency',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.GOOD,
                `High title pattern consistency (${Math.round(patternConsistency * 100)}%)`,
                null,
                { patterns }
            );
        } else if (patternConsistency >= 0.3) {
            this.addCheck(
                'Cross-Article Title Consistency',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.INFO,
                `Moderate title pattern consistency (${Math.round(patternConsistency * 100)}%)`,
                'Consider standardizing title formats for PSEO',
                { patterns }
            );
        } else {
            this.addCheck(
                'Cross-Article Title Consistency',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.WARNING,
                'Low title pattern consistency',
                'Standardize titles (e.g., "Topic: Complete Guide 2025")',
                { patterns }
            );
        }
    }

    // ============================================================================
    // CONTENT STRUCTURE CHECKS
    // ============================================================================

    checkContentStructure() {
        const content = this.article.content || '';

        // Check for structured content elements
        const hasCodeBlocks = /<pre|<code/.test(content);
        const hasLists = /<ul|<ol/.test(content);
        const hasTables = /<table/.test(content);
        const hasBlockquotes = /<blockquote/.test(content);

        const structuredElements = [hasCodeBlocks, hasLists, hasTables, hasBlockquotes].filter(Boolean).length;

        if (structuredElements >= 2) {
            this.addCheck(
                'Content Structure Variety',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.GOOD,
                `Rich content structure (${structuredElements} element types)`,
                null,
                { hasCodeBlocks, hasLists, hasTables, hasBlockquotes }
            );
        } else if (structuredElements === 1) {
            this.addCheck(
                'Content Structure Variety',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.INFO,
                'Limited content structure variety',
                'Add more structured elements (lists, tables, code blocks)',
                { hasCodeBlocks, hasLists, hasTables, hasBlockquotes }
            );
        } else {
            this.addCheck(
                'Content Structure Variety',
                PSEO_CATEGORIES.TEMPLATE,
                SEVERITY.WARNING,
                'No structured content elements found',
                'Add lists, tables, or code blocks for better engagement',
                null
            );
        }
    }

    checkMetadataCompleteness() {
        const requiredFields = ['title', 'excerpt', 'category', 'slug'];
        const optionalFields = ['tags', 'featuredImage', 'readTime'];

        const missingRequired = requiredFields.filter(f => !this.article[f]);
        const missingOptional = optionalFields.filter(f => !this.article[f]);

        if (missingRequired.length > 0) {
            this.addCheck(
                'Required Metadata',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.CRITICAL,
                `Missing required fields: ${missingRequired.join(', ')}`,
                'Ensure all required metadata is populated',
                { missing: missingRequired }
            );
        } else {
            this.addCheck(
                'Required Metadata',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.GOOD,
                'All required metadata present',
                null
            );
        }

        if (missingOptional.length > 0 && missingOptional.length < optionalFields.length) {
            this.addCheck(
                'Optional Metadata',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.INFO,
                `Missing optional fields: ${missingOptional.join(', ')}`,
                'Add optional metadata for better automation',
                { missing: missingOptional }
            );
        } else if (missingOptional.length === 0) {
            this.addCheck(
                'Optional Metadata',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.GOOD,
                'All optional metadata present',
                null
            );
        }
    }

    // ============================================================================
    // TAXONOMY CHECKS
    // ============================================================================

    checkCategoryTaxonomy() {
        const category = this.article.category || this.article.categoryName || '';

        if (!category) {
            this.addCheck(
                'Category Assignment',
                PSEO_CATEGORIES.TAXONOMY,
                SEVERITY.WARNING,
                'No category assigned',
                'Assign a category for proper content organization'
            );
            return;
        }

        // Check category depth/specificity
        if (this.allArticles.length > 0) {
            const categoryCount = this.allArticles.filter(
                a => (a.category || a.categoryName) === category
            ).length;

            const percentage = (categoryCount / this.allArticles.length) * 100;

            if (percentage > 50) {
                this.addCheck(
                    'Category Distribution',
                    PSEO_CATEGORIES.TAXONOMY,
                    SEVERITY.INFO,
                    `Category "${category}" has ${percentage.toFixed(0)}% of articles`,
                    'Consider creating more specific subcategories',
                    { category, articleCount: categoryCount, percentage }
                );
            } else {
                this.addCheck(
                    'Category Distribution',
                    PSEO_CATEGORIES.TAXONOMY,
                    SEVERITY.GOOD,
                    `Category "${category}" well-balanced`,
                    null,
                    { category }
                );
            }
        } else {
            this.addCheck(
                'Category Assignment',
                PSEO_CATEGORIES.TAXONOMY,
                SEVERITY.GOOD,
                `Category assigned: ${category}`,
                null,
                { category }
            );
        }
    }

    checkTagUsage() {
        const tags = this.article.tags || [];

        if (tags.length === 0) {
            this.addCheck(
                'Tag Usage',
                PSEO_CATEGORIES.TAXONOMY,
                SEVERITY.WARNING,
                'No tags assigned',
                'Add 3-7 relevant tags for better discoverability'
            );
        } else if (tags.length < 3) {
            this.addCheck(
                'Tag Usage',
                PSEO_CATEGORIES.TAXONOMY,
                SEVERITY.INFO,
                `Only ${tags.length} tag(s) assigned`,
                'Consider adding more tags (aim for 3-7)',
                { tags: tags.map(t => t.name || t) }
            );
        } else if (tags.length > 10) {
            this.addCheck(
                'Tag Usage',
                PSEO_CATEGORIES.TAXONOMY,
                SEVERITY.WARNING,
                `Too many tags (${tags.length})`,
                'Reduce to 7 or fewer focused tags',
                { tags: tags.map(t => t.name || t) }
            );
        } else {
            this.addCheck(
                'Tag Usage',
                PSEO_CATEGORIES.TAXONOMY,
                SEVERITY.GOOD,
                `Good tag count (${tags.length} tags)`,
                null,
                { tags: tags.map(t => t.name || t) }
            );
        }
    }

    // ============================================================================
    // INTERNAL LINKING CHECKS
    // ============================================================================

    checkInternalLinkingMatrix() {
        const content = this.article.content || '';
        const domain = 'dataengineerhub.blog';

        // Count internal links
        const linkMatches = content.match(/<a[^>]+href=["'][^"']*["'][^>]*>/gi) || [];
        const internalLinks = linkMatches.filter(link => {
            return link.includes(domain) ||
                (link.includes('href="/') && !link.includes('href="//')) ||
                link.includes('href="./');
        });

        if (internalLinks.length === 0) {
            this.addCheck(
                'Internal Links in Content',
                PSEO_CATEGORIES.LINKING,
                SEVERITY.WARNING,
                'No internal links found in content',
                'Add 2-5 internal links to related articles',
                { count: 0 }
            );
        } else if (internalLinks.length < 2) {
            this.addCheck(
                'Internal Links in Content',
                PSEO_CATEGORIES.LINKING,
                SEVERITY.INFO,
                `Only ${internalLinks.length} internal link(s)`,
                'Add more internal links (aim for 2-5 per article)',
                { count: internalLinks.length }
            );
        } else {
            this.addCheck(
                'Internal Links in Content',
                PSEO_CATEGORIES.LINKING,
                SEVERITY.GOOD,
                `Good internal linking (${internalLinks.length} links)`,
                null,
                { count: internalLinks.length }
            );
        }
    }

    checkURLTemplating() {
        const slug = this.article.slug || '';
        const category = this.article.category || '';

        // Check URL structure
        const hasHyphens = slug.includes('-');
        const isLowercase = slug === slug.toLowerCase();
        const goodLength = slug.length >= 10 && slug.length <= 60;

        if (hasHyphens && isLowercase && goodLength) {
            this.addCheck(
                'URL Template',
                PSEO_CATEGORIES.SCALABILITY,
                SEVERITY.GOOD,
                'URL follows good templating practices',
                null,
                { slug }
            );
        } else {
            const issues = [];
            if (!hasHyphens) issues.push('use hyphens');
            if (!isLowercase) issues.push('use lowercase');
            if (!goodLength) issues.push('adjust length (10-60 chars)');

            this.addCheck(
                'URL Template',
                PSEO_CATEGORIES.SCALABILITY,
                SEVERITY.INFO,
                'URL could be improved',
                issues.join(', '),
                { slug, issues }
            );
        }
    }

    // ============================================================================
    // AUTOMATION QUALITY CHECKS
    // ============================================================================

    checkContentAutomationQuality() {
        const content = this.article.content || '';
        const title = this.article.title || '';
        const excerpt = this.article.excerpt || '';

        // Check for quality indicators
        const wordCount = content.split(/\s+/).length;
        const hasExcerpt = excerpt.length > 50;
        const hasImages = /<img/.test(content);
        const hasSchema = this.article.schema || content.includes('application/ld+json');

        const qualityScore = [
            wordCount >= 500,
            hasExcerpt,
            hasImages,
            title.length >= 20
        ].filter(Boolean).length;

        if (qualityScore >= 4) {
            this.addCheck(
                'Content Automation Quality',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.GOOD,
                'High-quality automated content',
                null,
                { wordCount, hasExcerpt, hasImages }
            );
        } else if (qualityScore >= 2) {
            this.addCheck(
                'Content Automation Quality',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.INFO,
                'Moderate automation quality',
                'Improve content completeness',
                { wordCount, hasExcerpt, hasImages }
            );
        } else {
            this.addCheck(
                'Content Automation Quality',
                PSEO_CATEGORIES.AUTOMATION,
                SEVERITY.WARNING,
                'Low automation quality detected',
                'Ensure complete content generation',
                { wordCount, hasExcerpt, hasImages }
            );
        }
    }

    checkScalabilityPatterns() {
        // Check if article follows scalable patterns
        const patterns = {
            hasConsistentSlug: /^[a-z0-9-]+$/.test(this.article.slug || ''),
            hasCategory: Boolean(this.article.category),
            hasTags: (this.article.tags || []).length > 0,
            hasExcerpt: (this.article.excerpt || '').length > 20,
            hasDate: Boolean(this.article.date || this.article.publishedDate)
        };

        const patternScore = Object.values(patterns).filter(Boolean).length;
        const totalPatterns = Object.keys(patterns).length;

        if (patternScore === totalPatterns) {
            this.addCheck(
                'Scalability Patterns',
                PSEO_CATEGORIES.SCALABILITY,
                SEVERITY.GOOD,
                'Article follows all scalable patterns',
                null,
                { patterns }
            );
        } else if (patternScore >= 3) {
            this.addCheck(
                'Scalability Patterns',
                PSEO_CATEGORIES.SCALABILITY,
                SEVERITY.INFO,
                `${patternScore}/${totalPatterns} scalable patterns followed`,
                'Complete all patterns for better PSEO',
                { patterns }
            );
        } else {
            this.addCheck(
                'Scalability Patterns',
                PSEO_CATEGORIES.SCALABILITY,
                SEVERITY.WARNING,
                'Low scalability score',
                'Implement consistent content patterns',
                { patterns }
            );
        }
    }

    // ============================================================================
    // SCORE CALCULATION
    // ============================================================================

    calculateScore() {
        const weights = {
            [SEVERITY.CRITICAL]: 0,
            [SEVERITY.WARNING]: 0.4,
            [SEVERITY.GOOD]: 1,
            [SEVERITY.INFO]: 0.7
        };

        const total = this.checks.length;
        if (total === 0) {
            this.score = 0;
            return;
        }

        const rawScore = this.checks.reduce((acc, check) => {
            return acc + (weights[check.severity] || 0);
        }, 0);

        this.score = Math.round((rawScore / total) * 100);
    }

    getReport() {
        return {
            type: 'PSEO',
            score: this.score,
            grade: this.getGrade(),
            summary: {
                total: this.checks.length,
                critical: this.checks.filter(c => c.severity === SEVERITY.CRITICAL).length,
                warning: this.checks.filter(c => c.severity === SEVERITY.WARNING).length,
                good: this.checks.filter(c => c.severity === SEVERITY.GOOD).length,
                info: this.checks.filter(c => c.severity === SEVERITY.INFO).length
            },
            checks: this.checks,
            byCategory: this.groupByCategory(),
            analyzedAt: new Date().toISOString()
        };
    }

    getGrade() {
        if (this.score >= 90) return 'A+';
        if (this.score >= 80) return 'A';
        if (this.score >= 70) return 'B';
        if (this.score >= 60) return 'C';
        if (this.score >= 50) return 'D';
        return 'F';
    }

    groupByCategory() {
        const grouped = {};
        this.checks.forEach(check => {
            if (!grouped[check.category]) {
                grouped[check.category] = [];
            }
            grouped[check.category].push(check);
        });
        return grouped;
    }
}

export default PSEOAnalyzer;
