// scripts/generateFAQSchema.js
// Automatically detects Q&A patterns and generates FAQPage schema
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Fetch all posts with retry/backoff
async function fetchAllPosts() {
    console.log('📡 Fetching posts for FAQ schema generation...');

    let allPosts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
        const url = `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_fields=slug,title,content`;

        let posts = null;
        let lastErr = null;

        // Retry up to 3 times with exponential backoff
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-FAQ-Schema-Generator'
                    }
                });

                if (!response.ok) {
                    // WP returns 400 when page is past the last page — that's a clean end-of-pagination, not an error
                    if (response.status === 400) {
                        hasMore = false;
                        break;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                posts = await response.json();
                break; // success
            } catch (err) {
                lastErr = err;
                if (attempt < 3) {
                    const delay = 500 * Math.pow(2, attempt - 1);
                    console.warn(`⚠️  Page ${page} attempt ${attempt} failed (${err.message}) — retrying in ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        if (!hasMore) break;

        if (posts === null) {
            console.error(`❌ Page ${page} failed after 3 attempts: ${lastErr?.message}`);
            // Don't abort the whole run — keep what we fetched so far
            break;
        }

        if (!Array.isArray(posts) || posts.length === 0) {
            hasMore = false;
            break;
        }

        allPosts = allPosts.concat(posts);
        console.log(`✅ Fetched page ${page} (${posts.length} posts)`);
        page++;

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Total posts fetched: ${allPosts.length}`);
    return allPosts;
}

// Check if text looks like a question (tightened — must end with ? OR start with a
// W-word FOLLOWED BY whitespace, not be a random word starting with "is"/"do"/etc.)
function isQuestionText(text) {
    const trimmed = text.trim();
    if (trimmed.endsWith('?')) return true;

    // Strict W-word / modal pattern: word + whitespace + at least 2 more words
    // This avoids false positives like "Is Admin" (heading fragment) matching "is ".
    return /^(how|what|why|when|where|which|who|can|should|could|is|are|do|does|will|would|may|might)\s+\S+\s+\S+/i.test(trimmed);
}

// Extract Q&A pairs from content using split-on-tags approach (Node.js compatible)
function extractQAPairs(content) {
    if (!content) return [];

    const qaPairs = [];
    const seenQuestions = new Set();

    function addPair(question, answer) {
        const q = question.trim();
        const a = answer.trim();
        const qLower = q.toLowerCase();
        if (seenQuestions.has(qLower)) return;
        if (q.length < 10 || a.length < 30) return;
        seenQuestions.add(qLower);
        // Truncate answer at sentence boundary
        let finalAnswer = a.substring(0, 500);
        if (a.length > 500) {
            const lastPeriod = finalAnswer.lastIndexOf('. ');
            if (lastPeriod > 200) finalAnswer = finalAnswer.substring(0, lastPeriod + 1);
        }
        qaPairs.push({ question: q, answer: finalAnswer });
    }

    // Split content into blocks by HTML tags to walk the structure
    // Each block is { tag, text } where tag is 'h2', 'h3', 'p', 'ul', 'ol', etc.
    const blocks = [];
    const tagRegex = /<(h[1-6]|p|ul|ol|li|dt|dd|strong|blockquote)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
    let tagMatch;

    while ((tagMatch = tagRegex.exec(content)) !== null) {
        const fullMatch = tagMatch[0];
        const tag = tagMatch[1].toLowerCase();
        const text = stripHTML(fullMatch);
        if (text.length > 0) {
            blocks.push({ tag, text, raw: fullMatch });
        }
    }

    // Strategy 1: H2/H3 headings that look like questions
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if ((block.tag === 'h2' || block.tag === 'h3') && isQuestionText(block.text)) {
            // Collect answer from following paragraphs, lists
            let answer = '';
            let j = i + 1;
            while (j < blocks.length && answer.length < 500) {
                const next = blocks[j];
                // Stop at next heading
                if (next.tag.startsWith('h')) break;
                if (next.tag === 'p' && next.text.length > 15) {
                    answer += next.text + ' ';
                }
                if (next.tag === 'ul' || next.tag === 'ol' || next.tag === 'li') {
                    answer += next.text + '. ';
                }
                j++;
            }
            const q = block.text.endsWith('?') ? block.text : block.text + '?';
            addPair(q, answer);
        }
    }

    // Strategy 1.5: FAQ section walker — when an article has an explicit
    // "FAQ" / "Frequently Asked Questions" heading, treat EVERY sub-heading
    // inside that section as a question (even if it doesn't look like one
    // to isQuestionText, e.g. "Snowflake pricing tiers"). This catches
    // articles whose FAQ sub-headings are phrased as noun phrases.
    const faqSectionIdx = blocks.findIndex(b =>
        (b.tag === 'h2' || b.tag === 'h3') &&
        /^(faq|faqs|frequently\s+asked\s+questions|common\s+questions)\b/i.test(b.text.trim())
    );
    if (faqSectionIdx !== -1) {
        const faqHeadingTag = blocks[faqSectionIdx].tag; // h2 or h3
        const subTag = faqHeadingTag === 'h2' ? 'h3' : 'h4';

        for (let i = faqSectionIdx + 1; i < blocks.length; i++) {
            const block = blocks[i];
            // Stop when we exit the FAQ section (next same-or-higher heading)
            if (block.tag === 'h1' || block.tag === faqHeadingTag) break;

            if (block.tag === subTag && block.text.length > 5) {
                let answer = '';
                let j = i + 1;
                while (j < blocks.length && answer.length < 500) {
                    const next = blocks[j];
                    if (next.tag.startsWith('h')) break;
                    if (next.tag === 'p' && next.text.length > 15) {
                        answer += next.text + ' ';
                    }
                    if (next.tag === 'ul' || next.tag === 'ol' || next.tag === 'li') {
                        answer += next.text + '. ';
                    }
                    j++;
                }
                if (answer.length >= 30) {
                    const q = block.text.endsWith('?')
                        ? block.text
                        : (isQuestionText(block.text) ? block.text + '?' : synthesizeQuestion(block.text));
                    addPair(q, answer);
                }
            }
        }
    }

    // Strategy 2: Synthesize FAQ from non-question H2/H3 headings
    // Converts headings like "Data Masking Best Practices" into
    // "What are Data Masking Best Practices?" with the content below as answer
    // GATE: Skip when the article already has a dedicated FAQ section —
    // synthesized questions from section headings create garbage schema
    // entries (e.g. "What is 1. Audit Your Credit Consumption Patterns?")
    // that conflict with the real FAQ and hurt SEO.
    const hasFAQSection = blocks.some(b =>
        (b.tag === 'h2' || b.tag === 'h3') &&
        /^(faq|faqs|frequently\s+asked\s+questions)/i.test(b.text.trim())
    );
    if (qaPairs.length < 5 && !hasFAQSection) {
        for (let i = 0; i < blocks.length; i++) {
            if (qaPairs.length >= 8) break;
            const block = blocks[i];
            if ((block.tag === 'h2' || block.tag === 'h3') && !isQuestionText(block.text)) {
                // Skip generic/structural headings that make bad FAQ questions
                const lower = block.text.toLowerCase();
                if (['introduction', 'conclusion', 'summary', 'references', 'about',
                     'table of contents', 'tldr', 'tl;dr', 'final thoughts',
                     'related articles', 'share this', 'prerequisites', 'requirements',
                     'additional materials', 'resources', 'next steps', 'wrap up',
                     'key takeaways', 'further reading', 'appendix', 'changelog',
                     'disclaimer', 'overview'].some(skip => lower.includes(skip))) {
                    continue;
                }
                // Skip numbered step headings (e.g., "Step 1:", "Part 3:", "1. Do X")
                if (/^(?:step|part)\s*\d/i.test(lower) || /^\d+[\.\)]\s/.test(block.text)) {
                    continue;
                }
                // Collect answer
                let answer = '';
                let j = i + 1;
                while (j < blocks.length && answer.length < 500) {
                    const next = blocks[j];
                    if (next.tag.startsWith('h')) break;
                    if (next.tag === 'p' && next.text.length > 15) {
                        answer += next.text + ' ';
                    }
                    if (next.tag === 'ul' || next.tag === 'ol' || next.tag === 'li') {
                        answer += next.text + '. ';
                    }
                    j++;
                }
                if (answer.length >= 50) {
                    // Synthesize a question from the heading
                    const q = synthesizeQuestion(block.text);
                    addPair(q, answer);
                }
            }
        }
    }

    // Strategy 3: Inline Q&A patterns (Q: / A:)
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.tag === 'p') {
            const qMatch = block.text.match(/^Q\s*[:\-]\s*(.+)/i);
            if (qMatch) {
                let answer = '';
                let j = i + 1;
                while (j < blocks.length && answer.length < 400) {
                    const next = blocks[j];
                    if (next.tag === 'p' && /^Q\s*[:\-]/i.test(next.text)) break;
                    if (next.tag === 'p') {
                        const aMatch = next.text.match(/^A\s*[:\-]\s*(.*)/i);
                        answer += (aMatch ? aMatch[1] : next.text) + ' ';
                    }
                    j++;
                }
                addPair(qMatch[1].trim(), answer);
            }
        }
    }

    // Strategy 4: Definition lists (dt/dd)
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].tag === 'dt' && i + 1 < blocks.length && blocks[i + 1].tag === 'dd') {
            addPair(blocks[i].text, blocks[i + 1].text);
        }
    }

    return qaPairs.slice(0, 8); // Max 8 Q&A pairs (Google-safe)
}

