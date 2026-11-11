import type { Confidence } from "@/lib/api/client";

const BOOKS: Record<string, string> = {
  ubuk: "Unibet UK",
  gruk: "Grosvenor",
  betuk: "BetUK",
  betmgmuk: "BetMGM UK",
  quinnbetuk: "QuinnBet",
  virginbetuk: "Virgin Bet",
  ladbrokes: "Ladbrokes",
  coral: "Coral",
  paddypower: "Paddy Power",
  betfairsb: "Betfair Sportsbook",
  betfair_ex: "Betfair Exchange",
  smarkets: "Smarkets",
  williamhill: "William Hill",
  skybet: "Sky Bet",
  betway: "Betway",
  betvictor: "BetVictor",
  "888sport": "888sport",
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  kalshi: "Kalshi",
  polymarket: "Polymarket",
  matchbook: "Matchbook",
  betdaq: "Betdaq",
  cloudbet: "Cloudbet",
  betsson: "Betsson",
  betsafe: "Betsafe",
  nordicbet: "NordicBet",
  pinnacle: "Pinnacle",
};

export function bookName(code: string): string {
  return BOOKS[code] ?? code;
}

type Selectable = {
  market: string;
  side: string;
  line?: string | null;
  home: string;
  away: string;
};

function signed(line: number): string {
  return line > 0 ? `+${line}` : String(line);
}

export function sideName(sel: Selectable): string {
  const line = Number(sel.line);
  if (sel.market === "total") return `${sel.side === "over" ? "Over" : "Under"} ${line}`;
  if (sel.side === "draw") return "Draw";
  const team = sel.side === "home" ? sel.home : sel.away;
  if (sel.market === "asian_handicap") return `${team} ${signed(sel.side === "home" ? line : -line)}`;
  return team;
}

export function marketName(sel: { market: string; period: string; line?: string | null }): string {
  const period = sel.period === "first_half" ? ", 1st half" : "";
  if (sel.market === "three_way") return `Match result${period}`;
  if (sel.market === "total") return `Total goals ${Number(sel.line)}${period}`;
  if (sel.market === "asian_handicap") return `Asian handicap ${signed(Number(sel.line))}${period}`;
  return `Moneyline${period}`;
}

export function percent(x: number, digits = 1): string {
  return `${x >= 0 ? "+" : ""}${(x * 100).toFixed(digits)}%`;
}

export function prob(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

export function odds(x: string | number): string {
  return Number(x).toFixed(2);
}

export function money(x: number): string {
  return x.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

export function until(iso: string, now: number): string {
  const mins = Math.round((new Date(iso).getTime() - now) / 60000);
  if (mins < 0) return "started";
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

export function ago(iso: string, now: number): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 90) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 90) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
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

export function day(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export function time(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export const CONFIDENCE_HINT: Record<Confidence, string> = {
  high: "Pinnacle takes 1,000+ on this market",
  medium: "Pinnacle takes 500 to 1,000",
  low: "Thin sharp market, fair price less certain",
  check: "EV too high to trust, likely a stale price",
};

// Kelly stake as a share of bankroll; negative edges stake nothing.
export function kelly(decimalOdds: number, probability: number, fraction: number): number {
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  return Math.max(0, ((b * probability - (1 - probability)) / b) * fraction);
}

export function query(base: string, params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}
