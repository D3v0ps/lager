export const LOCALE = "sv-SE";
export const CURRENCY = "SEK";
export const TIME_ZONE = "Europe/Stockholm";

const currency = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dateOnly = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return currency.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return dateTime.format(new Date(value));
}

export function formatDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateOnly.format(typeof value === "string" ? new Date(value) : value);
}

export function todayInStockholmISO(): string {
  return dateOnly.format(new Date());
}

export function movementLabel(type: "in" | "out" | "adjust"): string {
  switch (type) {
    case "in":
      return "Inleverans";
    case "out":
      return "Uttag";
    case "adjust":
      return "Justering";
  }
}