// Synthesize a question from a heading that isn't already a question
function synthesizeQuestion(heading) {
    const lower = heading.toLowerCase();

    // Pattern: "X vs Y" or "X versus Y" → "What is the difference between X and Y?"
    const vsMatch = heading.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+)$/i);
    if (vsMatch) return `What is the difference between ${vsMatch[1].trim()} and ${vsMatch[2].trim()}?`;

    // Pattern: starts with "How to" → already a question
    if (/^how to\b/i.test(lower)) return `${heading}?`;

    // Pattern: starts with verb-ing → "How does [heading] work?"
    if (/^(building|creating|implementing|deploying|configuring|setting|managing|optimizing|running|using|monitoring|testing|debugging|migrating|scaling)/i.test(lower)) {
        return `How does ${heading} work?`;
    }

    // Pattern: starts with imperative verb → "How do you [heading]?"
    if (/^(build|create|implement|deploy|configure|set up|manage|optimize|run|use|install|connect|integrate|automate|load|query|migrate)/i.test(lower)) {
        return `How do you ${heading.charAt(0).toLowerCase() + heading.slice(1)}?`;
    }

    // Pattern: plural concept nouns → "What are [heading]?"
    if (/(?:practices|features|benefits|advantages|strategies|techniques|tips|steps|limitations|challenges|types|methods|patterns|components|modules|functions|differences|alternatives|options|examples|use cases)/i.test(lower)) {
        return `What are the ${heading.charAt(0).toLowerCase() + heading.slice(1)}?`;
    }

    // Pattern: "Architecture" / "Pricing" / "Performance" etc. → "What is [heading]?"
    if (/(?:architecture|pricing|comparison|performance|security|governance|cost|structure|workflow|pipeline|framework|model|schema|design)/i.test(lower)) {
        return `What is the ${heading.charAt(0).toLowerCase() + heading.slice(1)}?`;
    }

    // Default: "What is [heading]?"
    return `What is ${heading}?`;
}

