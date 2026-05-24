import "./load-env";
import { isLocalDatabase } from "@/lib/db/connection";
import { runIngestion } from "@/lib/ingest/runner";
import { ftsAdapter } from "@/lib/ingest/adapters/fts";
import { contractsFinderAdapter } from "@/lib/ingest/adapters/contracts-finder";
import { pcsAdapter } from "@/lib/ingest/adapters/pcs";
import { sell2walesAdapter } from "@/lib/ingest/adapters/sell2wales";
import { etendersNiAdapter } from "@/lib/ingest/adapters/etenders-ni";
import { proactisAdapter } from "@/lib/ingest/adapters/proactis";
import { registerAdapter } from "@/lib/ingest/runner";

registerAdapter(ftsAdapter);
registerAdapter(contractsFinderAdapter);
registerAdapter(pcsAdapter);
registerAdapter(sell2walesAdapter);
registerAdapter(etendersNiAdapter);
registerAdapter(proactisAdapter);

const days = Number(
  process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "30",
);
const sourcesArg = process.argv
  .find((a) => a.startsWith("--sources="))
  ?.split("=")[1];
const sources = sourcesArg?.split(",") as
  | import("@/lib/db/schema").Source[]
  | undefined;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (set in .env or .env.local)");
    process.exit(1);
  }

  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const results = await runIngestion(sources, { from, to });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
