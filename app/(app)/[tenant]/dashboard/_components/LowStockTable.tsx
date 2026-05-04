"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import type { Product } from "@/lib/database.types";
import {
  Card,
  CardHeader,
  DataTable,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";

type Props = {
  products: Product[];
};

export default function LowStockTable({ products }: Props) {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <Card>
      <CardHeader
        title="Lågt saldo"
        subtitle={`${products.length} ${products.length === 1 ? "artikel" : "artiklar"} under reorder-punkten`}
        actions={
          products.length > 0 ? (
            <Link
              href={`/${tenant}/purchasing/new/`}
              className="text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              Skapa inköpsorder →
            </Link>
          ) : null
        }
      />
      {products.length === 0 ? (
        <p className="px-5 py-8 text-sm text-foreground-muted text-center">
          Inget under reorder-punkten just nu.
        </p>
      ) : (
        <DataTable>
          <TableHead>
            <Th>SKU</Th>
            <Th>Produkt</Th>
            <Th align="right">Saldo</Th>
            <Th align="right">Reorder</Th>
          </TableHead>
          <TBody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <code className="text-[11px] font-mono text-foreground-muted">
                    {p.sku}
                  </code>
                </Td>
                <Td>
                  <Link
                    href={`/${tenant}/product/?id=${p.id}`}
                    className="text-sm hover:text-amber-400 transition-colors"
                  >
                    {p.name}
                  </Link>
                </Td>
                <Td align="right">
                  <span className="inline-flex items-center gap-2">
                    <StatusPill tone={p.quantity === 0 ? "error" : "low"} size="sm">
                      {p.quantity === 0 ? "slut" : "lågt"}
                    </StatusPill>
                    <span className="tabular-nums font-medium w-8 text-right">
                      {p.quantity}
                    </span>
                  </span>
                </Td>
                <Td align="right">
                  <span className="tabular-nums text-foreground-muted">
                    {p.reorder_point}
                  </span>
                </Td>
              </Tr>
            ))}
          </TBody>
        </DataTable>
      )}
    </Card>
  );
}
