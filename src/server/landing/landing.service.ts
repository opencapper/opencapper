import { getDb } from "@/lib/db/server/client";
import { pickSettlements, picks } from "@/lib/db/schema/server";
import { PICK_LEAGUES } from "@/lib/config/sports";
import type {
  LandingData,
  LandingEvent,
  LandingFeatured,
  LandingStats,
} from "@/lib/types";
import { serverEnv } from "@/server/env";
import { getLeaderboard } from "@/server/leaderboard/leaderboard.service";
import { getHeadRow, getLogHead, getPickEntry } from "@/server/log/log.service";
import { getFeaturedEvents } from "@/server/odds/board.service";
import { listEvents } from "@/server/odds/odds.service";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

// MMA first, the rest are the leagues most likely to have a fixture this week.
// Names match the bot's /pick sport choices.
const LANDING_SPORTS = [
  { sportKey: "mma_mixed_martial_arts", sportName: "MMA" },
  { sportKey: "americanfootball_nfl", sportName: "NFL" },
  { sportKey: "basketball_nba", sportName: "NBA" },
  { sportKey: "soccer_epl", sportName: "Soccer EPL" },
];

// Prices come from the pick board's budgeted league cache, so the landing page spends no credits of its own.
const FEATURED_TTL_MS = 15 * 60_000;
const FEATURED_COUNT = 6;
const STATS_TTL_MS = 60_000;

type Slot<T> = { expires: number; value: Promise<T> };

function cached<T>(
  load: () => Promise<{ value: T; expires: number }>,
): () => Promise<T> {
  let slot: Slot<T> | null = null;
  return () => {
    const now = Date.now();
    if (slot && slot.expires > now) return slot.value;
    const pending = load();
    const next: Slot<T> = {
      expires: Infinity,
      value: pending.then((r) => r.value),
    };
    slot = next;
    pending.then(
      (r) => {
        next.expires = r.expires;
      },
      () => {
        if (slot === next) slot = null;
      },
    );
    return next.value;
  };
}

async function nextEvent(): Promise<LandingEvent | null> {
  if (!serverEnv.oddsApiKey) return null;
  for (const sport of LANDING_SPORTS) {
    const events = await listEvents(sport.sportKey).catch(() => []);
    const first = events.toSorted((a, b) =>
      a.commenceTime.localeCompare(b.commenceTime),
    )[0];
    if (first) return { ...first, ...sport };
  }
  return null;
}

function leagueName(sportKey: string): string {
  return (
    PICK_LEAGUES.find((league) => league.sportKey === sportKey)?.label ??
    sportKey
  );
}

async function loadFeatured(): Promise<LandingFeatured[]> {
  const rows = await getFeaturedEvents(FEATURED_COUNT).catch(() => []);
  if (rows.length === 0) {
    const event = await nextEvent();
    return event ? [{ event, price: null }] : [];
  }
  return rows.map((row) => {
    const homeFavoured = row.offer.home <= row.offer.away;
    return {
      event: {
        ...row.event,
        sportKey: row.sportKey,
        sportName: leagueName(row.sportKey),
      },
      price: {
        selection: homeFavoured ? row.event.home : row.event.away,
        bookmaker: row.offer.bookmaker,
        oddsDecimal: homeFavoured ? row.offer.home : row.offer.away,
        capturedAt: row.pricedAt,
      },
    };
  });
}

const landingFeatured = cached(async () => ({
  value: await loadFeatured(),
  expires: Date.now() + FEATURED_TTL_MS,
}));

const GRADED = ["win", "loss", "push", "void"] as const;

async function loadStats(): Promise<LandingStats> {
  const db = getDb();
  const countOf = (result: string) =>
    sql`count(*) filter (where ${picks.result} = ${result})::int`.mapWith(
      Number,
    );
  const [totalsRows, clvRows, gradedRows, head, headRow, board] =
    await Promise.all([
      db
        .select({
          win: countOf("win"),
          loss: countOf("loss"),
          push: countOf("push"),
          void: countOf("void"),
        })
        .from(picks),
      db
        .select({
          taken: picks.oddsDecimal,
          close: pickSettlements.closingOddsDecimal,
          clv: pickSettlements.clv,
        })
        .from(pickSettlements)
        .innerJoin(picks, eq(picks.id, pickSettlements.pickId))
        .where(
          and(
            isNotNull(pickSettlements.clv),
            isNotNull(pickSettlements.closingOddsDecimal),
          ),
        )
        .orderBy(desc(pickSettlements.closingCapturedAt))
        .limit(1),
      db
        .select({
          result: picks.result,
          units: picks.units,
          oddsDecimal: picks.oddsDecimal,
        })
        .from(pickSettlements)
        .innerJoin(picks, eq(picks.id, pickSettlements.pickId))
        .where(
          and(
            isNotNull(pickSettlements.gradedAt),
            inArray(picks.result, [...GRADED]),
          ),
        )
        .orderBy(desc(pickSettlements.gradedAt))
        .limit(1),
      getLogHead(),
      getHeadRow(),
      getLeaderboard({}),
    ]);

  const clv = clvRows[0];
  const graded = gradedRows[0];
  const latest = headRow ? await getPickEntry(headRow.pickId) : null;
  return {
    results: totalsRows[0] ?? { win: 0, loss: 0, push: 0, void: 0 },
    clv:
      clv && clv.close !== null && clv.clv !== null
        ? { taken: clv.taken, close: clv.close, clv: clv.clv }
        : null,
    lastResult: graded
      ? {
          result: graded.result,
          units:
            graded.result === "win"
              ? graded.units * (graded.oddsDecimal - 1)
              : graded.result === "loss"
                ? -graded.units
                : 0,
        }
      : null,
    head,
    latest: latest
      ? { pickId: latest.pickId, canonical: latest.canonical }
      : null,
    top: board.rows.slice(0, 2).map((row) => ({
      username: row.username,
      roi: row.roi,
    })),
  };
}

const landingStats = cached(async () => ({
  value: await loadStats().catch(() => null),
  expires: Date.now() + STATS_TTL_MS,
}));

export async function getLandingData(): Promise<LandingData> {
  const [featured, stats] = await Promise.all([
    landingFeatured().catch(() => []),
    landingStats().catch(() => null),
  ]);
  return {
    event: featured[0]?.event ?? null,
    price: featured[0]?.price ?? null,
    featured,
    stats,
    minGraded: serverEnv.ranking.leaderboardMinGradedPicks,
  };
}
