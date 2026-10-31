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
import {
  normalise,
  parseSelection,
  resolveTeam,
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
                price: Type.Number({ exclusiveMinimum: 1 }),
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

export async function listEvents(sportKey: string): Promise<ApiEvent[]> {
  const events = await oddsApi(
    `/sports/${encodeURIComponent(sportKey)}/events`,
    {},
    Type.Array(EventSchema),
  );
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

export function fetchEventOdds(input: {
  sportKey: string;
  eventId: string;
  markets: readonly PickMarket[];
}): Promise<EventOdds> {
  return oddsApi(
    `/sports/${encodeURIComponent(input.sportKey)}/events/${encodeURIComponent(input.eventId)}/odds`,
    {
      regions: "us,eu",
      markets: input.markets.join(","),
      oddsFormat: "decimal",
    },
    EventOddsSchema,
  );
}

// Every upcoming event of a sport in one call; billed per region times market like the event endpoint.
export function fetchSportOdds(input: {
  sportKey: string;
  markets: readonly PickMarket[];
}): Promise<EventOdds[]> {
  return oddsApi(
    `/sports/${encodeURIComponent(input.sportKey)}/odds`,
    {
      regions: "us,eu",
      markets: input.markets.join(","),
      oddsFormat: "decimal",
    },
    Type.Array(EventOddsSchema),
  );
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
  const parsed = parseSelection(input.market, input.selection);
  if (!parsed)
    throw new ApiError(
      422,
      input.market === "totals"
        ? "ERRORS.TOTALS_SIDE_REQUIRED"
        : "ERRORS.SELECTION_UNREADABLE",
    );

  const event = await loadOdds({
    sportKey: input.sportKey,
    eventId: input.eventId,
    markets: [input.market],
  });
  const capturedAt = dayjs();
  const commence = dayjs(event.commence_time);
  if (!commence.isValid() || !commence.isAfter(capturedAt))
    throw new ApiError(409, "ERRORS.EVENT_STARTED");

  const outcomeName =
    input.market === "totals"
      ? parsed.side
      : resolveTeam(parsed.side, [event.home_team, event.away_team]);
  if (!outcomeName)
    throw new ApiError(422, "ERRORS.TEAM_NOT_IN_EVENT", {
      home: event.home_team,
      away: event.away_team,
    });

  const offers = event.bookmakers
    .flatMap((bookmaker) => {
      const outcome = bookmaker.markets
        .find((m) => m.key === input.market)
        ?.outcomes.find((o) => normalise(o.name) === normalise(outcomeName));
      return outcome ? [{ bookmaker: bookmaker.key, outcome }] : [];
    })
    .toSorted(
      (a, b) => bookmakerRank(a.bookmaker) - bookmakerRank(b.bookmaker),
    );
  if (offers.length === 0) throw new ApiError(422, "ERRORS.MARKET_NOT_OFFERED");

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
        return found && found.outcomes.length > 0
          ? [{ bookmaker: bookmaker.key, outcomes: found.outcomes }]
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
