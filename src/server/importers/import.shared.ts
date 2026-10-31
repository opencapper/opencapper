import { WEB_UNITS_MAX, WEB_UNITS_MIN } from "@/lib/api/typebox/picks";
import type { ApiEvent, ApiPick } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import {
  fetchEventOdds,
  listEventStarts,
  listEvents,
  type EventStart,
} from "@/server/odds/odds.service";
import { normalise } from "@/server/odds/selection";

// Safety window: a source older than this at import time is not imported, so a stale post cannot become a pick.
export const SOURCE_MAX_AGE_HOURS = 6;
// One event odds call asks for us,eu and one market.
const CREDITS_PER_ODDS_CALL = 2;
const EVENT_START_TOLERANCE_MINUTES = 90;
// Widest gap between two sources' start times still taken as the same game; Polymarket placeholders were 7.5 hours off.
const START_CHECK_TOLERANCE_HOURS = 12;

export type ImportSkip = { ref: string; reason: string };

export type ImportReport = {
  created: ApiPick[];
  skipped: ImportSkip[];
  creditsSpent: number;
};

export function emptyReport(): ImportReport {
  return { created: [], skipped: [], creditsSpent: 0 };
}

const budget = { day: "", used: 0 };

function creditsLeft(): number {
  const day = dayjs().utc().format("YYYY-MM-DD");
  if (budget.day !== day) {
    budget.day = day;
    budget.used = 0;
  }
  return serverEnv.importOddsCreditsPerDay - budget.used;
}

// Per import cycle: one events list per sport (free) and one odds call per event and market, under the daily budget.
export function createCycle(report: ImportReport) {
  const events = new Map<string, Promise<ApiEvent[]>>();
  const starts = new Map<string, Promise<EventStart[]>>();
  const odds = new Map<string, ReturnType<typeof fetchEventOdds>>();

  const loadOdds: typeof fetchEventOdds = (input) => {
    const key = `${input.sportKey}/${input.eventId}/${input.markets.join(",")}`;
    const hit = odds.get(key);
    if (hit) return hit;
    budget.used += CREDITS_PER_ODDS_CALL;
    report.creditsSpent += CREDITS_PER_ODDS_CALL;
    const pending = fetchEventOdds(input);
    odds.set(key, pending);
    return pending;
  };

  const hasBudget = () =>
    Boolean(serverEnv.oddsApiKey) && creditsLeft() >= CREDITS_PER_ODDS_CALL;

  return {
    hasBudget,
    canSpend: (sportKey: string, eventId: string) =>
      [...odds.keys()].some((k) => k.startsWith(`${sportKey}/${eventId}/`)) ||
      hasBudget(),
    loadOdds,
    starts(sportKey: string): Promise<EventStart[]> {
      const hit = starts.get(sportKey);
      if (hit) return hit;
      const pending = serverEnv.oddsApiKey
        ? listEventStarts(sportKey).catch(() => [])
        : Promise.resolve([]);
      starts.set(sportKey, pending);
      return pending;
    },
    events(sportKey: string): Promise<ApiEvent[]> {
      const hit = events.get(sportKey);
      if (hit) return hit;
      const pending = listEvents(sportKey).catch(() => []);
      events.set(sportKey, pending);
      return pending;
    },
  };
}

export type ImportCycle = ReturnType<typeof createCycle>;

const NOISE = new Set(["fc", "cf", "afc", "sc", "ac", "the", "club", "de"]);

function tokens(name: string): string[] {
  return normalise(name)
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(" ")
    .filter((w) => w && !NOISE.has(w));
}

// "Grizzlies" matches "Memphis Grizzlies", "Ipswich Town FC" matches "Ipswich Town".
export function teamMatches(source: string, target: string): boolean {
  const a = tokens(source).join(" ");
  const b = tokens(target).join(" ");
  if (!a || !b) return false;
  if (a === b) return true;
  const contains = (outer: string, inner: string) =>
    ` ${outer} `.includes(` ${inner} `);
  return contains(a, b) || contains(b, a);
}

export async function findEvent(
  cycle: ImportCycle,
  input: { sportKey: string; teams: string[]; start: Date | null },
): Promise<ApiEvent | null> {
  const events = await cycle.events(input.sportKey);
  const matches = events.filter((event) => {
    if (
      input.start &&
      Math.abs(dayjs(event.commenceTime).diff(input.start, "minute")) >
        EVENT_START_TOLERANCE_MINUTES
    )
      return false;
    return input.teams.every(
      (team) => teamMatches(team, event.home) || teamMatches(team, event.away),
    );
  });
  return matches.length === 1 ? matches[0] : null;
}

// The Odds API start of the same game, in play or not, when exactly one listed game matches.
export async function oddsApiStart(
  cycle: ImportCycle,
  input: { sportKey: string; teams: string[]; start: Date },
): Promise<Date | null> {
  const events = await cycle.starts(input.sportKey);
  const matches = events.filter(
    (event) =>
      Math.abs(dayjs(event.commence_time).diff(input.start, "hour", true)) <=
        START_CHECK_TOLERANCE_HOURS &&
      input.teams.every(
        (team) =>
          teamMatches(team, event.home_team) ||
          teamMatches(team, event.away_team),
      ),
  );
  return matches.length === 1 ? dayjs(matches[0].commence_time).toDate() : null;
}

export function toUnits(value: number): number {
  if (!Number.isFinite(value)) return WEB_UNITS_MIN;
  const stepped = Math.round(value * 2) / 2;
  return Math.min(WEB_UNITS_MAX, Math.max(WEB_UNITS_MIN, stepped));
}
