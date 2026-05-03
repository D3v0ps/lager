import type { SVGProps } from "react";

/**
 * Saldo brand mark — concept 01 ("Stack").
 *
 * Three horizontal bars of varying width inside a rounded slate square.
 * Reads as inventory levels at any size. The shortest bar (top) carries
 * the optional amber accent for "lågt saldo" framing.
 */
export function SaldoMark({
  className = "h-7 w-7",
  accent = false,
  ...rest
}: SVGProps<SVGSVGElement> & { accent?: boolean }) {
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
      <rect width="32" height="32" rx="7" fill="var(--brand, #0F172A)" />
      <rect
        x="8"
        y="9"
        width="10"
        height="3"
        rx="1.5"
        fill={accent ? "#F59E0B" : "rgba(255,255,255,0.55)"}
      />
      <rect
        x="8"
        y="14.5"
        width="16"
        height="3"
        rx="1.5"
        fill="white"
      />
      <rect
        x="8"
        y="20"
        width="13"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.85)"
      />
    </svg>
  );
}

