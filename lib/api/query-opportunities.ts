import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { OpportunityFilters } from "./filters";
import { CPV_SECTORS } from "@/lib/ocds/cpv";

/** `db.execute` returns an array (postgres-js) or `{ rows }` (neon-http). */
function rowsFromExecute<T extends Record<string, unknown>>(
  result: unknown,
): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

export async function queryOpportunities(filters: OpportunityFilters) {
  const db = getDb();
  const conditions: SQL[] = [];

  if (filters.nation) {
    conditions.push(eq(schema.opportunities.nation, filters.nation));
  }
  if (filters.status) {
    conditions.push(eq(schema.opportunities.status, filters.status));
  }
  if (filters.buyerType) {
    conditions.push(eq(schema.opportunities.buyerType, filters.buyerType));
  }
  if (filters.valueMin != null) {
    conditions.push(
      gte(schema.opportunities.valueAmount, String(filters.valueMin)),
    );
  }
  if (filters.valueMax != null) {
    conditions.push(
      lte(schema.opportunities.valueAmount, String(filters.valueMax)),
    );
  }
  if (filters.deadlineFrom) {
    conditions.push(
      gte(schema.opportunities.deadlineAt, new Date(filters.deadlineFrom)),
    );
  }
  if (filters.deadlineTo) {
    conditions.push(
      lte(schema.opportunities.deadlineAt, new Date(filters.deadlineTo)),
    );
  }
  if (filters.q) {
    conditions.push(
      sql`${schema.opportunities.contentTsv} @@ plainto_tsquery('english', ${filters.q})`,
    );
  }
  if (filters.industry) {
    const prefix = Object.entries(CPV_SECTORS).find(
      ([, label]) => label === filters.industry,
    )?.[0];
    if (prefix) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM unnest(${schema.opportunities.industryCodes}) AS code
          WHERE code LIKE ${prefix + "%"}
        )`,
      );
    } else {
      conditions.push(
        sql`${filters.industry} = ANY(${schema.opportunities.industryLabels})`,
      );
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const sortCol =
    filters.sort === "deadline"
      ? schema.opportunities.deadlineAt
      : filters.sort === "value"
        ? schema.opportunities.valueAmount
        : schema.opportunities.publishedAt;

  const orderFn = filters.order === "asc" ? asc : desc;
  const offset = (filters.page - 1) * filters.pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(schema.opportunities)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(filters.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.opportunities)
      .where(where),
  ]);

  return {
    data: rows,
    total: countResult[0]?.count ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getOpportunityById(id: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.opportunities)
    .where(eq(schema.opportunities.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getStats() {
  const db = getDb();
  const [byNation, byStatus, timeline, valueBuckets, ingestion, total] =
    await Promise.all([
      db
        .select({
          nation: schema.opportunities.nation,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.opportunities)
        .groupBy(schema.opportunities.nation),
      db
        .select({
          status: schema.opportunities.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.opportunities)
        .groupBy(schema.opportunities.status),
      db.execute(sql`
        SELECT date_trunc('day', published_at) AS day, count(*)::int AS count
        FROM opportunities
        WHERE published_at >= now() - interval '30 days'
        GROUP BY 1 ORDER BY 1
      `),
      db.execute(sql`
        SELECT
          CASE
            WHEN value_amount IS NULL THEN 'Unknown'
            WHEN value_amount < 50000 THEN 'Under £50k'
            WHEN value_amount < 250000 THEN '£50k–£250k'
            WHEN value_amount < 1000000 THEN '£250k–£1M'
            ELSE 'Over £1M'
          END AS bucket,
          count(*)::int AS count
        FROM opportunities
        GROUP BY 1
      `),
      db
        .select()
        .from(schema.ingestionRuns)
        .orderBy(desc(schema.ingestionRuns.startedAt))
        .limit(10),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.opportunities),
    ]);

  return {
    total: total[0]?.count ?? 0,
    byNation,
    byStatus,
    timeline: rowsFromExecute<{ day: string; count: number }>(timeline),
    valueBuckets: rowsFromExecute<{ bucket: string; count: number }>(
      valueBuckets,
    ),
    ingestion,
  };
}
