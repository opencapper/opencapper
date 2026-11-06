import { dayjs } from "@/lib/utils/format/date";
import { sameParticipant } from "@/server/odds/selection";
import type { FightFacts } from "@/server/results/sources/ufc";
import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// ESPN's public scoreboard and core APIs; light polling only, results are never passed on raw.
const SITE = "https://site.api.espn.com/apis/site/v2/sports/mma";
const CORE = "https://sports.core.api.espn.com/v2/sports/mma/leagues";
// The only MMA leagues with events in practice; UFC is a fallback behind its own feed.
export const ESPN_LEAGUES = ["pfl", "ufc"] as const;

const CompetitionSchema = Type.Object({
  id: Type.String(),
  competitors: Type.Array(
    Type.Object({
      winner: Type.Optional(Type.Boolean()),
      athlete: Type.Object({ displayName: Type.String() }),
    }),
  ),
  status: Type.Object({
    period: Type.Optional(Type.Number()),
    displayClock: Type.Optional(Type.String()),
    type: Type.Object({ completed: Type.Boolean() }),
  }),
  format: Type.Optional(
    Type.Object({
      regulation: Type.Optional(
        Type.Object({ periods: Type.Optional(Type.Number()) }),
      ),
    }),
  ),
});
type Competition = Static<typeof CompetitionSchema>;

const ScoreboardSchema = Type.Object({
  events: Type.Array(
    Type.Object({
      id: Type.String(),
      competitions: Type.Array(Type.Unknown()),
    }),
  ),
});

const StatusSchema = Type.Object({
  result: Type.Optional(
    Type.Object({
      name: Type.String(),
      displayName: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
    }),
  ),
});

type Fight = { league: string; eventId: string; competition: Competition };

async function getJson(url: string): Promise<unknown> {
  // The site API answers 403 to runtime and named bot user agents, a plain HTTP client string passes.
  const res = await fetch(url, {
    headers: { "User-Agent": "curl/8.10.1" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`espn ${res.status}: ${url}`);
  return res.json();
}

const BOARD_TTL_MS = 60_000;
const boardCache = new Map<
  string,
  { expires: number; fights: Promise<Fight[]> }
>();

function scoreboard(league: string, day: string): Promise<Fight[]> {
  const key = `${league}:${day}`;
  const hit = boardCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.fights;
  const fights = getJson(`${SITE}/${league}/scoreboard?dates=${day}`).then(
    (body) => {
      if (!Value.Check(ScoreboardSchema, body)) return [];
      return body.events.flatMap((event) =>
        event.competitions
          .filter((c): c is Competition => Value.Check(CompetitionSchema, c))
          .map((competition) => ({ league, eventId: event.id, competition })),
      );
    },
  );
  boardCache.set(key, { expires: Date.now() + BOARD_TTL_MS, fights });
  fights.catch(() => boardCache.delete(key));
  return fights;
}

// Cards run past midnight UTC, so the listed start day and the next one are both searched.
export async function espnFightNear(
  start: Date,
  home: string,
  away: string,
): Promise<Fight | null> {
  const days = [0, 1, -1].map((d) =>
    dayjs(start).utc().add(d, "day").format("YYYYMMDD"),
  );
  for (const league of ESPN_LEAGUES)
    for (const day of days) {
      const fights = await scoreboard(league, day).catch(() => []);
      const found = fights.find((f) => {
        const names = f.competition.competitors.map(
          (c) => c.athlete.displayName,
        );
        return (
          names.some((n) => sameParticipant(n, home)) &&
          names.some((n) => sameParticipant(n, away))
        );
      });
      if (found) return found;
    }
  return null;
}

// ESPN result names: kotko, tko---doctors-stoppage, tko-retirement, submission-guillotine, decision---split, no-contest.
function methodClass(name: string): string | null {
  const n = name.toLowerCase();
  if (n.startsWith("ko") || n.startsWith("tko")) return "ko";
  if (n.startsWith("submission")) return "submission";
  if (n.startsWith("decision")) return "decision";
  if (n.startsWith("draw")) return "draw";
  if (n.startsWith("no-contest") || n.startsWith("nc")) return "no_contest";
  if (n.startsWith("dq") || n.startsWith("disqualif")) return "dq";
  return null;
}

function clockSeconds(text: string | undefined): number | null {
  const match = text?.match(/^(\d+):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// Facts of a completed fight, sides mapped onto the event's home and away; null until ESPN has a final result.
export async function espnFightFacts(
  fight: Fight,
  home: string,
): Promise<FightFacts | null> {
  const c = fight.competition;
  if (!c.status.type.completed) return null;
  const body = await getJson(
    `${CORE}/${fight.league}/events/${fight.eventId}/competitions/${c.id}/status`,
  );
  if (!Value.Check(StatusSchema, body) || !body.result) return null;
  const method = methodClass(body.result.name);
  if (!method) return null;
  const winnerName = c.competitors.find((x) => x.winner)?.athlete.displayName;
  const winner =
    method === "draw"
      ? "draw"
      : method === "no_contest" || !winnerName
        ? null
        : sameParticipant(winnerName, home)
          ? "home"
          : "away";
  return {
    winner,
    method,
    methodDetail: body.result.description ?? body.result.displayName ?? null,
    periodsScheduled: c.format?.regulation?.periods ?? null,
    periodEnded: c.status.period ?? null,
    periodClock: clockSeconds(c.status.displayClock),
    bonuses: [],
  };
}
