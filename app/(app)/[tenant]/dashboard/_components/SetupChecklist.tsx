"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listAllMovements, listProducts } from "@/lib/data";
import { listCustomers } from "@/lib/orders";
import { listSuppliers } from "@/lib/suppliers";
import { listTeam } from "@/lib/team";
import { useTenant } from "@/lib/tenant-context";

type StepId = "product" | "movement" | "supplier" | "customer" | "team";

type StepDef = {
  id: StepId;
  title: string;
  description: string;
  ctaLabel: string;
  href: (tenant: string) => string;
};

const STEPS: readonly StepDef[] = [
  {
    id: "product",
    title: "Lägg till din första produkt",
    description: "Börja bygga ditt sortiment så får du KPI:er och låg-lager-larm.",
    ctaLabel: "+ Lägg till produkt",
    href: (tenant) => `/${tenant}/products/new/`,
  },
  {
    id: "movement",
    title: "Registrera en lagerrörelse",
    description: "In- eller utleveranser håller saldot rätt över tid.",
    ctaLabel: "Till produkter",
    href: (tenant) => `/${tenant}/`,
  },
  {
    id: "supplier",
    title: "Lägg till en leverantör",
    description: "Koppla leverantörer till inköpsorder och påfyllning.",
    ctaLabel: "Ny leverantör",
    href: (tenant) => `/${tenant}/suppliers/`,
  },
  {
    id: "customer",
    title: "Lägg till en kund",
    description: "Spara dina kunder för snabbare orderhantering.",
    ctaLabel: "Ny kund",
    href: (tenant) => `/${tenant}/customers/`,
  },
  {
    id: "team",
    title: "Bjud in en kollega",
    description: "Saldo blir mer värdefullt när hela teamet är med.",
    ctaLabel: "Hantera team",
    href: (tenant) => `/${tenant}/team/`,
  },
] as const;

type Completion = Record<StepId, boolean>;

const EMPTY_COMPLETION: Completion = {
  product: false,
  movement: false,
  supplier: false,
  customer: false,
  team: false,
};

function dismissKey(tenantId: string): string {
  return `saldo-setup-dismissed-${tenantId}`;
}

export default function SetupChecklist() {
  const tenant = useTenant();
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [dismissChecked, setDismissChecked] = useState<boolean>(false);

  // Read dismissal flag synchronously after mount so we don't flash the
  // checklist before hiding it.
  useEffect(() => {
    if (!tenant) return;
    try {
      const stored = window.localStorage.getItem(dismissKey(tenant.id));
      setDismissed(stored === "1");
    } catch (err) {
      console.warn("SetupChecklist: localStorage read failed", err);
    }
    setDismissChecked(true);
  }, [tenant]);

  // Load completion state for each step independently so a single failing
  // call doesn't take the whole checklist down.
  useEffect(() => {
    if (!tenant) return;
    let cancelled = false;

    const wrap = <T,>(p: Promise<T>, label: string): Promise<T | null> =>
      p.catch((err: Error) => {
        console.warn(`SetupChecklist: ${label} failed`, err);
        return null;
      });

    Promise.all([
      wrap(listProducts(), "listProducts"),
      wrap(listAllMovements(1), "listAllMovements"),
      wrap(listSuppliers(), "listSuppliers"),
      wrap(listCustomers(), "listCustomers"),
      wrap(listTeam(tenant.id), "listTeam"),
    ]).then(([products, movements, suppliers, customers, team]) => {
      if (cancelled) return;
      setCompletion({
        product: (products?.length ?? 0) >= 1,
        movement: (movements?.length ?? 0) >= 1,
        supplier: (suppliers?.length ?? 0) >= 1,
        customer: (customers?.length ?? 0) >= 1,
        team: (team?.length ?? 0) >= 2,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [tenant]);

  function handleDismiss() {
    if (!tenant) return;
    try {
      window.localStorage.setItem(dismissKey(tenant.id), "1");
    } catch (err) {
      console.warn("SetupChecklist: localStorage write failed", err);
    }
    setDismissed(true);
  }

  // Render nothing until we know the dismissal state — avoids flicker.
  if (!tenant || !dismissChecked) return null;
  if (dismissed) return null;

  // Loading skeleton while data is being fetched.
  if (!completion) {
    return (
      <section
        aria-busy="true"
        className="rounded-2xl border border-white/10 bg-background-elevated/40 p-6"
      >
        <div className="flex items-baseline justify-between mb-3">
          <div className="h-5 w-48 rounded bg-white/5 animate-pulse" />
          <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-1.5 rounded-full bg-white/5 mb-5" />
        <ul className="divide-y divide-white/5">
          {STEPS.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <div className="h-5 w-5 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-1/3 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-white/5 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const doneCount = STEPS.reduce(
    (acc, s) => acc + (completion[s.id] ? 1 : 0),
    0,
  );
  const totalCount = STEPS.length;
  const allDone = doneCount === totalCount;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  if (allDone) {
    return (
      <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4 flex items-center gap-3">
        <CheckIcon done className="shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-200">
            Klart! Allt på plats.
          </p>
          <p className="text-xs text-emerald-300/70">
            Tack för att du satte upp Saldo. Du är redo att köra.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Stäng"
          className="rounded-md p-1.5 text-emerald-200/70 hover:bg-emerald-500/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-background-elevated/40 p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />
      <div className="relative">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
              Kom igång
            </p>
            <h2 className="mt-1 text-base font-semibold">
              Sätt upp Saldo på {totalCount - doneCount}{" "}
              {totalCount - doneCount === 1 ? "steg" : "steg"} till
            </h2>
          </div>
          <span className="text-sm text-foreground-muted tabular-nums">
            {doneCount} av {totalCount}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-5">
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${progressPct}%`,
              background: "var(--brand-gradient)",
            }}
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
          />
        </div>
        <ul className="divide-y divide-white/5">
          {STEPS.map((step) => {
            const done = completion[step.id];
            const href = step.href(tenant.slug);
            return (
              <li
                key={step.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <CheckIcon done className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      done
                        ? "text-foreground-muted line-through"
                        : ""
                    }`}
                  >
                    {step.title}
                  </p>
                  {!done && (
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
                {!done && (
                  <Link
                    href={href}
                    className="shrink-0 rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                  >
                    {step.ctaLabel}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CheckIcon({
  done,
  className = "",
}: {
  done: boolean;
  className?: string;
}) {
  if (done) {
    return (
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-background ${className}`}
        style={{ background: "var(--brand-gradient)" }}
        aria-label="Klar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.55a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.84a1 1 0 0 1 1.415-.006Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={`inline-block h-5 w-5 rounded-full border-2 border-white/20 ${className}`}
      aria-label="Inte klar"
    />
  );
}
