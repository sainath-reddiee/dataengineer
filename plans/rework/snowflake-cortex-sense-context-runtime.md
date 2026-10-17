# Snowflake Cortex Sense: The Context Runtime Agents Have Been Missing

> **Editor notes**
>
> - Changed: removed the 8-bullet TL;DR and replaced it with a short intro; removed nearly all em-dashes and the arrow characters in the plugin list; turned the bold pseudo-headings in "The Gotchas" into `###` subsections and grouped the FAQ questions as `###` headings; added alt text to the four images (all had empty alt); cut repetition (see below). No new claims, numbers or experiences added. Length is down from about 3,270 to about 2,780 words, mostly from the TL;DR and the FAQ.
> - Cut: the TL;DR (every point is repeated in the body). Shortened the FAQ answers to two or three sentences each, because they restated the body almost word for word. Removed one repeated sentence in "Private preview access" about semantic view work being valuable regardless (already said in "What to build before GA").
> - The post has no first-hand material. It reads as a careful analysis of the announcement, which is fine, but the three markers below are where your own work would make it stand out from the many Summit recap posts on the same topic.
> - Error in the example: with a fiscal year starting in February, fiscal Q3 runs August to October, not "May through July" (that would be fiscal Q2). Please fix the month range in "The core problem" section; I left your wording as is.
> - Facts to check (this feature was announced after most public documentation I can check, so treat all of these as unverified):
>   - Announcement date (Summit, 2 June 2026), private preview status, and "no GA date or public waitlist as of September 2026". It is now October 2026, so re-check the status and update the "As of" dates.
>   - The 47% / 83% / 86% accuracy figures and their source. The body says they are Snowflake's own benchmarks, but the stat-card image credits the 86% figure to SiliconANGLE coverage of the keynote. Link the primary source for each number. The bar heights in the accuracy chart image also don't match the labels (the 83% bar is drawn below 80%).
>   - "Four signal types": the architecture image shows five sources (agent skills drawn separately), and the body folds agent skills into signal 4. Make the count consistent.
>   - Semantic View Autopilot "GA as of Snowflake Summit 2026": Snowflake's Horizon Context product page does not clearly mark it GA.
>   - Horizon Context "Wave 1 connectors" for Tableau and Power BI: the product page marks the Power BI connector as private preview.
>   - Product names CoWork, CoCo, Horizon Context, and the finance and sales plugin contents (ARR, MRR, quota attainment, Salesforce MCP connector, CoWork user memory).
>   - "This failure pattern... is responsible for more enterprise AI pilot cancellations than any model quality issue" has no source. Either cite one or soften it to your opinion.
> - Other: the closing "One Principle" quote has quotation marks but no attribution. If it is your own line, drop the quote marks; if it is from Snowflake, attribute it. The link labelled "Cortex Analyst's query history data" points to the Cortex token usage monitoring post; check that is the intended target.

This post is for data engineers and analytics leads who run AI agents on Snowflake and want to understand Cortex Sense, the context layer Snowflake announced at Summit 2026. It covers the problem Sense is meant to solve, the signals it reads, how it relates to Horizon Context, what the published accuracy numbers do and don't tell you, and what to build now while it is in private preview.

## The problem: agents know the schema, not the meaning

Every enterprise AI pilot eventually hits the same wall. The demo worked because it ran on curated, well-described data in a controlled environment. Production is different. Production data has column names like `rev_adj_v3_final`, metric definitions that exist only in the head of the analyst who built the original dashboard in 2019, and a fiscal calendar that starts in February but is never documented anywhere a language model can find it.

Someone asks a Snowflake AI agent whether Q3 ACV was up. The agent queries the raw column and returns a number. The number is confidently wrong, because ACV at this company excludes free-tier activity and counts from a February fiscal year start, rules the agent can't know from the schema alone. That wrong number goes into a board deck, and the pilot gets cancelled. The model didn't fail; the data infrastructure under it provided no business context.

![Three stat cards: 47% accuracy for a frontier model on enterprise queries with raw schema only, 83% with the Cortex Sense context runtime enabled, and 86% with Cortex Sense plus Horizon Context semantic views](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/10/image-1024x271.png?resize=1024%2C271&ssl=1)

A well-designed Snowflake schema is a technical artifact. Column names are identifiers and table relationships are join keys. The business meaning (what counts as a conversion, which transactions are excluded from revenue, how the fiscal calendar maps to calendar quarters) lives everywhere except the schema: in analyst documentation, in the heads of the people who built the original models, in BI tool definitions nobody exported, and in a Slack thread from 2021 where someone explained why the `mrr_adjusted` column excludes trial customers.

