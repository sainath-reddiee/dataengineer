// src/utils/articleSimilarity.js
// Pure-JS topical similarity utilities for retrieval-augmented internal linking.
// Extracts high-signal terms from articles and ranks candidates by relevance to
// a target. Designed to pre-filter before sending candidates to an LLM, so the
// AI only sees genuinely relevant articles instead of all 100 with thin context.
//
// Zero network, zero AI — runs locally in microseconds even at 100 articles.

const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
    'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'up', 'down', 'into', 'onto', 'upon', 'over', 'under', 'about', 'as',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'there', 'where',
    'when', 'how', 'why', 'what', 'which', 'who', 'whom', 'whose', 'i', 'we', 'you', 'he', 'she',
    'me', 'us', 'him', 'her', 'my', 'our', 'your', 'his', 'hers', 'mine', 'ours', 'yours',
    'so', 'if', 'then', 'than', 'because', 'while', 'though', 'although', 'unless', 'until',
    'just', 'only', 'also', 'too', 'very', 'really', 'quite', 'such', 'some', 'any', 'all',
    'each', 'every', 'no', 'not', 'nor', 'one', 'two', 'three', 'use', 'using', 'used',
    'get', 'got', 'getting', 'make', 'made', 'making', 'go', 'going', 'gone', 'come', 'came',
    'see', 'saw', 'seen', 'know', 'knew', 'known', 'think', 'thought', 'work', 'works', 'working',
    'way', 'ways', 'time', 'times', 'thing', 'things', 'lot', 'lots', 'kind', 'kinds', 'sort',
    'like', 'likes', 'want', 'wants', 'wanted', 'need', 'needs', 'needed', 'show', 'shows',
    'article', 'articles', 'post', 'posts', 'blog', 'guide', 'guides', 'tutorial', 'tutorials',
    'example', 'examples', 'data', // 'data' is too generic for a data-engineering blog
    'will', 'would', 'should', 'could', 'lets', 'let', 'doesnt', 'dont', 'cant', 'wont',
]);

function stripHtml(html) {
    return (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function extractHeadings(html) {
    const out = [];
    const re = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
    let m;
    while ((m = re.exec(html || '')) !== null) {
        const text = stripHtml(m[1]);
        if (text) out.push(text);
    }
    return out;
}

function extractCodeTokens(html) {
    const out = [];
    const re = /<code[^>]*>([\s\S]*?)<\/code>/gi;
    let m;
    while ((m = re.exec(html || '')) !== null) {
        const text = stripHtml(m[1]).toLowerCase();
        // Pick out SQL-ish keywords + identifiers (uppercase originally, common in SQL/code)
        const tokens = text.match(/\b[a-z_][a-z0-9_]{2,}\b/g) || [];
        tokens.forEach(t => out.push(t));
    }
    return out;
}

function extractCapitalizedPhrases(html) {
    const text = stripHtml(html);
    // Match sequences of 1-4 Capitalized words (proper nouns / product names)
    const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z0-9]+){0,3})\b/g;
    const out = [];
    let m;
    while ((m = re.exec(text)) !== null) {
        const phrase = m[1].toLowerCase();
        // Skip single common words at sentence starts
        if (phrase.split(' ').length === 1 && phrase.length < 5) continue;
        out.push(phrase);
    }
    return out;
}

function tokenizeWords(text) {
    return (text.toLowerCase().match(/\b[a-z][a-z0-9-]{2,}\b/g) || [])
        .filter(w => !STOPWORDS.has(w));
}

/**
 * Extract 15-25 high-signal topic terms from a single article.
 * Combines headings (high weight), code tokens, capitalized phrases (proper nouns),
 * and frequency-weighted body unigrams.
 *
 * @param {{title: string, content: string}} article
 * @returns {{terms: string[], weights: Map<string, number>}}
 */
