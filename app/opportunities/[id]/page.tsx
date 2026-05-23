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
  Tag
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation */}
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-all hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to dashboard
        </Link>

        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-wrap items-start gap-3">
            <Badge className="bg-teal-600 text-white hover:bg-teal-700 shadow-sm">
              {opportunity.nation}
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-slate-100 text-slate-700 border-slate-200 shadow-sm"
            >
              {opportunity.status}
            </Badge>
            <Badge 
              variant="outline" 
              className="border-slate-300 text-slate-600 bg-white shadow-sm"
            >
              {opportunity.source}
            </Badge>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl leading-tight">
              {opportunity.title}
            </h1>
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="h-5 w-5 text-slate-400" />
              <p className="text-lg font-medium">{opportunity.buyerName}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Value
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(
                  opportunity.valueAmount ? Number(opportunity.valueAmount) : null,
                  opportunity.valueCurrency ?? "GBP",
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Published
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">
                {formatDate(opportunity.publishedAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <Clock className="h-4 w-4 text-rose-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Deadline
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">
                {formatDate(opportunity.deadlineAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Buyer Type
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">
                {opportunity.buyerType ?? "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Description Section */}
        {opportunity.description && (
          <Card className="mb-6 border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-lg font-bold text-slate-900">
                  Description
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 line-clamp-[20]">
                {opportunity.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Industry Labels */}
        {(opportunity.industryLabels?.length ?? 0) > 0 && (
          <Card className="mb-6 border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-lg font-bold text-slate-900">
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
                    className="border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors px-3 py-1"
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
            className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-all"
          >
            <span>View original notice</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}

        {/* Raw OCDS Data */}
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-900">
              Raw OCDS Release
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="max-h-96 overflow-auto bg-slate-950 p-6 text-xs text-slate-100 font-mono">
              {JSON.stringify(opportunity.rawOcds, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
