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
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-zinc-900">
          Opportunities by nation
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-zinc-900">
          Publications (30 days)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0d9488"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-sm font-medium text-zinc-900">
          Value distribution
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="bucket" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
