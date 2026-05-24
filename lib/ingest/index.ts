import { ftsAdapter } from "./adapters/fts";
import { contractsFinderAdapter } from "./adapters/contracts-finder";
import { pcsAdapter } from "./adapters/pcs";
import { sell2walesAdapter } from "./adapters/sell2wales";
import { etendersNiAdapter } from "./adapters/etenders-ni";
import { proactisAdapter } from "./adapters/proactis";
import { registerAdapter, runIngestion } from "./runner";

registerAdapter(ftsAdapter);
registerAdapter(contractsFinderAdapter);
registerAdapter(pcsAdapter);
registerAdapter(sell2walesAdapter);
registerAdapter(etendersNiAdapter);
registerAdapter(proactisAdapter);

export { runIngestion };
export type { IngestWindow } from "./types";
