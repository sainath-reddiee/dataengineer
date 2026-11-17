# Content Quality Re-audit: dataengineerhub.blog

Status: COMPLETE. Re-audit date 2026-11-17. Baseline: ../findings/content.md (2026-11-16).

Method: static HTML fetched with curl (the render tool was unavailable). Re-fetched the homepage, /about, /editorial-standards, /articles and the same 8 sample articles, then crawled all 103 article URLs in sitemap.xml (all returned 200, all `index, follow`). Word counts are article-body prose (div.article-body) with pre/code removed, the same basis as the baseline; small differences from baseline medians come from re-extraction and content edits. The bundled metadata_template.py again failed ("Claude SEO runtime is not ready"), so the deterministic title/description comparison was repeated by script. Held-out noindex sections (glossary, compare, roadmaps, practice, contributors listing) were not assessed for indexability.

## Scores

| Score | Baseline | Re-audit | Delta |
|---|---|---|---|
| Content Quality | 66 | 68 | +2 |
| On-Page SEO | 74 | 76 | +2 |
| AI Citation Readiness | 72 | 74 | +2 |

E-E-A-T breakdown (this audit's internal weighting, not Google's):

| Factor | Weight | Baseline | Re-audit | Basis for change |
|---|---|---|---|---|
| Experience | 20% | 74 | 74 | No change. 2026 first-hand posts remain strong; 2025 cohort still has none. |
| Expertise | 25% | 62 | 62 | DuckDB billing error, Tasks claims and load-data "Snowflake" typo all still live. |
| Authoritativeness | 25% | 48 | 50 | Guest authors now credited with real names, roles and (for some) LinkedIn; author box links LinkedIn. /about unchanged. |
| Trustworthiness | 30% | 62 | 66 | Correct guest attribution, sponsored/nofollow on guest product links, visible Updated dates. Offset by GitHub draft links, /contributors redirect loop, stale "2026" titles. |
| Weighted E-E-A-T | | 61 | 63 | |

## Site-wide metrics (103 sitemap articles, live 2026-11-17)

| Metric | Baseline | Re-audit |
|---|---|---|
| Median body words | 1,891 | 1,797 |
| Under 800 words | not reported | 0 |
| Under 1,000 words | 8 | 10 (lowest: salesforce-copilot-custom-action-guide 806, load-data-into-snowflake 811, snowflake-cortex-aisql-query-optimization-guide 842) |
| Under 1,500 words | 23 | 28 |
| 2025 cohort | 21, median 1,165, 16 unmodified | 21, median 1,067, 16 still unmodified since 2025 |
| Titles over 60 chars | 4 | 4 (same pages: 102, 68, 64, 63) |
| Descriptions | 114 to 162, 1 over 160 | 114 to 162, 1 over 160 (snowflake-zero-copy-cloning-problems) |
| H1 count | 1 everywhere except one page with 12 | exactly 1 on all 103 |
| Schema headline equals visible H1 | not checked | 103 of 103 |
| Visible Updated date | 0 | 51 of 51 articles whose dateModified differs from datePublished; values match schema |
| Author (schema and byline) | Sainath Reddy on all 103 | Sainath Reddy on 95; 8 guest posts credited to the real guest in both byline and schema |
| Body images missing alt | 0 of ~250 | 0 of 250, but about 120 carry filename-style alt text (see N4) |
| Near-duplicate titles (ratio >= 0.83) | 2 pairs | same 2 pairs |
| Tables | not counted | 30 of 103 articles |
| Question-form H2/H3 | not counted | 23 of 103 articles |
| TL;DR aside | "newer posts" | 55 of 103 |
| FAQPage schema | ~30 malformed | 45 pages; about 31 still contain heading-plus-"?" items |
| Metadata templating | site_risk low | unchanged: 0 duplicate descriptions, 0 shared closing CTA, 0 brand suffix, 2 of 103 echo the title (templated_ratio about 0.02) |

## Baseline findings re-tested

