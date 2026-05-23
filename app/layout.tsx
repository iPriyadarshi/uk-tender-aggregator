import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "UK Gov Contracts | Chardi Trial — Project B",
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
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
                Chardi.ai Trial · Project B
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                UK Government Contracts
              </h1>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <a
                href="/api/export?format=csv"
                className="text-zinc-600 hover:text-teal-700"
              >
                Export CSV
              </a>
              <a
                href="/api/health"
                className="text-zinc-600 hover:text-teal-700"
              >
                Health
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
