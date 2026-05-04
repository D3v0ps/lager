// Lönefil-exportörer för svenska lönesystem.
//
// Stödda format:
//   • PAXml — den svenska standarden för lönefiler (XML).
//     https://www.paxml.se — används av Visma Lön, Hogia Lön, Crona Lön,
//     Kontek, Agda och de flesta seriösa svenska lönesystem.
//   • Visma Lön CSV — Vismas egna CSV-export (semi-kolon, sv-SE-decimaler).
//   • Hogia Lön CSV — Hogias variant (semicolon, decimal-komma).
//   • Crona Lön CSV — Cronas variant.
//   • Generic CSV — för okända system (samma struktur som Visma).
//
// Pure-client implementation. Inga server-runda turer — vi tar tidrapporter
// + employee-data och bygger filen i webbläsaren, sen blob-downloadar den.

import type { TimeEntryWithRelations } from "@/lib/time-entries";
import type { Employee } from "@/lib/projects";

export type PayrollFormat =
  | "paxml"
  | "visma_lon"
  | "hogia_lon"
  | "crona_lon"
  | "generic_csv";

export const PAYROLL_FORMATS: Array<{
  id: PayrollFormat;
  label: string;
  ext: string;
  hint: string;
}> = [
  {
    id: "paxml",
    label: "PAXml (svensk standard)",
    ext: "xml",
    hint: "Importeras av Visma Lön, Hogia, Crona, Agda, Kontek m.fl.",
  },
  {
    id: "visma_lon",
    label: "Visma Lön (CSV)",
    ext: "csv",
    hint: "Direkt-import till Visma Lön 300/600.",
  },
  {
    id: "hogia_lon",
    label: "Hogia Lön (CSV)",
    ext: "csv",
    hint: "Direkt-import till Hogia Lön Plus.",
  },
  {
    id: "crona_lon",
    label: "Crona Lön (CSV)",
    ext: "csv",
    hint: "Direkt-import till Crona Lön.",
  },
  {
    id: "generic_csv",
    label: "Allmän CSV",
    ext: "csv",
    hint: "Semi-kolon-separerad, för okända system.",
  },
];

