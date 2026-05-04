"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  completeInspection,
  inspectionKindLabel,
  listInspectionTemplates,
  listProjectInspections,
  startInspection,
  updateInspectionItems,
  type InspectionItem,
  type InspectionKind,
  type InspectionTemplate,
  type ProjectInspection,
} from "@/lib/inspections";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  SkeletonRows,
  StatusPill,
} from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

// Brand-tinted ribbon per inspection kind — mirrors inspections list page
// so a started kontroll feels visually anchored to its source template.
function kindRibbonStyle(kind: InspectionKind): string {
  switch (kind) {
    case "kma":
      return "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)";
    case "egenkontroll":
      return "linear-gradient(90deg, #ef4444 0%, #ec4899 50%, #8b5cf6 100%)";
    case "skyddsrond":
      return "linear-gradient(90deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)";
    case "other":
      return "linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)";
  }
}

function statusTone(
  status: ProjectInspection["status"],
): "info" | "ok" | "error" {
  if (status === "completed") return "ok";
  if (status === "failed") return "error";
  return "info";
}

function statusLabel(status: ProjectInspection["status"]): string {
  if (status === "completed") return "Slutförd";
  if (status === "failed") return "Underkänd";
  return "Pågår";
}

// A required item is "filled" when the user has signalled an explicit
// answer for it: a checked check-item, a non-empty text/measure value, or
// a photo URL. We need this to gate "Slutför kontroll".
function isItemFilled(item: InspectionItem): boolean {
  switch (item.kind) {
    case "check":
      return item.ok === true || item.ok === false;
    case "text":
      return typeof item.value === "string" && item.value.trim().length > 0;
    case "photo":
      return typeof item.value === "string" && item.value.trim().length > 0;
    case "measure":
      return (
        item.value !== null &&
        item.value !== undefined &&
        String(item.value).trim().length > 0
      );
  }
}

