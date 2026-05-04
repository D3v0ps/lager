"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createProject,
  PROJECT_STATUS_VALUES,
  projectStatusLabel,
  suggestProjectReference,
  type DeductionType,
  type ProjectStatus,
} from "@/lib/projects";
import { listCustomers, type Customer } from "@/lib/orders";
import { useTenantState } from "@/lib/tenant-context";
import {
  ErrorBanner,
  PageHeader,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

export default function NewProjectPage() {
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [deductionType, setDeductionType] = useState<DeductionType>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetSek, setBudgetSek] = useState("");
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCustomers().then(setCustomers).catch(() => setCustomers([]));
    suggestProjectReference()
      .then((r) => setReference((cur) => cur || r))
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setError(null);
    setBusy(true);
    try {
      const project = await createProject({
        tenant_id: tenantData.id,
        customer_id: customerId || null,
        reference: reference.trim() || null,
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        status,
        deduction_type: deductionType,
        start_date: startDate || null,
        end_date: endDate || null,
        budget_cents: budgetSek
          ? Math.round(Number(budgetSek) * 100)
          : null,
        notes: notes.trim() || null,
      });
      router.push(`/${tenant}/projects/project/?id=${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Nytt projekt"
        subtitle="Allt på en plats — tid, anbud, ÄTA, foton och material."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <div className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Projektnamn
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Renovering Strandvägen 12"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="reference" className={labelClass}>
                Referens
              </label>
              <input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="P-2026-014"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="">— Välj kund (valfritt) —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className={labelClass}>
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={inputClass}
              >
                {PROJECT_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {projectStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>
              Arbetsplats / adress
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Strandvägen 12, 114 56 Stockholm"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Beskrivning
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av arbetet, omfattning, krav…"
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6 space-y-5">
          <h3 className="text-base font-semibold">Tidsplan & ekonomi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start" className={labelClass}>
                Startdatum
              </label>
              <input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="end" className={labelClass}>
                Slutdatum
              </label>
              <input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className={labelClass}>
                Budget (SEK, valfritt)
              </label>
              <input
                id="budget"
                type="number"
                min={0}
                step="100"
                value={budgetSek}
                onChange={(e) => setBudgetSek(e.target.value)}
                placeholder="180000"
                className={`${inputClass} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="deduction" className={labelClass}>
                ROT/RUT-avdrag
              </label>
              <select
                id="deduction"
                value={deductionType ?? ""}
                onChange={(e) =>
                  setDeductionType(
                    (e.target.value || null) as DeductionType,
                  )
                }
                className={inputClass}
              >
                <option value="">Inget avdrag</option>
                <option value="rot">ROT-avdrag (renovering)</option>
                <option value="rut">RUT-avdrag (hushållstjänst)</option>
              </select>
              <p className={fieldHintClass}>
                Styr default på anbudens deductible-flagga.
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>
              Anteckningar
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
          >
            {busy ? "Skapar…" : "Skapa projekt"}
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
