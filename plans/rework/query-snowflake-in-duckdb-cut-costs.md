# How to Query Snowflake in DuckDB (and Cut Your Bill While Doing It)

> **Editor notes**
>
> - Changed: removed the TL;DR bullet block and replaced it with a short intro; turned the all-caps bold pseudo-headings into `##`/`###` headings; split the Iceberg and ADBC methods into subsections; removed nearly all em-dashes and en-dashes; rewrote "the insight that unlocked this for me" and similar phrasing; renamed "Related blogs" to "Further reading"; added short explanations around the ADBC and query_history code blocks; FAQ kept and tightened.
> - Code: every block kept as written. The live post shows `-&gt;`, `&gt;=`, `&lt;` etc. inside the Python and SQL blocks because the HTML entities are double-encoded in WordPress; I restored them to `->`, `>=`, `<` so the code runs when copied. Language tags added (sql, python, bash).
> - Code issue to fix yourself: in the ADBC snippet `pem_key` is used but never assigned, and `from read_private_key import read_private_key` imports a helper that is never called. I did not change the code; the prose now says `pem_key` must come from that helper. Consider adding `pem_key = read_private_key(...)` to the snippet.
> - Check: "a dashboard firing 20 queries of 3 seconds bills 1,200 seconds" only holds if each query resumes a suspended warehouse; on a running warehouse they share the same billing minute. Please re-check the wording.
> - Check: the 110-million-row benchmark (29s DuckDB on M1 vs 72s X-Small) and the 54s to 1.5s figure: are these your own runs or from Greybeam/another source? If not yours, attribute them with a link.
> - Check: "$528/month on X-Small running continuously vs $5.87/month on per-second billing" needs a source or your own calculation shown (credit price assumed?).
> - Check: the three savings examples (unnamed SaaS company 70%+, Okta $60,000/month, a team with 79% and 7x) have no links. Add sources or cut. The "data engineering" internal link that sat inside the third bullet is kept but moved.
> - Check (possibly outdated): DuckDB's iceberg extension now supports Iceberg REST catalogs (and attaching a catalog) in recent releases, so "point DuckDB at a specific metadata file rather than a catalog" may no longer be accurate. Verify against current DuckDB docs.
> - Check: "70 to 90% is consistent across documented cases" in the FAQ needs at least one link.
> - Cut: nothing substantive. Repeated statements of the 60-second minimum (TL;DR plus body plus FAQ) reduced to the body and FAQ.

This post is for data engineers and analytics leads whose Snowflake bill is driven by lots of short queries rather than heavy batch jobs. It explains why Snowflake's 60-second minimum makes those queries expensive, shows two ways to get Snowflake data into DuckDB (Iceberg tables on S3, and ADBC for native tables), and gives a simple way to decide which workloads belong on which engine.

I've been building on Snowflake long enough to know the ritual. Warehouse wakes up. Query runs in three seconds. Warehouse idles. You get billed for sixty seconds anyway. Multiply that by every analyst, every BI dashboard refresh and every dbt run in your dev environment, and you end up with a bill that feels disconnected from the work that actually happened.

For a long time I assumed this was just the price of using a best-in-class cloud warehouse. What I didn't realise until I started taking DuckDB seriously is that a meaningful part of that bill doesn't have to exist at all.

## The real problem: you pay for compute you didn't use

Snowflake bills compute per second, but only after a 60-second minimum each time a warehouse resumes from suspension. A query that takes five seconds gets billed for a full minute. You paid for 55 seconds of nothing.

It gets worse at scale. When a BI dashboard fires 20 queries on load, each taking three seconds, that single page view triggers 1,200 seconds of billed compute time. The actual work is one minute.

Warehouse sizing compounds it further. Each size increase in Snowflake doubles credit consumption, so teams defaulting to Medium or Large for everything pay a 4x to 8x premium for workloads that would run fine on X-Small.

I've seen this exact pattern on almost every Snowflake environment I've worked in: oversized warehouse, auto-suspend set to ten minutes, no resource monitors, and nobody looking at query history.

