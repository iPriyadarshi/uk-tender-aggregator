import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (e) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "disconnected",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 503 },
    );
  }
}