| ID | Sev | Finding | Status | Live evidence 2026-11-17 |
|---|---|---|---|---|
| F1 | High | 2025 legacy articles generic, inaccurate, below own standard | Not fixed (owner action, expected) | star-schema still opens "In the realm of data warehousing", still "This comprehensive guide delves", "over 70% of data warehouses favor star schemas", "about 20-30% of cases", "Which is Used Most in 2025?". load-data still says "Using the COPY command for bulk loads or Snowflake for continuous ingestion", still references unlinked Part 1 and Part 3, still claims Parquet saves storage cost, 0 external links. Agentforce was partly restructured (new direct opener, 12 H2s, 5 Salesforce doc links) but still carries unsourced "58% success rates", "40-60%", "around 80% of enterprise data is unstructured" and "The 2025 roadmap". 16 of 21 2025 articles unmodified since 2025. |
| F2 | High | "2026" titles on content unchanged since 2025 | Not fixed, now more visible | Titles still say 2026 while the visible H1 says 2025: snowflake-dynamic-tables-complete-guide-2025 (title "Complete 2026 Guide", H1 "Complete 2025 Guide & Examples", modified 2025-10-16); snowflake-native-dbt-integration-2025-guide (title "2026 Setup Guide", H1 "Complete 2025 Guide", modified 2025-10-17); snowflake-data-science-agent-automate-ml-2025 (title "Automate ML in 2026", H1 "Workflows 2025", modified 2025-10-08). Agentforce title "Complete 2026 Guide" over a body that still says "2025 roadmap" and Dreamforce 2024. With visible dates now live, the SERP title and the on-page H1 and date contradict each other. |
| F3 | High | Guest post attributed to owner; product link unqualified | Fixed | food-data-quality-pipeline-guest-post: byline and Article schema author are Jelte Lud (jobTitle Guest Contributor). getdietly.com/api link now rel="noreferrer noopener sponsored nofollow". The fix also covers 7 further guest posts the baseline missed (ai-data-pipelines-cost-control, dynamic-airflow-dags-snowflake-metadata, etl-vs-elt-vs-reverse-etl-framework, from-etl-pipelines-to-reusable-data-products, how-ai-is-reshaping-data-engineering, incremental-data-processing-vs-full-refresh, justify-data-platform-investment). Remaining gap: no disclosure line on either commercial guest post (see N5); 6 guest author URLs point to /contributors/slug, which loops (N2). |
| F4 | High | Factual errors in DuckDB and Tasks articles | Not fixed (owner action, expected) | DuckDB (modified 2026-11-09, opener rewritten): still "20 queries on load, each taking three seconds, that single page view triggers 1,200 seconds of billed compute time"; title still "Cut Dev Costs 80%"; "One SaaS company" and "A data engineering team" case studies still unlinked. Tasks: still "There's no single screen that shows you..."; no mention of RETRY, Snowsight task graph view, or a "What changed" note. |
| F5 | Medium | Pasted source artifacts and "#" links in Tasks post | Not fixed | "...external schedulers are required. Flexera", "...as a workaround. Sonra", "...more than just a place to send SQL. Monte Carlo" all present. The two "#" links ("How I Wired Snowflake's Native dbt Projects to Airflow" and the Streams and Tasks SCD2 link) remain; they are the only "#" hrefs site-wide. |
| F6 | Medium | Thin, inconsistent author credentials | Not fixed (owner action, expected) | /about: H1 still "About DataEngineer Hub" vs title "About Sainath Reddy"; 0 external links, no photo, no years, no employer, no certifications; prose still "passionate Data Engineer ... extensive experience". FKGL 14.1. Author box now links LinkedIn and no longer states "5+ years", but still reads "Founder & Owner". Person schema still says "4+ years" and lists worksFor, neither visible on /about. |
| F7 | Medium | Auto-generated malformed FAQ blocks | Not fixed | 45 pages emit FAQPage; about 31 contain heading-derived items, e.g. "What the MCP Server Actually Is?", "What Salesforce Agentforce is?", "What real cost savings look like?", "What's inside?" / "Who is it for?" on the sales page. Agentforce item "What the agents can do?" still answers "According to Salesforce, agents can: Companies using Agentforce report 58%...", a truncated answer, now also in FAQPage JSON-LD. |
| F8 | Medium | No visible Updated date | Fixed | 51 of 51 revised articles show "Updated <date>" next to the publish date, matching dateModified (e.g. Agentforce "Oct 17, 2025 · Updated Nov 15, 2026"). The 7 articles dated 2026-11-15 all show real body changes (the rework that introduced N1), so the dates are earned. |
| F9 | Medium | MCP guide title/content mismatch; cannibalisation | Not fixed | Title still "Build a Snowflake MCP Server: Complete Tutorial" over H1 "Using MCP Servers with Snowflake: A Practitioner's Guide"; description still "Expose Snowflake as an MCP server". Both near-duplicate title pairs unchanged (0.89 interview questions, 0.83 SQL interview pattern). |
| F10 | Medium | Sales page as article with 12 H1s | Partly | sql-pattern-that-kills-data-engineer-interviews now has 1 H1 ("The Real Reason Data Engineers Fail Technical Interviews") and 19 H2s. It is still a playbook pitch, and its FAQPage schema now marks up "What's inside?", "Who is it for?", "Who is it not for?" as questions. |
| F11 | Medium | Inconsistent article counts | Partly | Homepage still shows "115+ articles · 15+ technologies" next to "103 tutorials so far" and "Browse all 103 articles". /articles says 103. The 104 figure is gone; 115+ remains. |
| F12 | Low | Homepage meta description 256 chars | Fixed | 151 chars: "Production-tested data engineering tutorials on Snowflake, Databricks, dbt, Airflow, AWS and Python, written from real incidents by a working engineer." |
| F13 | Low | Titles over 60 chars | Not fixed | incremental-data-processing-vs-full-refresh 102, snowflake-cortex-sense-context-runtime 68, medallion-architecture-reconsidered 64, rag-retrieval-augumented-generation-production-guide 63. |
| F14 | Low | Heading-level skips | Not fixed, slightly wider | Skips on 5 articles: load-data-into-snowflake (2), star-schema (1, 0 H2s), salesforce-copilot-custom-action-guide, snowflake-cortex-code-cost-control-2026, snowflake-expert-interview-questions (1 each). |
| F15 | Low | Slug and copy typos, wrong code caption | Not fixed | Slugs "brekage" and "augumented" unchanged. star-schema H1 still "Snowflake Schema:Key". Homepage card still "How to setup DBT state in Your Snowflake project". MCP guide SQL block still captioned "shell ... CLI command, run it in a terminal" above "-- Recommended pattern". New typo in alt text: "2exrtract" (2extract post). |
| F16 | Low | Indexed articles link to noindexed articles | Not fixed, wider | 16 indexed articles link to /articles/automated-etl-airflow-python/ or /articles/snowflake-streams-tasks-pipeline-guide/ (both "noindex, follow"), up from 3 named in baseline: airflow-vs-prefect, aws-data-pipeline-cost-optimization-strategies, best-mcp-servers-agentic-development, build-mcp-server-python-fastmcp, dbr-fusion-engine-migration-guide, delta-lake-vs-iceberg, how-ai-is-reshaping-data-engineering, introduction-to-loop-engineering, load-data-into-snowflake, snowflake-coco-desktop, snowflake-expert-interview-questions, snowflake-interview-questions-answers-2026, snowflake-query-execution-architecture, sql-most-valuable-skill-ai-2026, tools-vs-subagents-ai-agents, why-i-stopped-using-snowflake-tasks-orchestration. |
| F17 | Info | Metadata not templated | Still passing | See metrics table. |
| F18 | Info | Strengths | Preserved | Delta vs Iceberg "six months of hitting Delta Lake's limits" intact; MCP guide TL;DR aside with dated, specific limits ("as of August 20, 2026", 250 KB truncation); Tasks, DuckDB and 20-AI-concepts posts read at FKGL 8.1 to 8.6. |

