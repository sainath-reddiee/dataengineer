// src/utils/howToExtractor.js
/**
 * HowTo Schema Extractor Utility
 * Auto-extracts HowTo structured data from article content
 * Improves SERP visibility with rich snippets for tutorial/guide articles
 *
 * Detects:
 * 1. H2/H3 headings with "Step N:" prefix (e.g., "Step 1: Install dbt")
 * 2. Ordered lists under a "how to" / "steps" / "tutorial" section heading
 */

/**
 * Collect step description text from sibling elements after a heading
 * @param {Element} startSibling
 * @returns {string}
 */
function collectStepText(startSibling) {
  let text = '';
  let sibling = startSibling;
  let count = 0;

  while (sibling && count < 4) {
    const tagName = sibling.tagName;

    // Stop at next heading
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) break;

    if (tagName === 'P') {
      const pText = sibling.textContent.trim();
      if (pText.length > 10) {
        text += pText + ' ';
        count++;
      }
    }

    if (tagName === 'UL' || tagName === 'OL') {
      const items = sibling.querySelectorAll('li');
      items.forEach((li, i) => {
        if (i < 5) text += li.textContent.trim() + '. ';
      });
      count++;
    }

    if (tagName === 'PRE' || tagName === 'CODE') {
      text += sibling.textContent.trim().substring(0, 200) + ' ';
      count++;
    }

    sibling = sibling.nextElementSibling;
    if (text.length > 400) break;
  }

  return text.trim();
}

/**
 * Extract HowTo steps from HTML content
 * @param {string} content - HTML content
 * @returns {Array} Array of {name, text} objects, or empty array
 */
export function extractHowToSteps(content) {
  if (!content || typeof content !== 'string') return [];

  const steps = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Strategy 1: Headings with "Step N:" pattern
    const headings = doc.querySelectorAll('h2, h3');
    const stepPattern = /^step\s+\d+\s*[:\-–—]\s*/i;

    headings.forEach((heading) => {
      const rawText = heading.textContent.trim();
      if (stepPattern.test(rawText)) {
        const stepName = rawText.replace(stepPattern, '').trim() || rawText;
        const stepText = collectStepText(heading.nextElementSibling);
        if (stepText.length > 20) {
          steps.push({ name: stepName, text: stepText.substring(0, 500) });
        }
      }
    });

    // If we found step-pattern headings, return them
    if (steps.length >= 2) return steps;

    // Strategy 2: Ordered list under a "how to" / "steps" / "tutorial" section
    const sectionPattern = /^(how\s+to|steps|tutorial|getting\s+started|setup\s+guide|installation)/i;

    headings.forEach((heading) => {
      if (steps.length >= 2) return; // already found steps

      const text = heading.textContent.trim();
      if (!sectionPattern.test(text)) return;

      let sibling = heading.nextElementSibling;
      while (sibling) {
        const tagName = sibling.tagName;

        // Stop at same-level or higher heading
        if (['H1', 'H2'].includes(tagName) && heading.tagName === 'H2') break;
        if (['H1', 'H2', 'H3'].includes(tagName) && heading.tagName === 'H3') break;

        if (tagName === 'OL') {
          const items = sibling.querySelectorAll('li');
          items.forEach((li) => {
            const itemText = li.textContent.trim();
            if (itemText.length > 15) {
              // Use first sentence as name, rest as text
              const dotIndex = itemText.indexOf('. ');
              const name = dotIndex > 0 ? itemText.substring(0, dotIndex) : itemText.substring(0, 80);
              const desc = dotIndex > 0 ? itemText.substring(dotIndex + 2) : itemText;
              steps.push({ name: name, text: desc.substring(0, 500) });
            }
          });
          break;
        }

        sibling = sibling.nextElementSibling;
      }
    });

  } catch (error) {
    console.warn('HowTo extraction failed:', error);
    return [];
  }

  // Only return if we have at least 2 steps (HowTo schema requires meaningful steps)
  return steps.length >= 2 ? steps.slice(0, 10) : [];
}

export default { extractHowToSteps };
