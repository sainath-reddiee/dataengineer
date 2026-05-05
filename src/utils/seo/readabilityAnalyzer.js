// src/utils/seo/readabilityAnalyzer.js
// Readability analysis: Flesch-Kincaid, sentence length, paragraph analysis, passive voice detection.

/**
 * Analyze readability of text content.
 * @param {string} html - Raw HTML content
 * @returns {object} Readability metrics
 */
export function analyzeReadability(html) {
  if (!html) return null;

  // Strip HTML to plain text
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length < 50) return null;

  // Split into sentences (basic but effective)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  // Split into words
  const words = text.split(/\s+/).filter(w => w.length > 0);

  // Count syllables (English approximation)
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  // Split into paragraphs (from original HTML)
  const paragraphs = (html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [])
    .map(p => p.replace(/<[^>]*>/g, '').trim())
    .filter(p => p.length > 10);

  // Metrics
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = Math.round(wordCount / sentenceCount * 10) / 10;
  const avgSyllablesPerWord = totalSyllables / (wordCount || 1);

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschScore = Math.round(
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  );
  const fleschClamped = Math.max(0, Math.min(100, fleschScore));

  // Flesch-Kincaid Grade Level
  const gradeLevel = Math.round(
    (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59
  );

  // Long sentences (>25 words)
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25);

  // Very long paragraphs (>150 words)
  const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150);

  // Passive voice detection (approximate)
  const passivePatterns = /\b(is|are|was|were|been|being|be)\s+(being\s+)?\w+ed\b/gi;
  const passiveMatches = text.match(passivePatterns) || [];
  const passivePercentage = Math.round((passiveMatches.length / sentenceCount) * 100);

  // Transition words
  const transitionWords = [
    'however', 'therefore', 'furthermore', 'moreover', 'consequently',
    'nevertheless', 'meanwhile', 'additionally', 'similarly', 'in contrast',
    'for example', 'in other words', 'as a result', 'on the other hand',
    'first', 'second', 'third', 'finally', 'in conclusion'
  ];
  const lowerText = text.toLowerCase();
  const transitionCount = transitionWords.filter(tw => lowerText.includes(tw)).length;

  // Grade interpretation
  let readingLevel;
  if (fleschClamped >= 80) readingLevel = 'Very Easy (6th grade)';
  else if (fleschClamped >= 70) readingLevel = 'Easy (7th grade)';
  else if (fleschClamped >= 60) readingLevel = 'Standard (8-9th grade)';
  else if (fleschClamped >= 50) readingLevel = 'Fairly Difficult (10-12th grade)';
  else if (fleschClamped >= 30) readingLevel = 'Difficult (College)';
  else readingLevel = 'Very Difficult (Graduate)';

  // Overall score (for SEO, 60-70 is ideal for technical blogs)
  let overallScore = 100;
  const issues = [];
  const strengths = [];

  // Flesch score evaluation (technical content should be 40-70)
  if (fleschClamped >= 40 && fleschClamped <= 70) {
    strengths.push(`Readability score ${fleschClamped} — ideal for technical content`);
  } else if (fleschClamped < 30) {
    overallScore -= 20;
    issues.push({ severity: 'warning', text: `Readability score ${fleschClamped} — too difficult, simplify sentences` });
  } else if (fleschClamped > 80) {
    overallScore -= 5;
    issues.push({ severity: 'info', text: `Readability score ${fleschClamped} — very easy, may lack depth for technical audience` });
  }

  // Sentence length
  if (avgSentenceLength <= 20) {
    strengths.push(`Average sentence length: ${avgSentenceLength} words (good)`);
  } else if (avgSentenceLength > 25) {
    overallScore -= 15;
    issues.push({ severity: 'warning', text: `Average sentence length ${avgSentenceLength} words — aim for under 20` });
  } else {
    overallScore -= 5;
    issues.push({ severity: 'info', text: `Average sentence length ${avgSentenceLength} words — slightly long` });
  }

  // Long sentences
  if (longSentences.length > 5) {
    overallScore -= 10;
    issues.push({ severity: 'warning', text: `${longSentences.length} sentences over 25 words — break them up` });
  } else if (longSentences.length > 0) {
    issues.push({ severity: 'info', text: `${longSentences.length} long sentence(s) — consider splitting` });
  }

  // Passive voice
  if (passivePercentage > 20) {
    overallScore -= 10;
    issues.push({ severity: 'warning', text: `${passivePercentage}% passive voice — aim for under 15%` });
  } else if (passivePercentage <= 10) {
    strengths.push(`Low passive voice usage (${passivePercentage}%)`);
  }

  // Paragraph length
  if (longParagraphs.length > 3) {
    overallScore -= 10;
    issues.push({ severity: 'warning', text: `${longParagraphs.length} paragraphs over 150 words — add more breaks` });
  }

  // Transition words
  if (transitionCount >= 5) {
    strengths.push(`Good use of transition words (${transitionCount} found)`);
  } else {
    overallScore -= 5;
    issues.push({ severity: 'info', text: `Only ${transitionCount} transition words — add more for flow` });
  }

  return {
    score: Math.max(0, Math.min(100, overallScore)),
    fleschScore: fleschClamped,
    fleschGrade: gradeLevel,
    readingLevel,
    wordCount,
    sentenceCount,
    avgSentenceLength,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    paragraphCount: paragraphs.length,
    longSentences: longSentences.length,
    longParagraphs: longParagraphs.length,
    passivePercentage,
    transitionCount,
    issues,
    strengths,
    // Sample long sentences for display
    sampleLongSentences: longSentences.slice(0, 5).map(s => s.substring(0, 120) + (s.length > 120 ? '...' : '')),
  };
}

// Count syllables in an English word (approximation)
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;

  // Remove silent e
  word = word.replace(/e$/, '');

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;

  return Math.max(1, count);
}
