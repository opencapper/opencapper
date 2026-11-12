import type { Confidence } from "@/lib/api/client";
import type { useTranslations } from "next-intl";

// Server pages pass getTranslations(), client components useTranslations(); both fit this shape.
export type Translate = ReturnType<typeof useTranslations<never>>;

// Times follow the UK books the board is built from, not the server clock.
const ZONE = "Europe/London";

// Plain "en" formats US style (12 hour clock, month first); the board is British.
function intl(locale: string): string {
  return locale === "en" ? "en-GB" : locale;
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

export function sideName(sel: Selectable, t: Translate): string {
  const line = Number(sel.line);
  if (sel.market === "total")
    return sel.side === "over"
      ? t("FORMAT.SIDE.OVER", { line: String(line) })
      : t("FORMAT.SIDE.UNDER", { line: String(line) });
  if (sel.side === "draw") return t("FORMAT.SIDE.DRAW");
  const team = sel.side === "home" ? sel.home : sel.away;
  if (sel.market === "asian_handicap")
    return `${team} ${signed(sel.side === "home" ? line : -line)}`;
  return team;
}

export function marketName(
  sel: { market: string; period: string; line?: string | null },
  t: Translate,
): string {
  const line = signed(Number(sel.line));
  const name =
    sel.market === "three_way"
      ? t("FORMAT.MARKET.THREE_WAY")
      : sel.market === "total"
        ? t("FORMAT.MARKET.TOTAL", { line: String(Number(sel.line)) })
        : sel.market === "asian_handicap"
          ? t("FORMAT.MARKET.ASIAN_HANDICAP", { line })
          : t("FORMAT.MARKET.TWO_WAY");
  return sel.period === "first_half"
    ? t("FORMAT.MARKET.FIRST_HALF", { market: name })
    : name;
}

export function matchup(home: string, away: string, t: Translate): string {
  return t("FORMAT.MATCHUP", { home, away });
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

export function money(x: number, locale: string): string {
  return x.toLocaleString(intl(locale), { maximumFractionDigits: 0 });
}

export function count(x: number, locale: string): string {
  return x.toLocaleString(intl(locale));
}

function relative(locale: string, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  return new Intl.RelativeTimeFormat(intl(locale), { style: "narrow", numeric: "always" }).format(value, unit);
}

export function until(iso: string, now: number, locale: string, t: Translate): string {
  const mins = Math.round((new Date(iso).getTime() - now) / 60000);
  if (mins < 0) return t("FORMAT.STARTED");
  if (mins < 60) return relative(locale, mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 48) return relative(locale, hours, "hour");
  return relative(locale, Math.round(hours / 24), "day");
}

export function ago(iso: string, now: number, locale: string): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 90) return relative(locale, -secs, "second");
  const mins = Math.round(secs / 60);
  if (mins < 90) return relative(locale, -mins, "minute");
  return relative(locale, -Math.round(mins / 60), "hour");
}

export function kickoff(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intl(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONE,
  }).format(new Date(iso));
}

// Scoreboard countdown to kickoff: a running clock inside a day, the weekday and time beyond it.
export function countdown(iso: string, now: number, locale: string, t: Translate): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return t("FORMAT.STARTED");
  if (ms >= 86_400_000)
    return new Intl.DateTimeFormat(intl(locale), {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: ZONE,
    }).format(new Date(iso));
  const secs = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(secs / 3600))}:${pad(Math.floor(secs / 60) % 60)}:${pad(secs % 60)}`;
}

export function day(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intl(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZONE,
  }).format(new Date(iso));
}

export function time(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intl(locale), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONE,
  }).format(new Date(iso));
}

export const CONFIDENCE_LEVELS = ["high", "medium", "low", "check"] as const satisfies Confidence[];

export function confidenceLabel(c: Confidence, t: Translate): string {
  if (c === "high") return t("CONFIDENCE.HIGH");
  if (c === "medium") return t("CONFIDENCE.MEDIUM");
  if (c === "low") return t("CONFIDENCE.LOW");
  return t("CONFIDENCE.CHECK");
}

export function confidenceHint(c: Confidence, t: Translate): string {
  if (c === "high") return t("CONFIDENCE.HINT_HIGH");
  if (c === "medium") return t("CONFIDENCE.HINT_MEDIUM");
  if (c === "low") return t("CONFIDENCE.HINT_LOW");
  return t("CONFIDENCE.HINT_CHECK");
}

// Kelly stake as a share of bankroll; negative edges stake nothing.
export function kelly(decimalOdds: number, probability: number, fraction: number): number {
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  return Math.max(0, ((b * probability - (1 - probability)) / b) * fraction);
}

export function query(base: string, params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const entry of Object.entries(params)) if (entry[1]) q.set(entry[0], entry[1]);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

// The board's stake column when signed out: quarter Kelly on a round bankroll.
export const BANKROLL = 1000;
export const KELLY_FRACTION = 0.25;

export type StakePlan = { bankroll: number; fraction: number; currency?: string };

export const DEFAULT_PLAN: StakePlan = { bankroll: BANKROLL, fraction: KELLY_FRACTION };

export function planOf(settings: { bankroll: string; kelly_fraction: string; currency: string }): StakePlan {
  return {
    bankroll: Number(settings.bankroll),
    fraction: Number(settings.kelly_fraction),
    currency: settings.currency,
  };
}

export type BookFee = { book: string; commission?: number | null; taker_fee?: number | null };

// Mirrors the engine: exchanges take commission on net winnings, prediction markets a taker fee rate x P x (1 minus P).
export function netOdds(decimalOdds: number, fee: BookFee | undefined): number {
  if (fee?.commission) return 1 + (decimalOdds - 1) * (1 - fee.commission);
  if (fee?.taker_fee) {
    const p = 1 / decimalOdds;
    return 1 / (p + fee.taker_fee * p * (1 - p));
  }
  return decimalOdds;
}

export function feeOf(books: BookFee[] | undefined, book: string): BookFee | undefined {
  const fee = books?.find((b) => b.book === book);
  return fee && (fee.commission || fee.taker_fee) ? fee : undefined;
}

export function currency(x: number, locale: string, code: string): string {
  try {
    return new Intl.NumberFormat(intl(locale), {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(x);
  } catch {
    return `${x.toFixed(2)} ${code}`;
  }
}

// A stake you could type at a bookmaker: whole units, odd amounts get accounts flagged.
export function roundStake(x: number): number {
  return Math.max(0, Math.round(x));
}

export function suggestedStake(price: number, probability: number, fee: BookFee | undefined, plan: StakePlan): number {
  return roundStake(kelly(netOdds(price, fee), probability, plan.fraction) * plan.bankroll);
}

export function fractionLabel(fraction: number): string {
  return `${Math.round(fraction * 1000) / 10}%`;
}

export function units(x: number): string {
  return `${x > 0 ? "+" : ""}${x.toFixed(2)}`;
}

export function score(e: { home_score?: number | null; away_score?: number | null }): string | undefined {
  if (e.home_score === null || e.home_score === undefined || e.away_score === null || e.away_score === undefined)
    return undefined;
  return `${e.home_score}:${e.away_score}`;
}
