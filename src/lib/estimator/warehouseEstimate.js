// src/lib/estimator/warehouseEstimate.js
// Monthly list-price estimates for one workload on four warehouses. Every
// platform's units are explicit (credits, DBUs, slots, RPUs) and editable;
// the defaults per workload shape match the original comparison calculator
// for Snowflake, Databricks and BigQuery.
import { PLATFORM_ORDER, WAREHOUSE_PRICING as P } from '../../data/warehousePricing.js';

export const SHAPES = {
  light: { label: 'Light (ad-hoc, small)', sfCreditsPerHour: 2, dbxDBUsPerHour: 2, bqSlots: 100, rsRPUs: 8 },
  mixed: { label: 'Mixed (dashboards and ETL)', sfCreditsPerHour: 4, dbxDBUsPerHour: 4, bqSlots: 200, rsRPUs: 16 },
  heavy: { label: 'Heavy (large ETL or ML)', sfCreditsPerHour: 8, dbxDBUsPerHour: 8, bqSlots: 400, rsRPUs: 32 },
};

export const DEFAULT_INPUTS = { tb: 50, hours: 160, storageGB: 500, shape: 'mixed' };

const num = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback);

/** Units per hour: the shape's defaults, overridden by any explicit value. */
export function resolveUnits(inputs) {
  const shape = SHAPES[inputs.shape] || SHAPES.mixed;
  return {
    sfCreditsPerHour: num(inputs.sfCreditsPerHour, shape.sfCreditsPerHour),
    dbxDBUsPerHour: num(inputs.dbxDBUsPerHour, shape.dbxDBUsPerHour),
    bqSlots: num(inputs.bqSlots, shape.bqSlots),
    rsRPUs: num(inputs.rsRPUs, shape.rsRPUs),
  };
}

export function estimateAll(rawInputs) {
  const inputs = { ...DEFAULT_INPUTS, ...rawInputs };
  const tb = num(inputs.tb, 0);
  const hours = num(inputs.hours, 0);
  const gb = num(inputs.storageGB, 0);
  const u = resolveUnits(inputs);

  const credits = u.sfCreditsPerHour * hours;
  const sfCompute = credits * P.snowflake.creditPrice;
  const sfServices = sfCompute * P.snowflake.cloudServicesBillableShare;
  const dbus = u.dbxDBUsPerHour * hours;
  const bqOnDemand = tb * P.bigquery.onDemandPerTB;
  const bqEditions = u.bqSlots * hours * P.bigquery.editionsPerSlotHour;
  const bqMode = bqOnDemand <= bqEditions ? 'on-demand' : 'Editions';
  const rpuHours = u.rsRPUs * hours;

  const rows = {
    snowflake: {
      compute: sfCompute,
      storage: gb * P.snowflake.storagePerGB,
      other: sfServices,
      units: `${credits.toLocaleString('en-US')} credits`,
      formula: `${u.sfCreditsPerHour} credits/h × ${hours} h × $${P.snowflake.creditPrice} + ${gb} GB × $${P.snowflake.storagePerGB} + cloud services ${P.snowflake.cloudServicesBillableShare * 100}% of compute`,
    },
    databricks: {
      compute: dbus * P.databricks.dbuPrice,
      storage: gb * P.databricks.storagePerGB,
      other: 0,
      units: `${dbus.toLocaleString('en-US')} DBUs`,
      formula: `${u.dbxDBUsPerHour} DBU/h × ${hours} h × $${P.databricks.dbuPrice} + ${gb} GB × $${P.databricks.storagePerGB}`,
    },
    bigquery: {
      compute: Math.min(bqOnDemand, bqEditions),
      storage: gb * P.bigquery.storagePerGB,
      other: 0,
      units: bqMode === 'on-demand' ? `${tb} TB scanned (on-demand)` : `${(u.bqSlots * hours).toLocaleString('en-US')} slot-hours (Editions)`,
      formula: `lower of ${tb} TB × $${P.bigquery.onDemandPerTB} and ${u.bqSlots} slots × ${hours} h × $${P.bigquery.editionsPerSlotHour}, + ${gb} GB × $${P.bigquery.storagePerGB}`,
    },
    redshift: {
      compute: rpuHours * P.redshift.rpuHourPrice,
      storage: gb * P.redshift.storagePerGB,
      other: 0,
      units: `${rpuHours.toLocaleString('en-US')} RPU-hours`,
      formula: `${u.rsRPUs} RPU × ${hours} h × $${P.redshift.rpuHourPrice} + ${gb} GB × $${P.redshift.storagePerGB}`,
    },
  };

  const results = PLATFORM_ORDER.map((id) => {
    const r = rows[id];
    return { id, label: P[id].label, ...r, total: r.compute + r.storage + r.other };
  });
  const lowest = results.reduce((a, b) => (b.total < a.total ? b : a));
  return { results, lowestId: lowest.id, units: u };
}
