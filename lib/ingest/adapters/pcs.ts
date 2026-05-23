import type { OCDSReleasePackage } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { fetchJson, sleep } from "../http";
import { withBackoff } from "../backoff";
const BASE = "https://api.publiccontractsscotland.gov.uk/v1/Notices";

export const pcsAdapter: SourceAdapter = {
  source: "pcs",

  async *fetchReleases(window: IngestWindow) {
    const months = enumerateMonths(window.from, window.to);
    for (const dateFrom of months) {
      const url = `${BASE}?dateFrom=${dateFrom}`;
      try {
        const pkg = await withBackoff(() => fetchJson<OCDSReleasePackage>(url));
        const releases = pkg.releases ?? [];
        if (releases.length > 0) yield releases;
      } catch (e) {
        console.warn(`PCS fetch failed for ${dateFrom}:`, e);
      }
      await sleep(1000);
    }
  },
};

function enumerateMonths(from: Date, to: Date): string[] {
  const months: string[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= end) {
    const mm = String(cur.getMonth() + 1).padStart(2, "0");
    months.push(`${mm}-${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}
