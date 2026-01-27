/**
 * PSEO Data Migration Script
 * 
 * Splits the monolithic glossaryData.js and comparisonData.js into
 * category-based JSON files for scalable batch processing.
 * 
 * Output Structure:
 *   src/data/pseo/
 *   ├── categories.json           # Category metadata
 *   ├── glossary/
 *   │   ├── data-warehousing.json
 *   │   ├── etl-elt.json
 *   │   └── ... (by category)
 *   └── comparisons/
 *       ├── orchestration.json
 *       └── ... (by category)
 * 
 * Usage: npm run pseo:migrate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PSEO_DIR = path.join(DATA_DIR, 'pseo');

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely create directory if it doesn't exist
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${path.relative(process.cwd(), dirPath)}`);
    }
}

/**
 * Write JSON file with pretty formatting
 */
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);
    console.log(`  ✅ ${relativePath} (${size} KB)`);
}

/**
 * Parse the glossaryData.js file to extract terms and categories
 * Uses regex to handle ES module exports
 */
function parseGlossaryData() {
    const filePath = path.join(DATA_DIR, 'glossaryData.js');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract GLOSSARY_CATEGORIES
    const categoriesMatch = content.match(/export const GLOSSARY_CATEGORIES\s*=\s*\[([\s\S]*?)\];/);
    const categories = [];
    
    if (categoriesMatch) {
        const catRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*icon:\s*['"]([^'"]+)['"]\s*}/g;
        let match;
        while ((match = catRegex.exec(categoriesMatch[1])) !== null) {
            categories.push({
                id: match[1],
                name: match[2],
                icon: match[3]
            });
        }
    }

    // Extract glossaryTerms - this is more complex due to template literals
    // We'll use dynamic import instead for accuracy
    return { categories, filePath };
}

/**
 * Parse comparison data
 */
function parseComparisonData() {
    const filePath = path.join(DATA_DIR, 'comparisonData.js');
    return { filePath };
}

// =============================================================================
// MAIN MIGRATION LOGIC
// =============================================================================

async function migrateGlossaryData() {
    console.log('\n📚 Migrating Glossary Data...\n');

    // Dynamically import the glossary data
    const glossaryModule = await import(`file://${path.join(DATA_DIR, 'glossaryData.js').replace(/\\/g, '/')}`);
    const { glossaryTerms, GLOSSARY_CATEGORIES } = glossaryModule;

    // Create output directories
    const glossaryDir = path.join(PSEO_DIR, 'glossary');
    ensureDir(glossaryDir);

    // Write categories.json
    writeJSON(path.join(PSEO_DIR, 'categories.json'), GLOSSARY_CATEGORIES);

    // Group terms by category
    const termsByCategory = {};
    for (const term of glossaryTerms) {
        const category = term.category || 'uncategorized';
        if (!termsByCategory[category]) {
            termsByCategory[category] = [];
        }
        termsByCategory[category].push(term);
    }

    // Write each category file
    let totalTerms = 0;
    for (const [category, terms] of Object.entries(termsByCategory)) {
        writeJSON(path.join(glossaryDir, `${category}.json`), terms);
        totalTerms += terms.length;
    }

    console.log(`\n📊 Glossary Migration Complete:`);
    console.log(`   Categories: ${Object.keys(termsByCategory).length}`);
    console.log(`   Total Terms: ${totalTerms}`);

    return { categoriesCount: Object.keys(termsByCategory).length, termsCount: totalTerms };
}

