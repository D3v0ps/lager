"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  getProject,
  getProjectSummary,
  listChangeOrders,
  listProjectDocuments,
  listProjectMaterials,
  listProjectPhotos,
  projectStatusLabel,
  projectStatusTone,
  PROJECT_STATUS_VALUES,
  updateProject,
  type ChangeOrder,
  type ProjectDocument,
  type ProjectListRow,
  type ProjectMaterial,
  type ProjectPhoto,
  type ProjectStatus,
  type ProjectSummary,
} from "@/lib/projects";
import {
  createChangeOrder,
  updateChangeOrderStatus,
} from "@/lib/projects";
import {
  listTimeEntries,
  formatMinutesAsHours,
  type TimeEntryWithRelations,
} from "@/lib/time-entries";
import { listQuotes, quoteStatusLabel, type QuoteListRow } from "@/lib/quotes";
import { formatCents } from "@/lib/rot-rut";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorBanner,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

import { Tabs, useHashTab } from "../_components/Tabs";

const TAB_IDS = [
  "oversikt",
  "tid",
  "anbud",
  "ata",
  "material",
  "foton",
  "dokument",
] as const;
type TabId = (typeof TAB_IDS)[number];

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows rows={4} className="h-12" />}>
      <ProjectDetail />
    </Suspense>
  );
}

function ProjectDetail() {
  const { tenant } = useParams<{ tenant: string }>();
  const params = useSearchParams();
  const id = params.get("id");
  const [project, setProject] = useState<ProjectListRow | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useHashTab<TabId>(TAB_IDS, "oversikt");

  const reload = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [p, s] = await Promise.all([
        getProject(id),
        getProjectSummary(id),
      ]);
      setProject(p);
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!id) {
    return (
      <ErrorPage title="Inget projekt-ID" message="Hittade inte projektet." />
    );
  }
  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta projekt"
        message={error}
        retry={reload}
      />
    );
  }
  if (!project) return <SkeletonRows rows={6} className="h-12" />;

  return (
    <div className="space-y-6">
      <Link
        href={`/${tenant}/projects/`}
        className="text-sm text-foreground-muted hover:text-foreground"
      >
        ← Alla projekt
      </Link>
      <PageHeader
        eyebrow={project.reference ?? "Projekt"}
        title={project.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill tone={projectStatusTone(project.status)} size="sm">
              {projectStatusLabel(project.status)}
            </StatusPill>
            {project.customers && (
              <span className="text-foreground-muted">
                · Kund: {project.customers.name}
              </span>
            )}
            {project.address && (
              <span className="text-foreground-muted">
                · {project.address}
              </span>
            )}
          </span>
        }
        actions={
          <Link
            href={`/${tenant}/quotes/new/?project=${project.id}`}
            className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90"
          >
            + Nytt anbud
          </Link>
        }
      />

      <Tabs<TabId>
        tabs={[
          { id: "oversikt", label: "Översikt" },
          { id: "tid", label: "Tid", count: summary?.time_entry_count },
          { id: "anbud", label: "Anbud" },
          { id: "ata", label: "ÄTA" },
          { id: "material", label: "Material" },
          { id: "foton", label: "Foton", count: summary?.photo_count },
          { id: "dokument", label: "Dokument", count: summary?.doc_count },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "oversikt" && (
        <OverviewTab project={project} summary={summary} onReload={reload} />
      )}
      {activeTab === "tid" && <TimeTab projectId={project.id} />}
      {activeTab === "anbud" && (
        <QuotesTab tenantSlug={tenant} projectId={project.id} />
      )}
      {activeTab === "ata" && (
        <ChangeOrdersTab projectId={project.id} onChanged={reload} />
      )}
      {activeTab === "material" && <MaterialsTab projectId={project.id} />}
      {activeTab === "foton" && <PhotosTab projectId={project.id} />}
      {activeTab === "dokument" && <DocumentsTab projectId={project.id} />}
    </div>
  );
}

function StatField({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="text-[11px] text-foreground-muted mt-0.5">{hint}</p>
      ) : null}
    </div>
  );
}

