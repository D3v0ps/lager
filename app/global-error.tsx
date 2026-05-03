"use client";

import { useEffect } from "react";

// Top-level error boundary. Catches throws that escape every nested
// boundary including the root layout, so the app never falls back to a
// blank white page.

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="sv">
      <body className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Något gick fel</h1>
          <p className="text-sm text-neutral-500">
            Ett oväntat fel inträffade. Försök igen — eller ladda om sidan om
            problemet kvarstår.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm"
          >
            Försök igen
          </button>
        </div>
      </body>
    </html>
  );
}
