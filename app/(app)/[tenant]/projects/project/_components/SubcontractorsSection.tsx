"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  linkSubcontractorToProject,
  listProjectSubcontractors,
  listSubcontractors,
  unlinkSubcontractorFromProject,
  type ProjectSubcontractorLink,
  type Subcontractor,
} from "@/lib/subcontractors";
import { formatCents } from "@/lib/rot-rut";
import { formatDateOnly } from "@/lib/format";
import {
  Card,
  CardHeader,
  ErrorBanner,
  SkeletonRows,
  StatusPill,
  buttonClasses,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

type Props = {
  projectId: string;
};

type Row = ProjectSubcontractorLink & { subcontractors: Subcontractor };

function insuranceTone(
  validUntil: string | null,
): "ok" | "warning" | "error" | "muted" {
  if (!validUntil) return "muted";
  const now = new Date();
  const exp = new Date(validUntil);
  const diffDays = Math.floor(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "error";
  if (diffDays < 30) return "warning";
  return "ok";
}

export default function SubcontractorsSection({ projectId }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [allSubs, setAllSubs] = useState<Subcontractor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [agreedAmountSek, setAgreedAmountSek] = useState("");
  const [linkNotes, setLinkNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [linked, all] = await Promise.all([
        listProjectSubcontractors(projectId),
        listSubcontractors(),
      ]);
      setRows(linked);
      setAllSubs(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const linkedIds = useMemo(
    () => new Set((rows ?? []).map((r) => r.subcontractor_id)),
    [rows],
  );
  const available = useMemo(
    () => allSubs.filter((s) => s.active && !linkedIds.has(s.id)),
    [allSubs, linkedIds],
  );

  function resetForm() {
    setSelectedId("");
    setAgreedAmountSek("");
    setLinkNotes("");
  }

  async function handleLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const cents = agreedAmountSek
        ? Math.round(Number(agreedAmountSek) * 100)
        : null;
      await linkSubcontractorToProject(
        projectId,
        selectedId,
        cents,
        linkNotes.trim() || null,
      );
      resetForm();
      setShowAdd(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink(row: Row) {
    if (
      !confirm(
        `Ta bort kopplingen till ${row.subcontractors.company_name} från projektet?`,
      )
    )
      return;
    setError(null);
    try {
      await unlinkSubcontractorFromProject(projectId, row.subcontractor_id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Card>
      <CardHeader
        title="Underentreprenörer (UE)"
        subtitle="Företag kopplade till projektet — F-skatt och försäkring synas direkt."
        actions={
          !showAdd ? (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              disabled={available.length === 0}
              className={buttonClasses("primary", "sm")}
            >
              + Lägg till UE
            </button>
          ) : null
        }
      />

      <div className="px-5 sm:px-6 py-5 space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {showAdd && (
          <form
            onSubmit={handleLink}
            className="rounded-xl border border-white/10 bg-background-elevated/60 p-5 space-y-4"
          >
            <div>
              <label htmlFor="ue-select" className={labelClass}>
                Välj UE
              </label>
              <select
                id="ue-select"
                required
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Välj från registret —</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name}
                    {s.org_number ? ` (${s.org_number})` : ""}
                    {!s.has_fskatt ? " — saknar F-skatt!" : ""}
                  </option>
                ))}
              </select>
              {available.length === 0 ? (
                <p className={fieldHintClass}>
                  Alla aktiva UE är redan kopplade. Lägg upp nya i UE-registret först.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ue-amount" className={labelClass}>
                  Avtalad summa (SEK)
                </label>
                <input
                  id="ue-amount"
                  type="number"
                  min={0}
                  step="100"
                  value={agreedAmountSek}
                  onChange={(e) => setAgreedAmountSek(e.target.value)}
                  placeholder="180000"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="ue-notes" className={labelClass}>
                  Anteckningar
                </label>
                <input
                  id="ue-notes"
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  placeholder="Omfattning, leveransdatum…"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAdd(false);
                }}
                className={buttonClasses("ghost", "md")}
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={busy || !selectedId}
                className={buttonClasses("primary", "md")}
              >
                {busy ? "Lägger till…" : "Lägg till UE"}
              </button>
            </div>
          </form>
        )}

        {rows === null ? (
          <SkeletonRows rows={3} className="h-14" />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-8 text-center">
            <p className="text-sm font-medium">Inga UE kopplade än</p>
            <p className="mt-1 text-xs text-foreground-muted">
              Koppla en underentreprenör för att hålla koll på avtalad summa, F-skatt och försäkring.
            </p>
            {!showAdd && available.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className={`${buttonClasses("secondary", "sm")} mt-4`}
              >
                + Lägg till UE
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-white/5 -mx-5 sm:-mx-6">
            {rows.map((row) => {
              const sub = row.subcontractors;
              const insTone = insuranceTone(sub.insurance_valid_until);
              return (
                <li
                  key={row.subcontractor_id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 sm:px-6 py-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">
                        {sub.company_name}
                      </span>
                      <StatusPill
                        tone={sub.has_fskatt ? "ok" : "error"}
                        size="sm"
                      >
                        {sub.has_fskatt ? "F-skatt" : "Ingen F-skatt"}
                      </StatusPill>
                      <StatusPill tone={insTone} size="sm">
                        {insTone === "error"
                          ? "Försäkring utgången"
                          : insTone === "warning"
                            ? "Försäkring snart utgången"
                            : insTone === "muted"
                              ? "Försäkring saknas"
                              : `Försäkring giltig ${formatDateOnly(sub.insurance_valid_until)}`}
                      </StatusPill>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground-muted">
                      {sub.org_number ? (
                        <span className="font-mono">{sub.org_number}</span>
                      ) : null}
                      {sub.contact_name ? <span>{sub.contact_name}</span> : null}
                      {sub.email ? (
                        <a
                          href={`mailto:${sub.email}`}
                          className="text-amber-400 hover:underline"
                        >
                          {sub.email}
                        </a>
                      ) : null}
                      {row.notes ? <span>· {row.notes}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right tabular-nums">
                      <div className="text-[11px] uppercase tracking-[0.15em] text-foreground-muted">
                        Avtalad
                      </div>
                      <div className="text-sm font-medium">
                        {row.agreed_amount_cents != null
                          ? formatCents(row.agreed_amount_cents)
                          : "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleUnlink(row)}
                      className={buttonClasses("danger", "sm")}
                      aria-label={`Ta bort koppling till ${sub.company_name}`}
                    >
                      Ta bort
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
