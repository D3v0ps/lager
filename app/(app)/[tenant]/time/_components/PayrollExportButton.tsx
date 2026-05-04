"use client";

import { useEffect, useRef, useState } from "react";

import {
  listTimeEntries,
  type TimeEntryWithRelations,
} from "@/lib/time-entries";
import { listEmployees } from "@/lib/projects";
import { todayInStockholmISO } from "@/lib/format";
import {
  PAYROLL_FORMATS,
  downloadPayrollFile,
  type PayrollFormat,
} from "@/lib/payroll-exporters";
import { ErrorBanner } from "@/app/_components/ui";

type Props = {
  fromDate?: string;
  toDate?: string;
};

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PayrollExportButton({ fromDate, toDate }: Props) {
  const today = todayInStockholmISO();
  const defaultFrom = addDaysIso(today, -30);
  const [from, setFrom] = useState<string>(fromDate ?? defaultFrom);
  const [to, setTo] = useState<string>(toDate ?? today);
  const [format, setFormat] = useState<PayrollFormat>("paxml");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Sync if parent passes new range
  useEffect(() => {
    if (fromDate) setFrom(fromDate);
    if (toDate) setTo(toDate);
  }, [fromDate, toDate]);

  // Close popover on outside click / Escape
  useEffect(() => {
    if (!previewOpen) return;
    function onClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPreviewOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [previewOpen]);

  async function handleDownload() {
    setError(null);
    setBusy(true);
    try {
      const [entries, employees] = await Promise.all([
        listTimeEntries({ fromDate: from, toDate: to }) as Promise<
          TimeEntryWithRelations[]
        >,
        listEmployees(),
      ]);
      downloadPayrollFile(format, entries, employees, from, to);
      setPreviewOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setPreviewOpen((v) => !v)}
        className="rounded-md border border-white/15 bg-white/[0.02] px-3 py-1.5 text-sm font-medium hover:bg-white/[0.06] inline-flex items-center gap-1.5"
        aria-haspopup="dialog"
        aria-expanded={previewOpen}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="m6 9 6 6 6-6" />
          <path d="M5 21h14" />
        </svg>
        Lönefil
      </button>

      {previewOpen && (
        <div
          role="dialog"
          aria-label="Exportera lönefil"
          className="absolute right-0 z-20 mt-2 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-background-elevated/95 backdrop-blur shadow-2xl"
        >
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">
                Exportera lönefil
              </h3>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Välj format för ditt lönesystem. PAXml är svensk standard
                och läses av Visma Lön, Hogia, Crona, Agda och Kontek.
              </p>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <div>
              <span className="block text-[10px] uppercase tracking-[0.15em] text-foreground-muted mb-1.5">
                Format
              </span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as PayrollFormat)}
                className="block w-full rounded-md border border-white/10 bg-background-elevated/60 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                {PAYROLL_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[10.5px] text-foreground-muted">
                {PAYROLL_FORMATS.find((f) => f.id === format)?.hint}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.15em] text-foreground-muted mb-1">
                  Från
                </span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="block w-full rounded-md border border-white/10 bg-background-elevated/60 px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.15em] text-foreground-muted mb-1">
                  Till
                </span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="block w-full rounded-md border border-white/10 bg-background-elevated/60 px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={busy || !from || !to || from > to}
                className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
              >
                {busy ? "Skapar…" : "Ladda ner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
