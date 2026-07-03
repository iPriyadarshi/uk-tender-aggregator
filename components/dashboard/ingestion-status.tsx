import { formatDate } from "@/lib/utils";

interface Run {
  id: string;
  source: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  recordsFetched: number | null;
  recordsUpserted: number | null;
}

/** All configured sources, so the panel always reflects full coverage. */
const SOURCES: { key: string; label: string }[] = [
  { key: "fts", label: "Find a Tender" },
  { key: "contracts_finder", label: "Contracts Finder" },
  { key: "pcs", label: "Public Contracts Scotland" },
  { key: "sell2wales", label: "Sell2Wales" },
  { key: "etenders_ni", label: "eTenders NI" },
  { key: "proactis", label: "Proactis" },
];

const STATUS_STYLE: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800",
  complete: "bg-emerald-100 text-emerald-800",
  running: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

export function IngestionStatus({ runs }: { runs: Run[] }) {
  const bySource = new Map(runs.map((r) => [r.source, r]));

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-4 text-sm shadow-[0_18px_40px_rgba(37,25,22,0.08)]">
      <h3 className="font-semibold text-[color:var(--ink)]">
        Ingestion status
      </h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {SOURCES.map(({ key, label }) => {
          const run = bySource.get(key);
          const status = run?.status ?? "never run";
          return (
            <li
              key={key}
              className="flex flex-col gap-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[color:var(--ink)]">
                  {label}
                </p>
                <p className="text-xs text-[color:var(--fg-secondary)]">
                  {run
                    ? `${run.recordsUpserted ?? 0} upserted · ${formatDate(
                        run.finishedAt ?? run.startedAt,
                      )}`
                    : "No runs yet"}
                </p>
              </div>
              <span
                className={`inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                  STATUS_STYLE[status] ?? "bg-[color:var(--surface-card)] text-[color:var(--fg-secondary)]"
                }`}
              >
                {status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
