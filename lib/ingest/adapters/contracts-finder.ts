import type { OCDSReleasePackage } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { fetchJson, sleep } from "../http";
import { withBackoff } from "../backoff";
import { format } from "date-fns";

const BASE =
  "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";

export const contractsFinderAdapter: SourceAdapter = {
  source: "contracts_finder",

  async *fetchReleases(window: IngestWindow) {
    const publishedFrom = format(window.from, "yyyy-MM-dd");
    const publishedTo = format(window.to, "yyyy-MM-dd");
    let url: string | null =
      `${BASE}?publishedFrom=${publishedFrom}&publishedTo=${publishedTo}&limit=100`;
    let pages = 0;

    while (url && pages < 300) {
      const pkg = await withBackoff(() =>
        fetchJson<OCDSReleasePackage & { links?: { next?: string } }>(url!),
      );
      const releases = pkg.releases ?? [];
      if (releases.length > 0) yield releases;

      url = pkg.links?.next ?? null;
      pages++;
      await sleep(600);
    }
  },
};
