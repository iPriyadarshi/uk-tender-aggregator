"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Stats {
  byNation: { nation: string; count: number }[];
  timeline: { day: string; count: number }[];
  valueBuckets: { bucket: string; count: number }[];
}

const NATION_LABELS: Record<string, string> = {
  england: "England",
  scotland: "Scotland",
  wales: "Wales",
  northern_ireland: "Northern Ireland",
  uk: "UK-wide",
};

export function DashboardCharts({ stats }: { stats: Stats }) {
  const nationData = stats.byNation.map((n) => ({
    name: NATION_LABELS[n.nation] ?? n.nation,
    count: n.count,
  }));

  const timelineData = stats.timeline.map((t) => ({
    day: new Date(t.day).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    }),
    count: t.count,
  }));

  const valueData = stats.valueBuckets.map((v) => ({
    bucket: v.bucket,
    count: v.count,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-4 shadow-[0_18px_40px_rgba(37,25,22,0.08)]">
        <h3 className="mb-4 text-sm font-semibold text-[color:var(--ink)]">
          Opportunities by nation
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1dcd4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#c94e2d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-4 shadow-[0_18px_40px_rgba(37,25,22,0.08)]">
        <h3 className="mb-4 text-sm font-semibold text-[color:var(--ink)]">
          Publications (30 days)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1dcd4" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#c94e2d"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-4 shadow-[0_18px_40px_rgba(37,25,22,0.08)] lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-[color:var(--ink)]">
          Value distribution
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1dcd4" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="bucket"
                type="category"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#d06145" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
