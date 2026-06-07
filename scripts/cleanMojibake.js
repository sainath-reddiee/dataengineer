// scripts/cleanMojibake.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(ROOT_DIR, 'src'),
  path.join(ROOT_DIR, 'scripts')
];

// Target replacements
const REPLACEMENTS = [
  // Emojis (longer sequences first to avoid partial matches)
  { regex: /🎨/g, replacement: '🎨' },
  { regex: /🔥/g, replacement: '🔥' },
  { regex: /🖼️/g, replacement: '🖼️' },
  { regex: /✅/g, replacement: '✅' },
  { regex: /⚠️/g, replacement: '⚠️' },
  { regex: /↻/g, replacement: '↻' },
  
  // Dash and quote mojibake
  { regex: /—/g, replacement: '—' }, // Em dash
  { regex: /–/g, replacement: '–' }, // En dash
  { regex: /›/g, replacement: '›' }, // Right angle quote
  { regex: /‹/g, replacement: '‹' }, // Left angle quote
  { regex: /â€\u009d/g, replacement: '"' }, // Right curly double quote
  { regex: /â€\u009c/g, replacement: '"' }, // Left curly double quote
  { regex: /'/g, replacement: "'" }, // Right curly single quote
  { regex: /â€\u0098/g, replacement: "'" }, // Left curly single quote
  { regex: /â€\u00a2/g, replacement: '•' }, // Bullet point
  { regex: /…/g, replacement: '…' }, // Ellipsis
  
  // Arrows
  { regex: /→/g, replacement: '→' }, // Right arrow
  { regex: /←/g, replacement: '←' }, // Left arrow
  
  // Latin-1 characters
  { regex: /·/g, replacement: '·' }, // Middle dot
  { regex: /×/g, replacement: '×' }  // Multiplication sign
];

function processFile(filePath) {
  try {
    const original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Apply replacements
    for (const r of REPLACEMENTS) {
      content = content.replace(r.regex, r.replacement);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned mojibake in: ${path.relative(ROOT_DIR, filePath)}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
  }
  return false;
}

function walkDirectory(dir) {
  let cleanedCount = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        cleanedCount += walkDirectory(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css'].includes(ext)) {
        if (processFile(fullPath)) {
          cleanedCount++;
        }
      }
    }
  }
  return cleanedCount;
}

function cleanAll() {
  console.log('🧹 Starting mojibake source code cleanup...');
  let totalCleaned = 0;
  
  for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir)) {
      console.log(`📁 Scanning directory: ${path.relative(ROOT_DIR, dir)}`);
      totalCleaned += walkDirectory(dir);
    }
  }
  
  // Also scan index.html at root
  const rootIndexHtml = path.join(ROOT_DIR, 'index.html');
  if (fs.existsSync(rootIndexHtml)) {
    if (processFile(rootIndexHtml)) {
      totalCleaned++;
    }
  }
  
  console.log(`\n🎉 Cleanup complete! Total files cleaned: ${totalCleaned}`);
}

cleanAll();
