import type { ValueBet } from "@/lib/api/client";

// One selection across every book that has value on it, best price first.
export type GroupedBet = {
  key: string;
  best: ValueBet;
  offers: ValueBet[];
};

export function groupBets(bets: ValueBet[]): GroupedBet[] {
  const groups = new Map<string, GroupedBet>();
  for (const b of bets) {
    const key = [b.game_id, b.market, b.period, b.line ?? "", b.side].join("|");
    const g = groups.get(key);
    if (!g) groups.set(key, { key, best: b, offers: [b] });
    else {
      g.offers.push(b);
      if (b.ev > g.best.ev) g.best = b;
    }
  }
  for (const g of groups.values()) g.offers.sort((x, y) => y.ev - x.ev);
  return [...groups.values()].sort((x, y) => y.best.ev - x.best.ev);
}
