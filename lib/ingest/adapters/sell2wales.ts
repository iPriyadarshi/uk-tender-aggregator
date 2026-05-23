import type { OCDSRelease, OCDSReleasePackage } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { fetchJson, ingestFetch, sleep } from "../http";
import { withBackoff } from "../backoff";

const API_BASE = "https://api.sell2wales.gov.wales/v1/Notices";
const DOWNLOAD_BASE =
  "https://www.sell2wales.gov.wales/Notice/Download/Download.aspx";

/** Notice types: 2=contract notice, 3=award, 51=site ITT */
const NOTICE_TYPES = [2, 3, 51, 52];

export const sell2walesAdapter: SourceAdapter = {
  source: "sell2wales",

  async *fetchReleases(window: IngestWindow) {
    const months = enumerateMonths(window.from, window.to);
    for (const dateFrom of months) {
      for (const noticeType of NOTICE_TYPES) {
        const url = `${API_BASE}?dateFrom=${dateFrom}&noticeType=${noticeType}&outputType=0&locale=2057`;
        try {
          const pkg = await withBackoff(() =>
            fetchJson<OCDSReleasePackage>(url),
          );
          const releases = pkg.releases ?? [];
          if (releases.length > 0) yield releases;
        } catch {
          // API is flaky; try bulk JSON download fallback
          const fallback = await tryBulkDownload(dateFrom, noticeType);
          if (fallback.length > 0) yield fallback;
        }
        await sleep(1200);
      }
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

async function tryBulkDownload(
  dateFrom: string,
  noticeType: number,
): Promise<OCDSRelease[]> {
  try {
    const [mm, yyyy] = dateFrom.split("-");
    const res = await ingestFetch(
      `${DOWNLOAD_BASE}?type=JSON&month=${mm}&year=${yyyy}&noticeType=${noticeType}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data as OCDSRelease[];
    if (data.releases) return data.releases as OCDSRelease[];
    return [];
  } catch {
    return [];
  }
}
