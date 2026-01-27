/**
 * PSEO Search Index Generator
 * 
 * Creates a lightweight JSON file containing only metadata for the search bar.
 * This prevents the browser from loading 100MB+ of full definitions.
 * 
 * Output: src/data/searchIndex.json
 * 
 * Structure:
 * {
 *   "glossary": [{ term, slug, category, shortDefinition }],
 *   "comparisons": [{ title, slug, category, toolA, toolB }]
 * }
 * 
 * Usage: npm run pseo:search-index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PSEO_DIR = path.join(DATA_DIR, 'pseo');
const OUTPUT_FILE = path.join(DATA_DIR, 'searchIndex.json');

// =============================================================================
// GLOSSARY INDEX GENERATION
// =============================================================================

function generateGlossaryIndex() {
    console.log('\n📚 Processing Glossary Terms...\n');

    const glossaryDir = path.join(PSEO_DIR, 'glossary');

    if (!fs.existsSync(glossaryDir)) {
        console.log('   ⚠️  Glossary directory not found. Run pseo:migrate first.');
        return [];
    }

    const files = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
    const glossaryIndex = [];

    for (const file of files) {
        const filePath = path.join(glossaryDir, file);
        const terms = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const term of terms) {
            glossaryIndex.push({
                term: term.term,
                slug: term.slug,
                category: term.category,
                shortDefinition: term.shortDefinition || ''
            });
        }

        console.log(`   ✅ ${file}: ${terms.length} terms`);
    }

    // Sort alphabetically by term
    glossaryIndex.sort((a, b) => a.term.localeCompare(b.term));

    console.log(`\n   Total: ${glossaryIndex.length} glossary terms indexed`);
    return glossaryIndex;
}

// =============================================================================
// COMPARISONS INDEX GENERATION
// =============================================================================

function generateComparisonsIndex() {
    console.log('\n⚖️  Processing Comparisons...\n');

    const comparisonsDir = path.join(PSEO_DIR, 'comparisons');

    if (!fs.existsSync(comparisonsDir)) {
        console.log('   ⚠️  Comparisons directory not found. Run pseo:migrate first.');
        return [];
    }

    const files = fs.readdirSync(comparisonsDir).filter(f => f.endsWith('.json'));
    const comparisonsIndex = [];

    for (const file of files) {
        const filePath = path.join(comparisonsDir, file);
        const comparisons = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const comp of comparisons) {
            comparisonsIndex.push({
                title: `${comp.toolA} vs ${comp.toolB}`,
                slug: comp.slug,
                category: comp.category,
                toolA: comp.toolA,
                toolB: comp.toolB,
                shortVerdict: comp.shortVerdict || ''
            });
        }

        console.log(`   ✅ ${file}: ${comparisons.length} comparisons`);
    }

    // Sort alphabetically by title
    comparisonsIndex.sort((a, b) => a.title.localeCompare(b.title));

    console.log(`\n   Total: ${comparisonsIndex.length} comparisons indexed`);
    return comparisonsIndex;
}

// =============================================================================
// CATEGORIES INDEX
// =============================================================================

function loadCategories() {
    const categoriesPath = path.join(PSEO_DIR, 'categories.json');

    if (fs.existsSync(categoriesPath)) {
        return JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    }

    return [];
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           PSEO Search Index Generator                        ║');
    console.log('║   Creating lightweight JSON for frontend search              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    try {
        // Check if migration has been run
        if (!fs.existsSync(PSEO_DIR)) {
            console.error('\n❌ PSEO data directory not found!');
            console.error('   Run "npm run pseo:migrate" first.');
            process.exit(1);
        }

        // Generate indexes
        const glossaryIndex = generateGlossaryIndex();
        const comparisonsIndex = generateComparisonsIndex();
        const categories = loadCategories();

        // Build final index
        const searchIndex = {
            version: new Date().toISOString(),
            glossary: glossaryIndex,
            comparisons: comparisonsIndex,
            categories: categories
        };

        // Write output
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(searchIndex, null, 2), 'utf-8');

        // Calculate sizes
        const fullSize = fs.statSync(OUTPUT_FILE).size;
        const minifiedSize = Buffer.byteLength(JSON.stringify(searchIndex));

        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                 SEARCH INDEX SUMMARY                         ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  Glossary Terms:       ${String(glossaryIndex.length).padStart(6)}                           ║`);
        console.log(`║  Comparisons:          ${String(comparisonsIndex.length).padStart(6)}                           ║`);
        console.log(`║  Categories:           ${String(categories.length).padStart(6)}                           ║`);
        console.log(`║  File Size:            ${String((fullSize / 1024).toFixed(2) + ' KB').padStart(10)}                       ║`);
        console.log(`║  Minified Size:        ${String((minifiedSize / 1024).toFixed(2) + ' KB').padStart(10)}                       ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝');

        console.log(`\n✅ Search index saved to: ${path.relative(process.cwd(), OUTPUT_FILE)}`);

        // Size warning for scale
        const estimatedAt100k = (glossaryIndex.length > 0)
            ? ((100000 / glossaryIndex.length) * minifiedSize / 1024 / 1024).toFixed(2)
            : 'N/A';

        console.log(`\n💡 Estimated size at 100k terms: ~${estimatedAt100k} MB`);

        if (parseFloat(estimatedAt100k) > 10) {
            console.log('   ⚠️  Consider chunking by first letter for progressive loading');
        } else {
            console.log('   ✅ Size is acceptable for single-file loading');
        }

        console.log('\n📍 Next Steps:');
        console.log('   1. Update frontend to use searchIndex.json');
        console.log('   2. Run: npm run pseo:deploy (when ready)');

    } catch (error) {
        console.error('\n❌ Failed to generate search index:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
