import { NextRequest, NextResponse } from "next/server";
import { getOpportunityById } from "@/lib/api/query-opportunities";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const row = await getOpportunityById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
