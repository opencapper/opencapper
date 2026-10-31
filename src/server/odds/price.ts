import type { PickMarket } from "@/lib/api/typebox/picks";

type Outcome = { name: string; price: number; point?: number };

// Below 1 the two sides would be a sure profit, so the quote is stale or broken.
const MIN_OVERROUND = 0.98;
// An empty exchange book leaves far apart back prices (Celtics 1.02 vs Heat 2.22 sums to 1.43).
const MAX_EXCHANGE_OVERROUND = 1.05;
const MAX_BOOKMAKER_OVERROUND = 1.15;

const EXCHANGES = new Set(["matchbook", "smarkets"]);

export function isExchange(bookmaker: string): boolean {
  return bookmaker.includes("_ex_") || EXCHANGES.has(bookmaker);
}

function lineKey(market: PickMarket, outcome: Outcome): string {
  if (market === "h2h") return "";
  const point = outcome.point ?? 0;
  return String(market === "spreads" ? Math.abs(point) : point);
}

// Keeps only outcomes whose line (both sides of a spread or total, every side of a moneyline) has a believable margin.
export function saneOutcomes<T extends Outcome>(
  bookmaker: string,
  market: PickMarket,
  outcomes: readonly T[],
): T[] {
  const max = isExchange(bookmaker)
    ? MAX_EXCHANGE_OVERROUND
    : MAX_BOOKMAKER_OVERROUND;
  const lines = Map.groupBy(outcomes, (o) => lineKey(market, o));
  return [...lines.values()].flatMap((line) => {
    if (line.length < 2) return [];
    const overround = line.reduce((sum, o) => sum + 1 / o.price, 0);
    return overround >= MIN_OVERROUND && overround <= max ? line : [];
  });
}
