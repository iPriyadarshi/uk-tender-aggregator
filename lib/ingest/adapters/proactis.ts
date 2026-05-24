import type { OCDSRelease } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { ingestFetch, sleep } from "../http";
import { isAllowedByRobots } from "../robots";

const START_URL =
  "https://procontract.due-north.com/Opportunities/Index?tabName=opportunities&resetFilter=True";
const BASE_ORIGIN = "https://procontract.due-north.com";

export const proactisAdapter: SourceAdapter = {
  source: "proactis",

  async *fetchReleases(window: IngestWindow) {
    const allowed = await isAllowedByRobots(START_URL);
    if (!allowed) {
      console.warn("Proactis blocked by robots.txt - skipping scrape");
      return;
    }

    let url: string | null = START_URL;
    let page = 1;
    let cookies = "";

    while (url && page <= 200) {
      let html = "";
      try {
        const res = await fetchPage(url, cookies);
        html = res.html;
        cookies = res.cookies;
      } catch (e) {
        console.warn("Proactis scrape failed:", e);
        break;
      }

      const releases = parseListing(html, window);
      if (releases.length > 0) yield releases;

      const next = extractNextUrl(html, url);
      if (!next || next === url) break;
      url = next;
      page++;
      await sleep(1200);
    }
  },
};

type PageResponse = {
  html: string;
  cookies: string;
};

async function fetchPage(url: string, cookies: string): Promise<PageResponse> {
  const res = await ingestFetch(url, {
    headers: {
      Accept: "text/html",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Proactis HTTP ${res.status}`);
  }

  const setCookie = res.headers.get("set-cookie");
  const nextCookies = mergeCookies(cookies, setCookie);
  const html = await res.text();
  return { html, cookies: nextCookies };
}

function parseListing(html: string, window: IngestWindow): OCDSRelease[] {
  const releases: OCDSRelease[] = [];
  const rowRegex = /<tr[^>]*class="gridrow[^"]*"[^>]*>[\s\S]*?<\/tr>/gi;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = rowRegex.exec(html)) !== null && i < 300) {
    const row = match[0];
    const tds = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) ?? [];
    if (tds.length < 2) continue;

    const linkMatch = tds[0].match(
      /<a[^>]+href="([^"]*\/Advert\?advertId=[^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    );
    if (!linkMatch) continue;

    const rawHref = linkMatch[1];
    const title = decodeHtml(stripTags(linkMatch[2]).trim());
    if (!title || title.length < 5) continue;

    const url = normalizeUrl(rawHref);
    const buyerName = decodeHtml(stripTags(tds[1]).trim()) || null;
    const published = parseDateString(stripTags(tds[2] ?? ""));
    const deadline = parseDateString(stripTags(tds[3] ?? ""));
    const value = extractValue(stripTags(tds[4] ?? ""));

    if (published && !withinWindow(published, window)) continue;

    const rowText = stripTags(row);

    releases.push({
      ocid: `ocds-proactis-${hashCode(url)}`,
      id: `proactis-${hashCode(url)}`,
      date: (published ?? new Date()).toISOString(),
      tag: ["tender"],
      tender: {
        title,
        description: extractDescription(rowText, title) ?? undefined,
        status: "active",
        datePublished: published?.toISOString(),
        tenderPeriod: deadline
          ? { endDate: deadline.toISOString() }
          : undefined,
        value: value
          ? { amount: value.amount, currency: value.currency }
          : undefined,
        documents: [{ url, documentType: "tenderNotice" }],
      },
      buyer: buyerName ? { name: buyerName } : undefined,
      parties: buyerName
        ? [
            {
              name: buyerName,
              roles: ["buyer"],
              address: { countryName: "England" },
            },
          ]
        : undefined,
    });
    i++;
  }

  return releases;
}

function extractNextUrl(html: string, currentUrl: string): string | null {
  const relNext = html.match(/<a[^>]+rel="next"[^>]+href="([^"]+)"/i);
  if (relNext?.[1]) return normalizeUrl(relNext[1]);

  const nextLink = html.match(
    /<a[^>]+href="([^"]+)"[^>]*>\s*Next\b[^<]*<\/a>/i,
  );
  if (nextLink?.[1]) return normalizeUrl(nextLink[1]);

  const pageMatch = currentUrl.match(/([?&])page=(\d+)/i);
  if (pageMatch) {
    const nextPage = Number(pageMatch[2]) + 1;
    return currentUrl.replace(/([?&])page=\d+/i, `$1page=${nextPage}`);
  }

  return null;
}

function normalizeUrl(href: string): string {
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return `${BASE_ORIGIN}${href}`;
  return `${BASE_ORIGIN}/${href}`;
}

function parseDateString(value: string): Date | null {
  const slash = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slash) {
    const dd = Number(slash[1]);
    const mm = Number(slash[2]);
    const yyyy = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3]);
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    return isNaN(d.getTime()) ? null : d;
  }

  const words = value.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if (words) {
    const dd = Number(words[1]);
    const mm = monthIndex(words[2]);
    const yyyy = Number(words[3]);
    if (!mm) return null;
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    return isNaN(d.getTime()) ? null : d;
  }

  const wordsAlt = value.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (wordsAlt) {
    const dd = Number(wordsAlt[2]);
    const mm = monthIndex(wordsAlt[1]);
    const yyyy = Number(wordsAlt[3]);
    if (!mm) return null;
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function monthIndex(name: string): number | null {
  const m = name.toLowerCase();
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  for (let i = 0; i < months.length; i++) {
    if (months[i].startsWith(m) || m.startsWith(months[i].slice(0, 3))) {
      return i + 1;
    }
  }
  return null;
}

function extractValue(
  text: string,
): { amount: number; currency: string } | null {
  const normalized = decodeHtml(text);
  if (!normalized || /n\/?a/i.test(normalized)) return null;
  const match = normalized.match(/([\u00a3$\u20ac])\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ""));
  if (!isFinite(amount)) return null;
  const currency =
    match[1] === "\u20ac" ? "EUR" : match[1] === "$" ? "USD" : "GBP";
  return { amount, currency };
}

function extractDescription(text: string, title: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l !== title);

  const filtered = lines.filter((line) => {
    const lower = line.toLowerCase();
    return !(
      lower.startsWith("buyer") ||
      lower.startsWith("organisation") ||
      lower.startsWith("organization") ||
      lower.startsWith("published") ||
      lower.startsWith("publication") ||
      lower.startsWith("deadline") ||
      lower.startsWith("closing") ||
      lower.startsWith("value") ||
      lower === "read more"
    );
  });

  if (filtered.length === 0) return null;
  return filtered.join(" ").slice(0, 8000);
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .trim(),
  );
}

function withinWindow(date: Date, window: IngestWindow): boolean {
  return date >= window.from && date <= window.to;
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&pound;/gi, "\u00a3")
    .replace(/&#163;/g, "\u00a3");
}

function mergeCookies(
  existing: string,
  setCookieHeader: string | null,
): string {
  if (!setCookieHeader) return existing;
  const pairs = setCookieHeader
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.split(";")[0]?.trim())
    .filter(Boolean) as string[];

  const map = new Map<string, string>();
  if (existing) {
    for (const part of existing.split(/;\s*/)) {
      const [k, v] = part.split("=");
      if (k) map.set(k, v ?? "");
    }
  }

  for (const pair of pairs) {
    const [k, v] = pair.split("=");
    if (k) map.set(k, v ?? "");
  }

  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h).toString(16);
}
