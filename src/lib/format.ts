import type { ValueBet } from "@/lib/api/client";

const BOOKS: Record<string, string> = {
  ubuk: "Unibet UK",
  gruk: "Grosvenor",
  betuk: "BetUK",
  betmgmuk: "BetMGM UK",
  quinnbetuk: "QuinnBet",
  virginbetuk: "Virgin Bet",
  pinnacle: "Pinnacle",
};

export function bookName(code: string): string {
  return BOOKS[code] ?? code;
}

export function selection(bet: ValueBet): string {
  if (bet.market === "total") {
    const side = bet.side === "over" ? "Over" : "Under";
    return `${side} ${Number(bet.line)} goals`;
  }
  if (bet.side === "draw") return "Draw";
  return bet.side === "home" ? bet.home : bet.away;
}

export function marketName(bet: ValueBet): string {
  const period = bet.period === "first_half" ? " (1st half)" : "";
  if (bet.market === "three_way") return `Match result${period}`;
  if (bet.market === "total") return `Total goals${period}`;
  if (bet.market === "asian_handicap") return `Asian handicap${period}`;
  return `Moneyline${period}`;
}

export function percent(x: number, digits = 1): string {
  return `${x >= 0 ? "+" : ""}${(x * 100).toFixed(digits)}%`;
}

export function odds(x: string): string {
  return Number(x).toFixed(2);
}

export function until(iso: string, now: number): string {
  const mins = Math.round((new Date(iso).getTime() - now) / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

export function ago(iso: string, now: number): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 90) return `${secs}s ago`;
  return `${Math.round(secs / 60)}m ago`;
}

export function kickoff(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

// One selection across every book that has value on it, best price first.
export type GroupedBet = {
  key: string;
  best: ValueBet;
  offers: ValueBet[];
};

export function groupBets(bets: ValueBet[]): GroupedBet[] {
  const groups = new Map<string, GroupedBet>();
  for (const b of bets) {
    const key = [b.home, b.away, b.starts_at, b.market, b.period, b.line ?? "", b.side].join("|");
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