export default function InspectionsTab({ projectId }: { projectId: string }) {
  const [inspections, setInspections] = useState<ProjectInspection[] | null>(
    null,
  );
  const [templates, setTemplates] = useState<InspectionTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [insp, tmpl] = await Promise.all([
        listProjectInspections(projectId),
        listInspectionTemplates(),
      ]);
      setInspections(insp);
      setTemplates(tmpl.filter((t) => t.active));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleStart(template: InspectionTemplate) {
    setBusyTemplateId(template.id);
    setError(null);
    try {
      // Clone items so mutating the project_inspection later doesn't
      // change the template's items array.
      const cloned: InspectionItem[] = template.items.map((it) => ({
        ...it,
        value: null,
        ok: null,
        comment: null,
      }));
      const created = await startInspection({
        project_id: projectId,
        template_id: template.id,
        kind: template.kind,
        title: template.name,
        items: cloned,
      });
      setOpenId(created.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function handleSaveItems(id: string, items: InspectionItem[]) {
    setError(null);
    try {
      await updateInspectionItems(id, items);
      setInspections((cur) =>
        cur ? cur.map((i) => (i.id === id ? { ...i, items } : i)) : cur,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleComplete(id: string, signerEmail: string | null) {
    setError(null);
    try {
      await completeInspection(id, signerEmail);
      setOpenId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-8">
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <section className="space-y-3">
        <header>
          <h2 className="text-base font-semibold tracking-tight">
            Påbörjade kontroller
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Klicka för att fylla i punkter och slutföra.
          </p>
        </header>

        {inspections === null ? (
          <SkeletonRows rows={3} className="h-16" />
        ) : inspections.length === 0 ? (
          <EmptyState
            title="Inga kontroller startade än"
            description="Starta en kontroll från en mall nedan — den klonas så att projektet får en egen kopia."
          />
        ) : (
          <div className="space-y-3">
            {inspections.map((insp) => (
              <InspectionCard
                key={insp.id}
                inspection={insp}
                open={openId === insp.id}
                onToggle={() =>
                  setOpenId((cur) => (cur === insp.id ? null : insp.id))
                }
                onSaveItems={(items) => handleSaveItems(insp.id, items)}
                onComplete={(email) => handleComplete(insp.id, email)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <header>
          <h2 className="text-base font-semibold tracking-tight">
            Starta ny kontroll
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Välj en mall för att starta en ny kontroll på det här projektet.
          </p>
        </header>

        {templates === null ? (
          <SkeletonRows rows={2} className="h-14" />
        ) : templates.length === 0 ? (
          <Card>
            <p className="px-5 py-12 text-sm text-foreground-muted text-center">
              Inga mallar finns ännu — skapa en under{" "}
              <span className="text-foreground">Saldo Bygg → Kontrollmallar</span>.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((t) => (
              <Card key={t.id}>
                <div
                  aria-hidden="true"
                  className="h-1 w-full"
                  style={{ background: kindRibbonStyle(t.kind) }}
                />
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-foreground-muted">
                      <StatusPill tone="info" size="sm">
                        {inspectionKindLabel(t.kind)}
                      </StatusPill>
                      <span className="tabular-nums">
                        {t.items.length} punkter
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart(t)}
                    disabled={busyTemplateId === t.id}
                    className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 shrink-0"
                  >
                    {busyTemplateId === t.id ? "Startar…" : "Starta"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single inspection — collapsible card with item editor
// ---------------------------------------------------------------------------

function InspectionCard({
  inspection,
  open,
  onToggle,
  onSaveItems,
  onComplete,
}: {
  inspection: ProjectInspection;
  open: boolean;
  onToggle: () => void;
  onSaveItems: (items: InspectionItem[]) => Promise<void>;
  onComplete: (signerEmail: string | null) => Promise<void>;
}) {
  // Local working copy so onChange feels instant — flushed via onSaveItems.
  const [items, setItems] = useState<InspectionItem[]>(inspection.items);
  const [signerEmail, setSignerEmail] = useState("");
  const [completing, setCompleting] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  // If parent reloads (e.g. after starting a new kontroll), keep our
  // working copy in sync with the latest server data.
  useEffect(() => {
    setItems(inspection.items);
  }, [inspection.items]);

  const isCompleted = inspection.status === "completed";
  const requiredUnfilled = useMemo(
    () => items.some((it) => it.required && !isItemFilled(it)),
    [items],
  );

  function patchItem(idx: number, patch: Partial<InspectionItem>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function commitItem(idx: number, patch: Partial<InspectionItem>) {
    if (isCompleted) return;
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setItems(next);
    setSavingIdx(idx);
    try {
      await onSaveItems(next);
    } finally {
      setSavingIdx(null);
    }
  }

  async function handleComplete() {
    if (requiredUnfilled) return;
    setCompleting(true);
    try {
      await onComplete(signerEmail.trim() || null);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <Card>
      <div
        aria-hidden="true"
        className="h-1 w-full"
        style={{ background: kindRibbonStyle(inspection.kind) }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{inspection.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <StatusPill tone="info" size="sm">
              {inspectionKindLabel(inspection.kind)}
            </StatusPill>
            <StatusPill tone={statusTone(inspection.status)} size="sm">
              {statusLabel(inspection.status)}
            </StatusPill>
            {inspection.completed_at && (
              <span>· Slutförd {formatDate(inspection.completed_at)}</span>
            )}
            {inspection.signed_by_email && (
              <span>· Signerad av {inspection.signed_by_email}</span>
            )}
          </p>
        </div>
        <span className="text-xs text-foreground-muted shrink-0">
          {open ? "Stäng ▲" : "Öppna ▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/5">
          <ul className="divide-y divide-white/5">
            {items.map((item, idx) => (
              <li key={item.id} className="px-5 py-4">
                <ItemRow
                  item={item}
                  index={idx}
                  disabled={isCompleted}
                  saving={savingIdx === idx}
                  onPatch={(patch) => patchItem(idx, patch)}
                  onCommit={(patch) => void commitItem(idx, patch)}
                />
              </li>
            ))}
          </ul>

          {!isCompleted && (
            <div className="border-t border-white/5 px-5 py-4 space-y-3">
              <div>
                <label htmlFor={`signer-${inspection.id}`} className={labelClass}>
                  E-post för digital signering (valfritt)
                </label>
                <input
                  id={`signer-${inspection.id}`}
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="arbetsledare@dittforetag.se"
                  className={inputClass}
                />
              </div>
              {requiredUnfilled && (
                <p className="text-xs text-amber-400">
                  Fyll i alla obligatoriska punkter innan du slutför.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completing || requiredUnfilled}
                  className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
                >
                  {completing ? "Slutför…" : "Slutför kontroll"}
                </button>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="border-t border-white/5 px-5 py-4 text-xs text-foreground-muted">
              Kontrollen är slutförd och låst.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Item rendering — one row per item, switches on `kind`
// ---------------------------------------------------------------------------

function ItemRow({
  item,
  index,
  disabled,
  saving,
  onPatch,
  onCommit,
}: {
  item: InspectionItem;
  index: number;
  disabled: boolean;
  saving: boolean;
  onPatch: (patch: Partial<InspectionItem>) => void;
  onCommit: (patch: Partial<InspectionItem>) => void;
}) {
  const filled = isItemFilled(item);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[11px] tabular-nums text-foreground-muted w-5 shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            {item.label}
            {item.required && (
              <span
                aria-label="obligatorisk"
                className="ml-1.5 text-[11px] text-amber-400"
              >
                *
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-foreground-muted">
            {item.kind === "check" && "Kryss"}
            {item.kind === "text" && "Fritext"}
            {item.kind === "photo" && "Foto"}
            {item.kind === "measure" && "Mätvärde"}
            {saving && <span className="ml-2">· sparar…</span>}
          </p>
        </div>
        {/* Animated checkmark — appears when item is filled. */}
        <span
          aria-hidden="true"
          className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
            filled
              ? "scale-100 opacity-100 border-emerald-400/40 bg-emerald-500/15 text-emerald-400"
              : "scale-75 opacity-0 border-white/10 text-transparent"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 8.5 6.5 12 13 4.5" />
          </svg>
        </span>
      </div>

      <div className="pl-8">
        {item.kind === "check" && (
          <CheckRow
            item={item}
            disabled={disabled}
            onPatch={onPatch}
            onCommit={onCommit}
          />
        )}
        {item.kind === "text" && (
          <TextRow
            item={item}
            disabled={disabled}
            onPatch={onPatch}
            onCommit={onCommit}
          />
        )}
        {item.kind === "photo" && (
          <PhotoRow
            item={item}
            disabled={disabled}
            onPatch={onPatch}
            onCommit={onCommit}
          />
        )}
        {item.kind === "measure" && (
          <MeasureRow
            item={item}
            disabled={disabled}
            onPatch={onPatch}
            onCommit={onCommit}
          />
        )}
      </div>
    </div>
  );
}

function CheckRow({
  item,
  disabled,
  onPatch,
  onCommit,
}: {
  item: InspectionItem;
  disabled: boolean;
  onPatch: (patch: Partial<InspectionItem>) => void;
  onCommit: (patch: Partial<InspectionItem>) => void;
}) {
  const ok = item.ok === true;
  const deviation = item.ok === false;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onCommit({ ok: ok ? null : true })}
          aria-pressed={ok}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            ok
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
              : "border-white/15 bg-white/[0.02] hover:bg-white/[0.06]"
          }`}
        >
          OK
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onCommit({ ok: deviation ? null : false })}
          aria-pressed={deviation}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            deviation
              ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
              : "border-white/15 bg-white/[0.02] hover:bg-white/[0.06]"
          }`}
        >
          Avvikelse
        </button>
      </div>
      <textarea
        rows={2}
        disabled={disabled}
        value={item.comment ?? ""}
        onChange={(e) => onPatch({ comment: e.target.value })}
        onBlur={(e) => onCommit({ comment: e.target.value })}
        placeholder="Kommentar (valfritt)"
        className={inputClass}
      />
    </div>
  );
}

function TextRow({
  item,
  disabled,
  onPatch,
  onCommit,
}: {
  item: InspectionItem;
  disabled: boolean;
  onPatch: (patch: Partial<InspectionItem>) => void;
  onCommit: (patch: Partial<InspectionItem>) => void;
}) {
  const value = typeof item.value === "string" ? item.value : "";
  return (
    <textarea
      rows={3}
      disabled={disabled}
      value={value}
      onChange={(e) => onPatch({ value: e.target.value })}
      onBlur={(e) => onCommit({ value: e.target.value })}
      placeholder="Skriv din notering här"
      className={inputClass}
    />
  );
}

function PhotoRow({
  item,
  disabled,
  onPatch,
  onCommit,
}: {
  item: InspectionItem;
  disabled: boolean;
  onPatch: (patch: Partial<InspectionItem>) => void;
  onCommit: (patch: Partial<InspectionItem>) => void;
}) {
  const value = typeof item.value === "string" ? item.value : "";
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-dashed border-white/15 bg-white/[0.02] px-3 py-4 text-xs text-foreground-muted text-center">
        Bild kommer i nästa release. Klistra in en URL så länge.
      </div>
      <input
        type="url"
        disabled={disabled}
        value={value}
        onChange={(e) => onPatch({ value: e.target.value })}
        onBlur={(e) => onCommit({ value: e.target.value })}
        placeholder="https://…"
        className={inputClass}
      />
    </div>
  );
}

function MeasureRow({
  item,
  disabled,
  onPatch,
  onCommit,
}: {
  item: InspectionItem;
  disabled: boolean;
  onPatch: (patch: Partial<InspectionItem>) => void;
  onCommit: (patch: Partial<InspectionItem>) => void;
}) {
  // value holds the numeric reading; comment is repurposed as the unit so we
  // don't need to extend the schema. Both persist via updateInspectionItems.
  const value =
    typeof item.value === "number" || typeof item.value === "string"
      ? String(item.value ?? "")
      : "";
  const unit = item.comment ?? "";
  return (
    <div className="grid grid-cols-[1fr_120px] gap-2">
      <input
        type="number"
        step="any"
        disabled={disabled}
        value={value}
        onChange={(e) =>
          onPatch({ value: e.target.value === "" ? null : e.target.value })
        }
        onBlur={(e) =>
          onCommit({
            value: e.target.value === "" ? null : Number(e.target.value),
          })
        }
        placeholder="Värde"
        className={`${inputClass} tabular-nums`}
      />
      <input
        type="text"
        disabled={disabled}
        value={unit}
        onChange={(e) => onPatch({ comment: e.target.value })}
        onBlur={(e) => onCommit({ comment: e.target.value })}
        placeholder="Enhet (mm, kg…)"
        className={inputClass}
      />
    </div>
  );
}
