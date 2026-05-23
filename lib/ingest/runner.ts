import { sql, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { normalizeRelease } from "@/lib/ocds/normalize";
import type { OCDSRelease } from "@/lib/ocds/types";
import type { SourceAdapter, IngestWindow } from "./types";
import { SOURCE_PRIORITY } from "./types";
import { runId, dlqId } from "@/lib/ocds/id";
import type { Source } from "@/lib/db/schema";

const adapters: SourceAdapter[] = [];

export function registerAdapter(adapter: SourceAdapter) {
  adapters.push(adapter);
}

export async function runIngestion(
  sources?: Source[],
  window?: IngestWindow,
): Promise<
  Record<Source, { fetched: number; upserted: number; errors: string[] }>
> {
  const db = getDb();
  const to = window?.to ?? new Date();
  const from =
    window?.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ingestWindow: IngestWindow = { from, to };

  const results = {} as Record<
    Source,
    { fetched: number; upserted: number; errors: string[] }
  >;

  const selected = sources
    ? adapters.filter((a) => sources.includes(a.source))
    : adapters;

  for (const adapter of selected) {
    const runRecordId = runId(adapter.source);
    const errors: string[] = [];
    let fetched = 0;
    let upserted = 0;

    await db.insert(schema.ingestionRuns).values({
      id: runRecordId,
      source: adapter.source,
      startedAt: new Date(),
      status: "running",
      recordsFetched: 0,
      recordsUpserted: 0,
    });

    try {
      for await (const batch of adapter.fetchReleases(ingestWindow)) {
        fetched += batch.length;
        for (const release of batch) {
          try {
            const didUpsert = await upsertRelease(release, adapter.source);
            if (didUpsert) upserted++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(msg);
            await db.insert(schema.deadLetterQueue).values({
              id: dlqId(),
              source: adapter.source,
              payload: release as object,
              error: msg,
            });
          }
        }
      }

      await db
        .update(schema.ingestionRuns)
        .set({
          finishedAt: new Date(),
          status: errors.length ? "completed_with_errors" : "completed",
          recordsFetched: fetched,
          recordsUpserted: upserted,
          errors: errors.length ? errors.slice(0, 20) : null,
        })
        .where(eq(schema.ingestionRuns.id, runRecordId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      await db
        .update(schema.ingestionRuns)
        .set({
          finishedAt: new Date(),
          status: "failed",
          recordsFetched: fetched,
          recordsUpserted: upserted,
          errors,
        })
        .where(eq(schema.ingestionRuns.id, runRecordId));
    }

    results[adapter.source] = { fetched, upserted, errors };
  }

  return results;
}

async function upsertRelease(
  release: OCDSRelease,
  source: Source,
): Promise<boolean> {
  const db = getDb();
  const { opportunity, buyer } = normalizeRelease(release, source);

  if (buyer) {
    await db
      .insert(schema.buyers)
      .values({
        id: buyer.id,
        name: buyer.name,
        identifierScheme: buyer.identifierScheme,
        identifierId: buyer.identifierId,
        address: buyer.address,
        nation: buyer.nation,
        buyerType: buyer.buyerType,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.buyers.id,
        set: {
          name: buyer.name,
          updatedAt: new Date(),
        },
      });
  }

  if (opportunity.ocid) {
    const existing = await db
      .select({
        id: schema.opportunities.id,
        source: schema.opportunities.source,
      })
      .from(schema.opportunities)
      .where(eq(schema.opportunities.ocid, opportunity.ocid))
      .limit(1);

    if (existing[0]) {
      const existingPriority = SOURCE_PRIORITY[existing[0].source];
      const newPriority = SOURCE_PRIORITY[source];
      if (newPriority < existingPriority) {
        return false;
      }
    }
  }

  const searchText = [
    opportunity.title,
    opportunity.description,
    opportunity.buyerName,
  ]
    .filter(Boolean)
    .join(" ");

  await db
    .insert(schema.opportunities)
    .values({
      id: opportunity.id,
      ocid: opportunity.ocid,
      source: opportunity.source,
      nation: opportunity.nation,
      region: opportunity.region,
      title: opportunity.title,
      description: opportunity.description,
      status: opportunity.status,
      procedureType: opportunity.procedureType,
      industryCodes: opportunity.industryCodes,
      industryLabels: opportunity.industryLabels,
      valueAmount: opportunity.valueAmount,
      valueCurrency: opportunity.valueCurrency,
      valueMin: opportunity.valueMin,
      valueMax: opportunity.valueMax,
      publishedAt: opportunity.publishedAt,
      deadlineAt: opportunity.deadlineAt,
      awardDate: opportunity.awardDate,
      buyerId: opportunity.buyerId,
      buyerName: opportunity.buyerName,
      buyerType: opportunity.buyerType,
      sourceUrl: opportunity.sourceUrl,
      documents: opportunity.documents,
      rawOcds: opportunity.rawOcds,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.opportunities.id,
      set: {
        title: opportunity.title,
        description: opportunity.description,
        status: opportunity.status,
        valueAmount: opportunity.valueAmount,
        deadlineAt: opportunity.deadlineAt,
        sourceUrl: opportunity.sourceUrl,
        rawOcds: opportunity.rawOcds,
        updatedAt: new Date(),
      },
    });

  await db.execute(
    sql`UPDATE opportunities SET content_tsv = to_tsvector('english', ${searchText}) WHERE id = ${opportunity.id}`,
  );

  return true;
}
