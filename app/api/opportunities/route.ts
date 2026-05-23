import { NextRequest, NextResponse } from "next/server";
import { opportunityFiltersSchema } from "@/lib/api/filters";
import { queryOpportunities } from "@/lib/api/query-opportunities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = opportunityFiltersSchema.parse(params);
    const result = await queryOpportunities(filters);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Database not configured. Set DATABASE_URL." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
