/**
 * Glossary Loader
 * Dynamically loads glossary data from split JSON files to reduce bundle size.
 */

import searchIndex from '../../data/searchIndex.json';
import categories from '../../data/pseo/categories.json';

// Cache for loaded categories to prevent redundant network requests
const categoryCache = new Map();

export function getCategoryById(id) {
    return categories.find(c => c.id === id);
}

/**
 * Get a specific glossary term by its slug.
 * Dynamically imports only the necessary category file.
 * @param {string} slug 
 * @returns {Promise<Object|null>}
 */
export async function getGlossaryTerm(slug) {
    // 1. Find the term in the index to know its category
    // 1. Find the term in the index to know its category
    // searchIndex is an object { glossary: [], comparisons: [], ... }
    const indexEntry = searchIndex.glossary.find(item => item.slug === slug);

    if (!indexEntry) {
        console.warn(`Glossary slug not found in index: ${slug}`);
        return null;
    }

    const category = indexEntry.category;

    // Normalize category to filename format (must match migrate-pseo-data.js logic)
    // "Data Warehousing" -> "data-warehousing"
    // Ideally the index store the raw category ID, but we might rely on the string.
    // The migrate script does: category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    // But wait! in glossaryData.js, categories are IDs like 'data-warehousing', 'etl-elt'.
    // In searchIndex, do we store the ID or the Name? 
    // Usually searchIndex stores what's searchable. 
    // I should check searchIndex.json structure to be sure.
    // Assuming for now it stores the ID if that's what was in the source, OR I need to handle both.

    // Safer to re-normalize JUST IN CASE the index store the display name "Data Warehousing"
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
            const module = await import(`../../data/pseo/glossary/${categoryFilename}.json`);
            categoryData = module.default;
            categoryCache.set(categoryFilename, categoryData);
        } catch (error) {
            console.error(`Failed to load glossary category: ${categoryFilename}`, error);
            // Fallback: try loading without normalization if it was already an ID?
            return null;
        }
    }

    // 3. Find the specific term in that category file
    const term = categoryData.find(t => t.slug === slug);
    return term || null;
}

/**
 * Get all terms (Expensive! Loads all files).
 * Only use for SSG or sitemap generation.
 */
export async function getAllGlossaryTerms() {
    const categories = new Set(
        searchIndex.glossary.map(item => item.category)
    );

    let allTerms = [];

    for (const category of categories) {
        const categoryFilename = category
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        try {
            const module = await import(`../../data/pseo/glossary/${categoryFilename}.json`);
            allTerms = [...allTerms, ...module.default];
        } catch (e) {
            console.error(`Error loading category ${categoryFilename}`, e);
        }
    }

    return allTerms;
}
