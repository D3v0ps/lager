"use client";

import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ErrorBanner } from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

type Pairing = "single" | "before" | "after";

type Props = {
  projectId: string;
  onUploaded?: () => void;
};

type FileState = {
  id: string;
  filename: string;
  status: "pending" | "reading" | "uploading" | "done" | "error";
  message?: string;
};

type ExifInfo = {
  takenAt: string | null;
  latE7: number | null;
  lngE7: number | null;
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_");
}

// ---------------------------------------------------------------------------
// Minimal JPEG EXIF parser.
//
// Reads the APP1 segment, looks for the EXIF IFD0 → ExifSubIFD pointer,
// then extracts DateTimeOriginal (0x9003) and the GPSInfo IFD pointer
// (tag 0x8825 in IFD0). Skips everything else. Returns null fields on any
// parse failure — the caller falls back to file.lastModified + geolocation.
// ---------------------------------------------------------------------------

async function readExif(file: File): Promise<ExifInfo> {
  const fallback: ExifInfo = { takenAt: null, latE7: null, lngE7: null };
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
    return fallback;
  }
  try {
    // We only need the first ~256 KB to find APP1.
    const slice = file.slice(0, Math.min(file.size, 256 * 1024));
    const buf = await slice.arrayBuffer();
    const view = new DataView(buf);
    if (view.getUint16(0) !== 0xffd8) return fallback; // Not JPEG
    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset);
      const segLen = view.getUint16(offset + 2);
      if (marker === 0xffe1) {
        // APP1 — look for "Exif\0\0"
        if (
          view.getUint32(offset + 4) === 0x45786966 &&
          view.getUint16(offset + 8) === 0x0000
        ) {
          return parseTiff(view, offset + 10);
        }
      }
      if (marker === 0xffda || segLen <= 0) break; // SOS or invalid
      offset += 2 + segLen;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function parseTiff(view: DataView, tiffStart: number): ExifInfo {
  const fallback: ExifInfo = { takenAt: null, latE7: null, lngE7: null };
  if (tiffStart + 8 > view.byteLength) return fallback;
  const byteOrder = view.getUint16(tiffStart);
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4d4d) return fallback;
  const get16 = (o: number) => view.getUint16(o, little);
  const get32 = (o: number) => view.getUint32(o, little);
  if (get16(tiffStart + 2) !== 0x002a) return fallback;
  const ifd0 = tiffStart + get32(tiffStart + 4);
  if (ifd0 + 2 > view.byteLength) return fallback;

  let exifIfd = 0;
  let gpsIfd = 0;
  const numEntries0 = get16(ifd0);
  for (let i = 0; i < numEntries0; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = get16(entry);
    if (tag === 0x8769) exifIfd = tiffStart + get32(entry + 8);
    else if (tag === 0x8825) gpsIfd = tiffStart + get32(entry + 8);
  }

  let takenAt: string | null = null;
  if (exifIfd && exifIfd + 2 <= view.byteLength) {
    const numEntries = get16(exifIfd);
    for (let i = 0; i < numEntries; i++) {
      const entry = exifIfd + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      const tag = get16(entry);
      if (tag === 0x9003) {
        // DateTimeOriginal — ASCII "YYYY:MM:DD HH:MM:SS\0"
        const count = get32(entry + 4);
        const valueOffset = count > 4 ? tiffStart + get32(entry + 8) : entry + 8;
        if (valueOffset + count <= view.byteLength) {
          const bytes = new Uint8Array(view.buffer, view.byteOffset + valueOffset, count);
          const str = new TextDecoder("ascii").decode(bytes).replace(/\0+$/, "");
          // Convert "YYYY:MM:DD HH:MM:SS" → ISO
          const m = str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
          if (m) {
            const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
            const d = new Date(iso);
            if (!Number.isNaN(d.getTime())) takenAt = d.toISOString();
          }
        }
      }
    }
  }

  let latE7: number | null = null;
  let lngE7: number | null = null;
  if (gpsIfd && gpsIfd + 2 <= view.byteLength) {
    let latRef: "N" | "S" | null = null;
    let lngRef: "E" | "W" | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    const numEntries = get16(gpsIfd);
    for (let i = 0; i < numEntries; i++) {
      const entry = gpsIfd + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      const tag = get16(entry);
      const type = get16(entry + 2);
      const count = get32(entry + 4);
      const valueOffset = entry + 8;
      if (tag === 1 && type === 2) {
        latRef = String.fromCharCode(view.getUint8(valueOffset)) === "S" ? "S" : "N";
      } else if (tag === 3 && type === 2) {
        lngRef = String.fromCharCode(view.getUint8(valueOffset)) === "W" ? "W" : "E";
      } else if (tag === 2 && type === 5 && count === 3) {
        // 3 RATIONALs: degrees, minutes, seconds
        const dataOff = tiffStart + get32(valueOffset);
        lat = readGpsRationals(view, dataOff, little);
      } else if (tag === 4 && type === 5 && count === 3) {
        const dataOff = tiffStart + get32(valueOffset);
        lng = readGpsRationals(view, dataOff, little);
      }
    }
    if (lat != null && lng != null && latRef && lngRef) {
      const latDec = latRef === "S" ? -lat : lat;
      const lngDec = lngRef === "W" ? -lng : lng;
      latE7 = Math.round(latDec * 1e7);
      lngE7 = Math.round(lngDec * 1e7);
    }
  }

  return { takenAt, latE7, lngE7 };
}