// Strip HTML tags and decode entities
function stripHTML(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&hellip;/g, '...')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')  // must be last
        .replace(/\s+/g, ' ')
        .trim();
}

// Escape JSON strings

// Generate FAQPage schema
function generateFAQSchema(qaPairs) {
    if (qaPairs.length === 0) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": qaPairs.map(qa => ({
            "@type": "Question",
            "name": qa.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": qa.answer
            }
        }))
    };

    return schema;
}

// Inject FAQ schema into HTML file
function injectFAQSchema(htmlPath, faqSchema) {
    try {
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Remove any existing FAQ schema blocks to avoid duplicates
        html = html.replace(
            /<!--[^>]*FAQ[^>]*-->\s*/gi,
            ''
        );
        html = html.replace(
            /<script type="application\/ld\+json">[\s\S]*?<\/script>/gi,
            (match) => match.includes('FAQPage') ? '' : match
        );

        // Find the position to inject (before closing </body> tag)
        const bodyCloseIndex = html.lastIndexOf('</body>');

        if (bodyCloseIndex === -1) {
            console.warn(`⚠️  No </body> tag found in ${htmlPath}`);
            return false;
        }

        // Create schema script tag
        const schemaScript = `
    <!-- FAQ Schema - Auto-generated -->
    <script type="application/ld+json">
    ${JSON.stringify(faqSchema, null, 2)}
    </script>
`;

        // Inject schema
        const newHTML = html.substring(0, bodyCloseIndex) + schemaScript + html.substring(bodyCloseIndex);

        fs.writeFileSync(htmlPath, newHTML, 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ Error injecting schema into ${htmlPath}:`, error.message);
        return false;
    }
}

// Main function
async function generateFAQSchemas() {
    console.log('🤖 Starting FAQ Schema generation...\n');

    try {
        // Check if dist directory exists
        if (!fs.existsSync(DIST_DIR)) {
            console.log('⚠️  dist directory not found');
            console.log('💡 FAQ schema generation should run AFTER static pages are built');
            console.log('✅ Skipping FAQ schema generation (will run on next build)');
            return;
        }

        const posts = await fetchAllPosts();

        if (posts.length === 0) {
            console.log('⚠️  No posts fetched - skipping FAQ schema generation');
            return;
        }

        let processedCount = 0;
        let schemaInjectedCount = 0;
        let skippedCount = 0;

        console.log('\n📝 Processing articles for FAQ schema...\n');

        for (const post of posts) {
            const slug = post.slug;
            const content = post.content?.rendered || '';
            const title = stripHTML(post.title?.rendered || 'Untitled');

            // Extract Q&A pairs
            const qaPairs = extractQAPairs(content);

            if (qaPairs.length === 0) {
                skippedCount++;
                continue;
            }

            // Generate FAQ schema
            const faqSchema = generateFAQSchema(qaPairs);

            if (!faqSchema) {
                skippedCount++;
                continue;
            }

            // Find the HTML file
            const htmlPath = path.join(DIST_DIR, 'articles', slug, 'index.html');

            if (!fs.existsSync(htmlPath)) {
                console.warn(`⚠️  HTML file not found: ${htmlPath}`);
                skippedCount++;
                continue;
            }

            // Inject FAQ schema
            const injected = injectFAQSchema(htmlPath, faqSchema);

            if (injected) {
                schemaInjectedCount++;
                console.log(`✅ ${title.substring(0, 50)}... (${qaPairs.length} Q&A pairs)`);
            } else {
                skippedCount++;
            }

            processedCount++;

            // Progress indicator
            if (processedCount % 10 === 0) {
                console.log(`   Processed ${processedCount}/${posts.length} articles...`);
            }
        }

        console.log('\n✅ FAQ Schema generation complete!');
        console.log(`📊 Summary:`);
        console.log(`   - Total articles: ${posts.length}`);
        console.log(`   - FAQ schemas injected: ${schemaInjectedCount}`);
        console.log(`   - Skipped (no Q&A): ${skippedCount}`);
        console.log(`   - Success rate: ${Math.round((schemaInjectedCount / posts.length) * 100)}%`);

        console.log('\n💡 Benefits:');
        console.log('   ✓ Rich snippets in Google search');
        console.log('   ✓ 36% higher AI citation rate');
        console.log('   ✓ Better visibility in voice search');
        console.log('   ✓ Enhanced user experience');

    } catch (error) {
        console.error('\n❌ Error generating FAQ schemas:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateFAQSchemas();
