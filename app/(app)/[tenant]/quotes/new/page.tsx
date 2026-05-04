"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { listCustomers, type Customer } from "@/lib/orders";
import { listProjects, type ProjectListRow } from "@/lib/projects";
import {
  createQuote,
  suggestQuoteReference,
} from "@/lib/quotes";
import {
  computeQuoteTotals,
  defaultDeductibleForKind,
  deductionLabel,
  formatCents,
  type DeductionType,
  type QuoteItem as QuoteCalcItem,
} from "@/lib/rot-rut";
import { useTenantState } from "@/lib/tenant-context";
import {
  Card,
  CardHeader,
  ErrorBanner,
  PageHeader,
  SkeletonRows,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

type DraftItem = {
  key: string;
  kind: "work" | "material" | "fixed";
  description: string;
  quantity: string;
  unit: string;
  unit_price_sek: string;
  vat_rate: string;
  deductible: boolean;
};

function emptyItem(kind: DraftItem["kind"] = "work"): DraftItem {
  return {
    key: Math.random().toString(36).slice(2),
    kind,
    description: "",
    quantity: "1",
    unit: kind === "work" ? "tim" : "st",
    unit_price_sek: "",
    vat_rate: "25",
    deductible: defaultDeductibleForKind(kind),
  };
}

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows rows={6} className="h-12" />}>
      <NewQuoteContent />
    </Suspense>
  );
}

