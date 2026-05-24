import type { OCDSRelease } from "./types";
import type { Nation, Source } from "@/lib/db/schema";

const SCOTLAND_MARKERS = [
  "scotland",
  "scottish",
  "glasgow",
  "edinburgh",
  "aberdeen",
];
const WALES_MARKERS = ["wales", "welsh", "cardiff", "carmarthen", "gwynedd"];
const NI_MARKERS = [
  "northern ireland",
  "belfast",
  "antrim",
  "down",
  "armagh",
  "derry",
  "londonderry",
  "tyrone",
  "fermanagh",
];
const ENGLAND_MARKERS = [
  "england",
  "london",
  "manchester",
  "birmingham",
  "yorkshire",
];

function textIncludes(haystack: string, markers: string[]) {
  const lower = haystack.toLowerCase();
  return markers.some((m) => lower.includes(m));
}

function buyerNation(release: OCDSRelease): Nation | null {
  const buyerParty = release.parties?.find((p) => {
    const roles = Array.isArray(p.roles) ? p.roles : p.roles ? [p.roles] : [];
    return roles.includes("buyer");
  });
  const country =
    buyerParty?.address?.countryName ??
    release.buyer?.name ??
    buyerParty?.address?.region ??
    "";
  const region = buyerParty?.address?.region ?? "";

  const combined = `${country} ${region}`;
  if (textIncludes(combined, NI_MARKERS)) return "northern_ireland";
  if (textIncludes(combined, SCOTLAND_MARKERS)) return "scotland";
  if (textIncludes(combined, WALES_MARKERS)) return "wales";
  if (textIncludes(combined, ENGLAND_MARKERS)) return "england";
  return null;
}

export function resolveNation(release: OCDSRelease, source: Source): Nation {
  const sourceDefault: Record<Source, Nation> = {
    pcs: "scotland",
    sell2wales: "wales",
    etenders_ni: "northern_ireland",
    contracts_finder: "england",
    fts: "uk",
    proactis: "england",
  };

  const fromBuyer = buyerNation(release);
  if (fromBuyer) return fromBuyer;

  const items = release.tender?.items ?? [];
  for (const item of items) {
    for (const addr of item.deliveryAddresses ?? []) {
      const loc = `${addr.countryName ?? ""} ${addr.region ?? ""}`;
      if (textIncludes(loc, NI_MARKERS)) return "northern_ireland";
      if (textIncludes(loc, SCOTLAND_MARKERS)) return "scotland";
      if (textIncludes(loc, WALES_MARKERS)) return "wales";
      if (textIncludes(loc, ENGLAND_MARKERS)) return "england";
    }
  }

  return sourceDefault[source] ?? "uk";
}

export function inferBuyerType(buyerName: string): string {
  const n = buyerName.toLowerCase();
  if (
    n.includes("council") ||
    n.includes("borough") ||
    n.includes("district")
  ) {
    return "local_authority";
  }
  if (n.includes("nhs") || n.includes("health board")) return "nhs";
  if (
    n.includes("ministry") ||
    n.includes("department") ||
    n.includes("government")
  ) {
    return "central_government";
  }
  if (n.includes("university") || n.includes("college")) return "education";
  return "other";
}
