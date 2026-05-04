"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  cadenceLabel,
  deleteRecurringOrder,
  listRecurringOrders,
  setRecurringOrderActive,
  type RecurringOrderWithItems,
} from "@/lib/recurring-orders";
import { listMyMemberships, type PortalMembership } from "@/lib/portal";
import { formatDateOnly } from "@/lib/format";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
  buttonClasses,
} from "@/app/_components/ui";

import PortalShell from "../_components/portal-shell";

const WEEKDAYS = [
  "söndag",
  "måndag",
  "tisdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lördag",
];

function scheduleSummary(order: RecurringOrderWithItems): string {
  switch (order.cadence) {
    case "daily":
      return "Skickas varje dag";
    case "weekly": {
      const day = WEEKDAYS[order.weekday ?? 1];
      return `Skickas varje ${day}`;
    }
    case "biweekly": {
      const day = WEEKDAYS[order.weekday ?? 1];
      return `Skickas varannan ${day}`;
    }
    case "monthly": {
      const dom = order.day_of_month ?? 1;
      return `Skickas den ${dom}:e varje månad`;
    }
  }
}

export default function PortalRecurringPage() {
  const { tenant } = useParams<{ tenant: string }>();
  return (
    <PortalShell tenant={tenant}>
      <RecurringContent tenantSlug={tenant} />
    </PortalShell>
  );
}

function RecurringContent({ tenantSlug }: { tenantSlug: string }) {
  const [membership, setMembership] = useState<PortalMembership | null>(null);
  const [orders, setOrders] = useState<RecurringOrderWithItems[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const memberships = await listMyMemberships(tenantSlug);
      const m = memberships[0];
      if (!m) {
        setMembership(null);
        setOrders([]);
        return;
      }
      setMembership(m);
      const list = await listRecurringOrders(m.customer_id);
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tenantSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function togglePause(order: RecurringOrderWithItems) {
    setBusyId(order.id);
    try {
      await setRecurringOrderActive(order.id, !order.active);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(order: RecurringOrderWithItems) {
    if (
      !confirm(
        `Är du säker på att du vill ta bort schemat "${order.name}"? Detta går inte att ångra.`,
      )
    ) {
      return;
    }
    setBusyId(order.id);
    try {
      await deleteRecurringOrder(order.id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta scheman"
        message={error}
        retry={reload}
      />
    );
  }

  if (orders === null || !membership) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Återkommande beställningar"
          title="Mina scheman"
        />
        <SkeletonRows rows={4} className="h-20" />
      </div>
    );
  }

  const newHref = `/${tenantSlug}/portal/recurring/new/`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Återkommande beställningar"
        title="Mina scheman"
        subtitle="Automatisera återkommande leveranser — vi skickar ordern åt dig."
        actions={
          <Link href={newHref} className={buttonClasses("primary")}>
            Nytt schema
          </Link>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title="Inga scheman än"
          description="Skapa ett schema så skickas dina vanliga beställningar automatiskt — t.ex. varje måndag eller den första i månaden."
          action={
            <Link href={newHref} className={buttonClasses("primary")}>
              Skapa första schemat
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.recurring_order_items.length;
            const isBusy = busyId === order.id;
            return (
              <Card key={order.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2.5">
                      <span className="truncate">{order.name}</span>
                      {order.active ? (
                        <StatusPill tone="ok" size="sm">
                          Aktivt
                        </StatusPill>
                      ) : (
                        <StatusPill tone="muted" size="sm">
                          Pausat
                        </StatusPill>
                      )}
                    </span>
                  }
                  subtitle={cadenceLabel(order.cadence)}
                  actions={
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePause(order)}
                        disabled={isBusy}
                        className={buttonClasses("secondary", "sm")}
                      >
                        {order.active ? "Pausa" : "Aktivera"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(order)}
                        disabled={isBusy}
                        className={buttonClasses("danger", "sm")}
                      >
                        Ta bort
                      </button>
                    </div>
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 sm:px-6 py-5">
                  <Field label="Schema" value={scheduleSummary(order)} />
                  <Field
                    label="Nästa körning"
                    value={formatDateOnly(order.next_run)}
                    emphasis
                  />
                  <Field
                    label="Antal artiklar"
                    value={`${itemCount} ${itemCount === 1 ? "rad" : "rader"}`}
                  />
                </div>
                {order.notes ? (
                  <div className="border-t border-white/5 px-5 sm:px-6 py-3.5 text-sm text-foreground-muted">
                    <span className="text-[11px] uppercase tracking-[0.15em] text-foreground-muted/80 mr-2">
                      Notering
                    </span>
                    {order.notes}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 ${emphasis ? "text-lg" : "text-sm"} font-medium tabular-nums tracking-tight`}
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
    </div>
  );
}
