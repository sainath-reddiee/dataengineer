# AdSense Approval & SPA Rendering Improvement Plan

## Current State Analysis

**Strengths Already Implemented:**
- ✅ ADSENSE_REVIEW_MODE gate hiding low-value pages
- ✅ SSG generating static HTML for articles + hubs
- ✅ Code-to-text ratio management (collapseLongCodeBlocks)
- ✅ Indexable word counting (excludes `<pre>`/`<code>`)
- ✅ Thin tag/category filtering (MIN_INDEXABLE_* thresholds)
- ✅ X-Robots-Tag headers in .htaccess + robots.txt
- ✅ Structured data (Article, Breadcrumb, Organization, WebSite, HowTo, VideoObject, FAQ)
- ✅ Google Consent Mode v2 (EU denied, US granted for AdsBot)
- ✅ Static fallback content in index.html for crawlers
- ✅ Proper 404 handling (not redirecting to index.html)
- ✅ Article SSG with internal linking, FAQ schema, code enhancement

---

## IMMEDIATE FIXES (Week 1) - AdSense Approval Focus

### 1. Ensure ALL indexable pages serve COMPLETE static HTML
**Problem:** AdsBot may see skeletons/loading states if SSG misses routes or hydration races occur.

**Fixes:**
- [ ] Verify SSG covers every URL in sitemap.xml
- [ ] Add `stampHeldOutRobots()` call to build to catch any missed pages
- [ ] Ensure ArticlePage renders full content in SSG (not skeleton)
- [ ] Add build-time verification: crawl dist/ and check for "Loading" text

### 2. Boost indexable word count on flagged pages
**Problem:** Pages with <800 prose words get noindexed, but some articles may be close to threshold.

**Fixes:**
- [ ] Audit all articles: `countIndexableWords()` each one
- [ ] Extend thin articles with practitioner context (not fluff)
- [ ] Add "Key Takeaways" + FAQ sections to every article (already in SSG)
- [ ] Ensure author bio block renders in SSG HTML

### 3. Eliminate hydration mismatches → "Under Construction" signals
**Problem:** React hydration replacing static HTML with different content triggers AdSense "under construction" flags.

**Fixes:**
- [ ] Match SSG HTML structure EXACTLY to React component output
- [ ] Use same CSS classes, heading hierarchy, component order
- [ ] Remove any client-only UI from SSG (reactions, audio player, interactive tools)
- [ ] Add `suppressHydrationWarning` only where unavoidable

### 4. Improve LCP/CLS for AdsBot (Core Web Vitals)
**Problem:** Poor CWV correlates with low quality scores.

**Fixes:**
- [ ] Hero image: `priority`, `fetchpriority="high"`, explicit width/height
- [ ] Inline critical CSS for above-fold (already partially done)
- [ ] Defer non-critical JS (AdSense loader already deferred)
- [ ] Preload key fonts with `font-display: optional`

### 5. E-E-A-T signals visible to crawlers WITHOUT JS
**Problem:** Author expertise, editorial standards, contact info must be in static HTML.

**Fixes:**
- [ ] Author bio block in every article's SSG HTML
- [ ] Editorial standards link in footer (already there)
- [ ] Contact/about links in static nav (already there)
- [ ] Publishing date + modified date in Article schema (already there)

---

## MEDIUM-TERM (Week 2-3) - Content Quality & Structure

### 6. Content Depth Audit
- [ ] Run `countIndexableWords` on all 100+ articles
- [ ] Flag articles < 800 words for expansion
- [ ] Add "Practitioner Notes" sections (real-world context)
- [ ] Ensure every article has ≥3 H2 sections

### 7. Internal Linking at Scale
- [ ] SSG already injects links — verify coverage
- [ ] Add "Related Articles" module in SSG (not just React)
- [ ] Create topic cluster hub pages with substantial intros

