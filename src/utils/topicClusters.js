// src/utils/topicClusters.js
// Pure-function analysis that groups articles into topic clusters
// using Jaccard similarity on extracted keywords.
//
// Goal: identify content pillars, find orphan articles, and suggest
// missing sub-topics that would complete a cluster.

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'you',
    'your', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'guide',
    'complete', 'introduction', 'tutorial', 'learn', 'using', 'use', 'get',
    'make', 'build', 'create', 'new', 'best', 'top', 'way', 'ways',
]);

/**
 * Extract top keywords from an article (title + excerpt + headings).
 */
export function extractKeywords(post, maxKeywords = 15) {
    const title = (post.title || '').toLowerCase();
    const excerpt = (post.excerpt || '').toLowerCase();

    // Pull H2/H3 headings from content
    const headings = [];
    const content = post.content || '';
    const h2Regex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    let match;
    while ((match = h2Regex.exec(content)) !== null) {
        headings.push(match[1].replace(/<[^>]*>/g, '').toLowerCase());
    }

    // Title words get triple weight, headings double, excerpt single
    const titleWords = tokenize(title).flatMap(w => [w, w, w]);
    const headingWords = headings.flatMap(h => tokenize(h)).flatMap(w => [w, w]);
    const excerptWords = tokenize(excerpt);

    const allWords = [...titleWords, ...headingWords, ...excerptWords];

    // Count frequency
    const freq = {};
    allWords.forEach(w => {
        if (!STOP_WORDS.has(w) && w.length > 2) {
            freq[w] = (freq[w] || 0) + 1;
        }
    });

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([word]) => word);
}

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * Jaccard similarity between two keyword sets: |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(setA, setB) {
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}

/**
 * Cluster articles by keyword similarity using a simple greedy algorithm.
 * Returns { clusters, orphans, dominantTopics }.
 */
export function clusterArticles(posts, { threshold = 0.2, minClusterSize = 2 } = {}) {
    // Step 1: extract keywords per post
    const articleKeywords = posts.map(p => ({
        slug: p.slug,
        title: p.title,
        category: p.category,
        health: p.articleHealth || 50,
        keywords: new Set(extractKeywords(p)),
    }));

    // Step 2: greedy clustering
    const assigned = new Set();
    const clusters = [];

    for (let i = 0; i < articleKeywords.length; i++) {
        if (assigned.has(articleKeywords[i].slug)) continue;

        const cluster = [articleKeywords[i]];
        assigned.add(articleKeywords[i].slug);

        for (let j = i + 1; j < articleKeywords.length; j++) {
            if (assigned.has(articleKeywords[j].slug)) continue;

            // Article j joins cluster if similar to ANY article already in cluster
            const maxSim = Math.max(
                ...cluster.map(c => jaccardSimilarity(c.keywords, articleKeywords[j].keywords))
            );

            if (maxSim >= threshold) {
                cluster.push(articleKeywords[j]);
                assigned.add(articleKeywords[j].slug);
            }
        }

        if (cluster.length >= minClusterSize) {
            clusters.push(cluster);
        } else {
            // Too small — will become orphan
            assigned.delete(articleKeywords[i].slug);
        }
    }

    // Step 3: orphans = everything not assigned
    const orphans = articleKeywords.filter(a => !assigned.has(a.slug));

    // Step 4: enrich each cluster with metadata
    const enrichedClusters = clusters.map((cluster, idx) => {
        // Dominant topic = most common keyword across all articles in cluster
        const keywordFreq = {};
        cluster.forEach(a => {
            a.keywords.forEach(k => {
                keywordFreq[k] = (keywordFreq[k] || 0) + 1;
            });
        });
        const topKeywords = Object.entries(keywordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

        // Pillar article = highest health in cluster
        const pillar = [...cluster].sort((a, b) => b.health - a.health)[0];

        const avgHealth = Math.round(
            cluster.reduce((s, a) => s + a.health, 0) / cluster.length
        );

        return {
            id: idx,
            name: topKeywords.slice(0, 2).map(k => capitalize(k)).join(' + ') || `Cluster ${idx + 1}`,
            size: cluster.length,
            avgHealth,
            dominantTopics: topKeywords,
            pillar: { slug: pillar.slug, title: pillar.title, health: pillar.health },
            members: cluster.map(a => ({
                slug: a.slug,
                title: a.title,
                health: a.health,
                category: a.category,
            })),
        };
    });

    // Step 5: for each orphan, find best-matching cluster
    const orphansWithSuggestions = orphans.map(o => {
        let bestCluster = null;
        let bestSim = 0;
        enrichedClusters.forEach(c => {
            const clusterKeywords = new Set(c.dominantTopics);
            const sim = jaccardSimilarity(o.keywords, clusterKeywords);
            if (sim > bestSim) {
                bestSim = sim;
                bestCluster = c;
            }
        });
        return {
            slug: o.slug,
            title: o.title,
            health: o.health,
            suggestedCluster: bestCluster?.name || null,
            similarity: Math.round(bestSim * 100),
        };
    });

    return {
        clusters: enrichedClusters.sort((a, b) => b.size - a.size),
        orphans: orphansWithSuggestions,
        totalArticles: posts.length,
        clusteredCount: posts.length - orphans.length,
    };
}

/**
 * For a given cluster, suggest missing sub-topics based on what
 * other similar articles cover. Returns array of keyword phrases.
 */
export function suggestMissingTopics(cluster, allPosts) {
    const clusterKeywords = new Set(cluster.dominantTopics);
    const clusterMemberSlugs = new Set(cluster.members.map(m => m.slug));

    // Find articles NOT in cluster but matching 1-2 cluster keywords
    const outsideKeywords = {};
    allPosts.forEach(p => {
        if (clusterMemberSlugs.has(p.slug)) return;
        const kws = extractKeywords(p);
        const overlap = kws.filter(k => clusterKeywords.has(k)).length;
        if (overlap >= 1) {
            kws.forEach(k => {
                if (!clusterKeywords.has(k)) {
                    outsideKeywords[k] = (outsideKeywords[k] || 0) + 1;
                }
            });
        }
    });

    return Object.entries(outsideKeywords)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ topic: word, frequency: count }));
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
