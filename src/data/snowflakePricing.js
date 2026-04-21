// src/data/snowflakePricing.js
// Public Snowflake pricing data — updated April 2026.
// Source: https://www.snowflake.com/en/data-cloud/pricing-options/
// Prices are per-credit (compute) in USD and per-TB-month (storage).
// These are list prices; enterprise contracts often see 20-40% discounts.

export const EDITIONS = [
  { id: 'standard', label: 'Standard', multiplier: 1.0 },
  { id: 'enterprise', label: 'Enterprise', multiplier: 1.5 },
  { id: 'business-critical', label: 'Business Critical', multiplier: 2.0 },
  { id: 'vps', label: 'VPS (Virtual Private Snowflake)', multiplier: 2.5 },
];

// Credit price (USD) for Standard edition, by region.
// Other editions scale via EDITIONS[].multiplier.
export const REGIONS = [
  { id: 'aws-us-east', label: 'AWS US East (N. Virginia)', creditPrice: 2.0, storagePerTB: 23, storageCapacityPerTB: 40 },
  { id: 'aws-us-west', label: 'AWS US West (Oregon)', creditPrice: 2.0, storagePerTB: 23, storageCapacityPerTB: 40 },
  { id: 'aws-eu', label: 'AWS EU (Ireland/Frankfurt)', creditPrice: 2.6, storagePerTB: 24.5, storageCapacityPerTB: 42.5 },
  { id: 'aws-ap', label: 'AWS Asia Pacific (Singapore/Tokyo)', creditPrice: 2.9, storagePerTB: 25, storageCapacityPerTB: 45 },
  { id: 'azure-us-east', label: 'Azure US East 2', creditPrice: 2.0, storagePerTB: 23, storageCapacityPerTB: 40 },
  { id: 'azure-eu', label: 'Azure West Europe', creditPrice: 2.6, storagePerTB: 24.5, storageCapacityPerTB: 42.5 },
  { id: 'gcp-us', label: 'GCP US Central', creditPrice: 2.0, storagePerTB: 23, storageCapacityPerTB: 40 },
  { id: 'gcp-eu', label: 'GCP Europe West', creditPrice: 2.6, storagePerTB: 24.5, storageCapacityPerTB: 42.5 },
];

// Warehouse credits consumed per hour (doubles with each T-shirt size).
export const WAREHOUSE_SIZES = [
  { id: 'xs', label: 'X-Small (XS)', creditsPerHour: 1 },
  { id: 's', label: 'Small (S)', creditsPerHour: 2 },
  { id: 'm', label: 'Medium (M)', creditsPerHour: 4 },
  { id: 'l', label: 'Large (L)', creditsPerHour: 8 },
  { id: 'xl', label: 'X-Large (XL)', creditsPerHour: 16 },
  { id: '2xl', label: '2X-Large (2XL)', creditsPerHour: 32 },
  { id: '3xl', label: '3X-Large (3XL)', creditsPerHour: 64 },
  { id: '4xl', label: '4X-Large (4XL)', creditsPerHour: 128 },
  { id: '5xl', label: '5X-Large (5XL)', creditsPerHour: 256 },
  { id: '6xl', label: '6X-Large (6XL)', creditsPerHour: 512 },
];

// Serverless / managed feature pricing
export const SERVERLESS = {
  snowpipe: { creditsPerFile: 0.06, label: 'Snowpipe (continuous ingest)' },
  cortexAI: { creditsPerMillionTokens: 3.0, label: 'Cortex AI (LLM inference)' },
  autoClustering: { multiplier: 1.0, label: 'Auto-Clustering (reclustering credits)' },
};

// Cloud Services billing: only compute-hours exceeding 10% of warehouse compute are billed
export const CLOUD_SERVICES_FREE_THRESHOLD = 0.10;

export const DEFAULT_INPUTS = {
  editionId: 'enterprise',
  regionId: 'aws-us-east',
  sizeId: 'm',
  hoursPerDay: 8,
  daysPerMonth: 22,
  clusters: 1,
  storageGB: 500,
  cloudServicesPct: 12,
  enableSnowpipe: false,
  snowpipeFilesPerDay: 1000,
  enableCortex: false,
  cortexTokensPerMonth: 10,
  enableAutoClustering: false,
  autoClusteringCreditsPerDay: 2,
  storageTier: 'onDemand', // or 'capacity'
};

