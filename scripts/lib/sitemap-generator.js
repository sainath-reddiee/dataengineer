/**
 * Sitemap Generator for PSEO Pages
 * Regenerates sitemap-glossary.xml and sitemap-comparisons.xml from data files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../../public');
const DATA_DIR = path.join(__dirname, '../../src/data');

const SITE_URL = 'https://dataengineerhub.blog';

// =============================================================================
// GLOSSARY SITEMAP GENERATOR
// =============================================================================

export async function generateGlossarySitemap() {
    // Dynamically import the data file
    const glossaryPath = path.join(DATA_DIR, 'glossaryData.js');
    const content = fs.readFileSync(glossaryPath, 'utf-8');

    // Extract slugs and dates using regex (avoiding ESM import issues)
    const terms = [];
    const regex = /{\s*id:\s*['"]([^'"]+)['"][\s\S]*?slug:\s*['"]([^'"]+)['"][\s\S]*?lastUpdated:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        terms.push({ slug: match[2], lastUpdated: match[3] });
    }

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- PSEO Glossary Hub -->
  <url>
    <loc>${SITE_URL}/glossary</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

    for (const term of terms) {
        xml += `  <url>
    <loc>${SITE_URL}/glossary/${term.slug}</loc>
    <lastmod>${term.lastUpdated || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // Write to file
    const outputPath = path.join(PUBLIC_DIR, 'sitemap-glossary.xml');
    fs.writeFileSync(outputPath, xml, 'utf-8');

    console.log(`✅ Generated sitemap-glossary.xml with ${terms.length + 1} URLs`);
    return terms.length + 1;
}

// =============================================================================
// COMPARISONS SITEMAP GENERATOR
// =============================================================================

export async function generateComparisonsSitemap() {
    const comparisonsPath = path.join(DATA_DIR, 'comparisonData.js');
    const content = fs.readFileSync(comparisonsPath, 'utf-8');

    // Extract slugs and dates
    const comparisons = [];
    const regex = /slug:\s*['"]([^'"]+)['"][\s\S]*?lastUpdated:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        comparisons.push({ slug: match[1], lastUpdated: match[2] });
    }

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- PSEO Comparison Hub -->
  <url>
    <loc>${SITE_URL}/compare</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

    for (const comp of comparisons) {
        xml += `  <url>
    <loc>${SITE_URL}/compare/${comp.slug}</loc>
    <lastmod>${comp.lastUpdated || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // Write to file
    const outputPath = path.join(PUBLIC_DIR, 'sitemap-comparisons.xml');
    fs.writeFileSync(outputPath, xml, 'utf-8');

    console.log(`✅ Generated sitemap-comparisons.xml with ${comparisons.length + 1} URLs`);
    return comparisons.length + 1;
}

// =============================================================================
// UPDATE SITEMAP INDEX
// =============================================================================

export async function updateSitemapIndex() {
    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main sitemap: Articles, categories, tags, static pages -->
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  
  <!-- PSEO: Glossary Terms -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-glossary.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  
  <!-- PSEO: Tool Comparisons -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-comparisons.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

    const outputPath = path.join(PUBLIC_DIR, 'sitemap-index.xml');
    fs.writeFileSync(outputPath, xml, 'utf-8');

    console.log('✅ Updated sitemap-index.xml');
}

// =============================================================================
// REGENERATE ALL
// =============================================================================

export async function regenerateAllSitemaps() {
    console.log('\n📍 Regenerating PSEO Sitemaps...\n');

    const glossaryCount = await generateGlossarySitemap();
    const comparisonsCount = await generateComparisonsSitemap();
    await updateSitemapIndex();

    console.log(`\n✨ Done! Total URLs: ${glossaryCount + comparisonsCount}`);

    return { glossaryCount, comparisonsCount };
}

// Run directly if executed as script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    regenerateAllSitemaps();
}
