# Community features: opening indexing after AdSense approval

The roadmaps, interview question bank and warehouse cost estimator v2 shipped noindexed and out of the sitemap while AdSense review mode is on. Mock exams and the interview drill stay noindexed permanently: they are app state, not reading material.

| Feature | URL | During review | After approval |
| --- | --- | --- | --- |
| Role roadmaps | `/roadmaps`, `/roadmaps/{data-engineer,analytics-engineer,data-platform-engineer}` | noindex | index once intros are written |
| Interview question bank | `/interview-prep/questions` | noindex | index with the rest of `/interview-prep` |
| Interview drill | `/interview-prep/drill` | noindex | stays noindex |
| Mock exams | `/practice/:slug/mock-exam` | noindex | stays noindex |
| Warehouse cost estimator v2 | `/tools/warehouse-cost-estimator` | noindex | merge into `/tools/cloud-data-warehouse-cost-comparison` |

## Before you flip anything (you)

1. Write each roadmap intro in your own voice (`intro` in `src/data/roadmaps/*.json`, 120 to 250 words; `introBrief` says what to cover). Optionally add a `note` to skills you have opinions on.
2. Review the interview bank. It reuses the Q&A already in your cheat sheets. Hide anything you no longer stand behind with `exclude` in `src/data/interview/questions.json`, and add your own questions there with `status: "approved"`.
3. Re-check the warehouse prices against each source page and update `verifiedOn` in `src/data/warehousePricing.js`. If Snowflake, Databricks or BigQuery prices change, update the older calculators too: the verifier fails on any drift.

## Gates (must pass)

```bash
node scripts/verifyRoadmaps.js --strict --live
node scripts/verifyInterviewBank.js --min-approved=0
node scripts/verifyWarehousePricing.js --fresh
```

## Flip (Claude can do this)

1. `src/data/adsenseQualityGate.js`: set `ADSENSE_REVIEW_MODE = false` and bump `ADSENSE_GATE_VERSION` (forces a full static rebuild).
2. Mirror it by hand: remove or trim the `ADSENSE_REVIEW_PATH` `SetEnvIf` lines in `public/.htaccess` and the `isHeldOut` block in `index.html`.
3. Keep the drill and mock exams noindexed: they carry `noindex: true` in `scripts/lib/communityPages.js` and `noindex={true}` in their pages.
4. Add `/roadmaps` and `/interview-prep/questions` to the SSG `essentialPaths` list in `scripts/generateStaticPagesIncremental.js` before any WordPress post links to them (otherwise the build strips those links).
5. The Roadmaps link in the Learn menu appears automatically (it is in `REVIEW_HIDDEN_LEARN`). Optionally add Roadmaps to the footer and in-article CTAs.
6. Merge estimator v2 into `/tools/cloud-data-warehouse-cost-comparison`: move the page, add a 301 from `/tools/warehouse-cost-estimator` in both `public/.htaccess` and an `App.jsx` `<Navigate>`, drop the v2 catalog entry, and point the older calculators at `src/data/warehousePricing.js`.
7. Update `scripts/verifyLiveAdsenseReview.js` (move these URLs from must-noindex to must-index), add the new localStorage keys to the privacy policy (`dehub:roadmaps:v1`, practice store `interview` namespace, `mock:<slug>` in progress), regenerate the sitemap and resubmit it in Search Console.
