import type { PickMarket, PickSpec, SpecSide } from "@/lib/api/typebox/picks";
import { sportGroup, type SportGroup } from "@/lib/config/sports";
import { dayjs } from "@/lib/utils/format/date";
import { SHARPAPI_BASE } from "@/server/constants";
import { serverEnv } from "@/server/env";
import { ApiError } from "@/server/errors";
import { sameParticipant, specLabel } from "@/server/odds/selection";
import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const RowSchema = Type.Object({
  sportsbook: Type.String(),
  event_id: Type.String(),
  home_team: Type.String(),
  away_team: Type.String(),
  market_type: Type.String(),
  selection: Type.String(),
  odds_decimal: Type.Number(),
  line: Type.Union([Type.Number(), Type.Null()]),
  event_start_time: Type.String(),
  is_live: Type.Boolean(),
  timestamp: Type.Optional(Type.String()),
});
type Row = Static<typeof RowSchema>;

const PageSchema = Type.Object({
  data: Type.Array(Type.Unknown()),
  pagination: Type.Object({
    has_more: Type.Boolean(),
    next_cursor: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  }),
});

// SharpAPI splits promotions into leagues; the first ones hold most events, the rest are searched only on a miss.
const LEAGUES: Partial<Record<SportGroup, readonly string[]>> = {
  mma: ["ufc", "pfl", "one_championship", "oktagon", "bkfc", "ksw"],
  boxing: ["boxing"],
};

export function sharpCovers(sportKey: string): boolean {
  const group = sportGroup(sportKey);
  return Boolean(serverEnv.sharpApiKey && group && LEAGUES[group]);
}

// The free tier allows 12 requests a minute; every call waits its turn.
const MIN_GAP_MS = 5_500;
let nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

const MAX_PAGES = 30;
// Only the markets parseRow maps; moneylines and spreads come from The Odds API.
const SHAPE_MARKET_TYPES =
  "method_of_victory,round_betting,go_the_distance,total_rounds";

async function fetchLeague(league: string): Promise<Row[]> {
  const apiKey = serverEnv.sharpApiKey;
  if (!apiKey) throw new ApiError(503, "ERRORS.MARKET_NOT_OFFERED");
  const rows: Row[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    await throttle();
    const url = new URL(`${SHARPAPI_BASE}/odds`);
    url.searchParams.set("league", league);
    url.searchParams.set("limit", "200");
    url.searchParams.set("market", SHAPE_MARKET_TYPES);
    url.searchParams.set("is_live", "false");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new ApiError(502, "ERRORS.ODDS_UNAVAILABLE");
    const body: unknown = await res.json();
    if (!Value.Check(PageSchema, body))
      throw new ApiError(502, "ERRORS.ODDS_BAD_RESPONSE");
    for (const row of body.data)
      if (Value.Check(RowSchema, row)) rows.push(row);
    if (!body.pagination.has_more || !body.pagination.next_cursor) return rows;
    cursor = body.pagination.next_cursor;
  }
  // A cut board drops whole books from later pages, so it must show up in the logs.
  console.error(`sharpapi: ${league} board cut at ${MAX_PAGES} pages`);
  return rows;
}

// Requests read this cache only; startSharpRefresh keeps it warm so nobody waits on the rate limit.
const leagueCache = new Map<string, { fetchedAt: number; rows: Row[] }>();
const inFlight = new Map<string, Promise<Row[]>>();

async function refreshLeague(league: string): Promise<Row[]> {
  const running = inFlight.get(league);
  if (running) return running;
  const job = fetchLeague(league)
    .then((rows) => {
      leagueCache.set(league, { fetchedAt: Date.now(), rows });
      return rows;
    })
    .finally(() => inFlight.delete(league));
  inFlight.set(league, job);
  return job;
}

// The main promotion of each sport moves fast in fight week; the rest rarely change.
const MAIN_REFRESH_MS = 2 * 60_000;
const OTHER_REFRESH_MS = 15 * 60_000;
// Older than this and a cached price no longer counts for a pick.
const MAX_CAPTURE_AGE_MS = 5 * 60_000;

let refreshing = false;

export function startSharpRefresh() {
  if (refreshing || !serverEnv.sharpApiKey) return;
  refreshing = true;
  for (const leagues of Object.values(LEAGUES)) {
    leagues?.forEach((league, i) => {
      const every = i === 0 ? MAIN_REFRESH_MS : OTHER_REFRESH_MS;
      const run = () =>
        refreshLeague(league).catch((error) =>
          console.error(`sharpapi: ${league} refresh failed`, error),
        );
      void run();
      setInterval(run, every).unref?.();
    });
  }
}

async function leagueRows(league: string): Promise<Row[]> {
  const hit = leagueCache.get(league);
  if (hit) return hit.rows;
  return refreshLeague(league);
}

export function leagueAgeMs(league: string): number {
  const hit = leagueCache.get(league);
  return hit ? Date.now() - hit.fetchedAt : Number.POSITIVE_INFINITY;
}

export type ShapeEvent = {
  sportKey: string;
  home: string;
  away: string;
  commenceTime: Date;
};

export type Offer = {
  market: PickMarket;
  spec: PickSpec;
  label: string;
  point: number | null;
  bookmaker: string;
  oddsDecimal: number;
  // When the feed last saw this price.
  observedAt: Date;
  // A cached price this old may be shown but not taken for a pick.
  capturable: boolean;
};

