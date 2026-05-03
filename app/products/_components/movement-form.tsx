"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  currentQuantity: number;
};

export function MovementForm({ action, currentQuantity }: Props) {
  const [type, setType] = useState<"in" | "out" | "adjust">("in");

  return (
    <form
      action={action}
      className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="type">
            Typ
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          >
            <option value="in">Inleverans (+)</option>
            <option value="out">Uttag (-)</option>
            <option value="adjust">Justera till</option>
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="quantity"
          >
            {type === "adjust" ? "Nytt antal" : "Antal"}
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={type === "adjust" ? 0 : 1}
            step={1}
            required
            defaultValue={type === "adjust" ? currentQuantity : 1}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="note">
            Anteckning
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="Valfritt"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium"
      >
        Registrera
      </button>
    </form>
  );
}
