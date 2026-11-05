import { dayjs } from "@/lib/utils/format/date";
import { sameParticipant } from "@/server/odds/selection";
import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// The feed ufc.com itself loads; undocumented, so it is polled gently and never passed on raw.
const UFC_FEED = "https://d29dxerjsp82wz.cloudfront.net/api/v3/event/live";
// Ids are handed out when a card is announced, not in date order; the scan starts below every card still relevant.
const FIRST_ID = 1330;
const MISSES_BEFORE_STOP = 6;

const FighterSchema = Type.Object({
  Name: Type.Object({ FirstName: Type.String(), LastName: Type.String() }),
  Outcome: Type.Union([
    Type.Object({ Outcome: Type.Union([Type.String(), Type.Null()]) }),
    Type.Null(),
  ]),
  PerformanceOfTheNight: Type.Optional(
    Type.Union([Type.Boolean(), Type.Null()]),
  ),
  KOOfTheNight: Type.Optional(Type.Union([Type.Boolean(), Type.Null()])),
  SubmissionOfTheNight: Type.Optional(
    Type.Union([Type.Boolean(), Type.Null()]),
  ),
});

const FightSchema = Type.Object({
  Status: Type.String(),
  Fighters: Type.Array(FighterSchema),
  Result: Type.Union([
    Type.Object({
      Method: Type.Union([Type.String(), Type.Null()]),
      EndingRound: Type.Union([Type.Number(), Type.Null()]),
      EndingTime: Type.Union([Type.String(), Type.Null()]),
      EndingSubmission: Type.Optional(Type.Union([Type.String(), Type.Null()])),
      EndingStrike: Type.Optional(Type.Union([Type.String(), Type.Null()])),
      FightOfTheNight: Type.Optional(Type.Union([Type.Boolean(), Type.Null()])),
    }),
    Type.Null(),
  ]),
  RuleSet: Type.Union([
    Type.Object({ PossibleRounds: Type.Union([Type.Number(), Type.Null()]) }),
    Type.Null(),
  ]),
});
type Fight = Static<typeof FightSchema>;

const EventSchema = Type.Object({
  LiveEventDetail: Type.Object({
    EventId: Type.Number(),
    Name: Type.String(),
    StartTime: Type.String(),
    Status: Type.String(),
    FightCard: Type.Array(Type.Unknown()),
  }),
});

export type UfcCard = {
  id: number;
  name: string;
  start: Date;
  final: boolean;
  fights: Fight[];
};

async function fetchCard(id: number): Promise<UfcCard | null> {
  const res = await fetch(`${UFC_FEED}/${id}.json`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`ufc feed ${id}: ${res.status}`);
  const body: unknown = await res.json();
  if (!Value.Check(EventSchema, body)) return null;
  const event = body.LiveEventDetail;
  return {
    id: event.EventId,
    name: event.Name,
    start: dayjs(event.StartTime).toDate(),
    final: event.Status === "Final",
    fights: event.FightCard.filter((f): f is Fight =>
      Value.Check(FightSchema, f),
    ),
  };
}

// id to card start; rescanned a few times a day, cards themselves are fetched only around their date.
const index = new Map<number, Date>();
let indexedAt = 0;
const INDEX_TTL_MS = 6 * 60 * 60_000;

async function refreshIndex() {
  if (Date.now() - indexedAt < INDEX_TTL_MS) return;
  indexedAt = Date.now();
  let id = index.size > 0 ? Math.max(...index.keys()) + 1 : FIRST_ID;
  let misses = 0;
  while (misses < MISSES_BEFORE_STOP) {
    const card = await fetchCard(id).catch(() => null);
    if (card) {
      index.set(id, card.start);
      misses = 0;
    } else misses++;
    id++;
  }
}

const CARD_TTL_MS = 60_000;
const cardCache = new Map<
  number,
  { expires: number; card: Promise<UfcCard | null> }
>();

function cachedCard(id: number): Promise<UfcCard | null> {
  const hit = cardCache.get(id);
  if (hit && hit.expires > Date.now()) return hit.card;
  const card = fetchCard(id);
  cardCache.set(id, { expires: Date.now() + CARD_TTL_MS, card });
  card.catch(() => cardCache.delete(id));
  return card;
}

