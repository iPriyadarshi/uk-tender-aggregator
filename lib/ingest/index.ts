import { ftsAdapter } from "./adapters/fts";
import { contractsFinderAdapter } from "./adapters/contracts-finder";
import { pcsAdapter } from "./adapters/pcs";
import { sell2walesAdapter } from "./adapters/sell2wales";
import { etendersNiAdapter } from "./adapters/etenders-ni";
import { registerAdapter, runIngestion } from "./runner";

registerAdapter(ftsAdapter);
registerAdapter(contractsFinderAdapter);
registerAdapter(pcsAdapter);
registerAdapter(sell2walesAdapter);
registerAdapter(etendersNiAdapter);

export { runIngestion };
export type { IngestWindow } from "./types";
