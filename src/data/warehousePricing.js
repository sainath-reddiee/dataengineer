// src/data/warehousePricing.js
// List prices used by the warehouse cost estimator v2, each with its source
// and the date it was last checked. The older calculators keep their own
// copies; scripts/verifyWarehousePricing.js fails if any of them drift from
// the numbers here. All prices are USD list prices before discounts.

export const WAREHOUSE_PRICING = {
  snowflake: {
    label: 'Snowflake',
    region: 'AWS US East (N. Virginia), Enterprise edition',
    creditPrice: 3, // $2 Standard x 1.5 Enterprise multiplier (src/data/snowflakePricing.js)
    storagePerGB: 0.023, // on-demand $23 per TB-month
    cloudServicesBillableShare: 0.02, // ~12% of compute minus the 10% daily free allowance
    source: { title: 'Snowflake pricing', url: 'https://www.snowflake.com/en/pricing-options/' },
    verifiedOn: '2026-04-01',
  },
  databricks: {
    label: 'Databricks',
    region: 'Premium tier, SQL Pro compute (average across clouds)',
    dbuPrice: 0.55,
    storagePerGB: 0.023, // object storage billed by the cloud provider
    source: { title: 'Databricks SQL pricing', url: 'https://www.databricks.com/product/pricing/databricks-sql' },
    verifiedOn: '2026-04-01',
  },
  bigquery: {
    label: 'BigQuery',
    region: 'US multi-region',
    onDemandPerTB: 6.25,
    editionsPerSlotHour: 0.06, // Enterprise edition
    storagePerGB: 0.02, // active logical storage
    source: { title: 'BigQuery pricing', url: 'https://cloud.google.com/bigquery/pricing' },
    verifiedOn: '2026-04-01',
  },
  redshift: {
    label: 'Redshift Serverless',
    region: 'US East (N. Virginia)',
    rpuHourPrice: 0.375,
    storagePerGB: 0.024, // Redshift Managed Storage per GB-month
    source: { title: 'Amazon Redshift pricing', url: 'https://aws.amazon.com/redshift/pricing/' },
    verifiedOn: '2026-10-17',
  },
};

export const PLATFORM_ORDER = ['snowflake', 'databricks', 'bigquery', 'redshift'];