Deployed fixes confirmed without a baseline finding number: Article schema headline equals the visible H1 on 103 of 103 articles; body H1s demoted (one H1 on every article).

## New findings

### N1. High: 305 links in 16 articles point to the public GitHub repo, including draft copies of the articles and 20 broken internal links
- Evidence: heading anchors in the rework pipeline were pasted as absolute GitHub URLs. Example from salesforce-agentforce-complete-guide-2025: `<h2 id="key-features">Key features<a href="https://github.com/sainath-reddiee/dataengineer/blob/main/plans/rework/salesforce-agentforce-complete-guide-2025.md#key-features"></a></h2>`.
  - 282 empty-text anchors (219 inside H2/H3) and 3 text links point to `plans/rework/<slug>.md`. The repo is public and these URLs return 200, so a draft copy of each article is publicly indexable on github.com and every heading leaks a link to it.
  - 20 inline links with real anchor text point to GitHub paths that should have been site-relative and return 404, e.g. airflow-vs-prefect "Delta Lake vs Iceberg" to github.com/.../blob/main/articles/delta-lake-vs-iceberg; snowflake-zero-copy-cloning-problems has 4; automation-in-data-engineering has 5 (including glossary/data-quality); snowflake-dbt-projects-airflow-orchestration has 3.
  - Affected: 2extract-web-scraping-python-mcp, airflow-vs-prefect, automation-in-data-engineering, build-rag-snowflake-cortex-search-guide (37 links), claude-code-power-user-guide, governing-ai-agents-snowflake-coco-mcp-security, query-snowflake-in-duckdb-cut-costs, salesforce-agentforce-complete-guide-2025 (32), snowflake-cortex-ai-hidden-token-costs, snowflake-cortex-code-cost-control-2026, snowflake-cortex-sense-context-runtime, snowflake-dbt-projects-airflow-orchestration, snowflake-dcm-projects-infrastructure-as-code, snowflake-dynamic-data-masking-row-access-policies, snowflake-zero-copy-cloning-problems, sql-most-valuable-skill-ai-2026. All 7 articles modified 2026-11-15 are in this list.