function NewQuoteContent() {
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const params = useSearchParams();
  const projectId = params.get("project");

  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [boundProjectId, setBoundProjectId] = useState<string>(projectId ?? "");
  const [deductionType, setDeductionType] = useState<DeductionType>("rot");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<ProjectListRow[]>([]);
  const [items, setItems] = useState<DraftItem[]>([emptyItem("work")]);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCustomers().then(setCustomers).catch(() => undefined);
    listProjects().then(setProjects).catch(() => undefined);
    suggestQuoteReference()
      .then((r) => setReference((c) => c || r))
      .catch(() => undefined);
  }, []);

  // Pre-fill customer + deduction from selected project
  useEffect(() => {
    if (!boundProjectId) return;
    const p = projects.find((x) => x.id === boundProjectId);
    if (!p) return;
    if (!customerId && p.customer_id) setCustomerId(p.customer_id);
    if (p.deduction_type) setDeductionType(p.deduction_type);
  }, [boundProjectId, projects, customerId]);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, ...patch };
        // When kind changes, refresh deductible default + unit
        if (patch.kind && patch.kind !== it.kind) {
          next.deductible = defaultDeductibleForKind(patch.kind);
          next.unit = patch.kind === "work" ? "tim" : "st";
        }
        return next;
      }),
    );
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }
  function addItem(kind: DraftItem["kind"] = "work") {
    setItems((prev) => [...prev, emptyItem(kind)]);
  }

  const calcItems = useMemo<QuoteCalcItem[]>(
    () =>
      items.map((it) => ({
        kind: it.kind,
        quantity: Number(it.quantity) || 0,
        unit_price_cents: Math.round(Number(it.unit_price_sek) * 100) || 0,
        vat_rate: Number(it.vat_rate) || 0,
        deductible: it.deductible,
      })),
    [items],
  );

  const totals = useMemo(
    () => computeQuoteTotals(calcItems, deductionType),
    [calcItems, deductionType],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setError(null);
    setBusy(true);
    try {
      const quote = await createQuote({
        tenant_id: tenantData.id,
        customer_id: customerId || null,
        project_id: boundProjectId || null,
        reference: reference.trim() || null,
        title: title.trim(),
        description: description.trim() || null,
        deduction_type: deductionType,
        valid_until: validUntil || null,
        notes: notes.trim() || null,
        items: items.map((it, idx) => ({
          kind: it.kind,
          description: it.description.trim() || it.kind,
          quantity: Number(it.quantity) || 0,
          unit: it.unit || null,
          unit_price_cents: Math.round(Number(it.unit_price_sek) * 100) || 0,
          vat_rate: Number(it.vat_rate) || 0,
          deductible: it.deductible,
          ord: idx,
        })),
      });
      router.push(`/${tenant}/quotes/quote/?id=${quote.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Nytt anbud"
        subtitle="ROT/RUT-avdrag räknas ut automatiskt — kunden ser slutpriset direkt."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <Card>
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="title" className={labelClass}>
                Titel
              </label>
              <input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Renovering badrum, Strandvägen 12"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ref" className={labelClass}>
                Referens
              </label>
              <input
                id="ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Q-2026-001"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="valid" className={labelClass}>
                Giltigt till
              </label>
              <input
                id="valid"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="customer" className={labelClass}>
                Kund
              </label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Välj kund —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="project" className={labelClass}>
                Projekt
              </label>
              <select
                id="project"
                value={boundProjectId}
                onChange={(e) => setBoundProjectId(e.target.value)}
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
            <div>
              <label htmlFor="deduction" className={labelClass}>
                Avdrag
              </label>
              <select
                id="deduction"
                value={deductionType ?? ""}
                onChange={(e) =>
                  setDeductionType((e.target.value || null) as DeductionType)
                }
                className={inputClass}
              >
                <option value="">{deductionLabel(null)}</option>
                <option value="rot">{deductionLabel("rot")}</option>
                <option value="rut">{deductionLabel("rut")}</option>
              </select>
              <p className={fieldHintClass}>
                ROT/RUT = 50 % avdrag på arbetskostnaden, max 75&nbsp;000 kr/år.
              </p>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="desc" className={labelClass}>
                Beskrivning (visas på anbudet)
              </label>
              <textarea
                id="desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Rader"
            actions={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem("work")}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.05]"
                >
                  + Arbete
                </button>
                <button
                  type="button"
                  onClick={() => addItem("material")}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.05]"
                >
                  + Material
                </button>
                <button
                  type="button"
                  onClick={() => addItem("fixed")}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.05]"
                >
                  + Klumpsumma
                </button>
              </div>
            }
          />
          <ul className="divide-y divide-white/5">
            {items.map((it, i) => (
              <li key={it.key} className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_auto] gap-2">
                  <select
                    value={it.kind}
                    onChange={(e) =>
                      updateItem(i, {
                        kind: e.target.value as DraftItem["kind"],
                      })
                    }
                    className={`${inputClass} text-xs`}
                  >
                    <option value="work">Arbete</option>
                    <option value="material">Material</option>
                    <option value="fixed">Klumpsumma</option>
                  </select>
                  <input
                    placeholder="Beskrivning"
                    value={it.description}
                    onChange={(e) =>
                      updateItem(i, { description: e.target.value })
                    }
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label="Ta bort rad"
                    className="rounded-md border border-white/15 px-3 py-2 text-foreground-muted hover:bg-white/[0.05]"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Antal"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(i, { quantity: e.target.value })
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                  <input
                    placeholder="Enhet"
                    value={it.unit}
                    onChange={(e) => updateItem(i, { unit: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="À-pris kr"
                    value={it.unit_price_sek}
                    onChange={(e) =>
                      updateItem(i, { unit_price_sek: e.target.value })
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                  <select
                    value={it.vat_rate}
                    onChange={(e) =>
                      updateItem(i, { vat_rate: e.target.value })
                    }
                    aria-label="Moms"
                    className={inputClass}
                  >
                    <option value="25">25 %</option>
                    <option value="12">12 %</option>
                    <option value="6">6 %</option>
                    <option value="0">0 %</option>
                  </select>
                  <label className="flex items-center gap-2 px-3 rounded-md border border-white/10 text-xs">
                    <input
                      type="checkbox"
                      checked={it.deductible}
                      onChange={(e) =>
                        updateItem(i, { deductible: e.target.checked })
                      }
                      disabled={!deductionType}
                      className="h-4 w-4 accent-amber-500"
                    />
                    {deductionType ? "ROT/RUT-grund" : "Avdrag PÅ"}
                  </label>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-foreground-muted">
                Inga rader. Lägg till en.
              </li>
            )}
          </ul>
        </Card>

        <Card variant="elevated">
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Subtotal" value={formatCents(totals.subtotal_cents)} />
            <Stat label="Moms" value={formatCents(totals.vat_cents)} />
            <Stat label="Totalt inkl moms" value={formatCents(totals.total_cents)} />
            {deductionType ? (
              <Stat
                label={`Kund betalar (efter ${deductionType.toUpperCase()})`}
                value={formatCents(totals.customer_pays_cents)}
                hint={`${formatCents(totals.deduction_cents)} avdrag`}
                emphasis
              />
            ) : (
              <Stat label="Kund betalar" value={formatCents(totals.total_cents)} />
            )}
          </div>
        </Card>

        <Card>
          <div className="px-6 py-5">
            <label htmlFor="notes" className={labelClass}>
              Anteckningar (visas inte för kund)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !title.trim() || items.length === 0}
            className="rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            {busy ? "Skapar…" : "Skapa anbud"}
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

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 ${emphasis ? "text-2xl" : "text-lg"} font-semibold tabular-nums tracking-tight`}
        style={
          emphasis
            ? {
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : undefined
        }
      >
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-emerald-400 mt-0.5">{hint}</p>
      )}
    </div>
  );
}
