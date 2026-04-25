// src/data/practice/_schema.js
// Schema definitions (JSDoc) for the practice quiz platform.
// These define the contract for metadata.json, topics.json, and questions.json.

/**
 * ============================================================
 * AUTHORING STYLE GUIDE (read before adding or reviewing a question)
 * ============================================================
 *
 * Quality bar (every question must meet all of these):
 *   1. SCENARIO STEM: the question frames a realistic engineering decision,
 *      not trivia. Prefer "A pipeline does X with constraints Y and Z - what
 *      is the best fix?" over "What does command X do?".
 *   2. PLAUSIBLE DISTRACTORS: each wrong option must be something a working
 *      engineer might actually choose. No obviously absurd answers, no
 *      "all of the above", no "none of the above".
 *   3. EXPLANATION DEPTH: target 200-350 words. Must include:
 *        - why the correct answer is correct (mechanism, not restatement)
 *        - a per-distractor rationale in the form "**X wrong**: ..." for
 *          EACH incorrect option
 *        - official doc references in the `references` array
 *      Use markdown: `**bold**` for emphasis, `\n\n` for paragraph breaks,
 *      backticks for code / SQL / identifiers.
 *   4. REFERENCES: at least one link to official vendor documentation
 *      (docs.snowflake.com, docs.databricks.com, docs.aws.amazon.com).
 *      Blog article slugs allowed only as secondary links.
 *   5. TAGS: 2-5 free-form tags for filtering (e.g. "replication", "rbac").
 *   6. PROVENANCE: set `source` to "human" | "ai-groq" | "ai-gemini".
 *      AI-sourced questions MUST also set `reviewedAt` (ISO date) once a
 *      human has edited and approved them; unreviewed AI output must not
 *      ship to production bundles.
 *
 * Forbidden patterns (reviewer MUST reject):
 *   - Verbatim or near-verbatim copies from ExamTopics, PrepAway, Udemy
 *     dumps, or any other paid/leaked question bank (IP / NDA risk).
 *   - Content from private beta, PrPr, or internal-only Snowflake
 *     features not yet documented publicly (NDA risk).
 *   - "All of the above" / "None of the above" / "Both A and B" options.
 *   - Trick questions that hinge on a single-word misreading of the stem.
 *   - Ambiguous correct answers (more than one option is defensible).
 *   - Stems that require memorising exact numeric limits without context
 *     (prefer "which limit applies" over "what is the exact number").
 *   - Explanations under 100 words, or explanations that just restate the
 *     correct option without explaining the mechanism.
 *
 * Review checklist for AI-generated questions (before setting reviewedAt):
 *   [ ] Stem reflects a real engineering scenario, not pattern-matched
 *       textbook phrasing.
 *   [ ] All facts verified against the referenced official docs.
 *   [ ] No hallucinated feature names, option values, or syntax.
 *   [ ] Distractors are plausible and mutually exclusive with the answer.
 *   [ ] Explanation has `**why right**` plus one `**X wrong**` paragraph
 *       per distractor.
 *   [ ] References resolve to a public URL and support the claim.
 *   [ ] topicSlug maps to an existing topic in topics.json.
 *   [ ] `validateQuestion` below returns `{ valid: true }`.
 *   [ ] source set to the generator ("ai-groq" / "ai-gemini").
 *   [ ] reviewedAt set to today's ISO date once all above are satisfied.
 *
 * This style guide is also consumed by scripts/generate-quiz-questions.mjs
 * as a prompt fragment, so keep phrasing that the LLM should echo here
 * (scenario stem, per-distractor rationale, doc-grounded references).
 */

/**
 * @typedef {Object} Topic
 * @property {string} slug        URL-safe topic identifier, e.g. "data-loading"
 * @property {string} name        Human-readable topic name
 * @property {string} [description]  Optional short description
 * @property {number} [weight]    Official exam weight % (0-100) if known
 * @property {string[]} [relatedArticles]  Array of blog article slugs for remediation links
 */