const MATCH_WINDOW_HOURS = 36;

function sameEvent(row: Row, event: ShapeEvent): boolean {
  const start = dayjs(row.event_start_time);
  if (
    Math.abs(start.diff(event.commenceTime, "hour", true)) > MATCH_WINDOW_HOURS
  )
    return false;
  const names = [row.home_team, row.away_team];
  return (
    names.some((n) => sameParticipant(n, event.home)) &&
    names.some((n) => sameParticipant(n, event.away))
  );
}

// Book wording for a result class; the classes themselves come from the sport shape.
const METHOD_WORDS: Record<string, string> = {
  ko: "ko",
  tko: "ko",
  dq: "dq",
  submission: "submission",
  sub: "submission",
  points: "decision",
  decision: "decision",
};

function methodsOf(text: string): string[] | null {
  const words = text
    .toLowerCase()
    .split(/[/,]| or /)
    .map((w) => w.trim());
  const methods = words.map((w) => METHOD_WORDS[w]);
  if (methods.some((m) => m === undefined)) return null;
  return [...new Set(methods)];
}

type Parsed = { market: PickMarket; spec: PickSpec; point: number | null };

function spec(side: SpecSide, methods: string[] | null, period: number | null) {
  return { side, methods, period };
}

// Maps one book row onto a family and spec; null for markets we do not offer or wording we do not understand.
function parseRow(row: Row, event: ShapeEvent): Parsed | null {
  const sel = row.selection.trim();
  const lower = sel.toLowerCase();
  const sideOf = (name: string): SpecSide | null =>
    sameParticipant(name, event.home)
      ? "home"
      : sameParticipant(name, event.away)
        ? "away"
        : null;

  if (row.market_type === "go_the_distance") {
    if (lower === "yes")
      return { market: "distance", spec: spec("yes", null, null), point: null };
    if (lower === "no")
      return { market: "distance", spec: spec("no", null, null), point: null };
    return null;
  }

  if (row.market_type === "total_rounds") {
    if (row.line === null || (lower !== "over" && lower !== "under"))
      return null;
    const side = lower === "over" ? "over" : "under";
    return { market: "totals", spec: spec(side, null, null), point: row.line };
  }

  if (
    row.market_type === "method_of_victory" ||
    row.market_type === "round_betting"
  ) {
    if (lower === "draw") {
      const market =
        row.market_type === "method_of_victory" ? "method" : "period_win";
      return { market, spec: spec("draw", null, null), point: null };
    }
    if (lower === "to go the distance")
      return { market: "distance", spec: spec("yes", null, null), point: null };

    const inRound = sel.match(/^(.+?) to win(?: by (.+?))? in round (\d+)$/i);
    if (inRound) {
      const side = sideOf(inRound[1]);
      const methods = inRound[2] ? methodsOf(inRound[2]) : null;
      if (!side || (inRound[2] && !methods)) return null;
      return {
        market: "period_win",
        spec: spec(side, methods, Number(inRound[3])),
        point: null,
      };
    }
    const toWinBy = sel.match(/^(.+?) to win by (.+)$/i);
    if (toWinBy) {
      const side = sideOf(toWinBy[1]);
      const methods = methodsOf(toWinBy[2]);
      if (!side || !methods) return null;
      return {
        market: "period_win",
        spec: spec(side, methods, null),
        point: null,
      };
    }
    const by = sel.match(/^(.+?) by (.+)$/i);
    if (by) {
      const side = sideOf(by[1]);
      const methods = methodsOf(by[2]);
      if (!side || !methods) return null;
      return { market: "method", spec: spec(side, methods, null), point: null };
    }
    const either = methodsOf(sel);
    if (either)
      return { market: "method", spec: spec("any", either, null), point: null };
  }
  return null;
}

// A believable single price; multi outcome markets carry too much margin for an overround check.
const MIN_PRICE = 1.01;
const MAX_PRICE = 1001;

export async function shapeOffers(event: ShapeEvent): Promise<Offer[]> {
  const group = sportGroup(event.sportKey);
  const leagues = (group && LEAGUES[group]) || [];
  for (const league of leagues) {
    const rows = (await leagueRows(league)).filter(
      (row) => !row.is_live && sameEvent(row, event),
    );
    if (rows.length === 0) continue;
    const capturable = leagueAgeMs(league) <= MAX_CAPTURE_AGE_MS;
    return rows.flatMap((row): Offer[] => {
      const parsed = parseRow(row, event);
      if (!parsed) return [];
      if (row.odds_decimal < MIN_PRICE || row.odds_decimal > MAX_PRICE)
        return [];
      const label =
        parsed.market === "totals"
          ? parsed.spec.side === "over"
            ? "Over"
            : "Under"
          : specLabel({ ...event, market: parsed.market, spec: parsed.spec });
      if (!label) return [];
      const seen = dayjs(row.timestamp);
      return [
        {
          ...parsed,
          label,
          bookmaker: row.sportsbook,
          oddsDecimal: row.odds_decimal,
          observedAt: seen.isValid() ? seen.toDate() : new Date(),
          capturable,
        },
      ];
    });
  }
  return [];
}