/**
 * Pure calculation function. Given inputs, returns a breakdown.
 * Safe with zero/edge values (no NaN).
 */
export function calculateCost(inputs) {
  const edition = EDITIONS.find(e => e.id === inputs.editionId) || EDITIONS[1];
  const region = REGIONS.find(r => r.id === inputs.regionId) || REGIONS[0];
  const size = WAREHOUSE_SIZES.find(s => s.id === inputs.sizeId) || WAREHOUSE_SIZES[2];

  const creditPrice = region.creditPrice * edition.multiplier;

  // Compute credits: size × hours × days × clusters
  const computeHours = Math.max(0, inputs.hoursPerDay) * Math.max(0, inputs.daysPerMonth);
  const computeCredits = size.creditsPerHour * computeHours * Math.max(1, inputs.clusters);
  const computeCost = computeCredits * creditPrice;

  // Storage
  const storageRate = inputs.storageTier === 'capacity' ? region.storageCapacityPerTB : region.storagePerTB;
  const storageTB = Math.max(0, inputs.storageGB) / 1000;
  const storageCost = storageTB * storageRate;

  // Cloud Services — only portion above 10% threshold is billed
  const cloudServicesCreditsTotal = computeCredits * (Math.max(0, inputs.cloudServicesPct) / 100);
  const freeCloudServices = computeCredits * CLOUD_SERVICES_FREE_THRESHOLD;
  const billableCloudServicesCredits = Math.max(0, cloudServicesCreditsTotal - freeCloudServices);
  const cloudServicesCost = billableCloudServicesCredits * creditPrice;

  // Serverless adders
  let serverlessCost = 0;
  const serverlessBreakdown = [];
  if (inputs.enableSnowpipe) {
    const snowpipeCredits =
      SERVERLESS.snowpipe.creditsPerFile *
      Math.max(0, inputs.snowpipeFilesPerDay) *
      Math.max(0, inputs.daysPerMonth);
    const cost = snowpipeCredits * creditPrice;
    serverlessCost += cost;
    serverlessBreakdown.push({ label: 'Snowpipe ingestion', cost });
  }
  if (inputs.enableCortex) {
    const cortexCredits =
      SERVERLESS.cortexAI.creditsPerMillionTokens * Math.max(0, inputs.cortexTokensPerMonth);
    const cost = cortexCredits * creditPrice;
    serverlessCost += cost;
    serverlessBreakdown.push({ label: 'Cortex AI inference', cost });
  }
  if (inputs.enableAutoClustering) {
    const autoClusterCredits =
      Math.max(0, inputs.autoClusteringCreditsPerDay) * Math.max(0, inputs.daysPerMonth);
    const cost = autoClusterCredits * creditPrice;
    serverlessCost += cost;
    serverlessBreakdown.push({ label: 'Auto-Clustering', cost });
  }

  const totalMonthly = computeCost + storageCost + cloudServicesCost + serverlessCost;
  const totalAnnual = totalMonthly * 12;

  // Savings scenario: what if you downsized one warehouse tier?
  const smallerIdx = Math.max(
    0,
    WAREHOUSE_SIZES.findIndex(s => s.id === inputs.sizeId) - 1
  );
  const smallerSize = WAREHOUSE_SIZES[smallerIdx];
  const smallerMonthly =
    smallerSize.creditsPerHour *
      computeHours *
      Math.max(1, inputs.clusters) *
      creditPrice +
    storageCost +
    cloudServicesCost +
    serverlessCost;
  const potentialSavings = Math.max(0, totalMonthly - smallerMonthly);

  return {
    edition,
    region,
    size,
    creditPrice,
    computeCredits,
    computeCost,
    storageTB,
    storageCost,
    cloudServicesCost,
    serverlessCost,
    serverlessBreakdown,
    totalMonthly,
    totalAnnual,
    potentialSavings,
    smallerSize,
  };
}

export function formatUSD(n) {
  if (!isFinite(n)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n);
}
