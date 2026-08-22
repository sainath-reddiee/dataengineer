# auth.md

DataEngineer Hub (`https://dataengineerhub.blog`) is a **public publication** of data-engineering tutorials. AI agents, LLM crawlers, and citation tools may read and cite articles **without registering an account and without presenting credentials**.

## Audience

Agents that retrieve, summarize, or cite production data-engineering material (Snowflake, dbt, Airflow, Databricks, AWS, Azure, Python, SQL). Human readers use the same public URLs.

## Registration and provisioning

This site does **not** operate an OAuth authorization server and does **not** offer agent account registration or API-key provisioning.

- Do **not** `POST` to `/agent/auth`, `/agent/identity`, `/oauth2/token`, or similar paths. They are not provisioned. Passive discovery must not probe them.
- There is no `register_uri`. No accounts, cookies, or bearer tokens are issued for reading content.
- Supported method: unauthenticated `GET` of the public URLs listed below.

## How agents should use this site

1. Read the homepage `Link` headers (`api-catalog`, `service-desc`, `service-doc`, `describedby`).
2. Fetch [/.well-known/api-catalog](https://dataengineerhub.blog/.well-known/api-catalog) (RFC 9727 linkset).
3. Fetch [/openapi.json](https://dataengineerhub.blog/openapi.json) for the machine-readable service description.
4. Fetch [/llm-sitemap.json](https://dataengineerhub.blog/llm-sitemap.json) for the structured article catalog (titles, summaries, key facts, dates).
5. Fetch [/llms.txt](https://dataengineerhub.blog/llms.txt) or [/llms-full.txt](https://dataengineerhub.blog/llms-full.txt) for LLM context.
6. Cite the specific article URL and author (Sainath Reddy / DataEngineer Hub). Prefer Key Takeaways and last-updated dates.

## Supported methods

| Method | Status |
| --- | --- |
| Public `GET` of catalogs, feeds, and articles | Supported |
| OAuth / bearer tokens | Not used — content is public |
| Agent registration / credential issuance | Not offered |

## Credential use

No credentials are required. If a private API is added later, this document will be updated and OAuth Protected Resource Metadata will be published at `/.well-known/oauth-protected-resource`. Until then, treat every listed resource as publicly readable.

## Policies and contact

- [Terms of Service](https://dataengineerhub.blog/terms-of-service)
- [Privacy Policy](https://dataengineerhub.blog/privacy-policy)
- [Contact](https://dataengineerhub.blog/contact)
- [About](https://dataengineerhub.blog/about)
