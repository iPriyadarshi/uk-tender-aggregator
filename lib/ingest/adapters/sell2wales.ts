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
        try {
          const pkg = await fetchWithDateFromCandidates(dateFrom, noticeType);
          // API returns OCDS ReleasePackage format with releases array
          if (pkg && Array.isArray(pkg.releases) && pkg.releases.length > 0) {
            yield pkg.releases;
          }
        } catch (e) {
          console.error(
            `[sell2wales] Error fetching ${dateFrom} type ${noticeType}:`,
            e,
          );
          // API is flaky; try bulk JSON download fallback
          const fallback = await tryBulkDownload(dateFrom, noticeType);
          if (fallback.length > 0) yield fallback;
        }
        await sleep(1200);
      }
    }
  },
};

function buildDateFromCandidates(dateFrom: string): string[] {
  // Official API format is MM-YYYY (e.g., 04-2019)
  return [dateFrom];
}

async function fetchWithDateFromCandidates(
  dateFrom: string,
  noticeType: number,
): Promise<OCDSReleasePackage> {
  let lastError: unknown;
  for (const candidate of buildDateFromCandidates(dateFrom)) {
    const url = `${API_BASE}?dateFrom=${encodeURIComponent(candidate)}&noticeType=${noticeType}&outputType=0&locale=2057`;
    try {
      return await withBackoff(() => fetchJson<OCDSReleasePackage>(url));
    } catch (e) {
      lastError = e;
      console.warn(
        `[sell2wales] Failed dateFrom=${candidate} type=${noticeType}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  throw lastError ?? new Error("Sell2Wales request failed");
}

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
    const parsed = parseMonthYear(dateFrom);
    if (!parsed) return [];
    const { mm, yyyy } = parsed;
    
    const res = await ingestFetch(
      `${DOWNLOAD_BASE}?type=JSON&month=${mm}&year=${yyyy}&noticeType=${noticeType}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Handle both ReleasePackage and array formats
    if (Array.isArray(data)) return data as OCDSRelease[];
    if (data.releases && Array.isArray(data.releases)) return data.releases as OCDSRelease[];
    return [];
  } catch {
    return [];
  }
}

function parseMonthYear(dateFrom: string): { mm: string; yyyy: string } | null {
  // Official format is MM-YYYY (e.g., 04-2019)
  const [mm, yyyy] = dateFrom.split("-");
  if (mm && yyyy && mm.length === 2 && yyyy.length === 4) {
    return { mm, yyyy };
  }
  return null;
}