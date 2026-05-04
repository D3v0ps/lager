"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createInspectionTemplate,
  inspectionKindLabel,
  INSPECTION_KINDS,
  listInspectionTemplates,
  DEFAULT_KMA_ITEMS,
  DEFAULT_EGENKONTROLL_ITEMS,
  DEFAULT_SKYDDSROND_ITEMS,
  type InspectionKind,
  type InspectionTemplate,
} from "@/lib/inspections";
import { useTenantState } from "@/lib/tenant-context";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  PageHeader,
  SkeletonRows,
  StatusPill,
} from "@/app/_components/ui";

type FilterKind = InspectionKind | "all";

const FILTER_TABS: { id: FilterKind; label: string }[] = [
  { id: "all", label: "Alla" },
  { id: "kma", label: "KMA" },
  { id: "egenkontroll", label: "Egenkontroll" },
  { id: "skyddsrond", label: "Skyddsrond" },
];

// Visual ribbon — different brand-tinted gradient per inspection kind.
// Uses the global brand-gradient palette colours so it ties in with the
// Saldo identity but each kind gets a distinct hue mix.
export function kindRibbonStyle(kind: InspectionKind): string {
  switch (kind) {
    case "kma":
      // amber → rose
      return "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)";
    case "egenkontroll":
      // rose → violet
      return "linear-gradient(90deg, #ef4444 0%, #ec4899 50%, #8b5cf6 100%)";
    case "skyddsrond":
      // amber → violet (full brand)
      return "linear-gradient(90deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)";
    case "other":
      return "linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)";
  }
}

export default function InspectionsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;

  const [templates, setTemplates] = useState<InspectionTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [importing, setImporting] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const list = await listInspectionTemplates();
      setTemplates(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    if (!templates) return [];
    if (filter === "all") return templates;
    return templates.filter((t) => t.kind === filter);
  }, [templates, filter]);

  async function importDefaults() {
    if (!tenantData) return;
    setImporting(true);
    setError(null);
    try {
      await Promise.all([
        createInspectionTemplate({
          tenant_id: tenantData.id,
          kind: "kma",
          name: "KMA-kontroll (standard)",
          description:
            "Kvalitet, miljö och arbetsmiljö enligt branschpraxis.",
          items: DEFAULT_KMA_ITEMS,
        }),
        createInspectionTemplate({
          tenant_id: tenantData.id,
          kind: "egenkontroll",
          name: "Egenkontroll (standard)",
          description: "Kontroll per arbetsmoment.",
          items: DEFAULT_EGENKONTROLL_ITEMS,
        }),
        createInspectionTemplate({
          tenant_id: tenantData.id,
          kind: "skyddsrond",
          name: "Skyddsrond (standard)",
          description: "Veckovis säkerhetsrond på arbetsplatsen.",
          items: DEFAULT_SKYDDSROND_ITEMS,
        }),
      ]);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  const newLink = `/${tenant}/inspections/new/`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Kontrollmallar"
        subtitle="KMA, egenkontroll och skyddsrond — egna mallar."
        actions={
          <Link
            href={newLink}
            className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90"
          >
            + Ny mall
          </Link>
        }
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {templates === null ? (
        <SkeletonRows rows={4} className="h-16" />
      ) : templates.length === 0 ? (
        <EmptyState
          title="Inga mallar än"
          description="Skapa din första, eller använd våra standardmallar för KMA, egenkontroll och skyddsrond."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={newLink}
                className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
              >
                Skapa mall
              </Link>
              <button
                type="button"
                onClick={importDefaults}
                disabled={importing || !tenantData}
                className="rounded-md border border-white/15 bg-white/[0.02] px-4 py-2 text-sm font-medium hover:bg-white/[0.06] disabled:opacity-50"
              >
                {importing ? "Importerar…" : "Importera standardmallar"}
              </button>
            </div>
          }
        />
      ) : (
        <>
          <div className="border-b border-white/5">
            <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
              {FILTER_TABS.map((tab) => {
                const isActive = filter === tab.id;
                const count =
                  tab.id === "all"
                    ? templates.length
                    : templates.filter((t) => t.kind === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFilter(tab.id)}
                    className={`relative whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-[11px] tabular-nums text-foreground-muted">
                      {count}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-t-full"
                        style={{ background: "var(--brand-gradient)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {visible.length === 0 ? (
            <Card>
              <p className="px-5 py-12 text-sm text-foreground-muted text-center">
                Inga mallar i den här kategorin än.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((t) => (
                <Card key={t.id} className="group">
                  <div
                    aria-hidden="true"
                    className="h-1 w-full"
                    style={{ background: kindRibbonStyle(t.kind) }}
                  />
                  <CardHeader
                    title={t.name}
                    subtitle={
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="info" size="sm">
                          {inspectionKindLabel(t.kind)}
                        </StatusPill>
                        <span className="text-foreground-muted text-xs">
                          {t.items.length} punkter
                        </span>
                      </span>
                    }
                    divider={false}
                  />
                  {t.description && (
                    <p className="px-5 sm:px-6 pb-3 text-xs text-foreground-muted line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-white/5 px-5 sm:px-6 py-3">
                    <span className="text-[11px] text-foreground-muted">
                      Skapad {formatDate(t.created_at)}
                    </span>
                    <Link
                      href={`/${tenant}/inspections/new/?clone=${t.id}`}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Duplicera →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Show available kinds even when none match — helpful nudge */}
          <div className="text-[11px] text-foreground-muted">
            Aktiva typer:{" "}
            {INSPECTION_KINDS.map((k) => inspectionKindLabel(k)).join(" · ")}
          </div>
        </>
      )}
    </div>
  );
}
