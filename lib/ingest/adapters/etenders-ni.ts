import type { OCDSRelease } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";
import { ingestFetch, sleep } from "../http";
import { isAllowedByRobots } from "../robots";
import { createTesseractSolver } from "../captcha";

/**
 * eTendersNI runs the European Dynamics EPPS platform, which gates its search
 * behind a classic distorted-text image CAPTCHA (`/epps/genCaptcha/captcha.jpg`,
 * a `<input name="captcha">`). We solve it with our own OCR (lib/ingest/captcha)
 * and a refresh-and-retry loop — no paid CAPTCHA service, no headless browser.
 */
const ORIGIN = "https://etendersni.gov.uk";
const SEARCH_PAGE = `${ORIGIN}/epps/prepareCurrentOpportunities.do?currentType=cft`;
const CAPTCHA_URL = `${ORIGIN}/epps/genCaptcha/captcha.jpg`;
const SUBMIT_URL = `${ORIGIN}/epps/quickSearchAction.do`;
const SEARCH_BODY = "mode=search&current=true&type=&searchType=cftFTS";

const MAX_ATTEMPTS = Number(process.env.ETENDERS_CAPTCHA_ATTEMPTS ?? "25");

export const etendersNiAdapter: SourceAdapter = {
  source: "etenders_ni",

  async *fetchReleases(_window: IngestWindow) {
    void _window;

    const allowed = await isAllowedByRobots(SEARCH_PAGE);
    if (!allowed) {
      console.warn("eTendersNI blocked by robots.txt — skipping");
      return;
    }

    let cookies = "";
    try {
      const prime = await fetchPage(SEARCH_PAGE, { cookies });
      cookies = prime.cookies;
    } catch (e) {
      console.warn("eTendersNI: failed to load search page:", e);
      return;
    }

    const solver = await createTesseractSolver({ length: 6 });
    let resultHtml: string | null = null;

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let guess: string | null = null;
        try {
          const cap = await fetchBuffer(CAPTCHA_URL, { cookies });
          cookies = cap.cookies;
          guess = await solver.solve(cap.body);
        } catch (e) {
          console.warn("eTendersNI: captcha fetch/solve failed:", e);
        }
        if (!guess) {
          await sleep(300);
          continue;
        }

        let res: PageResponse;
        try {
          res = await fetchPage(SUBMIT_URL, {
            cookies,
            method: "POST",
            body: `${SEARCH_BODY}&captcha=${encodeURIComponent(guess)}`,
          });
        } catch (e) {
          console.warn("eTendersNI: search submit failed:", e);
          await sleep(600);
          continue;
        }
        cookies = res.cookies;

        if (isCaptchaGate(res.html)) {
          await sleep(300);
          continue;
        }

        resultHtml = res.html;
        console.log(`eTendersNI: captcha solved on attempt ${attempt}`);
        break;
      }
    } finally {
      await solver.close();
    }

    if (!resultHtml) {
      console.warn(
        `eTendersNI: could not pass the captcha within ${MAX_ATTEMPTS} attempts — skipping`,
      );
      return;
    }

    const releases = parseResults(resultHtml);
    if (releases.length > 0) {
      yield releases;
    } else {
      console.warn(
        "eTendersNI: passed the captcha but parsed 0 notices (results layout may have changed)",
      );
    }

    await sleep(1000);
  },
};

type PageRequest = {
  method?: "GET" | "POST";
  body?: string;
  cookies: string;
};

type PageResponse = { html: string; cookies: string };
type BufferResponse = { body: Buffer; cookies: string };

async function fetchPage(
  url: string,
  req: PageRequest,
): Promise<PageResponse> {
  const res = await ingestFetch(url, {
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
  if (!res.ok) throw new Error(`eTendersNI HTTP ${res.status} for ${url}`);
  const cookies = mergeCookies(req.cookies, res.headers.get("set-cookie"));
  const html = await res.text();
  return { html, cookies };
}

async function fetchBuffer(
  url: string,
  req: PageRequest,
): Promise<BufferResponse> {
  const res = await ingestFetch(url, {
    headers: {
      Accept: "image/*",
      ...(req.cookies ? { Cookie: req.cookies } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`eTendersNI captcha HTTP ${res.status}`);
  const cookies = mergeCookies(req.cookies, res.headers.get("set-cookie"));
  const body = Buffer.from(await res.arrayBuffer());
  return { body, cookies };
}

/** A response still showing the captcha image/input means we didn't get past the gate. */
function isCaptchaGate(html: string): boolean {
  return (
    /genCaptcha\/captcha/i.test(html) ||
    /mismatch,?\s*please\s+try\s+again/i.test(html)
  );
}

function parseResults(html: string): OCDSRelease[] {
  const releases: OCDSRelease[] = [];
  const seen = new Set<string>();

  const linkRegex =
    /<a[^>]+href="([^"]*\/epps\/[^"]*(?:Notice|viewCfT|cft|Information|Advert)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null && releases.length < 200) {
    const href = normalizeUrl(match[1]);
    const title = decodeHtml(stripTags(match[2]).trim());
    if (title.length < 5) continue;
    if (seen.has(href)) continue;
    seen.add(href);

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
  }

  return releases;
}

function normalizeUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${ORIGIN}${href.startsWith("/") ? "" : "/"}${href}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function mergeCookies(existing: string, setCookieHeader: string | null): string {
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

function hashCode(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h).toString(16);
}
