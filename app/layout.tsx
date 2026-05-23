import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { FileDown, Activity } from "lucide-react";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "UK Gov Contracts",
  description:
    "Unified dashboard for UK government tenders across England, Scotland, Wales, and Northern Ireland.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} min-h-screen font-sans antialiased text-[color:var(--ink)]`}
      >
        <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-card)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                Opportunity Intelligence
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-3xl">
                  Your Guide to UK Government Procurement.
                </h1>
                <p className="max-w-2xl text-sm text-[color:var(--fg-secondary)]">
                  A unified dashboard for tenders across England, Scotland,
                  Wales, and Northern Ireland.
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <a
                href="/api/export/ocds"
                className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-secondary)] transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
              >
                <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">JSON</span>
              </a>

              <a
                href="/api/export/ocds?format=csv"
                className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-secondary)] transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
              >
                <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </a>

              <a
                href="/api/health"
                className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-foreground)] shadow-[0_14px_30px_rgba(201,78,45,0.25)] transition-all hover:-translate-y-0.5"
              >
                <Activity className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline">Health</span>
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mt-auto border-t border-[color:var(--border)] bg-[color:var(--surface-card)]">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:px-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                UK Tender Aggregator
              </p>
              <p className="text-xs text-[color:var(--fg-secondary)]">
                Public procurement opportunities across the UK, normalized to
                OCDS for faster research and qualification.
              </p>
            </div>
            <div className="grid gap-2 text-xs text-[color:var(--fg-secondary)] lg:justify-end">
              <span className="font-semibold uppercase tracking-[0.2em] text-[color:var(--ink)]">
                Coverage
              </span>
              <span>England · Scotland · Wales · Northern Ireland</span>
              <span>Updated daily from official portals</span>
            </div>
          </div>
          <div className="border-t border-[color:var(--border)]">
            <div className="mx-auto flex max-w-7xl px-4 py-4 text-xs text-[color:var(--fg-secondary)] sm:px-6 lg:px-8" />
          </div>
        </footer>
      </body>
    </html>
  );
}
