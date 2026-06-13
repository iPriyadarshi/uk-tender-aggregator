import type { OCDSRelease } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { ingestFetch, sleep } from "../http";
import { isAllowedByRobots } from "../robots";

const SEARCH_URL =
  "https://www.sell2wales.gov.wales/Search/Search_MainPage.aspx?noticeType=-1&location=100";

export const sell2walesAdapter: SourceAdapter = {
  source: "sell2wales",

  async *fetchReleases(window: IngestWindow) {
    const allowed = await isAllowedByRobots(SEARCH_URL);
    if (!allowed) {
      console.warn("Sell2Wales blocked by robots.txt - skipping scrape");
      return;
    }

    let page = 1;
    let cookies = "";
    let html = "";

    try {
      const first = await fetchPage({ cookies });
      html = first.html;
      cookies = first.cookies;
    } catch (e) {
      console.warn("Sell2Wales scrape failed:", e);
      return;
    }

    let emptyStreak = 0;
    while (html && page <= 50) {
      const releases = parseSearchHtml(html, window);
      if (releases.length > 0) {
        yield releases;
        emptyStreak = 0;
      } else if (++emptyStreak >= 2) {
        // Two consecutive pages with nothing in-window: results are sorted
        // newest-first, so we've paged past the window. Stop.
        break;
      }

      const next = extractNextPageState(html);
      if (!next || next.disabled || !next.eventTarget) break;

      try {
        const nextPage = await fetchPage({
          cookies,
          method: "POST",
          body: buildPostBody(next),
        });
        html = nextPage.html;
        cookies = nextPage.cookies;
      } catch (e) {
        console.warn("Sell2Wales pagination failed:", e);
        break;
      }

      page++;
      await sleep(1200);
    }
  },
};

type PageRequest = {
  method?: "GET" | "POST";
  body?: string;
  cookies: string;
};

type PageResponse = {
  html: string;
  cookies: string;
};

type NextPageState = {
  fields: Record<string, string>;
  eventTarget: string;
  disabled: boolean;
};

