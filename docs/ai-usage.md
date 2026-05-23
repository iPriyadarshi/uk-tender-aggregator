# AI usage notes

Tools: **Cursor** (Claude), architecture from trial brief.

## Prompts that produced real output

1. **OCDS normalizer scaffolding**

   > "Given this Contracts Finder OCDS release JSON sample, write a TypeScript function `normalizeRelease(release, source)` that maps to our unified schema with nation, status, CPV codes, and deterministic IDs."

   > -> Produced `lib/ocds/normalize.ts`, `status.ts`, `nation.ts` with manual fixes for edge cases.

2. **FTS pagination**

   > "Find a Tender ocdsReleasePackages returns links.next - implement an async generator adapter with exponential backoff."

   > -> `lib/ingest/adapters/fts.ts`

3. **Dashboard filters**

   > "shadcn-style filter bar for Next.js 14: nation, status, buyer type, CPV sector, value range, URL search params"
   
   > -> `components/dashboard/filters.tsx` (customized styling to teal/Linear aesthetic)

4. **eTendersNI scrape**

   > "No OCDS API for eTendersNI — parse public contract list HTML into minimal OCDS-shaped releases, respect robots.txt"

   > -> `lib/ingest/adapters/etenders-ni.ts`

5. **Drizzle schema**

   > "Postgres schema for opportunities, buyers, ingestion_runs, dead_letter_queue with tsvector search"

   > -> `lib/db/schema.ts`, `drizzle/0000_init.sql`

6. **README architecture diagram**
   > -> README + this doc set

## Human edits after AI

- Fixed CF `links.next` cursor URL handling
- Sell2Wales fallback when API returns SQL errors
- Nation resolver priority for cross-border buyers
- Removed unused `or` import; industry filter uses CPV prefix match
