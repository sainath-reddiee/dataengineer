# Snowflake DCM Projects: Native Infrastructure as Code for Snowflake

> **Editor notes**
>
> - Changed: removed the TL;DR and replaced it with a short intro; the TL;DR facts (all editions, 10,000 entities / 10 MB, OIDC, one project per environment) are already in the body or FAQ. Turned the bold gotcha lines, "The One Principle" and the FAQ questions into real headings. Added explanations before the CLI and GitHub Actions blocks. Removed nearly all em-dashes and "complete practitioner guide" phrasing.
> - **Code to check (kept exactly as published, but likely broken):** (1) `definitions.sql` says it uses DEFINE statements, but the code has lowercase `create DATABASE`, `create SCHEMA`, `create WAREHOUSE` and `use ROLE {{ team_name }}_ADMIN;`. That looks like a find-and-replace accident: `use ROLE` switches role rather than defining one, and the prose says Snowflake decides between CREATE and ALTER from `DEFINE`. Please restore the `DEFINE ...` keywords (including `DEFINE ROLE`). (2) The CLI block mixes shell commands with SQL (`EXECUTE DCM PROJECT ... PURGE`, `DROP DCM PROJECT`) and uses `MY_SCHEMA.PROJECTS...` while the manifest uses `ANALYTICS.PROJECTS...`; the "Preview what PURGE would do" comment is unclear. Consider splitting into a `bash` block and a `sql` block. (3) The PR workflow interpolates `${{ steps.plan.outputs.summary }}` straight into a JavaScript template string, which breaks on backticks and is a script-injection pattern; passing it through `env:` and reading `process.env` is safer. (4) `${{ env.SNOWFLAKE_USER }}` and `SNOWFLAKE_SERVICE_USER` are never defined in the workflows shown.
> - **Facts to verify:** GA date of 7 August 2026; PLAN DELTA, inherited grants and ATTACH TAG as July 2026 previews (and whether any are GA now); `snow dcm plan --delta` flag name; the 10,000-entity and 10 MB limits (one gotcha heading said "over 1,000 entities", which contradicted the limit; I rewrote it as "large projects" and kept both numbers in the text); availability on all editions at no extra cost; `ALTER TABLE ... UNSET DCM PROJECT` syntax; the action names and `@v3` tag in `snowflakedb/snowflake-actions`; Cortex Code DCM skill surfaces; "weeks" of Terraform provider lag. The inherited-grants doc link points at the supported-entities page and the recovery link at the monitor page; confirm the anchors.
> - Links: related reading pointed to `snowflake-cortex-token-usage-monitoring`, which is being 301'd into `snowflake-cortex-ai-hidden-token-costs`; I removed that entry since the keeper is already listed.

This post is for data platform engineers deciding how to manage Snowflake objects as code. It explains how Snowflake DCM Projects work (DEFINE, PLAN, DEPLOY), when to choose them over Terraform or Schemachange, how to wire them into GitHub Actions, and the production gotchas from the official docs.

## Why a native option matters

Until August 2026, managing Snowflake infrastructure as code meant one of two paths. You adopted Terraform with the Snowflake provider: an external tool with its own state file, version lag behind new Snowflake features, and a separate CI/CD pipeline to learn and maintain. Or you ran Schemachange or a migration-script pattern: imperative SQL files executed in order, with no dry-run, no idempotency and no rollback if something failed halfway through.

Both paths work. Both also mean your Snowflake infrastructure is managed by something that lives outside Snowflake and has an imperfect model of what is in your account.

