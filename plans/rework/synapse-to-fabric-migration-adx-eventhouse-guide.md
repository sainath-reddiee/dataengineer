# Synapse to Fabric Migration: Moving Data Explorer Workloads to Eventhouse

> **Editor notes**
>
> - Changed: dropped "2025" from the title; replaced the opening sales copy with a plain intro; converted the bold `###` headings into a `##`/`###` hierarchy; renamed "Embracing the Future" to "After the migration" and rewrote it without "unlock", "empower", "ahead of the curve"; removed "seamless/seamlessly", "robust", "dive deeper", "This is where the integration shines"; removed em-dashes; fixed the stray text "ADLS Gen2.Code snippet." and moved the `.export` code block next to the step it belongs to; added language tags and short explanations to both code blocks.
> - Links: two "Further reading" links were wrapped in `https://www.google.com/search?q=...`. I unwrapped them to the direct learn.microsoft.com URLs. Several Microsoft links still use `/real-time-analytics/` paths, which Microsoft has been moving to `/real-time-intelligence/`; click each one and update if it redirects or 404s.
> - **Check (naming, high priority):** the post calls the retiring service "Azure Synapse Data Explorer (ADX)". The retirement Microsoft announced is for Synapse Data Explorer pools inside Azure Synapse Analytics. Standalone Azure Data Explorer (ADX) is a separate service and, as far as I know, is not being retired. The original intro and slug blur the two; I have used "Synapse Data Explorer" for the retiring service and kept "ADX" where the post means Kusto commands or the ADX query editor. Please confirm the retirement date and add it with a link to Microsoft's announcement.
> - Check (outdated names): Fabric's "Real-Time Analytics" experience has been renamed "Real-Time Intelligence". The steps also say you create a KQL database and Fabric provisions an Eventhouse inside it; in the current Fabric UI you create an Eventhouse and a KQL database is created inside it. Please walk through the current UI and correct Phase 2, Step 1.
> - Check: the Fabric query URI pattern `https://your-fabric-workspace.kusto.fabric.microsoft.com` (current URIs include an ID and region), the "KQL Database" connector name in Power BI, and whether "Enhanced T-SQL support" overstates Eventhouse's T-SQL subset.
> - Check: the Copilot link points to the consumer site copilot.microsoft.com rather than Copilot in Fabric documentation.
> - Cut: nothing substantive. The closing paragraph was mostly slogans and is now two plain sentences built from the post's own points.

Microsoft has announced the retirement of Synapse Data Explorer, so teams running real-time and log analytics on it need a plan to move to Microsoft Fabric's Real-Time Analytics and its Eventhouse database. This post is for engineers who own those workloads. It walks through the migration in three phases (assess, migrate schema and data, update queries and reports) with the KQL commands you need at each step.

## Why the Synapse to Fabric migration is happening

