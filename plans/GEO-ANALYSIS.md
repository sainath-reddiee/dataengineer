# GEO Analysis: dataengineerhub.blog

Audit date: 2026-11-16. Scope: homepage, robots.txt, llms.txt, sitemap, AI catalog, one sampled article (`/articles/snowflake-mcp-server-guide`). A full crawl and live citation tests were not run.

## 1. GEO Readiness Score: 74/100 (heuristic checklist, not a predicted citation rate)

| Category | Weight | Score | Basis |
|---|---|---|---|
| Citability | 25 | 19 | Specific, practitioner-voice content; FAQ blocks; no tables |
| Structural readability | 20 | 15 | Clean H1/H2/H3; 0 tables in sampled article |
| Multi-modal | 15 | 9 | 5 images, 4 code blocks, calculators; no video found |
| Authority and brand | 20 | 13 | Person schema and sameAs present; no visible updated date, dateModified equals datePublished |
| Technical accessibility | 20 | 18 | Pre-rendered HTML, all bots get 200, open robots |

## 2. Platform breakdown (qualitative, not measured with a tool)

- Google AI Overviews and AI Mode: ready on fundamentals (indexable, canonical, Article schema, `max-image-preview:large`). Ranking strength is the limiter, not markup. Check the Search Console "Search generative AI" control is on include or inherit.
- ChatGPT Search: no blockers. OAI-SearchBot is allowed.
- Perplexity: no blockers. Reddit and community presence is the unmeasured gap.
- Bing Copilot: sitemap is fine; IndexNow and Bing Webmaster Tools status were not checked.

## 3. AI crawler access (per user-agent, per capability)

| User-agent | Governs | robots.txt | Live fetch |
|---|---|---|---|
| OAI-SearchBot | ChatGPT Search citability | Allow | 200 |
| GPTBot | OpenAI training | Allow | 200 |
| Claude-SearchBot | Claude search citability | Not named, falls to `*` Allow | 200 |
| ClaudeBot | Anthropic training | Allow | 200 |
| PerplexityBot | Perplexity search | Allow | 200 |
| Googlebot | Search, AI Overviews, AI Mode | `*` Allow | not tested |
| Google-Extended | Gemini and Vertex training and grounding, not Search | Allow | 200 |
| Applebot / Applebot-Extended | Apple search / Apple training opt-out | Not named, falls to `*` Allow | not tested |
| CCBot, Bytespider, cohere-ai | Training | Allow | not tested |

Notes:
- The site allows training and search on purpose (`Content-Signal: search=yes, ai-input=yes, ai-train=yes`). That is a licensing choice, not a visibility requirement. Confirm it is intended.
- `anthropic-ai` and `Claude-Web` rules are legacy names; harmless but Anthropic's current docs list only ClaudeBot, Claude-User and Claude-SearchBot. Adding explicit `Claude-SearchBot` and `Claude-User` Allow groups makes intent unambiguous.
- The robots.txt header warns that Cloudflare AI Crawl Control can prepend Disallow rules. Live fetches with bot user-agents returned 200, but user-agent spoofing from a laptop does not prove Cloudflare treats real bot IPs the same. Verify in the Cloudflare dashboard.
- robots.txt lists `sitemap-index.xml` (200). `sitemap_index.xml` returns 404, which is fine.

## 4. llms.txt status

Present (5.8 KB), plus `llms-full.txt` (106 KB) and `llm-sitemap.json` (138 KB). Also present: `/.well-known/ai-catalog.json`, `auth.md`, `openapi.json`. Reported for completeness only. Google states llms.txt neither helps nor hurts Search, and no major AI provider has confirmed using it. No score weight, and no further investment recommended.

## 5. Brand mention analysis

Not measured (needs DataForSEO or manual search). On-site entity signals are good: Person and Organization schema with LinkedIn and GitHub sameAs, author named consistently. Not verified: YouTube, Reddit, Wikipedia or Wikidata presence. This is the likeliest gap given the Ahrefs correlation data (third-party, correlational).

## 6. Passage-level citability

Strengths in the sampled article (2,880 words, 7 H2, 10 H3, 42 paragraphs): practitioner framing ("gotchas nobody warns you about", "what it doesn't do yet"), a "Questions this article answers" FAQ block, HowTo and FAQPage schema. Weaknesses:
- Zero HTML tables. Comparison content (the "five tool types", setup options) is the best candidate for a table.
- H1 ("Using MCP Servers with Snowflake: A Practitioner's Guide") and `<title>` ("Build a Snowflake MCP Server: Complete Tutorial") say different things. Align them so the page has one clear topic.
- H2s are descriptive rather than question-shaped. The FAQ section covers questions, but only one section.

## 7. Server-side rendering check

Pass. Article HTML (85 KB) contains full body text, headings, code and JSON-LD without JavaScript, served to a GPTBot user-agent. Homepage has H1, 3 H2, canonical and indexable robots meta. One oddity: the homepage HTML contains the literal text "tag during SSR pre-rendering" near a `<title>` mention, which looks like a comment or script string leaking into markup. Worth a quick look in the prerender script to make sure it is not rendered content.

## 8. Top 5 highest-impact changes

1. Show and maintain real "Last updated" dates. Sampled article has `dateModified` 3 seconds after `datePublished` and no visible updated line. Update `dateModified` only when facts change, and display it. Highest recency and trust payoff for the cost.
2. Add comparison tables to the top 15 to 20 articles (tool types, cost tiers, feature matrices). Structured data in prose is the cheapest citability gain.
3. Align H1 and `<title>` per article, and convert 2 to 3 H2s per article to question form that matches real queries.
4. Build off-site entity presence: a YouTube walkthrough per flagship article, genuine answers on r/dataengineering and Snowflake community, LinkedIn posts linking to the author profile. Do not mention-farm; Google rejects it.
5. Verify Cloudflare AI Crawl Control and bot-management settings against real bot traffic (server logs for OAI-SearchBot, Claude-SearchBot, PerplexityBot), and confirm the Search Console generative AI control.

## 9. Schema recommendations

Already strong: Article, BreadcrumbList, FAQPage, HowTo, Organization, Person. Suggestions:
- Add `mainEntityOfPage` and `image` on Article if missing (not checked).
- Add `reviewedBy` or a short "Technical review" line only if it is true; do not invent.
- Keep FAQPage content aligned with visible text. FAQ rich results are restricted for most sites, so treat it as machine-readable context, not a SERP feature.
- Add `knowsAbout` and `alumniOf`/`hasCredential` (SnowPro) on Person to back the credential claims in llms.txt.

## 10. Content reformatting suggestions

- Open each article with a 40 to 60 word direct answer ("X is ...") before the narrative. Lead the most quotable passage in the first 30 percent of the page.
- Turn the "Five Tool Types" section into a table: tool, purpose, auth needed, example call.
- Add a short "Last tested on <version/date>" line to code-heavy tutorials; code and version drift is where AI answers get stale.
- Keep paragraphs to 2 to 4 sentences; the sampled page is mostly there already.

## Not verified

Googlebot, Applebot and CCBot live fetches; Core Web Vitals; brand mention counts; actual AI citation presence for target queries; sitemap URL-level health beyond the 127 entries listed; whether `llms-full.txt` content matches current articles.
