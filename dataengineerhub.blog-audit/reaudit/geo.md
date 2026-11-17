# GEO Re-audit: dataengineerhub.blog

Re-audit date: 2026-11-17. Baseline: `plans/GEO-ANALYSIS.md` (2026-11-16, 74/100, one sampled article).
Method: curl only, read-only. Fetched robots.txt, sitemap index and sitemap, homepage, 6 AI discovery files, `/about/`, 20 articles (one of them with 11 different crawler user-agents). All HTML parsed locally from saved copies.

Request budget note: the cap was 50 requests. About 44 deliberate requests were made, but one `curl -L` on `/contributors` hit a redirect loop and followed 50 hops before curl stopped, so the true total was roughly 94 HTTP requests. All were GETs against public pages; no state was changed. The loop itself is a finding (N1 below).

## 1. GEO readiness score: 78/100 (was 74, +4)

Heuristic checklist score, not a predicted citation rate.

| Category | Weight | Baseline | Now | Basis |
|---|---|---|---|---|
| Citability | 25 | 19 | 19 | TL;DR block at top of 11/20 articles, FAQ or "Questions this article answers" in 11/20, specific numbers throughout. Openers are still story hooks, and the dek under the H1 is the 16 to 25 word meta description ("Master...", "Stop..."), not a direct answer |
| Structural readability | 20 | 15 | 15 | 402 H2/H3 in 20 articles, only 11 (2.7%) phrased as questions, concentrated in 3 articles. 12 tables in 9/20 articles (better than baseline implied), but 11/20 have none. Title and H1 differ on 17/20, two with conflicting years |
| Multi-modal | 15 | 9 | 9 | 2 to 10 images per article, 96 code blocks across the sample. 0 video or YouTube embeds in 20 articles |
| Authority and brand | 20 | 13 | 16 | Visible "Updated" dates with `<time>` and `article:modified_time` on 10/20; shared author `@id` on 19/20, publisher `@id` on 20/20; `knowsAbout` added. Still no credential markup, guest-author profile is broken, Organization `sameAs` points at a personal LinkedIn, off-site presence unmeasured |
| Technical accessibility | 20 | 18 | 19 | Every tested crawler UA gets the same 200 server-rendered page; explicit robots groups; homepage SSR leak gone; discovery files valid. Deductions: `/contributors` redirect loop, non-canonical URLs in `llm-sitemap.json` and schema |

## 2. AI crawler access

robots.txt (200, 4,406 bytes, `Last updated: 2026-10-16`). Every AI agent below has its own group with only `Allow: /`. Live test: same article (`/articles/snowflake-mcp-server-guide/`) fetched with each user-agent string.

| User-agent | Governs | robots.txt | Live fetch |
|---|---|---|---|
| OAI-SearchBot | ChatGPT Search citability | Explicit Allow | 200, 85,044 B, full body |
| ChatGPT-User | ChatGPT user-triggered fetch | Explicit Allow | 200, same body |
| GPTBot | OpenAI training only | Explicit Allow | 200, same body |
| Claude-SearchBot | Claude search citability | Explicit Allow (new) | 200, same body |
| Claude-User | Claude user-triggered fetch | Explicit Allow (new) | 200, same body |
| ClaudeBot | Anthropic training only | Explicit Allow | 200, same body |
| PerplexityBot | Perplexity search index | Explicit Allow | 200, same body |
| Perplexity-User | Perplexity user fetch | Explicit Allow | not tested |
| Googlebot | Google Search, AI Overviews, AI Mode | `*` group, Allow | 200, same body |
| Google-Extended | Gemini/Vertex training and grounding; not Search or AIO | Explicit Allow | robots token only, no separate fetcher |
| Bingbot | Bing, Copilot grounding | `*` group, Allow | 200, same body |
| Applebot | Siri, Spotlight, Safari | Explicit Allow (new) | 200, same body |
| Applebot-Extended | Apple Intelligence training only | Explicit Allow (new) | robots token only, no separate fetcher |
| CCBot | Common Crawl (training) | Explicit Allow | 200, same body |
| cohere-ai, Bytespider | Training | Explicit Allow | not tested |

All 11 responses had the same size and word count. They differ only in the Cloudflare ray id inside an injected `/cdn-cgi/challenge-platform/scripts/jsd/main.js` beacon. That script is Cloudflare's JavaScript detection, not an interstitial challenge, and it does not block content. A spoofed user-agent from a laptop still does not prove how Cloudflare treats real bot IP ranges.

Side effect to know about: the named AI groups contain only `Allow: /`, so the `*` group's `Disallow: /api/`, `/admin/`, `/practice/*/q/` and others do not apply to those bots. The same applies to AhrefsBot and SemrushBot, whose groups contain only `Crawl-delay`. This is low impact if those paths are private or noindexed, but it means AI bots may crawl the practice question URLs.