// PAXml-koder för tidskategorier — mappar våra interna kategorier till de
// koder som anges i PAXml 2.0-specen för "TimeTransaction/Type".
function paxmlTimeCode(category: string): string {
  switch (category) {
    case "arbete": return "TIA"; // Tidlön Arbete
    case "övertid": return "OB1"; // Övertid 1
    case "restid": return "TID"; // Tidlön (resa)
    case "rast": return "RAST"; // Lunch (icke-betald)
    case "sjuk": return "SJK"; // Sjukfrånvaro
    case "semester": return "SEM"; // Semester
    default: return "TIA";
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a PAXml 2.0 lönefil.
 *
 * Schema reference (simplified):
 *   <paxml>
 *     <header><format/><version/><startdate/><enddate/></header>
 *     <salary>
 *       <salarytrans employeeid="..." date="..." typecode="TIA">
 *         <hours>8.0</hours>
 *         ...
 *       </salarytrans>
 *     </salary>
 *   </paxml>
 */
export function buildPaxml(
  entries: TimeEntryWithRelations[],
  employees: Employee[],
  fromDate: string,
  toDate: string,
): string {
  const empById = new Map(employees.map((e) => [e.id, e]));
  const now = new Date().toISOString();

  const transactions = entries
    .filter((e) => e.duration_minutes && e.duration_minutes > 0)
    .map((e, i) => {
      const emp = empById.get(e.employee_id);
      const employeeId = (emp?.email ?? emp?.full_name ?? e.employee_id)
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 32);
      const hours = ((e.duration_minutes ?? 0) / 60).toFixed(2);
      const code = paxmlTimeCode(e.category);
      const note = e.note ?? "";
      return `    <salarytrans transid="t${i}" employeeid="${escapeXml(
        employeeId,
      )}" date="${e.entry_date}" typecode="${code}"${
        e.projects?.reference
          ? ` projectid="${escapeXml(e.projects.reference)}"`
          : ""
      }>
      <hours>${hours}</hours>${note ? `\n      <description>${escapeXml(note)}</description>` : ""}
    </salarytrans>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<paxml xmlns="http://www.paxml.se/2.0/paxml.xsd">
  <header>
    <format>SALARY</format>
    <version>2.0</version>
    <startdate>${fromDate}</startdate>
    <enddate>${toDate}</enddate>
    <created>${now}</created>
    <generator>Saldo Bygg</generator>
  </header>
  <salary>
${transactions}
  </salary>
</paxml>
`;
}

/**
 * Build a CSV in the format Visma Lön / Hogia Lön / Crona Lön expect.
 * The three are nearly identical — semicolon-separated, sv-SE decimals.
 * Header row labels differ slightly per system.
 */
function buildCsv(
  entries: TimeEntryWithRelations[],
  employees: Employee[],
  format: "visma_lon" | "hogia_lon" | "crona_lon" | "generic_csv",
): string {
  const empById = new Map(employees.map((e) => [e.id, e]));
  const headers: Record<typeof format, string[]> = {
    visma_lon: [
      "Anstnr",
      "Datum",
      "Lönart",
      "Antal",
      "Projekt",
      "Anteckning",
    ],
    hogia_lon: [
      "PersonalNr",
      "Datum",
      "LöneArtKod",
      "Antal",
      "Projektnr",
      "Notering",
    ],
    crona_lon: [
      "AnsNr",
      "Datum",
      "Lönart",
      "Tim",
      "Projekt",
      "Notering",
    ],
    generic_csv: [
      "Anställd",
      "Datum",
      "Kategori",
      "Timmar",
      "Projekt",
      "Anteckning",
    ],
  };

  // Most Swedish payroll systems map löneartskoder. Common mappings:
  //   • Tidlön (vanligt arbete) — 1 (Visma/Crona), 100 (Hogia)
  //   • Övertid 50 % — 11 / 110
  //   • Sjuk — 71 / 700
  //   • Semester — 51 / 600
  // We pick a "best-effort" code; tenant kan mappa om i sitt eget system.
  function loneartCode(category: string): string {
    if (format === "hogia_lon") {
      switch (category) {
        case "arbete": return "100";
        case "övertid": return "110";
        case "restid": return "120";
        case "sjuk": return "700";
        case "semester": return "600";
        default: return "100";
      }
    }
    // Visma / Crona / generic
    switch (category) {
      case "arbete": return "1";
      case "övertid": return "11";
      case "restid": return "12";
      case "sjuk": return "71";
      case "semester": return "51";
      default: return "1";
    }
  }

  function quote(s: string): string {
    if (/[;"\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
  function num(n: number): string {
    return n.toFixed(2).replace(".", ",");
  }

  const lines: string[] = [headers[format].join(";")];
  for (const e of entries) {
    if (!e.duration_minutes || e.duration_minutes <= 0) continue;
    const emp = empById.get(e.employee_id);
    const empId =
      format === "visma_lon" || format === "crona_lon"
        ? // Visma/Crona: anställningsnummer (vi har inte det → använd email-handle)
          (emp?.email?.split("@")[0] ?? emp?.full_name ?? e.employee_id).slice(0, 16)
        : format === "hogia_lon"
          ? (emp?.email?.split("@")[0] ?? e.employee_id).slice(0, 16)
          : (emp?.full_name ?? "Okänd");
    const row = [
      quote(empId),
      e.entry_date,
      loneartCode(e.category),
      num((e.duration_minutes ?? 0) / 60),
      quote(e.projects?.reference ?? ""),
      quote(e.note ?? ""),
    ];
    lines.push(row.join(";"));
  }
  // Excel-friendly UTF-8 BOM så åäö visas rätt vid öppning i Excel SE.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function buildPayrollFile(
  format: PayrollFormat,
  entries: TimeEntryWithRelations[],
  employees: Employee[],
  fromDate: string,
  toDate: string,
): { filename: string; mimeType: string; body: string } {
  const def = PAYROLL_FORMATS.find((f) => f.id === format)!;
  const filename = `lonefil-${fromDate}-${toDate}.${def.ext}`;
  if (format === "paxml") {
    return {
      filename,
      mimeType: "application/xml;charset=utf-8",
      body: buildPaxml(entries, employees, fromDate, toDate),
    };
  }
  return {
    filename,
    mimeType: "text/csv;charset=utf-8",
    body: buildCsv(entries, employees, format),
  };
}

export function downloadPayrollFile(
  format: PayrollFormat,
  entries: TimeEntryWithRelations[],
  employees: Employee[],
  fromDate: string,
  toDate: string,
): void {
  const { filename, mimeType, body } = buildPayrollFile(
    format,
    entries,
    employees,
    fromDate,
    toDate,
  );
  const blob = new Blob([body], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
