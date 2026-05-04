"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listProjects,
  projectStatusLabel,
  projectStatusTone,
  type ProjectListRow,
} from "@/lib/projects";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
} from "@/app/_components/ui";

// ---------------------------------------------------------------------------
// Date helpers — Stockholm-locked, but the gantt is laid out in plain UTC days
// since we only care about day granularity, never sub-day.
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function diffDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return startOfDay(d);
}

function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Stockholm",
  }).format(d);
}

function formatWeek(d: Date): string {
  // ISO 8601 week number — Monday-start.
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `v.${weekNo}`;
}

// ---------------------------------------------------------------------------
// Status → bar color (using brand status palette)
// ---------------------------------------------------------------------------

function barClassesForTone(
  tone: "ok" | "info" | "warning" | "muted" | "error",
): { fill: string; border: string } {
  switch (tone) {
    case "ok":
      return {
        fill: "bg-emerald-500/30 hover:bg-emerald-500/45",
        border: "border-emerald-400/40",
      };
    case "info":
      return {
        fill: "bg-violet-500/30 hover:bg-violet-500/45",
        border: "border-violet-400/40",
      };
    case "warning":
      return {
        fill: "bg-amber-500/30 hover:bg-amber-500/45",
        border: "border-amber-400/40",
      };
    case "error":
      return {
        fill: "bg-rose-500/30 hover:bg-rose-500/45",
        border: "border-rose-400/40",
      };
    case "muted":
    default:
      return {
        fill: "bg-white/10 hover:bg-white/15",
        border: "border-white/15",
      };
  }
}

type WeekWindow = 4 | 8 | 12 | 16;

