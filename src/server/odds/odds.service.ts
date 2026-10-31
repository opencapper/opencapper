import { dayjs } from "@/lib/utils/format/date";
import { PICK_MARKETS, type PickMarket } from "@/lib/api/typebox/picks";
import type {
  ApiEvent,
  ApiEventOdds,
  ApiMarketOdds,
  OddsCredits,
} from "@/lib/types";
import { ApiError } from "@/server/errors";
import { BOOKMAKER_PRIORITY, ODDS_API_BASE } from "@/server/constants";
import { serverEnv } from "@/server/env";
import {
  lookupParticipants,
  participantFields,
} from "@/server/participants/participants.service";
import { saneOutcomes } from "@/server/odds/price";
import {
  normalise,
  readSelection,
  resolveOutcome,
} from "@/server/odds/selection";
import { toAmericanOdds } from "@/server/picks/picks.mapper";
import { Type, type TSchema, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const EventSchema = Type.Object({
  id: Type.String(),
  sport_key: Type.String(),
  commence_time: Type.String(),
  home_team: Type.String(),
  away_team: Type.String(),
});

const EventOddsSchema = Type.Composite([
  EventSchema,
  Type.Object({
    bookmakers: Type.Array(
      Type.Object({
        key: Type.String(),
        markets: Type.Array(
          Type.Object({
            key: Type.String(),
            outcomes: Type.Array(
              Type.Object({
                name: Type.String(),
                price: Type.Number(),
                point: Type.Optional(Type.Number()),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
]);

const ScoresSchema = Type.Array(
  Type.Composite([
    EventSchema,
    Type.Object({
      completed: Type.Boolean(),
      scores: Type.Union([
        Type.Array(Type.Object({ name: Type.String(), score: Type.String() })),
        Type.Null(),
      ]),
    }),
  ]),
);

declare global {
  var oddsApiCredits: OddsCredits | undefined;
}

function headerNumber(res: Response, name: string): number | null {
  const raw = res.headers.get(name);
  const n = Number(raw);
  return raw !== null && Number.isFinite(n) ? n : null;
}

// globalThis: the grading job (instrumentation) and the routes load separate module copies.
function recordCredits(res: Response) {
  const remaining = headerNumber(res, "x-requests-remaining");
  if (remaining === null) return;
  globalThis.oddsApiCredits = {
    remaining,
    used: headerNumber(res, "x-requests-used"),
    updatedAt: dayjs().toISOString(),
  };
}

export function getOddsCredits(): OddsCredits {
  return (
    globalThis.oddsApiCredits ?? {
      remaining: null,
      used: null,
      updatedAt: null,
    }
  );
}

export type EventOdds = Static<typeof EventOddsSchema>;
export type EventScore = Static<typeof ScoresSchema>[number];

async function oddsApi<T extends TSchema>(
  path: string,
  params: Record<string, string>,
  schema: T,
): Promise<Static<T>> {
  const apiKey = serverEnv.oddsApiKey;
  if (!apiKey) throw new ApiError(500, "ERRORS.ODDS_NOT_CONFIGURED");

  const url = new URL(`${ODDS_API_BASE}${path}`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("dateFormat", "iso");
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  recordCredits(res);
  if (res.status === 404 || res.status === 422)
    throw new ApiError(404, "ERRORS.EVENT_NOT_FOUND");
  if (!res.ok) throw new ApiError(502, "ERRORS.ODDS_UNAVAILABLE");

  const body: unknown = await res.json();
  if (!Value.Check(schema, body))
    throw new ApiError(502, "ERRORS.ODDS_BAD_RESPONSE");
  return body;
}

const EVENTS_TTL_MS = 60_000;
const eventsCache = new Map<
  string,
  { expires: number; events: Promise<Static<typeof EventSchema>[]> }
>();

// Free call, cached briefly so pick checks and the board share one fetch per sport.
function sportEvents(sportKey: string): Promise<Static<typeof EventSchema>[]> {
  const now = Date.now();
  const hit = eventsCache.get(sportKey);
  if (hit && hit.expires > now) return hit.events;
  for (const [k, entry] of eventsCache)
    if (entry.expires <= now) eventsCache.delete(k);
  const events = oddsApi(
    `/sports/${encodeURIComponent(sportKey)}/events`,
    {},
    Type.Array(EventSchema),
  );
  eventsCache.set(sportKey, { expires: now + EVENTS_TTL_MS, events });
  events.catch(() => {
    if (eventsCache.get(sportKey)?.events === events)
      eventsCache.delete(sportKey);
  });
  return events;
}

export type ListedEvent = { home: string; away: string; commenceTime: Date };

// Checks an event against the free list before anything is spent on its odds.
export async function findUpcomingEvent(
  sportKey: string,
  eventId: string,
): Promise<ListedEvent> {
  const event = (await sportEvents(sportKey)).find((e) => e.id === eventId);
  if (!event) throw new ApiError(404, "ERRORS.EVENT_NOT_FOUND");
  const commence = dayjs(event.commence_time);
  if (!commence.isValid() || !commence.isAfter(dayjs()))
    throw new ApiError(409, "ERRORS.EVENT_STARTED");
  return {
    home: event.home_team,
    away: event.away_team,
    commenceTime: commence.toDate(),
  };
}

export async function listEvents(sportKey: string): Promise<ApiEvent[]> {
  const events = await sportEvents(sportKey);
  const now = dayjs();
  const upcoming = events.filter((e) => dayjs(e.commence_time).isAfter(now));
  const images = await lookupParticipants(
    upcoming.flatMap((e) => [
      { sportKey, name: e.home_team },
      { sportKey, name: e.away_team },
    ]),
  );
  return upcoming.map((e) => ({
    id: e.id,
    home: e.home_team,
    away: e.away_team,
    commenceTime: dayjs(e.commence_time).toISOString(),
    ...participantFields(images, sportKey, e.home_team, e.away_team),
  }));
}

export type EventStart = Static<typeof EventSchema>;

// Free like listEvents, but keeps games already in play: the importer cross checks start times with it.
export function listEventStarts(sportKey: string): Promise<EventStart[]> {
  return oddsApi(
    `/sports/${encodeURIComponent(sportKey)}/events`,
    {},
    Type.Array(EventSchema),
  );
}

// Some books send a placeholder price of 1 for a suspended side; one such quote must not void the whole response.
function dropBrokenPrices(event: EventOdds): EventOdds {
  return {
    ...event,
    bookmakers: event.bookmakers.map((bookmaker) => ({
      ...bookmaker,
      markets: bookmaker.markets.map((market) => ({
        ...market,
        outcomes: market.outcomes.filter(
          (o) => Number.isFinite(o.price) && o.price > 1,
        ),
      })),
    })),
  };
}

export async function fetchEventOdds(input: {
  sportKey: string;
  eventId: string;
  markets: readonly PickMarket[];
}): Promise<EventOdds> {
  const event = await oddsApi(
    `/sports/${encodeURIComponent(input.sportKey)}/events/${encodeURIComponent(input.eventId)}/odds`,
    {
      regions: "us,eu",
      markets: input.markets.join(","),
      oddsFormat: "decimal",
    },
    EventOddsSchema,
  );
  return dropBrokenPrices(event);
}

// Every upcoming event of a sport in one call; billed per region times market like the event endpoint.
export async function fetchSportOdds(input: {
  sportKey: string;
  markets: readonly PickMarket[];
}): Promise<EventOdds[]> {
  const events = await oddsApi(
    `/sports/${encodeURIComponent(input.sportKey)}/odds`,
    {
      regions: "us,eu",
      markets: input.markets.join(","),
      oddsFormat: "decimal",
    },
    Type.Array(EventOddsSchema),
  );
  return events.map(dropBrokenPrices);
}

// Free: /sports costs no credits and lists only in season sports by default.
export async function fetchActiveSports(): Promise<Set<string>> {
  const sports = await oddsApi(
    "/sports",
    {},
    Type.Array(Type.Object({ key: Type.String(), active: Type.Boolean() })),
  );
  return new Set(sports.filter((s) => s.active).map((s) => s.key));
}

export function fetchScores(sportKey: string): Promise<EventScore[]> {
  return oddsApi(
    `/sports/${encodeURIComponent(sportKey)}/scores`,
    { daysFrom: "3" },
    ScoresSchema,
  );
}

export type CapturedOdds = {
  home: string;
  away: string;
  commenceTime: Date;
  outcome: string;
  bookmaker: string;
  oddsDecimal: number;
  point: number | null;
  capturedAt: Date;
};

export function bookmakerRank(key: string): number {
  const i = BOOKMAKER_PRIORITY.indexOf(key);
  return i === -1 ? BOOKMAKER_PRIORITY.length : i;
}

export function formatLine(name: string, point: number | undefined): string {
  if (point === undefined) return name;
  const signed = !/^(over|under)$/i.test(name) && point > 0;
  return `${name} ${signed ? "+" : ""}${point}`;
}

export async function captureOdds(
  input: {
    sportKey: string;
    eventId: string;
    market: PickMarket;
    selection: string;
  },
  loadOdds: typeof fetchEventOdds = fetchEventOdds,
): Promise<CapturedOdds> {
  const parsed = readSelection(input.market, input.selection);

  const event = await loadOdds({
    sportKey: input.sportKey,
    eventId: input.eventId,
    markets: [input.market],
  });
  const capturedAt = dayjs();
  const commence = dayjs(event.commence_time);
  if (!commence.isValid() || !commence.isAfter(capturedAt))
    throw new ApiError(409, "ERRORS.EVENT_STARTED");

  const outcomeName = normalise(
    resolveOutcome({
      sportKey: input.sportKey,
      market: input.market,
      side: parsed.side,
      home: event.home_team,
      away: event.away_team,
    }),
  );

  const quotes = event.bookmakers
    .flatMap((bookmaker) => {
      const outcomes =
        bookmaker.markets.find((m) => m.key === input.market)?.outcomes ?? [];
      return outcomes
        .filter((o) => normalise(o.name) === outcomeName)
        .map((outcome) => ({
          bookmaker: bookmaker.key,
          outcome,
          sane: saneOutcomes(bookmaker.key, input.market, outcomes).includes(
            outcome,
          ),
        }));
    })
    .toSorted(
      (a, b) => bookmakerRank(a.bookmaker) - bookmakerRank(b.bookmaker),
    );
  if (quotes.length === 0) throw new ApiError(422, "ERRORS.MARKET_NOT_OFFERED");

  // An empty exchange book or a stale quote is skipped for the next bookmaker in priority.
  const offers = quotes.filter((q) => q.sane);
  if (offers.length === 0) throw new ApiError(422, "ERRORS.PRICE_UNRELIABLE");

  const chosen =
    parsed.point === null
      ? offers[0]
      : offers.find((o) => o.outcome.point === parsed.point);
  if (!chosen)
    throw new ApiError(422, "ERRORS.LINE_NOT_OFFERED", {
      line: formatLine(offers[0].outcome.name, offers[0].outcome.point),
    });

  return {
    home: event.home_team,
    away: event.away_team,
    commenceTime: commence.toDate(),
    outcome: chosen.outcome.name,
    bookmaker: chosen.bookmaker,
    oddsDecimal: chosen.outcome.price,
    point: chosen.outcome.point ?? null,
    capturedAt: capturedAt.toDate(),
  };
}

const LINES_TTL_MS = 60_000;
const linesCache = new Map<
  string,
  { expires: number; lines: Promise<ApiEventOdds> }
>();

async function loadEventLines(
  sportKey: string,
  eventId: string,
): Promise<ApiEventOdds> {
  await findUpcomingEvent(sportKey, eventId);
  const event = await fetchEventOdds({
    sportKey,
    eventId,
    markets: PICK_MARKETS,
  });
  const commence = dayjs(event.commence_time);
  if (!commence.isValid() || !commence.isAfter(dayjs()))
    throw new ApiError(409, "ERRORS.EVENT_STARTED");

  const markets = PICK_MARKETS.flatMap((market): ApiMarketOdds[] => {
    const best = event.bookmakers
      .flatMap((bookmaker) => {
        const found = bookmaker.markets.find((m) => m.key === market);
        const outcomes = found
          ? saneOutcomes(bookmaker.key, market, found.outcomes)
          : [];
        return outcomes.length > 0
          ? [{ bookmaker: bookmaker.key, outcomes }]
          : [];
      })
      .toSorted(
        (a, b) => bookmakerRank(a.bookmaker) - bookmakerRank(b.bookmaker),
      )[0];
    if (!best) return [];
    return [
      {
        market,
        bookmaker: best.bookmaker,
        outcomes: best.outcomes.map((o) => ({
          name: o.name,
          point: o.point ?? null,
          odds: toAmericanOdds(o.price),
          selection: formatLine(o.name, o.point),
        })),
      },
    ];
  });

  return {
    eventId: event.id,
    home: event.home_team,
    away: event.away_team,
    commenceTime: commence.toISOString(),
    markets,
  };
}

// Display only and cached, so browsing lines does not burn Odds API credits; captureOdds always fetches fresh.
export function getEventLines(
  sportKey: string,
  eventId: string,
): Promise<ApiEventOdds> {
  const key = `${sportKey}:${eventId}`;
  const now = Date.now();
  const hit = linesCache.get(key);
  if (hit && hit.expires > now) return hit.lines;

  for (const [k, entry] of linesCache)
    if (entry.expires <= now) linesCache.delete(k);

  const lines = loadEventLines(sportKey, eventId);
  linesCache.set(key, { expires: now + LINES_TTL_MS, lines });
  lines.catch(() => {
    if (linesCache.get(key)?.lines === lines) linesCache.delete(key);
  });
  return lines;
}
