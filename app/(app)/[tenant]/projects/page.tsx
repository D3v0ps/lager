"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listProjects,
  PROJECT_STATUS_VALUES,
  projectStatusLabel,
  projectStatusTone,
  type ProjectListRow,
  type ProjectStatus,
} from "@/lib/projects";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorPage,
  PageHeader,
  SkeletonTable,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";
import { inputClass } from "@/lib/form-classes";

export default function ProjectsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [projects, setProjects] = useState<ProjectListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );

  function reload() {
    listProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  const visible = useMemo(() => {
    if (!projects) return [] as ProjectListRow[];
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q) {
        const inName = p.name.toLowerCase().includes(q);
        const inRef = (p.reference ?? "").toLowerCase().includes(q);
        const inAddress = (p.address ?? "").toLowerCase().includes(q);
        const inCustomer = (p.customers?.name ?? "").toLowerCase().includes(q);
        if (!inName && !inRef && !inAddress && !inCustomer) return false;
      }
      return true;
    });
  }, [projects, statusFilter, search]);

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta projekt"
        message={error}
        retry={() => {
          setError(null);
          reload();
        }}
      />
    );
  }
  if (projects === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projekt" />
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Saldo Bygg"
          title="Projekt"
          subtitle="Hantera bygg- och installationsprojekt — tid, anbud, ÄTA, foton, material."
        />
        <EmptyState
          title="Inga projekt än"
          description="Lägg upp ditt första projekt för att komma igång med tidrapportering, anbud och ÄTA."
          action={
            <Link
              href={`/${tenant}/projects/new/`}
              className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
            >
              + Nytt projekt
            </Link>
          }
        />
      </div>
    );
  }

  const filtered = statusFilter !== "all" || search.trim() !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Projekt"
        subtitle={`${projects.length} projekt totalt`}
        actions={
          <Link
            href={`/${tenant}/projects/new/`}
            className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
          >
            + Nytt projekt
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök ref, namn, kund eller adress"
          aria-label="Sök projekt"
          className={`${inputClass} sm:flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProjectStatus | "all")
          }
          aria-label="Filtrera på status"
          className={inputClass}
        >
          <option value="all">Alla statusar</option>
          {PROJECT_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {projectStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <Card>
          <div className="px-5 py-12 text-center space-y-3">
            <p className="text-foreground-muted">Inga projekt matchar.</p>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-amber-400 text-sm hover:underline"
              >
                Rensa filter
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title={`${visible.length} av ${projects.length}`} />
          <DataTable>
            <TableHead>
              <Th>Ref</Th>
              <Th>Projekt</Th>
              <Th>Kund</Th>
              <Th>Status</Th>
              <Th>Slutdatum</Th>
            </TableHead>
            <TBody>
              {visible.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <code className="text-[11px] font-mono text-foreground-muted">
                      {p.reference ?? p.id.slice(0, 8)}
                    </code>
                  </Td>
                  <Td>
                    <Link
                      href={`/${tenant}/projects/project/?id=${p.id}`}
                      className="text-sm hover:text-amber-400 transition-colors"
                    >
                      {p.name}
                    </Link>
                    {p.address && (
                      <p className="text-[11px] text-foreground-muted truncate">
                        {p.address}
                      </p>
                    )}
                  </Td>
                  <Td>
                    {p.customers?.name ?? (
                      <span className="text-foreground-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusPill tone={projectStatusTone(p.status)} size="sm">
                      {projectStatusLabel(p.status)}
                    </StatusPill>
                  </Td>
                  <Td>
                    <span className="text-foreground-muted text-sm tabular-nums">
                      {p.end_date ?? "—"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        </Card>
      )}
    </div>
  );
}
