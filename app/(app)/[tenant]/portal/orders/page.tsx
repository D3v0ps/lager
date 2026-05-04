"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  listMyMemberships,
  listPortalOrders,
  type PortalMembership,
  type PortalOrderRow,
} from "@/lib/portal";
import { formatDate, formatPrice } from "@/lib/format";
import { statusLabel, statusBadgeClasses } from "@/lib/orders";
import {
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorPage,
  PageHeader,
  SkeletonTable,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";

import PortalShell from "../_components/portal-shell";

export default function PortalOrdersPage() {
  const { tenant } = useParams<{ tenant: string }>();
  return (
    <PortalShell tenant={tenant}>
      <Suspense fallback={<SkeletonTable rows={4} />}>
        <OrdersContent tenantSlug={tenant} />
      </Suspense>
    </PortalShell>
  );
}

function OrdersContent({ tenantSlug }: { tenantSlug: string }) {
  const search = useSearchParams();
  const placedId = search.get("placed");
  const [orders, setOrders] = useState<PortalOrderRow[] | null>(null);
  const [membership, setMembership] = useState<PortalMembership | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const list = await listPortalOrders(m.customer_id);
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tenantSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta ordrar"
        message={error}
        retry={reload}
      />
    );
  }
  if (orders === null) return <SkeletonTable rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mina ordrar"
        title="Beställningshistorik"
        subtitle={`Ordrar du har lagt hos ${membership?.tenant.name ?? "leverantören"}`}
      />

      {placedId && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
        >
          Tack! Din order är skickad och väntar på leverantörens
          bekräftelse.
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState
          title="Inga ordrar än"
          description="När du lägger din första order hamnar den här."
        />
      ) : (
        <Card>
          <CardHeader title={`${orders.length} ordrar`} />
          <DataTable>
            <TableHead>
              <Th>Ref</Th>
              <Th>Status</Th>
              <Th align="right">Rader</Th>
              <Th align="right">Totalt</Th>
              <Th>Skapad</Th>
            </TableHead>
            <TBody>
              {orders.map((o) => {
                const total = o.sales_order_items.reduce(
                  (acc, it) => acc + it.quantity * Number(it.unit_price),
                  0,
                );
                const status = o.status as
                  | "draft"
                  | "confirmed"
                  | "picking"
                  | "shipped"
                  | "cancelled";
                return (
                  <Tr key={o.id}>
                    <Td>
                      <code className="font-mono text-sm">
                        {o.reference ?? o.id.slice(0, 8)}
                      </code>
                    </Td>
                    <Td>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClasses(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </Td>
                    <Td align="right">{o.sales_order_items.length}</Td>
                    <Td align="right">
                      <span className="font-medium tabular-nums">
                        {formatPrice(total)}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-foreground-muted">
                        {formatDate(o.created_at)}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </DataTable>
        </Card>
      )}
    </div>
  );
}
