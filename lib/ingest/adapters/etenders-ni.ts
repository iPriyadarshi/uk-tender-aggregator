import type { OCDSRelease } from "@/lib/ocds/types";
import type { IngestWindow, SourceAdapter } from "../types";

import { Solver } from "@2captcha/captcha-solver";

import { isAllowedByRobots } from "../robots";
import { sleep } from "../http";

const START_URL =
  "https://etendersni.gov.uk/epps/prepareCurrentOpportunities.do?currentType=cft";

const solver = new Solver(process.env.TWOCAPTCHA_API_KEY!);

type ChromiumType = typeof import("playwright").chromium;

let chromiumLoader: Promise<ChromiumType> | null = null;

async function getChromium() {
  if (!chromiumLoader) {
    chromiumLoader = import("playwright").then((mod) => mod.chromium);
  }

  return chromiumLoader;
}

export const etendersNiAdapter: SourceAdapter = {
  source: "etenders_ni",

  async *fetchReleases(_window: IngestWindow) {
    void _window;

    const allowed = await isAllowedByRobots(START_URL);

    if (!allowed) {
      console.warn("eTendersNI blocked by robots.txt — skipping");
      return;
    }

    const releases: OCDSRelease[] = [];

    let browser;
    let chromium;

    try {
      try {
        chromium = await getChromium();
      } catch (e) {
        console.warn(
          "Playwright not available; skipping eTendersNI scrape:",
          e,
        );
        return;
      }

      browser = await chromium.launch({
        headless: true,
      });

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
        viewport: {
          width: 1440,
          height: 900,
        },
      });

      const page = await context.newPage();

      console.log("Opening eTendersNI...");

      await page.goto(START_URL, {
        waitUntil: "networkidle",
        timeout: 120000,
      });

      // ---------------------------------------------------
      // Detect reCAPTCHA
      // ---------------------------------------------------

      const sitekey = await page
        .locator("[data-sitekey]")
        .first()
        .getAttribute("data-sitekey")
        .catch(() => null);

      if (sitekey) {
        console.log("CAPTCHA detected, solving via 2Captcha...");

        const result = await solver.recaptcha({
          pageurl: START_URL,
          googlekey: sitekey,
        });

        console.log("CAPTCHA solved");

        // Inject token
        await page.evaluate((token) => {
          const textarea = document.getElementById(
            "g-recaptcha-response",
          ) as HTMLTextAreaElement | null;

          if (textarea) {
            textarea.value = token;
          }

          // Some sites keep it hidden
          const hidden = document.querySelector(
            '[name="g-recaptcha-response"]',
          ) as HTMLTextAreaElement | null;

          if (hidden) {
            hidden.value = token;
          }
        }, result.data);

        // Trigger callback if present
        await page.evaluate(() => {
          const win = window as any;

          for (const key in win) {
            const value = win[key];

            if (typeof value === "object" && value && value.callback) {
              try {
                value.callback();
              } catch {}
            }
          }
        });

        // Submit / continue
        await page.keyboard.press("Enter");

        await page.waitForLoadState("networkidle", {
          timeout: 120000,
        });
      }

      // ---------------------------------------------------
      // Scrape contracts table
      // ---------------------------------------------------

      await page.waitForSelector("table", {
        timeout: 60000,
      });

      const tenders = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("tr"));

        return rows
          .map((row) => {
            const link = row.querySelector("a");

            if (!link) return null;

            const title = link.textContent?.trim();

            const href = (link as HTMLAnchorElement).href;

            if (!title || title.length < 5) {
              return null;
            }

            if (!href.includes("cft")) {
              return null;
            }

            return {
              title,
              href,
            };
          })
          .filter(Boolean);
      });

      for (const tender of tenders.slice(0, 100) as any[]) {
        releases.push({
          ocid: `ocds-etendersni-${hashCode(tender.href)}`,

          id: `ni-${hashCode(tender.href)}`,

          date: new Date().toISOString(),

          tag: ["tender"],

          tender: {
            title: decodeHtml(tender.title),

            status: "active",

            documents: [
              {
                url: tender.href,
                documentType: "tenderNotice",
              },
            ],
          },

          parties: [
            {
              id: "ni-buyer",

              name: "Northern Ireland Public Sector",

              roles: ["buyer"],

              address: {
                countryName: "Northern Ireland",
              },
            },
          ],

          buyer: {
            id: "ni-buyer",
            name: "Northern Ireland Public Sector",
          },
        });
      }
    } catch (e) {
      console.warn("eTendersNI Playwright scrape failed:", e);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    if (releases.length > 0) {
      yield releases;
    }

    await sleep(2000);
  },
};

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function hashCode(s: string) {
  let h = 0;

  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
  }

  return Math.abs(h).toString(16);
}