## Quick wins inside Snowflake first

Before touching the architecture, fix the obvious things. These alone can cut spend by 20 to 40%.

Set `AUTO_SUSPEND` to exactly 60 seconds. Not lower: setting it below 60 is counterproductive, because a query arriving in that first minute triggers another 60-second minimum. Not higher: every idle second past 60 is wasted money.

Default to X-Small warehouses. Only scale up when a specific workload has a documented SLA that needs it.

Add resource monitors:

```sql
CREATE OR REPLACE RESOURCE MONITOR monthly_etl_monitor
WITH CREDIT_QUOTA = 5000
TRIGGERS ON 75 PERCENT DO NOTIFY
        ON 100 PERCENT DO SUSPEND;

ALTER WAREHOUSE etl_heavy_wh 
SET RESOURCE_MONITOR = monthly_etl_monitor;
```

This notifies at 75% of a 5,000-credit quota and suspends the warehouse at 100%. Set the quota and the warehouse name to match your own account.

## Method 1: Query Snowflake Iceberg tables directly in DuckDB

If your organisation has moved to Iceberg tables with the underlying data in S3, you can read those tables directly in DuckDB. No Snowflake warehouse runs and no credits are consumed.

### Install the extensions

```sql
INSTALL httpfs;
LOAD httpfs;
INSTALL iceberg;
LOAD iceberg;
```

### Configure AWS credentials

```sql
CREATE SECRET (
    TYPE S3,
    PROVIDER CREDENTIAL_CHAIN
);
```

### Find the metadata file and query it

In Snowflake, find the current metadata file for your Snowflake-managed Iceberg table:

```sql
SELECT PARSE_JSON(
  SYSTEM$GET_ICEBERG_TABLE_INFORMATION('YOUR_DB.YOUR_SCHEMA.YOUR_TABLE')
)['metadataLocation']::varchar;
```

Then point DuckDB at that file:

```sql
SELECT
    customer_id,
    COUNT(*)
FROM iceberg_scan('s3://your-bucket/path/to/metadata/00001-xxxx.metadata.json')
GROUP BY 1;
```

### Materialise once for fast repeated queries

```sql
CREATE TABLE payments AS 
SELECT * FROM iceberg_scan('s3://your-bucket/.../metadata.json');
```

After this, the same aggregation runs in 1.5 seconds instead of 54.

One benchmark: a `SELECT *` on a 110-million-row table finished in 29 seconds in DuckDB on an M1 MacBook. The same query on an X-Small Snowflake warehouse took 72 seconds.

[ADD YOUR OWN: your own timing for one query run both ways, with the row count, the warehouse size and the machine you ran DuckDB on]

### The limitation

DuckDB's Iceberg support is still maturing. You need direct S3 access, and you have to point DuckDB at a specific metadata file rather than a catalog. This will improve over time, but it works today.

## Method 2: Query native Snowflake tables through ADBC

Not on Iceberg yet? ADBC (Arrow Database Connectivity) is the right tool here.

### Why ADBC rather than ODBC

Apache Arrow is a columnar memory format. When you connect Snowflake to DuckDB through ADBC, data stays columnar the whole way. Traditional ODBC makes Snowflake convert columnar data to rows for transfer, and then DuckDB converts the rows back to columnar for processing. DuckDB's benchmarks show ADBC is up to 38x faster than ODBC.

Install the packages:

```bash
pip install adbc_driver_snowflake pyarrow duckdb cryptography
```

### Connect to Snowflake and pull an Arrow table

