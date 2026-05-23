import { createHash } from "crypto";
import type { Source } from "@/lib/db/schema";

export function opportunityId(
  source: Source,
  ocid: string,
  releaseId: string,
): string {
  return createHash("sha256")
    .update(`${source}:${ocid}:${releaseId}`)
    .digest("hex")
    .slice(0, 32);
}

export function buyerId(partyId: string, source: Source): string {
  return createHash("sha256")
    .update(`buyer:${source}:${partyId}`)
    .digest("hex")
    .slice(0, 32);
}

export function runId(source: Source): string {
  return `${source}-${Date.now()}`;
}

export function dlqId(): string {
  return createHash("sha256")
    .update(`dlq:${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 32);
}
