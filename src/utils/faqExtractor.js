// src/utils/faqExtractor.js
/**
 * FAQ Extractor Utility
 * Auto-extracts FAQ schema from article content
 * Improves SERP visibility with rich snippets
 *
 * Detects:
 * 1. Question-style H2/H3 headings with answer paragraphs below
 * 2. <strong>Q:</strong> / <strong>A:</strong> inline patterns
 * 3. <dl> definition lists (<dt> = question, <dd> = answer)
 * 4. Items under "FAQ" / "Frequently Asked Questions" sections
 */

/**
 * Truncate text at the nearest sentence boundary
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncateAtSentence(text, maxLength = 500) {
    if (text.length <= maxLength) return text;

    // Try to cut at the last sentence boundary before maxLength
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('. ');
    const lastQuestion = truncated.lastIndexOf('? ');
    const lastExclaim = truncated.lastIndexOf('! ');
    const bestCut = Math.max(lastPeriod, lastQuestion, lastExclaim);

    if (bestCut > maxLength * 0.4) {
        return text.substring(0, bestCut + 1).trim();
    }

    // Fallback: cut at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? text.substring(0, lastSpace) : truncated).trim() + '...';
}

/**
 * Check if text looks like a question
 * @param {string} text
 * @returns {boolean}
 */
function isQuestionText(text) {
    const lower = text.toLowerCase().trim();
    return (
        text.endsWith('?') ||
        lower.startsWith('how ') ||
        lower.startsWith('what ') ||
        lower.startsWith('why ') ||
        lower.startsWith('when ') ||
        lower.startsWith('where ') ||
        lower.startsWith('which ') ||
        lower.startsWith('can ') ||
        lower.startsWith('should ') ||
        lower.startsWith('is ') ||
        lower.startsWith('are ') ||
        lower.startsWith('do ') ||
        lower.startsWith('does ') ||
        lower.startsWith('will ') ||
        lower.startsWith('would ')
    );
}

/**
 * Collect answer text from sibling elements after a heading
 * @param {Element} startSibling
 * @returns {string}
 */
function collectAnswer(startSibling) {
    let answer = '';
    let sibling = startSibling;
    let paragraphCount = 0;

    while (sibling && paragraphCount < 4) {
        const tagName = sibling.tagName;

        // Stop at next heading
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) break;

        // Collect paragraph text
        if (tagName === 'P') {
            const paragraphText = sibling.textContent.trim();
            if (paragraphText.length > 15) {
                answer += paragraphText + ' ';
                paragraphCount++;
            }
        }

        // Collect list items
        if (tagName === 'UL' || tagName === 'OL') {
            const listItems = sibling.querySelectorAll('li');
            listItems.forEach((li, index) => {
                if (index < 5) {
                    answer += li.textContent.trim() + '. ';
                }
            });
            paragraphCount++;
        }

        sibling = sibling.nextElementSibling;

        // Stop if answer is long enough
        if (answer.length > 400) break;
    }

    return answer.trim();
}

/**
 * Extract FAQ items from HTML content
 * @param {string} content - HTML content
 * @returns {Array} Array of {question, answer} objects
 */
