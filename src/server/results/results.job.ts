import { getDb } from "@/lib/db/server/client";
import { picks } from "@/lib/db/schema/server";
import { sportGroup } from "@/lib/config/sports";
import { dayjs } from "@/lib/utils/format/date";
import {
  latestResults,
  recordEventResult,
  type NewEventResult,
} from "@/server/results/results.service";
import {
  cardsNear,
  fightFacts,
  fightFor,
  pairingReplaced,
} from "@/server/results/sources/ufc";
import { espnFightFacts, espnFightNear } from "@/server/results/sources/espn";
import { and, eq, gte, lte } from "drizzle-orm";

const RUN_EVERY_MS = 2 * 60_000;
const LOOKBACK_DAYS = 7;
// Bonuses and official corrections land hours after a fight; a final result is rechecked this long.
const RECHECK_HOURS = 12;

// Sports whose results come from a free source, so grading needs no paid scores poll.
export function hasFreeResults(sportKey: string): boolean {
  return sportGroup(sportKey) === "mma";
}

export async function collectFightResults(now = dayjs()): Promise<number> {
  const rows = await getDb()
    .selectDistinct({
      sportKey: picks.sportKey,
      eventId: picks.eventId,
      home: picks.home,
      away: picks.away,
      commenceTime: picks.commenceTime,
    })
    .from(picks)
    .where(
      and(
        eq(picks.result, "pending"),
        lte(picks.commenceTime, now.toDate()),
        gte(picks.commenceTime, now.subtract(LOOKBACK_DAYS, "day").toDate()),
      ),
    );

  let written = 0;
  const bySport = Map.groupBy(
    rows.filter((r) => hasFreeResults(r.sportKey)),
    (r) => r.sportKey,
  );
  for (const [sportKey, events] of bySport) {
    const stored = await latestResults(
      sportKey,
      events.map((e) => e.eventId),
    );
    for (const event of events) {
      const previous = stored.get(event.eventId);
      const settled =
        previous &&
        previous.status !== "postponed" &&
        dayjs(event.commenceTime).isBefore(now.subtract(RECHECK_HOURS, "hour"));
      if (settled) continue;

      const cards = await cardsNear(event.commenceTime).catch((error) => {
        console.error("results: ufc cards failed", error);
        return [];
      });
      const base = {
        sportKey,
        eventId: event.eventId,
        source: "ufc",
        homeScore: null,
        awayScore: null,
      };
      let next: NewEventResult | null = null;
      for (const card of cards) {
        const fight = fightFor(card, event.home, event.away);
        const facts = fight ? fightFacts(fight, event.home) : null;
        if (facts) {
          next = { ...base, ...facts, status: "final" };
          break;
        }
      }
      // PFL and anything the UFC feed misses: ESPN, which has no bonuses.
      if (!next) {
        const fight = await espnFightNear(
          event.commenceTime,
          event.home,
          event.away,
        ).catch(() => null);
        const facts = fight
          ? await espnFightFacts(fight, event.home).catch(() => null)
          : null;
        if (facts)
          next = { ...base, ...facts, source: "espn", status: "final" };
      }
      if (
        !next &&
        cards.some((c) => pairingReplaced(c, event.home, event.away))
      )
        next = {
          ...base,
          status: "cancelled",
          winner: null,
          method: null,
          methodDetail: "replaced",
          periodsScheduled: null,
          periodEnded: null,
          periodClock: null,
          bonuses: [],
        };
      if (!next) continue;
      const row = await recordEventResult(next, previous);
      if (row !== previous) written++;
    }
  }
  return written;
}

let started = false;

export function startResultsJob() {
  if (started) return;
  started = true;
  const run = () =>
    collectFightResults().catch((error) =>
      console.error("results: collect failed", error),
    );
  void run();
  setInterval(run, RUN_EVERY_MS).unref?.();
}
