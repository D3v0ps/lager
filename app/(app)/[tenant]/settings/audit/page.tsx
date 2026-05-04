"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listAuditLog, eventTypeLabel, type AuditEvent } from "@/lib/audit-log";
import { formatDate } from "@/lib/format";
import { useTenantState } from "@/lib/tenant-context";
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
  buttonClasses,
} from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

type DateRange = "7d" | "30d" | "all";

const PAGE_SIZE = 200;

function withinRange(createdAt: string, range: DateRange): boolean {
  if (range === "all") return true;
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() >= cutoff;
}

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.slice(0, 8);
}

export default function AuditLogPage() {
  const tenantState = useTenantState();
  const tenant = tenantState.tenant;

  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [actorSearch, setActorSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const reload = useCallback(
    async (newLimit: number) => {
      if (!tenant) return;
      setError(null);
      try {
        const list = await listAuditLog({
          tenantId: tenant.id,
          limit: newLimit,
        });
        setEvents(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [tenant],
  );

  useEffect(() => {
    void reload(limit);
  }, [reload, limit]);

  const uniqueEventTypes = useMemo(() => {
    if (!events) return [];
    return Array.from(new Set(events.map((e) => e.event_type))).sort();
  }, [events]);

  const visible = useMemo(() => {
    if (!events) return [] as AuditEvent[];
    const q = actorSearch.trim().toLowerCase();
    return events.filter((e) => {
      if (eventTypeFilter !== "all" && e.event_type !== eventTypeFilter) {
        return false;
      }
      if (!withinRange(e.created_at, dateRange)) return false;
      if (q) {
        const actor = (e.actor_user_id ?? "").toLowerCase();
        if (!actor.includes(q)) return false;
      }
      return true;
    });
  }, [events, eventTypeFilter, dateRange, actorSearch]);

  if (tenantState.status === "loading" || (!events && !error)) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Säkerhet"
          title="Händelselogg"
          subtitle="Alla viktiga händelser i din portal — vem, när, vad."
        />
        <SkeletonTable rows={8} />
      </div>
    );
  }

  if (tenantState.status !== "ready" || !tenant) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Säkerhet"
          title="Händelselogg"
          subtitle="Alla viktiga händelser i din portal — vem, när, vad."
        />
        <ErrorPage
          title="Ingen tenant"
          message="Hittar inte din portal. Kontrollera att du loggat in på rätt portal eller be en admin lägga till dig."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Säkerhet"
          title="Händelselogg"
          subtitle="Alla viktiga händelser i din portal — vem, när, vad."
        />
        <ErrorPage
          title="Kunde inte ladda händelseloggen"
          message={error}
          retry={() => void reload(limit)}
        />
      </div>
    );
  }

  async function loadMore() {
    setLoadingMore(true);
    setLimit((cur) => cur + PAGE_SIZE);
    setLoadingMore(false);
  }

  const reachedAll = events !== null && events.length < limit;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Säkerhet"
        title="Händelselogg"
        subtitle="Alla viktiga händelser i din portal — vem, när, vad."
      />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 sm:px-6 py-4">
          <div>
            <label htmlFor="audit-event-type" className={labelClass}>
              Händelse
            </label>
            <select
              id="audit-event-type"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">Alla händelser</option>
              {uniqueEventTypes.map((t) => (
                <option key={t} value={t}>
                  {eventTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="audit-range" className={labelClass}>
              Datumintervall
            </label>
            <select
              id="audit-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className={inputClass}
            >
              <option value="7d">Senaste 7 dagar</option>
              <option value="30d">Senaste 30 dagar</option>
              <option value="all">Alla</option>
            </select>
          </div>
          <div>
            <label htmlFor="audit-actor" className={labelClass}>
              Aktör (user-id)
            </label>
            <input
              id="audit-actor"
              type="search"
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="Sök på user-id"
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          title="Inga händelser loggade än"
          description="När du eller ditt team utför viktiga åtgärder dyker de upp här."
        />
      ) : (
        <Card>
          <CardHeader
            title={`${visible.length.toLocaleString("sv-SE")} händelse${
              visible.length === 1 ? "" : "r"
            }`}
            subtitle={
              eventTypeFilter !== "all" || dateRange !== "30d" || actorSearch
                ? "Filtrerat urval"
                : "Senaste händelser först"
            }
          />
          <DataTable>
            <TableHead>
              <Th>Tid</Th>
              <Th>Händelse</Th>
              <Th className="hidden md:table-cell">Aktör</Th>
              <Th>Detaljer</Th>
            </TableHead>
            <TBody>
              {visible.map((e) => {
                const isExpanded = expanded === e.id;
                const payloadJson = JSON.stringify(e.payload ?? {});
                const oneLine =
                  payloadJson === "{}"
                    ? "—"
                    : payloadJson.length > 80
                      ? payloadJson.slice(0, 80) + "…"
                      : payloadJson;
                return (
                  <Tr
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : e.id)}
                  >
                    <Td className="whitespace-nowrap text-foreground-muted tabular-nums">
                      {formatDate(e.created_at)}
                    </Td>
                    <Td>
                      <div className="font-medium">
                        {eventTypeLabel(e.event_type)}
                      </div>
                      <div className="text-[11px] text-foreground-muted font-mono">
                        {e.event_type}
                      </div>
                    </Td>
                    <Td className="hidden md:table-cell font-mono text-xs text-foreground-muted">
                      {shortId(e.actor_user_id)}
                    </Td>
                    <Td>
                      {payloadJson === "{}" ? (
                        <span className="text-foreground-muted">—</span>
                      ) : isExpanded ? (
                        <pre className="font-mono text-[11px] whitespace-pre-wrap break-all bg-white/[0.03] border border-white/10 rounded-md p-2 max-w-xl">
                          {JSON.stringify(e.payload, null, 2)}
                        </pre>
                      ) : (
                        <code className="font-mono text-[11px] text-foreground-muted truncate inline-block max-w-[24rem] align-middle">
                          {oneLine}
                        </code>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </DataTable>
          {!reachedAll ? (
            <div className="border-t border-white/5 px-5 py-3 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className={buttonClasses("secondary", "sm")}
              >
                {loadingMore ? "Laddar…" : "Visa fler"}
              </button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
