import type { OCDSRelease } from "./types";
import type { OpportunityStatus } from "@/lib/db/schema";

export function mapOcdsStatus(release: OCDSRelease): OpportunityStatus {
  const tags = (release.tag ?? []).map((t) => t.toLowerCase());
  const tenderStatus = release.tender?.status?.toLowerCase();

  if (tags.includes("cancelled") || tenderStatus === "cancelled") {
    return "cancelled";
  }
  if (tags.includes("award") || tags.includes("contract")) {
    if (tenderStatus === "complete" || tags.includes("contract")) {
      return "complete";
    }
    return "award";
  }
  if (tags.includes("tender") || tags.includes("tenderAmendment")) {
    if (tenderStatus === "active" || tenderStatus === "planned") {
      return "active";
    }
    return "active";
  }
  if (tags.includes("planning")) {
    return "planning";
  }
  if (tenderStatus === "complete") return "complete";
  if (tenderStatus === "active") return "active";
  return "unknown";
}
