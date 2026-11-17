# Schema Re-Audit: dataengineerhub.blog (live, 2026-11-17)

Method: curl of raw HTML for 12 pages (home, /about, /articles, calculator, cheatsheet, /certification, and articles snowflake-mcp-server-guide, food-data-quality-pipeline-guest-post, airflow-vs-prefect, delta-lake-vs-iceberg, dbt-tests-pass-bad-data, 2extract-web-scraping-python-mcp). Python JSON parsing, image files fetched and measured byte-level. Render tool unavailable, so client-injected schema is unchecked. All JSON-LD blocks parse, all use https://schema.org, no Microdata or RDFa, all pages return 200.

Schema score: 80/100 (baseline 66, delta +14)

## Baseline findings status
| ID | Finding | Status | Evidence |
|---|---|---|---|
| F1 | Article headline differs from H1 | Fixed | headline equals H1 (html-unescaped) on all 6 articles and the cheatsheet. Breadcrumb last item, HowTo name and og:image:alt still use the shorter SEO title (title tag), which is acceptable. |
| F2 | False image dimensions | Partly | Article images no longer declare width/height, so no false claims. og-image.jpg measured 1200x630 (61,650 bytes) and matches og:image:width/height on home, about, articles, certification, calculator, cheatsheet. Real featured images still undersized: airflow-vs-prefect 491x274, delta-lake-vs-iceberg 660x368, dbt 737x491 (per fit param). mcp 1536x1024, 2extract 1774x887, guest 1920x1099 are fine. Under 1200px wide limits large previews and Discover. |
| F3 | Fragmented @id graph | Mostly fixed | One Person @id #author and Organization @id #organization everywhere (home, about, owner articles, calculator publisher, guest post publisher). WebSite @id #website on home, referenced by Article.isPartOf; WebSite.publisher points to #organization. Remaining: Article has no @id and no WebPage node; Article.author is an inline Person repeating @id #author with fewer properties than the standalone Person; Article.publisher inlines name and logo instead of a bare @id ref; separate script tags, no single @graph; about, certification, articles, calculator WebPage/CollectionPage still use url-only publisher stubs; cheatsheet has no @id at all. |
| F4 | dateModified not visible, trivial modified dates | Partly | Visible "Updated" time element now matches dateModified on 2extract, airflow, dbt, delta (datetime attributes verified). Cheatsheet shows "Last updated: 2026-04-09", matching schema. Still: no timezone offsets, mcp-guide modified is 3 seconds after published, guest post 21 seconds after (no Updated shown), cheatsheet uses a Z date at 00:00:00. |
| F5 | Wrong articleSection / keywords | Not fixed | delta-lake-vs-iceberg articleSection still "Airflow"; 2extract and guest post "Data Engineer"; airflow keywords still include "perfect"; keywords are raw tags. |
| F6 | SoftwareApplication incomplete | Partly | name now "Snowflake Cost Calculator"; publisher uses @id #organization. Still no aggregateRating or review (no rich result; do not fabricate), still SoftwareApplication rather than WebApplication, separate WebPage block with no mainEntity link. |
| F7 | FAQ questions are headings | Not fixed (Info) | mcp: "What the MCP Server Actually Is?" and "What the MCP Server Doesn't Do (Yet)?"; 2extract: "What 2extract actually is ... isn't?" and "Where this breaks?". Answer text matches visible body on all pages (mcp 2/2, 2extract 6/6, airflow 5/5, dbt 6/6, delta 6/6, cheatsheet 3/3), so no content mismatch. No Google SERP benefit since May 2026. |
| F8 | Person/Org details | Mostly fixed | Article has inLanguage "en" and isPartOf WebSite; knowsAbout on owner Person; standalone Person block only on owner articles (absent on guest post). Still: worksFor "Anblicks" and "4+ years" in public Person markup (confirm intent); Organization sameAs is a personal LinkedIn and a GitHub repo, no organization-level profile. |
| F9 | Logo / founder link | Fixed | logo.png measured 250x250 PNG, declared 250x250. Home Organization founder now has @id #author. |
| F10 | BreadcrumbList labels | Mostly fixed | Labels now short ("About Sainath Reddy", "Snowflake Certification Prep", "Snowflake Cost Calculator"). /articles still has no BreadcrumbList. Minor: Home item lacks trailing slash while canonical has one. |
| F11 | WebSite SearchAction | Unchanged (harmless) | Present on home with @id #website. Sitelinks Search Box retired by Google. |
| F12 | /about page type | Not fixed | Still generic WebPage, no @id, no mainEntity to #author. name "About Sainath Reddy - ..." vs H1 "About DataEngineer Hub". |
| F13 | /articles CollectionPage thin | Not fixed | No ItemList, no @id, no breadcrumb, description hard-codes "103". |
| F14 | Cheatsheet Article | Partly | Image is now a valid 1200x630 file and dates are visible and consistent, headline equals H1. Publisher has no logo or @id, author inline without @id. |
| I1 | FAQPage | Unchanged (Info) | Present on 5 of 6 re-tested articles (not the guest post) and the cheatsheet. |
| I2 | HowTo | Not fixed (Info) | Still on snowflake-mcp-server-guide (4 steps) and 2extract (6 steps, lowercase code-comment names). Rich results removed 2023; recommend removal. |
| I4 | No Review/AggregateRating | Unchanged | Nothing fabricated. |

Caller-listed fixes verified: headline equals H1; shared #author, #organization, #website IDs; real 1200x630 og-image.jpg; no wrong image sizes on Articles; shortened breadcrumbs; SoftwareApplication name; guest post credits Jelte Lud (Person, url https://www.getdietly.com, jobTitle Guest Contributor, description, no owner Person block); inLanguage and isPartOf; knowsAbout.

## New findings
| Sev | Finding |
|---|---|
| Medium | The @id #author is declared twice on each owner article with different property sets (inline Article.author vs standalone Person with worksFor and description). Replace the inline one with a bare {"@id": "https://dataengineerhub.blog/#author"}. |
| Low | Guest author Person has no @id or sameAs; add a profile sameAs. |
| Low | Article nodes have no @id; mainEntityOfPage is an inline WebPage with only @id (matches canonical, good). No WebPage node for isPartOf and breadcrumb. |
| Low | ImageObjects now lack width/height; optional, but real values are measurable (mcp 1536x1024, guest 1920x1099). |
| Info | No regressions: no parse errors, no placeholder text, all URLs absolute, dates ISO 8601 (without offsets). |

## Scoring rationale
Strong base of valid, https, absolute-URL markup with shared IDs. Deductions: undersized featured images on 3 articles and no image arrays (-4), graph remnants including duplicated Person, no @graph, no WebPage nodes (-4), wrong articleSection and keywords (-3), date quality (-2), HowTo/FAQ residue (-3), /about, /articles and cheatsheet gaps (-2), SoftwareApplication gaps and misc (-2). Total 80.

## Priority
1. Replace undersized images (airflow 491px, delta 660px, dbt 737px) with 1200px+ files.
2. Fix articleSection and keywords (delta "Airflow", 2extract and guest "Data Engineer", "perfect"); add timezone offsets.
3. Finish the graph: bare @id refs for author and publisher, Article @id, /about as ProfilePage with mainEntity #author, cheatsheet on shared IDs with publisher logo; remove HowTo.
