const fs = require('fs');
const path = require('path');

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

console.log('=== TOOLS PAGES WORD COUNTS ===');
const toolsDir = path.join(__dirname, 'dist/tools');
if (fs.existsSync(toolsDir)) {
  const toolDirs = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'index.html');
  
  for (const dir of toolDirs) {
    const htmlPath = path.join(toolsDir, dir.name, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      const bodyMatch = content.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<!--/);
      if (bodyMatch) {
        const bodyText = bodyMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z0-9#]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const words = countWords(bodyText);
        console.log(`${dir.name}: ${words} words`);
      }
    }
  }
}

console.log('\n=== CHEATSHEET PAGES WORD COUNTS ===');
const csDir = path.join(__dirname, 'dist/cheatsheets');
if (fs.existsSync(csDir)) {
  const csDirs = fs.readdirSync(csDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'index.html' && !d.name.startsWith('category'));
  
  for (const dir of csDirs) {
    const htmlPath = path.join(csDir, dir.name, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      const bodyMatch = content.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<!--/);
      if (bodyMatch) {
        const bodyText = bodyMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z0-9#]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const words = countWords(bodyText);
        console.log(`${dir.name}: ${words} words`);
      }
    }
  }
}

console.log('\n=== COMPARISON PAGES WORD COUNTS ===');
const compDir = path.join(__dirname, 'dist/compare');
if (fs.existsSync(compDir)) {
  const compDirs = fs.readdirSync(compDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'index.html');
  
  for (const dir of compDirs) {
    const htmlPath = path.join(compDir, dir.name, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      const bodyMatch = content.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<!--/);
      if (bodyMatch) {
        const bodyText = bodyMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z0-9#]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const words = countWords(bodyText);
        console.log(`${dir.name}: ${words} words`);
      }
    }
  }
}

console.log('\n=== GLOSSARY PAGES WORD COUNTS ===');
const glossDir = path.join(__dirname, 'dist/glossary');
if (fs.existsSync(glossDir)) {
  const glossDirs = fs.readdirSync(glossDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'index.html');
  
  for (const dir of glossDirs) {
    const htmlPath = path.join(glossDir, dir.name, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      const bodyMatch = content.match(/<div class="article-body">([\s\S]*?)<\/div>\s*<!--/);
      if (bodyMatch) {
        const bodyText = bodyMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z0-9#]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const words = countWords(bodyText);
        if (words < 800) {
          console.log(`${dir.name}: ${words} words ⚠️ THIN`);
        }
      }
    }
  }
}