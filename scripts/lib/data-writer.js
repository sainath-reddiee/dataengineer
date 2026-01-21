/**
 * Data Writer for PSEO Content
 * Safely updates glossaryData.js and comparisonData.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../src/data');

// =============================================================================
// GLOSSARY DATA WRITER
// =============================================================================

export async function addGlossaryTerms(newTerms) {
    const filePath = path.join(DATA_DIR, 'glossaryData.js');

    // Read existing file
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find the glossaryTerms array
    const arrayMatch = content.match(/export const glossaryTerms = \[([\s\S]*?)\n\];/);
    if (!arrayMatch) {
        throw new Error('Could not find glossaryTerms array in glossaryData.js');
    }

    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set();
    const slugMatches = content.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    for (const match of slugMatches) {
        existingSlugs.add(match[1]);
    }

    // Filter out duplicates
    const uniqueNewTerms = newTerms.filter(term => !existingSlugs.has(term.slug));

    if (uniqueNewTerms.length === 0) {
        return { added: 0, skipped: newTerms.length, duplicates: newTerms.map(t => t.slug) };
    }

    // Format new terms as JS objects
    const formattedTerms = uniqueNewTerms.map(term => formatTermAsJS(term)).join(',\n');

    // Insert before the closing bracket
    const insertPosition = content.lastIndexOf('\n];');
    const newContent =
        content.slice(0, insertPosition) +
        ',\n' + formattedTerms +
        content.slice(insertPosition);

    // Write back
    fs.writeFileSync(filePath, newContent, 'utf-8');

    return {
        added: uniqueNewTerms.length,
        skipped: newTerms.length - uniqueNewTerms.length,
        terms: uniqueNewTerms.map(t => t.term)
    };
}

function formatTermAsJS(term) {
    return `    {
        id: '${term.slug}',
        term: '${escapeJS(term.term)}',
        slug: '${term.slug}',
        category: '${term.category}',
        shortDefinition: '${escapeJS(term.shortDefinition)}',
        fullDefinition: \`${term.fullDefinition}\`,
        keyPoints: ${JSON.stringify(term.keyPoints, null, 12).replace(/^/gm, '        ').trim()},
        faqs: ${JSON.stringify(term.faqs, null, 12).replace(/^/gm, '        ').trim()},
        relatedTerms: ${JSON.stringify(term.relatedTerms || [])},
        relatedTools: ${JSON.stringify(term.relatedTools || [])},
        keywords: ${JSON.stringify(term.keywords || [])},
        lastUpdated: '${term.lastUpdated || new Date().toISOString().split('T')[0]}'
    }`;
}

// =============================================================================
// COMPARISON DATA WRITER
// =============================================================================

export async function addComparisons(newComparisons) {
    const filePath = path.join(DATA_DIR, 'comparisonData.js');

    // Read existing file
    const content = fs.readFileSync(filePath, 'utf-8');

    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set();
    const slugMatches = content.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    for (const match of slugMatches) {
        existingSlugs.add(match[1]);
    }

    // Filter out duplicates
    const uniqueNew = newComparisons.filter(c => !existingSlugs.has(c.slug));

    if (uniqueNew.length === 0) {
        return { added: 0, skipped: newComparisons.length };
    }

    // Format new comparisons as JS objects
    const formattedComparisons = uniqueNew.map(comp => formatComparisonAsJS(comp)).join(',\n');

    // Find the comparisons array and insert
    const insertPosition = content.indexOf('\n];');
    const newContent =
        content.slice(0, insertPosition) +
        ',\n' + formattedComparisons +
        content.slice(insertPosition);

    // Write back
    fs.writeFileSync(filePath, newContent, 'utf-8');

    return {
        added: uniqueNew.length,
        skipped: newComparisons.length - uniqueNew.length,
        comparisons: uniqueNew.map(c => `${c.toolA} vs ${c.toolB}`)
    };
}

function formatComparisonAsJS(comp) {
    return `    {
        id: '${comp.slug}',
        slug: '${comp.slug}',
        toolA: '${escapeJS(comp.toolA)}',
        toolB: '${escapeJS(comp.toolB)}',
        category: '${escapeJS(comp.category)}',
        winner: '${escapeJS(comp.winner)}',
        shortVerdict: '${escapeJS(comp.shortVerdict)}',
        intro: \`${comp.intro}\`,
        features: ${JSON.stringify(comp.features, null, 12).replace(/^/gm, '        ').trim()},
        pros: ${JSON.stringify(comp.pros, null, 12).replace(/^/gm, '        ').trim()},
        cons: ${JSON.stringify(comp.cons, null, 12).replace(/^/gm, '        ').trim()},
        finalVerdict: \`${comp.finalVerdict}\`,
        relatedComparisons: ${JSON.stringify(comp.relatedComparisons || [])},
        lastUpdated: '${comp.lastUpdated || new Date().toISOString().split('T')[0]}'
    }`;
}

// =============================================================================
// UTILITIES
// =============================================================================

function escapeJS(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}

export function getExistingGlossarySlugs() {
    const filePath = path.join(DATA_DIR, 'glossaryData.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const slugs = [];
    const matches = content.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    for (const match of matches) {
        slugs.push(match[1]);
    }
    return slugs;
}

export function getExistingComparisonSlugs() {
    const filePath = path.join(DATA_DIR, 'comparisonData.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const slugs = [];
    const matches = content.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
    for (const match of matches) {
        slugs.push(match[1]);
    }
    return slugs;
}
