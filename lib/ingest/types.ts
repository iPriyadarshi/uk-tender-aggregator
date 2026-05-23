import type { OCDSRelease } from "@/lib/ocds/types";
import type { Source } from "@/lib/db/schema";

export interface IngestWindow {
  from: Date;
  to: Date;
}

export interface SourceAdapter {
  source: Source;
  fetchReleases(
    window: IngestWindow,
  ): AsyncGenerator<OCDSRelease[], void, unknown>;
}

export const SOURCE_PRIORITY: Record<Source, number> = {
  fts: 100,
  pcs: 80,
  sell2wales: 80,
  etenders_ni: 70,
  contracts_finder: 50,
};
