// src/utils/ctrScorer.js
// Heuristic CTR scorer for SERP titles + meta descriptions.
//
// Scores a (title, description, url) triple against published CTR-lift
// benchmarks (Backlinko 2023 / Moz 2022 / AdvancedWebRanking 2024). Returns
// a per-factor breakdown + composite score 0-100 + projected-lift delta.
//
// Pure function. No network, no side effects. Safe for SSR and web workers.

/* ---------- benchmark table ---------- */
// Lift percentages are modeled as multiplicative factors the rule adds to
// a baseline "this title is unoptimized" CTR. We treat them as additive
// points toward a 0-100 composite (capped per-rule) so they compose linearly
// without double-counting. Numbers are conservative industry medians.
export const BENCHMARKS = {
    // Title rules
    TITLE_LEN_IDEAL:      { points: 18, lift: '+0%',   label: 'Length 50-60 chars (ideal SERP width)' },
    TITLE_LEN_ACCEPTABLE: { points:  8, lift: '-5%',   label: 'Length 40-70 chars (acceptable)' },
    TITLE_LEN_BAD:        { points:  0, lift: '-22%',  label: 'Length outside 40-70 — gets truncated' },
    TITLE_HAS_NUMBER:     { points: 12, lift: '+15%',  label: 'Contains a number (listicle signal)' },
    TITLE_HAS_YEAR:       { points: 10, lift: '+12%',  label: 'Contains current/adjacent year' },
    TITLE_HAS_BRACKETS:   { points:  8, lift: '+16%',  label: 'Has brackets/parens (HubSpot: +38% on short titles)' },
    TITLE_HAS_POWER_WORD: { points: 10, lift: '+10%',  label: 'Contains a power word' },
    TITLE_HAS_EMOTION:    { points:  6, lift: '+7%',   label: 'Contains an emotional modifier' },
    TITLE_HAS_HOW_TO:     { points:  6, lift: '+5%',   label: 'Starts with How / Why / What (search-intent match)' },

    // Description rules
    DESC_LEN_IDEAL:       { points: 12, lift: '+0%',   label: 'Length 120-160 chars (ideal SERP width)' },
    DESC_LEN_ACCEPTABLE:  { points:  5, lift: '-5%',   label: 'Length 100-170 chars (acceptable)' },
    DESC_LEN_BAD:         { points:  0, lift: '-15%',  label: 'Length outside 100-170 — truncated or padded' },
    DESC_HAS_CTA:         { points:  6, lift: '+8%',   label: 'Contains a call-to-action verb' },
    DESC_HAS_YEAR:        { points:  4, lift: '+5%',   label: 'Contains year (freshness signal)' },
    DESC_HAS_BENEFIT:     { points:  4, lift: '+6%',   label: 'Contains a benefit phrase' },
    DESC_STARTS_ACTION:   { points:  4, lift: '+4%',   label: 'Starts with an action verb' },

    // Keyword alignment rules (only scored when GSC keywords are provided)
    KW_PRIMARY_IN_TITLE:    { points: 20, lift: '+25%',  label: 'Primary keyword appears in title (GSC #1 query)' },
    KW_PRIMARY_FRONT:       { points: 10, lift: '+12%',  label: 'Primary keyword is in first half of title' },
    KW_SECONDARY_IN_DESC:   { points:  8, lift: '+8%',   label: 'Secondary keyword appears in description' },
    KW_COVERAGE:            { points:  6, lift: '+6%',   label: '3+ top keywords present in title+description' },
};

const POWER_WORDS = [
    'best', 'complete', 'ultimate', 'guide', 'fix', 'stop', 'avoid', 'prevent',
    'master', 'pro', 'expert', 'advanced', 'beginner', 'definitive', 'proven',
    'free', 'new', 'top', 'essential', 'critical', 'actionable',
];

const EMOTION_WORDS = [
    'stunning', 'powerful', 'incredible', 'shocking', 'surprising', 'simple',
    'easy', 'fast', 'instant', 'smart', 'brilliant', 'clever', 'painless',
    'effortless', 'bulletproof',
];

const HOW_STARTERS = /^(how|why|what|when|where|which)\b/i;

const CTA_VERBS = [
    'learn', 'discover', 'find', 'get', 'start', 'build', 'create', 'master',
    'optimize', 'automate', 'deploy', 'ship', 'avoid', 'stop', 'fix', 'reduce',
    'save', 'boost', 'improve', 'compare', 'choose', 'pick',
];

const BENEFIT_PHRASES = [
    'save time', 'save money', 'step by step', 'without', 'in minutes',
    'at scale', 'production-ready', 'real-world', 'hands-on', 'no code',
    'for free', 'today', 'fast', 'in 5 min', 'in 10 min',
];

const ACTION_STARTERS = /^(learn|discover|find|get|start|build|create|master|explore|see|understand|compare|choose|read|use|try|avoid|stop|fix|reduce|save|boost|improve)\b/i;