async function fetchPage(req: PageRequest): Promise<PageResponse> {
  const res = await ingestFetch(SEARCH_URL, {
    method: req.method ?? "GET",
    headers: {
      Accept: "text/html",
      ...(req.body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
      ...(req.cookies ? { Cookie: req.cookies } : {}),
    },
    body: req.body,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Sell2Wales HTTP ${res.status}`);
  }

  const setCookie = res.headers.get("set-cookie");
  const cookies = mergeCookies(req.cookies, setCookie);
  const html = await res.text();
  return { html, cookies };
}

function parseSearchHtml(html: string, window: IngestWindow): OCDSRelease[] {
  const releases: OCDSRelease[] = [];
  const rowRegex =
    /<div[^>]*class="[^"]*search-result[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
  let match;
  let i = 0;

  while ((match = rowRegex.exec(html)) !== null && i < 200) {
    const row = match[0];
    const linkMatch = row.match(
      /<a[^>]+href="([^"]*search_view\.aspx[^\"]*)"[^>]*>([\s\S]*?)<\/a>/i,
    );
    if (!linkMatch) continue;

    const rawHref = linkMatch[1];
    const title = decodeHtml(stripTags(linkMatch[2]).trim());
    if (title.length < 5) continue;

    const url = normalizeUrl(rawHref);
    const publishedText = extractField(row, "Publication date");
    const deadlineText = extractField(row, "Deadline date");
    const buyerName = extractField(row, "Published by");
    const ocid = extractField(row, "OCID");
    const reference = extractField(row, "Reference no");
    const location = extractField(row, "Location");
    const valueText = extractField(row, "Value");
    const published = publishedText
      ? parseDateString(publishedText)
      : extractDate(row);
    const deadline = deadlineText ? parseDateString(deadlineText) : null;
    const value = valueText ? parseValueString(valueText) : null;
    const description = extractDescription(row, title);
    if (published && !withinWindow(published, window)) continue;

    releases.push({
      ocid: ocid ?? `ocds-sell2wales-${hashCode(url)}`,
      id: reference ?? `s2w-${hashCode(url)}`,
      date: (published ?? new Date()).toISOString(),
      tag: ["tender"],
      tender: {
        title,
        description: description ?? undefined,
        status: "active",
        datePublished: published?.toISOString(),
        tenderPeriod: deadline
          ? { endDate: deadline.toISOString() }
          : undefined,
        value: value
          ? { amount: value.amount, currency: value.currency }
          : undefined,
        items: location
          ? [{ deliveryAddresses: [{ region: location }] }]
          : undefined,
        documents: [{ url, documentType: "tenderNotice" }],
      },
      buyer: buyerName ? { name: buyerName } : undefined,
      parties: buyerName
        ? [
            {
              name: buyerName,
              roles: ["buyer"],
              address: { countryName: "Wales" },
            },
          ]
        : undefined,
    });
    i++;
  }

  return releases;
}

function extractNextPageState(html: string): NextPageState | null {
  const fields = extractHiddenFields(html);
  const nextButton = findButtonTag(html, "Next") ?? findInputTag(html, "Next");
  if (!nextButton) return null;

  const disabled = /disabled/i.test(nextButton);
  const eventTarget =
    getAttr(nextButton, "name") ?? toEventTarget(getAttr(nextButton, "id"));

  if (!eventTarget) return null;
  return { fields, eventTarget, disabled };
}

function buildPostBody(state: NextPageState): string {
  const params = new URLSearchParams(state.fields);
  params.set("__EVENTTARGET", state.eventTarget);
  params.set("__EVENTARGUMENT", "");
  return params.toString();
}

function extractHiddenFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const inputRegex = /<input[^>]+type="hidden"[^>]*>/gi;
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const tag = match[0];
    const name = getAttr(tag, "name") ?? getAttr(tag, "id");
    if (!name) continue;
    const value = getAttr(tag, "value") ?? "";
    fields[name] = decodeHtmlAttr(value);
  }
  return fields;
}

function findInputTag(html: string, label: string): string | null {
  const regex = new RegExp(`<input[^>]+value="[^"]*${label}[^"]*"[^>]*>`, "i");
  return html.match(regex)?.[0] ?? null;
}

function findButtonTag(html: string, label: string): string | null {
  const regex = new RegExp(
    `<button[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/button>`,
    "i",
  );
  return html.match(regex)?.[0] ?? null;
}

function getAttr(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = tag.match(regex);
  return match?.[1] ?? null;
}

function toEventTarget(id: string | null): string | null {
  if (!id) return null;
  return id.includes("_") ? id.replace(/_/g, "$") : id;
}

function normalizeUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `https://www.sell2wales.gov.wales${href.startsWith("/") ? "" : "/"}${href}`;
}

function extractDate(row: string): Date | null {
  const m = row.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  return isNaN(d.getTime()) ? null : d;
}

function extractField(row: string, label: string): string | null {
  const regex = new RegExp(
    `${label}:\\s*<\\/span>\\s*<span[^>]*>\\s*([^<]+)`,
    "i",
  );
  const m = row.match(regex);
  if (!m) return null;
  const value = decodeHtml(m[1].trim());
  return value.length > 0 ? value : null;
}

function parseDateString(value: string): Date | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  return isNaN(d.getTime()) ? null : d;
}

function parseValueString(
  value: string,
): { amount: number; currency: string } | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") return null;
  const match = trimmed.match(/([£$€])?\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ""));
  if (!isFinite(amount)) return null;
  const currency = match[1] === "€" ? "EUR" : match[1] === "$" ? "USD" : "GBP";
  return { amount, currency };
}

function extractDescription(row: string, title: string): string | null {
  const text = stripTags(row);
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l !== title);

  const filtered = lines.filter((line) => {
    const lower = line.toLowerCase();
    return !(
      lower.startsWith("reference no:") ||
      lower.startsWith("ocid:") ||
      lower.startsWith("published by:") ||
      lower.startsWith("publication date:") ||
      lower.startsWith("published to:") ||
      lower.startsWith("deadline date:") ||
      lower.startsWith("notice type:") ||
      lower.startsWith("location:") ||
      lower.startsWith("value:") ||
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
    .replace(/&#39;/g, "'");
}

function decodeHtmlAttr(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
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
