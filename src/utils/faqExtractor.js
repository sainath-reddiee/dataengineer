// src/utils/faqExtractor.js
/**
 * FAQ Extractor Utility
 * Auto-extracts FAQ schema from article content
 * Improves SERP visibility with rich snippets
 */

/**
 * Extract FAQ items from HTML content
 * @param {string} content - HTML content
 * @returns {Array} Array of {question, answer} objects
 */
export function extractFAQFromContent(content) {
    if (!content || typeof content !== 'string') return [];

    const faqs = [];

    try {
        // Create a temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        // Find H2/H3 headings that look like questions
        const headings = doc.querySelectorAll('h2, h3');

        headings.forEach((heading) => {
            const text = heading.textContent.trim();

            // Check if heading is a question
            const isQuestion =
                text.endsWith('?') ||
                text.toLowerCase().startsWith('how ') ||
                text.toLowerCase().startsWith('what ') ||
                text.toLowerCase().startsWith('why ') ||
                text.toLowerCase().startsWith('when ') ||
                text.toLowerCase().startsWith('where ') ||
                text.toLowerCase().startsWith('can ') ||
                text.toLowerCase().startsWith('should ') ||
                text.toLowerCase().startsWith('is ') ||
                text.toLowerCase().startsWith('are ') ||
                text.toLowerCase().startsWith('do ') ||
                text.toLowerCase().startsWith('does ');

            if (isQuestion) {
                // Get answer from next sibling paragraphs
                let answer = '';
                let sibling = heading.nextElementSibling;
                let paragraphCount = 0;

                while (sibling && paragraphCount < 3) {
                    const tagName = sibling.tagName;

                    // Stop at next heading
                    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
                        break;
                    }

                    // Collect paragraph text
                    if (tagName === 'P') {
                        const paragraphText = sibling.textContent.trim();
                        if (paragraphText.length > 20) { // Ignore very short paragraphs
                            answer += paragraphText + ' ';
                            paragraphCount++;
                        }
                    }

                    // Also collect list items
                    if (tagName === 'UL' || tagName === 'OL') {
                        const listItems = sibling.querySelectorAll('li');
                        listItems.forEach((li, index) => {
                            if (index < 3) { // Limit list items
                                answer += li.textContent.trim() + '. ';
                            }
                        });
                        paragraphCount++;
                    }

                    sibling = sibling.nextElementSibling;

                    // Stop if answer is long enough
                    if (answer.length > 250) break;
                }

                // Only add if we found a substantial answer
                if (answer.length > 50 && answer.length < 500) {
                    faqs.push({
                        question: text,
                        answer: answer.trim().substring(0, 400) // Limit to 400 chars
                    });
                }
            }
        });
    } catch (error) {
        console.warn('FAQ extraction failed:', error);
        return [];
    }

    // Return max 5 FAQs (Google recommendation)
    return faqs.slice(0, 5);
}

/**
 * Check if content has potential FAQs
 * @param {string} content - HTML content
 * @returns {boolean}
 */
export function hasFAQContent(content) {
    if (!content) return false;

    const questionPatterns = [
        /\?/g,
        /how\s+/gi,
        /what\s+/gi,
        /why\s+/gi,
        /when\s+/gi,
        /where\s+/gi
    ];

    return questionPatterns.some(pattern => pattern.test(content));
}

export default {
    extractFAQFromContent,
    hasFAQContent
};