/**
 * @typedef {Object} Question
 * @property {string} id                Unique stable ID, e.g. "spc-001". Must be unique within a quiz.
 * @property {string} slug              URL-safe slug for deep link /q/:slug
 * @property {string} topicSlug         Must match a topic.slug in topics.json
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {'single'|'multi'|'truefalse'} type  single = radio, multi = checkbox
 * @property {string} stem              The question text (markdown allowed)
 * @property {Array<{id: string, text: string}>} options  Answer choices
 * @property {string[]} correctIds      IDs of correct option(s). For 'single', length=1.
 * @property {string} explanation       Explanation shown after answering (markdown)
 * @property {string[]} [references]    Array of URLs (docs, blog articles) for further reading
 * @property {string[]} [tags]          Free-form tags for filtering
 * @property {string} [source]          'human' | 'ai-groq' | 'ai-gemini' - provenance
 * @property {string} [reviewedAt]      ISO date when human-reviewed (for AI-generated)
 */

/**
 * @typedef {Object} QuizMeta
 * @property {string} slug              URL-safe cert identifier, e.g. "snowpro-core"
 * @property {string} title             Full display title, e.g. "SnowPro Core Certification"
 * @property {string} shortTitle        Short name for nav/breadcrumbs
 * @property {string} provider          "Snowflake" | "Databricks" | "AWS" | ...
 * @property {string} examCode          Official exam code, e.g. "COF-C02"
 * @property {string} description       1-2 sentence description
 * @property {string} longDescription   Longer description for hub cards (markdown)
 * @property {number} durationMinutes   Official exam duration
 * @property {number} passingScore      Passing % (0-100)
 * @property {number} totalOfficialQuestions  # of questions on real exam
 * @property {string[]} officialDomains        List of exam domain names
 * @property {string} difficulty        "Foundational" | "Associate" | "Professional" | "Specialty"
 * @property {string} [officialUrl]     Official certification page URL
 * @property {string[]} prerequisites   List of recommended prior knowledge
 * @property {string} heroGradient      Tailwind gradient classes for card hero
 * @property {string} icon              Lucide icon name
 * @property {string} color             Primary accent color (tailwind name)
 */

/**
 * @typedef {Object} Attempt
 * @property {string} id            Unique attempt ID (uuid-like)
 * @property {string} quizSlug
 * @property {'practice'|'exam'|'topic'|'review'} mode
 * @property {number} score         Percentage 0-100
 * @property {number} correct
 * @property {number} total
 * @property {number} durationSec   Elapsed time
 * @property {string} startedAt     ISO timestamp
 * @property {string} finishedAt    ISO timestamp
 * @property {Record<string, {correct: boolean, selectedIds: string[], timeSec: number}>} answers
 * @property {string} [topicSlug]   If mode='topic'
 */

/**
 * Validate a question object's shape. Returns { valid: boolean, errors: string[] }.
 * Used by validate-quiz-questions.mjs script.
 * @param {Question} q
 * @param {Topic[]} topics
 */
export function validateQuestion(q, topics = []) {
  const errors = [];
  if (!q.id || typeof q.id !== 'string') errors.push('Missing/invalid id');
  if (!q.slug || typeof q.slug !== 'string') errors.push('Missing/invalid slug');
  if (!q.topicSlug) errors.push('Missing topicSlug');
  if (topics.length && !topics.find((t) => t.slug === q.topicSlug)) {
    errors.push(`topicSlug "${q.topicSlug}" not in topics.json`);
  }
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
    errors.push('difficulty must be easy|medium|hard');
  }
  if (!['single', 'multi', 'truefalse'].includes(q.type)) {
    errors.push('type must be single|multi|truefalse');
  }
  if (!q.stem || typeof q.stem !== 'string') errors.push('Missing/invalid stem');
  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push('options must be an array of at least 2');
  } else {
    q.options.forEach((o, i) => {
      if (!o.id || !o.text) errors.push(`option[${i}] missing id or text`);
    });
  }
  if (!Array.isArray(q.correctIds) || q.correctIds.length === 0) {
    errors.push('correctIds must be a non-empty array');
  } else {
    const optionIds = new Set((q.options || []).map((o) => o.id));
    q.correctIds.forEach((cid) => {
      if (!optionIds.has(cid)) errors.push(`correctId "${cid}" not in options`);
    });
    if (q.type === 'single' && q.correctIds.length !== 1) {
      errors.push('single-type questions must have exactly 1 correctId');
    }
  }
  if (!q.explanation) errors.push('Missing explanation');
  return { valid: errors.length === 0, errors };
}

export const QUESTION_SOURCES = ['human', 'ai-groq', 'ai-gemini'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const QUESTION_TYPES = ['single', 'multi', 'truefalse'];