export function extractFAQFromContent(content) {
    if (!content || typeof content !== 'string') return [];

    const faqs = [];
    const seenQuestions = new Set();

    const addFaq = (question, answer) => {
        const q = question.trim();
        const a = answer.trim();
        const qLower = q.toLowerCase();

        // Deduplicate and validate
        if (seenQuestions.has(qLower)) return;
        if (q.length < 10 || a.length < 30) return;

        seenQuestions.add(qLower);
        faqs.push({
            question: q,
            answer: truncateAtSentence(a, 500)
        });
    };

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        // ------------------------------------------------------------------
        // Strategy 1: Question-style H2/H3 headings
        // ------------------------------------------------------------------
        const headings = doc.querySelectorAll('h2, h3');

        headings.forEach((heading) => {
            const text = heading.textContent.trim();

            if (isQuestionText(text)) {
                const answer = collectAnswer(heading.nextElementSibling);
                addFaq(text, answer);
            }
        });

        // ------------------------------------------------------------------
        // Strategy 2: Inline Q&A patterns — <strong>Q:</strong> text
        // Common in WordPress FAQ blocks
        // ------------------------------------------------------------------
        const paragraphs = doc.querySelectorAll('p');

        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            const html = p.innerHTML;

            // Match patterns like <strong>Q:</strong> or <b>Q:</b> or Q:
            const qMatch = html.match(/^(?:<(?:strong|b)>)?\s*Q\s*[:\-]\s*(?:<\/(?:strong|b)>)?\s*(.+)/i);
            if (qMatch) {
                const questionText = p.textContent.replace(/^Q\s*[:\-]\s*/i, '').trim();

                // Look for the answer in the next paragraph(s)
                let answer = '';
                let j = i + 1;
                while (j < paragraphs.length && answer.length < 400) {
                    const nextP = paragraphs[j];
                    const nextHtml = nextP.innerHTML;

                    // Stop if we hit another Q:
                    if (/^(?:<(?:strong|b)>)?\s*Q\s*[:\-]/i.test(nextHtml)) break;

                    // Extract A: answer or plain paragraph
                    const aMatch = nextP.textContent.match(/^A\s*[:\-]\s*(.*)/i);
                    if (aMatch) {
                        answer += aMatch[1].trim() + ' ';
                    } else {
                        // Skip if it starts with another label
                        if (!/^(?:Q|A)\s*[:\-]/i.test(nextP.textContent)) {
                            answer += nextP.textContent.trim() + ' ';
                        }
                    }
                    j++;
                }

                addFaq(questionText, answer);
            }
        }

        // ------------------------------------------------------------------
        // Strategy 3: Definition lists — <dt> as question, <dd> as answer
        // ------------------------------------------------------------------
        const dts = doc.querySelectorAll('dt');
        dts.forEach((dt) => {
            const question = dt.textContent.trim();
            const dd = dt.nextElementSibling;
            if (dd && dd.tagName === 'DD') {
                addFaq(question, dd.textContent.trim());
            }
        });

        // ------------------------------------------------------------------
        // Strategy 4: FAQ section detection
        // If an H2/H3 says "FAQ" or "Frequently Asked Questions",
        // treat subsequent H3/H4 items as Q&A pairs regardless of format
        // ------------------------------------------------------------------
        headings.forEach((heading) => {
            const text = heading.textContent.trim().toLowerCase();
            const isFaqSection = (
                text === 'faq' ||
                text === 'faqs' ||
                text === 'frequently asked questions' ||
                text.startsWith('faq:') ||
                text.startsWith('faqs:')
            );

            if (!isFaqSection) return;

            // Walk siblings looking for sub-headings as questions
            let sibling = heading.nextElementSibling;
            while (sibling) {
                const tagName = sibling.tagName;

                // Stop at a same-level or higher heading (FAQ section is over)
                if (tagName === heading.tagName || tagName === 'H1' || tagName === 'H2' && heading.tagName === 'H3') {
                    break;
                }

                // Sub-headings within the FAQ section are treated as questions
                if (['H3', 'H4', 'H5'].includes(tagName)) {
                    const q = sibling.textContent.trim();
                    const a = collectAnswer(sibling.nextElementSibling);
                    addFaq(q.endsWith('?') ? q : q + '?', a);
                }

                sibling = sibling.nextElementSibling;
            }
        });

    } catch (error) {
        console.warn('FAQ extraction failed:', error);
        return [];
    }

    // Return max 8 FAQs (Google supports up to 10, 8 is a safe sweet spot)
    return faqs.slice(0, 8);
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
        /where\s+/gi,
        /Q\s*:/gi,
        /frequently\s+asked/gi,
        /<dt>/gi
    ];

    return questionPatterns.some(pattern => pattern.test(content));
}

export default {
    extractFAQFromContent,
    hasFAQContent
};