[Snowflake DCM Projects](https://docs.snowflake.com/en/user-guide/dcm-projects/dcm-projects-overview) (Database Change Management, GA on August 7 2026) is the native alternative. A DCM project is a schema-level Snowflake object that manages other Snowflake objects declaratively. You write `DEFINE` statements in SQL files describing your desired state. You run `PLAN` to see exactly what will change. You run `DEPLOY` and Snowflake reconciles the diff. There is no external tool, no state file to lose and no provider lag. Since July 2026 you can also have Cortex Code author and debug your DEFINE files from a natural-language prompt.

## The plan-then-deploy lifecycle

If you've used Terraform, the mental model maps directly. You write desired state, preview the diff and apply. The difference is that Snowflake compares against the live account, not a separate state file that can drift from reality.

![DCM lifecycle in three zones: Jinja-parameterised source files, PLAN and DEPLOY commands run against the live account, and environments deployed independently](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/dcm_lifecycle.png?resize=943%2C504&ssl=1)

When you run `PLAN`, Snowflake queries your live account to compare current state with your definitions. If someone manually altered a table outside DCM, `PLAN` shows that as a change. The source of truth is always the account, not a file on disk. That removes the class of bugs that come from state file drift, but it also means manual changes made outside DCM are always detected and may be overwritten on the next `DEPLOY`.

## Writing your first DEFINE file

DEFINE statements are the core primitive. They look like SQL DDL but describe desired state rather than imperative commands. Snowflake decides whether to CREATE, ALTER or do nothing based on the diff between your DEFINE and the live object.

The file below describes a complete analytics stack for one team: a database with RAW and ANALYTICS schemas, a warehouse, admin and analyst roles, and the grants between them. Grants are declared alongside the objects so they are reconciled on every DEPLOY.

```sql
-- definitions.sql
-- Describes the desired state of a complete analytics stack for one team

create DATABASE {{ team_name }}_DB
  COMMENT = 'Analytics database for {{ team_name }} team';

create SCHEMA {{ team_name }}_DB.RAW
  COMMENT = 'Raw ingestion layer';

create SCHEMA {{ team_name }}_DB.ANALYTICS
  COMMENT = 'Curated analytics layer — analyst-facing';

create WAREHOUSE {{ team_name }}_WH
  WITH
    WAREHOUSE_SIZE = '{{ wh_size | default("SMALL") }}'
    AUTO_SUSPEND   = 300
    AUTO_RESUME    = TRUE
  COMMENT = 'Compute for {{ team_name }} team';

use ROLE {{ team_name }}_ADMIN;
use ROLE {{ team_name }}_ANALYST;

-- Grants declared alongside objects — reconciled on every DEPLOY
GRANT OWNERSHIP ON DATABASE {{ team_name }}_DB    TO ROLE {{ team_name }}_ADMIN;
GRANT OWNERSHIP ON WAREHOUSE {{ team_name }}_WH   TO ROLE {{ team_name }}_ADMIN;
GRANT USAGE     ON WAREHOUSE {{ team_name }}_WH   TO ROLE {{ team_name }}_ANALYST;
GRANT USAGE     ON DATABASE  {{ team_name }}_DB    TO ROLE {{ team_name }}_ANALYST;
GRANT USAGE     ON SCHEMA    {{ team_name }}_DB.ANALYTICS TO ROLE {{ team_name }}_ANALYST;
GRANT SELECT    ON ALL TABLES IN SCHEMA {{ team_name }}_DB.ANALYTICS
                                          TO ROLE {{ team_name }}_ANALYST;
GRANT ROLE {{ team_name }}_ADMIN    TO ROLE SYSADMIN;
```

The file is parameterised with `{{ team_name }}` and `{{ wh_size }}`. To provision the Finance team with a LARGE warehouse, you pass those variables at plan or deploy time. To provision five teams in one go, wrap the whole file in a Jinja `{% for team_name in teams %}` loop and pass a list. Jinja2 is first-class here: dictionaries, loops, conditionals and macros all work in definition files.

### manifest.yml: environment targets and templating config

The pattern is one DCM project per target environment (DEV, STAGING, PROD), all pointing at the same parameterised definition files and deployed independently. The manifest declares those targets and the variables each one passes to Jinja. Change the account identifiers, project names, owner roles and team lists to match your setup.

```yaml
# manifest.yml
# Declares target environments and their templating configurations

version: 1

targets:
  DEV:
    account_identifier: myorg-myaccount-dev
    project_name: ANALYTICS.PROJECTS.ANALYTICS_DCM_DEV
    project_owner: DCM_DEVELOPER_ROLE
    templating_config: dev_config

  STAGING:
    account_identifier: myorg-myaccount-staging
    project_name: ANALYTICS.PROJECTS.ANALYTICS_DCM_STAGING
    project_owner: DCM_STAGING_ROLE
    templating_config: staging_config

  PROD:
    account_identifier: myorg-myaccount-prod
    project_name: ANALYTICS.PROJECTS.ANALYTICS_DCM_PROD
    project_owner: DCM_PROD_ROLE   # service account only — not individual devs
    templating_config: prod_config

default_target: DEV

configurations:
  dev_config:
    variables:
      teams: ['Engineering']
      wh_size: 'XSMALL'
      suffix: 'DEV'

  staging_config:
    variables:
      teams: ['Engineering', 'Analytics']
      wh_size: 'SMALL'
      suffix: 'STAGING'

  prod_config:
    variables:
      teams: ['Engineering', 'Analytics', 'Finance', 'HR']
      wh_size: 'MEDIUM'
      suffix: ''
```

The manifest is the single source of truth for your environment topology. Each CI/CD workflow reads `account_identifier`, `project_name` and `project_owner` directly from it, so environment-specific config lives in one place instead of being scattered across GitHub secrets.

## Running PLAN and DEPLOY

The full command set is available through SQL, Snowflake CLI, the Snowsight UI or Cortex Code. The CLI is the best choice for local development and CI/CD. The commands below plan and deploy against the default DEV target, plan against PROD and save the output, run a PLAN DELTA for quick feedback, deploy to PROD with an alias that works like a commit message, and finally purge and drop a sandbox project. The last two lines are SQL statements, not CLI commands.

```bash
# Navigate to your project directory
cd ./analytics-dcm-project/

# Run PLAN against the default target (DEV from manifest)
snow dcm plan

# Run PLAN against PROD to see what a production deployment would change
snow dcm plan --target PROD --save-output

# Run PLAN DELTA — only evaluate definitions changed since last deploy
# Use during active development for fast feedback; always run full PLAN before deploying
snow dcm plan --delta

# Deploy to DEV
snow dcm deploy

# Deploy to PROD with a deployment alias (like a commit message for the deployment)
snow dcm deploy --target PROD --alias "Add HR team infrastructure - ticket PLAT-421"

# Preview what PURGE would do (dry run)
snow dcm plan --target DEV  # should show all objects as DROPs if you purge after

# Purge a sandbox DCM project — drops all managed objects
EXECUTE DCM PROJECT MY_SCHEMA.PROJECTS.ANALYTICS_DCM_DEV PURGE AS "sandbox_cleanup";
DROP DCM PROJECT MY_SCHEMA.PROJECTS.ANALYTICS_DCM_DEV;
```

**Always run a full PLAN before DEPLOY.** PLAN DELTA is fast but only evaluates changed definitions, so it won't catch external changes such as a table manually dropped or altered outside DCM since the last deployment. PLAN DELTA is for development feedback; full PLAN is the pre-deploy gate.

[ADD YOUR OWN: the output of `snow dcm plan --target PROD` from a real or sandbox project, showing the CREATE / ALTER / DROP summary lines]

## DCM Projects vs Terraform vs Schemachange

![Comparison of DCM Projects and Terraform: DCM is not a replacement for every Terraform use case, but for Snowflake-only infrastructure it removes a layer of external tooling](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/dcm_vs_terraform.png?resize=943%2C504&ssl=1)

| Dimension | Terraform + Snowflake Provider | Schemachange | Snowflake DCM Projects |
| --- | --- | --- | --- |
| State management | External state file (S3/GCS/local) | Migration history table | Inside Snowflake, always live |
| Dry-run / preview | terraform plan | None: scripts run directly | PLAN / PLAN DELTA |
| Idempotency | Yes | Depends on migration design | Yes: DEPLOY skips matching objects |
| Multi-env support | Workspaces / vars | Manual per-env scripts | manifest.yml targets + Jinja vars |
| New Snowflake feature support | Provider update lag (weeks) | Immediate (plain SQL) | Day-0 (DEFINE added same GA) |
| Non-Snowflake infra | Yes: multi-cloud providers | No | Snowflake objects only |
| AI-assisted authoring | None native | None | Cortex Code DCM skill |
| Cost | Tool + provider maintenance | Minimal | Cloud Services compute only |

The honest comparison: if your team already runs Terraform for multi-cloud infrastructure (S3 buckets, IAM roles, Kafka clusters and Snowflake objects in one plan), stick with Terraform. DCM Projects doesn't replace it for cross-cloud IaC. It replaces it for *Snowflake-only* infrastructure, where the external tool overhead was never really worth it. DCM Projects are available on all Snowflake editions at no additional cost beyond the cloud services compute that PLAN and DEPLOY consume.

## CI/CD with GitHub Actions

Snowflake publishes [reusable GitHub Actions](https://github.com/snowflakedb/snowflake-actions) for DCM Projects in the `snowflakedb/snowflake-actions` repository. Four actions cover the lifecycle: `dcm/parse-manifest`, `dcm/connection-test`, `dcm/plan` and `dcm/deploy`. OIDC authentication is recommended, so no passwords are stored as secrets.

![CI/CD pipeline where every pull request triggers a full production plan, so reviewers see creates, alters and drops before approving](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/dcm_cicd_pipeline.png?resize=943%2C504&ssl=1)

### Plan on every pull request

The first workflow runs a full PLAN against PROD whenever a pull request touches `dcm/**`, then posts the plan summary as a PR comment so reviewers see the diff before they merge. The `id-token: write` permission is what enables OIDC. Set `project-path` to wherever your DCM project lives in the repo.

```yaml
# .github/workflows/dcm_pr_to_main.yml
# Runs PLAN against PROD on every PR — gives reviewers a full diff before merge

name: DCM Plan on PR

on:
  pull_request:
    branches: [main]
    paths:
      - 'dcm/**'

jobs:
  plan:
    runs-on: ubuntu-latest
    environment: PROD
    permissions:
      contents: read
      id-token: write       # Required for OIDC — no stored secrets
      pull-requests: write  # Post plan summary as PR comment
    steps:
      - uses: actions/checkout@v4

      - uses: snowflakedb/snowflake-actions/dcm/plan@v3
        id: plan
        with:
          target: PROD
          project-path: dcm/analytics/
          snowflake-user: ${{ env.SNOWFLAKE_USER }}
          # OIDC: no SNOWFLAKE_PASSWORD secret needed

      - name: Post plan summary to PR
        uses: actions/github-script@v7
        with:
          script: |
            const summary = `${{ steps.plan.outputs.summary }}`;
            github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.payload.pull_request.number,
              body: summary
            });
```

[ADD YOUR OWN: a screenshot of the plan summary comment this workflow posted on one of your pull requests]

### Deploy to staging, then production

The second workflow runs on merge to `main`. It deploys to STAGING first, and the `needs: deploy-staging` line blocks the PROD job until staging succeeds. Each deployment gets an alias containing the commit SHA, so you can trace a deployment back to the change that caused it.

```yaml
# .github/workflows/dcm_deploy_prod.yml
# Deploys to STAGING then PROD on merge to main

name: DCM Deploy

on:
  push:
    branches: [main]
    paths: ['dcm/**']

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: STAGING
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: snowflakedb/snowflake-actions/dcm/deploy@v3
        with:
          target: STAGING
          project-path: dcm/analytics/
          snowflake-user: ${{ env.SNOWFLAKE_USER }}
          alias: "Deploy from ${{ github.sha }}"

  deploy-prod:
    needs: deploy-staging     # Production blocked until staging succeeds
    runs-on: ubuntu-latest
    environment: PROD
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: snowflakedb/snowflake-actions/dcm/deploy@v3
        with:
          target: PROD
          project-path: dcm/analytics/
          snowflake-user: ${{ env.SNOWFLAKE_SERVICE_USER }}
          alias: "Promote from staging - ${{ github.sha }}"
```

The sample workflows in the [Snowflake Labs DCM repository](https://github.com/Snowflake-Labs/snowflake-dcm-projects/tree/main/GitHub_workflows) include a DROP detection step that parses `plan_result.json` and blocks deployment if the changeset contains top-level DROPs on databases, schemas, tables or stages. It is a safety guardrail, not a guarantee: nested destructive changes, or `ALTER` operations that effectively drop data, won't be caught.

## Three new capabilities (July 2026 preview)

### PLAN DELTA: fast feedback during development

On a project with 500+ entities, a full `PLAN` can take several minutes. PLAN DELTA evaluates only the definition files you changed since the last deployment, plus any downstream definitions that depend on them. For tightening a masking policy or tweaking a dynamic table schedule, it gives you sub-30-second feedback. Switch to a full PLAN before deploying.

### Inherited grants: close the grant drift problem

The most painful recurring problem in Snowflake governance is grant drift: a new table is created, nobody remembers to grant SELECT to the analyst role, and the dashboard breaks. Inherited grants solve this at the DCM level. One `GRANT ... INHERITED` statement applies to every current and future object of that type in the container:

```sql
-- grants.sql
-- One INHERITED grant covers all current AND future tables in this schema

GRANT SELECT
  ON ALL TABLES IN SCHEMA ANALYTICS_DB.ANALYTICS
  TO ROLE ANALYTICS_ANALYST
  INHERITED;   -- applies automatically to tables created after this DEPLOY

GRANT SELECT
  ON ALL VIEWS IN SCHEMA ANALYTICS_DB.ANALYTICS
  TO ROLE ANALYTICS_ANALYST
  INHERITED;
```

**Inherited grants require a behavior-change parameter enabled at account level**, independent of DCM Projects. The parameter affects all future object grants in your account, not just DCM-managed ones. Read the [Managing access with inherited grants](https://docs.snowflake.com/user-guide/dcm-projects/dcm-projects-supported-entities) section before enabling it in production.

### ATTACH TAG: declarative tagging reconciled on every deploy

Tag assignment used to be a manual post-deployment step or a separate Terraform resource. With ATTACH TAG, tag assignments live in your definition files and are reconciled on every DEPLOY, including the column-level PII tags that your [masking policies](https://dataengineerhub.blog/articles/snowflake-dynamic-data-masking-row-access-policies) depend on:

```sql
-- tags.sql
-- Declaratively assigns PII tags — reconciled on every DEPLOY

ATTACH TAG GOVERNANCE_DB.TAGS.PII_EMAIL
  TO COLUMN ANALYTICS_DB.ANALYTICS.CUSTOMERS.EMAIL;

ATTACH TAG GOVERNANCE_DB.TAGS.PII_PHONE
  TO COLUMN ANALYTICS_DB.ANALYTICS.CUSTOMERS.PHONE_NUMBER;

ATTACH TAG GOVERNANCE_DB.TAGS.GDPR_SUBJECT
  TO TABLE ANALYTICS_DB.ANALYTICS.CUSTOMERS;
```

## The gotchas

### Removing a DEFINE statement means DROP, not "stop managing"

If you delete a `DEFINE TABLE ...` line from your definitions file and run DEPLOY, DCM drops the table. That is correct declarative behaviour, because the desired state no longer includes the table. To stop managing an object without dropping it, run `ALTER TABLE ... UNSET DCM PROJECT` to detach it first, *then* remove the DEFINE statement. Missing this step is how teams accidentally drop production tables during a refactor.

### A failed DEPLOY can leave objects partially applied

Unlike Terraform, which can plan a rollback, a DCM DEPLOY that fails partway through has applied some DDL statements and not others. In most cases you fix the root cause and run DEPLOY again; DCM reconciles from wherever it left off. For a critical failure, the [Recover an earlier defined state](https://docs.snowflake.com/user-guide/dcm-projects/dcm-projects-monitor) workflow lets you replay an earlier deployment artifact. This is why PLAN plus manual review before DEPLOY is non-negotiable in production.

### The project owner must hold every role that receives GRANT OWNERSHIP

If your definitions include `GRANT OWNERSHIP ON TABLE ... TO ROLE TEAM_ADMIN`, the DCM project owner role must hold `TEAM_ADMIN`, directly or through the role hierarchy. DCM checks for potential owner lockout at PLAN time and fails before making any changes if the hierarchy isn't right. It is a safety feature, but it means your project owner role needs a carefully designed privilege stack before you can express ownership transfers in definitions.

[ADD YOUR OWN: the exact PLAN error message DCM returns when the project owner role does not hold a role named in GRANT OWNERSHIP]

### Large projects can time out on PLAN or DEPLOY

The official docs say PLAN or DEPLOY for large projects can take 10 minutes or more, and a project can hold up to 10,000 entities and 10 MB of definition files; exceeding those limits can cause timeouts. To mitigate, split large projects along natural boundaries (separate business units or data domains) rather than running one mega-project. Consolidating definitions into fewer files also speeds up PLAN and DEPLOY, and PLAN DELTA during development avoids full-project evaluations on every edit.

### Jinja variables render in cleartext, so never put credentials in them

The official docs warn about this explicitly: rendered SQL definitions don't redact values inserted by Jinja template variables, and the rendered files are stored in the project's deployment artifacts. Use opaque identifiers, environment names and configuration values in Jinja, never API keys, passwords or connection strings. Use Snowflake Secrets for credentials, referenced by name rather than value.

### PLAN DELTA won't catch external changes since the last deployment

PLAN DELTA evaluates only changed definition files; it doesn't query the live account for the unchanged portions. If someone manually altered a view outside DCM since your last deployment, PLAN DELTA won't see that drift. Full PLAN always compares against the live account. The rule: PLAN DELTA for development speed, full PLAN as the pre-deploy gate in every CI/CD pipeline.

## Read the PLAN before every DEPLOY

Write what you want and let Snowflake work out how to get there. The PLAN is the diff: read it before every DEPLOY, especially the DROP lines.

## FAQ

### What is Snowflake DCM Projects and when did it go GA?

DCM Projects (Database Change Management) is Snowflake's native infrastructure-as-code system. You write DEFINE statements in SQL files describing the desired state of your Snowflake objects, run PLAN to preview changes, and DEPLOY to apply them. Snowflake tracks state internally, with no external state file. It became generally available on August 7 2026 and is available on all Snowflake editions at no cost beyond cloud services compute.

### Should I replace Terraform with Snowflake DCM Projects?

It depends on scope. If you manage only Snowflake objects and use Terraform purely for that, DCM Projects is a cleaner native alternative with day-zero feature support and no state file drift. If you manage multi-cloud infrastructure (S3 buckets, IAM, Kafka and Snowflake together), keep Terraform for the cross-cloud layer. DCM Projects only manages Snowflake objects.

### What is the difference between PLAN and PLAN DELTA?

PLAN compares all your definition files with the current live account and produces a full changeset. PLAN DELTA evaluates only the files changed since the last deployment, plus downstream definitions that depend on them. PLAN DELTA is much faster on large projects, so use it during development. Always run a full PLAN before deploying to catch external changes PLAN DELTA would miss.

### How do I prevent DCM Projects from accidentally dropping objects?

Two safeguards. First, always review the PLAN output before DEPLOY, looking specifically at the DROP entries. Second, if you use GitHub Actions, add the DROP detection step from the Snowflake Labs sample workflows, which parses plan_result.json and blocks the deploy if it finds top-level DROPs on databases, schemas, tables or stages. To stop managing an object without dropping it, use ALTER TABLE … UNSET DCM PROJECT to detach it before removing its DEFINE statement.

### What are inherited grants and why do they matter?

Inherited grants let you write a single GRANT statement with the INHERITED keyword that applies to every current and future object of a given type within a container, for example all current and future tables in a schema. A new table gets the grant automatically, with no manual step or separate Terraform resource. Inherited grants require a behavior-change parameter enabled at account level, independent of DCM Projects.

### Can Cortex Code write my DCM Project definition files for me?

Yes. The Cortex Code DCM skill can scaffold a new project, author and edit DEFINE statements and Jinja templates, run PLAN and DEPLOY, interpret plan output and diagnose failures. It is available in Cortex Code CLI, Snowsight, the VS Code extension and Cortex Code Desktop. Prompts like "Add a new dynamic table for customer spending" or "Why did my last plan fail?" cover the authoring and debugging loop.

**Related reading:** [Snowflake Dynamic Data Masking & Row Access Policies](https://dataengineerhub.blog/articles/snowflake-dynamic-data-masking-row-access-policies) · [Using MCP Servers with Snowflake](https://dataengineerhub.blog/articles/snowflake-mcp-server-guide) · [Identifying hidden Cortex AI token costs](https://dataengineerhub.blog/articles/snowflake-cortex-ai-hidden-token-costs) · [dbt State: stop rebuilding what hasn't changed](https://dataengineerhub.blog/articles/dbt-state-skip-unchanged-models) · [DCM Projects overview (official)](https://docs.snowflake.com/en/user-guide/dcm-projects/dcm-projects-overview) · [Deploy and manage DCM Projects (official)](https://docs.snowflake.com/user-guide/dcm-projects/dcm-projects-use) · [Snowflake Labs DCM repository (GitHub)](https://github.com/Snowflake-Labs/snowflake-dcm-projects)
