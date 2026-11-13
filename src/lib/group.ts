import type { ValueBet, ValueBetList } from "@/lib/api/client";

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

// Low and check confidence bets are real but not what the landing page should lead with.
export function featuredGroups(bets: ValueBet[], count: number): GroupedBet[] {
  const solid = groupBets(bets.filter((b) => b.confidence === "high" || b.confidence === "medium"));
  return (solid.length > 0 ? solid : groupBets(bets)).slice(0, count);
}

// Check confidence prices are likely stale, so they never count as an edge.
export function edgeCount(list: ValueBetList | null): number {
  return list ? list.bets.filter((b) => b.confidence !== "check").length : 0;
}
