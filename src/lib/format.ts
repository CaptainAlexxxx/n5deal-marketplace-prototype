const eur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const compactEur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatEur(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return eur.format(value);
}

export function formatEurCompact(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return compactEur.format(value);
}

export function formatRange(min: number, max: number) {
  return `${compactEur.format(min)} - ${compactEur.format(max)}`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** ISO 3166-1 alpha-2 to the regional-indicator pair that renders as a flag. */
export function flagOf(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
