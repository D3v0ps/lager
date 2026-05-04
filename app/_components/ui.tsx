// Shared UI primitives — premium dark visual language matching the
// landing page's HeroVisual mock.
//
// Use these for any new screen and migrate existing screens incrementally.
// Tokens: bg-background-elevated/40, border-white/10, hover:border-white/20,
// hover:bg-white/[0.03] for rows.

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Inline status / loading / error
// ---------------------------------------------------------------------------

export function ErrorBanner({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="rounded-md border border-red-400/30 bg-red-500/10 text-red-200 p-3 text-sm"
    >
      {children}
    </div>
  );
}

export function ErrorPage({
  title = "Något gick fel",
  message,
  retry,
}: {
  title?: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-red-400/30 bg-red-500/[0.06] p-6"
    >
      <h2 className="font-semibold text-red-200">{title}</h2>
      <p className="mt-1.5 text-sm text-red-200/80">{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-4 rounded-md border border-red-400/30 px-3 py-1.5 text-sm hover:bg-red-500/10"
        >
          Försök igen
        </button>
      ) : null}
    </div>
  );
}

export function LoadingText({ label = "Laddar…" }: { label?: string }) {
  return (
    <p className="text-sm text-foreground-muted" role="status" aria-live="polite">
      {label}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-white/[0.06] ${className}`}
    />
  );
}

export function SkeletonRows({
  rows = 5,
  className = "h-8",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonBlock key={i} className={className} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <Card aria-hidden="true">
      <div className="border-b border-white/5 px-5 py-3">
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 flex-1" />
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Card — the universal surface
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = "",
  variant = "muted",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** muted: default. elevated: slightly brighter border for hierarchy. */
  variant?: "muted" | "elevated";
} & React.HTMLAttributes<HTMLDivElement>) {
  const variantCls =
    variant === "elevated"
      ? "border-white/15 bg-background-elevated/70"
      : "border-white/10 bg-background-elevated/40";
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${variantCls} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  divider = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  divider?: boolean;
}) {
  return (
    <header
      className={`flex items-center justify-between gap-4 px-5 sm:px-6 py-4 ${
        divider ? "border-b border-white/5" : ""
      }`}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-medium tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// PageHeader — unified page title + actions
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Small uppercase label above the title (e.g. "Försäljning"). */
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted font-medium">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-foreground-muted mt-1.5 max-w-2xl">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// KPI tile — full-bleed strip cell, matches HeroVisual aesthetic
// ---------------------------------------------------------------------------

export function KpiStrip({ children }: { children: ReactNode }) {
  // Children should be <KpiTile/> — they share borders via divide-x.
  return (
    <Card className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
      {children}
    </Card>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  /** Color of the delta + value. positive=emerald, negative=amber, neutral=muted. */
  tone?: "positive" | "negative" | "neutral";
}) {
  const deltaCls =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-amber-400"
        : "text-foreground-muted";
  return (
    <div className="px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {delta ? (
        <p className={`mt-0.5 text-[11px] tabular-nums ${deltaCls}`}>{delta}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

export function StatusPill({
  tone,
  children,
  size = "default",
}: {
  tone: "ok" | "low" | "warning" | "info" | "muted" | "error";
  children: ReactNode;
  size?: "default" | "sm";
}) {
  const tones: Record<string, string> = {
    ok: "bg-emerald-500/10 text-emerald-400",
    low: "bg-amber-500/10 text-amber-400",
    warning: "bg-amber-500/10 text-amber-400",
    info: "bg-violet-500/10 text-violet-400",
    muted: "bg-white/5 text-foreground-muted",
    error: "bg-red-500/10 text-red-400",
  };
  const sizeCls =
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const dotCls: Record<string, string> = {
    ok: "bg-emerald-400",
    low: "bg-amber-400",
    warning: "bg-amber-400",
    info: "bg-violet-400",
    muted: "bg-white/40",
    error: "bg-red-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${tones[tone]} ${sizeCls}`}
    >
      <span className={`h-1 w-1 rounded-full ${dotCls[tone]}`} />
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Data table chrome
// ---------------------------------------------------------------------------

export function DataTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-[0.15em] text-foreground-muted font-medium">
        {children}
      </tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return (
    <th className={`px-5 py-3 font-medium ${alignCls} ${className}`}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function Tr({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`hover:bg-white/[0.03] transition-colors ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return (
    <td className={`px-5 py-3 ${alignCls} ${className}`}>{children}</td>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <div className="px-6 py-12 sm:py-16 text-center">
        {icon ? (
          <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-foreground-muted">
            {icon}
          </div>
        ) : null}
        <h3 className="text-base font-medium">{title}</h3>
        {description ? (
          <p className="mt-1.5 text-sm text-foreground-muted max-w-md mx-auto">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sparkline — used in dashboard, hero visual, reports
// ---------------------------------------------------------------------------

export function Sparkline({
  points,
  className = "",
  height = 38,
  color = "#F59E0B",
}: {
  points: number[];
  className?: string;
  height?: number;
  color?: string;
}) {
  if (points.length === 0) return null;
  const w = 220;
  const max = Math.max(...points) || 1;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${i * step},${height - (p / max) * height}`,
    )
    .join(" ");
  const area = `${path} L ${w},${height} L 0,${height} Z`;
  const id = `spark-fill-${color.replace("#", "")}`;
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className={`block ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Buttons — primary/secondary/ghost
// ---------------------------------------------------------------------------

const baseBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function buttonClasses(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  size: "sm" | "md" = "md",
): string {
  const sizeCls = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const variantCls =
    variant === "primary"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : variant === "secondary"
        ? "border border-white/15 bg-white/[0.02] hover:bg-white/[0.06]"
        : variant === "danger"
          ? "border border-red-400/30 text-red-300 hover:bg-red-500/10"
          : "text-foreground-muted hover:text-foreground";
  return `${baseBtn} ${sizeCls} ${variantCls}`;
}
