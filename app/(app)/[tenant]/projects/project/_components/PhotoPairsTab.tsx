"use client";

import { useEffect, useMemo, useState } from "react";

import {
  listProjectPhotos,
  type ProjectPhoto,
} from "@/lib/projects";
import {
  Card,
  CardHeader,
  ErrorPage,
  SkeletonRows,
} from "@/app/_components/ui";

// The DB has `pair_group uuid` and `position text` columns (migration 0015),
// but lib/projects.ts ProjectPhoto type doesn't expose them yet. Treat the
// row as the loose shape the upload code actually writes.
type PhotoRow = ProjectPhoto & {
  pair_group?: string | null;
  // position is a CHECK in DB ('before'|'after'|'progress'), but the upload
  // code writes 0|1|null. Be liberal in what we accept.
  position?: string | number | null;
};

type Props = {
  projectId: string;
};

function positionLabel(pos: string | number | null | undefined): string | null {
  if (pos == null) return null;
  if (pos === 0 || pos === "before") return "Före";
  if (pos === 1 || pos === "after") return "Efter";
  if (pos === "progress") return "Pågår";
  return null;
}

function positionOrd(pos: string | number | null | undefined): number {
  if (pos === 0 || pos === "before") return 0;
  if (pos === "progress") return 1;
  if (pos === 1 || pos === "after") return 2;
  return 3;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Stockholm",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function PhotoPairsTab({ projectId }: Props) {
  const [photos, setPhotos] = useState<PhotoRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProjectPhotos(projectId)
      .then((rows) => setPhotos(rows as PhotoRow[]))
      .catch((e: Error) => setError(e.message));
  }, [projectId]);

  const { pairGroups, singles } = useMemo(() => {
    const pairs = new Map<string, PhotoRow[]>();
    const flat: PhotoRow[] = [];
    if (!photos) return { pairGroups: [] as PhotoRow[][], singles: flat };
    for (const p of photos) {
      if (p.pair_group) {
        const list = pairs.get(p.pair_group) ?? [];
        list.push(p);
        pairs.set(p.pair_group, list);
      } else {
        flat.push(p);
      }
    }
    const groups: PhotoRow[][] = [];
    for (const [, list] of pairs.entries()) {
      list.sort((a, b) => {
        const oa = positionOrd(a.position);
        const ob = positionOrd(b.position);
        if (oa !== ob) return oa - ob;
        const ta = a.taken_at ?? a.created_at;
        const tb = b.taken_at ?? b.created_at;
        return ta.localeCompare(tb);
      });
      groups.push(list);
    }
    // Most-recent group first by max created_at
    groups.sort((a, b) => {
      const la = Math.max(...a.map((p) => Date.parse(p.created_at)));
      const lb = Math.max(...b.map((p) => Date.parse(p.created_at)));
      return lb - la;
    });
    return { pairGroups: groups, singles: flat };
  }, [photos]);

  if (error) return <ErrorPage title="Kunde inte hämta foton" message={error} />;
  if (!photos) return <SkeletonRows rows={2} className="h-32" />;

  if (photos.length === 0) {
    return (
      <Card>
        <div className="px-5 py-12 text-center space-y-3">
          <p className="text-sm text-foreground-muted">
            Inga foton uppladdade än. Använd kameran direkt från projektsidan
            för att fota före/efter — de paras automatiskt.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pairGroups.length > 0 && (
        <Card>
          <CardHeader
            title={`${pairGroups.length} parade serier`}
            subtitle="Före/efter — visa kunden förvandlingen."
          />
          <div className="px-5 sm:px-6 py-5 space-y-6">
            {pairGroups.map((group, gi) => (
              <PairCard key={`pair-${gi}`} photos={group} />
            ))}
          </div>
        </Card>
      )}

      {singles.length > 0 && (
        <Card>
          <CardHeader
            title={`${singles.length} lösa bilder`}
            subtitle="Bilder utan paring."
          />
          <div className="px-5 sm:px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {singles.map((p) => (
                <PhotoTile key={p.id} photo={p} />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function PairCard({ photos }: { photos: PhotoRow[] }) {
  // Pad to at least 2 cells so before/after grid stays balanced visually.
  const cells = photos.length === 1 ? [photos[0], null] : photos;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cells.map((p, i) => {
        if (!p) {
          return (
            <div
              key={`empty-${i}`}
              className="aspect-[4/3] rounded-lg border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-xs text-foreground-muted/70"
            >
              Saknas
            </div>
          );
        }
        const label = positionLabel(p.position) ?? (i === 0 ? "Före" : "Efter");
        return <PhotoTile key={p.id} photo={p} label={label} aspect="4/3" />;
      })}
    </div>
  );
}

function PhotoTile({
  photo,
  label,
  aspect = "1/1",
}: {
  photo: PhotoRow;
  label?: string;
  aspect?: "1/1" | "4/3";
}) {
  const aspectCls = aspect === "4/3" ? "aspect-[4/3]" : "aspect-square";
  const filename = photo.storage_key.split("/").pop() ?? "";
  const timestamp = formatTimestamp(photo.taken_at ?? photo.created_at);
  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-white/10 bg-background-elevated/40 ${aspectCls}`}
    >
      {/* Mock placeholder — storage_keys aren't signed URLs yet. */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span
          aria-hidden="true"
          className="h-8 w-8 rounded-full bg-white/[0.06] mb-2 flex items-center justify-center text-foreground-muted"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M8 5l1.5-2h5L16 5" />
          </svg>
        </span>
        <p className="text-[11px] text-foreground/85 line-clamp-2">
          {photo.caption ?? filename}
        </p>
      </div>

      {label && (
        <span className="absolute top-2 left-2 z-[2] rounded-full bg-black/60 backdrop-blur-sm border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] font-medium text-white/95">
          {label}
        </span>
      )}

      {/* Hover overlay: timestamp */}
      {timestamp && (
        <div
          className="absolute inset-x-0 bottom-0 z-[2] translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out bg-gradient-to-t from-black/80 via-black/55 to-transparent px-3 py-2"
          aria-hidden="true"
        >
          <p className="text-[10px] tabular-nums text-white/90">{timestamp}</p>
        </div>
      )}
    </div>
  );
}
