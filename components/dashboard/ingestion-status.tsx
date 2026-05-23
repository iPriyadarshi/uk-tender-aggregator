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
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 text-sm shadow-sm">
      <h3 className="font-medium text-zinc-900">Ingestion status</h3>
      <ul className="mt-2 space-y-1 text-zinc-600">
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
