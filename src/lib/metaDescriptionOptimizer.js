// src/lib/metaDescriptionOptimizer.js
/**
 * Meta Description Optimizer for Better CTR
 * Generates compelling, action-oriented meta descriptions
 */

/**
 * Action words that increase CTR
 */
const ACTION_WORDS = {
  learn: ['Master', 'Learn', 'Discover', 'Unlock'],
  build: ['Build', 'Create', 'Develop', 'Implement'],
  guide: ['Complete Guide', 'Step-by-Step Guide', 'Ultimate Guide', 'Comprehensive Tutorial'],
  quick: ['Quick', 'Fast', 'Easy', 'Simple'],
  advanced: ['Advanced', 'Expert', 'Pro', 'Professional'],
  free: ['Free', 'Open Source', 'No Cost'],
};

/**
 * Power words that increase engagement
 */
const POWER_WORDS = [
  'proven', 'essential', 'ultimate', 'complete', 'comprehensive',
  'practical', 'real-world', 'production-ready', 'battle-tested',
  'expert', 'professional', 'industry-standard', 'best practices'
];

/**
 * Call-to-action phrases
 */
const CTA_PHRASES = [
  'Start now →',
  'Get started today →',
  'Learn more →',
  'Read the full guide →',
  'Try it yourself →',
  'See examples →',
  'Download code →',
];

/**
 * Optimize meta description for better CTR
 * @param {Object} options - Description options
 * @param {string} options.title - Article title
 * @param {string} options.excerpt - Article excerpt
 * @param {string} options.category - Article category
 * @param {Array} options.tags - Article tags
 * @param {number} options.readTime - Estimated read time
 * @returns {string} Optimized meta description
 */
export function optimizeMetaDescription({
  title,
  excerpt,
  category,
  tags = [],
  readTime = 5
}) {
  // Strategy 1: For tutorial/guide articles
  if (isTutorialArticle(title, tags)) {
    return generateTutorialDescription({ title, excerpt, readTime });
  }

  // Strategy 2: For comparison/vs articles
  if (isComparisonArticle(title)) {
    return generateComparisonDescription({ title, excerpt });
  }

  // Strategy 3: For how-to articles
  if (isHowToArticle(title)) {
    return generateHowToDescription({ title, excerpt, readTime });
  }

  // Strategy 4: For interview/certification prep
  if (isInterviewArticle(title, tags)) {
    return generateInterviewDescription({ title, excerpt });
  }

  // Default: Enhanced excerpt with CTA
  return generateDefaultDescription({ title, excerpt, readTime });
}

/**
 * Check if article is a tutorial
 */
function isTutorialArticle(title, tags) {
  const tutorialKeywords = ['tutorial', 'guide', 'learn', 'master', 'course'];
  const titleLower = title.toLowerCase();
  const tagNames = tags.map(t => (typeof t === 'string' ? t : t.name).toLowerCase());

  return tutorialKeywords.some(keyword =>
    titleLower.includes(keyword) || tagNames.includes(keyword)
  );
}

/**
 * Check if article is a comparison
 */
function isComparisonArticle(title) {
  const comparisonKeywords = ['vs', 'versus', 'comparison', 'compare', 'difference'];
  return comparisonKeywords.some(keyword => title.toLowerCase().includes(keyword));
}

/**
 * Check if article is how-to
 */
function isHowToArticle(title) {
  const howToKeywords = ['how to', 'how-to', 'build', 'create', 'implement'];
  return howToKeywords.some(keyword => title.toLowerCase().includes(keyword));
}

/**
 * Check if article is interview/cert prep
 */
function isInterviewArticle(title, tags) {
  const interviewKeywords = ['interview', 'certification', 'exam', 'questions', 'prep'];
  const titleLower = title.toLowerCase();
  const tagNames = tags.map(t => (typeof t === 'string' ? t : t.name).toLowerCase());

  return interviewKeywords.some(keyword =>
    titleLower.includes(keyword) || tagNames.includes(keyword)
  );
}

/**
 * Generate tutorial description
 */
