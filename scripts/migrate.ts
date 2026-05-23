import "./load-env";
import { readFileSync } from "fs";
import { join } from "path";
import { createScriptClient } from "@/lib/db/connection";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required (set in .env or .env.local)");
    process.exit(1);
  }

  const sql = createScriptClient(url);
  const migration = readFileSync(
    join(process.cwd(), "drizzle", "0000_init.sql"),
    "utf-8"
  );

  try {
    await sql.unsafe(migration);
    console.log("Migration applied successfully");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