## 3. Discovery files

| File | Status | Sanity |
|---|---|---|
| `/llms.txt` | 200, 5,817 B, text/plain | Valid structure (H1, blockquote, link lists). Links `/about` without the trailing slash (308) |
| `/llms-full.txt` | 200, 101,190 B | "Last generated: 2026-11-16, Total articles: 103" |
| `/llm-sitemap.json` | 200, 137,196 B, valid JSON | `lastUpdated 2026-11-16`, 103 pages, matching the 103 article URLs in `sitemap.xml`. Every URL lacks the trailing slash and 308-redirects to the canonical |
| `/.well-known/ai-catalog.json` | 200, 1,911 B, valid JSON | specVersion 1.0, 4+ entries pointing at llm-sitemap, api-catalog, agent skill, auth.md |
| `/auth.md` | 200, 2,504 B, text/markdown | Public GET, no registration; consistent with robots |
| `/openapi.json` | 200, 5,004 B, valid JSON | `openapi`, `info`, `servers`, `paths` present |

Homepage also sends a `Link` header for api-catalog, service-desc, service-doc and describedby. As in the baseline, these files carry no score weight: Google says llms.txt neither helps nor hurts Search, and no major AI provider has confirmed using it.

## 4. Content-Signal and robots meta

No conflict. `content-signal: search=yes, ai-input=yes, ai-train=yes` appears in robots.txt and as a response header on every fetched article and discovery file. All 20 articles carry `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` and send no `X-Robots-Tag`. Homepage meta is `index, follow, max-image-preview:large` (no snippet limit, which is fine). Noindexed sections such as `/contributors` send `X-Robots-Tag: noindex, follow` alongside `search=yes`. These do not contradict each other: Content-Signal grants permission and noindex is a page-level directive.

## 5. Baseline findings: status

| # | Baseline finding | Status | Evidence |
|---|---|---|---|
| B1 | Claude-SearchBot not named, relied on `*` | Fixed | Own group `Allow: /`; live 200 |
| B2 | Claude-User not named | Fixed | Own group; live 200 |
| B3 | Applebot / Applebot-Extended not named, not tested | Fixed | Both named with comment explaining the split; Applebot live 200 |
| B4 | Googlebot, CCBot not live-tested | Fixed (verified) | Both 200, identical body; Bingbot also 200 |
| B5 | Legacy `anthropic-ai`, `Claude-Web` groups | Not fixed (harmless) | Still present. Cosmetic only |
| B6 | Verify Cloudflare AI Crawl Control against real bot IPs | Not verifiable externally | Cloudflare JS detection beacon is injected into bot responses, so bot management is active. Confirm in the dashboard and in server logs for OAI-SearchBot, Claude-SearchBot and PerplexityBot |
| B7 | Content-Signal allows training; confirm intent | Unchanged, consistent | Same signal in robots, headers, and auth.md; no conflict with robots meta |
| B8 | llms.txt and related files present | Still present, valid | See section 3; counts match sitemap (103) |
| B9 | Homepage HTML contained "tag during SSR pre-rendering" | Fixed | 0 occurrences of "pre-render" in homepage HTML |
| B10 | SSR check | Pass, wider sample | 20/20 articles and the homepage have full body text, headings, and JSON-LD in raw HTML (1,114 to 4,656 words in `<article>`). Homepage 1,305 words, H1 and 3 H2 |
| B11 | No visible updated date; dateModified 3 s after datePublished | Fixed | 10/20 show "Updated <date>" next to the published date, with two `<time datetime>` elements and `article:modified_time`. The other 10 have dateModified within seconds of datePublished and correctly show no update line. The MCP article still has a +3 s dateModified, which is fine if facts have not changed |
| B12 | Zero tables in the MCP article; add comparison tables | Not fixed | MCP article still has 0 tables ("Five Tool Types" is still five H3s). Across 20 articles: 12 tables in 9; 11 articles have none, including duckdb-vs-spark, medallion, how-snowflake-stores-data, cost-optimization (3,549 words, 0 tables) |
| B13 | H1 and `<title>` mismatch on the MCP article | Not fixed, and wider | MCP: title "Build a Snowflake MCP Server: Complete Tutorial" vs H1 "Using MCP Servers with Snowflake: A Practitioner's Guide". 17/20 differ. Year conflicts: dynamic-tables (title "2026 Guide", H1 "2025 Guide"), native-dbt (title "2026 Setup Guide", H1 "Complete 2025 Guide") |
| B14 | H2s descriptive, not question-shaped | Not fixed | 11 of 402 H2/H3 end in "?", in only 3 articles (delta-lake 6, incremental 4, native-dbt 1). Interview-questions article: 36 headings, 0 ending in "?" |
| B15 | Open with a 40 to 60 word direct answer | Partly | 11/20 have a TL;DR or Key Takeaways block at 1 to 2% of page depth, which works as an answer block. But the visible dek under every H1 is the meta description (16 to 25 words of promotional copy), and the first prose paragraph is a story hook in most articles ("3:14 a.m., and a migration script...", "A colleague pinged me last spring..."). Two articles (incremental, cortex-sense) show the dek truncated with "..." and then repeat the same sentence as the first paragraph |
| B16 | `mainEntityOfPage` and `image` on Article | Fixed (confirmed) | 20/20 have both |
| B17 | Add `knowsAbout` and `hasCredential` (SnowPro) on Person | Partly | `knowsAbout` present. No `hasCredential` or `alumniOf` anywhere. llms.txt says "SnowPro certified", but `/about/` HTML has 0 mentions of SnowPro. The `#author` node also has two different `knowsAbout` lists: 7 items inline under Article.author, 10 in the standalone Person node |
| B18 | Shared author/publisher identity | Fixed | Author `@id https://dataengineerhub.blog/#author` on 19/20 (the 20th is a guest post), publisher `@id #organization` on 20/20, the same Person node on `/about/` |
| B19 | "Last tested on <version/date>" for code-heavy tutorials | Not fixed | 0/20 articles contain a last-tested or verified-against line; 96 code blocks in the sample |
| B20 | Off-site entity presence (YouTube, Reddit, Wikipedia/Wikidata) | Not measured | No DataForSEO tools available. 0 YouTube embeds in 20 articles |
| B21 | Search Console generative AI control, Bing Webmaster/IndexNow | Not verifiable externally | Needs dashboard access |
| B22 | Paragraph length 2 to 4 sentences | Holding | Median paragraph 17 to 79 words per article; long-paragraph outliers mainly in medallion (median 79) and the MCP article (67) |

