import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PSEO_DIR = path.join(DATA_DIR, 'pseo');

const normalize = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Load categories to map display names to IDs
const categories = JSON.parse(fs.readFileSync(path.join(PSEO_DIR, 'categories.json'), 'utf-8'));
const categoryMap = {};
categories.forEach(c => {
    categoryMap[normalize(c.name)] = c.id;
    categoryMap[c.id] = c.id; // Also map ID to itself
});

async function mergeData(type) {
    const dir = path.join(PSEO_DIR, type);
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

    // Valid categories based on categories.json
    const validCategoryIds = new Set(categories.map(c => c.id));

    const itemsToMerge = [];
    const sourceFiles = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const fileBase = file.replace('.json', '');

        // If the filename itself is NOT a valid category ID, it's a candidate for merging
        if (!validCategoryIds.has(fileBase)) {
            itemsToMerge.push(...data);
            sourceFiles.push(file);
        }
    }

    if (itemsToMerge.length === 0) {
        console.log(`   ✅ No files to merge for ${type}`);
        return;
    }

    console.log(`\n📦 Merging ${itemsToMerge.length} items into standardized categories for ${type}...`);

    for (const item of itemsToMerge) {
        // Try to find the correct category ID
        const rawCategory = item.category || 'general';
        const normalizedInput = normalize(rawCategory);
        const categoryId = categoryMap[normalizedInput] || normalizedInput;

        const categoryFilename = `${categoryId}.json`;
        const destPath = path.join(dir, categoryFilename);

        let destData = [];
        if (fs.existsSync(destPath)) {
            destData = JSON.parse(fs.readFileSync(destPath, 'utf-8'));
        }

        // Check if already exists by slug
        const exists = destData.find(i => i.slug === item.slug);
        if (!exists) {
            // Ensure the item.category is set to the standardized ID
            item.category = categoryId;
            destData.push(item);
            fs.writeFileSync(destPath, JSON.stringify(destData, null, 2), 'utf-8');
            console.log(`   ✅ Appended ${item.slug} to ${categoryFilename}`);
        } else {
            console.log(`   ⏭️  Skipping ${item.slug} (already exists)`);
        }
    }

    // Double check search index standardization
    sourceFiles.forEach(file => {
        try {
            fs.unlinkSync(path.join(dir, file));
            console.log(`   🗑️  Deleted non-standard file: ${file}`);
        } catch (e) { }
    });
}

async function main() {
    console.log('🚀 Standardizing pSEO Data Structures...');
    await mergeData('comparisons');
    await mergeData('glossary');
    console.log('\n🎉 Automation logic applied!');
}

main();
