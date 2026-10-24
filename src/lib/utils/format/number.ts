export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : String(odds);
}

export function formatUnits(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    signDisplay: "exceptZero",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPlainUnits(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    signDisplay: "exceptZero",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPlainPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
}

export function formatShortUnits(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    signDisplay: "exceptZero",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRecord(record: {
  wins: number;
  losses: number;
  pushes: number;
}): string {
  return `${record.wins}-${record.losses}-${record.pushes}`;
}
