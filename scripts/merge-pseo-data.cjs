/**
 * Merge pSEO Data
 * Merges new glossary/comparison items from standalone files
 * into the correct existing category files, updates searchIndex.json,
 * and cleans up standalone files.
 */

const fs = require('fs');
const path = require('path');

const PSEO_DIR = path.join(__dirname, '..', 'src', 'data', 'pseo');
const SEARCH_INDEX_PATH = path.join(__dirname, '..', 'src', 'data', 'searchIndex.json');

// ============================================================================
// GLOSSARY: Define where each new term should be merged
// ============================================================================
const GLOSSARY_MERGE_MAP = {
  // modern-data-stack.json items → target files
  'medallion-architecture': 'data-warehousing',
  'data-fabric': 'data-governance',
  'duckdb': 'analytics',
  'apache-iceberg': 'data-warehousing',
  'vector-database': 'analytics',
  // advanced-concepts.json items → target files
  'apache-flink': 'streaming',
  'star-schema': 'data-modeling',
  'data-pipeline': 'data-integration',
  'feature-store': 'analytics',
};

// Files to merge FROM (will be deleted after merge)
const GLOSSARY_SOURCE_FILES = ['modern-data-stack.json', 'advanced-concepts.json'];

// ============================================================================
// COMPARISONS: Define where each new comparison should be merged
// ============================================================================
const COMPARISON_MERGE_MAP = {
  // orchestration-modern.json
  'airflow-vs-prefect': 'data-orchestration',
  'dagster-vs-prefect': 'data-orchestration',
  // modern-tools.json
  'duckdb-vs-polars': 'analytics',
  'bigquery-vs-redshift': 'data-warehousing',
  'dbt-vs-sqlmesh': 'data-transformation',
  // enterprise-tools.json
  'snowflake-vs-synapse': 'data-warehousing',
  'looker-vs-power-bi': 'analytics',
  'pandas-vs-polars': 'analytics',
  'databricks-vs-bigquery': 'cloud-platforms',
  'mwaa-vs-cloud-composer': 'data-orchestration',
};

const COMPARISON_SOURCE_FILES = ['orchestration-modern.json', 'modern-tools.json', 'enterprise-tools.json'];

// ============================================================================
// Merge Logic
// ============================================================================

function mergeItems(type, sourceFiles, mergeMap) {
  const baseDir = path.join(PSEO_DIR, type);

  // 1. Collect all items from source files
  const allNewItems = [];
  for (const file of sourceFiles) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Source file not found: ${file}`);
      continue;
    }
    const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allNewItems.push(...items);
    console.log(`  📄 Read ${items.length} items from ${file}`);
  }

  // 2. Merge each item into its target category file
  const targetUpdates = new Map(); // targetFile -> items to add

  for (const item of allNewItems) {
    const targetCategory = mergeMap[item.slug];
    if (!targetCategory) {
      console.log(`  ⚠️  No merge target for slug: ${item.slug}`);
      continue;
    }

    // Update the item's category field to match the target
    item.category = targetCategory;

    if (!targetUpdates.has(targetCategory)) {
      targetUpdates.set(targetCategory, []);
    }
    targetUpdates.get(targetCategory).push(item);
  }

  // 3. Apply merges
  for (const [targetCategory, newItems] of targetUpdates) {
    const targetPath = path.join(baseDir, `${targetCategory}.json`);
    let existing = [];

    if (fs.existsSync(targetPath)) {
      existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    }

    // Check for duplicates — only add truly new items
    const existingSlugs = new Set(existing.map(i => i.slug));
    const itemsToAdd = newItems.filter(i => !existingSlugs.has(i.slug));

    if (itemsToAdd.length === 0) {
      console.log(`  ⏭️  ${targetCategory}.json: all items already exist`);
      continue;
    }

    const merged = [...existing, ...itemsToAdd];
    fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n');
    console.log(`  ✅ ${targetCategory}.json: added ${itemsToAdd.length} items (${existing.length} → ${merged.length})`);
  }

  // 4. Delete source files
  for (const file of sourceFiles) {
    const filePath = path.join(baseDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  🗑️  Deleted ${file}`);
    }
  }
}

// ============================================================================
// Update searchIndex.json
// ============================================================================

function updateSearchIndex() {
  const searchIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf-8'));

  const existingGlossarySlugs = new Set(searchIndex.glossary.map(i => i.slug));
  const existingComparisonSlugs = new Set(searchIndex.comparisons.map(i => i.slug));

  // Scan all glossary files to find items not in searchIndex
  const glossaryDir = path.join(PSEO_DIR, 'glossary');
  const glossaryFiles = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
  let glossaryAdded = 0;

  for (const file of glossaryFiles) {
    const items = JSON.parse(fs.readFileSync(path.join(glossaryDir, file), 'utf-8'));
    for (const item of items) {
      if (!existingGlossarySlugs.has(item.slug)) {
        searchIndex.glossary.push({
          term: item.term,
          slug: item.slug,
          category: item.category,
          shortDefinition: item.shortDefinition,
        });
        existingGlossarySlugs.add(item.slug);
        glossaryAdded++;
      }
    }
  }

  // Scan all comparison files
  const comparisonDir = path.join(PSEO_DIR, 'comparisons');
  const comparisonFiles = fs.readdirSync(comparisonDir).filter(f => f.endsWith('.json'));
  let comparisonAdded = 0;

  for (const file of comparisonFiles) {
    const items = JSON.parse(fs.readFileSync(path.join(comparisonDir, file), 'utf-8'));
    for (const item of items) {
      if (!existingComparisonSlugs.has(item.slug)) {
        searchIndex.comparisons.push({
          title: `${item.toolA} vs ${item.toolB}`,
          slug: item.slug,
          category: item.category,
          toolA: item.toolA,
          toolB: item.toolB,
          shortVerdict: item.shortVerdict,
        });
        existingComparisonSlugs.add(item.slug);
        comparisonAdded++;
      }
    }
  }

  // Sort for consistency
  searchIndex.glossary.sort((a, b) => a.term.localeCompare(b.term));
  searchIndex.comparisons.sort((a, b) => a.title.localeCompare(b.title));
  searchIndex.version = new Date().toISOString();

  fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(searchIndex, null, 2) + '\n');
  console.log(`\n📍 searchIndex.json updated:`);
  console.log(`   Glossary: +${glossaryAdded} (total: ${searchIndex.glossary.length})`);
  console.log(`   Comparisons: +${comparisonAdded} (total: ${searchIndex.comparisons.length})`);
}

// ============================================================================
// Main
// ============================================================================

console.log('🔀 Merging pSEO data...\n');

console.log('📚 Merging Glossary Terms:');
mergeItems('glossary', GLOSSARY_SOURCE_FILES, GLOSSARY_MERGE_MAP);

console.log('\n⚖️  Merging Comparisons:');
mergeItems('comparisons', COMPARISON_SOURCE_FILES, COMPARISON_MERGE_MAP);

updateSearchIndex();

console.log('\n✅ Done! Now run: npm run build && node scripts/deploy-pseo.js');