Without that context, an agent reasons from structure alone. It sees a column called `acv`, knows it's numeric, and sums it for Q3 dates based on the table's date column. Every step is technically correct. The answer is wrong because ACV at your company excludes free-tier, and your fiscal Q3 runs May through July, not July through September.

![Side-by-side flow for the question "Was Q3 ACV up?": without Cortex Sense the agent queries the raw column and reports ACV up 12%; with Cortex Sense the runtime applies the February fiscal calendar and free-tier exclusion and reports ACV down 3%](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/10/cortex_sense_without_vs_with-1024x477.png?resize=1024%2C477&ssl=1)

This failure pattern, a confident wrong answer from an agent reasoning correctly from inadequate context, is responsible for more enterprise AI pilot cancellations than any model quality issue. The model didn't hallucinate; it had no business semantics to reason from.

**Snowflake Cortex Sense** is Snowflake's answer to that failure mode. It was announced at Snowflake Summit 2026 on June 2 and is in private preview. It is not a new agent interface or a new model. It is a runtime context layer that automatically assembles business definitions, metric logic, analyst patterns and governance metadata from your Snowflake account, and hands that context to AI agents before they run a single query. Both of Snowflake's AI surfaces, CoWork and CoCo, read from it automatically.

## How Cortex Sense works: four signal types

Cortex Sense is not a one-off configuration step. It is a runtime that continuously reads from four signal types already in your account and assembles the most relevant context at query time, based on what the agent is asking.

![Cortex Sense architecture: signal sources (semantic views, query history, BI dashboards, object metadata and agent skills) feed a context assembly runtime with a self-correcting loop, which serves CoWork, CoCo and Cortex Agents](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/10/cortex_sense_architecture.png?resize=1022%2C504&ssl=1)

### Signal 1: Horizon Context semantic views