async function migrateComparisonData() {
    console.log('\n⚖️  Migrating Comparison Data...\n');

    // Dynamically import the comparison data
    const comparisonModule = await import(`file://${path.join(DATA_DIR, 'comparisonData.js').replace(/\\/g, '/')}`);
    const { comparisons } = comparisonModule;

    // Create output directory
    const comparisonsDir = path.join(PSEO_DIR, 'comparisons');
    ensureDir(comparisonsDir);

    // Group comparisons by category
    const comparisonsByCategory = {};
    for (const comparison of comparisons) {
        // Normalize category to slug format
        const category = comparison.category
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        
        if (!comparisonsByCategory[category]) {
            comparisonsByCategory[category] = [];
        }
        comparisonsByCategory[category].push(comparison);
    }

    // Write each category file
    let totalComparisons = 0;
    for (const [category, comps] of Object.entries(comparisonsByCategory)) {
        writeJSON(path.join(comparisonsDir, `${category}.json`), comps);
        totalComparisons += comps.length;
    }

    // Also write a metadata file for comparison categories
    const comparisonCategories = Object.keys(comparisonsByCategory).map(cat => ({
        id: cat,
        name: comparisons.find(c => 
            c.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cat
        )?.category || cat,
        count: comparisonsByCategory[cat].length
    }));
    writeJSON(path.join(PSEO_DIR, 'comparison-categories.json'), comparisonCategories);

    console.log(`\n📊 Comparison Migration Complete:`);
    console.log(`   Categories: ${Object.keys(comparisonsByCategory).length}`);
    console.log(`   Total Comparisons: ${totalComparisons}`);

    return { categoriesCount: Object.keys(comparisonsByCategory).length, comparisonsCount: totalComparisons };
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verifyMigration() {
    console.log('\n🔍 Verifying Migration...\n');

    const issues = [];

    // Check glossary files
    const glossaryDir = path.join(PSEO_DIR, 'glossary');
    if (fs.existsSync(glossaryDir)) {
        const files = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
        let totalTerms = 0;
        
        for (const file of files) {
            const data = JSON.parse(fs.readFileSync(path.join(glossaryDir, file), 'utf-8'));
            totalTerms += data.length;
            
            // Validate each term has required fields
            for (const term of data) {
                if (!term.slug) issues.push(`Missing slug in ${file}: ${term.term || 'unknown'}`);
                if (!term.term) issues.push(`Missing term name in ${file}: ${term.slug || 'unknown'}`);
                if (!term.category) issues.push(`Missing category in ${file}: ${term.slug}`);
            }
        }
        console.log(`   ✅ Glossary: ${files.length} files, ${totalTerms} terms`);
    } else {
        issues.push('Glossary directory not created');
    }

    // Check comparison files
    const comparisonsDir = path.join(PSEO_DIR, 'comparisons');
    if (fs.existsSync(comparisonsDir)) {
        const files = fs.readdirSync(comparisonsDir).filter(f => f.endsWith('.json'));
        let totalComparisons = 0;
        
        for (const file of files) {
            const data = JSON.parse(fs.readFileSync(path.join(comparisonsDir, file), 'utf-8'));
            totalComparisons += data.length;
            
            // Validate each comparison has required fields
            for (const comp of data) {
                if (!comp.slug) issues.push(`Missing slug in ${file}: ${comp.toolA} vs ${comp.toolB}`);
                if (!comp.toolA || !comp.toolB) issues.push(`Missing tools in ${file}: ${comp.slug}`);
            }
        }
        console.log(`   ✅ Comparisons: ${files.length} files, ${totalComparisons} comparisons`);
    } else {
        issues.push('Comparisons directory not created');
    }

    // Check categories.json
    const categoriesPath = path.join(PSEO_DIR, 'categories.json');
    if (fs.existsSync(categoriesPath)) {
        const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
        console.log(`   ✅ Categories: ${categories.length} defined`);
    } else {
        issues.push('categories.json not created');
    }

    if (issues.length > 0) {
        console.log('\n⚠️  Issues Found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
        console.log('\n✨ All verifications passed!');
    }

    return issues;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           PSEO Data Migration Script                         ║');
    console.log('║   Splitting monolithic data files into category JSONs        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    try {
        // Ensure base PSEO directory exists
        ensureDir(PSEO_DIR);

        // Run migrations
        const glossaryStats = await migrateGlossaryData();
        const comparisonStats = await migrateComparisonData();

        // Verify
        const issues = await verifyMigration();

        // Summary
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║                    MIGRATION SUMMARY                         ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  Glossary Categories:    ${String(glossaryStats.categoriesCount).padStart(5)}                            ║`);
        console.log(`║  Glossary Terms:         ${String(glossaryStats.termsCount).padStart(5)}                            ║`);
        console.log(`║  Comparison Categories:  ${String(comparisonStats.categoriesCount).padStart(5)}                            ║`);
        console.log(`║  Comparisons:            ${String(comparisonStats.comparisonsCount).padStart(5)}                            ║`);
        console.log(`║  Issues:                 ${String(issues.length).padStart(5)}                            ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝');

        if (issues.length === 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📍 Next Steps:');
            console.log('   1. Run: npm run pseo:search-index');
            console.log('   2. Review generated files in src/data/pseo/');
        } else {
            console.log('\n⚠️  Migration completed with issues. Please review.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
