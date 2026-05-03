"use client";

import { useEffect } from "react";

import { ErrorPage } from "@/app/_components/ui";

// Per-tenant error boundary. Catches throws inside any child route segment
// (dashboard, orders, settings, etc.) so the user gets a clear retry path
// instead of a blank screen.

export default function TenantSegmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[tenant-error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ErrorPage
        title="Något gick fel"
        message={error.message || "Vi kunde inte ladda den här sidan just nu."}
        retry={() => unstable_retry()}
      />
    </div>
  );
}
