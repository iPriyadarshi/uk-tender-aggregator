# Metrics summary

| Metric                  | Value                 |
| ----------------------- | --------------------- |
| **Total opportunities** | 14479                 |
| **Date range**          | 23Apr2026 - 23May2026 |

## By nation

| Nation     | Count |
| ---------- | ----- |
| England    | 3581  |
| Scotland   | 193   |
| Wales + NI | 25    |
| UK-wide    | 10680 |

## By source

| Source           | Fetched | Upserted | Last status                               |
| ---------------- | ------- | -------- | ----------------------------------------- |
| fts              | 10681   | 10681    | Completed                                 |
| contracts_finder | 3617    | 3617     | Completed                                 |
| pcs              | 172     | 172      | Completed                                 |
| sell2wales       | 10      | 10       | Completed                                 |
| etenders_ni      | 0       | 0        | Now scraped via EPPS HTTP + self-hosted OCR CAPTCHA (re-run to populate) |

## Freshness

- Daily GitHub Actions schedule: `0 3 * * *` UTC -> `scripts/backfill.ts --days=2`
- Incremental overlap: 2-day window prevents gaps between daily runs
- Ingestion history: query `ingestion_runs` or view `stats.ingestion` from `/api/stats`

## Data quality checks

- [x] Deterministic IDs stable across re-ingest
- [x] ISO 8601 dates in DB
- [x] GBP values with numeric amounts
- [x] Dedup: no duplicate `ocid` from lower-priority source
- [x] Full-text search returns relevant titles
