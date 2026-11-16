# Schema / Structured Data Audit: dataengineerhub.blog (live, 2026-11-16)

Method: curl of raw HTML (JSON-LD is server-rendered and present in raw HTML on all pages), Python JSON parsing. Render tool unavailable, so client-injected schema was not checked. Pages: /, /about, /articles, /tools/snowflake-cost-calculator, /cheatsheets/snowflake-sql, /certification, and 7 articles (snowflake-mcp-server-guide, airflow-vs-prefect, delta-lake-vs-iceberg, dbt-tests-pass-bad-data, build-mcp-server-python-fastmcp, 20-ai-concepts-for-data-engineers, 2extract-web-scraping-python-mcp).

Schema score: 66/100

## Detection per page (all blocks parse as valid JSON; all use https://schema.org; no Microdata or RDFa)
| Page | JSON-LD blocks |
|---|---|
| / | Organization (no @id), WebSite + SearchAction (no @id) |
| /about | WebPage, BreadcrumbList, Organization (@id #organization), Person (@id #author). No ProfilePage/AboutPage |
| /articles | CollectionPage only. No BreadcrumbList, no ItemList |
| /tools/snowflake-cost-calculator | WebPage, BreadcrumbList, Organization, SoftwareApplication |
| /cheatsheets/snowflake-sql | Article, FAQPage (3 Q), BreadcrumbList. No Organization/Person block |
| /certification | WebPage, BreadcrumbList, Organization |
| Articles (7) | Article, BreadcrumbList, FAQPage (5 of 7), Organization, Person, HowTo (2 of 7: snowflake-mcp-server-guide, 2extract) |

## Findings

### F1 HIGH: Article headline differs from visible H1 on every article (live; local fix not deployed)
Evidence: headline = SEO title, H1 = long-form title. mcp-guide: headline "Build a Snowflake MCP Server: Complete Tutorial" vs H1 "Using MCP Servers with Snowflake: A Practitioner's Guide". Same pattern on delta-lake-vs-iceberg, dbt-tests-pass-bad-data, build-mcp-server-python-fastmcp ("Build MCP Server with Python FastMCP" vs "Build a Simple MCP Server in Python with FastMCP (2026)"), 20-ai-concepts, airflow-vs-prefect, 2extract. The BreadcrumbList last-item name, HowTo name and og:image:alt also repeat the SEO title.
Recommendation: ship the local change; decide deliberately on breadcrumb and alt text naming. Re-verify after deploy.

### F2 HIGH: Declared image dimensions are false
Evidence: every Article image declares 1200x630, but real files are: mcp-guide 1536x1024, airflow-vs-prefect 491x274, delta-lake-vs-iceberg 660x368, dbt-tests (737x491 per ?fit param), 2extract (1774x887 per ?fit param). Only fastmcp and 20-ai-concepts are 1200x630. Site-wide /og-image.jpg is actually 1024x1024 while pages declare og:image:width 1200 and height 630. Google recommends images of at least 1200px wide for large previews and Discover; 491px and 660px are under that.
Recommendation: emit real dimensions or omit them; regenerate small featured images at 1200px+ wide; offer 16:9, 4:3 and 1:1 variants as an image array; replace og-image.jpg with a true 1200x630 file.

### F3 MEDIUM: Entity graph fragmented, @id inconsistent
Evidence: Article.author is an inline Person with @id https://dataengineerhub.blog/about#person, while a separate Person block uses @id https://dataengineerhub.blog/#author: two IDs for one person, and the standalone blocks are never referenced by the Article. Article.publisher is an inline Organization with no @id or url, duplicating the #organization block. Home Organization and WebSite have no @id; WebSite.publisher is an unlinked inline Organization. Organization and Person are separate script tags rather than one @graph. Page-level WebPage/CollectionPage/Article on other pages use url-only publisher stubs.
Recommendation: one @graph per page with stable IDs (#organization, #person, #website); reference via {"@id": ...} for author, publisher and publisher of WebSite; link mainEntityOfPage/isPartOf to WebPage and WebSite nodes.

### F4 MEDIUM: dateModified not visible; several modified dates trivial
Evidence: only one <time> (published) per article and no "Updated" text, so dateModified (airflow-vs-prefect 2026-10-20, 2extract 2026-10-18) has no visible counterpart. mcp-guide dateModified is 3 seconds after datePublished; 20-ai-concepts and fastmcp are identical. Dates lack timezone offsets (2026-09-15T11:29:13). Cheatsheet dates are identical "2026-04-09T00:00:00.000Z" and no date is visible on the page. The latest local commit adds visible updated dates; not live, not observable here.
Recommendation: after deploy confirm visible Updated equals dateModified; add timezone offsets; only bump dateModified for substantive edits.

### F5 MEDIUM: Wrong or noisy articleSection and keywords
Evidence: delta-lake-vs-iceberg articleSection "Airflow"; airflow-vs-prefect keywords include "perfect" (typo, image file is also Airflow-vs-Perfect.jpg); 2extract articleSection "Data Engineer". keywords are raw WordPress tags (data-engineering, ai).
Recommendation: fix category mapping and the tag typo; keep keywords meaningful.

### F6 MEDIUM: SoftwareApplication on the calculator is incomplete
Evidence: has name, applicationCategory, operatingSystem, offers (price 0); lacks aggregateRating or review (Google requires one for the Software App rich result), so no rich result eligibility. name is the SEO title ("... - Free Pricing Estimator"). WebPage block duplicates name and description. Not linked to Organization by @id.
Recommendation: name "Snowflake Cost Calculator"; consider WebApplication; do not fabricate ratings (treat as entity markup only); merge with WebPage in a @graph via mainEntity.

### F7 MEDIUM: FAQPage questions are headings, not questions
Evidence: mcp-guide "What the MCP Server Actually Is?" and "What the MCP Server Doesn't Do (Yet)?"; 2extract "What 2extract actually is, and the one thing it isn't?" and "Where this breaks?". Answer text matches visible page text on every page checked (mcp, airflow, delta, dbt, 2extract, cheatsheet: question and answer start found in body), so there is no content mismatch.
Recommendation: FAQ is restricted (see I1); if retained, rewrite as real questions or drop FAQPage from those pages.

### F8 LOW: Person/Organization details
Evidence: standalone Person lists worksFor "Anblicks" and a "4+ years" description in public markup; confirm this is intended. Organization sameAs contains a personal LinkedIn profile and a GitHub repo, not an organization profile. Article lacks @id, inLanguage, isPartOf.
Recommendation: confirm worksFor intent; add an organization-level profile if one exists; add inLanguage "en".

### F9 LOW: Logo passes
Evidence: logo.png is 250x250 PNG, declared 250x250 (correct; Google minimum 112x112). Home Organization founder Person has no @id link.
Recommendation: acceptable; link via @id.

### F10 LOW: BreadcrumbList
Evidence: valid ListItems with position/name/item on all pages; cheatsheet last item omits "item" (allowed); /cheatsheets returns 200. Breadcrumb names on /about, /certification and the calculator use the long SEO title (for example "About Sainath Reddy - Data Engineer & Technical Writer") rather than short labels. /articles has no breadcrumb.
Recommendation: short labels (About, Certification, Snowflake Cost Calculator); add Home > Articles breadcrumb on /articles.

### F11 LOW: WebSite SearchAction
Evidence: urlTemplate /articles?search={search_term_string} returns 200. Google retired the Sitelinks Search Box, so no rich result effect; harmless.
Recommendation: optional.

### F12 LOW: /about page type
Evidence: generic WebPage; Person block not linked as mainEntity. Schema name is "About Sainath Reddy ..." while H1 is "About DataEngineer Hub".
Recommendation: ProfilePage or AboutPage with mainEntity pointing to the Person @id; align name with H1.

### F13 LOW: /articles CollectionPage is thin
Evidence: no ItemList, no @id, no breadcrumb; description hard-codes "103 ... tutorials".
Recommendation: optional ItemList; keep count dynamic.

### F14 LOW: Cheatsheet Article
Evidence: publisher Organization has no logo; image is the mis-sized og-image.jpg; author inline without @id.
Recommendation: reuse the shared graph; consider TechArticle; show a visible date or drop dates.

### Informational (restricted or deprecated, not errors)
- I1 FAQPage on 5 of 7 articles plus the cheatsheet: Google retired FAQ rich results for all sites (May 7, 2026). No SERP benefit; AI/GEO benefit unconfirmed. Content matches visible text. Info priority.
- I2 HowTo on snowflake-mcp-server-guide (4 steps) and 2extract (6 steps): HowTo rich results removed September 2023. Not an error, but dead weight. 2extract steps are weak: name equals text for step 1, names are lowercase code comments. Recommend removal; do not add HowTo elsewhere.
- I3 JSON-LD is present in raw HTML (server-rendered). Render-time differences were not checked.
- I4 No Review or AggregateRating anywhere (nothing fabricated).

## Scoring rationale
Strong base: valid JSON, https context, absolute URLs, correct breadcrumbs, FAQ text matches visible content, Organization and Person present. Deductions: false image dimensions and undersized images (-8), headline vs H1 (-6), fragmented @id graph (-6), invisible modified dates (-3), wrong articleSection/keywords (-3), SoftwareApplication gaps (-3), HowTo/FAQ residue (-3), minor items (-2). Total 66.

## Priority order
1. Deploy headline = H1 fix. 2. Fix image dimensions and sizes, og-image.jpg. 3. Single @graph with shared @ids. 4. Remove HowTo blocks. 5. Fix articleSection/keywords and visible updated dates.