const NUMBER_RE      = /\b\d+\b/;
const BRACKET_RE     = /\[[^\]]+\]|\([^)]+\)/;
const CURRENT_YEAR   = new Date().getUTCFullYear();
const YEAR_RE        = new RegExp(`\\b(${CURRENT_YEAR - 1}|${CURRENT_YEAR}|${CURRENT_YEAR + 1})\\b`);

const containsAny = (text, list) => {
    const lc = text.toLowerCase();
    return list.some(w => lc.includes(w));
};

/* ---------- scorers ---------- */

const scoreTitle = (title = '') => {
    const t = String(title || '').trim();
    const hits = [];
    const misses = [];
    const add = (k, ok) => (ok ? hits : misses).push(k);

    const len = t.length;
    if (len >= 50 && len <= 60)       add('TITLE_LEN_IDEAL', true);
    else if (len >= 40 && len <= 70)  add('TITLE_LEN_ACCEPTABLE', true);
    else                               add('TITLE_LEN_BAD', true);

    add('TITLE_HAS_NUMBER',      NUMBER_RE.test(t));
    add('TITLE_HAS_YEAR',        YEAR_RE.test(t));
    add('TITLE_HAS_BRACKETS',    BRACKET_RE.test(t));
    add('TITLE_HAS_POWER_WORD',  containsAny(t, POWER_WORDS));
    add('TITLE_HAS_EMOTION',     containsAny(t, EMOTION_WORDS));
    add('TITLE_HAS_HOW_TO',      HOW_STARTERS.test(t));

    return { hits, misses, len };
};

const scoreDescription = (desc = '') => {
    const d = String(desc || '').trim();
    const hits = [];
    const misses = [];
    const add = (k, ok) => (ok ? hits : misses).push(k);

    const len = d.length;
    if (len >= 120 && len <= 160)      add('DESC_LEN_IDEAL', true);
    else if (len >= 100 && len <= 170) add('DESC_LEN_ACCEPTABLE', true);
    else                                add('DESC_LEN_BAD', true);

    add('DESC_HAS_CTA',         containsAny(d, CTA_VERBS));
    add('DESC_HAS_YEAR',        YEAR_RE.test(d));
    add('DESC_HAS_BENEFIT',     containsAny(d, BENEFIT_PHRASES));
    add('DESC_STARTS_ACTION',   ACTION_STARTERS.test(d));

    return { hits, misses, len };
};

/* ---------- keyword alignment scorer ---------- */

/**
 * Score keyword alignment between title/description and actual GSC search queries.
 * Only invoked when gscKeywords array is provided.
 *
 * @param {string} title
 * @param {string} description
 * @param {Array} gscKeywords - [{ query, impressions, clicks, ctr, position }] sorted by impressions desc
 * @returns {{ hits: string[], misses: string[] }}
 */
const scoreKeywords = (title = '', description = '', gscKeywords = []) => {
    if (!gscKeywords || gscKeywords.length === 0) return { hits: [], misses: [] };

    const hits = [];
    const misses = [];
    const add = (k, ok) => (ok ? hits : misses).push(k);
    const titleLc = title.toLowerCase();
    const descLc = description.toLowerCase();
    const combined = titleLc + ' ' + descLc;

    // Primary keyword = highest impression query
    const primary = gscKeywords[0]?.query?.toLowerCase() || '';
    const primaryInTitle = primary && titleLc.includes(primary);
    add('KW_PRIMARY_IN_TITLE', primaryInTitle);

    // Primary keyword front-loaded (in first half of title)
    if (primaryInTitle) {
        const firstHalf = titleLc.substring(0, Math.ceil(titleLc.length / 2));
        add('KW_PRIMARY_FRONT', firstHalf.includes(primary));
    } else {
        add('KW_PRIMARY_FRONT', false);
    }

    // Secondary keyword in description (2nd highest impression query)
    const secondary = gscKeywords[1]?.query?.toLowerCase() || '';
    add('KW_SECONDARY_IN_DESC', secondary && descLc.includes(secondary));

    // Coverage: 3+ of top 5 keywords present in title+description
    const top5 = gscKeywords.slice(0, 5).map(kw => kw.query.toLowerCase());
    const presentCount = top5.filter(q => combined.includes(q)).length;
    add('KW_COVERAGE', presentCount >= 3);

    return { hits, misses };
};

/* ---------- public api ---------- */

/**
 * Score a (title, description) pair, optionally against real GSC keywords.
 *
 * @param {object} input  { title, description, url?, gscKeywords? }
 *   gscKeywords: optional array of [{ query, impressions, clicks, ctr, position }]
 *   sorted by impressions descending. When provided, keyword alignment factors
 *   are included in the score (KW_PRIMARY_IN_TITLE, KW_PRIMARY_FRONT, etc.)
 * @returns {object} {
 *   score:          0..100 composite
 *   grade:          'A'|'B'|'C'|'D'|'F'
 *   title:          { len, hits[], misses[] }
 *   description:    { len, hits[], misses[] }
 *   factors:        [{ key, ok, points, lift, label }]
 *   projectedLiftPct: number — sum of positive benchmark lifts for hits
 *   missingLiftPct:   number — sum of positive benchmark lifts for misses
 *   quickWins:      top-3 missing factors by lift magnitude
 *   keywordFactors: [{ key, ok, points, lift, label }] (only when gscKeywords provided)
 * }
 */
