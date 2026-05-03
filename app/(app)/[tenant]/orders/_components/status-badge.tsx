"use client";

import {
  statusBadgeClasses,
  statusLabel,
  type OrderStatus,
} from "@/lib/orders";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}
