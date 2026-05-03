"use client";

import Link from "next/link";

import { ExportSection } from "./_components/ExportSection";
import { ImportSection } from "./_components/ImportSection";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/" className="text-sm text-neutral-500 hover:underline">
          ← Tillbaka
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Import &amp; export</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Flytta produkter mellan Saldo och en CSV-fil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <ExportSection />
        <ImportSection />
      </div>
    </div>
  );
}
