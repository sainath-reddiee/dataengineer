// src/utils/seoHealthCheck.js
// Run this in browser console to check SEO status

export const runSEOHealthCheck = () => {
  const results = {
    passed: [],
    warnings: [],
    failed: [],
    score: 0
  };

  console.log('🔍 Running SEO Health Check...\n');

  // 1. Check Title Tag
  const title = document.querySelector('title')?.textContent;
  if (title && title.length >= 30 && title.length <= 60) {
    results.passed.push('✅ Title tag length optimal (30-60 chars)');
    results.score += 10;
  } else if (title) {
    results.warnings.push(`⚠️ Title tag length: ${title.length} chars (optimal: 30-60)`);
    results.score += 5;
  } else {
    results.failed.push('❌ No title tag found');
  }

  // 2. Check Meta Description
  const description = document.querySelector('meta[name="description"]')?.content;
  if (description && description.length >= 120 && description.length <= 160) {
    results.passed.push('✅ Meta description length optimal (120-160 chars)');
    results.score += 10;
  } else if (description) {
    results.warnings.push(`⚠️ Meta description: ${description.length} chars (optimal: 120-160)`);
    results.score += 5;
  } else {
    results.failed.push('❌ No meta description found');
  }

  // 3. Check Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (canonical) {
    results.passed.push('✅ Canonical URL present');
    results.score += 5;
  } else {
    results.failed.push('❌ No canonical URL found');
  }

  // 4. Check Open Graph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  const ogDescription = document.querySelector('meta[property="og:description"]')?.content;
  const ogImage = document.querySelector('meta[property="og:image"]')?.content;
  
  if (ogTitle && ogDescription && ogImage) {
    results.passed.push('✅ Open Graph tags complete');
    results.score += 10;
  } else {
    results.warnings.push('⚠️ Incomplete Open Graph tags');
    results.score += 3;
  }

  // 5. Twitter Cards removed from site-wide SEO — no longer audited

  // 6. Check Structured Data
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  if (structuredData.length > 0) {
    results.passed.push(`✅ ${structuredData.length} structured data schema(s) found`);
    results.score += 15;
  } else {
    results.failed.push('❌ No structured data (Schema.org) found');
  }

  // 7. Check Heading Structure
  const h1Count = document.querySelectorAll('h1').length;
  if (h1Count === 1) {
    results.passed.push('✅ Single H1 tag found (correct)');
    results.score += 5;
  } else if (h1Count === 0) {
    results.failed.push('❌ No H1 tag found');
  } else {
    results.warnings.push(`⚠️ Multiple H1 tags found (${h1Count})`);
    results.score += 2;
  }

  // 8. Check Images Alt Text
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
  if (images.length > 0) {
    if (imagesWithoutAlt.length === 0) {
      results.passed.push('✅ All images have alt text');
      results.score += 10;
    } else {
      results.warnings.push(`⚠️ ${imagesWithoutAlt.length}/${images.length} images missing alt text`);
      results.score += 3;
    }
  }

  // 9. Check Mobile Viewport
  const viewport = document.querySelector('meta[name="viewport"]')?.content;
  if (viewport && viewport.includes('width=device-width')) {
    results.passed.push('✅ Mobile viewport meta tag configured');
    results.score += 5;
  } else {
    results.failed.push('❌ Mobile viewport not configured');
  }

  // 10. Check Language
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    results.passed.push(`✅ Language declared (${htmlLang})`);
    results.score += 5;
  } else {
    results.warnings.push('⚠️ No language declared in HTML tag');
  }

  // 11. Check Robots Meta
  const robotsMeta = document.querySelector('meta[name="robots"]')?.content;
  if (robotsMeta && !robotsMeta.includes('noindex')) {
    results.passed.push('✅ Robots meta allows indexing');
    results.score += 5;
  } else if (robotsMeta && robotsMeta.includes('noindex')) {
    results.failed.push('❌ Page set to noindex - won\'t appear in search results!');
  }

  // 12. Check HTTPS
  if (window.location.protocol === 'https:') {
    results.passed.push('✅ HTTPS enabled');
    results.score += 5;
  } else {
    results.failed.push('❌ Not using HTTPS');
  }

  // 13. Check Google Analytics
  if (window.gtag || window.ga || window.dataLayer) {
    results.passed.push('✅ Analytics tracking detected');
    results.score += 5;
  } else {
    results.failed.push('❌ No analytics tracking found');
  }

  // 14. Check Page Load Time
  if (typeof performance !== 'undefined') {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime < 3000) {
      results.passed.push(`✅ Fast page load: ${(loadTime/1000).toFixed(2)}s`);
      results.score += 10;
    } else if (loadTime < 5000) {
      results.warnings.push(`⚠️ Moderate page load: ${(loadTime/1000).toFixed(2)}s`);
      results.score += 5;
    } else {
      results.failed.push(`❌ Slow page load: ${(loadTime/1000).toFixed(2)}s`);
    }
  }

  // Print Results
  console.log('\n🎯 SEO HEALTH CHECK RESULTS\n' + '='.repeat(50));
  
  console.log('\n✅ PASSED (' + results.passed.length + ' items):');
  results.passed.forEach(item => console.log(item));
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS (' + results.warnings.length + ' items):');
    results.warnings.forEach(item => console.log(item));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED (' + results.failed.length + ' items):');
    results.failed.forEach(item => console.log(item));
  }

  const maxScore = 100;
  const percentage = Math.round((results.score / maxScore) * 100);
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 OVERALL SEO SCORE: ${results.score}/${maxScore} (${percentage}%)`);
  
  if (percentage >= 80) {
    console.log('🎉 Excellent! Your SEO is in great shape.');
  } else if (percentage >= 60) {
    console.log('👍 Good, but there\'s room for improvement.');
  } else if (percentage >= 40) {
    console.log('⚠️ Needs attention. Fix the failed items first.');
  } else {
    console.log('🚨 Critical issues found. Immediate action required!');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Fix all failed items (❌)');
  console.log('2. Address warnings (⚠️)');
  console.log('3. Submit sitemap to Google Search Console');
  console.log('4. Monitor rankings and traffic weekly');
  
  return { results, score: results.score, maxScore, percentage };
};

// Auto-run if in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setTimeout(() => {
    console.log('🔧 Development mode: Run runSEOHealthCheck() to check SEO');
  }, 2000);
}