export function extractTopicTerms(article) {
    if (!article) return { terms: [], weights: new Map() };
    const html = article.content || '';
    const title = article.title || '';

    // Term frequency map
    const tf = new Map();
    const bump = (term, weight) => {
        if (!term || term.length < 3) return;
        if (STOPWORDS.has(term)) return;
        tf.set(term, (tf.get(term) || 0) + weight);
    };

    // Title terms — highest weight
    tokenizeWords(title).forEach(t => bump(t, 8));
    // Multi-word phrases from title (bigrams)
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
    for (let i = 0; i < titleWords.length - 1; i++) {
        bump(`${titleWords[i]} ${titleWords[i + 1]}`, 10);
    }

    // Headings — high weight
    extractHeadings(html).forEach(h => {
        tokenizeWords(h).forEach(t => bump(t, 4));
    });

    // Capitalized phrases (proper nouns / product names) — strong signal
    extractCapitalizedPhrases(html).forEach(p => {
        bump(p, 5);
    });

    // Code tokens — technical signals
    extractCodeTokens(html).forEach(t => {
        bump(t, 2);
    });

    // Body unigrams — base frequency signal
    const body = stripHtml(html).toLowerCase();
    const bodyTokens = tokenizeWords(body);
    bodyTokens.forEach(t => bump(t, 1));

    // Filter out very low-frequency noise (only in body once and not boosted by other sources)
    const filtered = [...tf.entries()].filter(([term, w]) => {
        // Keep multi-word phrases regardless
        if (term.includes(' ')) return w >= 2;
        // For single words, require either signal weight > 1 or appears 3+ times in body
        return w >= 3;
    });

    // Sort by weight desc, take top 25
    filtered.sort((a, b) => b[1] - a[1]);
    const top = filtered.slice(0, 25);
    return {
        terms: top.map(([t]) => t),
        weights: new Map(top),
    };
}

/**
 * Score a candidate article's relevance to a target (0-100).
 * Higher = more topically relevant.
 *
 * @param {{terms: string[], weights: Map}} targetTerms
 * @param {{title: string, slug: string, content: string, category?: string}} target
 * @param {{title: string, slug: string, content: string, category?: string}} candidate
 * @param {{terms: string[], weights: Map}} candidateTerms
 * @returns {{score: number, matchedTerms: string[], reason: string}}
 */
export function scoreCandidateRelevance(targetTerms, target, candidate, candidateTerms) {
    if (!candidate || candidate.slug === target.slug) {
        return { score: 0, matchedTerms: [], reason: 'self' };
    }

    const targetSet = new Set(targetTerms.terms);
    const candSet = new Set(candidateTerms.terms);

    // Title overlap (high weight)
    const targetTitleTokens = new Set(tokenizeWords(target.title || ''));
    const candTitleTokens = tokenizeWords(candidate.title || '');
    const titleOverlap = candTitleTokens.filter(t => targetTitleTokens.has(t)).length;
    const titleScore = Math.min(35, titleOverlap * 12); // up to 35 pts

    // Body term overlap weighted by target's term importance
    let bodyScore = 0;
    const matched = [];
    candSet.forEach(term => {
        if (targetSet.has(term)) {
            const w = targetTerms.weights.get(term) || 1;
            bodyScore += Math.min(w, 8);
            matched.push(term);
        }
    });
    bodyScore = Math.min(45, bodyScore); // up to 45 pts

    // Same category — small bonus
    let categoryScore = 0;
    if (target.category && candidate.category && target.category === candidate.category) {
        categoryScore = 8;
    }

    // Multi-word phrase match — strong signal
    let phraseScore = 0;
    targetTerms.terms.forEach(term => {
        if (term.includes(' ') && candSet.has(term)) {
            phraseScore += 6;
        }
    });
    phraseScore = Math.min(20, phraseScore);

    const total = Math.min(100, Math.round(titleScore + bodyScore + categoryScore + phraseScore));

    let reason;
    if (total >= 70) reason = 'strong overlap';
    else if (total >= 50) reason = 'meaningful overlap';
    else if (total >= 30) reason = 'partial overlap';
    else if (total >= 15) reason = 'weak overlap';
    else reason = 'minimal overlap';

    return {
        score: total,
        matchedTerms: matched.slice(0, 8),
        reason,
        breakdown: { titleScore, bodyScore, categoryScore, phraseScore },
    };
}

/**
 * Rank all candidates by relevance to target. Returns the top N.
 *
 * @param {Object} target - WordPress article shape { slug, title, content, category }
 * @param {Array} allArticles - Same shape
 * @param {number} topN - How many to keep
 * @returns {Array} - [{ ...candidate, relevance: { score, matchedTerms, reason } }]
 */
export function rankCandidates(target, allArticles, topN = 15) {
    const targetTerms = extractTopicTerms(target);
    const others = allArticles.filter(a => a.slug !== target.slug);

    const scored = others.map(candidate => {
        const candidateTerms = extractTopicTerms(candidate);
        const relevance = scoreCandidateRelevance(targetTerms, target, candidate, candidateTerms);
        return { ...candidate, relevance };
    });

    scored.sort((a, b) => b.relevance.score - a.relevance.score);
    return {
        targetTerms,
        ranked: scored.slice(0, topN),
        allScored: scored, // for stats
    };
}

export default { extractTopicTerms, scoreCandidateRelevance, rankCandidates };
