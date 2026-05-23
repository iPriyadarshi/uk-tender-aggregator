import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FileDown, Activity } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
        className={`${inter.variable} min-h-screen font-sans antialiased bg-slate-50`}
      >
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                  United Kingdom Government Contracts Portal
                </p>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Your Guide to UK Government Procurement.
              </h1>
            </div>

            <nav className="flex items-center gap-2">
              <a
                href="/api/export/ocds"
                className="group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-teal-700"
              >
                <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">JSON</span>
              </a>

              <a
                href="/api/export/ocds?format=csv"
                className="group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-teal-700"
              >
                <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </a>

              <a
                href="/api/health"
                className="group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-emerald-600"
              >
                <Activity className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline">Health</span>
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-slate-500">
              Unified dashboard for UK government tenders across England,
              Scotland, Wales, and Northern Ireland
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
