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
    
    // Sample articles to verify content. Verify ALL articles so AdSense-blocker
    // regressions can't hide in unsampled pages. Per-article logs are suppressed
    // for scale; only failures and a final summary are printed.
    if (articleDirs.length > 0) {
      log(`\n   🔍 Verifying all ${articleDirs.length} articles...`, 'cyan');
      const sampleDirs = articleDirs;
      let passCount = 0;
      const missCounts = {};

      for (const dir of sampleDirs) {
        const indexPath = path.join(articlesDir, dir, 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf8');

          // SPA/AdSense critical checks
          const checks = {
            title: /<title>[^<]+<\/title>/.test(content),
            canonical: /<link\s+rel="canonical"\s+href="https:\/\/dataengineerhub\.blog\//i.test(content),
            robots: /<meta\s+name="robots"\s+content="/i.test(content),
            ogImage: /<meta\s+property="og:image"/i.test(content),
            articleSchema: /"@type"\s*:\s*"Article"/.test(content),
            productionBundle: /<script[^>]*type="module"[^>]*src="[^"]*\/assets\/js\/index-[^"]+\.js"/.test(content)
              || /<script[^>]*type="module"[^>]*src="[^"]*\/assets\/index-[^"]+\.js"/.test(content),
            // AdSense checks — only expected on indexable articles
            adsenseScript: /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-/i.test(content),
            adsenseClientValid: /client=ca-pub-\d+/i.test(content)
          };

          const robotsMatch = content.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
          const isNoindex = robotsMatch && /noindex/i.test(robotsMatch[1]);
          const hasAdInsSlot = /<ins\s+class="adsbygoogle"/i.test(content);
          // Catches the invalid data-ad-slot="auto" string (must be numeric)
          const hasInvalidSlot = /data-ad-slot\s*=\s*"auto"/i.test(content);

          const failed = [];
          if (!checks.title) failed.push('title');
          if (!checks.canonical) failed.push('canonical');
          if (!checks.robots) failed.push('robots meta');
          if (!checks.ogImage) failed.push('og:image');
          if (!checks.articleSchema) failed.push('Article JSON-LD');
          if (!checks.productionBundle) failed.push('production JS bundle');
          // AdSense loader is only required on indexable pages
          if (!isNoindex) {
            if (!checks.adsenseScript) failed.push('AdSense loader script');
            if (!checks.adsenseClientValid) failed.push('valid ca-pub- client ID');
          }

          // Invalid slot ID is an AdSense approval blocker
          if (hasInvalidSlot) {
            issues.push(`❌ ${dir}: data-ad-slot="auto" is INVALID (must be numeric or omitted)`);
            log(`   ❌ ${dir}: invalid data-ad-slot="auto" found — blocks AdSense approval`, 'red');
          }

          // Ads-on-noindex is a quality-score hit (only flag if we're using manual <ins>)
          if (isNoindex && hasAdInsSlot) {
            warnings.push(`⚠️  ${dir}: manual ad slot present on noindex article`);
          }

          // Legacy/dev-mode reference to raw /src/main.jsx should never ship to production
          if (/\/src\/main\.jsx/.test(content)) {
            issues.push(`❌ ${dir}: references /src/main.jsx (dev path shipped to production)`);
            log(`   ❌ ${dir}: dev /src/main.jsx path in production HTML`, 'red');
          }

          if (failed.length > 0) {
            warnings.push(`⚠️  Article ${dir} missing: ${failed.join(', ')}`);
            log(`   ⚠️  ${dir}: missing ${failed.join(', ')}`, 'yellow');
            for (const k of failed) missCounts[k] = (missCounts[k] || 0) + 1;
          } else {
            passCount++;
          }
        }
      }
      log(`   ✅ ${passCount}/${sampleDirs.length} articles passed SEO + AdSense checks`, passCount === sampleDirs.length ? 'green' : 'yellow');
      if (Object.keys(missCounts).length > 0) {
        log(`   ⚠️  Missing counts: ${Object.entries(missCounts).map(([k,v]) => `${k}=${v}`).join(', ')}`, 'yellow');
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
  // Check 7: og-image.jpg (referenced by essential pages)
  // ============================================================================
  log('\n🖼️  Checking og-image.jpg...', 'blue');
  const ogImageDist = path.join(distDir, 'og-image.jpg');
  if (fs.existsSync(ogImageDist)) {
    const size = fs.statSync(ogImageDist).size;
    log(`   ✅ og-image.jpg exists (${formatBytes(size)})`, 'green');
  } else {
    warnings.push('⚠️  og-image.jpg not found in dist/ — essential pages reference it');
    log('   ⚠️  og-image.jpg not found in dist/', 'yellow');
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
