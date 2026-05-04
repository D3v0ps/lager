"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  listQuotes,
  QUOTE_STATUS_VALUES,
  quoteStatusLabel,
  quoteStatusTone,
  type QuoteListRow,
  type QuoteStatus,
} from "@/lib/quotes";
import { formatCents } from "@/lib/rot-rut";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorPage,
  PageHeader,
  SkeletonTable,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";
import { inputClass } from "@/lib/form-classes";

export default function QuotesPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [quotes, setQuotes] = useState<QuoteListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");

  useEffect(() => {
    listQuotes()
      .then(setQuotes)
      .catch((e: Error) => setError(e.message));
  }, []);

  const visible = useMemo(() => {
    if (!quotes) return [] as QuoteListRow[];
    const q = search.trim().toLowerCase();
    return quotes.filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (q) {
        const inTitle = it.title.toLowerCase().includes(q);
        const inRef = (it.reference ?? "").toLowerCase().includes(q);
        const inCust = (it.customers?.name ?? "").toLowerCase().includes(q);
        if (!inTitle && !inRef && !inCust) return false;
      }
      return true;
    });
  }, [quotes, statusFilter, search]);

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte hämta anbud"
        message={error}
        retry={() => {
          setError(null);
          listQuotes()
            .then(setQuotes)
            .catch((e: Error) => setError(e.message));
        }}
      />
    );
  }
  if (quotes === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Anbud" />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Saldo Bygg"
          title="Anbud"
          subtitle="Bygg, skicka och få godkända anbud — ROT/RUT-avdrag automatiskt."
        />
        <EmptyState
          title="Inga anbud än"
          description="Skapa ditt första anbud — kunden får en magisk länk och kan godkänna direkt."
          action={
            <Link
              href={`/${tenant}/quotes/new/`}
              className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
            >
              + Nytt anbud
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Anbud"
        subtitle={`${quotes.length} anbud totalt`}
        actions={
          <Link
            href={`/${tenant}/quotes/new/`}
            className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
          >
            + Nytt anbud
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök ref, titel eller kund"
          aria-label="Sök anbud"
          className={`${inputClass} sm:flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as QuoteStatus | "all")
          }
          aria-label="Filtrera på status"
          className={inputClass}
        >
          <option value="all">Alla statusar</option>
          {QUOTE_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {quoteStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader title={`${visible.length} av ${quotes.length}`} />
        <DataTable>
          <TableHead>
            <Th>Ref</Th>
            <Th>Titel</Th>
            <Th>Kund</Th>
            <Th>Status</Th>
            <Th align="right">Total</Th>
            <Th align="right">Kund betalar</Th>
            <Th>Skickat</Th>
          </TableHead>
          <TBody>
            {visible.map((q) => (
              <Tr key={q.id}>
                <Td>
                  <code className="font-mono text-xs">
                    {q.reference ?? q.id.slice(0, 8)}
                  </code>
                </Td>
                <Td>
                  <Link
                    href={`/${tenant}/quotes/quote/?id=${q.id}`}
                    className="hover:text-amber-400"
                  >
                    {q.title}
                  </Link>
                </Td>
                <Td>
                  {q.customers?.name ?? (
                    <span className="text-foreground-muted">—</span>
                  )}
                </Td>
                <Td>
                  <StatusPill tone={quoteStatusTone(q.status)} size="sm">
                    {quoteStatusLabel(q.status)}
                  </StatusPill>
                </Td>
                <Td align="right">
                  <span className="tabular-nums">
                    {formatCents(q.total_cents)}
                  </span>
                </Td>
                <Td align="right">
                  <span className="tabular-nums font-medium">
                    {formatCents(q.customer_pays_cents)}
                  </span>
                  {q.deduction_type && (
                    <p className="text-[10px] text-foreground-muted uppercase tracking-wider">
                      efter {q.deduction_type.toUpperCase()}
                    </p>
                  )}
                </Td>
                <Td>
                  <span className="text-foreground-muted text-xs">
                    {q.sent_at ? formatDate(q.sent_at) : "—"}
                  </span>
                </Td>
              </Tr>
            ))}
          </TBody>
        </DataTable>
      </Card>
    </div>
  );
}
