"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listSubcontractors,
  type Subcontractor,
} from "@/lib/subcontractors";
import { formatDateOnly } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorBanner,
  ErrorPage,
  PageHeader,
  SkeletonTable,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
  buttonClasses,
} from "@/app/_components/ui";

type Filter = "active" | "all";

function insuranceTone(
  validUntil: string | null,
): "ok" | "warning" | "error" | "muted" {
  if (!validUntil) return "muted";
  const now = new Date();
  const exp = new Date(validUntil);
  const diffDays = Math.floor(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "error";
  if (diffDays < 30) return "warning";
  return "ok";
}

function insuranceLabel(validUntil: string | null): string {
  if (!validUntil) return "Saknas";
  const tone = insuranceTone(validUntil);
  if (tone === "error") return "Utgången";
  if (tone === "warning") return "Snart utgången";
  return "Giltig";
}

export default function SubcontractorsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [items, setItems] = useState<Subcontractor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");

  const reload = useCallback(async () => {
    setError(null);
    try {
      setItems(await listSubcontractors());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    if (!items) return [];
    if (filter === "all") return items;
    return items.filter((s) => s.active);
  }, [items, filter]);

  const newLink = `/${tenant}/subcontractors/new`;

  if (error && items === null) {
    return (
      <ErrorPage
        title="Kunde inte hämta underentreprenörer"
        message={error}
        retry={() => void reload()}
      />
    );
  }

  if (items === null) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Saldo Bygg"
          title="Underentreprenörer (UE)"
        />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Underentreprenörer (UE)"
        subtitle="Register över UE-företag — F-skatt, försäkring och kontaktinfo per partner."
        actions={
          <Link href={newLink} className={buttonClasses("primary", "md")}>
            + Ny UE
          </Link>
        }
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {items.length === 0 ? (
        <EmptyState
          title="Inga underentreprenörer än"
          description="Lägg upp era UE-partners så kan du koppla dem till projekt och hålla koll på F-skatt och försäkring."
          action={
            <Link href={newLink} className={buttonClasses("primary", "md")}>
              + Ny UE
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title={`${visible.length} UE${
              filter === "active" ? " (aktiva)" : ""
            }`}
            actions={
              <div
                role="tablist"
                aria-label="Filter"
                className="inline-flex rounded-md border border-white/10 bg-background-elevated/40 p-0.5 text-xs"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "active"}
                  onClick={() => setFilter("active")}
                  className={`px-3 py-1 rounded ${
                    filter === "active"
                      ? "bg-white/[0.08] text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Aktiva
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 rounded ${
                    filter === "all"
                      ? "bg-white/[0.08] text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Alla
                </button>
              </div>
            }
          />
          {visible.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-foreground-muted">
              Inga UE matchar filtret.
            </div>
          ) : (
            <DataTable>
              <TableHead>
                <Th>Företag</Th>
                <Th>Org-nr</Th>
                <Th>Kontakt</Th>
                <Th>F-skatt</Th>
                <Th>Försäkring giltig till</Th>
                <Th>Status</Th>
              </TableHead>
              <TBody>
                {visible.map((s) => {
                  const insTone = insuranceTone(s.insurance_valid_until);
                  return (
                    <Tr key={s.id}>
                      <Td>
                        <span className="font-medium">{s.company_name}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-foreground-muted">
                          {s.org_number ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-col">
                          <span>{s.contact_name ?? "—"}</span>
                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              className="text-xs text-amber-400 hover:underline"
                            >
                              {s.email}
                            </a>
                          ) : null}
                          {s.phone ? (
                            <a
                              href={`tel:${s.phone}`}
                              className="text-xs text-foreground-muted hover:text-foreground"
                            >
                              {s.phone}
                            </a>
                          ) : null}
                        </div>
                      </Td>
                      <Td>
                        <StatusPill
                          tone={s.has_fskatt ? "ok" : "error"}
                          size="sm"
                        >
                          {s.has_fskatt ? "F-skatt" : "Saknas"}
                        </StatusPill>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <StatusPill tone={insTone} size="sm">
                            {insuranceLabel(s.insurance_valid_until)}
                          </StatusPill>
                          <span className="tabular-nums text-xs text-foreground-muted">
                            {formatDateOnly(s.insurance_valid_until)}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <StatusPill
                          tone={s.active ? "ok" : "muted"}
                          size="sm"
                        >
                          {s.active ? "Aktiv" : "Inaktiv"}
                        </StatusPill>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </DataTable>
          )}
        </Card>
      )}
    </div>
  );
}
