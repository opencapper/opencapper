import { getDb } from "@/lib/db/server/client";
import { eventResults, type EventResult } from "@/lib/db/schema/server";
import type { ResultFacts } from "@/server/grading/settle";
import type { EventScore } from "@/server/odds/odds.service";
import { normalise } from "@/server/odds/selection";
import { and, desc, eq, inArray } from "drizzle-orm";

export type NewEventResult = Omit<EventResult, "id" | "createdAt">;

const FACT_KEYS = [
  "status",
  "winner",
  "homeScore",
  "awayScore",
  "method",
  "methodDetail",
  "periodsScheduled",
  "periodEnded",
  "periodClock",
] as const;

function sameFacts(a: NewEventResult, b: NewEventResult): boolean {
  return (
    FACT_KEYS.every((key) => a[key] === b[key]) &&
    JSON.stringify(a.bonuses) === JSON.stringify(b.bonuses)
  );
}

// Latest row per event: a correction from the source is a newer row.
export async function latestResults(
  sportKey: string,
  eventIds: readonly string[],
): Promise<Map<string, EventResult>> {
  if (eventIds.length === 0) return new Map();
  const rows = await getDb()
    .select()
    .from(eventResults)
    .where(
      and(
        eq(eventResults.sportKey, sportKey),
        inArray(eventResults.eventId, [...eventIds]),
      ),
    )
    .orderBy(desc(eventResults.id));
  const latest = new Map<string, EventResult>();
  for (const row of rows)
    if (!latest.has(row.eventId)) latest.set(row.eventId, row);
  return latest;
}

// Appends only when the facts changed, so polling a finished event writes nothing.
export async function recordEventResult(
  next: NewEventResult,
  previous: EventResult | undefined,
): Promise<EventResult> {
  if (previous && sameFacts(previous, next)) return previous;
  const [row] = await getDb().insert(eventResults).values(next).returning();
  return row;
}

// Facts from an Odds API scores entry; null until the game is completed with both scores.
export function scoresFacts(event: EventScore): ResultFacts | null {
  if (!event.completed || !event.scores) return null;
  const scoreOf = (team: string) => {
    const entry = event.scores?.find(
      (s) => normalise(s.name) === normalise(team),
    );
    const value = entry ? Number(entry.score) : NaN;
    return Number.isFinite(value) ? value : null;
  };
  const homeScore = scoreOf(event.home_team);
  const awayScore = scoreOf(event.away_team);
  if (homeScore === null || awayScore === null) return null;
  return {
    status: "final",
    winner: null,
    homeScore,
    awayScore,
    method: null,
    periodEnded: null,
    periodClock: null,
  };
}

export function scoresResult(
  sportKey: string,
  event: EventScore,
): NewEventResult | null {
  const facts = scoresFacts(event);
  if (!facts) return null;
  return {
    ...facts,
    sportKey,
    eventId: event.id,
    source: "odds_api",
    methodDetail: null,
    periodsScheduled: null,
    bonuses: [],
  };
}
