"use client";

import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/app/_components/ui";

export default function PublicApplyLinkSection({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const url = origin ? `${origin}/${slug}/portal/apply/` : "";

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers / iframes — fall back to selecting the input.
      const input = document.getElementById(
        "public-apply-url",
      ) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title="Publik ansökningslänk"
        subtitle="Dela denna länk på er hemsida, i mejlsignaturer eller i sociala kanaler — nya kunder kan ansöka utan att logga in."
      />
      <div className="px-5 sm:px-6 py-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="public-apply-url"
            type="text"
            readOnly
            value={url}
            placeholder="Laddar…"
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Publik ansökningslänk"
            className="flex-1 min-w-0 rounded-md border border-white/10 bg-background-elevated/60 px-3 py-2 text-sm font-mono text-foreground/90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-white/20 transition-colors"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!url}
            aria-live="polite"
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              copied
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {copied ? "Kopierad ✓" : "Kopiera länk"}
          </button>
        </div>
        <p className="text-xs text-foreground-muted">
          Inkomna ansökningar dyker upp under fliken{" "}
          <span className="text-foreground">Ansökningar</span>. Godkänner du
          en ansökan skapas en kund och en inloggningslänk skickas
          automatiskt.
        </p>
      </div>
    </Card>
  );
}