Microsoft wants a single, integrated platform for all data and analytics workloads, and this migration follows from that. Azure Synapse Analytics, while powerful, was built from a collection of distinct services. Microsoft Fabric brings them together as one SaaS product where [data engineering](https://dataengineerhub.blog/articles), data science and business intelligence share the same workspace.

![Before-and-after architecture diagram: separate Azure Data Explorer services on one side, the integrated Microsoft Fabric Eventhouse setup for real-time analytics on the other](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2025/10/jpeg-optimizer_Designer-1.png?resize=784%2C521)

Eventhouse is the next version of the [Kusto engine](https://learn.microsoft.com/en-us/kusto/query/?view=microsoft-fabric) that powered Data Explorer, now built into Fabric. It's designed for fast querying of streaming and semi-structured data, which makes it the natural successor for your Data Explorer workloads.

### What you get on Fabric Eventhouse

- **OneLake integration:** your data lives in OneLake, a single tenant-wide data lake, which removes data duplication and movement.
- **One interface:** ingestion, querying and Power BI reporting happen in the same UI.
- **T-SQL as well as KQL:** you can query Eventhouse data with both KQL and a wider T-SQL surface.
- **AI features:** [Copilot](https://copilot.microsoft.com/) and the other AI capabilities built into Fabric.

## Phase 1: Assess and plan your migration

Before you move a single byte of data, you need a clear inventory of your current Data Explorer environment.

![Hand-drawn flowchart of the three migration steps from Synapse to Fabric: assess and plan, migrate data, update reports](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2025/10/jpeg-optimizer_Designer.png?resize=744%2C494&ssl=1)

1. **Document your clusters:** list all your clusters, databases and tables.
2. **Analyze ingestion pipelines:** identify every data source. Are you using Event Hubs, IoT Hubs or custom scripts?
3. **Map downstream consumers:** who and what consumes this data? Document every Power BI report, dashboard, Grafana instance and application that queries the cluster.
4. **Export your schema:** you need the schema for every table and function. Use the `.show` and `.get` commands in the ADX query editor to script your objects.

### Example: scripting a table schema

Run this KQL command in your [Azure Data Explorer](https://azure.microsoft.com/en-us/products/data-explorer) query window to get the creation command for a table:

```kql
.get table YourTableName schema as csl
```

This outputs the `.create table` command with all columns, data types and folder/docstring properties. Save the script for each table. Do the same for your functions with `.show function YourFunctionName`.

[ADD YOUR OWN: a screenshot of the output of this command for one of your tables (with names anonymised), so readers know what a good export looks like]

## Phase 2: Migrate the schema and data

With your plan in place, create the new home in Fabric and move your data.

### Step 1: Create a KQL database and Eventhouse in Fabric

1. Open your Microsoft Fabric workspace.
2. Select the **Real-Time Analytics** experience.
3. Create a new **KQL Database**.
4. Within your KQL database, Fabric provisions an **Eventhouse**. This is your primary database for analysis. You can also create [KQL Querysets](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/kusto-query-set?tabs=kql-database), which work like saved collections of queries.

### Step 2: Recreate your schema

Using the scripts you exported in Phase 1, run the `.create table` and `.create function` commands in the query window of your new Fabric KQL database.

### Step 3: Migrate historical data

For historical data, the most effective method is to export from Data Explorer to Parquet files in Azure Data Lake Storage (ADLS) Gen2 and then ingest those files into Fabric.

1. **Export from Data Explorer:** use the `.export` command to push your historical table data to a container in ADLS Gen2:

```kql
.export async to parquet (
    h@"abfss://your-container@your-storage-account.dfs.core.windows.net/path/to/export"
)
<|
YourTableName
```

The command exports one table asynchronously (`async`) as Parquet to the `abfss://` path in brackets. Replace the container, storage account, path and table name with your own.

2. **Ingest into Fabric:** in your Fabric workspace, create a new **Data Pipeline**.
3. Add a **Copy data** activity:
   - **Source:** connect to your [ADLS Gen2 account](https://learn.microsoft.com/en-us/azure/storage/blobs/create-data-lake-storage-account) and point to the exported Parquet files.
   - **Destination:** select "Workspace" and choose your KQL database and target table.
4. Run the pipeline. Fabric handles the ingestion into your Eventhouse table.

[ADD YOUR OWN: how much data you exported, how long the export and the Copy data run took, and any errors you hit along the way]

### Step 4: Re-point streaming ingestion

For ongoing data streams, re-point your Event Hubs or IoT Hubs from the old cluster to your new Fabric Eventstream or the KQL database connection string.

## Phase 3: Update queries and reports

Most KQL queries work in Fabric without changes. The main task here is updating connection strings in downstream tools.

[ADD YOUR OWN: any KQL queries or functions that did not work unchanged on Eventhouse, and what you had to change]

### Connecting Power BI to Fabric Eventhouse

This is where having everything in one platform pays off:

1. Open Power BI Desktop.
2. Click **Get Data**.
3. Search for the **KQL Database** connector.
4. Instead of a cluster URI, you get a simple dialog to select your Fabric workspace and the KQL database.
5. Select **DirectQuery** for real-time analysis.

Your existing Power BI data models and DAX measures should keep working once the connection is updated.

### Updating an application connection

If you have an application using the [ADX SDK](https://learn.microsoft.com/en-us/kusto/api/?view=microsoft-fabric), update its connection string:

- **Old Data Explorer connection string:** `https://youradxcluster.kusto.windows.net`
- **New Fabric KQL database connection string:** `https://your-fabric-workspace.kusto.fabric.microsoft.com`

You can find the exact query URI in the Fabric portal on your KQL database's details page.

## After the migration

Finishing the Synapse to Fabric migration is a technical task with a practical payoff: your real-time workloads, reporting and AI features sit in one platform instead of several. Start planning now.

## Further reading and official resources

1. [Official Microsoft documentation: Migrate to Real-Time Analytics in Fabric](https://learn.microsoft.com/en-us/fabric/real-time-analytics/migrate-from-adx)
2. [Microsoft Fabric Real-Time Analytics overview](https://learn.microsoft.com/en-us/fabric/real-time-analytics/overview)
3. [Quickstart: Create a KQL database](https://learn.microsoft.com/en-us/fabric/real-time-analytics/create-database)
4. [Get data into a KQL database](https://learn.microsoft.com/en-us/fabric/real-time-analytics/get-data-overview)
5. [OneLake, the OneDrive for data](https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview)
6. [Microsoft Fabric Community forum](https://community.fabric.microsoft.com/)