export const scoreCtr = ({ title = '', description = '', gscKeywords = null } = {}) => {
    const titleR = scoreTitle(title);
    const descR  = scoreDescription(description);
    const kwR    = gscKeywords ? scoreKeywords(title, description, gscKeywords) : { hits: [], misses: [] };

    const allKeys = [...titleR.hits, ...titleR.misses, ...descR.hits, ...descR.misses];
    const factors = allKeys.map(key => {
        const b = BENCHMARKS[key] || { points: 0, lift: '0%', label: key };
        const ok = titleR.hits.includes(key) || descR.hits.includes(key);
        return { key, ok, points: b.points, lift: b.lift, label: b.label };
    });

    // Keyword alignment factors (only when GSC data is available)
    const keywordFactors = [...kwR.hits, ...kwR.misses].map(key => {
        const b = BENCHMARKS[key] || { points: 0, lift: '0%', label: key };
        const ok = kwR.hits.includes(key);
        return { key, ok, points: b.points, lift: b.lift, label: b.label };
    });

    // Merge keyword factors into the main factors list for unified scoring
    const allFactors = [...factors, ...keywordFactors];

    // Composite out of 100. Sum available points across hits divided by the
    // total possible across all rule keys we actually evaluated.
    const earned = allFactors.filter(f => f.ok).reduce((a, f) => a + f.points, 0);
    const total  = allFactors.reduce((a, f) => {
        // For LEN rules only one of IDEAL/ACCEPTABLE/BAD fires — use the ideal points as the ceiling
        if (f.key.endsWith('_LEN_ACCEPTABLE') || f.key.endsWith('_LEN_BAD')) return a;
        return a + (BENCHMARKS[f.key]?.points ?? 0);
    }, 0);

    // Add ideal-len ceiling once per kind even if the evaluated rule was a worse variant
    const lenCeiling =
        (BENCHMARKS.TITLE_LEN_IDEAL.points) +
        (BENCHMARKS.DESC_LEN_IDEAL.points);
    const denom = total + lenCeiling;
    const score = Math.max(0, Math.min(100, Math.round((earned / denom) * 100)));

    // Grade bands calibrated against real-world titles: most decent topical
    // titles (e.g. "Star Schema vs Snowflake Schema") land in the 40-60 range
    // because they skip listicle/year tricks without being objectively bad.
    const grade =
        score >= 70 ? 'A' :
        score >= 55 ? 'B' :
        score >= 40 ? 'C' :
        score >= 25 ? 'D' : 'F';

    const parseLift = (s) => {
        const m = String(s || '').match(/([-+]?)(\d+(\.\d+)?)%/);
        if (!m) return 0;
        const sign = m[1] === '-' ? -1 : 1;
        return sign * parseFloat(m[2]);
    };

    const projectedLiftPct = allFactors
        .filter(f => f.ok && parseLift(f.lift) > 0)
        .reduce((a, f) => a + parseLift(f.lift), 0);

    const missingLiftPct = allFactors
        .filter(f => !f.ok && parseLift(f.lift) > 0)
        .reduce((a, f) => a + parseLift(f.lift), 0);

    const quickWins = allFactors
        .filter(f => !f.ok && parseLift(f.lift) > 0)
        .sort((a, b) => parseLift(b.lift) - parseLift(a.lift))
        .slice(0, 3);

    return {
        score,
        grade,
        title:       titleR,
        description: descR,
        factors:     allFactors,
        keywordFactors,
        projectedLiftPct: Math.round(projectedLiftPct * 10) / 10,
        missingLiftPct:   Math.round(missingLiftPct * 10) / 10,
        quickWins,
    };
};

/**
 * Batch scorer for an array of WordPress-shaped posts. Each post is expected
 * to have { id, title, excerpt, slug, category }. Returns the list sorted by
 * largest missingLiftPct first (biggest CTR opportunity on top).
 */
export const scoreCtrBatch = (posts = []) => {
    const out = posts.map(p => {
        const res = scoreCtr({
            title:       p.title || '',
            description: p.metaDescription || p.excerpt || p.description || '',
        });
        return {
            id:          p.id,
            slug:        p.slug,
            category:    p.category,
            title:       p.title,
            excerpt:     p.excerpt || p.description || '',
            content:     p.content || '',
            score:       res.score,
            grade:       res.grade,
            projectedLiftPct: res.projectedLiftPct,
            missingLiftPct:   res.missingLiftPct,
            quickWins:   res.quickWins,
            factors:     res.factors,
        };
    });
    out.sort((a, b) => b.missingLiftPct - a.missingLiftPct);
    return out;
};
