"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CPV_SECTORS } from "@/lib/ocds/cpv";

export function DashboardFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/?${next.toString()}`);
  }

  function clear() {
    router.push("/");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-card)] p-5 shadow-[0_18px_40px_rgba(37,25,22,0.08)]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Search
          </label>
          <Input
            placeholder="Title, buyer, keywords…"
            defaultValue={params.get("q") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                set("q", (e.target as HTMLInputElement).value);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Nation
          </label>
          <Select
            value={params.get("nation") ?? "all"}
            onValueChange={(v) => set("nation", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All nations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All nations</SelectItem>
              <SelectItem value="england">England</SelectItem>
              <SelectItem value="scotland">Scotland</SelectItem>
              <SelectItem value="wales">Wales</SelectItem>
              <SelectItem value="northern_ireland">Northern Ireland</SelectItem>
              <SelectItem value="uk">UK-wide</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Status
          </label>
          <Select
            value={params.get("status") ?? "all"}
            onValueChange={(v) => set("status", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="award">Award</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Buyer type
          </label>
          <Select
            value={params.get("buyerType") ?? "all"}
            onValueChange={(v) => set("buyerType", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All buyers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buyers</SelectItem>
              <SelectItem value="central_government">
                Central government
              </SelectItem>
              <SelectItem value="local_authority">Local authority</SelectItem>
              <SelectItem value="nhs">NHS</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Industry sector
          </label>
          <Select
            value={params.get("industry") ?? "all"}
            onValueChange={(v) => set("industry", v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {Object.entries(CPV_SECTORS).map(([code, label]) => (
                <SelectItem key={code} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Min value (£)
          </label>
          <Input
            type="number"
            placeholder="0"
            defaultValue={params.get("valueMin") ?? ""}
            onBlur={(e) => set("valueMin", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-secondary)]">
            Max value (£)
          </label>
          <Input
            type="number"
            placeholder="Any"
            defaultValue={params.get("valueMax") ?? ""}
            onBlur={(e) => set("valueMax", e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" className="w-full" onClick={clear}>
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}
