"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  listMyMemberships,
  type PortalMembership,
} from "@/lib/portal";
import {
  Card,
  CardHeader,
  ErrorPage,
  PageHeader,
  SkeletonRows,
} from "@/app/_components/ui";
import { roleLabel } from "@/lib/roles";

import PortalShell from "../_components/portal-shell";

export default function PortalAccountPage() {
  const { tenant } = useParams<{ tenant: string }>();
  return (
    <PortalShell tenant={tenant}>
      <AccountContent tenantSlug={tenant} />
    </PortalShell>
  );
}

function AccountContent({ tenantSlug }: { tenantSlug: string }) {
  const [memberships, setMemberships] = useState<PortalMembership[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyMemberships(tenantSlug)
      .then((list) => {
        if (cancelled) return;
        setMemberships(list);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta kontot"
        message={error}
      />
    );
  }
  if (memberships === null) return <SkeletonRows rows={4} className="h-12" />;

  const m = memberships[0];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Konto" title="Mitt konto" />

      {m ? (
        <Card>
          <CardHeader title="Kunduppgifter" subtitle={m.tenant.name} />
          <dl className="divide-y divide-white/5">
            <Row label="Företagsnamn" value={m.customer.name} />
            <Row label="E-post" value={m.customer.email ?? "—"} />
            <Row
              label="Faktureringsadress"
              value={m.customer.billing_address ?? "—"}
            />
            <Row
              label="Leveransadress"
              value={m.customer.shipping_address ?? "—"}
            />
            <Row
              label="Din roll"
              value={
                <span className="inline-flex items-center gap-2">
                  {roleLabel(m.role === "admin" ? "admin" : "member")}
                  <span className="text-[10px] uppercase tracking-[0.15em] text-foreground-muted">
                    {m.role === "admin"
                      ? "Kan bjuda in kollegor"
                      : "Beställa-rättigheter"}
                  </span>
                </span>
              }
            />
          </dl>
        </Card>
      ) : (
        <Card>
          <p className="px-5 py-8 text-sm text-foreground-muted text-center">
            Ingen kund-koppling hittades.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Behöver du hjälp?"
          subtitle="Kontakta din leverantör direkt — eller Saldos support"
        />
        <div className="px-5 py-5 text-sm space-y-3">
          <p>
            Vid frågor om beställningar, leveransstatus eller priser:
            kontakta {m?.tenant.name ?? "din leverantör"} via samma kanaler
            som vanligt.
          </p>
          <p className="text-foreground-muted">
            Saldos plattform-support:{" "}
            <a
              href="mailto:hej@saldo.se"
              className="text-foreground hover:underline underline-offset-4"
            >
              hej@saldo.se
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 px-5 py-3.5">
      <dt className="text-xs uppercase tracking-[0.15em] text-foreground-muted self-center">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
