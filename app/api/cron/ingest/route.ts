import { NextRequest, NextResponse } from "next/server";
import "@/lib/ingest";
import { runIngestion } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const days = Number(req.nextUrl.searchParams.get("days") ?? "2");
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const results = await runIngestion(undefined, { from, to });
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
