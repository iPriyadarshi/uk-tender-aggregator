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
      <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-raised)] py-16 text-center">
        <p className="text-sm font-medium text-[color:var(--ink)]">
          No contracts match these filters
        </p>
        <p className="mt-1 text-sm text-[color:var(--fg-secondary)]">
          Try clearing filters or run ingestion to load data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[color:var(--fg-secondary)]">
        Showing {opportunities.length} of {total.toLocaleString()} opportunities
        {page > 1 ? ` (page ${page})` : ""}
      </p>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] shadow-[0_18px_40px_rgba(37,25,22,0.08)] md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-[color:var(--border)] bg-[color:var(--surface-raised)] text-left text-[0.7rem] uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
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
                className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--surface-raised)]/70"
              >
                <td className="max-w-xs px-4 py-3">
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="font-medium text-[color:var(--ink)] hover:text-[color:var(--accent)] line-clamp-2"
                  >
                    {o.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[color:var(--fg-secondary)]">
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
                <td className="px-4 py-3 text-[color:var(--fg-secondary)]">
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
            className="block rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-4 shadow-[0_18px_40px_rgba(37,25,22,0.08)]"
          >
            <p className="font-medium text-[color:var(--ink)] line-clamp-2">
              {o.title}
            </p>
            <p className="mt-1 text-sm text-[color:var(--fg-secondary)]">
              {o.buyerName ?? "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">
                {NATION_LABELS[o.nation] ?? o.nation}
              </Badge>
              <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>
                {o.status}
              </Badge>
              <span className="text-sm text-[color:var(--fg-secondary)]">
                {formatCurrency(
                  o.valueAmount ? Number(o.valueAmount) : null,
                  o.valueCurrency ?? "GBP",
                )}
              </span>
              {o.deadlineAt && (
                <span className="text-sm text-[color:var(--fg-secondary)]">
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
