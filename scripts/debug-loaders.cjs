
const fs = require('fs');
const path = require('path');

// Mock paths
const ROOT_DIR = path.resolve(__dirname, '../src');
const SEARCH_INDEX_PATH = path.join(ROOT_DIR, 'data/searchIndex.json');
const GLOSSARY_DIR = path.join(ROOT_DIR, 'data/pseo/glossary');
const COMPARISONS_DIR = path.join(ROOT_DIR, 'data/pseo/comparisons');

console.log('🔍 Starting Loader Debugger...');

// 1. Load Search Index
try {
    const rawIndex = fs.readFileSync(SEARCH_INDEX_PATH, 'utf-8');
    const searchIndex = JSON.parse(rawIndex);
    console.log('✅ Loaded searchIndex.json');
    console.log(`   Keys: ${Object.keys(searchIndex).join(', ')}`);
    console.log(`   Glossary Terms: ${searchIndex.glossary?.length}`);
    console.log(`   Comparisons: ${searchIndex.comparisons?.length}`);

    // TEST GLOSSARY LOADER LOGIC
    console.log('\n🧪 Testing Glossary Loader logic for "data-lake"...');
    const glossarySlug = 'data-lake';

    // Logic from glossaryLoader.js
    if (!searchIndex.glossary) {
        console.error('❌ searchIndex.glossary is Undefined!');
    } else {
        const indexEntry = searchIndex.glossary.find(item => item.slug === glossarySlug);
        if (!indexEntry) {
            console.error('❌ Glossary slug not found in index!');
        } else {
            console.log(`✅ Found index entry: ${JSON.stringify(indexEntry)}`);
            const category = indexEntry.category;
            const categoryFilename = category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            console.log(`   Normalized Filename: ${categoryFilename}`);

            const filePath = path.join(GLOSSARY_DIR, `${categoryFilename}.json`);
            if (fs.existsSync(filePath)) {
                console.log(`✅ File exists: ${filePath}`);
                const catData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const term = catData.find(t => t.slug === glossarySlug);
                if (term) {
                    console.log('✅ Term found in category file!');
                    // Access properties accessed in Page
                    console.log(`   Properties check: term: ${!!term.term}, keyPoints: ${!!term.keyPoints}, category: ${term.category}`);
                } else {
                    console.error('❌ Term NOT found in category file!');
                }
            } else {
                console.error(`❌ Category file missing: ${filePath}`);
            }
        }
    }

} catch (err) {
    console.error('❌ Fatal Error:', err);
}
