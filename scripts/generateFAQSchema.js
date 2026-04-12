// scripts/generateFAQSchema.js
// Automatically detects Q&A patterns and generates FAQPage schema
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Fetch all posts
async function fetchAllPosts() {
    try {
        console.log('📡 Fetching posts for FAQ schema generation...');

        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 20) {
            const response = await fetch(
                `${WORDPRESS_API_URL}/posts?page=${page}&per_page=100&_fields=slug,title,content`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'DataEngineerHub-FAQ-Schema-Generator'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 400) {
                    hasMore = false;
                    break;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const posts = await response.json();

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
    } catch (error) {
        console.error('❌ Error fetching posts:', error.message);
        return [];
    }
}

// Check if text looks like a question (ported from runtime faqExtractor.js)
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
                // Skip generic headings
                const lower = block.text.toLowerCase();
                if (['introduction', 'conclusion', 'summary', 'references', 'about',
                     'table of contents', 'tldr', 'tl;dr', 'final thoughts',
                     'related articles', 'share this'].some(skip => lower.includes(skip))) {
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

    // Pattern: starts with verb-ing → "What is [heading]?"
    if (/^(building|creating|implementing|deploying|configuring|setting|managing|optimizing|running|using)/i.test(lower)) {
        return `How does ${heading} work?`;
    }

    // Pattern: "Best Practices" / "Key Features" / "Benefits" → "What are [heading]?"
    if (/(?:practices|features|benefits|advantages|strategies|techniques|tips|steps|requirements|limitations|challenges)/i.test(lower)) {
        return `What are ${heading}?`;
    }

    // Pattern: "Architecture" / "Setup" / "Configuration" → "What is [heading]?"
    if (/(?:architecture|setup|configuration|overview|pricing|comparison|performance|security|governance)/i.test(lower)) {
        return `What is ${heading}?`;
    }

    // Default: "What is [heading]?"
    return `What is ${heading}?`;
}

// Strip HTML tags
function stripHTML(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8230;/g, '...')
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
