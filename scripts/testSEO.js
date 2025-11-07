// scripts/testSEO.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function testHTMLFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  
  const checks = {
    hasTitle: /<title>(.+?)<\/title>/.test(html),
    hasDescription: /<meta name="description" content="(.+?)"/.test(html),
    hasH1: /<h1[^>]*>(.+?)<\/h1>/.test(html),
    hasContent: html.includes('<p>') && html.length > 1000,
    hasLoadingOnly: html.includes('loading-container') && !html.includes('<h1'),
    hasCanonical: /<link rel="canonical"/.test(html),
  };
  
  return checks;
}

function runTests() {
  console.log('🔍 Testing SEO content in built files...\n');
  
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  // Test homepage
  console.log('Testing Homepage...');
  const indexPath = path.join(distDir, 'index.html');
  const homeChecks = testHTMLFile(indexPath);
  
  console.log('  ✓ Has title:', homeChecks.hasTitle ? '✅' : '❌');
  console.log('  ✓ Has description:', homeChecks.hasDescription ? '✅' : '❌');
  console.log('  ✓ Has H1:', homeChecks.hasH1 ? '✅' : '❌');
  console.log('  ✓ Has content:', homeChecks.hasContent ? '✅' : '❌');
  console.log('  ✓ Has canonical:', homeChecks.hasCanonical ? '✅' : '❌');
  console.log('  ✗ Loading only:', homeChecks.hasLoadingOnly ? '❌ PROBLEM!' : '✅');
  
  // Test articles
  console.log('\nTesting Articles...');
  const articlesDir = path.join(distDir, 'articles');
  
  if (fs.existsSync(articlesDir)) {
    const articles = fs.readdirSync(articlesDir)
      .filter(name => {
        const articlePath = path.join(articlesDir, name);
        return fs.statSync(articlePath).isDirectory();
      })
      .slice(0, 3); // Test first 3 articles
    
    if (articles.length === 0) {
      console.log('  ⚠️  No article pages found');
    } else {
      articles.forEach(article => {
        const articlePath = path.join(articlesDir, article, 'index.html');
        if (fs.existsSync(articlePath)) {
          const checks = testHTMLFile(articlePath);
          console.log(`\n  Article: ${article}`);
          console.log('    Has content:', checks.hasContent ? '✅' : '❌');
          console.log('    Loading only:', checks.hasLoadingOnly ? '❌ PROBLEM!' : '✅');
        }
      });
    }
  } else {
    console.log('  ⚠️  No articles directory found');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  const allGood = homeChecks.hasTitle && homeChecks.hasDescription && 
                  homeChecks.hasH1 && homeChecks.hasContent && 
                  !homeChecks.hasLoadingOnly;
  
  if (allGood) {
    console.log('✅ SEO checks PASSED! Your site should be crawlable.');
    console.log('\nNext steps:');
    console.log('1. Deploy your site');
    console.log('2. Test with Google Search Console > URL Inspection');
    console.log('3. Request indexing for updated pages');
  } else {
    console.log('❌ SEO checks FAILED! Bots may not see your content.');
    console.log('\nIssues found:');
    if (!homeChecks.hasContent) console.log('  - No content in homepage');
    if (homeChecks.hasLoadingOnly) console.log('  - Only loading spinner visible');
    if (!homeChecks.hasH1) console.log('  - Missing H1 tag');
  }
  console.log('='.repeat(50) + '\n');
}

runTests();