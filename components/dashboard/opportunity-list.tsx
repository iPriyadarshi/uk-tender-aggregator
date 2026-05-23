"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Opportunity } from "@/lib/db/schema";

const NATION_LABELS: Record<string, string> = {
  england: "England",
  scotland: "Scotland",
  wales: "Wales",
  northern_ireland: "NI",
  uk: "UK",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "secondary"
> = {
  active: "default",
  planning: "secondary",
  award: "success",
  complete: "success",
  cancelled: "warning",
  unknown: "secondary",
};

export function OpportunityList({
  opportunities,
  total,
  page,
}: {
  opportunities: Opportunity[];
  total: number;
  page: number;
}) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">
          No contracts match these filters
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Try clearing filters or run ingestion to load data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        Showing {opportunities.length} of {total.toLocaleString()} opportunities
        {page > 1 ? ` (page ${page})` : ""}
      </p>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50/80 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Nation</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr
                key={o.id}
                className="border-b last:border-0 hover:bg-zinc-50/50"
              >
                <td className="max-w-xs px-4 py-3">
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="font-medium text-zinc-900 hover:text-teal-700 line-clamp-2"
                  >
                    {o.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {o.buyerName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">
                    {NATION_LABELS[o.nation] ?? o.nation}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatCurrency(
                    o.valueAmount ? Number(o.valueAmount) : null,
                    o.valueCurrency ?? "GBP",
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {o.deadlineAt ? formatDate(o.deadlineAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>
                    {o.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {opportunities.map((o) => (
          <Link
            key={o.id}
            href={`/opportunities/${o.id}`}
            className="block rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <p className="font-medium text-zinc-900 line-clamp-2">{o.title}</p>
            <p className="mt-1 text-sm text-zinc-500">{o.buyerName ?? "—"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">
                {NATION_LABELS[o.nation] ?? o.nation}
              </Badge>
              <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>
                {o.status}
              </Badge>
              <span className="text-sm text-zinc-600">
                {formatCurrency(
                  o.valueAmount ? Number(o.valueAmount) : null,
                  o.valueCurrency ?? "GBP",
                )}
              </span>
              {o.deadlineAt && (
                <span className="text-sm text-zinc-500">
                  {formatDate(o.deadlineAt)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