## 6. New findings

| ID | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| N1 | High | `/contributors` is a redirect loop, so the guest author's profile link is dead | `/contributors` 308 to `/contributors/`, which 301s back to `/contributors` (50 hops, both with `X-Robots-Tag: noindex, follow`). The guest article's author URL `/contributors/praparna-moharana` 301s into the loop. Users and crawlers following the byline get an error | Make one form canonical (trailing slash, matching the rest of the site) and drop the opposite redirect. Either give the contributor a real profile page or point `author.url` at a working URL |
| N2 | Medium | Guest-author entity is thin | Article.author on the incremental-processing article is a Person with name, url, and description but no `@id`, no `sameAs`, and no standalone Person node. Profile URL is broken (N1) | Add `@id` (for example `/contributors/<slug>/#person`) and the contributor's LinkedIn in `sameAs` |
| N3 | Medium | Credential claim not backed on-site | llms.txt: "SnowPro certified". `/about/` and its Person schema: no SnowPro mention, no `hasCredential` | Add the credential, with a verification link, to `/about/` and `hasCredential` (EducationalOccupationalCredential), or remove the claim from llms.txt. Do not add it unless true |
| N4 | Medium | Stale 2025 articles carry "2025" framing | 5/20 sampled have last dateModified in Oct 2025 (load-data, star-schema, merge, native-dbt, dynamic-tables). Bodies say "as of 2025" and "In 2025, Snowflake Dynamic Tables have become...". Titles say 2026 while H1s say 2025 | Refresh facts and make H1 and title agree, or drop years from both. Update dateModified only when the content changes |
| N5 | Low | Organization `sameAs` points at the person's LinkedIn and a personal GitHub repo | `#organization` sameAs = `linkedin.com/in/sainathreddypogaku/`, `github.com/sainath-reddiee/dataengineer`. This conflates the publisher with the person | Keep those on Person only. Give the Organization its own profiles (for example a LinkedIn company page) or omit `sameAs` |
| N6 | Low | Non-canonical URLs in machine-readable files | `llm-sitemap.json` (103 URLs), llms.txt `/about` link, and Person `url` `https://dataengineerhub.blog/about` all lack the trailing slash and 308 to the canonical | Emit trailing-slash URLs matching `<link rel=canonical>` and sitemap.xml |
| N7 | Low | Structure-poor legacy article | star-schema-vs-snowflake-schema (1,243 words) has 1 H2 and 1 H3. Its section headings are `<p><strong>` (7), so there are no extractable section boundaries | Convert the bold paragraphs to H2/H3 |
| N8 | Low | Named AI groups bypass `*` disallows | See section 2 | If `/practice/*/q/` and `/api/` should stay uncrawled, repeat those Disallow lines in the AI groups (watch the robots.txt size, not the `_headers` limit) |
| N9 | Info | Inconsistent `knowsAbout` on the same `@id` | 7-item list inline vs 10-item list on the standalone Person | Generate both from one source list |

