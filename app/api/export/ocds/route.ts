import { NextRequest, NextResponse } from "next/server";
import { opportunityFiltersSchema } from "@/lib/api/filters";
import { queryOpportunities } from "@/lib/api/query-opportunities";

/** Stretch: export filtered opportunities as OCDS release package */
export const dynamic = "force-dynamic";

async function fetchAllOpportunities(
  filters: ReturnType<typeof opportunityFiltersSchema.parse>,
) {
  const pageSize = 1000;
  let page = 1;
  let all = [] as Awaited<ReturnType<typeof queryOpportunities>>["data"];

  while (true) {
    const { data } = await queryOpportunities({
      ...filters,
      page,
      pageSize,
    });
    all = all.concat(data);
    if (data.length < pageSize) break;
    page += 1;
  }

  return all;
}

function toCsvValue(value: unknown): string {
  if (value == null) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(
  headers: string[],
  rows: Array<Record<string, unknown>>,
): string {
  const headerLine = headers.map(toCsvValue).join(",");
  const lines = rows.map((row) =>
    headers.map((header) => toCsvValue(row[header])).join(","),
  );
  return [headerLine, ...lines].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const format = (params.format ?? "json").toString().toLowerCase();
    const filters = opportunityFiltersSchema.parse({
      ...params,
      page: 1,
      // pageSize: 500,
      pageSize: 1,
    });
    // const { data } = await queryOpportunities(filters);
    const data = await fetchAllOpportunities(filters);

    if (format === "csv") {
      const headers = [
        "id",
        "title",
        "buyerName",
        "nation",
        "status",
        "valueAmount",
        "valueCurrency",
        "publishedAt",
        "deadlineAt",
        "source",
        "sourceUrl",
      ];
      const rows = data.map((o) => ({
        id: o.id,
        title: o.title,
        buyerName: o.buyerName,
        nation: o.nation,
        status: o.status,
        valueAmount: o.valueAmount,
        valueCurrency: o.valueCurrency,
        publishedAt: o.publishedAt?.toISOString(),
        deadlineAt: o.deadlineAt?.toISOString(),
        source: o.source,
        sourceUrl: o.sourceUrl,
      }));

      const csv = toCsv(headers, rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="export-opportunities.csv"',
        },
      });
    }

    const releases = data.map((o) => o.rawOcds).filter(Boolean);

    const pkg = {
      uri: req.nextUrl.toString(),
      version: "1.1",
      publishedDate: new Date().toISOString(),
      publisher: { name: "UK Gov Contracts - Priyadarshi Kumar" },
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