### 8. Programmatic SEO Pages Quality
- [ ] Glossary terms: each needs ≥800 words (intro + definition + FAQ + gotchas)
- [ ] Comparisons: each needs ≥800 words (verdict + pros/cons + FAQ)
- [ ] Cheat sheets: each needs ≥800 words (not just tables)
- [ ] Tools: each needs explanatory content, not just calculator

### 9. Structured Data Completeness
- [ ] Every article: Article + Breadcrumb + FAQ + HowTo (if steps) + VideoObject (if embeds)
- [ ] Hub pages: CollectionPage + ItemList
- [ ] Tools: SoftwareApplication schema
- [ ] Author: Person schema with sameAs links

---

## LONG-TERM (Month 1+) - SPA Excellence

### 10. SPA Rendering Perfection
- [ ] Implement `createRoot().hydrateRoot()` with `onRecoverableError`
- [ ] Add `Suspense` boundaries matching SSG fallback UI
- [ ] Prefetch next-likely routes on hover (not just idle)
- [ ] Service Worker for offline-first article reading

### 11. Performance Budget
- [ ] JS < 170KB gzipped (currently ~200KB+)
- [ ] CSS < 50KB critical path
- [ ] LCP < 2.5s on 4G
- [ ] CLS < 0.1
- [ ] INP < 200ms

### 12. Crawler Experience
- [ ] Dynamic rendering detection for bots (serve SSG HTML directly)
- [ ] Add `X-Robots-Tag` for all held-out paths
- [ ] Monitor crawl stats in GSC weekly
- [ ] Submit updated sitemap after every deploy

---

## VERIFICATION CHECKLIST (Run Before Every Deploy)

```bash
# 1. Build & verify
npm run build
node scripts/verifyAdsenseQualityGate.js
node scripts/verifyAdsenseCodeRatio.js
node scripts/verifySsgArticle.js
node scripts/verifyBuild.js

# 2. Crawl dist/ and check
# - No "Loading..." text in article HTML
# - Every article has author bio
# - Every article has FAQ schema
# - Every article has ≥800 indexable words
# - No held-out pages in sitemap.xml

# 3. Lighthouse CI (mobile)
# - Performance > 90
# - Accessibility > 95
# - Best Practices > 90
# - SEO > 95

# 4. AdSense Preview Tool
# - Check 5 random articles
# - Verify ads render
# - Verify no "under construction" banner
```

---

## KEY FILES TO MODIFY

| Priority | File | Change |
|----------|------|--------|
| 🔴 Critical | `scripts/generateStaticPagesIncremental.js` | Ensure full article content in SSG, add author bio, verify word counts |
| 🔴 Critical | `src/pages/ArticlePage.jsx` | Match SSG structure exactly, suppress hydration warnings where needed |
| 🔴 Critical | `index.html` | Ensure static fallback has complete article structure |
| 🟠 High | `src/components/SEO/MetaTags.jsx` | Add more structured data types |
| 🟠 High | `src/utils/adsenseCodeRatio.js` | Tune thresholds, verify caption quality |
| 🟠 High | `.htaccess` | Verify X-Robots-Tag covers all held-out paths |
| 🟡 Medium | `vite.config.js` | Optimize chunk splitting, preload strategies |
| 🟡 Medium | `src/hooks/useSsgArticleFallback.js` | Improve fallback reliability |

---

## SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| AdSense Approval | ✅ Approved | ❌ Rejected |
| Indexable Pages | 100+ articles | ~80 |
| Avg Indexable Words/Article | >1,200 | ~600-900 |
| Pages with FAQ Schema | 100% | ~60% |
| Pages with Author Bio | 100% | ~70% |
| LCP (Mobile) | <2.5s | ~3-4s |
| CLS | <0.1 | ~0.15-0.25 |
| Crawl Errors (GSC) | 0 | Check |

---

## NEXT STEPS

1. **Run the verification scripts** to see current failures
2. **Audit 10 random articles** for word count + SSG output quality
3. **Fix the top 3 issues** from verification output
4. **Deploy and request AdSense re-review**
5. **Monitor for 7 days** then iterate