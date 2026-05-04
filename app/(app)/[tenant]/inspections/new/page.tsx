"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  createInspectionTemplate,
  inspectionKindLabel,
  INSPECTION_KINDS,
  type InspectionItem,
  type InspectionItemKind,
  type InspectionKind,
} from "@/lib/inspections";
import { useTenantState } from "@/lib/tenant-context";
import {
  Card,
  ErrorBanner,
  PageHeader,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

const ITEM_KINDS: { value: InspectionItemKind; label: string }[] = [
  { value: "check", label: "Kryss (ok / avvikelse)" },
  { value: "text", label: "Fritext" },
  { value: "photo", label: "Foto" },
  { value: "measure", label: "Mätvärde" },
];

function uid(): string {
  // Short, collision-resistant id for in-template item identity.
  // Doesn't need to be a UUID — just unique within this template.
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function emptyItem(): InspectionItem {
  return { id: uid(), label: "", kind: "check", required: false };
}

export default function NewInspectionTemplatePage() {
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<InspectionKind>("egenkontroll");
  const [items, setItems] = useState<InspectionItem[]>([
    emptyItem(),
    emptyItem(),
    emptyItem(),
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(idx: number, patch: Partial<InspectionItem>) {
    setItems((cur) =>
      cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }

  function addItem() {
    setItems((cur) => [...cur, emptyItem()]);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    setItems((cur) => {
      const next = idx + dir;
      if (next < 0 || next >= cur.length) return cur;
      const copy = cur.slice();
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setError(null);
    const cleanItems = items
      .map((it) => ({ ...it, label: it.label.trim() }))
      .filter((it) => it.label.length > 0);
    if (cleanItems.length === 0) {
      setError("Lägg till minst en punkt i mallen.");
      return;
    }
    setBusy(true);
    try {
      await createInspectionTemplate({
        tenant_id: tenantData.id,
        kind,
        name: name.trim(),
        description: description.trim() || null,
        items: cleanItems,
      });
      router.push(`/${tenant}/inspections/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/${tenant}/inspections/`}
        className="text-sm text-foreground-muted hover:text-foreground"
      >
        ← Alla mallar
      </Link>
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Ny kontrollmall"
        subtitle="Bygg en checklista som ditt team kan starta från valfritt projekt."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <Card>
          <div className="px-5 sm:px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Mallnamn
                </label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Egenkontroll plattsättning"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="kind" className={labelClass}>
                  Typ
                </label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as InspectionKind)}
                  className={inputClass}
                >
                  {INSPECTION_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {inspectionKindLabel(k)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>
                Beskrivning
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="När ska den användas? Vad ska kontrolleras?"
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-white/5 px-5 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium tracking-tight">Punkter</h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Drag-ordningen blir samma som på arbetsplatsen.
              </p>
            </div>
            <span className="text-[11px] tabular-nums text-foreground-muted">
              {items.length}{" "}
              {items.length === 1 ? "rad" : "rader"}
            </span>
          </div>

          <ul className="divide-y divide-white/5">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="px-5 sm:px-6 py-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-2 text-[11px] tabular-nums text-foreground-muted w-5 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <label
                        htmlFor={`label-${item.id}`}
                        className="sr-only"
                      >
                        Punkt {idx + 1}
                      </label>
                      <input
                        id={`label-${item.id}`}
                        value={item.label}
                        onChange={(e) =>
                          updateItem(idx, { label: e.target.value })
                        }
                        placeholder="Beskriv punkten — t.ex. ”Riskinventering genomförd”"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:items-center">
                      <select
                        aria-label={`Typ för punkt ${idx + 1}`}
                        value={item.kind}
                        onChange={(e) =>
                          updateItem(idx, {
                            kind: e.target.value as InspectionItemKind,
                          })
                        }
                        className={inputClass}
                      >
                        {ITEM_KINDS.map((k) => (
                          <option key={k.value} value={k.value}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-xs text-foreground-muted px-1">
                        <input
                          type="checkbox"
                          checked={!!item.required}
                          onChange={(e) =>
                            updateItem(idx, {
                              required: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-white/20 bg-background-elevated/60 accent-amber-500"
                        />
                        Obligatorisk
                      </label>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Flytta upp"
                          className="rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/[0.05] disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === items.length - 1}
                          aria-label="Flytta ner"
                          className="rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/[0.05] disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          aria-label="Ta bort"
                          className="rounded-md border border-red-400/20 text-red-300 px-2 py-1 text-xs hover:bg-red-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/5 px-5 sm:px-6 py-4">
            <button
              type="button"
              onClick={addItem}
              className="rounded-md border border-white/15 bg-white/[0.02] px-3 py-1.5 text-sm font-medium hover:bg-white/[0.06]"
            >
              + Lägg till rad
            </button>
            <p className={fieldHintClass}>
              Tomma rader sparas inte.
            </p>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !name.trim() || !tenantData}
            className="rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            {busy ? "Sparar…" : "Spara mall"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-white/15 px-4 py-2.5 text-sm hover:bg-white/[0.05]"
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
}