- Impact: broken internal links and lost internal link equity on recently revised flagship posts; duplicate draft text on a third-party domain; looks unedited to a quality rater.
- Recommendation: strip the empty heading anchors (or rewrite them to `#id`), rewrite `github.com/.../blob/main/articles/<slug>` and `/glossary/<slug>` to site-relative URLs, and add a CI check that fails on `github.com/sainath-reddiee/dataengineer/blob` inside article HTML. Consider making `plans/rework/` private or excluding it from the public repo.

### N2. Medium: /contributors redirect loop; guest author schema URLs resolve into it
- Evidence: `/contributors/` 301 to `/contributors`, which 308s back to `/contributors/`; `/contributors/praparna-moharana` and `/praparna-moharana/` 301 to `/contributors` and enter the same loop (curl exits with "maximum redirects"). 6 of 8 guest Article author URLs use `/contributors/<slug>`. /editorial-standards says "Guest authors appear on /contributors".
- Recommendation: break the loop (serve /contributors/ as a 200 noindex page, or point guest author URLs at their LinkedIn or own site). The noindex itself is intentional and is not flagged.

### N3. Medium: About half of body images have filename-derived alt text
- Evidence: 0 images lack alt, but 51 images on 16 articles use "Image", "Image 2 x", "Img 2", and 102 alts end in a filename artifact " x" (e.g. "Duckdb x", "Concepts ladder x", "Mcp before after"). Examples: etl-vs-elt-vs-reverse-etl-framework ("Image 1 x" through "Image 8"), build-rag-snowflake-cortex-search-guide ("Image 4" to "Image 9"), ai-data-pipelines-cost-control ("Image 1 1", "Image2"), 2extract-web-scraping-python-mcp ("2exrtract 2 1 x", duplicated). star-schema uses the same alt on two images. The deployed alt fix did not reach these.
- Recommendation: describe what each diagram shows in one sentence; prioritise architecture and benchmark charts, which are the images most likely to surface in image and AI results.

### N4. Medium: Commercial guest post without a disclosure line
- Evidence: justify-data-platform-investment is by "Rashi Lachuriya ... works in marketing at Samta.ai"; author URL samta.ai; two body links to samta.ai service pages (correctly sponsored/nofollow); 976 words, 0 H2s, no disclosure. food-data-quality-pipeline-guest-post also promotes the author's API without a disclosure.
- Recommendation: add a one-line "Guest post by X of Y. Links to Y are sponsored." note above the body. Hold vendor-marketing guest posts to the editorial-standards bar or noindex them.

### N5. Low: Agentforce title, H1, hero alt and breadcrumb disagree
- Evidence: title and breadcrumb "Salesforce Agentforce: Complete 2026 Guide"; H1 and schema headline "Salesforce Agentforce Explained: Features, Use Cases and How to Start"; hero alt uses the old title. 96 of 103 titles differ from H1 site-wide, which is acceptable, but here the title makes a freshness claim the body does not support (see F2).
- Recommendation: align the title with the rewritten H1 and drop "2026" until the roadmap section is updated.

## AI citation readiness (74/100, +2)

