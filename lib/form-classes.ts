// Tailwind class strings for form inputs and labels.
//
// Updated for the 2026 revamp — dark elevated surfaces, white/15 borders,
// brand-amber focus ring. Single source of truth so design-token swaps
// are a one-file edit.

export const inputClass =
  "block w-full rounded-md border border-white/10 bg-background-elevated/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/70 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-white/20 transition-colors";

export const labelClass =
  "block text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted mb-1.5";

export const fieldHintClass = "mt-1.5 text-xs text-foreground-muted";
