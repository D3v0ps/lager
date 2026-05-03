"use client";

import { statusLabel, type PurchaseOrderStatus } from "@/lib/suppliers";

const COLOR: Record<PurchaseOrderStatus, string> = {
  draft:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  received:
    "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  cancelled:
    "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function StatusBadge({
  status,
}: {
  status: PurchaseOrderStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLOR[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
