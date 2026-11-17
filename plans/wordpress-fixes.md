# WordPress fixes the repo cannot make

Everything in `plans/` and the code already handles what can be fixed at build time. These items live in WordPress post content, categories, tags and slugs, so they need your edit. Sources: `dataengineerhub.blog-audit/findings/content.md` (baseline) and `dataengineerhub.blog-audit/reaudit/content.md` (re-audit of 2026-11-17).

Where a fact is involved, treat my wording as a pointer, not a correction: check it against the current vendor documentation before you publish.

## A. Accuracy and trust (do these first)

1. **`query-snowflake-in-duckdb-cut-costs`: the billing example is wrong.**
   - Now says: a dashboard that fires 20 queries of 3 seconds each "triggers 1,200 seconds of billed compute time".
   - Why it is wrong: Snowflake's 60-second minimum applies once each time a warehouse resumes, not once per query. Queries running together on an already running warehouse are billed by elapsed time, so the example overstates the cost by roughly 20x. The same section also says a 5-second query "gets billed for a full minute", which contradicts it.
   - Fix: rewrite the example around warehouse resumes (for example, a dashboard that wakes a suspended warehouse pays the 60-second minimum once, however many queries follow).
   - Title: "Cut Dev Costs 80%" rests on three case studies, two anonymous. Either add your own before and after numbers, or soften the title.
2. **`why-i-stopped-using-snowflake-tasks-orchestration`: claims to check, plus paste artifacts.**
   - Says you cannot retry a failed task mid-graph and resume from it. Snowflake documents `EXECUTE TASK ... RETRY LAST` for task graphs. Verify, then add a dated "What changed since publication" note.
   - Says there is "no single screen" for task runs. Snowsight has a task graph run view. Verify.
   - Three sentences end in a pasted source name with no punctuation: "...external schedulers are required. **Flexera**", "...as a workaround. **Sonra**", "...place to send SQL. **Monte Carlo** Tasks are...". Turn each into a real citation or rewrite it in your own words.
   - Two links go to `#`. Targets exist: "How I Wired Snowflake's Native dbt Projects to Airflow" is `/articles/snowflake-dbt-projects-airflow-orchestration/`; "Snowflake Streams and Tasks for SCD2" is `/articles/snowflake-streams-tasks-pipeline-guide/` (currently noindexed, see item 10).
3. **`salesforce-agentforce-complete-guide-2025`:** the body still describes "The 2025 roadmap" and Dreamforce 2024, and carries unsourced figures ("58%... 35%", "40-60%", "around 80% of enterprise data is unstructured"). The title is now honest, but the body needs a real update with sources, or a "last reviewed" note.
4. **`load-data-into-snowflake`:** "continuous ingestion" is credited to "Snowflake" where it should say Snowpipe; the Parquet claim implies lower Snowflake storage cost although loaded data is stored in Snowflake's own format; "Part 1" and "Part 3" are mentioned but not linked.

## B. The 21 thin articles published in 2025

Rewrite with a real incident, measurements and current docs links; or merge into a stronger 2026 article and tell me the old and new slugs so I can add a 301; or noindex. Suggested order:

`star-schema-vs-snowflake-schema-comparison`, `load-data-into-snowflake`, `salesforce-agentforce-complete-guide-2025`, `salesforce-copilot-custom-action-guide`, `aws-data-pipeline-cost-optimization-strategies`, `synapse-to-fabric-migration-adx-eventhouse-guide`, `serverless-data-pipeline-aws`, `build-data-lakehouse-on-azure`.

The editorial-standards page promises that a page which cannot name a concrete failure mode, a number or a decision does not ship as an article. These do not meet it yet.

## C. Quick edits

5. Typos: the H1 on `star-schema-vs-snowflake-schema-comparison` reads "Snowflake Schema:Key" (missing space). The homepage card "How to setup DBT state in Your Snowflake project" should read "set up".
6. Categories and tags: `delta-lake-vs-iceberg` is categorised "Airflow" (schema `articleSection`); `2extract-web-scraping-python-mcp` and the food-data guest post show "Data Engineer"; `airflow-vs-prefect` has the tag "perfect" (typo for "prefect").
7. Slug typos, which need a rename in WordPress plus a redirect from me: `data-contracts-schema-brekage-guide`, `rag-retrieval-augumented-generation-production-guide`, `2extract-web-scraping-python-mcp` ("2exrtract" appears in image names). After you rename, send me old and new slugs.
8. Featured images under 1200px wide: `airflow-vs-prefect` (491x274), `delta-lake-vs-iceberg` (660x368), `dbt-state-snowflake-configuration` (737x491). Re-upload at 1200px or more.
9. Heading levels skip on `load-data-into-snowflake` (H2 to H4 twice), `star-schema-vs-snowflake-schema-comparison` (no H2s), `salesforce-copilot-custom-action-guide`, `snowflake-cortex-code-cost-control-2026`, `snowflake-expert-interview-questions`.
10. Sixteen indexed articles link to `/articles/automated-etl-airflow-python/` or `/articles/snowflake-streams-tasks-pipeline-guide/`, both noindexed (thin). Either expand those two past 800 prose words, or point the links at indexed equivalents.

## D. Content that helps AI search and readers

11. Most articles open with a story or a promotional line. Add a 40 to 60 word direct answer under the H1.
12. 88 of 119 articles have no table and 94 have no question-form heading; `plans/geo-worklist.json` lists them. Comparison content (options, prices, limits) reads best as a table.
13. About 9 images sit above the first heading and still read "Image". Give the diagrams that matter real alt text; the build now writes a section-based alt for the rest, which is better than a filename but not a description.

## E. Needs your decision

14. `llms.txt` says you are "SnowPro certified", but `/about` and the site schema never mention it. Either add the credential (name and date) where readers and Google can see it, or remove the claim from `public/llms.txt` and `public/llms-full.txt`. I did not guess.
15. `snowflake-best-practices` cheat sheet is under the 800-word thin rule (about 560 prose words), so it is noindexed and no longer on the indexable allowlist. To bring it back, expand it to 800+ words, then add `'snowflake-best-practices'` to `ADSENSE_REVIEW_CHEATSHEETS` in `src/data/adsenseQualityGate.js`, remove its rule from `public/_headers`, and bump `ADSENSE_GATE_VERSION`.
16. `justify-data-platform-investment` is a marketing piece by a Samta.ai employee. It now carries a disclosure line automatically. The re-audit suggests holding vendor posts to the editorial standard, or noindexing them.

## F. Not code: AdSense
17. Unpublish or keep the Offerwall message (AdSense, Privacy & messaging, Offerwall).
18. Request the review only after the site has been stable for 2 to 4 weeks (your roadmap, Phase 5).
