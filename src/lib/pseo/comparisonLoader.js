/**
 * Comparison Loader
 * Dynamically loads comparison data from split JSON files to reduce bundle size.
 */

import searchIndex from '../../data/searchIndex.json';

// Cache for loaded categories to prevent redundant network requests
const categoryCache = new Map();

/**
 * Get a specific comparison by its slug.
 * Dynamically imports only the necessary category file.
 * @param {string} slug 
 * @returns {Promise<Object|null>}
 */
export async function getComparison(slug) {
    // 1. Find the comparison in the index to know its category
    // 1. Find the comparison in the index to know its category
    // searchIndex is object { glossary: [], comparisons: [] }
    const indexEntry = searchIndex.comparisons.find(item => item.slug === slug);

    if (!indexEntry) {
        console.warn(`Comparison slug not found in index: ${slug}`);
        return null;
    }

    const category = indexEntry.category;

    // Normalize category to filename format (this logic must match migrate-pseo-data.js)
    const categoryFilename = category
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    // 2. Load the category data (check cache first)
    let categoryData;
    if (categoryCache.has(categoryFilename)) {
        categoryData = categoryCache.get(categoryFilename);
    } else {
        try {
            // calculated path for Vite dynamic import analysis
            // We use a switch/map or a known pattern. 
            // Note: Vite struggles with fully dynamic strings in import(), so we might need a glob or specific paths.
            // For now, attempting the template string pattern which usually works if the depth is known.
            const module = await import(`../../data/pseo/comparisons/${categoryFilename}.json`);
            categoryData = module.default;
            categoryCache.set(categoryFilename, categoryData);
        } catch (error) {
            console.error(`Failed to load comparison category: ${categoryFilename}`, error);
            return null;
        }
    }

    // 3. Find the specific comparison in that category file
    const comparison = categoryData.find(c => c.slug === slug);
    return comparison || null;
}

/**
 * Get all comparisons (Expensive! Loads all files).
 * Only use for SSG or sitemap generation.
 */
export async function getAllComparisons() {
    // This requires knowing all categories. 
    // We can iterate the searchIndex to find unique categories.
    const categories = new Set(
        searchIndex.comparisons.map(item => item.category)
    );

    let allComparisons = [];

    for (const category of categories) {
        const categoryFilename = category
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        try {
            const module = await import(`../../data/pseo/comparisons/${categoryFilename}.json`);
            allComparisons = [...allComparisons, ...module.default];
        } catch (e) {
            console.error(`Error loading category ${categoryFilename}`, e);
        }
    }

    return allComparisons;
}
