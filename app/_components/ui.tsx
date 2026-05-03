// Shared UI primitives used across the tenant app and admin shell.
//
// Extracted in the audit hardening pass: the same red-banner and "Laddar…"
// markup was duplicated across 30+ files with inconsistent dark-mode
// variants, so consolidating here also fixes a real visual bug.

export function ErrorBanner({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm"
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
      className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4"
    >
      <h2 className="font-semibold text-red-900 dark:text-red-200">{title}</h2>
      <p className="mt-1 text-sm text-red-800 dark:text-red-300">{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-md border border-red-300 dark:border-red-800 px-3 py-1.5 text-sm hover:bg-red-100 dark:hover:bg-red-950/50"
        >
          Försök igen
        </button>
      ) : null}
    </div>
  );
}

export function LoadingText({ label = "Laddar…" }: { label?: string }) {
  return (
    <p className="text-sm text-neutral-500" role="status" aria-live="polite">
      {label}
    </p>
  );
}

// Skeleton primitives. Render the layout shape (cards/rows) while data
// loads — CLAUDE.md prefers skeletons over spinner/text loaders.
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-neutral-200/70 dark:bg-neutral-800/60 ${className}`}
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
    <div
      className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800"
      aria-hidden="true"
    >
      <div className="bg-neutral-100 dark:bg-neutral-800/60 px-4 py-2.5">
        <SkeletonBlock className="h-4 w-24" />
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
