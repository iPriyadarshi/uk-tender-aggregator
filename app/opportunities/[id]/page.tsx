import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunityById } from "@/lib/api/query-opportunities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let opportunity;
  try {
    opportunity = await getOpportunityById(params.id);
  } catch {
    notFound();
  }

  if (!opportunity) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-teal-700 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge>{opportunity.nation}</Badge>
          <Badge variant="secondary">{opportunity.status}</Badge>
          <Badge variant="outline">{opportunity.source}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {opportunity.title}
        </h1>
        <p className="text-zinc-600">{opportunity.buyerName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formatCurrency(
              opportunity.valueAmount ? Number(opportunity.valueAmount) : null,
              opportunity.valueCurrency ?? "GBP",
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>{formatDate(opportunity.publishedAt)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>{formatDate(opportunity.deadlineAt)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Buyer type
            </CardTitle>
          </CardHeader>
          <CardContent>{opportunity.buyerType ?? "—"}</CardContent>
        </Card>
      </div>

      {opportunity.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 line-clamp-[20]">
              {opportunity.description}
            </p>
          </CardContent>
        </Card>
      )}

      {(opportunity.industryLabels?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Industry (CPV)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {opportunity.industryLabels?.map((l) => (
              <Badge key={l} variant="outline">
                {l}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {opportunity.sourceUrl && (
        <a
          href={opportunity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-medium text-teal-700 hover:underline"
        >
          View original notice →
        </a>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw OCDS release</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100">
            {JSON.stringify(opportunity.rawOcds, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