function OverviewTab({
  project,
  summary,
  onReload,
}: {
  project: ProjectListRow;
  summary: ProjectSummary | null;
  onReload: () => void;
}) {
  const [savingStatus, setSavingStatus] = useState(false);
  const totalHours = summary
    ? formatMinutesAsHours(summary.total_minutes)
    : "—";
  const materialTotal = summary
    ? formatCents(summary.material_total_cents)
    : "—";
  const changeTotal = summary
    ? formatCents(summary.change_total_cents)
    : "—";
  const budget =
    project.budget_cents != null ? formatCents(project.budget_cents) : "—";

  async function handleStatus(next: ProjectStatus) {
    setSavingStatus(true);
    try {
      await updateProject(project.id, { status: next });
      await onReload();
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
          <div className="px-5 py-5">
            <StatField label="Tid" value={totalHours} />
          </div>
          <div className="px-5 py-5">
            <StatField label="Material" value={materialTotal} />
          </div>
          <div className="px-5 py-5">
            <StatField label="ÄTA godkända" value={changeTotal} />
          </div>
          <div className="px-5 py-5">
            <StatField label="Budget" value={budget} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Detaljer" />
          <dl className="divide-y divide-white/5">
            <Row label="Status">
              <select
                value={project.status}
                disabled={savingStatus}
                onChange={(e) => handleStatus(e.target.value as ProjectStatus)}
                className="rounded-md border border-white/15 bg-background-elevated/60 px-2.5 py-1 text-sm"
              >
                {PROJECT_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {projectStatusLabel(s)}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Referens">
              <code className="font-mono text-sm">
                {project.reference ?? "—"}
              </code>
            </Row>
            <Row label="Kund">{project.customers?.name ?? "—"}</Row>
            <Row label="Adress">{project.address ?? "—"}</Row>
            <Row label="Period">
              <span className="tabular-nums">
                {project.start_date ?? "—"} → {project.end_date ?? "—"}
              </span>
            </Row>
            <Row label="ROT/RUT">
              {project.deduction_type
                ? project.deduction_type.toUpperCase()
                : "Inget"}
            </Row>
          </dl>
        </Card>
        <Card>
          <CardHeader title="Anteckningar" />
          <p className="px-5 py-4 text-sm whitespace-pre-wrap text-foreground/85 min-h-[6rem]">
            {project.notes || (
              <span className="text-foreground-muted">
                Inga anteckningar än.
              </span>
            )}
          </p>
        </Card>
      </div>

      {project.description && (
        <Card>
          <CardHeader title="Beskrivning" />
          <p className="px-5 py-4 text-sm whitespace-pre-wrap leading-relaxed text-foreground/85">
            {project.description}
          </p>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 px-5 py-3.5">
      <dt className="text-xs uppercase tracking-[0.15em] text-foreground-muted self-center">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time tab
// ---------------------------------------------------------------------------

function TimeTab({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<TimeEntryWithRelations[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTimeEntries({ projectId })
      .then(setEntries)
      .catch((e: Error) => setError(e.message));
  }, [projectId]);

  if (error) return <ErrorPage title="Kunde inte hämta tid" message={error} />;
  if (!entries) return <SkeletonRows rows={4} className="h-12" />;
  if (entries.length === 0) {
    return (
      <Card>
        <p className="px-5 py-12 text-sm text-foreground-muted text-center">
          Inga tidrapporter på det här projektet än. Anställda kan klocka in
          via{" "}
          <Link
            href="../time/"
            className="text-amber-400 hover:underline"
          >
            Tid-modulen
          </Link>
          .
        </p>
      </Card>
    );
  }

  const totalMinutes = entries.reduce(
    (acc, e) => acc + (e.duration_minutes ?? 0),
    0,
  );

  return (
    <Card>
      <CardHeader
        title="Tidrapporter"
        subtitle={`Totalt ${formatMinutesAsHours(totalMinutes)} på ${entries.length} rader`}
      />
      <DataTable>
        <TableHead>
          <Th>Datum</Th>
          <Th>Anställd</Th>
          <Th>Kategori</Th>
          <Th align="right">Tid</Th>
          <Th>Anteckning</Th>
          <Th>Godkänd</Th>
        </TableHead>
        <TBody>
          {entries.map((e) => (
            <Tr key={e.id}>
              <Td>
                <span className="font-mono text-xs">{e.entry_date}</span>
              </Td>
              <Td>{e.employees?.full_name ?? "—"}</Td>
              <Td>
                <span className="text-foreground-muted text-xs uppercase tracking-wider">
                  {e.category}
                </span>
              </Td>
              <Td align="right">
                <span className="tabular-nums font-medium">
                  {e.duration_minutes
                    ? formatMinutesAsHours(e.duration_minutes)
                    : "—"}
                </span>
              </Td>
              <Td>
                <span className="text-foreground-muted text-xs">
                  {e.note ?? ""}
                </span>
              </Td>
              <Td>
                <StatusPill tone={e.approved ? "ok" : "muted"} size="sm">
                  {e.approved ? "Godkänd" : "Väntar"}
                </StatusPill>
              </Td>
            </Tr>
          ))}
        </TBody>
      </DataTable>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quotes tab
// ---------------------------------------------------------------------------

function QuotesTab({
  tenantSlug,
  projectId,
}: {
  tenantSlug: string;
  projectId: string;
}) {
  const [quotes, setQuotes] = useState<QuoteListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listQuotes()
      .then((all) => setQuotes(all.filter((q) => q.project_id === projectId)))
      .catch((e: Error) => setError(e.message));
  }, [projectId]);

  if (error) return <ErrorPage title="Kunde inte hämta anbud" message={error} />;
  if (!quotes) return <SkeletonRows rows={3} className="h-12" />;
  if (quotes.length === 0) {
    return (
      <Card>
        <div className="px-5 py-12 text-center space-y-3">
          <p className="text-foreground-muted text-sm">
            Inga anbud på det här projektet än.
          </p>
          <Link
            href={`/${tenantSlug}/quotes/new/?project=${projectId}`}
            className="inline-flex rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90"
          >
            + Skapa anbud
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={`${quotes.length} anbud`} />
      <DataTable>
        <TableHead>
          <Th>Ref</Th>
          <Th>Titel</Th>
          <Th>Status</Th>
          <Th align="right">Total</Th>
          <Th>Skickat</Th>
        </TableHead>
        <TBody>
          {quotes.map((q) => (
            <Tr key={q.id}>
              <Td>
                <code className="font-mono text-xs">
                  {q.reference ?? q.id.slice(0, 8)}
                </code>
              </Td>
              <Td>
                <Link
                  href={`/${tenantSlug}/quotes/quote/?id=${q.id}`}
                  className="hover:text-amber-400"
                >
                  {q.title}
                </Link>
              </Td>
              <Td>
                <StatusPill
                  tone={q.status === "accepted" ? "ok" : "info"}
                  size="sm"
                >
                  {quoteStatusLabel(q.status)}
                </StatusPill>
              </Td>
              <Td align="right">
                <span className="tabular-nums">
                  {formatCents(q.total_cents)}
                </span>
              </Td>
              <Td>
                <span className="text-foreground-muted text-xs">
                  {q.sent_at ? formatDate(q.sent_at) : "—"}
                </span>
              </Td>
            </Tr>
          ))}
        </TBody>
      </DataTable>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Change orders (ÄTA) tab — with inline create form
// ---------------------------------------------------------------------------

function ChangeOrdersTab({
  projectId,
  onChanged,
}: {
  projectId: string;
  onChanged: () => void;
}) {
  const [orders, setOrders] = useState<ChangeOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Inline form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [rateSek, setRateSek] = useState("750");
  const [materialSek, setMaterialSek] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const list = await listChangeOrders(projectId);
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await createChangeOrder(projectId, {
        title: title.trim(),
        description: description.trim() || null,
        hours_estimated: hours ? Number(hours) : null,
        material_cents: materialSek ? Math.round(Number(materialSek) * 100) : 0,
        hourly_rate_cents: Math.round(Number(rateSek) * 100),
      });
      setTitle("");
      setDescription("");
      setHours("");
      setMaterialSek("");
      setShowForm(false);
      await reload();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(
    id: string,
    next: ChangeOrder["status"],
  ): Promise<void> {
    try {
      await updateChangeOrderStatus(id, next);
      await reload();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (error) return <ErrorBanner>{error}</ErrorBanner>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90"
        >
          {showForm ? "Stäng" : "+ Ny ÄTA"}
        </button>
      </div>

      {showForm && (
        <Card variant="elevated">
          <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
            <h3 className="text-sm font-semibold">Ny ÄTA</h3>
            <div>
              <label htmlFor="ata-title" className={labelClass}>
                Titel
              </label>
              <input
                id="ata-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Extra arbete på badrumsgolv"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ata-desc" className={labelClass}>
                Beskrivning
              </label>
              <textarea
                id="ata-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ata-hours" className={labelClass}>
                  Tim
                </label>
                <input
                  id="ata-hours"
                  type="number"
                  step="0.25"
                  min={0}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="ata-rate" className={labelClass}>
                  Timpris (kr)
                </label>
                <input
                  id="ata-rate"
                  type="number"
                  min={0}
                  value={rateSek}
                  onChange={(e) => setRateSek(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="ata-material" className={labelClass}>
                  Material (kr)
                </label>
                <input
                  id="ata-material"
                  type="number"
                  min={0}
                  value={materialSek}
                  onChange={(e) => setMaterialSek(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
              </div>
            </div>
            <p className={fieldHintClass}>
              Beräknas automatiskt: tim × timpris + material.
            </p>
            <div>
              <button
                type="submit"
                disabled={busy || !title.trim()}
                className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Skapar…" : "Skapa ÄTA"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {orders === null ? (
        <SkeletonRows rows={3} className="h-12" />
      ) : orders.length === 0 ? (
        <Card>
          <p className="px-5 py-12 text-sm text-foreground-muted text-center">
            Inga ÄTA ännu. Lägg till när det dyker upp ändrings- eller
            tilläggsarbeten — kunden ser dem på anbudssidan.
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader title={`${orders.length} ÄTA`} />
          <DataTable>
            <TableHead>
              <Th>Ref</Th>
              <Th>Titel</Th>
              <Th align="right">Tim</Th>
              <Th align="right">Total</Th>
              <Th>Status</Th>
              <Th />
            </TableHead>
            <TBody>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <code className="font-mono text-xs">
                      {o.reference ?? o.id.slice(0, 8)}
                    </code>
                  </Td>
                  <Td>{o.title}</Td>
                  <Td align="right">
                    <span className="tabular-nums">
                      {o.hours_estimated ?? "—"}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums">
                      {formatCents(o.total_cents)}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill
                      tone={
                        o.status === "approved"
                          ? "ok"
                          : o.status === "rejected"
                            ? "error"
                            : o.status === "invoiced"
                              ? "info"
                              : "muted"
                      }
                      size="sm"
                    >
                      {o.status === "pending"
                        ? "Väntar"
                        : o.status === "approved"
                          ? "Godkänd"
                          : o.status === "rejected"
                            ? "Avböjd"
                            : "Fakturerad"}
                    </StatusPill>
                  </Td>
                  <Td align="right">
                    {o.status === "pending" && (
                      <span className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setStatus(o.id, "approved")}
                          className="text-emerald-400 hover:underline text-xs"
                        >
                          Godkänn
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(o.id, "rejected")}
                          className="text-rose-400 hover:underline text-xs"
                        >
                          Avböj
                        </button>
                      </span>
                    )}
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

// ---------------------------------------------------------------------------
// Materials tab
// ---------------------------------------------------------------------------

function MaterialsTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ProjectMaterial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjectMaterials(projectId)
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, [projectId]);

  if (error) return <ErrorPage title="Kunde inte hämta material" message={error} />;
  if (!items) return <SkeletonRows rows={3} className="h-12" />;
  if (items.length === 0) {
    return (
      <Card>
        <p className="px-5 py-12 text-sm text-foreground-muted text-center">
          Inget material kopplat till projektet än. Material kan lyftas in
          från lagermodulen — då uppdateras saldo automatiskt när du registrerar
          användning.
        </p>
      </Card>
    );
  }

  const total = items.reduce(
    (acc, m) => acc + Number(m.quantity) * m.unit_price_cents,
    0,
  );

  return (
    <Card>
      <CardHeader
        title={`${items.length} material-rader`}
        subtitle={`Totalt ${formatCents(total)}`}
      />
      <DataTable>
        <TableHead>
          <Th>Artikel</Th>
          <Th align="right">Antal</Th>
          <Th align="right">À-pris</Th>
          <Th align="right">Total</Th>
          <Th>Använt</Th>
        </TableHead>
        <TBody>
          {items.map((m) => (
            <Tr key={m.id}>
              <Td>
                {m.products ? (
                  <>
                    <p className="font-mono text-[11px] text-foreground-muted">
                      {m.products.sku}
                    </p>
                    <p className="text-sm">{m.products.name}</p>
                  </>
                ) : (
                  <p className="text-sm">{m.custom_name ?? "—"}</p>
                )}
              </Td>
              <Td align="right">
                <span className="tabular-nums">
                  {Number(m.quantity)} {m.unit ?? ""}
                </span>
              </Td>
              <Td align="right">
                <span className="tabular-nums">
                  {formatCents(m.unit_price_cents)}
                </span>
              </Td>
              <Td align="right">
                <span className="tabular-nums font-medium">
                  {formatCents(Number(m.quantity) * m.unit_price_cents)}
                </span>
              </Td>
              <Td>
                <span className="text-xs text-foreground-muted">
                  {m.used_at ? formatDate(m.used_at) : "—"}
                </span>
              </Td>
            </Tr>
          ))}
        </TBody>
      </DataTable>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Photos tab — gallery
// ---------------------------------------------------------------------------

function PhotosTab({ projectId }: { projectId: string }) {
  const [photos, setPhotos] = useState<ProjectPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjectPhotos(projectId)
      .then(setPhotos)
      .catch((e: Error) => setError(e.message));
  }, [projectId]);

  if (error) return <ErrorPage title="Kunde inte hämta foton" message={error} />;
  if (!photos) return <SkeletonRows rows={2} className="h-32" />;
  if (photos.length === 0) {
    return (
      <Card>
        <div className="px-5 py-12 text-center space-y-3">
          <p className="text-sm text-foreground-muted">
            Inga foton uppladdade än. På telefonen: använd kameran direkt
            från denna sida (kommer i nästa release).
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((p) => (
        <div
          key={p.id}
          className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-background-elevated/40"
        >
          {/* In production we'd resolve storage_key via Supabase Storage signed URL */}
          <div className="h-full w-full flex items-center justify-center text-foreground-muted text-xs">
            {p.caption ?? p.storage_key.split("/").pop()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents tab
// ---------------------------------------------------------------------------

function DocumentsTab({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<ProjectDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjectDocuments(projectId)
      .then(setDocs)
      .catch((e: Error) => setError(e.message));
  }, [projectId]);

  if (error) return <ErrorPage title="Kunde inte hämta dokument" message={error} />;
  if (!docs) return <SkeletonRows rows={3} className="h-12" />;
  if (docs.length === 0) {
    return (
      <Card>
        <p className="px-5 py-12 text-sm text-foreground-muted text-center">
          Inga dokument uppladdade än. PDF, Word, Excel och bilder stöds
          som native bilagor.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={`${docs.length} dokument`} />
      <ul className="divide-y divide-white/5">
        {docs.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02]"
          >
            <div className="h-9 w-9 rounded-md bg-white/[0.04] flex items-center justify-center text-foreground-muted text-[10px] uppercase">
              {(d.mime_type ?? "?").split("/")[1]?.slice(0, 4) ?? "fil"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{d.filename}</p>
              <p className="text-[11px] text-foreground-muted">
                {d.category ?? "—"} ·{" "}
                {d.size_bytes
                  ? `${Math.round(d.size_bytes / 1024)} KB`
                  : "—"}
              </p>
            </div>
            <span className="text-[11px] text-foreground-muted">
              {formatDate(d.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
