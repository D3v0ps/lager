const currency = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return currency.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return dateTime.format(new Date(value));
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
