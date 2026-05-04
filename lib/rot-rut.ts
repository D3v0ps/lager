// ROT/RUT-avdrag — Swedish tax-deduction logic for Saldo Bygg quotes.
//
// Rules per Skatteverket as of 2026:
//   * ROT (renoverings-, ombyggnads-, tillbyggnadsarbete): 50 % deduction
//     on labour (arbetskostnad). Material is NOT deductible. Cap per
//     person: 75 000 kr/year.
//   * RUT (rengöring, underhåll, tvätt etc.): 50 % deduction on labour.
//     Cap per person: 75 000 kr/year (combined with ROT).
//   * Both apply to the labour portion ONLY — material lines are excluded.
//
// We compute the deductible amount per quote item: sum of (qty * unit_price *
// vat_factor) for items flagged `deductible`. Half of that is the ROT/RUT
// deduction the customer claims; the customer pays the remainder.

export type DeductionType = "rot" | "rut" | null;

export type QuoteItem = {
  kind: "work" | "material" | "fixed";
  quantity: number;
  unit_price_cents: number;
  vat_rate: number; // percent, e.g. 25
  deductible: boolean;
};

export type QuoteTotals = {
  subtotal_cents: number;     // before VAT
  vat_cents: number;
  total_cents: number;        // inkl moms
  deductible_cents: number;   // labour eligible for deduction (inkl moms)
  deduction_cents: number;    // 50 % of deductible (the actual ROT/RUT)
  customer_pays_cents: number; // total - deduction
};

const DEDUCTION_RATE = 0.5;

export function computeQuoteTotals(
  items: QuoteItem[],
  deductionType: DeductionType,
): QuoteTotals {
  let subtotal = 0;
  let vat = 0;
  let deductible = 0; // inkl moms

  for (const it of items) {
    const lineSubtotal = it.quantity * it.unit_price_cents;
    const lineVat = lineSubtotal * (it.vat_rate / 100);
    const lineTotal = lineSubtotal + lineVat;
    subtotal += lineSubtotal;
    vat += lineVat;
    if (deductionType && it.deductible) {
      deductible += lineTotal;
    }
  }

  const total = subtotal + vat;
  const deduction = deductionType ? deductible * DEDUCTION_RATE : 0;
  const customerPays = total - deduction;

  return {
    subtotal_cents: Math.round(subtotal),
    vat_cents: Math.round(vat),
    total_cents: Math.round(total),
    deductible_cents: Math.round(deductible),
    deduction_cents: Math.round(deduction),
    customer_pays_cents: Math.round(customerPays),
  };
}

export function deductionLabel(type: DeductionType): string {
  switch (type) {
    case "rot": return "ROT-avdrag";
    case "rut": return "RUT-avdrag";
    default: return "Inget avdrag";
  }
}

export function defaultDeductibleForKind(
  kind: QuoteItem["kind"],
): boolean {
  // 'work' (arbetskostnad) is deductible by default; material isn't;
  // 'fixed' (klumpsumma) defaults to non-deductible since the labour/
  // material split is unknown.
  return kind === "work";
}

export function formatCents(cents: number): string {
  const sek = cents / 100;
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
  }).format(sek);
}
