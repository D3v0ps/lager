"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  approveApplication,
  listApplications,
  rejectApplication,
  type CustomerApplication,
  type CustomerApplicationStatus,
} from "@/lib/customer-applications";
import { formatDateOnly } from "@/lib/format";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  SkeletonRows,
  StatusPill,
  buttonClasses,
} from "@/app/_components/ui";

type FilterTab = CustomerApplicationStatus;

const TABS: { id: FilterTab; label: string }[] = [
  { id: "pending", label: "Inkomna" },
  { id: "approved", label: "Godkända" },
  { id: "rejected", label: "Avböjda" },
];

export default function ApplicationsTab() {
  const { tenant: slug } = useParams<{ tenant: string }>();

  const [applications, setApplications] = useState<
    CustomerApplication[] | null
  >(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const reload = useCallback(async () => {
    setError(null);
    try {
      const data = await listApplications();
      setApplications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const a of applications ?? []) c[a.status] += 1;
    return c;
  }, [applications]);

  const filtered = useMemo(
    () => (applications ?? []).filter((a) => a.status === filter),
    [applications, filter],
  );

  async function handleApprove(app: CustomerApplication) {
    setError(null);
    setInfo(null);
    setBusyId(app.id);
    try {
      await approveApplication(app.id, true);
      setInfo(
        `${app.company_name} godkänd. Inbjudan skickad till ${app.applicant_email}.`,
      );
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  function startReject(id: string) {
    setRejectingId(id);
    setRejectionReason("");
    setError(null);
    setInfo(null);
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectionReason("");
  }

  async function handleReject(app: CustomerApplication) {
    const reason = rejectionReason.trim();
    if (!reason) {
      setError("Ange en kort motivering så kunden förstår.");
      return;
    }
    setError(null);
    setInfo(null);
    setBusyId(app.id);
    try {
      await rejectApplication(app.id, reason);
      setInfo(`${app.company_name} avböjd.`);
      setRejectingId(null);
      setRejectionReason("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-background-elevated/40 p-1">
          {TABS.map((t) => {
            const active = t.id === filter;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`ml-1.5 tabular-nums text-[10px] ${
                    active ? "text-background/70" : "text-foreground-muted"
                  }`}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <ErrorBanner id="applications-error">{error}</ErrorBanner>}
      {info && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
        >
          {info}
        </div>
      )}

      {applications === null ? (
        <SkeletonRows rows={3} className="h-32" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            filter === "pending"
              ? "Inga väntande ansökningar"
              : filter === "approved"
                ? "Inga godkända ansökningar än"
                : "Inga avböjda ansökningar"
          }
          description={
            filter === "pending"
              ? "När någon ansöker via din publika länk dyker de upp här. Du kan godkänna eller avböja med ett klick."
              : filter === "approved"
                ? "Godkända ansökningar blir kunder och får en inloggningslänk per mejl."
                : "Avböjda ansökningar arkiveras här tillsammans med din motivering."
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              tenantSlug={slug}
              busy={busyId === app.id}
              rejecting={rejectingId === app.id}
              rejectionReason={rejectionReason}
              onChangeRejectionReason={setRejectionReason}
              onApprove={() => handleApprove(app)}
              onStartReject={() => startReject(app.id)}
              onCancelReject={cancelReject}
              onConfirmReject={() => handleReject(app)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  tenantSlug,
  busy,
  rejecting,
  rejectionReason,
  onChangeRejectionReason,
  onApprove,
  onStartReject,
  onCancelReject,
  onConfirmReject,
}: {
  app: CustomerApplication;
  tenantSlug: string;
  busy: boolean;
  rejecting: boolean;
  rejectionReason: string;
  onChangeRejectionReason: (value: string) => void;
  onApprove: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
}) {
  const categories = app.requested_categories ?? [];

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold tracking-tight">
              {app.company_name}
            </span>
            <StatusForStatus status={app.status} />
          </span>
        }
        subtitle={
          <span className="block">
            Inkommen {formatDateOnly(app.created_at)}
            {app.org_number ? (
              <>
                {" "}
                ·{" "}
                <span className="font-mono tabular-nums">{app.org_number}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          app.status === "pending" && !rejecting ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onStartReject}
                disabled={busy}
                className={buttonClasses("danger", "sm")}
              >
                Avböj
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={busy}
                className={buttonClasses("primary", "sm")}
              >
                {busy ? "Godkänner…" : "Godkänn"}
              </button>
            </div>
          ) : null
        }
      />

      <div className="px-5 sm:px-6 py-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="Kontaktperson" value={app.applicant_name || "—"} />
          <Field
            label="E-post"
            value={
              <a
                href={`mailto:${app.applicant_email}`}
                className="hover:text-foreground hover:underline underline-offset-2"
              >
                {app.applicant_email}
              </a>
            }
          />
          {app.applicant_phone ? (
            <Field
              label="Telefon"
              value={
                <a
                  href={`tel:${app.applicant_phone}`}
                  className="hover:text-foreground hover:underline underline-offset-2"
                >
                  {app.applicant_phone}
                </a>
              }
            />
          ) : null}
          {app.billing_address ? (
            <Field
              label="Faktureringsadress"
              value={
                <span className="whitespace-pre-line">
                  {app.billing_address}
                </span>
              }
            />
          ) : null}
          {app.shipping_address ? (
            <Field
              label="Leveransadress"
              value={
                <span className="whitespace-pre-line">
                  {app.shipping_address}
                </span>
              }
            />
          ) : null}
        </div>

        {categories.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-foreground-muted font-medium mb-2">
              Önskat sortiment
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c, i) => (
                <StatusPill key={`${c}-${i}`} tone="info" size="sm">
                  {c}
                </StatusPill>
              ))}
            </div>
          </div>
        )}

        {app.message ? (
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-foreground-muted font-medium mb-1.5">
              Meddelande
            </p>
            <p className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
              {app.message}
            </p>
          </div>
        ) : null}

        {app.status === "approved" && (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.06] p-3 text-sm text-emerald-200 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Godkänd{" "}
              {app.reviewed_at
                ? formatDateOnly(app.reviewed_at)
                : formatDateOnly(app.created_at)}
            </span>
            {app.customer_id ? (
              <Link
                href={`/${tenantSlug}/customers/${app.customer_id}/`}
                className="text-emerald-100 hover:text-white hover:underline underline-offset-2 font-medium"
              >
                Visa kunden →
              </Link>
            ) : null}
          </div>
        )}

        {app.status === "rejected" && (
          <div className="rounded-md border border-red-400/30 bg-red-500/[0.06] p-3 text-sm text-red-200 space-y-1">
            <p>
              Avböjd{" "}
              {app.reviewed_at
                ? formatDateOnly(app.reviewed_at)
                : formatDateOnly(app.created_at)}
            </p>
            {app.rejection_reason ? (
              <p className="text-red-200/80 italic">
                “{app.rejection_reason}”
              </p>
            ) : null}
          </div>
        )}

        {rejecting && (
          <div className="rounded-md border border-white/10 bg-background-elevated/60 p-4 space-y-3">
            <div>
              <label htmlFor={`reject-reason-${app.id}`} className={labelClass}>
                Motivering till avböjande
              </label>
              <textarea
                id={`reject-reason-${app.id}`}
                rows={3}
                value={rejectionReason}
                onChange={(e) => onChangeRejectionReason(e.target.value)}
                placeholder="T.ex. Vi kräver F-skattsedel — välkommen åter när det är på plats."
                className={inputClass}
                aria-describedby={`reject-hint-${app.id}`}
              />
              <p id={`reject-hint-${app.id}`} className={fieldHintClass}>
                Detta sparas på ansökan. Skicka gärna även ett vänligt mejl till
                kunden.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onConfirmReject}
                disabled={busy}
                className={buttonClasses("danger", "sm")}
              >
                {busy ? "Avböjer…" : "Bekräfta avböjande"}
              </button>
              <button
                type="button"
                onClick={onCancelReject}
                disabled={busy}
                className={buttonClasses("ghost", "sm")}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusForStatus({ status }: { status: CustomerApplicationStatus }) {
  if (status === "pending") {
    return (
      <StatusPill tone="warning" size="sm">
        Väntar
      </StatusPill>
    );
  }
  if (status === "approved") {
    return (
      <StatusPill tone="ok" size="sm">
        Godkänd
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="error" size="sm">
      Avböjd
    </StatusPill>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.15em] text-foreground-muted font-medium mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground/90">{value}</div>
    </div>
  );
}