function readGpsRationals(
  view: DataView,
  offset: number,
  little: boolean,
): number | null {
  if (offset + 24 > view.byteLength) return null;
  const get32 = (o: number) => view.getUint32(o, little);
  const deg = get32(offset) / (get32(offset + 4) || 1);
  const min = get32(offset + 8) / (get32(offset + 12) || 1);
  const sec = get32(offset + 16) / (get32(offset + 20) || 1);
  return deg + min / 60 + sec / 3600;
}

// Read width/height by loading the file into an Image element.
function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ width: null, height: null });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );
  });
}

export function UploadPhotoButton({ projectId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [files, setFiles] = useState<FileState[]>([]);
  const [caption, setCaption] = useState("");
  const [pairing, setPairing] = useState<Pairing>("single");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleSelect(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setPendingFiles(Array.from(list));
  }

  async function handleUpload() {
    if (pendingFiles.length === 0) return;
    setBusy(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

    const initial: FileState[] = pendingFiles.map((f) => ({
      id: uuid(),
      filename: f.name,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...initial]);

    // Generate pair_group + decide position once for the whole batch.
    const pairGroup =
      pairing === "before" || pairing === "after" ? uuid() : null;
    const position = pairing === "before" ? 0 : pairing === "after" ? 1 : null;

    let didUpload = false;

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const state = initial[i];
      setFiles((prev) =>
        prev.map((s) =>
          s.id === state.id ? { ...s, status: "reading" } : s,
        ),
      );
      try {
        const exif = await readExif(file);
        const dims = await readDimensions(file);

        let takenAt = exif.takenAt;
        if (!takenAt && file.lastModified) {
          takenAt = new Date(file.lastModified).toISOString();
        }
        let latE7 = exif.latE7;
        let lngE7 = exif.lngE7;
        // Geolocation fallback only on first iteration if EXIF didn't carry GPS.
        if (latE7 == null && lngE7 == null && i === 0) {
          const pos = await getCurrentPosition();
          if (pos) {
            latE7 = Math.round(pos.coords.latitude * 1e7);
            lngE7 = Math.round(pos.coords.longitude * 1e7);
          }
        }

        setFiles((prev) =>
          prev.map((s) =>
            s.id === state.id ? { ...s, status: "uploading" } : s,
          ),
        );

        const cleanName = safeName(file.name);
        const storage_key = `${projectId}/photos/${uuid()}-${cleanName}`;
        const { error: upErr } = await supabase.storage
          .from("project-files")
          .upload(storage_key, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
        if (upErr) throw new Error(upErr.message);

        const { error: insertErr } = await supabase
          .from("project_photos")
          .insert({
            project_id: projectId,
            storage_key,
            caption: caption.trim() || null,
            taken_at: takenAt,
            geo_lat_e7: latE7,
            geo_lng_e7: lngE7,
            width: dims.width,
            height: dims.height,
            pair_group: pairGroup,
            position,
          });
        if (insertErr) throw new Error(insertErr.message);

        didUpload = true;
        setFiles((prev) =>
          prev.map((s) =>
            s.id === state.id ? { ...s, status: "done" } : s,
          ),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setFiles((prev) =>
          prev.map((s) =>
            s.id === state.id ? { ...s, status: "error", message } : s,
          ),
        );
        setError(message);
      }
    }

    setBusy(false);
    setPendingFiles([]);
    setCaption("");
    setPairing("single");
    if (inputRef.current) inputRef.current.value = "";
    if (didUpload) onUploaded?.();
  }

  return (
    <div className="space-y-3">
      <label
        className="block w-full rounded-md bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 text-white px-6 py-4 text-base font-semibold text-center cursor-pointer hover:opacity-95 disabled:opacity-50"
        aria-disabled={busy}
      >
        {busy ? "Laddar upp…" : "Ta foto"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={(e) => handleSelect(e.target.files)}
        />
      </label>

      {pendingFiles.length > 0 && (
        <div className="rounded-md border border-white/10 bg-background-elevated/40 p-4 space-y-3">
          <p className="text-sm">
            {pendingFiles.length} foto{pendingFiles.length === 1 ? "" : "n"} valda
          </p>
          <div>
            <label htmlFor="photo-caption" className={labelClass}>
              Bildtext (valfri)
            </label>
            <input
              id="photo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tillämpas på alla bilder"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="photo-pair" className={labelClass}>
              Parning
            </label>
            <select
              id="photo-pair"
              value={pairing}
              onChange={(e) => setPairing(e.target.value as Pairing)}
              className={inputClass}
            >
              <option value="single">Lös bild</option>
              <option value="before">Före</option>
              <option value="after">Efter</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={busy}
              className="flex-1 rounded-md bg-foreground text-background px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Laddar upp…" : "Ladda upp"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingFiles([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={busy}
              className="rounded-md border border-white/15 px-4 py-3 text-sm"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {files.length > 0 && (
        <ul className="divide-y divide-white/5 rounded-md border border-white/10 bg-background-elevated/40">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <FileStatusIcon status={f.status} />
              <span className="flex-1 min-w-0 truncate">{f.filename}</span>
              <span className="text-xs text-foreground-muted">
                {f.status === "reading" && "Läser EXIF…"}
                {f.status === "uploading" && "Laddar upp…"}
                {f.status === "done" && "Klar"}
                {f.status === "error" && (f.message ?? "Fel")}
                {f.status === "pending" && "Väntar"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileStatusIcon({ status }: { status: FileState["status"] }) {
  if (status === "uploading" || status === "pending" || status === "reading") {
    return (
      <span
        className="inline-block h-3.5 w-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin"
        aria-hidden="true"
      />
    );
  }
  if (status === "done") {
    return (
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] leading-[14px] text-center"
        aria-hidden="true"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full bg-red-500/20 text-red-400 text-[10px] leading-[14px] text-center"
      aria-hidden="true"
    >
      !
    </span>
  );
}