```python
import adbc_driver_snowflake.dbapi
import duckdb
import os
from read_private_key import read_private_key

SNOWFLAKE_CONFIG = {
    'adbc.snowflake.sql.account': os.getenv('SNOWFLAKE_ACCOUNT'),
    'adbc.snowflake.sql.warehouse': os.getenv('SNOWFLAKE_WAREHOUSE'),
    'adbc.snowflake.sql.role': os.getenv('SNOWFLAKE_ROLE'),
    'adbc.snowflake.sql.database': os.getenv('SNOWFLAKE_DATABASE'),
    'username': os.getenv('SNOWFLAKE_USER'),
    'adbc.snowflake.sql.client_option.jwt_private_key_pkcs8_value': pem_key,
    'adbc.snowflake.sql.auth_type': 'auth_jwt'
}

snowflake_conn = adbc_driver_snowflake.dbapi.connect(
    db_kwargs={**SNOWFLAKE_CONFIG}
)

snowflake_cursor = snowflake_conn.cursor()
snowflake_cursor.execute("SELECT * FROM SANDBOX_DB.MY_SCHEMA.RAW_ORDERS")

# Fetch as Arrow table — stays columnar, no serialisation overhead
arrow_table = snowflake_cursor.fetch_arrow_table()

# Persist locally in DuckDB
duckdb_conn = duckdb.connect('demo.db')
duckdb_conn.execute("""
    CREATE TABLE IF NOT EXISTS raw_orders AS 
    SELECT * FROM arrow_table
""")
```

The script reads the account, warehouse, role, database and user from environment variables, authenticates with a key pair (JWT), runs one query through a Snowflake warehouse, fetches the result as an Arrow table and writes it into a local DuckDB file called `demo.db`. Swap in your own table name and file path. `pem_key` has to be set before the config dictionary is built, using the `read_private_key` helper in the next section.

### Encode the private key as PEM

One heads-up: working out the connection parameters for a private key is not straightforward, and the docs aren't great on this point. The private key needs to be re-encoded into PEM format before you pass it to the ADBC driver:

```python
from cryptography.hazmat.primitives import serialization

def read_private_key(private_key_path: str, private_key_passphrase: str = None) -> str:
    with open(private_key_path, 'rb') as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=private_key_passphrase.encode() if private_key_passphrase else None
        )
        pem_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem_key.decode('utf-8')
```

The function loads your key file (using the passphrase if there is one) and returns it as an unencrypted PKCS8 PEM string, which is the format the `jwt_private_key_pkcs8_value` option expects.

[ADD YOUR OWN: the exact error the ADBC driver returned before you re-encoded the key, so readers searching for that error find this fix]

Once that's sorted, the workflow is clean: pull data from Snowflake through ADBC once, materialise it locally in DuckDB, and query it as many times as you want. No Snowflake credits are consumed after the initial pull.

## Method 3: Route workloads by type

The two methods above are great for development and ad-hoc analysis. For production BI workloads, the cleanest solution I've seen is a hybrid architecture where you triage queries by workload type.

What made this click for me was using Snowflake's `query_history` to categorise what is actually running:

```sql
WITH query_stats AS (
    SELECT
        warehouse_name,
        user_name,
        query_id,
        execution_time / 1000 AS execution_seconds
    FROM snowflake.account_usage.query_history
    WHERE
        start_time >= DATEADD('day', -30, CURRENT_TIMESTAMP())
        AND warehouse_name IS NOT NULL
        AND execution_status = 'SUCCESS'
)
SELECT
    warehouse_name,
    user_name,
    COUNT(query_id) AS query_count,
    MEDIAN(execution_seconds) AS median_execution_seconds,
    CASE
        WHEN query_count > 1000 AND median_execution_seconds < 30 
            THEN 'Interactive BI / High Frequency'
        WHEN query_count <= 1000 AND median_execution_seconds < 60 
            THEN 'Ad-Hoc Exploration'
        WHEN median_execution_seconds >= 300 
            THEN 'Batch ETL / Heavy Analytics'
        ELSE 'General Purpose'
    END AS workload_category
FROM query_stats
GROUP BY warehouse_name, user_name
ORDER BY query_count DESC;
```

The query looks at the last 30 days of successful queries, groups them by warehouse and user, and labels each group by how often it runs and how long its typical query takes. The thresholds (1,000 queries, 30, 60 and 300 seconds) are the cut-offs to adjust for your own account.

Use `MEDIAN`, not `AVG`. Outlier queries skew the average and give a misleading picture of typical duration.