// Cards held within a day of the event's listed start (feeds disagree on per fight start times).
export async function cardsNear(start: Date): Promise<UfcCard[]> {
  await refreshIndex();
  const ids = [...index].filter(
    ([, cardStart]) =>
      Math.abs(dayjs(cardStart).diff(start, "hour", true)) <= 24,
  );
  const cards = await Promise.all(ids.map(([id]) => cachedCard(id)));
  return cards.filter((c): c is UfcCard => c !== null);
}

function fullName(fighter: Fight["Fighters"][number]) {
  return `${fighter.Name.FirstName} ${fighter.Name.LastName}`.trim();
}

export function fightFor(card: UfcCard, home: string, away: string) {
  return card.fights.find((fight) => {
    const names = fight.Fighters.map(fullName);
    return (
      names.some((n) => sameParticipant(n, home)) &&
      names.some((n) => sameParticipant(n, away))
    );
  });
}

// One of the event's fighters fought someone else on a finished card: the listed pairing never happened.
export function pairingReplaced(card: UfcCard, home: string, away: string) {
  if (!card.final || fightFor(card, home, away)) return false;
  return card.fights.some((fight) =>
    fight.Fighters.map(fullName).some(
      (n) => sameParticipant(n, home) || sameParticipant(n, away),
    ),
  );
}

function methodClass(method: string): string | null {
  const m = method.toLowerCase();
  if (m.startsWith("decision")) return "decision";
  if (m.includes("submission")) return "submission";
  if (m.includes("ko") || m.includes("could not continue")) return "ko";
  if (m.includes("dq") || m.includes("disqualif")) return "dq";
  if (m.includes("overturn") || m.includes("no contest")) return "no_contest";
  if (m.includes("draw")) return "draw";
  return null;
}

function clockSeconds(text: string | null): number | null {
  const match = text?.match(/^(\d+):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export type FightFacts = {
  winner: "home" | "away" | "draw" | null;
  method: string | null;
  methodDetail: string | null;
  periodsScheduled: number | null;
  periodEnded: number | null;
  periodClock: number | null;
  bonuses: string[];
};

// Facts of a finished fight, sides mapped onto the event's home and away; null until it is final and readable.
export function fightFacts(fight: Fight, home: string): FightFacts | null {
  if (fight.Status !== "Final" || !fight.Result?.Method) return null;
  const method = methodClass(fight.Result.Method);
  if (!method) return null;
  const outcomes = fight.Fighters.map(
    (f) => f.Outcome?.Outcome?.toLowerCase() ?? "",
  );
  const winnerIndex = outcomes.indexOf("win");
  const isDraw = method === "draw" || outcomes.every((o) => o === "draw");
  const winnerName =
    winnerIndex >= 0 ? fullName(fight.Fighters[winnerIndex]) : null;
  const winner = isDraw
    ? "draw"
    : winnerName
      ? sameParticipant(winnerName, home)
        ? "home"
        : "away"
      : null;
  const bonuses = [
    ...(fight.Result.FightOfTheNight ? ["fight_of_the_night"] : []),
    ...fight.Fighters.flatMap((f) =>
      [
        f.PerformanceOfTheNight ? "performance_of_the_night" : null,
        f.KOOfTheNight ? "ko_of_the_night" : null,
        f.SubmissionOfTheNight ? "submission_of_the_night" : null,
      ]
        .filter((b): b is string => b !== null)
        .map(
          (b) => `${sameParticipant(fullName(f), home) ? "home" : "away"}:${b}`,
        ),
    ),
  ];
  return {
    winner: method === "no_contest" ? null : winner,
    method: isDraw ? "draw" : method,
    methodDetail:
      fight.Result.EndingSubmission ??
      fight.Result.EndingStrike ??
      fight.Result.Method,
    periodsScheduled: fight.RuleSet?.PossibleRounds ?? null,
    periodEnded: fight.Result.EndingRound,
    periodClock: clockSeconds(fight.Result.EndingTime),
    bonuses,
  };
}
