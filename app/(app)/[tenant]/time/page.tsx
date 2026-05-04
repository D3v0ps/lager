"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clockIn,
  clockOut,
  createTimeEntry,
  findOpenClockIn,
  formatMinutesAsHours,
  listTimeEntries,
  TIME_CATEGORY_VALUES,
  timeCategoryLabel,
  type TimeCategory,
  type TimeEntry,
  type TimeEntryWithRelations,
} from "@/lib/time-entries";
import { listEmployees, listProjects, type Employee, type ProjectListRow } from "@/lib/projects";
import { useTenantState } from "@/lib/tenant-context";
import { todayInStockholmISO } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorBanner,
  PageHeader,
  SkeletonRows,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

export default function TimePage() {
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ProjectListRow[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [openEntry, setOpenEntry] = useState<TimeEntry | null>(null);
  const [entries, setEntries] = useState<TimeEntryWithRelations[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Manual-entry form state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState(todayInStockholmISO());
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualProject, setManualProject] = useState("");
  const [manualCategory, setManualCategory] = useState<TimeCategory>("arbete");
  const [manualNote, setManualNote] = useState("");

  // Active project for clock-in
  const [activeProject, setActiveProject] = useState("");

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [emps, projs, ents] = await Promise.all([
        listEmployees(),
        listProjects(),
        listTimeEntries({
          fromDate: addDays(todayInStockholmISO(), -14),
        }),
      ]);
      setEmployees(emps);
      setProjects(projs);
      setEntries(ents);
      if (!employeeId && emps.length > 0) {
        const me = emps.find((e) => e.user_id != null) ?? emps[0]!;
        setEmployeeId(me.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [employeeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Track currently open clock-in for the chosen employee
  useEffect(() => {
    if (!employeeId) {
      setOpenEntry(null);
      return;
    }
    findOpenClockIn(employeeId)
      .then(setOpenEntry)
      .catch(() => setOpenEntry(null));
  }, [employeeId, entries]);

  const totalToday = useMemo(() => {
    if (!entries) return 0;
    const today = todayInStockholmISO();
    return entries
      .filter((e) => e.entry_date === today && e.employee_id === employeeId)
      .reduce((acc, e) => acc + (e.duration_minutes ?? 0), 0);
  }, [entries, employeeId]);

  const totalWeek = useMemo(() => {
    if (!entries) return 0;
    const since = addDays(todayInStockholmISO(), -7);
    return entries
      .filter((e) => e.entry_date >= since && e.employee_id === employeeId)
      .reduce((acc, e) => acc + (e.duration_minutes ?? 0), 0);
  }, [entries, employeeId]);

  async function handleClockIn() {
    if (!tenantData || !employeeId) return;
    setBusy(true);
    setError(null);
    try {
      const geo = await tryGeolocation();
      await clockIn({
        tenant_id: tenantData.id,
        employee_id: employeeId,
        project_id: activeProject || null,
        geo,
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    if (!openEntry) return;
    setBusy(true);
    try {
      await clockOut(openEntry.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData || !employeeId) return;
    setBusy(true);
    setError(null);
    try {
      const minutes =
        (Number(manualHours) || 0) * 60 + (Number(manualMinutes) || 0);
      if (minutes <= 0) throw new Error("Ange tid");
      await createTimeEntry({
        tenant_id: tenantData.id,
        employee_id: employeeId,
        project_id: manualProject || null,
        entry_date: manualDate,
        started_at: null,
        ended_at: null,
        duration_minutes: minutes,
        category: manualCategory,
        note: manualNote.trim() || null,
      });
      setManualHours("");
      setManualMinutes("");
      setManualNote("");
      setManualOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Tidrapport"
        subtitle="Stämpla in/ut, rapportera timmar i efterhand, godkänn för fakturering."
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card variant="elevated">
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="space-y-3">
            <div>
              <label htmlFor="employee" className={labelClass}>
                Anställd
              </label>
              <select
                id="employee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Välj —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                    {emp.trade ? ` · ${emp.trade}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {!openEntry && (
              <div>
                <label htmlFor="active-project" className={labelClass}>
                  Projekt (valfritt)
                </label>
                <select
                  id="active-project"
                  value={activeProject}
                  onChange={(e) => setActiveProject(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Inget projekt —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference ? `${p.reference} · ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-end gap-3">
            {openEntry ? (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={busy}
                className="rounded-md bg-rose-500 text-white px-6 py-3.5 text-base font-semibold hover:bg-rose-400 disabled:opacity-50"
              >
                Stämpla ut
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={busy || !employeeId}
                className="rounded-md bg-emerald-500 text-white px-6 py-3.5 text-base font-semibold hover:bg-emerald-400 disabled:opacity-50"
              >
                Stämpla in
              </button>
            )}
          </div>
        </div>
        {openEntry && (
          <div className="border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <p>
              <StatusPill tone="ok" size="sm">Stämplad in</StatusPill>{" "}
              <span className="ml-2 font-mono text-foreground-muted">
                sedan{" "}
                {openEntry.started_at
                  ? new Date(openEntry.started_at).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Stockholm",
                    })
                  : "?"}
              </span>
            </p>
            <p className="text-foreground-muted">
              Glöm inte att stämpla ut innan du går.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="grid grid-cols-3 divide-x divide-white/5">
          <div className="px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
              I dag
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums">
              {formatMinutesAsHours(totalToday)}
            </p>
          </div>
          <div className="px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
              Senaste 7 dagar
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums">
              {formatMinutesAsHours(totalWeek)}
            </p>
          </div>
          <div className="px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
              Antal rader
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums">
              {entries?.length ?? 0}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/[0.05]"
        >
          {manualOpen ? "Stäng" : "+ Manuell rad"}
        </button>
      </div>

      {manualOpen && (
        <Card variant="elevated">
          <form onSubmit={handleManualSubmit} className="px-6 py-5 space-y-4">
            <h3 className="text-sm font-semibold">Lägg till tid i efterhand</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="m-date" className={labelClass}>
                  Datum
                </label>
                <input
                  id="m-date"
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="m-hours" className={labelClass}>
                  Tim
                </label>
                <input
                  id="m-hours"
                  type="number"
                  min="0"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="m-minutes" className={labelClass}>
                  Min
                </label>
                <input
                  id="m-minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="m-project" className={labelClass}>
                  Projekt
                </label>
                <select
                  id="m-project"
                  value={manualProject}
                  onChange={(e) => setManualProject(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Inget —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference ? `${p.reference} · ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="m-cat" className={labelClass}>
                  Kategori
                </label>
                <select
                  id="m-cat"
                  value={manualCategory}
                  onChange={(e) =>
                    setManualCategory(e.target.value as TimeCategory)
                  }
                  className={inputClass}
                >
                  {TIME_CATEGORY_VALUES.map((c) => (
                    <option key={c} value={c}>
                      {timeCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="m-note" className={labelClass}>
                Anteckning
              </label>
              <input
                id="m-note"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className={fieldHintClass}>
              Tid registreras direkt på vald anställd. GPS skippas för manuella
              rader.
            </p>
            <div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Sparar…" : "Lägg till"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {entries === null ? (
        <SkeletonRows rows={5} className="h-12" />
      ) : entries.length === 0 ? (
        <Card>
          <p className="px-5 py-12 text-sm text-foreground-muted text-center">
            Inga tidrapporter de senaste 14 dagarna.
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Senaste 14 dagarna" />
          <DataTable>
            <TableHead>
              <Th>Datum</Th>
              <Th>Anställd</Th>
              <Th>Projekt</Th>
              <Th>Kategori</Th>
              <Th align="right">Tid</Th>
              <Th>Status</Th>
            </TableHead>
            <TBody>
              {entries.map((e) => (
                <Tr key={e.id}>
                  <Td>
                    <span className="font-mono text-xs">{e.entry_date}</span>
                  </Td>
                  <Td>{e.employees?.full_name ?? "—"}</Td>
                  <Td>
                    <span className="text-xs">
                      {e.projects
                        ? e.projects.reference ?? e.projects.name
                        : "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs uppercase tracking-wider text-foreground-muted">
                      {e.category}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums font-medium">
                      {e.duration_minutes
                        ? formatMinutesAsHours(e.duration_minutes)
                        : "öppen"}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill tone={e.approved ? "ok" : "muted"} size="sm">
                      {e.approved ? "Godkänd" : "Väntar"}
                    </StatusPill>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        </Card>
      )}
    </div>
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00+01:00`);
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(d);
}

async function tryGeolocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  try {
    return await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000, enableHighAccuracy: false },
      );
    });
  } catch {
    return null;
  }
}