export default function SchedulePage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [projects, setProjects] = useState<ProjectListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<WeekWindow>(8);

  function reload() {
    setError(null);
    listProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  const today = useMemo(() => startOfDay(new Date()), []);
  const totalDays = weeks * 7;
  const viewStart = today;
  const viewEnd = addDays(viewStart, totalDays);

  // Each day takes 100 / totalDays % of the timeline. We also expose a
  // pixel-min-width per day for horizontal scroll on mobile.
  const minDayPx = 22;

  const { scheduled, unscheduled } = useMemo(() => {
    const scheduled: ProjectListRow[] = [];
    const unscheduled: ProjectListRow[] = [];
    if (!projects) return { scheduled, unscheduled };
    for (const p of projects) {
      if (p.start_date && p.end_date) {
        scheduled.push(p);
      } else {
        unscheduled.push(p);
      }
    }
    // Earliest start first
    scheduled.sort((a, b) => {
      const sa = a.start_date ?? "";
      const sb = b.start_date ?? "";
      return sa.localeCompare(sb);
    });
    return { scheduled, unscheduled };
  }, [projects]);

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta schema"
        message={error}
        retry={reload}
      />
    );
  }

  if (projects === null) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Saldo Bygg"
          title="Schema"
          subtitle="Översikt av projekt och faser över tid."
        />
        <SkeletonRows rows={6} className="h-12" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Saldo Bygg"
          title="Schema"
          subtitle="Översikt av projekt och faser över tid."
        />
        <EmptyState
          title="Inga projekt än"
          description="När du har lagt upp projekt med start- och slutdatum dyker de upp här."
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

  // Tick positions (one per week)
  const ticks: { offsetDays: number; date: Date }[] = [];
  for (let w = 0; w <= weeks; w++) {
    const offsetDays = w * 7;
    ticks.push({ offsetDays, date: addDays(viewStart, offsetDays) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Schema"
        subtitle="Översikt av projekt och faser över tid."
        actions={
          <div className="inline-flex items-center rounded-md border border-white/10 bg-background-elevated/40 p-0.5 text-xs">
            {([4, 8, 12, 16] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeeks(w)}
                aria-pressed={weeks === w}
                className={`px-3 py-1.5 rounded-[5px] tabular-nums font-medium transition-colors ${
                  weeks === w
                    ? "bg-white/10 text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {w}v
              </button>
            ))}
          </div>
        }
      />

      <Card>
        <CardHeader
          title={`${scheduled.length} tidsplanerade projekt`}
          subtitle={`${formatShortDate(viewStart)} – ${formatShortDate(addDays(viewEnd, -1))}`}
        />

        {scheduled.length === 0 ? (
          <p className="px-5 py-12 text-sm text-foreground-muted text-center">
            Inga projekt med datum i den valda perioden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="relative"
              style={{ minWidth: `${totalDays * minDayPx}px` }}
            >
              {/* Header row: week ticks */}
              <div className="sticky top-0 z-10 grid grid-cols-[200px_1fr] border-b border-white/10 bg-background-elevated/80 backdrop-blur">
                <div className="px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-foreground-muted font-medium">
                  Projekt
                </div>
                <div
                  className="relative h-12"
                  aria-label="Tidsskala"
                >
                  {ticks.map((t, i) => {
                    if (i === ticks.length - 1) return null;
                    const left = (t.offsetDays / totalDays) * 100;
                    const width = (7 / totalDays) * 100;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-white/5 px-2 py-2 flex flex-col justify-center"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span className="text-[10px] tabular-nums text-foreground-muted">
                          {formatWeek(t.date)}
                        </span>
                        <span className="text-[10px] tabular-nums text-foreground-muted/60">
                          {formatShortDate(t.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body rows */}
              <div className="relative">
                {scheduled.map((p) => {
                  const start = parseDate(p.start_date);
                  const end = parseDate(p.end_date);
                  if (!start || !end) return null;
                  const startOffset = diffDays(start, viewStart);
                  const endOffset = diffDays(end, viewStart);
                  // Clamp to viewport
                  const clampedStart = Math.max(0, startOffset);
                  const clampedEnd = Math.min(totalDays, endOffset + 1);
                  const visible = clampedEnd > clampedStart;
                  const leftPct = (clampedStart / totalDays) * 100;
                  const widthPct =
                    ((clampedEnd - clampedStart) / totalDays) * 100;
                  const overflowsLeft = startOffset < 0;
                  const overflowsRight = endOffset + 1 > totalDays;
                  const tone = projectStatusTone(p.status);
                  const colors = barClassesForTone(tone);

                  return (
                    <div
                      key={p.id}
                      className="grid grid-cols-[200px_1fr] border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <div className="px-5 py-3 min-w-0">
                        <Link
                          href={`/${tenant}/projects/project/?id=${p.id}`}
                          className="text-sm hover:text-amber-400 truncate block"
                          title={p.name}
                        >
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-foreground-muted truncate">
                          {p.customers?.name ??
                            p.reference ??
                            p.id.slice(0, 8)}
                        </p>
                      </div>
                      <div className="relative h-14">
                        {/* Week separators */}
                        {ticks.map((t, i) => {
                          if (i === 0 || i === ticks.length) return null;
                          const left = (t.offsetDays / totalDays) * 100;
                          return (
                            <div
                              key={i}
                              aria-hidden="true"
                              className="absolute top-0 bottom-0 border-l border-white/5"
                              style={{ left: `${left}%` }}
                            />
                          );
                        })}

                        {visible && (
                          <Link
                            href={`/${tenant}/projects/project/?id=${p.id}`}
                            className={`group absolute top-2.5 bottom-2.5 rounded-md border ${colors.fill} ${colors.border} backdrop-blur-sm transition-colors flex items-center px-2 overflow-hidden`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            title={`${p.name} · ${p.start_date} → ${p.end_date}`}
                          >
                            {overflowsLeft && (
                              <span
                                aria-hidden="true"
                                className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-white/30 to-transparent"
                              />
                            )}
                            {overflowsRight && (
                              <span
                                aria-hidden="true"
                                className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-white/30 to-transparent"
                              />
                            )}
                            <span className="text-[11px] font-medium tracking-tight truncate text-foreground">
                              {p.name}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Today line — full-height vertical brand-gradient stripe */}
                <TodayLine
                  todayOffset={diffDays(today, viewStart)}
                  totalDays={totalDays}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {unscheduled.length > 0 && (
        <Card>
          <CardHeader
            title="Ej tidsplanerade"
            subtitle="Saknar start- och/eller slutdatum"
          />
          <ul className="divide-y divide-white/5">
            {unscheduled.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02]"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${tenant}/projects/project/?id=${p.id}`}
                    className="text-sm hover:text-amber-400"
                  >
                    {p.name}
                  </Link>
                  <p className="text-[11px] text-foreground-muted truncate">
                    {p.customers?.name ?? p.reference ?? "—"}
                  </p>
                </div>
                <StatusPill tone={projectStatusTone(p.status)} size="sm">
                  {projectStatusLabel(p.status)}
                </StatusPill>
                <span className="text-[11px] text-foreground-muted tabular-nums">
                  {p.start_date ?? "—"} → {p.end_date ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Today line — pulsing brand-gradient vertical stripe overlaying gantt area.
// Rendered inside the body container so it spans all rows.
// ---------------------------------------------------------------------------

function TodayLine({
  todayOffset,
  totalDays,
}: {
  todayOffset: number;
  totalDays: number;
}) {
  if (todayOffset < 0 || todayOffset > totalDays) return null;
  const leftPct = (todayOffset / totalDays) * 100;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid grid-cols-[200px_1fr]"
    >
      <div />
      <div className="relative">
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${leftPct}%`,
            background: "var(--brand-gradient)",
            boxShadow: "0 0 8px 1px rgba(244, 114, 182, 0.6)",
            animation: "saldoTodayPulse 2.4s ease-in-out infinite",
          }}
        />
        <span
          className="absolute -translate-x-1/2 top-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-[0.18em] text-white/95"
          style={{
            left: `${leftPct}%`,
            background: "var(--brand-gradient)",
          }}
        >
          Idag
        </span>
      </div>
      <style>{`
        @keyframes saldoTodayPulse {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
