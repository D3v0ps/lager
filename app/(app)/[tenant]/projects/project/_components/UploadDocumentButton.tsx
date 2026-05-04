"use client";

import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ErrorBanner } from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

const CATEGORY_OPTIONS = ["Anbud", "Ritning", "Intyg", "Faktura", "Annat"] as const;

const ACCEPT =
  "application/pdf,image/*,.doc,.docx,.xls,.xlsx";

type FileState = {
  id: string;
  filename: string;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
};

type Props = {
  projectId: string;
  onUploaded?: () => void;
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeName(name: string): string {
  // Strip path-unsafe chars but keep dots + dashes for extension visibility.
  return name.replace(/[^A-Za-z0-9._-]+/g, "_");
}

export function UploadDocumentButton({ projectId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [category, setCategory] = useState<string>("");
  const [files, setFiles] = useState<FileState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setBusy(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as unknown as SupabaseClient<any, "public", any>;

    const initial: FileState[] = Array.from(list).map((f) => ({
      id: uuid(),
      filename: f.name,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...initial]);

    let didUpload = false;

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const state = initial[i];
      setFiles((prev) =>
        prev.map((s) =>
          s.id === state.id ? { ...s, status: "uploading" } : s,
        ),
      );
      try {
        const cleanName = safeName(file.name);
        const storage_key = `${projectId}/${uuid()}-${cleanName}`;
        const { error: upErr } = await supabase.storage
          .from("project-files")
          .upload(storage_key, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
        if (upErr) throw new Error(upErr.message);

        const { error: insertErr } = await supabase
          .from("project_documents")
          .insert({
            project_id: projectId,
            storage_key,
            filename: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
            category: category.trim() || null,
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
    if (inputRef.current) inputRef.current.value = "";
    if (didUpload) onUploaded?.();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label htmlFor="doc-category" className={labelClass}>
            Kategori (valfri)
          </label>
          <input
            id="doc-category"
            list="doc-category-options"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="t.ex. Anbud, Ritning, Intyg"
            className={inputClass}
          />
          <datalist id="doc-category-options">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <label
          className="block rounded-md bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 text-white px-5 py-3 text-sm font-semibold text-center cursor-pointer hover:opacity-95 disabled:opacity-50 sm:min-w-[160px]"
          aria-disabled={busy}
        >
          {busy ? "Laddar upp…" : "+ Ladda upp"}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            disabled={busy}
            className="sr-only"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </label>
      </div>

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
  if (status === "uploading" || status === "pending") {
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