## 7. Platform view (qualitative, not measured with a tool)

| Platform | Readiness | Main limiter |
|---|---|---|
| Google AI Overviews / AI Mode | 75 | Indexable SSR pages with dates and author. Limited by ranking strength, few question headings, and title/H1 drift |
| ChatGPT Search | 80 | OAI-SearchBot allowed, full HTML. Bing index strength and off-site mentions are unmeasured |
| Perplexity | 78 | PerplexityBot allowed; TL;DR and FAQ blocks are extractable. Reddit and community presence unmeasured |
| Bing Copilot | 75 | Bingbot 200. IndexNow and Bing Webmaster Tools status not checked |

## 8. Top 5 remaining changes

1. Fix the `/contributors` redirect loop and the guest author URL (N1, N2). Effort: under 1 hour in the redirect rules or `_redirects`/`_headers`. Removes a live dead end on an article byline.
2. Replace the meta-description dek under each H1 with a 40 to 60 word direct answer ("X is... Use it when...") on the top 20 articles, and stop repeating a truncated first paragraph as the dek (B15). Effort: WordPress content, about 10 minutes per article.
3. Add one comparison table per article where content is already comparative, starting with the 11 without tables, and convert 2 to 3 H2s per article to the question a reader would type, starting with the interview-questions article (B12, B14). Effort: 15 to 30 minutes per article.
4. Align `<title>` and H1 on all articles and resolve the 2025 vs 2026 conflicts. Refresh the five Oct 2025 articles' facts before changing their dates (B13, N4). Effort: 1 to 2 hours for titles, plus content time for refreshes.
5. Back the authority claims: add the SnowPro credential to `/about/` with `hasCredential` if true, separate Organization `sameAs` from the Person, unify `knowsAbout`, and fix the trailing-slash URLs in llm-sitemap and schema (N3, N5, N6, N9). Effort: 1 to 2 hours in the prerender and schema generators.

Ongoing, not scored here: YouTube walkthroughs for flagship articles and genuine Reddit/community participation remain the largest unmeasured lever, according to third-party correlational data.

## 9. Not verified

Real-IP crawler treatment by Cloudflare; Search Console and Bing Webmaster settings; brand mention counts and live AI citation presence; Perplexity-User, cohere-ai, Bytespider live fetches; the other 83 articles beyond the 20 sampled; whether `llms-full.txt` text matches current article bodies.

## 10. AI Search Readiness findings (JSON-compatible)

```json
{
  "category": "AI Search Readiness",
  "score": 78,
  "baseline_score": 74,
  "breakdown": {"citability": 19, "structure": 15, "multimodal": 9, "authority": 16, "technical": 19},
  "findings": [
    {"id": "N1", "severity": "high", "title": "/contributors redirect loop breaks guest author profile", "status": "new"},
    {"id": "B15", "severity": "medium", "title": "Dek is meta description, openers are story hooks", "status": "partly"},
    {"id": "B12", "severity": "medium", "title": "11/20 articles have no tables", "status": "not_fixed"},
    {"id": "B14", "severity": "medium", "title": "11/402 headings are questions", "status": "not_fixed"},
    {"id": "B13", "severity": "medium", "title": "Title/H1 differ on 17/20, two year conflicts", "status": "not_fixed"},
    {"id": "N3", "severity": "medium", "title": "SnowPro claim in llms.txt not backed on /about/ or hasCredential", "status": "new"},
    {"id": "N4", "severity": "medium", "title": "Five sampled 2025 articles last modified Oct 2025 with 2025 framing", "status": "new"},
    {"id": "N2", "severity": "medium", "title": "Guest author Person lacks @id and sameAs", "status": "new"},
    {"id": "N5", "severity": "low", "title": "Organization sameAs points to personal profiles", "status": "new"},
    {"id": "N6", "severity": "low", "title": "llm-sitemap/schema URLs lack trailing slash (308)", "status": "new"},
    {"id": "N7", "severity": "low", "title": "star-schema article uses bold paragraphs instead of headings", "status": "new"},
    {"id": "N8", "severity": "low", "title": "Named AI robots groups bypass * disallows", "status": "new"},
    {"id": "B1-B4", "severity": "info", "title": "Claude-SearchBot, Claude-User, Applebot named; all tested UAs 200", "status": "fixed"},
    {"id": "B9", "severity": "info", "title": "Homepage SSR string leak", "status": "fixed"},
    {"id": "B11", "severity": "info", "title": "Visible Updated dates on 10/20", "status": "fixed"},
    {"id": "B18", "severity": "info", "title": "Shared author/publisher @id", "status": "fixed"}
  ]
}
```
