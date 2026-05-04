"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cloneProject } from "@/lib/project-templates";
import { listCustomers, type Customer } from "@/lib/orders";
import { useTenantState } from "@/lib/tenant-context";
import { ErrorBanner } from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

type Props = {
  projectId: string;
};

/**
 * Small button that opens an inline popover form to clone an existing
 * project — copies phases + team via cloneProject().
 */
export default function CloneFromProjectButton({ projectId }: Props) {
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    listCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, [open]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setError(null);
    setBusy(true);
    try {
      const newId = await cloneProject({
        source_id: projectId,
        tenant_id: tenantData.id,
        new_name: name.trim(),
        customer_id: customerId || null,
        start_date: startDate || null,
      });
      setOpen(false);
      router.push(`/${tenant}/projects/project/?id=${newId}`);
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
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-white/15 bg-white/[0.02] px-3 py-1.5 text-sm font-medium hover:bg-white/[0.06]"
      >
        Klona projekt
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-background-elevated/95 backdrop-blur shadow-2xl">
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold tracking-tight">
                Klona till nytt projekt
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Faser och team kopieras. Tid, foton och material följer inte med.
              </p>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <div>
              <label htmlFor="clone-name" className={labelClass}>
                Nytt projektnamn
              </label>
              <input
                id="clone-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Badrum etapp 2"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="clone-customer" className={labelClass}>
                Kund (valfritt)
              </label>
              <select
                id="clone-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Ingen kund —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="clone-start" className={labelClass}>
                Startdatum (valfritt)
              </label>
              <input
                id="clone-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={busy || !name.trim() || !tenantData}
                className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
              >
                {busy ? "Klonar…" : "Klona"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
