# Portal coverage matrix

## Tier 1 - Primary (required)

| Portal                    | URL                            | Nation           | Status      | Notes                                                  |
| ------------------------- | ------------------------------ | ---------------- | ----------- | ------------------------------------------------------ |
| Find a Tender             | find-tender.service.gov.uk     | UK / England     | Implemented | OCDS `ocdsReleasePackages`, paginated via `links.next` |
| Contracts Finder          | contractsfinder.service.gov.uk | England          | Implemented | OCDS search with cursor pagination                     |
| Public Contracts Scotland | publiccontractsscotland.gov.uk | Scotland         | Implemented | Monthly `dateFrom=MM-YYYY` batches                     |
| Sell2Wales                | sell2wales.gov.wales           | Wales            | Implemented | HTML scrape; robots.txt respected                      |
| eTendersNI                | etendersni.gov.uk              | Northern Ireland | Implemented | Playwright scrape; optional 2Captcha via env key       |

## Threshold coverage

- **Above threshold:** FTS (post-Brexit UK-wide)
- **Below threshold:** Contracts Finder (England), PCS (Scotland), Sell2Wales (Wales), FTS (many below-threshold from Feb 2025)
- **Northern Ireland:** eTendersNI + references on FTS where published

## Known limitations

1. **eTendersNI:** We ingest list metadata only; CAPTCHA solving requires `TWOCAPTCHA_API_KEY` and does not bypass login.
2. **Sell2Wales:** HTML changes can break the scrape; no stable API available.
3. **Council portals (Proactis, In-Tend, Delta):** Opportunities appear on FTS/CF first; direct portal scrape not required for core scope (stretch: metadata enrichment via notice links).

## Deduplication priority

When the same `ocid` appears in multiple sources: FTS > PCS/Sell2Wales > eTendersNI > Contracts Finder.
