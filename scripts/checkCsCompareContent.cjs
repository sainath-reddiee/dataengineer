const fs = require('fs');
const path = require('path');

function extractSeoContent(html) {
  const startIdx = html.indexOf('<div class="seo-content">');
  if (startIdx === -1) return '';
  const afterDiv = html.substring(startIdx);
  const endIdx = afterDiv.indexOf('<footer');
  if (endIdx >= 0) return afterDiv.substring(0, endIdx);
  return afterDiv.substring(0, 10000);
}

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Check cheatsheets
const csDir = path.join(__dirname, '../dist/cheatsheets');
const csDirs = fs.readdirSync(csDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'index.html' && !d.name.startsWith('category'));

console.log('=== CHEATSHEET PAGES ===');
for (const dir of csDirs) {
  const htmlPath = path.join(csDir, dir.name, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const seoContent = extractSeoContent(content);
    const textContent = seoContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = countWords(textContent);
    const status = words < 800 ? 'THIN' : words < 1200 ? 'LOW' : 'OK';
    console.log(dir.name + ': ' + words + ' words [' + status + ']');
  }
}

// Check comparisons
const compDir = path.join(__dirname, '../dist/compare');
const compDirs = fs.readdirSync(compDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'index.html');

console.log('\n=== COMPARISON PAGES ===');
for (const dir of compDirs) {
  const htmlPath = path.join(compDir, dir.name, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const seoContent = extractSeoContent(content);
    const textContent = seoContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = countWords(textContent);
    const status = words < 800 ? 'THIN' : words < 1200 ? 'LOW' : 'OK';
    console.log(dir.name + ': ' + words + ' words [' + status + ']');
  }
}