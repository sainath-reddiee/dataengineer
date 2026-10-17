# Rework drafts for the next AdSense application

Copy-edited versions of the 20 highest-scoring posts in `plans/editorial-worklist.md` (2026-10-17). Each draft keeps your words, claims and code, and fixes structure, filler, em-dashes and unexplained code. Nothing in them is invented: every first-person line comes from your original post.

## How to use a draft

1. Read the "Editor notes" at the top. Fix the items marked high priority before publishing. Several are factual errors that are already live today.
2. Replace every `[ADD YOUR OWN: ...]` marker with something only you have: a screenshot from your account, a number you measured, an error you hit. This is what turns a post from generic into first-hand, and it is the part AdSense reviewers notice.
3. In WordPress, open the post, select all blocks, delete them, and paste the draft body (everything below the editor notes). The block editor converts Markdown into headings, lists and code blocks. Check the code blocks after pasting.
4. Update the title if the draft's title differs, then Update. Do one post at a time and check it on the live site.

## Decide first: unpublish or rework

Two posts were judged to have no first-hand content worth keeping. Consider unpublishing them (set to Draft) instead of reworking:

- `salesforce-agentforce-complete-guide-2025`: the success-rate figures look like Salesforce's own benchmark, and the other percentages have no source.
- `snowflake-cortex-ai-financial-services`: a rewrite of the press release with no original material.

## Factual errors to fix first (already live)

| Post | Problem |
| --- | --- |
| `build-rag-snowflake-cortex-search-guide` | `SERVICE!SEARCH()` may not be valid syntax (the documented SQL route is `SNOWFLAKE.CORTEX.SEARCH_PREVIEW`). Several UDFs use procedural code and need to be procedures. One service is used but never created. |
| `snowflake-zero-copy-cloning-problems` | The claim that masking and row access policies are not inherited by clones contradicts Snowflake's docs. The audit queries read `clone_group_id` from the wrong view. |
| `snowflake-cortex-ai-hidden-token-costs` | Now includes the merged monitoring post, so it names two different "canonical" usage views. Pick one. The alert has an empty `WAREHOUSE =`. |
| `snowflake-cortex-code-cost-control-2026` | There are three credit-limit parameters, not two. The monitoring query uses the wrong column names (`TOKENS`, `TOKEN_CREDITS`). |
| `snowflake-dcm-projects-infrastructure-as-code` | `definitions.sql` uses `create` where the text says `DEFINE`, which looks like a find-and-replace accident. The PR workflow writes plan output straight into a script (injection risk). |
| `snowflake-dynamic-data-masking-row-access-policies` | The `POLICY_CONTEXT` syntax is likely wrong. "Snowflake never encrypts the stored data" is wrong: everything is encrypted at rest. |
| `synapse-to-fabric-migration-adx-eventhouse-guide` | Mixes up the retirement of Synapse Data Explorer pools with standalone Azure Data Explorer, which is not retiring. Real-Time Analytics is now Real-Time Intelligence. |
| `snowflake-cortex-sense-context-runtime` | Fiscal-quarter example: with a February start, Q3 is August to October. |
| `the-problem-with-data-engineering-certifications-that-nobody-talks-about` | DP-203 was retired. |
| `why-i-stopped-using-snowflake-tasks-orchestration`, `automation-in-data-engineering`, `airflow-vs-prefect`, `snowflake-dbt-projects-airflow-orchestration` | Airflow 3 removed `schedule_interval` and `days_ago`. Snowflake tasks now support `RETRY LAST` and conditional `WHEN`, which weakens part of the Tasks post's argument: say so in the post. |

Unsourced statistics (salaries, percentages, benchmarks) are flagged in each draft. Link a source or cut them: an unsourced number reads as filler to a reviewer.

## Merged posts

Two keepers already contain the unique section of the post merged into them:

- `snowflake-dbt-projects-airflow-orchestration` absorbs `airflow-dbt-snowflake-orchestration-guide`.
- `snowflake-cortex-ai-hidden-token-costs` absorbs `snowflake-cortex-token-usage-monitoring`.

After you paste those two, set all six merged posts (listed in `plans/site-roadmap.md`, Phase 2) to Draft in WordPress. Their 301s keep working.

## Order

Do the high-priority fixes and the two unpublish decisions first, then work through the rest. Twenty posts at two or three a day is about two weeks, which fits the stability window before reapplying.
