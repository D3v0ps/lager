"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import {
  getQuote,
  quoteStatusLabel,
  quoteStatusTone,
  updateQuoteStatus,
  type QuoteWithItems,
} from "@/lib/quotes";
import { formatCents, deductionLabel } from "@/lib/rot-rut";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";

export default function Page() {
  return (
    <Suspense fallback={<SkeletonRows rows={6} className="h-12" />}>
      <QuoteDetail />
    </Suspense>
  );
}

function QuoteDetail() {
  const { tenant } = useParams<{ tenant: string }>();
  const search = useSearchParams();
  const id = search.get("id");
  const [quote, setQuote] = useState<QuoteWithItems | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setQuote(await getQuote(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!id) {
    return (
      <ErrorPage title="Inget anbuds-ID" message="Hittade inte anbudet." />
    );
  }
  if (error) {
    return <ErrorPage title="Kunde inte hämta anbud" message={error} retry={reload} />;
  }
  if (!quote) return <SkeletonRows rows={6} className="h-12" />;

  const acceptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/q/?token=${quote.accept_token}`;

  async function copyLink() {
    if (typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(acceptUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function send() {
    if (!quote) return;
    setBusy(true);
    try {
      await updateQuoteStatus(quote.id, "sent");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const labour = quote.quote_items.filter((it) => it.kind === "work");
  const material = quote.quote_items.filter((it) => it.kind === "material");
  const fixed = quote.quote_items.filter((it) => it.kind === "fixed");

  return (
    <div className="space-y-6">
      <Link
        href={`/${tenant}/quotes/`}
        className="text-sm text-foreground-muted hover:text-foreground"
      >
        ← Alla anbud
      </Link>
      <PageHeader
        eyebrow={quote.reference ?? "Anbud"}
        title={quote.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill tone={quoteStatusTone(quote.status)} size="sm">
              {quoteStatusLabel(quote.status)}
            </StatusPill>
            {quote.customers && (
              <span className="text-foreground-muted">
                · {quote.customers.name}
              </span>
            )}
            {quote.deduction_type && (
              <span className="text-foreground-muted">
                · {deductionLabel(quote.deduction_type)}
              </span>
            )}
          </span>
        }
        actions={
          quote.status === "draft" ? (
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
            >
              {busy ? "Markerar…" : "Markera som skickat"}
            </button>
          ) : null
        }
      />

      <Card variant="elevated">
        <CardHeader
          title="Kundens accept-länk"
          subtitle="Skicka denna länk till kunden — de kan godkänna utan att logga in"
        />
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-3 sm:items-center">
          <code className="flex-1 font-mono text-xs text-foreground-muted truncate rounded-md bg-background px-3 py-2 border border-white/5">
            {acceptUrl}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05] shrink-0"
          >
            {copied ? "Kopierad ✓" : "Kopiera länk"}
          </button>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
          <Stat label="Subtotal" value={formatCents(quote.subtotal_cents)} />
          <Stat label="Moms" value={formatCents(quote.vat_cents)} />
          <Stat label="Total inkl moms" value={formatCents(quote.total_cents)} />
          {quote.deduction_type ? (
            <Stat
              label={`Kund betalar`}
              value={formatCents(quote.customer_pays_cents)}
              hint={`${formatCents(quote.deduction_cents)} ${quote.deduction_type.toUpperCase()}-avdrag`}
              emphasis
            />
          ) : (
            <Stat
              label="Kund betalar"
              value={formatCents(quote.total_cents)}
            />
          )}
        </div>
      </Card>

      {quote.description && (
        <Card>
          <CardHeader title="Beskrivning" />
          <p className="px-5 py-4 text-sm whitespace-pre-wrap leading-relaxed text-foreground/85">
            {quote.description}
          </p>
        </Card>
      )}

      {labour.length > 0 && (
        <ItemsTable title="Arbete" items={labour} />
      )}
      {material.length > 0 && (
        <ItemsTable title="Material" items={material} />
      )}
      {fixed.length > 0 && (
        <ItemsTable title="Klumpsumma" items={fixed} />
      )}

      <p className="text-xs text-foreground-muted">
        Skapat {formatDate(quote.created_at)}
        {quote.sent_at ? ` · Skickat ${formatDate(quote.sent_at)}` : ""}
        {quote.accepted_at
          ? ` · Accepterat ${formatDate(quote.accepted_at)} av ${quote.accepted_by_email}`
          : ""}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 ${emphasis ? "text-2xl" : "text-lg"} font-semibold tabular-nums tracking-tight`}
        style={
          emphasis
            ? {
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : undefined
        }
      >
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-emerald-400 mt-0.5">{hint}</p>
      )}
    </div>
  );
}

function ItemsTable({
  title,
  items,
}: {
  title: string;
  items: QuoteWithItems["quote_items"];
}) {
  const total = items.reduce(
    (acc, it) => acc + it.quantity * it.unit_price_cents,
    0,
  );
  return (
    <Card>
      <CardHeader title={title} subtitle={formatCents(total)} />
      <DataTable>
        <TableHead>
          <Th>Beskrivning</Th>
          <Th align="right">Antal</Th>
          <Th align="right">À-pris</Th>
          <Th align="right">Summa</Th>
          <Th>ROT/RUT</Th>
        </TableHead>
        <TBody>
          {items.map((it) => (
            <Tr key={it.id}>
              <Td>{it.description}</Td>
              <Td align="right">
                <span className="tabular-nums">
                  {it.quantity} {it.unit ?? ""}
                </span>
              </Td>
              <Td align="right">
                <span className="tabular-nums">
                  {formatCents(it.unit_price_cents)}
                </span>
              </Td>
              <Td align="right">
                <span className="tabular-nums">
                  {formatCents(it.quantity * it.unit_price_cents)}
                </span>
              </Td>
              <Td>
                {it.deductible ? (
                  <StatusPill tone="info" size="sm">Grund</StatusPill>
                ) : (
                  <span className="text-foreground-muted text-xs">—</span>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </DataTable>
    </Card>
  );
}
