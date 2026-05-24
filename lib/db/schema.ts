import {
  pgTable,
  text,
  timestamp,
  numeric,
  jsonb,
  integer,
  pgEnum,
  index,
  customType,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const sourceEnum = pgEnum("source", [
  "fts",
  "contracts_finder",
  "pcs",
  "sell2wales",
  "etenders_ni",
  "proactis",
]);

export const nationEnum = pgEnum("nation", [
  "england",
  "scotland",
  "wales",
  "northern_ireland",
  "uk",
]);

export const statusEnum = pgEnum("opportunity_status", [
  "planning",
  "active",
  "award",
  "complete",
  "cancelled",
  "unknown",
]);

export const buyers = pgTable("buyers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  identifierScheme: text("identifier_scheme"),
  identifierId: text("identifier_id"),
  address: jsonb("address"),
  nation: nationEnum("nation"),
  buyerType: text("buyer_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const opportunities = pgTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    ocid: text("ocid"),
    source: sourceEnum("source").notNull(),
    nation: nationEnum("nation").notNull().default("uk"),
    region: text("region"),
    title: text("title").notNull(),
    description: text("description"),
    status: statusEnum("status").notNull().default("unknown"),
    procedureType: text("procedure_type"),
    industryCodes: text("industry_codes").array(),
    industryLabels: text("industry_labels").array(),
    valueAmount: numeric("value_amount", { precision: 18, scale: 2 }),
    valueCurrency: text("value_currency").default("GBP"),
    valueMin: numeric("value_min", { precision: 18, scale: 2 }),
    valueMax: numeric("value_max", { precision: 18, scale: 2 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    awardDate: timestamp("award_date", { withTimezone: true }),
    buyerId: text("buyer_id").references(() => buyers.id),
    buyerName: text("buyer_name"),
    buyerType: text("buyer_type"),
    sourceUrl: text("source_url"),
    documents:
      jsonb("documents").$type<
        { title?: string; url: string; format?: string }[]
      >(),
    rawOcds: jsonb("raw_ocds"),
    contentTsv: tsvector("content_tsv"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("opportunities_nation_idx").on(t.nation),
    index("opportunities_status_idx").on(t.status),
    index("opportunities_published_idx").on(t.publishedAt),
    index("opportunities_deadline_idx").on(t.deadlineAt),
    index("opportunities_source_idx").on(t.source),
    index("opportunities_ocid_idx").on(t.ocid),
  ],
);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: text("id").primaryKey(),
  source: sourceEnum("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  recordsFetched: integer("records_fetched").default(0),
  recordsUpserted: integer("records_upserted").default(0),
  errors: jsonb("errors").$type<string[]>(),
  status: text("status").notNull().default("running"),
});

export const deadLetterQueue = pgTable("dead_letter_queue", {
  id: text("id").primaryKey(),
  source: sourceEnum("source").notNull(),
  payload: jsonb("payload"),
  error: text("error").notNull(),
  attempts: integer("attempts").default(1),
  lastAttemptAt: timestamp("last_attempt_at", {
    withTimezone: true,
  }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type Buyer = typeof buyers.$inferSelect;
export type Source = (typeof sourceEnum.enumValues)[number];
export type Nation = (typeof nationEnum.enumValues)[number];
export type OpportunityStatus = (typeof statusEnum.enumValues)[number];
