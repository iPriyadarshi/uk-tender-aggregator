# Metrics summary — Project B (one-pager template)

Fill after running `npm run ingest:backfill -- --days=30`:

| Metric                  | Value                                       |
| ----------------------- | ------------------------------------------- |
| **Total opportunities** | _run: `SELECT count(*) FROM opportunities`_ |
| **Date range**          | Last 30 days backfill                       |
| **Last ingestion**      | _see dashboard ingestion panel_             |

## By nation

| Nation           | Count |
| ---------------- | ----- |
| England          |       |
| Scotland         |       |
| Wales            |       |
| Northern Ireland |       |
| UK-wide          |       |

## By source

| Source           | Fetched | Upserted | Last status |
| ---------------- | ------- | -------- | ----------- |
| fts              |         |          |             |
| contracts_finder |         |          |             |
| pcs              |         |          |             |
| sell2wales       |         |          |             |
| etenders_ni      |         |          |             |

## Freshness

- Daily cron: `0 3 * * *` UTC → `GET /api/cron/ingest?days=1`
- Incremental overlap: 1-day window prevents gaps

## Data quality checks

- [x] Deterministic IDs stable across re-ingest
- [x] ISO 8601 dates in DB
- [x] GBP values with numeric amounts
- [x] Dedup: no duplicate `ocid` from lower-priority source
- [x] Full-text search returns relevant titles