function generateTutorialDescription({ title, excerpt, readTime }) {
  const cleanExcerpt = cleanText(excerpt);
  const topic = extractMainTopic(title);

  // Inject power word based on topic
  const powerWord = selectPowerWord(topic);
  const hook = `${powerWord} ${topic} with this comprehensive guide.`;
  const value = `${cleanExcerpt.substring(0, 75)}...`;
  const cta = `${readTime} min read. Start learning →`;

  return truncateToLimit(`${hook} ${value} ${cta}`, 155);
}

/**
 * Select appropriate power word based on topic
 */
function selectPowerWord(topic) {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes('snowflake') || topicLower.includes('databricks')) {
    return 'Master';
  }
  if (topicLower.includes('aws') || topicLower.includes('azure')) {
    return 'Build production-ready';
  }
  if (topicLower.includes('interview') || topicLower.includes('certification')) {
    return 'Ace';
  }
  if (topicLower.includes('optimization') || topicLower.includes('performance')) {
    return 'Optimize';
  }

  return 'Learn';
}

/**
 * Generate comparison description
 */
function generateComparisonDescription({ title, excerpt }) {
  const cleanExcerpt = cleanText(excerpt);
  const hook = `Detailed comparison to help you choose the right solution.`;
  const value = `${cleanExcerpt.substring(0, 70)}...`;
  const cta = `See the full analysis →`;

  return truncateToLimit(`${hook} ${value} ${cta}`, 155);
}

/**
 * Generate how-to description
 */
function generateHowToDescription({ title, excerpt, readTime }) {
  const cleanExcerpt = cleanText(excerpt);
  const hook = `Step-by-step guide with code examples.`;
  const value = `${cleanExcerpt.substring(0, 75)}...`;
  const cta = `${readTime} min tutorial →`;

  return truncateToLimit(`${hook} ${value} ${cta}`, 155);
}

/**
 * Generate interview description
 */
function generateInterviewDescription({ title, excerpt }) {
  const cleanExcerpt = cleanText(excerpt);
  const hook = `Ace your interview with expert answers and proven strategies.`;
  const value = `${cleanExcerpt.substring(0, 65)}...`;
  const cta = `Prepare now →`;

  return truncateToLimit(`${hook} ${value} ${cta}`, 155);
}

/**
 * Generate default description
 */
function generateDefaultDescription({ title, excerpt, readTime }) {
  const cleanExcerpt = cleanText(excerpt);
  const hook = `Expert insights on ${extractMainTopic(title)}.`;
  const value = `${cleanExcerpt.substring(0, 80)}...`;
  const cta = `Read more →`;

  return truncateToLimit(`${hook} ${value} ${cta}`, 155);
}

/**
 * Extract main topic from title
 */
function extractMainTopic(title) {
  // Remove common prefixes
  let topic = title
    .replace(/^(How to|Guide to|Tutorial:|Learn|Master|Build|Create|Complete Guide to)/i, '')
    .trim();

  // Take first few words
  const words = topic.split(' ').slice(0, 4);
  return words.join(' ');
}

/**
 * Clean text (remove HTML, extra spaces)
 */
function cleanText(text) {
  if (!text) return '';

  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
}

/**
 * Truncate to character limit
 */
function truncateToLimit(text, limit = 155) {
  if (text.length <= limit) return text;

  // Find last complete word before limit
  const truncated = text.substring(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');

  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Add urgency/scarcity to description
 */
export function addUrgency(description, type = 'trending') {
  const urgencyPhrases = {
    trending: '🔥 Trending now!',
    new: '✨ New for 2026!',
    updated: '📝 Recently updated!',
    popular: '⭐ Most popular!',
  };

  const phrase = urgencyPhrases[type] || '';
  return `${phrase} ${description}`.trim();
}

/**
 * Add social proof to description
 */
export function addSocialProof(description, stats) {
  if (stats?.views > 1000) {
    return `${description} (${Math.floor(stats.views / 1000)}K+ readers)`;
  }
  return description;
}

/**
 * A/B test descriptions
 * Returns different variations for testing
 */
export function getDescriptionVariation(baseDescription, variation = 'A') {
  const variations = {
    A: baseDescription, // Control
    B: addUrgency(baseDescription, 'trending'), // With urgency
    C: `💡 ${baseDescription}`, // With emoji
    D: baseDescription.replace('→', '✓'), // Different CTA
  };

  return variations[variation] || baseDescription;
}

export default {
  optimizeMetaDescription,
  addUrgency,
  addSocialProof,
  getDescriptionVariation,
};