- Improved: visible Updated dates on 51 articles; TL;DR asides on 55 of 103 articles, some with explicit as-of dates (MCP guide "as of August 20, 2026"); direct-answer openers added on revised posts (Agentforce and DuckDB now open with "This post explains/is for...", 11 articles open this way); single H1 and headline parity give clean entity extraction; guest authors are now distinct Person entities.
- Unchanged gaps: unsourced numbers remain the most quotable text (Agentforce 58% / 40-60% / 80%, star-schema 70% / 20-30%, DuckDB 1,200 seconds); malformed FAQ Q&A now in FAQPage JSON-LD on about 31 pages; only 30 articles have a table and 23 have question-form headings; 48 articles have no TL;DR, concentrated in the 2025 cohort.
- New drag: heading anchors pointing to GitHub drafts (N1) give AI crawlers a second, unofficial copy of 16 articles.
- Actions: add a source link next to every percentage; fix or drop auto-generated FAQ items; add a TL;DR and one comparison or decision table to each article under 1,500 words; turn 2 or 3 H2s per article into the question a reader would search.

## Prioritised actions

1. Remove the GitHub draft links and fix the 20 broken inline links (N1). Mechanical, high impact, no owner content decisions needed.
2. Correct the DuckDB billing example and Tasks claims; remove the Flexera/Sonra/Monte Carlo artifacts and "#" links (F4, F5).
3. Remove "2026" from the three 2025-dated titles and Agentforce, or update the content (F2, N5).
4. Triage the 21 2025 articles: rewrite, merge or noindex (F1).
5. Fix the /contributors loop and add guest disclosures (N2, N4).
6. Rebuild /about and align author box and Person schema (F6).
7. Drop or rewrite heading-derived FAQ items (F7); retitle the MCP guide (F9); unify the homepage article count (F11); repoint links to noindexed targets (F16); rewrite placeholder alts (N3); long titles, heading skips and typos (F13 to F15).

## Structured findings (audit-data.json, category "Content Quality")

```json
{
  "category": "Content Quality",
  "audit_date": "2026-11-17",
  "baseline": "findings/content.md",
  "scores": {"content_quality": 68, "on_page_seo": 76, "ai_citation_readiness": 74,
             "deltas": {"content_quality": 2, "on_page_seo": 2, "ai_citation_readiness": 2},
             "eeat": {"experience": 74, "expertise": 62, "authoritativeness": 50, "trustworthiness": 66, "weighted": 63}},
  "status": [
    {"id": "F1", "status": "Not fixed"}, {"id": "F2", "status": "Not fixed"}, {"id": "F3", "status": "Fixed"},
    {"id": "F4", "status": "Not fixed"}, {"id": "F5", "status": "Not fixed"}, {"id": "F6", "status": "Not fixed"},
    {"id": "F7", "status": "Not fixed"}, {"id": "F8", "status": "Fixed"}, {"id": "F9", "status": "Not fixed"},
    {"id": "F10", "status": "Partly"}, {"id": "F11", "status": "Partly"}, {"id": "F12", "status": "Fixed"},
    {"id": "F13", "status": "Not fixed"}, {"id": "F14", "status": "Not fixed"}, {"id": "F15", "status": "Not fixed"},
    {"id": "F16", "status": "Not fixed"}, {"id": "F17", "status": "Pass"}, {"id": "F18", "status": "Preserved"}
  ],
  "new_findings": [
    {"id": "N1", "severity": "High", "title": "305 GitHub repo links in 16 articles: 285 to public draft .md copies, 20 broken inline internal links (404)", "urls": ["/articles/salesforce-agentforce-complete-guide-2025", "/articles/build-rag-snowflake-cortex-search-guide", "/articles/snowflake-zero-copy-cloning-problems", "/articles/automation-in-data-engineering"]},
    {"id": "N2", "severity": "Medium", "title": "/contributors redirect loop; 6 guest author schema URLs resolve into it", "urls": ["/contributors/"]},
    {"id": "N3", "severity": "Medium", "title": "About half of 250 body images have filename-derived alt text", "urls": ["/articles/etl-vs-elt-vs-reverse-etl-framework", "/articles/build-rag-snowflake-cortex-search-guide"]},
    {"id": "N4", "severity": "Medium", "title": "Commercial guest posts lack a disclosure line", "urls": ["/articles/justify-data-platform-investment", "/articles/food-data-quality-pipeline-guest-post"]},
    {"id": "N5", "severity": "Low", "title": "Agentforce title/breadcrumb/hero alt disagree with rewritten H1", "urls": ["/articles/salesforce-agentforce-complete-guide-2025"]}
  ]
}
```
