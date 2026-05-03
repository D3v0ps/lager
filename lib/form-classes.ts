// Tailwind class strings for form inputs and labels. Extracted because the
// same two strings were re-declared in 6 form components plus inlined in 5
// list pages — small, but a single source of truth makes design-token swaps
// a one-file edit.

export const inputClass =
  "block w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500";

export const labelClass = "block text-sm font-medium mb-1";
