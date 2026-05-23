import type { OCDSReleasePackage } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { fetchJson, sleep } from "../http";
import { withBackoff } from "../backoff";

const BASE =
  "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";

export const ftsAdapter: SourceAdapter = {
  source: "fts",

  async *fetchReleases(window: IngestWindow) {
    let url: string | null =
      `${BASE}?limit=100&updatedFrom=${encodeURIComponent(window.from.toISOString())}&updatedTo=${encodeURIComponent(window.to.toISOString())}`;
    let pages = 0;

    while (url && pages < 200) {
      const pkg = await withBackoff(() =>
        fetchJson<OCDSReleasePackage & { links?: { next?: string } }>(url!),
      );
      const releases = pkg.releases ?? [];
      if (releases.length > 0) yield releases;

      const next =
        (pkg.links as { next?: string })?.next ??
        (pkg as { links?: { next?: string } }).links?.next;
      url = next ?? null;
      pages++;
      await sleep(800);
    }
  },
};
