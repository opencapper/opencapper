import { getDb } from "@/lib/db/server/client";
import {
  pickSettlements,
  pickSources,
  picks,
  users,
} from "@/lib/db/schema/server";
import { TELEGRAM_CHAT_PREFIX, type PickResult } from "@/lib/api/typebox/picks";
import { PICK_LEAGUES, sportGroup } from "@/lib/config/sports";
import type {
  DashSource,
  LandingDash,
  LandingDashPoint,
  LandingDashSport,
  LandingDashTick,
  LandingData,
  LandingEvent,
  LandingFeatured,
  LandingStats,
} from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import { getLeaderboard } from "@/server/leaderboard/leaderboard.service";
import { listAnchors } from "@/server/log/anchor.service";
import { getHeadRow, getLogHead, getPickEntry } from "@/server/log/log.service";
import { getFeaturedEvents } from "@/server/odds/board.service";
import { listEvents } from "@/server/odds/odds.service";
import { toAmericanOdds } from "@/server/picks/picks.mapper";
import { getCapperStats } from "@/server/stats/stats.service";
import { visibleUser } from "@/server/users/hidden";
import { getUserHistory, getUserPicks } from "@/server/users/users.service";
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";

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

const DASH_ROWS = 8;
const DASH_TICKS = 16;
const DASH_SPORTS = 5;
const CURVE_MAX_POINTS = 160;
const SOURCE_WINDOW_DAYS = 30;
const DASH_SOURCES: DashSource[] = ["discord", "telegram", "web", "polymarket"];

type GradedLike = {
  sportKey: string;
  result: PickResult;
  odds: number;
  units: number;
  at: string;
};

function decimalOdds(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american;
}

function netUnits(pick: GradedLike): number {
  if (pick.result === "win") return pick.units * (decimalOdds(pick.odds) - 1);
  if (pick.result === "loss") return -pick.units;
  return 0;
}

function isSettled(result: PickResult) {
  return result === "win" || result === "loss" || result === "push";
}

function curveOf(graded: GradedLike[]): LandingDashPoint[] {
  const ordered = graded.toSorted(
    (a, b) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf(),
  );
  let total = 0;
  const points = ordered.map((pick) => {
    total += netUnits(pick);
    return { at: pick.at, units: Math.round(total * 100) / 100 };
  });
  if (points.length <= CURVE_MAX_POINTS) return points;
  const step = (points.length - 1) / (CURVE_MAX_POINTS - 1);
  return Array.from(
    { length: CURVE_MAX_POINTS },
    (_, i) => points[Math.round(i * step)],
  );
}

function sportsOf(graded: GradedLike[]): LandingDashSport[] {
  const groups = new Map<string, LandingDashSport>();
  for (const pick of graded) {
    const key = sportGroup(pick.sportKey) ?? pick.sportKey;
    const entry = groups.get(key) ?? {
      sportKey: pick.sportKey,
      graded: 0,
      wins: 0,
      losses: 0,
      units: 0,
    };
    entry.graded += 1;
    if (pick.result === "win") entry.wins += 1;
    if (pick.result === "loss") entry.losses += 1;
    entry.units = Math.round((entry.units + netUnits(pick)) * 100) / 100;
    groups.set(key, entry);
  }
  return [...groups.values()]
    .toSorted((a, b) => b.graded - a.graded)
    .slice(0, DASH_SPORTS);
}

