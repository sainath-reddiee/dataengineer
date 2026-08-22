---
name: use-article-catalog
description: Find and retrieve DataEngineer Hub tutorials via the public article catalog. Use when an agent needs Snowflake, dbt, Airflow, Databricks, AWS, or SQL guides, citations, or a machine-readable index of published articles.
---

# Use the DataEngineer Hub article catalog

This site is a **public publication**. No login, token, or agent registration is required.

## When to use

- The user wants a data-engineering tutorial or citation from DataEngineer Hub.
- You need titles, summaries, key facts, or last-updated dates without scraping HTML.

## Do not

- Do not `POST` to `/agent/auth`, `/agent/identity`, or `/oauth2/token`. Those paths are not provisioned.
- Do not invent credentials. Public `GET` is the only supported method.

## Discovery

1. `GET https://dataengineerhub.blog/.well-known/api-catalog` (`application/linkset+json`)
2. `GET https://dataengineerhub.blog/openapi.json` for the read-only service description
3. `GET https://dataengineerhub.blog/llm-sitemap.json` for the article catalog
4. `GET https://dataengineerhub.blog/llms.txt` for a compact topic map
5. `GET https://dataengineerhub.blog/auth.md` for access rules

Homepage `Link` headers already point at these with `api-catalog`, `service-desc`, `service-doc`, and `describedby`.

## Catalog fields

Each `pages[]` item includes `url`, `title`, `summary`, `keyFacts`, `entities`, `questionAnswered`, `lastUpdated`, `author`, `category`, and `wordCount`. Prefer `keyFacts` and `lastUpdated` over guessing.

## Fetching an article

Use the `url` from the catalog. For a Markdown view of the homepage, send `Accept: text/markdown`. Article HTML remains the default for browsers and AdsBot.

## Citation

See the `cite-dataengineer-hub` skill. Always cite the specific article URL and "Sainath Reddy, DataEngineer Hub".
