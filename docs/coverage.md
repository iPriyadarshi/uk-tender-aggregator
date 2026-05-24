# Portal coverage matrix

## Tier 1 - Primary (required)

| Portal                    | URL                            | Nation           | Status      | Notes                                                  |
| ------------------------- | ------------------------------ | ---------------- | ----------- | ------------------------------------------------------ |
| Find a Tender             | find-tender.service.gov.uk     | UK / England     | Implemented | OCDS `ocdsReleasePackages`, paginated via `links.next` |
| Contracts Finder          | contractsfinder.service.gov.uk | England          | Implemented | OCDS search with cursor pagination                     |
| Public Contracts Scotland | publiccontractsscotland.gov.uk | Scotland         | Implemented | Monthly `dateFrom=MM-YYYY` batches                     |
| Sell2Wales                | sell2wales.gov.wales           | Wales            | Implemented | HTML scrape; robots.txt respected                      |
| eTendersNI                | etendersni.gov.uk              | Northern Ireland | Implemented | Playwright scrape; optional 2Captcha via env key       |
| Proactis (ProContract)    | procontract.due-north.com      | England          | Implemented | HTML scrape; robots.txt respected                      |

## Threshold coverage

- **Above threshold:** FTS (post-Brexit UK-wide)
- **Below threshold:** Contracts Finder (England), PCS (Scotland), Sell2Wales (Wales), FTS (many below-threshold from Feb 2025)
- **Northern Ireland:** eTendersNI + references on FTS where published

## Known limitations

1. **eTendersNI:** We ingest list metadata only; CAPTCHA solving requires `TWOCAPTCHA_API_KEY` and does not bypass login.
2. **Sell2Wales:** HTML changes can break the scrape; no stable API available.
3. **Council portals (In-Tend, Delta):** Opportunities appear on FTS/CF first; direct portal scrape not required for core scope (stretch: metadata enrichment via notice links).

### Council portal limitations

| Portal                        | Common use by councils              | Limitation                                                            | Impact on coverage                            |
| ----------------------------- | ----------------------------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| In-Tend                       | Many English local authorities      | Requires account for full detail; inconsistent public list metadata   | Only public summaries available without login |
| Delta eSourcing               | Scottish councils, some English     | Session-based access; public listings lack stable IDs                 | Hard to dedupe; may miss attachments          |
| ProContract (Council variant) | Some councils, housing associations | Often mirrors FTS/CF notices; portal structure varies by tenant       | Not required for core scope; enrichment only  |
| The Chest                     | North West councils                 | Public list is thin; attachments often gated behind login             | Limited fields; no direct doc ingest          |
| YORtender                     | Yorkshire councils                  | Robot rules frequently block; HTML layout changes across tenant sites | Scrape break risk; fallback to FTS/CF         |
| Tenderbase                    | Cheshire East Council               | Requires signup                                                       | Not required for core scope; enrichment only  |

## Deduplication priority

When the same `ocid` appears in multiple sources: FTS > PCS/Sell2Wales > eTendersNI > Contracts Finder.
