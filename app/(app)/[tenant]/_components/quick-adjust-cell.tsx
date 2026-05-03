"use client";

import { useEffect, useRef, useState } from "react";

import { recordMovement } from "@/lib/data";

type Mode = "view" | "edit" | "saving";

/**
 * Local helper kept inside this component (per file boundaries) — wraps
 * `recordMovement` with the "snabbjustering" preset so the table cell only
 * has to think about one number.
 */
async function quickAdjust(productId: string, newQty: number): Promise<void> {
  await recordMovement({
    productId,
    type: "adjust",
    quantity: newQty,
    note: "Snabbjustering",
  });
}

type Props = {
  productId: string;
  quantity: number;
  low: boolean;
  onSaved: (newQty: number) => void;
};

export function QuickAdjustCell({ productId, quantity, low, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<string>(String(quantity));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // When we enter edit mode, focus + select the number for fast overwrite.
  useEffect(() => {
    if (mode === "edit") {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [mode]);

  // Reset local state if the parent's quantity changes while we're idle
  // (e.g. after a successful save it gets re-rendered with the new value).
  useEffect(() => {
    if (mode === "view") {
      setDraft(String(quantity));
    }
  }, [quantity, mode]);

  function startEdit() {
    setError(null);
    setDraft(String(quantity));
    setMode("edit");
  }

  function cancel() {
    setError(null);
    setDraft(String(quantity));
    setMode("view");
  }

  async function save() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Ange ett giltigt antal");
      return;
    }
    const newQty = Math.floor(parsed);
    if (newQty === quantity) {
      // No-op — just close.
      setMode("view");
      return;
    }
    setMode("saving");
    setError(null);
    try {
      await quickAdjust(productId, newQty);
      onSaved(newQty);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMode("edit");
    }
  }

  if (mode === "view") {
    return (
      <button
        type="button"
        onClick={startEdit}
        title="Klicka för att justera antal"
        className={`inline-block rounded px-2 py-0.5 font-medium tabular-nums hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 ${
          low ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        {quantity}
      </button>
    );
  }

  const saving = mode === "saving";

  return (
    <div className="inline-flex items-center justify-end gap-1 relative">
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        aria-label="Nytt antal"
        className="w-20 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-2 py-1 text-xs font-medium disabled:opacity-50"
      >
        {saving ? "…" : "Spara"}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={saving}
        className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs disabled:opacity-50"
      >
        Avbryt
      </button>
      {error && (
        <div
          role="alert"
          className="absolute top-full right-0 mt-1 z-10 whitespace-nowrap rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/80 px-2 py-1 text-xs text-red-700 dark:text-red-300 shadow"
        >
          {error}
        </div>
      )}
    </div>
  );
}
