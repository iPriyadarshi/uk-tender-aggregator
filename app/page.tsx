import { Suspense } from "react";
import { DashboardFilters } from "@/components/dashboard/filters";
import { DashboardCharts } from "@/components/dashboard/charts";
import { OpportunityList } from "@/components/dashboard/opportunity-list";
import { Pagination } from "@/components/dashboard/pagination";
import { IngestionStatus } from "@/components/dashboard/ingestion-status";
import { opportunityFiltersSchema } from "@/lib/api/filters";
import { queryOpportunities, getStats } from "@/lib/api/query-opportunities";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function DashboardContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") raw[k] = v;
  }

  let stats = null;
  let result = {
    data: [] as Awaited<ReturnType<typeof queryOpportunities>>["data"],
    total: 0,
    page: 1,
    pageSize: 20,
  };
  let dbError: string | null = null;

  try {
    const filters = opportunityFiltersSchema.parse(raw);
    [stats, result] = await Promise.all([
      getStats(),
      queryOpportunities(filters),
    ]);
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database unavailable";
  }

  if (dbError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setup required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-600">
          <p>{dbError}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a free Neon Postgres database</li>
            <li>
              Copy{" "}
              <code className="rounded bg-zinc-100 px-1">.env.example</code> to{" "}
              <code className="rounded bg-zinc-100 px-1">.env.local</code>
            </li>
            <li>
              Run{" "}
              <code className="rounded bg-zinc-100 px-1">
                npm run db:migrate
              </code>
            </li>
            <li>
              Run{" "}
              <code className="rounded bg-zinc-100 px-1">
                npm run ingest:backfill
              </code>
            </li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total opportunities" value={stats?.total ?? 0} />
        <MetricCard
          label="England"
          value={
            stats?.byNation.find((n) => n.nation === "england")?.count ?? 0
          }
        />
        <MetricCard
          label="Scotland"
          value={
            stats?.byNation.find((n) => n.nation === "scotland")?.count ?? 0
          }
        />
        <MetricCard
          label="Wales + NI"
          value={
            (stats?.byNation.find((n) => n.nation === "wales")?.count ?? 0) +
            (stats?.byNation.find((n) => n.nation === "northern_ireland")
              ?.count ?? 0)
          }
        />
      </div>

      {stats && (
        <DashboardCharts
          stats={{
            byNation: stats.byNation,
            timeline: stats.timeline,
            valueBuckets: stats.valueBuckets,
          }}
        />
      )}

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <DashboardFilters />
      </Suspense>

      <OpportunityList
        opportunities={result.data}
        total={result.total}
        page={result.page}
      />

      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />

      {stats?.ingestion && <IngestionStatus runs={stats.ingestion} />}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <DashboardContent searchParams={resolvedParams} />
    </Suspense>
  );
}
