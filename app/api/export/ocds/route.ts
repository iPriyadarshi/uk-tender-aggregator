import { NextRequest, NextResponse } from "next/server";
import { opportunityFiltersSchema } from "@/lib/api/filters";
import { queryOpportunities } from "@/lib/api/query-opportunities";

/** Stretch: export filtered opportunities as OCDS release package */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = opportunityFiltersSchema.parse({
      ...params,
      page: 1,
      pageSize: 500,
    });
    const { data } = await queryOpportunities(filters);

    const releases = data.map((o) => o.rawOcds).filter(Boolean);

    const pkg = {
      uri: req.nextUrl.toString(),
      version: "1.1",
      publishedDate: new Date().toISOString(),
      publisher: { name: "UK Gov Contracts — Chardi Trial Project B" },
      releases,
    };

    return NextResponse.json(pkg, {
      headers: {
        "Content-Disposition": 'attachment; filename="export-ocds.json"',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 },
    );
  }
}
