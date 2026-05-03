"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { listProducts, recordMovement } from "@/lib/data";
import type { Product } from "@/lib/database.types";

// --- Minimal BarcodeDetector typings (not yet in lib.dom.d.ts) ---
type BarcodeFormat =
  | "ean_13"
  | "ean_8"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "itf"
  | "qr_code"
  | "upc_a"
  | "upc_e"
  | "pdf417"
  | "aztec"
  | "data_matrix";

type DetectedBarcode = {
  rawValue: string;
  format: BarcodeFormat;
};

type BarcodeDetectorCtor = new (opts?: {
  formats?: BarcodeFormat[];
}) => {
  detect: (
    source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement,
  ) => Promise<DetectedBarcode[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

// --- Component ---

type Mode =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "running" }
  | { kind: "denied"; message: string }
  | { kind: "unsupported" };

type Lookup =
  | { kind: "none" }
  | { kind: "searching"; sku: string }
  | { kind: "found"; product: Product }
  | { kind: "missing"; sku: string }
  | { kind: "error"; message: string };

const SCAN_INTERVAL_MS = 333; // ~3 reads/sec

type Props = {
  tenant: string;
};

export function Scanner({ tenant }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<InstanceType<BarcodeDetectorCtor> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectAtRef = useRef<number>(0);
  const productsCacheRef = useRef<Product[] | null>(null);
  const productsCacheAtRef = useRef<number>(0);
  const lastSeenSkuRef = useRef<string | null>(null);
  const continuousRef = useRef<boolean>(true);

  const [supported, setSupported] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [lookup, setLookup] = useState<Lookup>({ kind: "none" });
  const [continuous, setContinuous] = useState(true);
  const [manualSku, setManualSku] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Feature detection on mount.
  useEffect(() => {
    const ok =
      typeof window !== "undefined" && typeof window.BarcodeDetector === "function";
    setSupported(ok);
    if (!ok) setMode({ kind: "unsupported" });
  }, []);

  // Keep ref in sync so the RAF loop sees the latest setting without restart.
  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  // Stop the camera on unmount — battery critical.
  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Cached product list (5 min TTL).
  const getCachedProducts = useCallback(async (): Promise<Product[]> => {
    const cached = productsCacheRef.current;
    const fresh = Date.now() - productsCacheAtRef.current < 5 * 60 * 1000;
    if (cached && fresh) return cached;
    const list = await listProducts();
    productsCacheRef.current = list;
    productsCacheAtRef.current = Date.now();
    return list;
  }, []);

  // Show a brief confirmation toast.
  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 1500);
  }

  const lookupSku = useCallback(
    async (rawSku: string) => {
      const sku = rawSku.trim();
      if (!sku) return;
      lastSeenSkuRef.current = sku;
      setLookup({ kind: "searching", sku });
      try {
        const products = await getCachedProducts();
        const match = products.find(
          (p) => p.sku.toLowerCase() === sku.toLowerCase(),
        );
        if (match) {
          setLookup({ kind: "found", product: match });
        } else {
          setLookup({ kind: "missing", sku });
        }
      } catch (e) {
        setLookup({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [getCachedProducts],
  );

  // The polling loop reads frames at SCAN_INTERVAL_MS.
  const tick = useCallback(async () => {
    rafRef.current = requestAnimationFrame(() => void tick());
    const detector = detectorRef.current;
    const video = videoRef.current;
    if (!detector || !video || video.readyState < 2) return;

    const now = performance.now();
    if (now - lastDetectAtRef.current < SCAN_INTERVAL_MS) return;
    lastDetectAtRef.current = now;

    try {
      const codes = await detector.detect(video);
      if (codes.length === 0) return;
      const sku = codes[0].rawValue;
      if (!sku) return;
      // Don't re-process while still showing the same hit, unless we are in
      // continuous mode and the user has cleared it.
      if (lastSeenSkuRef.current === sku) return;
      void lookupSku(sku);
    } catch {
      // Detection errors are noisy; ignore individual-frame failures.
    }
  }, [lookupSku]);

  const startCamera = useCallback(async () => {
    if (!supported) return;
    setMode({ kind: "starting" });
    setLookup({ kind: "none" });
    lastSeenSkuRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const Ctor = window.BarcodeDetector;
      if (!Ctor) throw new Error("BarcodeDetector ej tillgänglig");
      detectorRef.current = new Ctor({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
      });
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play().catch(() => undefined);
      }
      setMode({ kind: "running" });
      lastDetectAtRef.current = 0;
      void tick();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMode({ kind: "denied", message: msg });
      stopCamera();
    }
  }, [supported, tick, stopCamera]);

  function clearLookup() {
    setLookup({ kind: "none" });
    lastSeenSkuRef.current = null;
  }

  async function applyMovement(
    product: Product,
    type: "in" | "out" | "adjust",
    quantity: number,
  ) {
    setActionBusy(true);
    try {
      await recordMovement({
        productId: product.id,
        type,
        quantity,
        note: "Scanner",
      });
      // Update local cache so subsequent scans show the new qty.
      const next =
        type === "in"
          ? product.quantity + quantity
          : type === "out"
          ? Math.max(0, product.quantity - quantity)
          : Math.max(0, quantity);
      const cached = productsCacheRef.current;
      if (cached) {
        productsCacheRef.current = cached.map((p) =>
          p.id === product.id ? { ...p, quantity: next } : p,
        );
      }
      const sign = type === "in" ? "+" : type === "out" ? "−" : "=";
      showToast(`${sign}${quantity}  ✓`);
      if (continuousRef.current) {
        clearLookup();
      } else {
        // Reflect the new qty in-place so user sees the result.
        setLookup({
          kind: "found",
          product: { ...product, quantity: next },
        });
      }
    } catch (e) {
      setLookup({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setActionBusy(false);
    }
  }

  function handleAdjustTo(product: Product) {
    const input = window.prompt("Justera till antal:", String(product.quantity));
    if (input == null) return;
    const n = Math.floor(Number(input));
    if (!Number.isFinite(n) || n < 0) {
      setLookup({ kind: "error", message: "Ogiltigt antal" });
      return;
    }
    void applyMovement(product, "adjust", n);
  }

  function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sku = manualSku.trim();
    if (!sku) return;
    setManualSku("");
    void lookupSku(sku);
  }

  // --- Render ---

  if (supported === null) {
    return <p className="text-sm text-neutral-500">Laddar…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Camera area */}
      {supported ? (
        <div className="space-y-3">
          {mode.kind === "idle" && (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="w-full rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-4 text-base font-semibold"
            >
              Starta scanner
            </button>
          )}
          {mode.kind === "starting" && (
            <p className="text-sm text-neutral-500">Begär kameraåtkomst…</p>
          )}
          {mode.kind === "denied" && (
            <div className="rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm">
              <p className="font-medium mb-1">Kameran kunde inte startas</p>
              <p className="text-neutral-600 dark:text-neutral-400">
                {mode.message}
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="mt-2 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm"
              >
                Försök igen
              </button>
            </div>
          )}

          <div
            className={`relative aspect-video w-full overflow-hidden rounded-lg bg-black ${
              mode.kind === "running" ? "" : "hidden"
            }`}
          >
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
            {toast && (
              <div className="absolute inset-x-0 top-3 flex justify-center">
                <span className="rounded-full bg-emerald-600 px-4 py-1 text-sm font-medium text-white shadow">
                  {toast}
                </span>
              </div>
            )}
          </div>

          {mode.kind === "running" && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => setContinuous(e.target.checked)}
                />
                Kontinuerlig scanning
              </label>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setMode({ kind: "idle" });
                  clearLookup();
                }}
                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5"
              >
                Stoppa kamera
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
          Kameran stöds inte i den här webbläsaren. Använd manuell inmatning
          nedan.
        </div>
      )}

      {/* Result card */}
      <ResultCard
        lookup={lookup}
        tenant={tenant}
        busy={actionBusy}
        onIn={(p) => void applyMovement(p, "in", 1)}
        onOut={(p) => void applyMovement(p, "out", 1)}
        onAdjust={(p) => handleAdjustTo(p)}
        onClear={clearLookup}
      />

      {/* Manual fallback / supplement */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label
          htmlFor="manual-sku"
          className="block text-sm font-medium"
        >
          Eller skriv in SKU
        </label>
        <div className="flex gap-2">
          <input
            id="manual-sku"
            type="text"
            value={manualSku}
            onChange={(e) => setManualSku(e.target.value)}
            placeholder="t.ex. ABC-123"
            className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            Sök
          </button>
        </div>
      </form>
    </div>
  );
}

