// scripts/verifyBuild.js
// Verifies that the build output is correct and safe to deploy
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const cacheFile = path.join(__dirname, '..', '.build-cache.json');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function countFiles(dir, pattern = /\.html$/) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (pattern.test(item)) {
        count++;
      }
    }
  }
  
  traverse(dir);
  return count;
}

function getDirectorySize(dir) {
  if (!fs.existsSync(dir)) return 0;
  
  let size = 0;
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        size += stat.size;
      }
    }
  }
  
  traverse(dir);
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function verifyBuild() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔍 Build Verification Starting...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const issues = [];
  const warnings = [];
  const info = [];
  
  // ============================================================================
  // Check 1: dist directory exists
  // ============================================================================
  log('\n📁 Checking dist/ directory...', 'blue');
  if (!fs.existsSync(distDir)) {
    issues.push('❌ dist/ directory not found');
    log('   ❌ dist/ directory not found', 'red');
  } else {
    const distSize = getDirectorySize(distDir);
    log(`   ✅ dist/ exists (${formatBytes(distSize)})`, 'green');
    info.push(`dist/ size: ${formatBytes(distSize)}`);
  }
  
  // ============================================================================
  // Check 2: Core files exist
  // ============================================================================
  log('\n📄 Checking core files...', 'blue');
  const coreFiles = [
    'index.html',
    'sitemap.xml',
    'robots.txt',
    '.htaccess'
  ];
  
  for (const file of coreFiles) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      log(`   ✅ ${file} (${formatBytes(size)})`, 'green');
    } else {
      if (file === 'sitemap.xml' || file === '.htaccess') {
        warnings.push(`⚠️  ${file} not found (may be optional)`);
        log(`   ⚠️  ${file} not found`, 'yellow');
      } else {
        issues.push(`❌ ${file} not found`);
        log(`   ❌ ${file} not found`, 'red');
      }
    }
  }
  
  // ============================================================================
  // Check 3: Assets directory
  // ============================================================================
  log('\n🎨 Checking assets...', 'blue');
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    issues.push('❌ assets/ directory not found');
    log('   ❌ assets/ directory not found', 'red');
  } else {
    const jsFiles = countFiles(path.join(assetsDir, 'js'), /\.js$/);
    const cssFiles = countFiles(assetsDir, /\.css$/);
    const assetsSize = getDirectorySize(assetsDir);
    
    log(`   ✅ assets/ exists`, 'green');
    log(`   📊 JS files: ${jsFiles}`, 'cyan');
    log(`   📊 CSS files: ${cssFiles}`, 'cyan');
    log(`   📦 Total size: ${formatBytes(assetsSize)}`, 'cyan');
    
    if (jsFiles === 0) {
      issues.push('❌ No JavaScript files found in assets/');
    }
    if (cssFiles === 0) {
      warnings.push('⚠️  No CSS files found in assets/');
    }
  }
  
  // ============================================================================
  // Check 4: Articles directory (CRITICAL)
  // ============================================================================
  log('\n📰 Checking articles/ directory (CRITICAL)...', 'blue');
  const articlesDir = path.join(distDir, 'articles');
  
  if (!fs.existsSync(articlesDir)) {
    issues.push('❌ CRITICAL: articles/ directory not found - deployment will DELETE articles from server!');
    log('   ❌ CRITICAL: articles/ directory not found', 'red');
    log('   ⚠️  This will cause FTP sync to delete all articles from the server!', 'red');
  } else {
    const articleDirs = fs.readdirSync(articlesDir).filter(item => {
      const itemPath = path.join(articlesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    const articleFiles = countFiles(articlesDir, /index\.html$/);
    const articlesSize = getDirectorySize(articlesDir);
    
    log(`   ✅ articles/ exists`, 'green');
    log(`   📊 Article directories: ${articleDirs.length}`, 'cyan');
    log(`   📊 Article HTML files: ${articleFiles}`, 'cyan');
    log(`   📦 Total size: ${formatBytes(articlesSize)}`, 'cyan');
    
    if (articleDirs.length === 0) {
      issues.push('❌ CRITICAL: No article directories found - deployment will DELETE articles!');
      log('   ❌ CRITICAL: No article directories found!', 'red');
    } else if (articleFiles === 0) {
      issues.push('❌ CRITICAL: No article index.html files found!');
      log('   ❌ CRITICAL: No article HTML files found!', 'red');
    } else if (articleFiles < articleDirs.length) {
      warnings.push(`⚠️  Some article directories missing index.html (${articleDirs.length - articleFiles})`);
      log(`   ⚠️  ${articleDirs.length - articleFiles} directories missing index.html`, 'yellow');
    }
    
    info.push(`Articles: ${articleFiles} pages, ${formatBytes(articlesSize)}`);
    
    // Sample a few articles to verify content
    if (articleDirs.length > 0) {
      log(`\n   🔍 Sampling article content...`, 'cyan');
      const sampleDirs = articleDirs.slice(0, 3);
      
      for (const dir of sampleDirs) {
        const indexPath = path.join(articlesDir, dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf8');
          const hasTitle = content.includes('<title>');
          const hasRoot = content.includes('id="root"');
          const hasMainScript = content.includes('/src/main.jsx');
          
          if (!hasTitle || !hasRoot || !hasMainScript) {
            warnings.push(`⚠️  Article ${dir} may be missing critical HTML elements`);
            log(`   ⚠️  ${dir}: missing elements`, 'yellow');
          } else {
            log(`   ✅ ${dir}: valid HTML structure`, 'green');
          }
        }
      }
    }
  }
  
  // ============================================================================
  // Check 5: Build cache
  // ============================================================================
  log('\n💾 Checking build cache...', 'blue');
  if (!fs.existsSync(cacheFile)) {
    warnings.push('⚠️  .build-cache.json not found (first build?)');
    log('   ⚠️  .build-cache.json not found', 'yellow');
  } else {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const pageCount = Object.keys(cache.pages || {}).length;
      const lastBuild = cache.lastBuild ? new Date(cache.lastBuild).toLocaleString() : 'unknown';
      
      log(`   ✅ Cache file exists`, 'green');
      log(`   📊 Cached pages: ${pageCount}`, 'cyan');
      log(`   📅 Last build: ${lastBuild}`, 'cyan');
      
      info.push(`Cache: ${pageCount} pages tracked`);
      
      // Verify cache matches actual files
      if (fs.existsSync(articlesDir)) {
        const actualArticles = countFiles(articlesDir, /index\.html$/);
        const cachedArticles = Object.keys(cache.pages).filter(p => p.startsWith('/articles/')).length;
        
        if (cachedArticles !== actualArticles) {
          warnings.push(`⚠️  Cache mismatch: ${cachedArticles} cached vs ${actualArticles} actual`);
          log(`   ⚠️  Cache shows ${cachedArticles} articles, but found ${actualArticles}`, 'yellow');
        } else {
          log(`   ✅ Cache matches actual files (${actualArticles} articles)`, 'green');
        }
      }
    } catch (err) {
      warnings.push(`⚠️  Cache file is invalid: ${err.message}`);
      log(`   ⚠️  Cache file is invalid: ${err.message}`, 'yellow');
    }
  }
  
  // ============================================================================
  // Check 6: IndexNow key
  // ============================================================================
  log('\n🔑 Checking IndexNow key...', 'blue');
  const indexNowKeyPath = path.join(__dirname, '..', 'public', 'indexnow-key.txt');
  
  if (fs.existsSync(indexNowKeyPath)) {
    const key = fs.readFileSync(indexNowKeyPath, 'utf8').trim();
    const keyFilePath = path.join(distDir, `${key}.txt`);
    
    log(`   ✅ IndexNow key exists: ${key}`, 'green');
    
    if (fs.existsSync(keyFilePath)) {
      log(`   ✅ Verification file exists: ${key}.txt`, 'green');
    } else {
      warnings.push(`⚠️  IndexNow verification file ${key}.txt not found in dist/`);
      log(`   ⚠️  Verification file ${key}.txt not found`, 'yellow');
    }
  } else {
    warnings.push('⚠️  IndexNow key not generated');
    log('   ⚠️  IndexNow key not found', 'yellow');
  }
  
  // ============================================================================
  // Summary
  // ============================================================================
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Verification Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  if (issues.length === 0 && warnings.length === 0) {
    log('\n✅ All checks passed! Build is ready for deployment.', 'green');
  } else {
    if (issues.length > 0) {
      log(`\n❌ ${issues.length} Critical Issue(s) Found:`, 'red');
      issues.forEach(issue => log(`   ${issue}`, 'red'));
    }
    
    if (warnings.length > 0) {
      log(`\n⚠️  ${warnings.length} Warning(s):`, 'yellow');
      warnings.forEach(warning => log(`   ${warning}`, 'yellow'));
    }
  }
  
  if (info.length > 0) {
    log(`\nℹ️  Build Information:`, 'cyan');
    info.forEach(item => log(`   ${item}`, 'cyan'));
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  // Exit with error code if critical issues found
  if (issues.length > 0) {
    log('\n🚨 DEPLOYMENT BLOCKED: Critical issues must be resolved first!', 'red');
    log('Run: npm run build:force -- to rebuild all pages\n', 'yellow');
    process.exit(1);
  } else if (warnings.length > 0) {
    log('\n⚠️  Deployment can proceed, but review warnings above.\n', 'yellow');
    process.exit(0);
  } else {
    log('\n🚀 Build verified successfully! Safe to deploy.\n', 'green');
    process.exit(0);
  }
}

// Run verification
verifyBuild().catch(error => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
