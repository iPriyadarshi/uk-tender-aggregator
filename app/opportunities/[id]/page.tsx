import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunityById } from "@/lib/api/query-opportunities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  DollarSign,
  ExternalLink,
  FileText,
  Tag,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let opportunity;
  try {
    opportunity = await getOpportunityById(id);
  } catch {
    notFound();
  }

  if (!opportunity) notFound();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Navigation */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--fg-secondary)] transition-all hover:text-[color:var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to dashboard
        </Link>

        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-wrap items-start gap-3">
            <Badge className="bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-sm">
              {opportunity.nation}
            </Badge>
            <Badge
              variant="secondary"
              className="border-[color:var(--border)] bg-[color:var(--surface-raised)] text-[color:var(--fg-secondary)] shadow-sm"
            >
              {opportunity.status}
            </Badge>
            <Badge
              variant="outline"
              className="border-[color:var(--border)] bg-[color:var(--surface-card)] text-[color:var(--fg-secondary)] shadow-sm"
            >
              {opportunity.source}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--ink)] lg:text-4xl leading-tight">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-2 text-[color:var(--fg-secondary)]">
              <Building2 className="h-5 w-5 text-[color:var(--fg-secondary)]" />
              <p className="text-lg font-medium text-[color:var(--fg-secondary)]">
                {opportunity.buyerName}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)] transition-shadow hover:shadow-[0_20px_40px_rgba(37,25,22,0.12)]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[color:var(--surface-raised)] p-2">
                  <DollarSign className="h-4 w-4 text-[color:var(--accent)]" />
                </div>
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
                  Value
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[color:var(--ink)]">
                {formatCurrency(
                  opportunity.valueAmount
                    ? Number(opportunity.valueAmount)
                    : null,
                  opportunity.valueCurrency ?? "GBP",
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)] transition-shadow hover:shadow-[0_20px_40px_rgba(37,25,22,0.12)]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[color:var(--surface-raised)] p-2">
                  <Calendar className="h-4 w-4 text-[color:var(--accent)]" />
                </div>
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
                  Published
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-[color:var(--ink)]">
                {formatDate(opportunity.publishedAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)] transition-shadow hover:shadow-[0_20px_40px_rgba(37,25,22,0.12)]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[color:var(--surface-raised)] p-2">
                  <Clock className="h-4 w-4 text-[color:var(--accent)]" />
                </div>
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
                  Deadline
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-[color:var(--ink)]">
                {formatDate(opportunity.deadlineAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)] transition-shadow hover:shadow-[0_20px_40px_rgba(37,25,22,0.12)]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[color:var(--surface-raised)] p-2">
                  <Building2 className="h-4 w-4 text-[color:var(--accent)]" />
                </div>
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
                  Buyer Type
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-[color:var(--ink)]">
                {opportunity.buyerType ?? "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Description Section */}
        {opportunity.description && (
          <Card className="mb-6 border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)]">
            <CardHeader className="border-b border-[color:var(--border)] bg-[color:var(--surface-raised)]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[color:var(--fg-secondary)]" />
                <CardTitle className="text-lg font-semibold text-[color:var(--ink)]">
                  Description
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--fg-secondary)] line-clamp-[20]">
                {opportunity.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Industry Labels */}
        {(opportunity.industryLabels?.length ?? 0) > 0 && (
          <Card className="mb-6 border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)]">
            <CardHeader className="border-b border-[color:var(--border)] bg-[color:var(--surface-raised)]">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[color:var(--fg-secondary)]" />
                <CardTitle className="text-lg font-semibold text-[color:var(--ink)]">
                  Industry (CPV)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {opportunity.industryLabels?.map((l) => (
                  <Badge
                    key={l}
                    variant="outline"
                    className="border-[color:var(--border)] bg-[color:var(--surface-raised)] text-[color:var(--fg-secondary)] transition-colors hover:bg-[color:var(--surface-side)] px-3 py-1"
                  >
                    {l}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* External Link */}
        {opportunity.sourceUrl && (
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)] transition-all hover:opacity-80"
          >
            <span>View original notice</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}

        {/* Raw OCDS Data */}
        <Card className="overflow-hidden border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_16px_32px_rgba(37,25,22,0.08)]">
          <CardHeader className="border-b border-[color:var(--border)] bg-[color:var(--surface-raised)]">
            <CardTitle className="text-lg font-semibold text-[color:var(--ink)]">
              Raw OCDS Release
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="max-h-96 overflow-auto bg-[#1f1210] p-6 text-xs text-[#fff1ed] font-mono">
              {JSON.stringify(opportunity.rawOcds, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
