import type { OCDSRelease } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { isAllowedByRobots } from "../robots";
import { ingestFetch, sleep } from "../http";

// const SEARCH_URL = "https://etendersni.gov.uk/epps/quickSearchAction.do";
const SEARCH_URL = "https://etendersni.gov.uk/epps/cft/listContracts.do";

/**
 * eTendersNI has no public OCDS API. We fetch the public contract list HTML
 * and map rows to minimal OCDS-shaped releases for normalization.
 */
export const etendersNiAdapter: SourceAdapter = {
  source: "etenders_ni",

  async *fetchReleases(_window: IngestWindow) {
    void _window;
    const allowed = await isAllowedByRobots(SEARCH_URL);
    if (!allowed) {
      console.warn("eTendersNI blocked by robots.txt — skipping");
      return;
    }

    const releases: OCDSRelease[] = [];
    try {
      const res = await ingestFetch(SEARCH_URL, {
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`eTendersNI HTTP ${res.status}`);
      const html = await res.text();
      releases.push(...parseNiHtml(html));
    } catch (e) {
      console.warn("eTendersNI scrape failed:", e);
      //   releases.push(...getNiSampleData());
    }

    if (releases.length > 0) yield releases;
    await sleep(2000);
  },
};

function parseNiHtml(html: string): OCDSRelease[] {
  const releases: OCDSRelease[] = [];
  const rowRegex =
    /<tr[^>]*>[\s\S]*?<a[^>]+href="([^"]*cft[^"]*)"[^>]*>([^<]+)<\/a>[\s\S]*?<\/tr>/gi;
  let match;
  let i = 0;
  while ((match = rowRegex.exec(html)) !== null && i < 100) {
    const href = match[1].startsWith("http")
      ? match[1]
      : `https://etendersni.gov.uk${match[1].startsWith("/") ? "" : "/"}${match[1]}`;
    const title = decodeHtml(match[2].trim());
    if (title.length < 5) continue;
    releases.push({
      ocid: `ocds-etendersni-${hashCode(href)}`,
      id: `ni-${hashCode(href)}`,
      date: new Date().toISOString(),
      tag: ["tender"],
      tender: {
        title,
        status: "active",
        documents: [{ url: href, documentType: "tenderNotice" }],
      },
      parties: [
        {
          id: "ni-buyer",
          name: "Northern Ireland Public Sector",
          roles: ["buyer"],
          address: { countryName: "Northern Ireland" },
        },
      ],
      buyer: { id: "ni-buyer", name: "Northern Ireland Public Sector" },
    });
    i++;
  }
  return releases;
}

// function getNiSampleData(): OCDSRelease[] {
//   return [
//     {
//       ocid: "ocds-etendersni-sample-1",
//       id: "ni-sample-1",
//       date: new Date().toISOString(),
//       tag: ["tender"],
//       tender: {
//         title: "NI Public Sector — verify live scrape in production",
//         status: "active",
//         tenderPeriod: {
//           endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
//         },
//         documents: [
//           {
//             url: "https://etendersni.gov.uk/epps/cft/listContracts.do",
//             documentType: "tenderNotice",
//           },
//         ],
//       },
//       buyer: { name: "Department of Finance NI" },
//       parties: [
//         {
//           roles: ["buyer"],
//           name: "Department of Finance NI",
//           address: { countryName: "Northern Ireland" },
//         },
//       ],
//     },
//   ];
// }

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h).toString(16);
}
