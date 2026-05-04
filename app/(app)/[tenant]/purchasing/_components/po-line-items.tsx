"use client";

import { useMemo, useState } from "react";

import type { Product } from "@/lib/database.types";
import { formatPrice } from "@/lib/format";

export type Line = {
  // Local key for React reconciliation; not persisted.
  key: string;
  product_id: string;
  // Cached product info for the row (for display + autocomplete UX).
  product_label: string;
  product_sku: string;
  quantity: number;
  unit_cost: number;
};

type Props = {
  products: Product[];
  lines: Line[];
  setLines: (next: Line[]) => void;
};

const inputClass =
  "w-full rounded-md border border-white/15 bg-background-elevated/40 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500";

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `l${Date.now().toString(36)}-${counter}`;
}

export default function PoLineItems({ products, lines, setLines }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const usedIds = useMemo(
    () => new Set(lines.map((l) => l.product_id)),
    [lines],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !usedIds.has(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      })
      .slice(0, 50);
  }, [products, usedIds, search]);

  function addProduct(p: Product) {
    setLines([
      ...lines,
      {
        key: nextKey(),
        product_id: p.id,
        product_label: p.name,
        product_sku: p.sku,
        quantity: 1,
        unit_cost: p.unit_price,
      },
    ]);
    setSearch("");
    setPickerOpen(false);
  }

  function removeLine(key: string) {
    setLines(lines.filter((l) => l.key !== key));
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  const total = lines.reduce(
    (acc, l) => acc + l.quantity * Number(l.unit_cost || 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-background-elevated/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Produkt</th>
                <th className="px-3 py-2 font-medium w-24 text-right">
                  Antal
                </th>
                <th className="px-3 py-2 font-medium w-32 text-right">
                  Á-pris
                </th>
                <th className="px-3 py-2 font-medium w-28 text-right">
                  Radsumma
                </th>
                <th className="px-3 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-sm text-neutral-500"
                  >
                    Inga rader tillagda än.
                  </td>
                </tr>
              ) : (
                lines.map((l) => {
                  const product = productById.get(l.product_id);
                  const subTotal = l.quantity * Number(l.unit_cost || 0);
                  return (
                    <tr
                      key={l.key}
                      className="border-t border-white/10"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {product?.name ?? l.product_label}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono">
                          {product?.sku ?? l.product_sku}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(l.key, {
                              quantity: Math.max(
                                1,
                                Math.floor(Number(e.target.value) || 1),
                              ),
                            })
                          }
                          className={`${inputClass} text-right`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.unit_cost}
                          onChange={(e) =>
                            updateLine(l.key, {
                              unit_cost: Math.max(
                                0,
                                Number(e.target.value) || 0,
                              ),
                            })
                          }
                          className={`${inputClass} text-right`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatPrice(subTotal)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(l.key)}
                          aria-label="Ta bort rad"
                          className="text-red-400 hover:underline text-xs"
                        >
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {lines.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/10 bg-neutral-50 dark:bg-neutral-800/40">
                  <td colSpan={3} className="px-3 py-2 text-right font-medium">
                    Totalt
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatPrice(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {pickerOpen ? (
        <div className="rounded-lg border border-white/10 bg-background-elevated/40 p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök på namn eller SKU"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setSearch("");
              }}
              className="rounded-md border border-white/15 px-3 py-1 text-sm hover:bg-white/[0.05]"
            >
              Stäng
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 px-1 py-2">
              Inga produkter att visa.
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-white/5">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-2 py-2 hover:bg-white/[0.03] flex items-center justify-between gap-3"
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        {p.name}
                      </span>
                      <span className="block text-xs text-neutral-500 font-mono">
                        {p.sku}
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      Lager: {p.quantity}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05]"
          >
            + Lägg till produkt
          </button>
        </div>
      )}
    </div>
  );
}

export function lineFromSuggestion(args: {
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
}): Line {
  return {
    key: nextKey(),
    product_id: args.product_id,
    product_label: args.name,
    product_sku: args.sku,
    quantity: args.quantity,
    unit_cost: args.unit_cost,
  };
}