This is the highest-quality signal. [Semantic views in Snowflake Horizon Context](https://www.snowflake.com/en/product/features/horizon-context/) are governed, version-controlled SQL objects that encode business definitions: what a metric means, how dimensions relate, and which filters apply to a calculation. If you define `quarterly_acv` in a semantic view with the fiscal calendar offset and the free-tier exclusion, Cortex Sense can retrieve that definition at runtime and apply it before the agent writes a query.

The accuracy data shows this dependency. Cortex Sense alone (drawing on query history, metadata and agent skills) lifts accuracy from 47% to 83%. With full Horizon Context semantic views it reaches 86%. The three-point gap is the contribution of governed semantic definitions: small in absolute terms, but it matters for exactly the questions where a precise business definition decides whether the answer is right.

### Signal 2: query history

Cortex Sense reads the history of SQL run in your account, from analysts, scheduled jobs and BI extracts. In most data teams this is where institutional knowledge actually lives. A rule like "always filter out `account_type = 'trial'` when summing revenue" may never be documented, but it appears in thousands of queries. Cortex Sense extracts that pattern and uses it in the context it builds for future agent queries.

### Signal 3: BI dashboard definitions

Tableau and Power BI dashboards encode business definitions in calculated fields, measures and filters. A Tableau calculated field for "Adjusted Revenue" may hold years of business rules that nobody has moved into a semantic layer. Horizon Context's Wave 1 connectors bring those definitions into Snowflake's catalog, and Cortex Sense reads them at query time. This means Sense can start from business context that predates Snowflake's semantic layer, captured from the BI tools where it already lives.

### Signal 4: object metadata and agent skills

Object metadata covers lineage, tags, ownership, quality scores, column descriptions, and governance classifications from [masking policies](https://dataengineerhub.blog/articles/snowflake-dynamic-data-masking-row-access-policies) and [MCP-connected context](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide). It adds operational signal about the data. For example, an agent asked about customer revenue benefits from knowing that the `customer_revenue` table has a quality score of 99.2%, was last updated 2 hours ago, and is owned by the finance data team. That shapes how the agent interprets and presents its answer.

Agent skills add learned behavior. As CoCo and CoWork run tasks, Cortex Sense records what worked (which context made answers accurate, which tool calls resolved ambiguous questions) and uses those patterns in future context assembly.

## When definitions conflict: the self-correcting loop

Teams often calculate the same metric differently. Product's "daily active users" counts any login; finance's excludes support sessions. Both definitions appear in query history, BI dashboards and semantic views, and they conflict.

According to Snowflake's Summit description, Cortex Sense detects these conflicts and, instead of silently picking one, asks a designated stakeholder to settle the definition. It then updates its understanding for all future queries. This matters architecturally: deploying agents becomes a forcing function for resolving definition disagreements that have always existed in enterprise data but that traditional BI tools never surfaced.

**Practical implication:** teams with clean, agreed metric definitions in semantic views will see Cortex Sense reach its full accuracy straight away. Teams with contested or undocumented metrics will see Sense surface those conflicts as a first deployment step. That is a feature, not a bug, but plan time for the resolution process.

## What the accuracy numbers mean

![Bar chart of Cortex Sense accuracy on enterprise structured query tasks: 47% for the frontier model alone, 83% with Cortex Sense (+36 points), and 86% with Horizon Context added (+3 points)](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/10/cortex_sense_accuracy-1024x489.png?resize=1024%2C489&ssl=1)

The 47% baseline is frontier model accuracy on enterprise structured query tasks. These are not simple SQL lookups but questions that need business definitions, fiscal calendars, segment exclusions and multi-table joins with the right business logic. It is not a contrived benchmark; it's the kind of question CoWork users ask every day.

The jump to 83% with Cortex Sense, and 86% with full Horizon Context coverage, is a qualitative shift: from "the agent sometimes gets this right" to "the agent consistently gets this right when business context is the deciding factor". The remaining 14 to 17% of failures are harder problems: cross-system queries, novel metric combinations, and questions where no existing signal covers the business logic needed.

## Cortex Sense vs Horizon Context

| Dimension | Horizon Context | Cortex Sense |
|---|---|---|
| What it is | Static store of governed business definitions | Dynamic runtime that assembles context at query time |
| Input | Data team authoring semantic views, connecting BI tools | Reads from Horizon Context + query history + metadata + agent skills |
| When it acts | At definition time: you build it once, update when logic changes | At query time: assembled fresh for every agent invocation |
| Who maintains it | Data team / analytics engineers via Semantic Views | Snowflake manages the runtime; self-updates from signals |
| Manual configuration? | Yes: semantic views must be authored or auto-generated | No: bootstraps from existing account signals |
| Conflict handling | None: definitions are whatever you authored | Detects conflicts, surfaces for human resolution |
| Without the other | Works (Cortex agents read semantic views directly) | Works at 83%; reaches 86% when Horizon Context is rich |

You don't choose one. Horizon Context is where your data team encodes business definitions; Cortex Sense makes them available to agents at runtime, alongside what it reads from query history and metadata. *Build Horizon Context to improve what Cortex Sense has to work with.*

## The prebuilt domain plugins

One of the more immediately practical parts of the announcement is the prebuilt plugins for finance and sales. Each bundles:

- domain-specific skills (what the agent knows how to do in that function)
- business logic for common finance or sales definitions (ARR, MRR, pipeline stage conventions, quota attainment)
- MCP connectors for the tools those teams use (Salesforce for sales, ERP integrations for finance)
- CoWork integration with user memory, so the agent learns individual users' preferences over sessions

A sales leader can deploy a working CoWork agent for their team without a data engineer spending weeks configuring CRM definitions, pipeline stage logic and quota rules from scratch. The plugin is a starting template; the data team refines it for company-specific definitions.

This matters for adoption. The recurring complaint about enterprise AI isn't model quality, it's time to value. A pilot that needs six weeks of semantic layer work before the agent gives useful answers doesn't survive budget cycles. A plugin that makes an agent 80% useful on day one, with the remaining 20% improved through semantic view refinement, changes the deployment economics.

## What to build before Cortex Sense goes GA

Cortex Sense is in private preview with no announced GA date. The work needed to get full value from it is work your data team should be doing anyway, because the context Sense can assemble depends directly on how well your semantic layer is built. In priority order:

### 1. Audit your semantic view coverage

Which metrics appear in your most-queried dashboards and reports, and which of those have formal semantic view definitions in Horizon Catalog? The gap between "metrics that matter to the business" and "metrics with semantic view definitions" is exactly the gap Cortex Sense will struggle to fill. Use [Cortex Analyst's query history data](https://dataengineerhub.blog/articles/snowflake-cortex-token-usage-monitoring) to find the most-asked questions; those are your first semantic view candidates.

[ADD YOUR OWN: the query you would use (or have used) to list the most-queried tables or metrics in your account from query history, with a redacted sample of the result]

### 2. Use Semantic View Autopilot for the first 80%

Semantic View Autopilot (GA as of Snowflake Summit 2026) generates semantic view definitions from your existing SQL files, Tableau workbooks or Power BI reports. It isn't perfect, but it covers the mechanical 80%: metric definitions that translate directly from existing analytical logic. Data engineers refine the remaining 20%, where business context needs judgment.

[ADD YOUR OWN: if you have run Autopilot on one of your own SQL files or workbooks, a screenshot of the generated semantic view and a note on what you had to correct by hand]

### 3. Resolve definition conflicts now

Find the metrics that different teams define differently. If daily active users is calculated three ways across three dashboards, agree on the canonical definition before Cortex Sense raises the conflict at query time. It's easier to settle in a planned discussion than in response to an agent giving different users different answers to the same question.

[ADD YOUR OWN: a real (anonymized) example of a metric you have seen defined two different ways, and how the teams settled it, or why they never did]

### 4. Connect your BI tools through Horizon Context

Horizon Context's Wave 1 connectors cover Tableau and Power BI. If your analytical logic lives mainly in one of these, connecting it now enriches what Cortex Sense can draw on, even before your semantic view coverage is complete. BI-derived definitions are a legitimate way to bootstrap the context runtime.

## The gotchas

### Cortex Sense only covers Snowflake

Cortex Sense draws on signals inside your Snowflake account. If your estate spans Snowflake, Databricks, [dbt projects](https://docs.snowflake.com/en/user-guide/data-engineering/dbt-projects-on-snowflake), external APIs and Salesforce, Sense builds context for the Snowflake part only. Agents that need to reason across several systems need a separate enterprise context layer (Atlan, DataHub or similar) to combine Snowflake context with other signals. The two are additive, not competing.

### The accuracy numbers are Snowflake's own benchmarks

The 83% and 86% figures come from Snowflake's internal testing on enterprise structured query benchmarks. Your results will depend on your semantic view coverage, the quality of your query history as a signal, and how complex your business logic is. Teams with well-maintained semantic layers and rich query history will likely see results near the published numbers. Teams with sparse metadata and no semantic views will see smaller gains, and that gap shows where to invest in the semantic layer.

### It learns your team's antipatterns too

If analysts have been applying the wrong filters, joining on the wrong conditions or calculating metrics incorrectly, Cortex Sense will pick up those patterns alongside the correct ones. The self-correcting loop surfaces conflicts, but it can't tell "this pattern is common" from "this pattern is correct" without a governing semantic view to decide. Semantic views are not optional for good context; they are what validates what Sense learns from behavior.

### Private preview is invitation-only

As of September 2026, Cortex Sense is still in private preview, and Snowflake has not published a GA date or a public waitlist. Teams that want early access should talk to their Snowflake account executive.

## The one principle

> "The model is not your competitive advantage. The context layer is. Cortex Sense is Snowflake's infrastructure bet that governed semantic definitions, assembled at runtime, are more valuable than any individual model improvement."

## FAQ

### What is Snowflake Cortex Sense?

A runtime context layer announced at Snowflake Summit 2026 on June 2. It builds context from four signal types (Horizon Context semantic views, query history, BI dashboard definitions and object metadata) and gives it to AI agents (CoWork and CoCo) at query time, without manual configuration. In Snowflake's testing it lifted accuracy on enterprise structured query benchmarks from 47% to 83 to 86%.

### How is Cortex Sense different from Horizon Context?

Horizon Context is the static store where business definitions live. Cortex Sense is the runtime that assembles context from Horizon Context and other signals at query time. Sense alone reaches about 83%; with rich Horizon Context coverage it reaches about 86%.

### Does Cortex Sense need manual configuration?

No. It reads signals already in your account. How good its context is depends on your semantic views, query history and metadata, so the preparation work is building the semantic layer, not configuring Sense.

### What happens when it finds conflicting definitions?

It surfaces the conflict to a designated stakeholder instead of picking one, then updates its understanding for future queries once the definition is settled.

### Is Cortex Sense available now?

It is in private preview as of September 2026, with no public waitlist or GA date. Contact your Snowflake account executive to ask for access, and use the time to build semantic views, connect BI tools through Horizon Context and resolve metric conflicts.

### What are the prebuilt domain plugins?

Finance and sales plugins that bundle domain skills, prebuilt business logic (ARR, pipeline stages, quota attainment) and MCP connectors (Salesforce for sales, ERP integrations for finance), so a team can start a CoWork agent from a template instead of from scratch.

**Related reading:** [Using MCP Servers with Snowflake](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide) · [Cortex AI token usage monitoring](https://dataengineerhub.blog/articles/snowflake-cortex-token-usage-monitoring) · [Hidden Cortex AI token costs](https://dataengineerhub.blog/articles/snowflake-cortex-ai-hidden-token-costs) · [Snowflake Dynamic Data Masking](https://dataengineerhub.blog/articles/snowflake-dynamic-data-masking-row-access-policies) · [Snowflake DCM Projects](https://dataengineerhub.blog/articles/snowflake-dcm-projects-infrastructure-as-code) · [Governing AI agents in Snowflake](https://dataengineerhub.blog/articles/governing-ai-agents-snowflake-coco-mcp-security) · [Snowflake Horizon Context (official)](https://www.snowflake.com/en/product/features/horizon-context/)
