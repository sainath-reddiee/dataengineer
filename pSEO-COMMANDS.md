# pSEO Command Reference

Quick reference for all pSEO-related commands and scenarios.

---

## 📋 Common Scenarios

### Scenario 1: Added New Glossary Term
```bash
# Option A: Push to GitHub (auto-deploys)
git add src/data/glossaryData.js
git commit -m "Add new glossary term: [term-name]"
git push

# Option B: Manual deploy (only uploads changed files)
npm run pseo:deploy
```

### Scenario 2: Published New WordPress Article
```bash
# Sync new article and redeploy pSEO pages
npm run pseo:deploy
```

### Scenario 3: Test Locally (No Upload)
```bash
# Dry run - generates HTML but doesn't upload
npm run pseo:deploy:dry-run
```

### Scenario 4: Force Re-upload All Files
```bash
# Ignore cache and upload everything
npm run pseo:deploy:force
```

### Scenario 5: Just Sync WordPress Articles
```bash
# Only fetch articles, don't deploy
npm run pseo:sync-articles
```

---

## 🔧 All pSEO Commands

| Command | Description |
|---------|-------------|
| `npm run pseo:migrate` | Split glossaryData.js into category JSONs |
| `npm run pseo:sync-articles` | Fetch WordPress articles for linking |
| `npm run pseo:search-index` | Generate search index JSON |
| `npm run pseo:deploy` | **Smart deploy**: sync → index → build → upload (incremental) |
| `npm run pseo:deploy:dry-run` | Test build without uploading |
| `npm run pseo:deploy:force` | Full deploy: re-upload ALL files (ignores cache) |
| `npm run pseo:sitemaps` | Generate sitemaps only |

---

## ⚡ Incremental Uploads & Sync

The deploy script uses **content hashing** to skip unchanged files:

- **First run**: Uploads ALL files, creates `.pseo-cache.json`
- **Subsequent runs**: Only uploads files that changed
- **Orphan Cleanup**: Automatically deletes files in R2 that are no longer in the build
- **Use `--force`**: Re-upload everything (ignore cache)

**Example output:**
```
╔═══════════════════════════════════════════╗
║  ⬆️  Uploaded (changed):    3             ║
║  ⏭️  Skipped (same):       52             ║
║  🗑️  Deleted (orphan):      1             ║
║  ❌ Failed:                 0             ║
╚═══════════════════════════════════════════╝
```

### What Gets Deleted?
- Old glossary pages for removed terms
- Renamed files (old name deleted automatically)
- Old comparison pages that no longer exist

### What Stays Safe?
- Only files the script manages (glossary/, compare/, sitemap-pseo-*)
- Your WordPress content is NOT affected


---

## 🧪 Testing Commands

```bash
# Test internal linking
node scripts/test-internal-linking.js

# Verify articles synced
cat src/data/pseo/articles.json | head -50

# Check cache status
cat .pseo-cache.json | head -20

# Reset cache (force full re-upload next time)
rm .pseo-cache.json
```

---

## 🔄 Workflow Triggers (GitHub Actions)

| Trigger | What Runs |
|---------|-----------|
| Push changes to `glossaryData.js` | Auto deploy pSEO |
| Push changes to `comparisonData.js` | Auto deploy pSEO |
| Manual dispatch with "Deploy pSEO" checked | Deploy pSEO |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/data/glossaryData.js` | Source of glossary terms |
| `src/data/comparisonData.js` | Source of comparisons |
| `src/data/pseo/articles.json` | Auto-synced WordPress articles |
| `.pseo-cache.json` | Content hashes for incremental uploads |
| `scripts/deploy-pseo.js` | Build & upload to R2 |
| `scripts/sync-articles-for-linking.js` | Sync WordPress articles |
| `cloudflare-worker.js` | Routes pSEO traffic to R2 |

---

## 🌐 Live URLs

- **Glossary**: `https://dataengineerhub.blog/glossary/[slug]`
- **Comparisons**: `https://dataengineerhub.blog/compare/[slug]`
- **Sitemap**: `https://dataengineerhub.blog/sitemap-pseo-index.xml`
- **Worker Debug**: `https://dataengineerhub-pseo-router.psainath123.workers.dev/debug`

---

## 🔐 Environment Variables (.env)

```env
R2_ENDPOINT=https://[ACCOUNT_ID].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=dataengineerhub-pseo
```

---

## 🆘 Troubleshooting

### "Page not found" in Worker
Check R2 bucket has `dataengineerhub-pseo/` prefix folder

### Internal links not appearing
1. Run `npm run pseo:sync-articles`
2. Check `src/data/pseo/articles.json` has keywords
3. Redeploy: `npm run pseo:deploy`

### New article not in sync
WordPress API caches for ~1 minute, wait and retry

### Want to force re-upload everything
```bash
npm run pseo:deploy:force
# OR delete cache and deploy
rm .pseo-cache.json && npm run pseo:deploy
```

