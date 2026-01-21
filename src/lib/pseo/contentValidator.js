/**
 * Content Quality Validator for Programmatic SEO
 * Prevents thin content and duplicate content penalties.
 */

// Configuration constants
const MIN_WORD_COUNT = 300;
const MIN_FAQ_COUNT = 3;
const SIMILARITY_THRESHOLD = 0.8; // 80% similarity warning

/**
 * Validates if the content meets minimum depth requirements.
 * Checks for word count and FAQ presence.
 * 
 * @param {string} content - The main body text/markdown of the page
 * @param {Array} faqs - Array of FAQ objects {question, answer}
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateContentDepth = (content, faqs = []) => {
    const errors = [];

    if (!content) {
        errors.push('Content is empty');
        return { isValid: false, errors };
    }

    // Word count check (stripping HTML/markdown tags roughly)
    const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/[#*`_~\[\]()]/g, ' ');
    const wordCount = cleanContent.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < MIN_WORD_COUNT) {
        errors.push(`Content too thin: ${wordCount} words (Minimum required: ${MIN_WORD_COUNT})`);
    }

    // FAQ count check
    if (!Array.isArray(faqs) || faqs.length < MIN_FAQ_COUNT) {
        errors.push(`Insufficient FAQs: ${faqs?.length || 0} found (Minimum required: ${MIN_FAQ_COUNT})`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Generates a specific hash for the content to detect exact duplicates.
 * Uses a simple reliable string hash (Fowler-Noll-Vo variant or similar for JS).
 * 
 * @param {string} content 
 * @returns {string} - Hex hash string
 */
export const generateContentHash = (content) => {
    let hash = 0;
    if (!content || content.length === 0) return '0';

    const cleanStr = content.trim();
    for (let i = 0; i < cleanStr.length; i++) {
        const char = cleanStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return (hash >>> 0).toString(16); // Return unsigned hex string
};

/**
 * Checks similarity between two content strings using Jaccard Similarity on shingles.
 * Alert if similarity > 80% (potential duplicate content penalty).
 * 
 * @param {string} contentA 
 * @param {string} contentB 
 * @returns {object} - { similarity: number, isDuplicate: boolean }
 */
export const checkSimilarity = (contentA, contentB) => {
    if (!contentA || !contentB) return { similarity: 0, isDuplicate: false };

    const tokenize = (text) => {
        // 3-word shingles often used for plagiarism detection
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);

        const shingles = new Set();
        for (let i = 0; i < words.length - 2; i++) {
            shingles.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }
        return shingles;
    };

    const shinglesA = tokenize(contentA);
    const shinglesB = tokenize(contentB);

    if (shinglesA.size === 0 || shinglesB.size === 0) return { similarity: 0, isDuplicate: false };

    // Intersection
    let intersection = 0;
    for (let s of shinglesA) {
        if (shinglesB.has(s)) intersection++;
    }

    // Union
    const union = shinglesA.size + shinglesB.size - intersection;

    const similarity = intersection / union;

    return {
        similarity: Number(similarity.toFixed(4)),
        isDuplicate: similarity > SIMILARITY_THRESHOLD
    };
};
