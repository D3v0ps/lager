"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createProjectTemplate,
  listProjectTemplates,
  type ProjectTemplate,
  type ProjectTemplatePhase,
} from "@/lib/project-templates";
import { useTenantState } from "@/lib/tenant-context";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  ErrorPage,
  PageHeader,
  SkeletonRows,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

type DraftPhase = {
  name: string;
  ord: string;
  days_offset_from_start: string;
};

function emptyPhase(ord: number): DraftPhase {
  return { name: "", ord: String(ord), days_offset_from_start: "0" };
}

export default function ProjectTemplatesPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [templates, setTemplates] = useState<ProjectTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phases, setPhases] = useState<DraftPhase[]>([
    emptyPhase(1),
    emptyPhase(2),
  ]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function reload() {
    setError(null);
    listProjectTemplates()
      .then(setTemplates)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  function updatePhase(index: number, patch: Partial<DraftPhase>) {
    setPhases((current) =>
      current.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  function addPhase() {
    setPhases((current) => [...current, emptyPhase(current.length + 1)]);
  }

  function removePhase(index: number) {
    setPhases((current) =>
      current.length > 1
        ? current
            .filter((_, i) => i !== index)
            .map((p, i) => ({ ...p, ord: String(i + 1) }))
        : current,
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setFormError(null);
    setBusy(true);
    try {
      const cleanPhases: ProjectTemplatePhase[] = phases
        .filter((p) => p.name.trim())
        .map((p, idx) => ({
          name: p.name.trim(),
          ord: Number(p.ord) || idx + 1,
          days_offset_from_start: Number(p.days_offset_from_start) || 0,
        }));
      if (cleanPhases.length === 0) {
        throw new Error("Lägg till minst en fas.");
      }
      await createProjectTemplate({
        tenant_id: tenantData.id,
        name: name.trim(),
        description: description.trim() || null,
        phases: cleanPhases,
      });
      setName("");
      setDescription("");
      setPhases([emptyPhase(1), emptyPhase(2)]);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta projektmallar"
        message={error}
        retry={reload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/${tenant}/projects/`}
        className="text-sm text-foreground-muted hover:text-foreground"
      >
        ← Alla projekt
      </Link>

      <PageHeader
        eyebrow="Saldo Bygg"
        title="Projektmallar"
        subtitle="Spara strukturen från ett projekt — använd den för nästa."
      />

      {/* Existing templates */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground-muted">
          Sparade mallar
        </h2>
        {templates === null ? (
          <SkeletonRows rows={2} className="h-20" />
        ) : templates.length === 0 ? (
          <EmptyState
            title="Inga mallar än"
            description="Skapa din första projektmall nedan — t.ex. 'Badrumsrenovering' eller 'Komplett tillbyggnad'."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Card key={t.id} variant="elevated">
                <div className="px-5 py-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-foreground-muted line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground-muted tabular-nums">
                    {t.phases?.length ?? 0} faser
                  </p>
                  {t.phases && t.phases.length > 0 && (
                    <ul className="text-[11px] text-foreground-muted space-y-0.5">
                      {t.phases.slice(0, 4).map((p, i) => (
                        <li key={`${t.id}-${i}`} className="truncate">
                          <span className="tabular-nums">
                            {String(p.ord).padStart(2, "0")}.
                          </span>{" "}
                          {p.name}
                          <span className="ml-1 text-foreground-muted/60">
                            ·{" "}
                            {p.days_offset_from_start === 0
                              ? "start"
                              : `+${p.days_offset_from_start}d`}
                          </span>
                        </li>
                      ))}
                      {t.phases.length > 4 && (
                        <li className="text-foreground-muted/60">
                          …och {t.phases.length - 4} till
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled
                      title="Snart: skapa nytt projekt från mall"
                      className="w-full rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-white/[0.06]"
                    >
                      Använd
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Inline create form */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground-muted">
          Ny mall
        </h2>
        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5">
            {formError && <ErrorBanner>{formError}</ErrorBanner>}
            <div>
              <label htmlFor="tpl-name" className={labelClass}>
                Mallnamn
              </label>
              <input
                id="tpl-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Badrumsrenovering"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tpl-desc" className={labelClass}>
                Beskrivning
              </label>
              <textarea
                id="tpl-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Standardflöde för en typisk badrumsrenovering."
                className={inputClass}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <label className={`${labelClass} mb-0`}>Faser</label>
                <p className={`${fieldHintClass} mt-0`}>
                  Ord = ordning, dagar = från startdatum.
                </p>
              </div>
              <div className="space-y-2">
                {phases.map((p, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[60px_1fr_120px_auto] gap-2 items-start"
                  >
                    <input
                      aria-label={`Ord för fas ${idx + 1}`}
                      type="number"
                      min={1}
                      value={p.ord}
                      onChange={(e) =>
                        updatePhase(idx, { ord: e.target.value })
                      }
                      className={`${inputClass} tabular-nums text-center`}
                    />
                    <input
                      aria-label={`Namn på fas ${idx + 1}`}
                      value={p.name}
                      onChange={(e) =>
                        updatePhase(idx, { name: e.target.value })
                      }
                      placeholder={
                        idx === 0 ? "Rivning" : idx === 1 ? "Tätskikt" : "Fas"
                      }
                      className={inputClass}
                    />
                    <input
                      aria-label={`Dagar från start för fas ${idx + 1}`}
                      type="number"
                      min={0}
                      value={p.days_offset_from_start}
                      onChange={(e) =>
                        updatePhase(idx, {
                          days_offset_from_start: e.target.value,
                        })
                      }
                      placeholder="0"
                      className={`${inputClass} tabular-nums`}
                    />
                    <button
                      type="button"
                      onClick={() => removePhase(idx)}
                      disabled={phases.length === 1}
                      aria-label={`Ta bort fas ${idx + 1}`}
                      className="px-2 py-2 text-foreground-muted hover:text-rose-400 disabled:opacity-30 disabled:hover:text-foreground-muted"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPhase}
                className="text-xs text-amber-400 hover:underline"
              >
                + Lägg till fas
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={busy || !tenantData || !name.trim()}
                className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
              >
                {busy ? "Sparar…" : "Spara mall"}
              </button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