function ResultCard({
  lookup,
  tenant,
  busy,
  onIn,
  onOut,
  onAdjust,
  onClear,
}: {
  lookup: Lookup;
  tenant: string;
  busy: boolean;
  onIn: (p: Product) => void;
  onOut: (p: Product) => void;
  onAdjust: (p: Product) => void;
  onClear: () => void;
}) {
  if (lookup.kind === "none") return null;

  if (lookup.kind === "searching") {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm text-neutral-500">
        Söker SKU {lookup.sku}…
      </div>
    );
  }

  if (lookup.kind === "error") {
    return (
      <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <p>{lookup.message}</p>
          <button
            type="button"
            onClick={onClear}
            className="text-xs underline"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }

  if (lookup.kind === "missing") {
    return (
      <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
        <p className="text-sm">
          SKU <span className="font-mono">{lookup.sku}</span> hittades inte
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/${tenant}/products/new/?sku=${encodeURIComponent(lookup.sku)}`}
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5 text-sm font-medium"
          >
            Skapa produkt
          </Link>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-neutral-500 hover:underline"
          >
            Avfärda
          </button>
        </div>
      </div>
    );
  }

  const product = lookup.product;
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-4">
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="h-16 w-16 shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-400"
        >
          ingen bild
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${tenant}/product/?id=${product.id}`}
            className="text-base font-semibold hover:underline"
          >
            {product.name}
          </Link>
          <p className="text-xs font-mono text-neutral-500 mt-0.5">
            {product.sku}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">
            {product.quantity}
          </div>
          <div className="text-xs text-neutral-500">i lager</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onIn(product)}
          disabled={busy}
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-3 text-sm font-semibold disabled:opacity-50"
        >
          Inleverans +1
        </button>
        <button
          type="button"
          onClick={() => onOut(product)}
          disabled={busy}
          className="rounded-md bg-red-600 hover:bg-red-700 text-white px-3 py-3 text-sm font-semibold disabled:opacity-50"
        >
          Uttag −1
        </button>
        <button
          type="button"
          onClick={() => onAdjust(product)}
          disabled={busy}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-3 text-sm font-semibold disabled:opacity-50"
        >
          Justera till…
        </button>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-neutral-500 hover:underline"
      >
        Avfärda
      </button>
    </div>
  );
}
