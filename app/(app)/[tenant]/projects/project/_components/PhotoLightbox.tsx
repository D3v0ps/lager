"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { ProjectPhoto } from "@/lib/projects";

type Props = {
  /** Photo to show. If null, the lightbox is closed. */
  photo: ProjectPhoto | null;
  /**
   * Full collection (in display order) for keyboard navigation. When
   * provided and the photo is part of it, ←/→ flip between items.
   */
  collection?: ProjectPhoto[];
  /** Called when the user navigates inside the lightbox. */
  onChange?: (next: ProjectPhoto) => void;
  onClose: () => void;
};

const SIGN_TTL_SECONDS = 60 * 10; // 10 minutes — long enough to view a photo

export function PhotoLightbox({ photo, collection, onChange, onClose }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const index = useMemo(() => {
    if (!photo || !collection || collection.length === 0) return -1;
    return collection.findIndex((p) => p.id === photo.id);
  }, [photo, collection]);
  const hasPrev = index > 0;
  const hasNext = collection != null && index >= 0 && index < collection.length - 1;

  const goPrev = useCallback(() => {
    if (collection && hasPrev) onChange?.(collection[index - 1]);
  }, [collection, hasPrev, index, onChange]);
  const goNext = useCallback(() => {
    if (collection && hasNext) onChange?.(collection[index + 1]);
  }, [collection, hasNext, index, onChange]);

  // Resolve a signed URL from storage_key whenever the visible photo changes.
  useEffect(() => {
    if (!photo) {
      setSignedUrl(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setSignedUrl(null);
    setLoadError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;
    void supabase.storage
      .from("project-files")
      .createSignedUrl(photo.storage_key, SIGN_TTL_SECONDS)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          return;
        }
        setSignedUrl(data?.signedUrl ?? null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  // Keyboard handling: Esc closes; ←/→ navigate.
  useEffect(() => {
    if (!photo) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (hasPrev) {
          e.preventDefault();
          goPrev();
        }
      } else if (e.key === "ArrowRight") {
        if (hasNext) {
          e.preventDefault();
          goNext();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photo, hasPrev, hasNext, goPrev, goNext, onClose]);

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!photo) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [photo]);

  if (!photo) return null;

  const lat = photo.geo_lat_e7 != null ? photo.geo_lat_e7 / 1e7 : null;
  const lng = photo.geo_lng_e7 != null ? photo.geo_lng_e7 / 1e7 : null;
  const hasGps = lat != null && lng != null;
  const mapsHref = hasGps
    ? `https://maps.google.com/?q=${lat},${lng}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption ?? "Foto"}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-3 border-b border-white/10 bg-background-elevated/40 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 text-xs text-foreground-muted tabular-nums">
          {collection && index >= 0
            ? `${index + 1} / ${collection.length}`
            : ""}
        </div>
        <button
          type="button"
          aria-label="Stäng"
          onClick={onClose}
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-foreground hover:bg-white/[0.06]"
        >
          ×
        </button>
      </div>

      {/* Image area */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loadError ? (
          <p className="text-sm text-red-300" role="alert">
            Kunde inte hämta bild: {loadError}
          </p>
        ) : signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signedUrl}
            alt={photo.caption ?? "Foto"}
            className="max-h-full max-w-full object-contain"
            width={photo.width ?? undefined}
            height={photo.height ?? undefined}
          />
        ) : (
          <span className="text-sm text-foreground-muted">Laddar foto…</span>
        )}

        {hasPrev && (
          <button
            type="button"
            aria-label="Föregående"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-background-elevated/40 px-3 py-2 text-lg text-foreground hover:bg-white/[0.06]"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            aria-label="Nästa"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-background-elevated/40 px-3 py-2 text-lg text-foreground hover:bg-white/[0.06]"
          >
            ›
          </button>
        )}
      </div>

      {/* Caption / metadata */}
      <div
        className="border-t border-white/10 bg-background-elevated/40 px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        {photo.caption ? (
          <p className="text-sm text-foreground">{photo.caption}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted tabular-nums">
          {photo.taken_at ? <span>{formatDate(photo.taken_at)}</span> : null}
          {hasGps && mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              {lat!.toFixed(5)}, {lng!.toFixed(5)}
            </a>
          ) : null}
          {photo.width && photo.height ? (
            <span>
              {photo.width}×{photo.height}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
