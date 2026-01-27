/**
 * Quick test script to verify internal linking works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load articles directly
const articlesPath = path.join(__dirname, '..', 'src', 'data', 'pseo', 'articles.json');
const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║               Internal Linking Test                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`📚 Loaded ${articles.length} articles from WordPress\n`);

// Helper functions (copied from linkingEngine.js)
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectInternalLinks(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') return htmlContent;

    let result = htmlContent;
    const linkedKeywords = new Set();

    for (const article of articles) {
        for (const keyword of article.keywords || []) {
            if (linkedKeywords.has(keyword.toLowerCase())) continue;
            if (keyword.length < 3) continue;

            const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, 'i');
            const match = result.match(regex);

            if (match) {
                const anchor = `<a href="/articles/${article.slug}" class="internal-link">${match[1]}</a>`;
                result = result.replace(regex, anchor);
                linkedKeywords.add(keyword.toLowerCase());
                break; // One link per article
            }
        }
    }

    return result;
}

// Test content
const testContent = `
<p>Snowflake is a cloud data warehouse that enables fast analytics. 
Many teams use dbt for data transformations and Airflow for orchestration.
For real-time streaming, Kafka is a popular choice among data engineers.</p>

<p>When optimizing your ETL pipelines, consider Databricks for Spark workloads.
The modern data stack often includes tools like Fivetran for ingestion.</p>
`;

console.log('📝 Original Content:');
console.log('─'.repeat(60));
console.log(testContent);

const linkedContent = injectInternalLinks(testContent);

console.log('\n🔗 With Internal Links:');
console.log('─'.repeat(60));
console.log(linkedContent);

// Show what got linked
console.log('\n📊 Links Injected:');
console.log('─'.repeat(60));
const linkMatches = linkedContent.match(/<a href="[^"]+">([^<]+)<\/a>/g) || [];
linkMatches.forEach((link, i) => {
    const href = link.match(/href="([^"]+)"/)?.[1];
    const text = link.match(/>([^<]+)</)?.[1];
    console.log(`   ${i + 1}. "${text}" → ${href}`);
});

console.log('\n✅ Test complete! These links will be injected in pSEO pages.\n');
