// scripts/verifyBuild.js
// Verifies that the build output is correct and safe to deploy
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADSENSE_REVIEW_MODE } from '../src/data/adsenseQualityGate.js';

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

function countFiles(dir, pattern = /\.html$/, shouldCount = null) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (pattern.test(item) && (!shouldCount || shouldCount(fullPath))) {
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

function stripHtmlForWordCount(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function validateSponsorsData(sourceRoot) {
  const sponsorDataPath = path.join(sourceRoot, 'src', 'data', 'activeSponsors.json');
  const sponsorLogoRoot = path.join(sourceRoot, 'public', 'assets', 'sponsors');
  const allowedPlacements = new Set(['directory', 'resource_reference', 'content']);
  const issues = [];
  const warnings = [];
  const info = [];

  if (!fs.existsSync(sponsorDataPath)) {
    issues.push('❌ Sponsor data file not found: src/data/activeSponsors.json');
    return { issues, warnings, info };
  }

  let sponsors;
  try {
    sponsors = JSON.parse(fs.readFileSync(sponsorDataPath, 'utf8'));
  } catch (error) {
    issues.push(`❌ Sponsor data file is invalid JSON: ${error.message}`);
    return { issues, warnings, info };
  }

  if (!Array.isArray(sponsors)) {
    issues.push('❌ Sponsor data must export a JSON array');
    return { issues, warnings, info };
  }

  info.push(`Sponsors configured: ${sponsors.length}`);
  const seenTokens = new Set();

  sponsors.forEach((sponsor, index) => {
    const label = sponsor?.company || `Sponsor #${index + 1}`;

    if (!sponsor?.company) {
      issues.push(`❌ Sponsor #${index + 1} is missing company`);
    }

    if (!sponsor?.token) {
      issues.push(`❌ ${label}: missing token`);
    } else if (seenTokens.has(sponsor.token)) {
      issues.push(`❌ ${label}: duplicate token ${sponsor.token}`);
    } else {
      seenTokens.add(sponsor.token);
    }

    if (!allowedPlacements.has(sponsor?.placement)) {
      issues.push(`❌ ${label}: invalid placement '${sponsor?.placement || 'missing'}'`);
    }

    try {
      const parsedUrl = new URL(sponsor?.url || '');
      if (!/^https?:$/.test(parsedUrl.protocol)) {
        throw new Error('unsupported protocol');
      }
    } catch {
      issues.push(`❌ ${label}: invalid sponsor URL '${sponsor?.url || 'missing'}'`);
    }

    if (!Number.isNaN(Date.parse(sponsor?.startDate)) && !Number.isNaN(Date.parse(sponsor?.endDate))) {
      if (new Date(sponsor.startDate) > new Date(sponsor.endDate)) {
        issues.push(`❌ ${label}: startDate is after endDate`);
      }
    } else {
      issues.push(`❌ ${label}: invalid startDate or endDate`);
    }

    if (typeof sponsor?.active !== 'boolean') {
      warnings.push(`⚠️  ${label}: active should be a boolean`);
    }

    if (typeof sponsor?.logo === 'string' && sponsor.logo.startsWith('/assets/sponsors/')) {
      const logoPath = path.join(sponsorLogoRoot, sponsor.logo.replace('/assets/sponsors/', ''));
      if (!fs.existsSync(logoPath)) {
        warnings.push(`⚠️  ${label}: logo file missing at public/assets/sponsors/${path.basename(logoPath)}`);
      }
    }
  });

  return { issues, warnings, info };
}

async function verifyBuild() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔍 Build Verification Starting...', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const issues = [];
  const warnings = [];
  const info = [];
  const sourceRoot = path.join(__dirname, '..');
  
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
    const articlesListingPath = path.join(articlesDir, 'index.html');
    if (!fs.existsSync(articlesListingPath)) {
      issues.push('❌ CRITICAL: /articles listing index.html is missing; Apache will serve the homepage shell');
      log('   ❌ CRITICAL: articles/index.html is missing', 'red');
    } else {
      const listingHtml = fs.readFileSync(articlesListingPath, 'utf8');
      const listingCanonicalOk =
        /<link\s+rel="canonical"\s+href="https:\/\/dataengineerhub\.blog\/articles"\s*\/?>/i.test(listingHtml);
      const listingRobots = listingHtml.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
      const listingIsNoindex = listingRobots && /noindex/i.test(listingRobots[1]);
      const articleLinks = new Set(
        [...listingHtml.matchAll(/href="https:\/\/dataengineerhub\.blog\/articles\/([^"#?]+)"/gi)]
          .map((match) => match[1])
      );
      const listingText = stripHtmlForWordCount(listingHtml);

      if (!listingCanonicalOk) {
        issues.push('❌ /articles listing has a missing or incorrect canonical');
      }
      if (listingIsNoindex) {
        issues.push('❌ /articles listing is unexpectedly noindexed');
      }
      if (articleLinks.size < 50) {
        issues.push(`❌ /articles listing exposes only ${articleLinks.size} unique article links`);
      }
      if (listingText.split(/\s+/).filter(Boolean).length < 500) {
        issues.push('❌ /articles listing has fewer than 500 crawler-visible words');
      }

      if (listingCanonicalOk && !listingIsNoindex && articleLinks.size >= 50) {
        log(`   ✅ /articles listing: canonical correct, ${articleLinks.size} unique article links`, 'green');
      } else {
        log('   ❌ /articles listing failed crawler-delivery checks', 'red');
      }
    }

    const articleDirs = fs.readdirSync(articlesDir).filter(item => {
      const itemPath = path.join(articlesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    const articleFiles = countFiles(articlesDir, /index\.html$/, (filePath) => path.dirname(filePath) !== articlesDir);
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
          const hasStaticSeoContent = /class="seo-content"/i.test(content);
          const hasStaticArticleBody = /class="article-body"/i.test(content);
          const isLoadingShell = /Loading Article\.\.\./i.test(content) && !hasStaticArticleBody;
          const crawlerContentMatch = content.match(/<div\s+class="seo-content"[\s\S]*?<\/div>\s*<footer\s+class="site-footer"/i);
          const crawlerText = stripHtmlForWordCount(crawlerContentMatch ? crawlerContentMatch[0] : '');
          const crawlerWordCount = crawlerText ? crawlerText.split(/\s+/).filter(Boolean).length : 0;

          const failed = [];
          if (!checks.title) failed.push('title');
          if (!checks.canonical) failed.push('canonical');
          if (!checks.robots) failed.push('robots meta');
          if (!checks.ogImage) failed.push('og:image');
          if (!checks.articleSchema) failed.push('Article JSON-LD');
          if (!checks.productionBundle) failed.push('production JS bundle');
          if (!hasStaticSeoContent) failed.push('crawler-visible SEO content');
          if (!hasStaticArticleBody) failed.push('static article body');
          // AdSense loader is only required on indexable pages
          if (!isNoindex) {
            if (!checks.adsenseScript) failed.push('AdSense loader script');
            if (!checks.adsenseClientValid) failed.push('valid ca-pub- client ID');
          }

          if (isLoadingShell) {
            issues.push(`❌ ${dir}: article page is a React loading shell, not crawler-visible article HTML`);
            log(`   ❌ ${dir}: only loading shell detected — AdSense will see thin content`, 'red');
          }

          if (!isNoindex && crawlerWordCount < 400) {
            issues.push(`❌ ${dir}: indexable article has only ${crawlerWordCount} crawler-visible words`);
            log(`   ❌ ${dir}: only ${crawlerWordCount} crawler-visible words`, 'red');
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

          const adsenseFails = failed.filter((f) => /AdSense|ca-pub|article body|SEO content|loading/i.test(f));
          const otherFails = failed.filter((f) => !adsenseFails.includes(f));

          if (adsenseFails.length > 0) {
            issues.push(`❌ Article ${dir} missing: ${adsenseFails.join(', ')}`);
            log(`   ❌ ${dir}: missing ${adsenseFails.join(', ')}`, 'red');
            for (const k of adsenseFails) missCounts[k] = (missCounts[k] || 0) + 1;
          }

          if (otherFails.length > 0) {
            warnings.push(`⚠️  Article ${dir} missing: ${otherFails.join(', ')}`);
            log(`   ⚠️  ${dir}: missing ${otherFails.join(', ')}`, 'yellow');
            for (const k of otherFails) missCounts[k] = (missCounts[k] || 0) + 1;
          }

          if (failed.length === 0) {
            passCount++;
          }
        }
      }
      log(`   ✅ ${passCount}/${sampleDirs.length} articles passed SEO + AdSense checks`, passCount === sampleDirs.length ? 'green' : 'yellow');
      if (Object.keys(missCounts).length > 0) {
        log(`   ⚠️  Missing counts: ${Object.entries(missCounts).map(([k,v]) => `${k}=${v}`).join(', ')}`, 'yellow');
      }

      // -------------------------------------------------------------------------
      // Noindex ratio check — catch silent mass-noindex regressions
      // -------------------------------------------------------------------------
      const noindexCount = sampleDirs.filter(dir => {
        const p = path.join(articlesDir, dir, 'index.html');
        if (!fs.existsSync(p)) return false;
        const c = fs.readFileSync(p, 'utf8');
        const m = c.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
        return m && /noindex/i.test(m[1]);
      }).length;
      const noindexPct = sampleDirs.length > 0 ? Math.round((noindexCount / sampleDirs.length) * 100) : 0;
      log(`\n   📊 Noindex ratio: ${noindexCount}/${sampleDirs.length} articles (${noindexPct}%)`, 'cyan');
      info.push(`Noindex ratio: ${noindexCount}/${sampleDirs.length} (${noindexPct}%)`);
      if (noindexPct > 20) {
        warnings.push(`⚠️  High noindex ratio: ${noindexPct}% of articles are noindexed — check 400-word threshold`);
        log(`   ⚠️  High noindex ratio: ${noindexPct}% — AdSense may see thin site`, 'yellow');
      } else {
        log(`   ✅ Noindex ratio is acceptable (${noindexPct}%)`, 'green');
      }
    }
  }

  // ============================================================================
  // Check 4b: Review-mode pSEO must never ship stale indexable files
  // ============================================================================
  log('\n📖 Checking glossary term pages for AdSense loader...', 'blue');
  const glossaryDir = path.join(distDir, 'glossary');
  if (fs.existsSync(glossaryDir)) {
    const glossaryTerms = fs.readdirSync(glossaryDir).filter((item) => {
      const itemPath = path.join(glossaryDir, item);
      return fs.statSync(itemPath).isDirectory() && fs.existsSync(path.join(itemPath, 'index.html'));
    });
    let glossaryMissingAds = 0;
    let glossaryChecked = 0;
    let glossaryIndexableDuringReview = 0;
    for (const dir of glossaryTerms) {
      const content = fs.readFileSync(path.join(glossaryDir, dir, 'index.html'), 'utf8');
      const robotsMatch = content.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
      const isNoindex = robotsMatch && /noindex/i.test(robotsMatch[1]);
      if (ADSENSE_REVIEW_MODE && !isNoindex) {
        glossaryIndexableDuringReview++;
        issues.push(`❌ glossary/${dir}: stale indexable file while ADSENSE_REVIEW_MODE is enabled`);
      }
      if (isNoindex) continue;
      glossaryChecked++;
      if (!/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-/i.test(content)) {
        glossaryMissingAds++;
        if (glossaryMissingAds <= 5) {
          issues.push(`❌ glossary/${dir}: indexable term is missing the AdSense loader`);
          log(`   ❌ ${dir}: missing AdSense loader`, 'red');
        }
      }
    }
    if (ADSENSE_REVIEW_MODE && glossaryIndexableDuringReview === 0) {
      log(`   ✅ All ${glossaryTerms.length} glossary terms are noindexed for review`, 'green');
    }
    if (glossaryMissingAds === 0) {
      log(`   ✅ ${glossaryChecked} indexable glossary terms include the AdSense loader`, 'green');
    } else {
      log(`   ❌ ${glossaryMissingAds}/${glossaryChecked} indexable glossary terms missing AdSense loader`, 'red');
    }
    info.push(`Glossary terms: ${glossaryTerms.length} HTML pages`);
  } else {
    warnings.push('⚠️  dist/glossary/ not found — glossary pages were not generated');
    log('   ⚠️  dist/glossary/ not found', 'yellow');
  }

  if (ADSENSE_REVIEW_MODE) {
    for (const section of ['compare']) {
      const sectionDir = path.join(distDir, section);
      if (!fs.existsSync(sectionDir)) {
        issues.push(`❌ ${section}/ output is missing`);
        continue;
      }
      const detailPages = fs.readdirSync(sectionDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(sectionDir, entry.name, 'index.html'))
        .filter((file) => fs.existsSync(file));
      const staleIndexable = detailPages.filter((file) => {
        const html = fs.readFileSync(file, 'utf8');
        const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
        return !robots || !/noindex/i.test(robots[1]);
      });
      if (staleIndexable.length > 0) {
        issues.push(`❌ ${staleIndexable.length} ${section} detail pages are indexable during AdSense review`);
      } else {
        log(`   ✅ All ${detailPages.length} ${section} detail pages are noindexed for review`, 'green');
      }
    }
  }

  // ============================================================================
  // Check 4c: Sitemap must not list 301'd article aliases
  // ============================================================================
  log('\n🗺️  Checking sitemap for redirected article slugs...', 'blue');
  const redirectedSlugs = [
    'snowflake-query-optimization-2025',
    'building-snowflake-agents-in-10-minutes',
    'build-a-snowflake-agent-in-10-minutes',
    'snowflake-unique-aggregation-hidden-functions',
    'snowflake-options-automate-query-optimization-guide',
    'build-a-simple-rag-application-in-snowflake-using-streamlit-and-snowflake-cortex',
    'build-rag-snowflake-documentation',
    'snowflake-openflow-tutorial',
    'snowflake-performance',
    'snowflake-performance-tuning-techniques',
    'loading-data-from-s3-to-snowflake',
  ];
  const sitemapCandidates = [
    path.join(distDir, 'sitemap.xml'),
    path.join(__dirname, '..', 'public', 'sitemap.xml'),
  ];
  const sitemapPath = sitemapCandidates.find((p) => fs.existsSync(p));
  if (sitemapPath) {
    const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    const listedRedirects = redirectedSlugs.filter((slug) => sitemapXml.includes(`/articles/${slug}`));
    if (listedRedirects.length > 0) {
      issues.push(`❌ Sitemap lists redirected article URLs: ${listedRedirects.join(', ')}`);
      log(`   ❌ Sitemap still lists: ${listedRedirects.join(', ')}`, 'red');
    } else {
      log('   ✅ Sitemap does not list known 301 article aliases', 'green');
    }

    const sitemapUrls = [...sitemapXml.matchAll(/<loc>(https:\/\/dataengineerhub\.blog\/[^<]*)<\/loc>/gi)]
      .map((match) => match[1]);
    const noindexInSitemap = [];
    for (const url of sitemapUrls) {
      const pathname = new URL(url).pathname;
      const outputPath = pathname === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, pathname, 'index.html');
      if (!fs.existsSync(outputPath)) continue;
      const html = fs.readFileSync(outputPath, 'utf8');
      const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
      if (robots && /noindex/i.test(robots[1])) noindexInSitemap.push(pathname);
    }
    if (noindexInSitemap.length > 0) {
      issues.push(`❌ Sitemap lists noindexed pages: ${noindexInSitemap.join(', ')}`);
      log(`   ❌ ${noindexInSitemap.length} sitemap URLs are noindexed`, 'red');
    } else {
      log('   ✅ Sitemap contains no generated noindex pages', 'green');
    }
  } else {
    warnings.push('⚠️  sitemap.xml not found in dist/ or public/');
    log('   ⚠️  sitemap.xml not found', 'yellow');
  }

  // ============================================================================
  // Check 5: Sponsor data integrity
  // ============================================================================
  log('\n🤝 Checking sponsor data integrity...', 'blue');
  const sponsorValidation = validateSponsorsData(sourceRoot);
  sponsorValidation.issues.forEach((issue) => {
    issues.push(issue);
    log(`   ${issue}`, 'red');
  });
  sponsorValidation.warnings.forEach((warning) => {
    warnings.push(warning);
    log(`   ${warning}`, 'yellow');
  });
  sponsorValidation.info.forEach((item) => {
    info.push(item);
    log(`   ℹ️  ${item}`, 'cyan');
  });
  if (sponsorValidation.issues.length === 0 && sponsorValidation.warnings.length === 0) {
    log('   ✅ Sponsor data passed integrity checks', 'green');
  }
  
  // ============================================================================
  // Check 6: Build cache
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
        const actualArticles = countFiles(articlesDir, /index\.html$/, (filePath) => path.dirname(filePath) !== articlesDir);
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
  // Check 7: IndexNow key
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
  // Check 8: og-image.jpg (referenced by essential pages)
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
  // Check 9: Homepage static OG tags
  // ============================================================================
  log('\n🏠 Checking homepage OG tags...', 'blue');
  const homepageIndexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(homepageIndexPath)) {
    const homepageContent = fs.readFileSync(homepageIndexPath, 'utf8');
    const hasOgTitle = /property="og:title"/i.test(homepageContent);
    const hasOgDescription = /property="og:description"/i.test(homepageContent);
    const hasOgImage = /property="og:image"/i.test(homepageContent);
    const missingOg = [];
    if (!hasOgTitle) missingOg.push('og:title');
    if (!hasOgDescription) missingOg.push('og:description');
    if (!hasOgImage) missingOg.push('og:image');
    if (missingOg.length === 0) {
      log('   ✅ Homepage has all required OG tags', 'green');
    } else {
      issues.push(`❌ Homepage missing static OG tags: ${missingOg.join(', ')} — crawlers cannot see social previews`);
      log(`   ❌ Homepage missing: ${missingOg.join(', ')}`, 'red');
    }
    const homepageArticleBlock =
      /<div\s+class=["'][^"']*\bseo-articles\b[^"']*["']/i.test(homepageContent);
    const homepageArticleLinks = new Set(
      [...homepageContent.matchAll(/href="https:\/\/dataengineerhub\.blog\/articles\/([^"#?]+)"/gi)]
        .map((match) => match[1])
    );
    if (!homepageArticleBlock || homepageArticleLinks.size < 10) {
      issues.push('❌ Homepage is missing its crawler-visible article listing');
      log('   ❌ Homepage missing crawler-visible article listing', 'red');
    } else {
      log(`   ✅ Homepage includes article listing (${homepageArticleLinks.size} links)`, 'green');
    }
    if (!/llms\.txt/i.test(homepageContent)) {
      warnings.push('⚠️  Homepage is missing an llms.txt discovery link');
      log('   ⚠️  Homepage missing llms.txt link', 'yellow');
    }
    if (!/rel="api-catalog"/i.test(homepageContent)) {
      warnings.push('⚠️  Homepage is missing an api-catalog HTML link');
      log('   ⚠️  Homepage missing api-catalog link', 'yellow');
    }
  }

  // ============================================================================
  // Check 10: Agent discovery (RFC 8288 / RFC 9727 / auth.md)
  // ============================================================================
  log('\n🤖 Checking agent discovery documents...', 'blue');
  const authMdPath = path.join(distDir, 'auth.md');
  if (fs.existsSync(authMdPath)) {
    const authMd = fs.readFileSync(authMdPath, 'utf8');
    if (/^#\s+.*auth\.md/im.test(authMd)) {
      log('   ✅ auth.md has an H1 containing auth.md', 'green');
    } else {
      issues.push('❌ auth.md is missing an H1 that contains "auth.md"');
      log('   ❌ auth.md missing required H1', 'red');
    }
  } else {
    issues.push('❌ auth.md not found in dist/');
    log('   ❌ auth.md not found', 'red');
  }

  const catalogPath = path.join(distDir, 'well-known', 'api-catalog');
  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      if (Array.isArray(catalog.linkset) && catalog.linkset.length > 0) {
        log('   ✅ well-known/api-catalog is a valid RFC 9727 linkset', 'green');
      } else {
        issues.push('❌ well-known/api-catalog is missing a linkset array');
        log('   ❌ api-catalog missing linkset', 'red');
      }
    } catch (err) {
      issues.push(`❌ well-known/api-catalog is not valid JSON: ${err.message}`);
      log('   ❌ api-catalog is not valid JSON', 'red');
    }
  } else {
    issues.push('❌ well-known/api-catalog not found in dist/');
    log('   ❌ well-known/api-catalog not found', 'red');
  }

  const openapiPath = path.join(distDir, 'openapi.json');
  if (fs.existsSync(openapiPath)) {
    try {
      const spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
      if (spec.openapi && spec.paths) {
        log('   ✅ openapi.json is a valid OpenAPI document', 'green');
      } else {
        issues.push('❌ openapi.json is missing openapi/paths');
        log('   ❌ openapi.json incomplete', 'red');
      }
    } catch (err) {
      issues.push(`❌ openapi.json is not valid JSON: ${err.message}`);
      log('   ❌ openapi.json is not valid JSON', 'red');
    }
  } else {
    issues.push('❌ openapi.json not found in dist/');
    log('   ❌ openapi.json not found', 'red');
  }

  const htaccessPath = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessPath)) {
    const htaccess = fs.readFileSync(htaccessPath, 'utf8');
    const hasLinkHeader = /Header always set Link/.test(htaccess)
      && /rel=api-catalog/.test(htaccess)
      && !/rel=\\"api-catalog\\"/.test(htaccess);
    const hasWellKnownRewrite = /RewriteRule \^\\\.well-known\//.test(htaccess);
    if (hasLinkHeader) {
      log('   ✅ .htaccess sets homepage Link headers', 'green');
    } else {
      issues.push('❌ .htaccess is missing homepage Link headers (rel=api-catalog)');
      log('   ❌ .htaccess missing Link headers', 'red');
    }
    if (hasWellKnownRewrite) {
      log('   ✅ .htaccess rewrites /.well-known/ to /well-known/', 'green');
    } else {
      warnings.push('⚠️  .htaccess is missing the /.well-known/ rewrite');
      log('   ⚠️  .htaccess missing well-known rewrite', 'yellow');
    }
    if (/RewriteCond %\{HTTP_ACCEPT\} text\/markdown/.test(htaccess)) {
      log('   ✅ .htaccess negotiates homepage Markdown', 'green');
    } else {
      warnings.push('⚠️  .htaccess is missing Accept: text/markdown negotiation');
      log('   ⚠️  .htaccess missing markdown negotiation', 'yellow');
    }
    const hasSafeArticle404 = /RewriteCond %\{DOCUMENT_ROOT\}\/articles\/%1\/index\.html !-f/.test(htaccess)
      && /RewriteRule \^articles\/\(\[\^\/\]\+\)\/\?\$ - \[R=404,L\]/.test(htaccess)
      && htaccess.includes('RewriteCond %1 !^index\\.html$')
      && htaccess.includes('RewriteRule ^articles/?$ /articles/index.html [END]');
    const hasDuplicateArticleFallback =
      /RewriteRule \^articles\/\(\[\^\/\]\+\)\/\?\$ \/index\.html/.test(htaccess);
    if (hasSafeArticle404 && !hasDuplicateArticleFallback) {
      log('   ✅ .htaccess returns 404 for missing article HTML', 'green');
    } else {
      issues.push('❌ .htaccess may serve duplicate homepage HTML for a missing article');
      log('   ❌ .htaccess missing safe article 404 rule', 'red');
    }
  }

  const extraDiscovery = [
    'index.md',
    path.join('well-known', 'agent-skills', 'index.json'),
    path.join('well-known', 'ai-catalog.json'),
  ];
  for (const rel of extraDiscovery) {
    if (fs.existsSync(path.join(distDir, rel))) {
      log(`   ✅ ${rel}`, 'green');
    } else {
      issues.push(`❌ ${rel} not found in dist/`);
      log(`   ❌ ${rel} not found`, 'red');
    }
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
