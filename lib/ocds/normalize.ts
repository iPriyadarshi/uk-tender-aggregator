import type { OCDSRelease } from "./types";
import type { Source, Nation, OpportunityStatus } from "@/lib/db/schema";
import { opportunityId, buyerId } from "./id";
import { mapOcdsStatus } from "./status";
import { resolveNation, inferBuyerType } from "./nation";
import { extractCpvCodes } from "./cpv";

export interface NormalizedOpportunity {
  id: string;
  ocid: string | null;
  source: Source;
  nation: Nation;
  region: string | null;
  title: string;
  description: string | null;
  status: OpportunityStatus;
  procedureType: string | null;
  industryCodes: string[];
  industryLabels: string[];
  valueAmount: string | null;
  valueCurrency: string;
  valueMin: string | null;
  valueMax: string | null;
  publishedAt: Date | null;
  deadlineAt: Date | null;
  awardDate: Date | null;
  buyerId: string | null;
  buyerName: string | null;
  buyerType: string | null;
  sourceUrl: string | null;
  documents: { title?: string; url: string; format?: string }[];
  rawOcds: OCDSRelease;
}

export interface NormalizedBuyer {
  id: string;
  name: string;
  identifierScheme: string | null;
  identifierId: string | null;
  address: Record<string, unknown> | null;
  nation: Nation;
  buyerType: string | null;
}

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const value = v.trim();
  if (!value) return null;

  const hasTimezone = /[zZ]|[+-]\d{2}(:?\d{2})?$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return null;

  return new Date(d.toISOString());
}

function extractValue(release: OCDSRelease) {
  const tender = release.tender;
  let amount = tender?.value?.amount ?? tender?.maxValue?.amount;
  let currency = tender?.value?.currency ?? tender?.maxValue?.currency ?? "GBP";
  const min = tender?.minValue?.amount;
  const max = tender?.maxValue?.amount ?? tender?.value?.amount;

  const award = release.awards?.[0];
  if (award?.value?.amount != null) {
    amount = award.value.amount;
    currency = award.value.currency ?? currency;
  }

  return {
    amount: amount != null ? String(amount) : null,
    currency: currency ?? "GBP",
    min: min != null ? String(min) : null,
    max: max != null ? String(max) : null,
  };
}

function extractSourceUrl(release: OCDSRelease, source: Source): string | null {
  const docs = release.tender?.documents ?? [];
  const cfDoc = docs.find(
    (d) =>
      d.url?.includes("contractsfinder") ||
      d.url?.includes("find-tender") ||
      d.url?.includes("publiccontractsscotland") ||
      d.url?.includes("sell2wales") ||
      d.url?.includes("etendersni") ||
      d.url?.includes("procontract.due-north.com"),
  );
  if (cfDoc?.url) return cfDoc.url;

  if (source === "contracts_finder" && release.id) {
    return `https://www.contractsfinder.service.gov.uk/Notice/${release.id}`;
  }
  if (source === "fts" && release.id) {
    return `https://www.find-tender.service.gov.uk/Notice/${release.id}`;
  }
  if (source === "pcs" && release.ocid) {
    return `https://api.publiccontractsscotland.gov.uk/v1/Notice?id=${release.ocid}`;
  }

  return docs[0]?.url ?? null;
}

function extractRegion(release: OCDSRelease): string | null {
  const item = release.tender?.items?.[0];
  const addr = item?.deliveryAddresses?.[0];
  return addr?.region ?? addr?.countryName ?? null;
}

export function normalizeRelease(
  release: OCDSRelease,
  source: Source,
): { opportunity: NormalizedOpportunity; buyer: NormalizedBuyer | null } {
  const ocid = release.ocid ?? "unknown";
  const releaseId = release.id ?? ocid;
  const nation = resolveNation(release, source);
  const { codes, labels } = extractCpvCodes(release);
  const value = extractValue(release);

  const buyerParty = release.parties?.find((p) => {
    const roles = Array.isArray(p.roles) ? p.roles : p.roles ? [p.roles] : [];
    return roles.includes("buyer");
  });
  const buyerName = release.buyer?.name ?? buyerParty?.name ?? "Unknown buyer";
  const partyId = release.buyer?.id ?? buyerParty?.id ?? buyerName;

  let buyer: NormalizedBuyer | null = null;
  let normalizedBuyerId: string | null = null;
  if (partyId) {
    normalizedBuyerId = buyerId(partyId, source);
    buyer = {
      id: normalizedBuyerId,
      name: buyerName,
      identifierScheme: buyerParty?.identifier?.scheme ?? null,
      identifierId: buyerParty?.identifier?.id ?? null,
      address: (buyerParty?.address as Record<string, unknown>) ?? null,
      nation,
      buyerType: inferBuyerType(buyerName),
    };
  }

  const documents = (release.tender?.documents ?? [])
    .filter((d) => d.url)
    .map((d) => ({
      title: d.title,
      url: d.url!,
      format: d.format,
    }));

  return {
    opportunity: {
      id: opportunityId(source, ocid, releaseId),
      ocid,
      source,
      nation,
      region: extractRegion(release),
      title: release.tender?.title ?? "Untitled opportunity",
      description:
        (release.tender?.description ?? release.description ?? "").slice(
          0,
          8000,
        ) || null,
      status: mapOcdsStatus(release),
      procedureType:
        release.tender?.procurementMethodDetails ??
        release.tender?.procurementMethod ??
        null,
      industryCodes: codes,
      industryLabels: labels,
      valueAmount: value.amount,
      valueCurrency: value.currency,
      valueMin: value.min,
      valueMax: value.max,
      publishedAt:
        parseDate(release.tender?.datePublished) ?? parseDate(release.date),
      deadlineAt: parseDate(release.tender?.tenderPeriod?.endDate),
      awardDate:
        parseDate(release.awards?.[0]?.date) ??
        parseDate(release.tender?.contractPeriod?.startDate),
      buyerId: normalizedBuyerId,
      buyerName,
      buyerType: inferBuyerType(buyerName),
      sourceUrl: extractSourceUrl(release, source),
      documents,
      rawOcds: release,
    },
    buyer,
  };
}