[ADD YOUR OWN: a screenshot or anonymised table of this query's output from one of your accounts, showing how the workload categories split]

### Routing logic

- **Short, bursty BI (under 30 seconds, high frequency):** move to a usage-based engine such as MotherDuck. The math: $528/month on a Snowflake X-Small running continuously vs $5.87/month on per-second billing for the same workload.
- **Dev and CI/CD:** local DuckDB, zero cloud credits.
- **Heavy batch ETL, multi-TB:** keep on Snowflake. The 60-second minimum is irrelevant for hour-long jobs.

This is the same principle I apply to orchestration: use the right tool for the job, not the most powerful tool for everything. I wrote about a similar decision in [why I stopped using Snowflake Tasks for orchestration](/articles/why-i-stopped-using-snowflake-tasks-orchestration). The short version is that mature orchestration tools give you far more control over exactly this kind of workload routing.

## When to stay on Snowflake

**Multi-terabyte batch processing.** Predictable provisioned compute matters more than idle cost savings when a job runs for hours.

**Enterprise governance.** Complex data masking, RBAC at scale and data residency requirements. Snowflake's security surface is mature; DuckDB isn't designed for this.

**Already-efficient workloads.** If a warehouse runs at high utilisation for eight hours straight, there's no idle tax to remove. Don't fix what isn't broken.

## What real cost savings look like

- One SaaS company: 70%+ reduction in warehousing costs after moving to a DuckDB-based solution.
- Okta: $60,000/month of Snowflake spend for threat detection reduced substantially using parallel DuckDB instances.
- A data engineering team: 79% immediate reduction in Snowflake BI spend using DuckDB as a caching layer, with 7x faster queries.

None of these required abandoning Snowflake. They required deciding which workloads actually needed it. If you're earlier in that journey, the rest of the [data engineering](https://dataengineerhub.blog/articles) articles on this site cover the Snowflake side in more depth.

[ADD YOUR OWN: the credits or dollar figure from your own account before and after moving dev or BI queries to DuckDB, even for a single warehouse or a single month]

## Frequently asked questions

### Can you query Snowflake data in DuckDB without a Snowflake warehouse running?

Yes, in two ways: Iceberg tables through the iceberg extension (no warehouse), or native tables through ADBC. ADBC needs a brief initial connection, but once the data is materialised locally, every later query is free.

### What is ADBC and why is it faster than ODBC?

ADBC keeps data in columnar format throughout. ODBC forces a columnar to row to columnar conversion. DuckDB's benchmarks show ADBC up to 38x faster for transfers.

### How much can I realistically save?

For short, high-frequency dashboard queries, 70 to 90% is consistent across documented cases. The 60-second minimum means a 4-second query costs 15x what it should.

### Is DuckDB production-ready?

For single-node analytical workloads under a few terabytes, yes. For multi-user concurrency at scale and enterprise governance, not yet.

### Do I need Iceberg?

No. ADBC works with native Snowflake tables. The main friction is private key encoding, which the docs don't explain well.

### Will this work with dbt?

Yes. dbt-duckdb lets you run your full dbt project locally against DuckDB. Pull source data from Snowflake once, develop and test for free, and deploy to Snowflake only in production. That removes cloud compute costs from the whole development loop. I've written about [dbt native projects and pipeline patterns](/articles/snowflake-dbt-projects-airflow-orchestration) if you want more context on how this fits into a Snowflake-first stack.

## Further reading

- [DuckDB official docs and installation](https://duckdb.org/docs/installation/)
- [DuckDB ADBC benchmarks](https://duckdb.org/2023/08/04/adbc.html)
- [Apache Arrow project](https://arrow.apache.org/)
- [Snowflake query_history view docs](https://docs.snowflake.com/en/sql-reference/account-usage/query_history)
- [dbt-duckdb adapter on GitHub](https://github.com/duckdb/dbt-duckdb)
- [Greybeam ADBC connection code on GitHub](https://github.com/greybeam/snowflake-adbc-connection)
