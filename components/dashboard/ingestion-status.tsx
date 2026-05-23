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

export function IngestionStatus({ runs }: { runs: Run[] }) {
  if (runs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-4 text-sm shadow-[0_18px_40px_rgba(37,25,22,0.08)]">
      <h3 className="font-semibold text-[color:var(--ink)]">
        Ingestion status
      </h3>
      <ul className="mt-2 space-y-1 text-[color:var(--fg-secondary)]">
        {runs.slice(0, 5).map((r) => (
          <li key={r.id} className="flex justify-between gap-4">
            <span className="font-mono text-xs uppercase">{r.source}</span>
            <span>
              {r.status} · {r.recordsUpserted ?? 0} upserted ·{" "}
              {formatDate(r.finishedAt ?? r.startedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
