# Portal coverage matrix

## Tier 1 — Primary (required)

| Portal                    | URL                            | Nation           | Status      | Notes                                                  |
| ------------------------- | ------------------------------ | ---------------- | ----------- | ------------------------------------------------------ |
| Find a Tender             | find-tender.service.gov.uk     | UK / England     | Implemented | OCDS `ocdsReleasePackages`, paginated via `links.next` |
| Contracts Finder          | contractsfinder.service.gov.uk | England          | Implemented | OCDS search with cursor pagination                     |
| Public Contracts Scotland | publiccontractsscotland.gov.uk | Scotland         | Implemented | Monthly `dateFrom=MM-YYYY` batches                     |
| Sell2Wales                | sell2wales.gov.wales           | Wales            | Not Fully Implemented | API + bulk JSON fallback when API errors               |
| eTendersNI                | etendersni.gov.uk              | Northern Ireland | Not Fully Implemented | Public list HTML parse; Needs captcha bypass |

## Threshold coverage

- **Above threshold:** FTS (post-Brexit UK-wide)
- **Below threshold:** Contracts Finder (England), PCS (Scotland), Sell2Wales (Wales), FTS (many below-threshold from Feb 2025)
- **Northern Ireland:** eTendersNI + references on FTS where published

## Known limitations

1. **eTendersNI:** Full tender documents require supplier registration - we ingest list metadata only.
2. **Sell2Wales API:** Intermittent 500 errors — fallback bulk download path used.
3. **Council portals (Proactis, In-Tend, Delta):** Opportunities appear on FTS/CF first; direct portal scrape not required for core scope (stretch: metadata enrichment via notice links).

## Deduplication priority

When the same `ocid` appears in multiple sources: FTS > nation portal (PCS/Sell2Wales) > Contracts Finder.
