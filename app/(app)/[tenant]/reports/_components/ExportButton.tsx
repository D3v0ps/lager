"use client";

import { useState } from "react";

export type ExportRow = {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  value: number;
  sold_90d: number;
  last_movement_date: string;
  status: string;
};

type Props = {
  rows: ExportRow[];
  tenantSlug: string;
};

const HEADERS: (keyof ExportRow)[] = [
  "sku",
  "name",
  "category",
  "quantity",
  "value",
  "sold_90d",
  "last_movement_date",
  "status",
];

const UTF8_BOM = "﻿";

function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function serialize(rows: ExportRow[]): string {
  const header = HEADERS.join(",");
  const body = rows
    .map((r) =>
      HEADERS.map((h) => {
        const v = r[h];
        if (v == null) return "";
        if (typeof v === "number") {
          return Number.isFinite(v) ? String(v) : "";
        }
        return escapeField(v);
      }).join(","),
    )
    .join("\r\n");
  return UTF8_BOM + header + "\r\n" + body + "\r\n";
}

function todayFilename(slug: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  // include slug discretely; spec asks for `saldo-rapport-YYYY-MM-DD.csv`
  // so we keep that exact format and ignore slug in the filename.
  void slug;
  return `saldo-rapport-${y}-${m}-${day}.csv`;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportButton({ rows, tenantSlug }: Props) {
  const [done, setDone] = useState(false);

  function handleClick() {
    const csv = serialize(rows);
    downloadText(csv, todayFilename(tenantSlug));
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={rows.length === 0}
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Exportera rapport som CSV
      </button>
      {done ? (
        <span className="text-sm text-green-700 dark:text-green-400">
          {rows.length} {rows.length === 1 ? "rad" : "rader"} exporterade.
        </span>
      ) : null}
    </div>
  );
}
