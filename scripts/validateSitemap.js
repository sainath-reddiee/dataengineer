// scripts/validateSitemap.js
// Validate sitemap before build to catch errors early
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://dataengineerhub.blog';

class SitemapValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addInfo(message) {
    this.info.push(message);
  }

  // Check if sitemap exists
  checkExists() {
    console.log('📄 Checking if sitemap exists...');

    if (!fs.existsSync(SITEMAP_PATH)) {
      this.addError('Sitemap file does not exist at public/sitemap.xml');
      return false;
    }

    this.addInfo('✅ Sitemap file exists');
    return true;
  }

  // Check file size
  checkFileSize() {
    console.log('📏 Checking file size...');

    const stats = fs.statSync(SITEMAP_PATH);
    const sizeInMB = stats.size / (1024 * 1024);

    if (stats.size === 0) {
      this.addError('Sitemap file is empty');
      return false;
    }

    if (sizeInMB > 50) {
      this.addWarning(`Sitemap is large (${sizeInMB.toFixed(2)}MB). Consider splitting into multiple sitemaps.`);
    }

    this.addInfo(`✅ File size: ${(stats.size / 1024).toFixed(2)}KB`);
    return true;
  }

  // Validate XML structure
  validateXML(content) {
    console.log('🔍 Validating XML structure...');

    // Check XML declaration
    if (!content.startsWith('<?xml version="1.0"')) {
      this.addError('Missing or invalid XML declaration');
    }

    // Check encoding
    if (!content.includes('encoding="UTF-8"')) {
      this.addWarning('XML encoding not explicitly set to UTF-8');
    }

    // Check urlset element
    if (!content.includes('<urlset')) {
      this.addError('Missing <urlset> element');
      return false;
    }

    // Check namespace
    if (!content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
      this.addError('Missing or invalid XML namespace');
    }

    // Check for common XML errors
    if (content.includes('undefined')) {
      this.addError('Contains undefined values');
    }

    if (content.includes('null')) {
      this.addError('Contains null values');
    }

    // Check for proper closing tags
    const urlCount = (content.match(/<url>/g) || []).length;
    const urlCloseCount = (content.match(/<\/url>/g) || []).length;

    if (urlCount !== urlCloseCount) {
      this.addError(`Mismatched <url> tags: ${urlCount} opening, ${urlCloseCount} closing`);
    }

    this.addInfo(`✅ Found ${urlCount} URL entries`);
    return true;
  }

  // Validate URL count
  validateURLCount(content) {
    console.log('🔢 Checking URL count...');

    const urlCount = (content.match(/<url>/g) || []).length;

    if (urlCount === 0) {
      this.addError('Sitemap contains no URLs');
      return false;
    }

    if (urlCount > 50000) {
      this.addError(`Too many URLs (${urlCount}). Maximum is 50,000 per sitemap.`);
      return false;
    }

    if (urlCount < 5) {
      this.addWarning(`Very few URLs (${urlCount}). Expected at least static pages + some posts.`);
    }

    this.addInfo(`✅ URL count: ${urlCount} (within limits)`);
    return true;
  }

  // Validate URLs
  validateURLs(content) {
    console.log('🔗 Validating URLs...');

    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls = [];
    let match;

    while ((match = urlRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    const urlSet = new Set();
    let duplicates = 0;
    let invalidUrls = 0;

    urls.forEach((url) => {
      // Check for duplicates
      if (urlSet.has(url)) {
        duplicates++;
        this.addWarning(`Duplicate URL found: ${url}`);
      }
      urlSet.add(url);

      // Validate URL format
      try {
        const urlObj = new URL(url);

        // Check if URL matches site domain
        if (!url.startsWith(SITE_URL)) {
          invalidUrls++;
          this.addError(`URL doesn't match site domain: ${url}`);
        }

        // Check for protocol
        if (urlObj.protocol !== 'https:') {
          this.addWarning(`Non-HTTPS URL: ${url}`);
        }

        // Check for fragments
        if (urlObj.hash) {
          this.addWarning(`URL contains fragment: ${url}`);
        }

        // Check for query parameters
        if (urlObj.search && !url.includes('/articles/')) {
          this.addWarning(`URL contains query parameters: ${url}`);
        }

      } catch (error) {
        invalidUrls++;
        this.addError(`Invalid URL format: ${url}`);
      }
    });

    if (duplicates > 0) {
      this.addError(`Found ${duplicates} duplicate URLs`);
    }

    if (invalidUrls > 0) {
      this.addError(`Found ${invalidUrls} invalid URLs`);
      return false;
    }

    this.addInfo(`✅ All ${urls.length} URLs are valid`);
    return true;
  }

  // Validate dates
  validateDates(content) {
    console.log('📅 Validating dates...');

    const dateRegex = /<lastmod>(.*?)<\/lastmod>/g;
    const dates = [];
    let match;

    while ((match = dateRegex.exec(content)) !== null) {
      dates.push(match[1]);
    }

    if (dates.length === 0) {
      this.addWarning('No lastmod dates found');
      return true;
    }

    let invalidDates = 0;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

    dates.forEach(dateStr => {
      // Check format (YYYY-MM-DD)
      const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateFormatRegex.test(dateStr)) {
        invalidDates++;
        this.addError(`Invalid date format: ${dateStr} (expected YYYY-MM-DD)`);
        return;
      }

      // Check if valid date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        invalidDates++;
        this.addError(`Invalid date: ${dateStr}`);
        return;
      }

      // Check if date is in future
      if (date > futureDate) {
        this.addWarning(`Future date found: ${dateStr}`);
      }

      // Check if date is too old (before 2000)
      if (date.getFullYear() < 2000) {
        this.addWarning(`Very old date: ${dateStr}`);
      }
    });

    if (invalidDates > 0) {
      this.addError(`Found ${invalidDates} invalid dates`);
      return false;
    }

    this.addInfo(`✅ All ${dates.length} dates are valid`);
    return true;
  }

  // Validate priorities
  validatePriorities(content) {
    console.log('⚖️  Validating priorities...');

    const priorityRegex = /<priority>(.*?)<\/priority>/g;
    const priorities = [];
    let match;

    while ((match = priorityRegex.exec(content)) !== null) {
      priorities.push(parseFloat(match[1]));
    }

    if (priorities.length === 0) {
      this.addWarning('No priorities found');
      return true;
    }

    let invalidPriorities = 0;

    priorities.forEach(priority => {
      if (isNaN(priority) || priority < 0 || priority > 1) {
        invalidPriorities++;
        this.addError(`Invalid priority: ${priority} (must be between 0.0 and 1.0)`);
      }
    });

    if (invalidPriorities > 0) {
      return false;
    }

    // Check priority distribution
    const highPriority = priorities.filter(p => p >= 0.8).length;
    const percentHigh = (highPriority / priorities.length) * 100;

    if (percentHigh > 20) {
      this.addWarning(`${percentHigh.toFixed(1)}% of URLs have high priority (≥0.8). Consider using priorities more selectively.`);
    }

    this.addInfo(`✅ All ${priorities.length} priorities are valid`);
    return true;
  }

  // Validate changefreq
  validateChangeFreq(content) {
    console.log('🔄 Validating change frequencies...');

    const changefreqRegex = /<changefreq>(.*?)<\/changefreq>/g;
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    const changefreqs = [];
    let match;

    while ((match = changefreqRegex.exec(content)) !== null) {
      changefreqs.push(match[1]);
    }

    if (changefreqs.length === 0) {
      this.addWarning('No changefreq values found');
      return true;
    }

    let invalidFreqs = 0;

    changefreqs.forEach(freq => {
      if (!validFreqs.includes(freq)) {
        invalidFreqs++;
        this.addError(`Invalid changefreq: ${freq}`);
      }
    });

    if (invalidFreqs > 0) {
      return false;
    }

    this.addInfo(`✅ All ${changefreqs.length} changefreq values are valid`);
    return true;
  }

  // Check for required static pages
  checkRequiredPages(content) {
    console.log('📄 Checking for required pages...');

    const requiredPages = [
      { url: SITE_URL + '/', name: 'Homepage' },
      { url: SITE_URL + '/articles', name: 'Articles page' },
    ];

    requiredPages.forEach(page => {
      if (!content.includes(`<loc>${page.url}</loc>`)) {
        this.addWarning(`Missing required page: ${page.name} (${page.url})`);
      }
    });

    return true;
  }

  // Run all validations
  validate() {
    console.log('\n🔍 SITEMAP VALIDATION');
    console.log('='.repeat(60) + '\n');

    let content;

    // Check existence
    if (!this.checkExists()) {
      return this.generateReport();
    }

    // Check file size
    if (!this.checkFileSize()) {
      return this.generateReport();
    }

    // Read content
    try {
      content = fs.readFileSync(SITEMAP_PATH, 'utf8');
    } catch (error) {
      this.addError(`Failed to read sitemap: ${error.message}`);
      return this.generateReport();
    }

    // Run all validations
    this.validateXML(content);
    this.validateURLCount(content);
    this.validateURLs(content);
    this.validateDates(content);
    this.validatePriorities(content);
    this.validateChangeFreq(content);
    this.checkRequiredPages(content);

    return this.generateReport();
  }

  // Generate validation report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION REPORT');
    console.log('='.repeat(60) + '\n');

    // Show info
    if (this.info.length > 0) {
      this.info.forEach(msg => console.log('ℹ️  ' + msg));
      console.log('');
    }

    // Show warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(msg => console.log('   - ' + msg));
      console.log('');
    }

    // Show errors
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(msg => console.log('   - ' + msg));
      console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log(`✅ Info: ${this.info.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log('='.repeat(60) + '\n');

    // Verdict
    if (this.errors.length === 0) {
      console.log('✅ VALIDATION PASSED - Sitemap is ready for deployment!\n');
      return { success: true, errors: 0, warnings: this.warnings.length };
    } else {
      console.log('❌ VALIDATION FAILED - Please fix errors before deploying!\n');
      console.log('💡 Run: npm run generate-sitemap --force\n');
      return { success: false, errors: this.errors.length, warnings: this.warnings.length };
    }
  }
}

// Main execution
const validator = new SitemapValidator();
const result = validator.validate();

// Exit with error code if validation failed
if (!result.success) {
  process.exit(1);
}

export default validator;
