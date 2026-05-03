import type { SVGProps } from "react";

/**
 * Saldo brand mark — 2026 revamp.
 *
 * Concept "Pulse": a stylized capital S formed by two offset stock-bars,
 * the upper end carrying a small accent dot that reads as either a stock
 * level marker or the "live" indicator on a dashboard. The mark is filled
 * with the brand gradient when used on dark surfaces so the icon itself
 * is the brand signature; on light surfaces or per-tenant overrides the
 * solid `var(--brand)` is used instead.
 */
export function SaldoMark({
  className = "h-7 w-7",
  variant = "gradient",
  accent = false,
  ...rest
}: SVGProps<SVGSVGElement> & {
  variant?: "gradient" | "solid" | "mono";
  accent?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Saldo"
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id="saldo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="35%" stopColor="#EF4444" />
          <stop offset="65%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {/* Rounded surface */}
      <rect
        width="32"
        height="32"
        rx="8"
        fill={
          variant === "gradient"
            ? "url(#saldo-grad)"
            : variant === "mono"
              ? "currentColor"
              : "var(--brand, #F59E0B)"
        }
      />
      {/* Upper bar — the top of the S */}
      <rect x="8" y="9" width="13" height="3" rx="1.5" fill="white" />
      {/* Middle bar — the spine of the S */}
      <rect
        x="11"
        y="14.5"
        width="13"
        height="3"
        rx="1.5"
        fill="white"
        opacity="0.92"
      />
      {/* Lower bar — the foot of the S */}
      <rect
        x="8"
        y="20"
        width="13"
        height="3"
        rx="1.5"
        fill="white"
        opacity="0.78"
      />
      {/* Accent dot — pulses as a "live" indicator on the dashboard concept */}
      <circle cx="24" cy="10.5" r="1.6" fill={accent ? "#FACC15" : "white"} />
    </svg>
  );
}

/** Wordmark — Saldo in a tightened tracking with the gradient-text utility. */
export function SaldoWordmark({
  className = "font-semibold text-lg tracking-tight",
  gradient = false,
}: {
  className?: string;
  gradient?: boolean;
}) {
  return (
    <span className={`${className} ${gradient ? "brand-text" : ""}`}>
      Saldo
    </span>
  );
}
