/**
 * Original DataEngineer Hub interview bank.
 * Written for this site — production warehouse / pipeline answers, not a dump
 * from another prep product. Free visitors get the first FREE_QUESTION_LIMIT.
 */
export const FREE_QUESTION_LIMIT = 12;

export const INTERVIEW_TRACKS = [
  { id: 'sql', label: 'SQL you can defend' },
  { id: 'warehouse', label: 'Warehouse cost & Snowflake' },
  { id: 'pipelines', label: 'dbt, Airflow, Spark' },
  { id: 'design', label: 'System design' },
  { id: 'behavioral', label: 'On-call & cost stories' },
];

export const INTERVIEW_QUESTIONS = [
  {
    id: 'sql-top-n',
    track: 'sql',
    title: 'Top salary per department without a correlated subquery',
    prompt:
      'You have employees(id, department, name, salary). Return one row per department: the person with the highest salary. Ties: lowest id.',
    answer:
      'Use ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC, id). Filter rn = 1. RANK() keeps ties as two winners, which most hiring loops do not want. QUALIFY rn = 1 is the Snowflake spelling; DuckDB and Postgres wrap the window in a subquery. If the interviewer asks why not a GROUP BY MAX(salary) join-back, say the join-back doubles on salary ties unless you add MIN(id).',
  },
  {
    id: 'sql-dept-avg',
    track: 'sql',
    title: 'People above their department average',
    prompt: 'List employees whose salary is strictly above the department mean. Include the mean.',
    answer:
      'AVG(salary) OVER (PARTITION BY department) as dept_avg, then filter salary > dept_avg. Do not GROUP BY in the same SELECT — you would collapse people. Watch integer division on warehouses that truncate AVG of ints; CAST to numeric. Interviewers often follow with “what if the department has one person?” — they are never above their own average, so the set is empty. That is correct, not a bug.',
  },
  {
    id: 'sql-repeat-buyers',
    track: 'sql',
    title: 'Repeat buyers without reading the whole fact table twice',
    prompt: 'Customers with more than one order. Return customer_id and order_count.',
    answer:
      'GROUP BY customer_id HAVING COUNT(*) > 1. A self-join of orders to orders on customer_id with o1.order_id < o2.order_id is the classic slow answer. If they want last-30-day repeats, filter order_date first so pruning still works. On Snowflake, clustering/micro-partitions on order_date beats a customer_id clustering key for this scan.',
  },
  {
    id: 'sql-gaps',
    track: 'sql',
    title: 'Find missing dates in a daily grain',
    prompt: 'A metrics table is supposed to have one row per day. How do you find holes?',
    answer:
      'Generate the calendar (Snowflake: last 365 days via DATEADD + row generator, or a dates dimension). LEFT JOIN facts ON date and WHERE fact.date IS NULL. LAG(date) OVER (ORDER BY date) and datediff > 1 also works if you only care about holes between existing rows, but it misses a missing first/last day. Say that out loud — it is the difference between “gaps in what we loaded” and “gaps vs the contract.”',
  },
  {
    id: 'sql-late-events',
    track: 'sql',
    title: 'Watermark vs processing time',
    prompt: 'A clickstream lands 40 minutes late. Your hourly job already ran. What do you do tomorrow?',
    answer:
      'Decide the watermark in the contract: “events with event_time in [T, T+1h) may arrive until T+2h.” Recompute the affected hour with a MERGE on event_id, or use a lookback window of max-lateness on every run. Do not “append only” or you double-count. Incremental dbt models with unique_key = event_id are the boring production answer. Streaming is optional; most DE loops want the batch repair story.',
  },
  {
    id: 'sql-window-frame',
    track: 'sql',
    title: 'Why did my running total double?',
    prompt: 'SUM(amount) OVER (PARTITION BY account ORDER BY day) looks twice as big as the ledger.',
    answer:
      'Default frame on most engines is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, and RANGE treats peer rows (same ORDER BY value) as the same window. Two payments on the same day both see the sum including each other. Fix with ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, or ORDER BY day, payment_id. This is the most common “I know windows” trap in a live round.',
  },
  {
    id: 'wh-credits',
    track: 'warehouse',
    title: 'A Snowflake warehouse that is always XL',
    prompt: 'Finance says the XL warehouse is 4× last quarter. Query history is full of SELECT *. What do you check first?',
    answer:
      'Warehouse size is the last knob. First: auto-suspend (idle XL burns credits), query clustering vs prune, result cache vs warehouse cache, and whether BI is issuing SELECT * against VARIANT. Use the cost calculator on this site with actual credit price and a realistic suspend. Spilling to local/remote storage is a resize-up signal; a dashboard that scans 200 GB for a 12-row KPI is a modeling/SQL signal. Say which one you would prove with QUERY_HISTORY bytes scanned.',
  },
  {
    id: 'wh-clustering',
    track: 'warehouse',
    title: 'When clustering keys are a tax',
    prompt: 'A 12 TB fact has a clustering key on customer_id. Incremental loads take longer every week.',
    answer:
      'Clustering is not free. Reclustering burns credits to keep the key healthy. customer_id is high-cardinality and load order is usually time, so you fight the ingest pattern. Prefer a time column the filters actually use (event_date), or search optimization / qualified pruning. If they insist on customer_id, ask whether the access pattern is “this customer’s history” (maybe) or “yesterday’s revenue” (then you bought the wrong key).',
  },
  {
    id: 'wh-time-travel',
    track: 'warehouse',
    title: 'Time Travel is not a backup product',
    prompt: 'A junior dropped a prod table. Fail-safe vs Time Travel vs clone. Talk.',
    answer:
      'UNDROP / Time Travel is for the retention window you pay for (0–90 days depending on edition). Zero-copy clone is a branch, not a backup off-site. Fail-safe is Snowflake-operated after Time Travel and is not a self-serve restore SLA. If the business needs 1-year restore, that is object storage + COPY, not hoping Fail-safe is a product feature you can ticket. Mention RBAC so DROP TABLE is not a Tuesday ritual.',
  },
  {
    id: 'wh-databricks',
    track: 'warehouse',
    title: 'DBUs vs Snowflake credits in one sentence each',
    prompt: 'A PM wants one number: “which warehouse is cheaper?”',
    answer:
      'Refuse the one number. Snowflake bills warehouse-seconds × credit price; idle is auto-suspend. Databricks bills DBU × instance × time, plus cloud VM, and interactive clusters idle differently from jobs compute. Photon, Delta caching, and warehouse SQL vs Spark jobs change the curve. Use the two calculators on this hub with the same workload (scan GB, concurrency, hours/day) and show a range. Anyone who quotes a blog “Databricks is 30% cheaper” is selling, not modeling.',
  },
  {
    id: 'wh-bq',
    track: 'warehouse',
    title: 'BigQuery on-demand surprise',
    prompt: 'A Looker explore scanned 9 TB. How do you stop that without banning the explore?',
    answer:
      'On-demand is bytes processed. Partition + require a date filter, clustered tables, authorized views that already filter, BI Engine for the hot slice, and custom quotas. SELECT * on nested STRUCT explodes bytes. Capacity (slots) is the other pricing mode — do not mix advice. The BigQuery calculator on this site is for the bytes model; say so. The human fix is a certified explore, not a Slack “please don’t do that.”',
  },
  {
    id: 'pipe-dbt-grain',
    track: 'pipelines',
    title: 'A dbt test that is lying',
    prompt: 'unique + not_null are green. Finance still sees doubled revenue. Where did the grain break?',
    answer:
      'unique on order_id is green if you never explode line items. The mart is at order grain while the source is line-item. unique_combination_of_columns on (order_id, line_id) on the staging model, and a relationship test to a real orders entity. dbt_utils.expression_is_true on SUM(line) = order_total catches silent fanout. “Tests passed” is not “grain is true.” Write that on the whiteboard.',
  },
  {
    id: 'pipe-airflow',
    track: 'pipelines',
    title: 'A DAG that is a cron with extra steps',
    prompt: '24 tasks, all start at 02:00, all poke S3. It “works.” What do you change before on-call?',
    answer:
      'Sensors that poke every minute are a scheduler tax. Use deferrable sensors or a dataset/asset schedule. Task-level retries with exponential backoff, not DAG-level retry of the world. Idempotent loads (MERGE / partition overwrite). A pool for the warehouse so 24 COPY jobs do not all XL at once. If the SLA is 06:00 and the critical path is 40 minutes, say the SLA is a lie or the path is. Airflow is the pager, not the warehouse.',
  },
  {
    id: 'pipe-spark',
    track: 'pipelines',
    title: 'Shuffle that ate the cluster',
    prompt: 'A join of 2 TB to 20 GB skews on country = US. What do you actually do?',
    answer:
      'Salting the US key, AQE skew join (Spark 3), broadcast the 20 GB if it fits after filter, or pre-aggregate. Explaining “repartition 2000” as the fix is a junior tell — it moves the skew, it does not remove it. Check the stage with the long tail in the Spark UI, not the job duration. Delta Z-ORDER is storage; it does not replace a bad join key at runtime.',
  },
  {
    id: 'pipe-scd2',
    track: 'pipelines',
    title: 'SCD2 that cannot answer “as of Tuesday”',
    prompt: 'You implemented valid_from / valid_to. A report for last Tuesday returns two current rows.',
    answer:
      'The contract is one current row: valid_to IS NULL XOR a high sentinel, never both, never overlapping ranges. MERGE must close the previous version in the same transaction as the insert. Testers: two updates same day, late-arriving yesterday, and a delete. If you only test the happy insert, you shipped a wiki, not a dimension.',
  },
  {
    id: 'pipe-kafka',
    track: 'pipelines',
    title: 'Exactly-once from Kafka to the warehouse',
    prompt: 'They say they need exactly-once. What do you promise?',
    answer:
      'At-least-once plus idempotent sink is what you can operate. Exactly-once across Kafka → Spark → Snowflake is a transactional story at each hop (Kafka transactions, Spark checkpoints, MERGE on event_id). If the business means “do not double-bill,” unique event_id in the warehouse is the SLA. If they mean “never replay,” they are asking you to never repair — refuse that.',
  },
  {
    id: 'des-cdc',
    track: 'design',
    title: 'Design CDC from checkout to a 5-minute finance mart',
    prompt: 'Postgres checkout, Snowflake mart, 5-minute freshness, auditors want yesterday frozen.',
    answer:
      'Debezium/Fivetran-style CDC to a raw VARIANT or typed landing, MERGE to a current-order table, then a daily partition snapshot for the auditor freeze. 5-minute is a streaming or micro-batch MERGE, not a full rebuild. Call out delete handling, PK changes, and a kill switch when CDC lags. Cost: warehouse that suspends between batches vs an always-on cluster. Draw the raw / staging / mart layers; do not skip raw — you will need to replay.',
  },
  {
    id: 'des-pii',
    track: 'design',
    title: 'PII in the lake “just for debugging”',
    prompt: 'An engineer copied prod events with emails into an open S3 prefix.',
    answer:
      'That is an incident, not a debate. Inventory, lock the prefix, rotate if tokens leaked, tell security. Then: tokenization at ingest, column masking in the warehouse, separate raw-PII account, no SELECT * in debug views. “We’ll delete it Friday” is not a control. Interviewers want you to sound boring and fast, not clever.',
  },
  {
    id: 'des-backfill',
    track: 'design',
    title: 'Two-year backfill without melting the warehouse',
    prompt: 'New mart needs history. Prod jobs still have to hit SLA tonight.',
    answer:
      'Backfill on a separate warehouse/size, partition by month, write to a shadow schema, swap when checksums match. Cap concurrency. Do not run the backfill on the same XL that serves dashboards. Idempotent daily slices beat one 2-year INSERT. Have a progress table so a killed job resumes. Estimate credits before you start — the cost calculator is the pre-read, not a postmortem.',
  },
  {
    id: 'des-sla',
    track: 'design',
    title: 'Dashboard SLA vs pipeline SLA',
    prompt: 'Tableau is “down” because the 07:00 extract missed. Pipeline finished at 07:12.',
    answer:
      'The user SLA is the extract, not the DAG success. Either move the extract, add a freshness check that fails the DAG before Tableau runs, or publish a degraded “as of 06:00” with a banner. Monitoring DAG success only is how you page the wrong person. Say who owns the extract (analytics vs platform) in the design — that is the real architecture.',
  },
  {
    id: 'beh-cost',
    track: 'behavioral',
    title: 'A cost number you owned',
    prompt: 'Tell a story where you changed a warehouse bill. Use numbers.',
    answer:
      'STAR: situation (idle XL, $N/month), task (cut 30% without missing SLA), action (auto-suspend, stop SELECT *, smaller warehouse + more clustering on date), result ($ and query p95). If you do not have a dollar figure, use credit-hours. Vague “I optimized queries” fails. Point at the Snowflake or Databricks calculator as the way you would estimate before changing prod.',
  },
  {
    id: 'beh-incident',
    track: 'behavioral',
    title: 'The load that duplicated Friday',
    prompt: 'A job reran and finance saw 2× GMV. What did you do in the first hour?',
    answer:
      'Stop the DAG, freeze the mart (clone or swap to yesterday), quantify blast radius, tell finance a time for a clean number. Then: unique_key / MERGE, run_id in the audit table, and a test that yesterday’s sum cannot jump 80% without a ticket. Blame the missing idempotency, not “Airflow retried.” Interviewers listen for whether you protected the consumer first.',
  },
  {
    id: 'beh-pushback',
    track: 'behavioral',
    title: 'PM wants real-time; the grain is daily',
    prompt: 'They asked for streaming. The KPI is closed-books daily revenue.',
    answer:
      'Restate the decision the KPI supports. If it is a daily close, streaming is cost and complexity without a user. Offer 1-hour micro-batch as a compromise only if someone will look hourly. Write the cost delta (always-on cluster vs 20-minute batch warehouse). You are not “blocking innovation”; you are refusing to bill idle compute for a slide that updates at 9am.',
  },
  {
    id: 'sql-anti-join',
    track: 'sql',
    title: 'Users who never purchased',
    prompt: 'users and orders. Return users with zero orders.',
    answer:
      'LEFT JOIN … WHERE orders.user_id IS NULL, or NOT EXISTS. NOT IN (SELECT user_id FROM orders) is wrong if user_id is nullable — SQL three-valued logic empties the result. Mention that. EXISTS usually plans better than a DISTINCT anti-join. This is a 90-second question; the nullable NOT IN trap is the signal.',
  },
  {
    id: 'sql-cohort',
    track: 'sql',
    title: 'Month-1 retention from first order',
    prompt: 'For each signup month, % of users who ordered again within 30 days.',
    answer:
      'First-order date per user (MIN), cohort = date_trunc month, retained = exists an order in (first, first+30 days] with a different order_id. Do not use calendar month = next month — that is not 30 days. Watch timezones. Windowed first_value is fine; two aggregations is clearer in a live round.',
  },
  {
    id: 'wh-rbac',
    track: 'warehouse',
    title: 'Role explosion in Snowflake',
    prompt: '80 roles, analysts still grant SELECT to each other in Slack.',
    answer:
      'Role hierarchy: SYSADMIN for objects, security roles for grants, functional roles for people. Future grants on schemas. No ACCOUNTADMIN for humans on Tuesday. Masking policies for PII, not another 80 roles. If they use the Snowflake SQL sheet on this hub, the RBAC section is the map. “We will document it in Confluence” is not a control.',
  },
  {
    id: 'pipe-freshness',
    track: 'pipelines',
    title: 'dbt source freshness that nobody believes',
    prompt: 'Freshness is warn-only. Dashboards are 3 days late. What changes?',
    answer:
      'Make freshness error on the sources that have an SLA, and page on the Airflow task that runs dbt source freshness. A warn in a 400-line log is a diary. Separate “nice to have” sources from the revenue DAG. If the extractor is the bottleneck, freshness on dbt is a liar — monitor the landing table’s max(loaded_at) in the warehouse too.',
  },
  {
    id: 'des-lakehouse',
    track: 'design',
    title: 'Bronze / silver / gold without a religion',
    prompt: 'Draw Medallion for clickstream + orders.',
    answer:
      'Bronze: immutable landed files, original timestamps, no business metrics. Silver: typed, deduped, conformed keys. Gold: grain that a human asked for (daily revenue, funnel). Do not put KPI definitions in bronze. Iceberg/Delta/Snowflake tables are an implementation; the contract is replayability. Call out PII only in a restricted bronze. This site’s lakehouse roadmap is Databricks-shaped; the layers still apply on Snowflake stages.',
  },
  {
    id: 'beh-wrong',
    track: 'behavioral',
    title: 'A time you were wrong about a warehouse size',
    prompt: 'You scaled up. The query still scanned 4 TB. Then what?',
    answer:
      'Admit the size was hiding a full table scan. The fix was a filter on a partition column, a clustering/search key, or a different model grain — not 2XL. Result: credits down, runtime down. The point of the story is that you measured bytes scanned, not that you “know Snowflake.” Use QUERY_HISTORY. A calculator without bytes is a guess.',
  },
  {
    id: 'sql-sessionize',
    track: 'sql',
    title: 'Sessionize events with a 30-minute gap',
    prompt: 'web_events(user_id, ts). Start a new session after 30 minutes of silence.',
    answer:
      'LAG(ts) per user, flag when datediff > 30 minutes, then SUM(flag) OVER (PARTITION BY user ORDER BY ts) as session_id. This is the gaps-and-islands pattern. Do not use a UDF loop. Call out timezone and that “30 minutes” is a product decision. Our playground web_events table is small enough to demo this in the browser.',
  },
];

export function interviewQuestionById(id) {
  return INTERVIEW_QUESTIONS.find((item) => item.id === id) || null;
}

export function isInterviewQuestionFree(index) {
  return index < FREE_QUESTION_LIMIT;
}
