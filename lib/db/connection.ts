import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Use TCP postgres.js for localhost; Neon HTTP driver only for Neon cloud URLs. */
export function isLocalDatabase(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes(".neon.tech") || lower.includes("neondb")) {
    return false;
  }
  try {
    const normalized = url.replace(/^postgresql:/i, "http:");
    const { hostname } = new URL(normalized);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return !lower.includes("neon.tech");
  }
}

export function postgresOptions(
  url: string,
): postgres.Options<Record<string, never>> {
  if (isLocalDatabase(url)) {
    return { ssl: false, max: 10 };
  }
  return { ssl: "require", max: 10 };
}

export type AppDatabase = ReturnType<typeof createDrizzle>;

function createDrizzle(url: string) {
  if (isLocalDatabase(url)) {
    const client = postgres(url, postgresOptions(url));
    return drizzlePostgres(client, { schema });
  }
  const sql = neon(url);
  return drizzleNeon(sql, { schema });
}

let _db: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    _db = createDrizzle(url);
  }
  return _db;
}

export function createScriptClient(url: string) {
  return postgres(url, postgresOptions(url));
}