async function loadTicker(): Promise<LandingDashTick[]> {
  const db = getDb();
  const [locked, graded, anchors] = await Promise.all([
    db
      .select({
        id: picks.id,
        username: users.username,
        market: picks.market,
        selection: picks.selection,
        point: picks.point,
        odds: picks.oddsDecimal,
        at: picks.createdAt,
      })
      .from(picks)
      .innerJoin(users, eq(users.id, picks.userId))
      .where(visibleUser)
      .orderBy(desc(picks.createdAt))
      .limit(DASH_TICKS / 2),
    db
      .select({
        id: picks.id,
        username: users.username,
        sequence: picks.sequence,
        result: picks.result,
        at: pickSettlements.gradedAt,
      })
      .from(pickSettlements)
      .innerJoin(picks, eq(picks.id, pickSettlements.pickId))
      .innerJoin(users, eq(users.id, picks.userId))
      .where(
        and(
          visibleUser,
          isNotNull(pickSettlements.gradedAt),
          inArray(picks.result, [...GRADED]),
        ),
      )
      .orderBy(desc(pickSettlements.gradedAt))
      .limit(DASH_TICKS / 2),
    listAnchors(3),
  ]);
  const ticks: LandingDashTick[] = [
    ...locked.map((row) => ({
      kind: "locked" as const,
      key: `l${row.id}`,
      at: dayjs(row.at).toISOString(),
      username: row.username,
      market: row.market,
      selection: row.selection,
      point: row.point,
      odds: toAmericanOdds(row.odds),
    })),
    ...graded.map((row) => ({
      kind: "graded" as const,
      key: `g${row.id}`,
      at: dayjs(row.at).toISOString(),
      username: row.username,
      sequence: row.sequence,
      result: row.result,
    })),
    ...anchors.map((row) => ({
      kind: "anchored" as const,
      key: `a${row.id}`,
      at: row.createdAt,
      size: row.size,
      upgraded: row.upgraded,
    })),
  ];
  return ticks
    .toSorted((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf())
    .slice(0, DASH_TICKS);
}

async function loadSources() {
  const since = dayjs().subtract(SOURCE_WINDOW_DAYS, "day").toISOString();
  const source = sql<string>`case
  when ${pickSources.platform} is not null then ${pickSources.platform}
  when ${picks.guildId} like ${`${TELEGRAM_CHAT_PREFIX}%`} then 'telegram'
  when ${picks.guildId} is not null then 'discord'
  else 'web' end`;
  const rows = await getDb()
    .select({
      source,
      picks:
        sql`count(*) filter (where ${picks.createdAt} >= ${since}::timestamptz)::int`.mapWith(
          Number,
        ),
      lastAt: sql<string | null>`max(${picks.createdAt})`,
    })
    .from(picks)
    .leftJoin(pickSources, eq(pickSources.pickId, picks.id))
    .groupBy(sql`1`);
  return DASH_SOURCES.map((key) => {
    const row = rows.find((r) => r.source === key);
    return {
      key,
      picks: row?.picks ?? 0,
      lastAt: row?.lastAt ? dayjs(row.lastAt).toISOString() : null,
    };
  });
}

async function loadGradedToday(): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql`count(*)::int`.mapWith(Number) })
    .from(pickSettlements)
    .innerJoin(picks, eq(picks.id, pickSettlements.pickId))
    .where(
      and(
        gte(pickSettlements.gradedAt, dayjs.utc().startOf("day").toDate()),
        inArray(picks.result, [...GRADED]),
      ),
    );
  return row?.count ?? 0;
}

// The top ranked capper, else the one closest to ranking; null when nobody has picks.
async function loadDash(): Promise<LandingDash | null> {
  const board = await getLeaderboard({});
  const top = board.rows[0] ?? board.unranked[0];
  if (!top) return null;
  const [stats, live, history, ticker, head, anchors, gradedToday, sources] =
    await Promise.all([
      getCapperStats(top.username),
      getUserPicks(top.username),
      getUserHistory(top.username),
      loadTicker(),
      getLogHead(),
      listAnchors(1),
      loadGradedToday(),
      loadSources(),
    ]);
  const liveGraded = live
    .filter((pick) => isSettled(pick.result))
    .map((pick) => ({ ...pick, at: pick.commenceTime }));
  const historyGraded = history
    .filter((pick) => isSettled(pick.result))
    .map((pick) => ({ ...pick, at: pick.gradedAt }));
  const curveLive = liveGraded.length >= 2 || historyGraded.length === 0;
  const anchor = anchors[0];
  return {
    capper: {
      username: top.username,
      avatarUrl: top.avatarUrl ?? stats.avatarUrl ?? null,
      source: stats.source,
      rank: "rank" in top ? top.rank : null,
      graded: top.graded,
      gradedLive: top.gradedLive,
      gradedHistory: top.gradedHistory,
      wins: top.wins,
      losses: top.losses,
      pushes: top.pushes,
      units: top.units,
      roi: top.roi,
      clv: stats.clv ?? null,
      clvSample: stats.clvSample ?? 0,
    },
    curve: {
      live: curveLive,
      points: curveOf(curveLive ? liveGraded : historyGraded),
    },
    sports: sportsOf([...liveGraded, ...historyGraded]),
    picks: live.slice(0, DASH_ROWS),
    history: history.slice(0, DASH_ROWS),
    ticker,
    head,
    anchor: anchor
      ? {
          size: anchor.size,
          upgraded: anchor.upgraded,
          createdAt: anchor.createdAt,
        }
      : null,
    gradedToday,
    sources,
  };
}

const landingDash = cached(async () => ({
  value: await loadDash().catch(() => null),
  expires: Date.now() + STATS_TTL_MS,
}));

export async function getLandingData(): Promise<LandingData> {
  const [featured, stats, dash] = await Promise.all([
    landingFeatured().catch(() => []),
    landingStats().catch(() => null),
    landingDash().catch(() => null),
  ]);
  return {
    event: featured[0]?.event ?? null,
    price: featured[0]?.price ?? null,
    featured,
    stats,
    dash,
    minGraded: serverEnv.ranking.leaderboardMinGradedPicks,
  };
}
