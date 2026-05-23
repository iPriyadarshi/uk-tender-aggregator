CREATE TYPE "public"."nation" AS ENUM('england', 'scotland', 'wales', 'northern_ireland', 'uk');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('fts', 'contracts_finder', 'pcs', 'sell2wales', 'etenders_ni');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('planning', 'active', 'award', 'complete', 'cancelled', 'unknown');--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"identifier_scheme" text,
	"identifier_id" text,
	"address" jsonb,
	"nation" "nation",
	"buyer_type" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dead_letter_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"source" "source" NOT NULL,
	"payload" jsonb,
	"error" text NOT NULL,
	"attempts" integer DEFAULT 1,
	"last_attempt_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"source" "source" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"records_fetched" integer DEFAULT 0,
	"records_upserted" integer DEFAULT 0,
	"errors" jsonb,
	"status" text DEFAULT 'running' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"ocid" text,
	"source" "source" NOT NULL,
	"nation" "nation" DEFAULT 'uk' NOT NULL,
	"region" text,
	"title" text NOT NULL,
	"description" text,
	"status" "opportunity_status" DEFAULT 'unknown' NOT NULL,
	"procedure_type" text,
	"industry_codes" text[],
	"industry_labels" text[],
	"value_amount" numeric(18, 2),
	"value_currency" text DEFAULT 'GBP',
	"value_min" numeric(18, 2),
	"value_max" numeric(18, 2),
	"published_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"award_date" timestamp with time zone,
	"buyer_id" text,
	"buyer_name" text,
	"buyer_type" text,
	"source_url" text,
	"documents" jsonb,
	"raw_ocds" jsonb,
	"content_tsv" "tsvector",
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opportunities_nation_idx" ON "opportunities" USING btree ("nation");--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "opportunities_published_idx" ON "opportunities" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "opportunities_deadline_idx" ON "opportunities" USING btree ("deadline_at");--> statement-breakpoint
CREATE INDEX "opportunities_source_idx" ON "opportunities" USING btree ("source");--> statement-breakpoint
CREATE INDEX "opportunities_ocid_idx" ON "opportunities" USING btree ("ocid");