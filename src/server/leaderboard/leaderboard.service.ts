import {
  LEADERBOARD_PAGE_SIZE,
  LEADERBOARD_UNRANKED_LIMIT,
  type LeaderboardOrder,
  type LeaderboardPeriod,
  type LeaderboardScope,
  type LeaderboardQuery,
  type LeaderboardSort,
} from "@/lib/api/typebox/leaderboard";
import { getDb } from "@/lib/db/server/client";
import { authUser, historyPicks, picks, users } from "@/lib/db/schema/server";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { sportGroup, type SportGroup } from "@/lib/config/sports";
import type { LeaderboardResponse, UnrankedRow } from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import { netOf, riskedOf } from "@/server/stats/stats.service";
import {
  avatarColumns,
  avatarUrl,
  type AvatarSource,
} from "@/server/users/avatar";
import { and, eq, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 500;

const cache = new Map<string, { at: number; value: LeaderboardResponse }>();

const PERIOD_DAYS = {
  "30d": 30,
  "90d": 90,
  "1y": 365,
  all: null,
} satisfies Record<LeaderboardPeriod, number | null>;

const GRADED = sql.raw("('win', 'loss', 'push')");

// Rugby keys are rugbyleague_* and rugbyunion_*, every other group is `<group>_*`.
function sportFilter(column: SQLWrapper, group: SportGroup): SQL {
  return sql`${column} like ${group === "rugby" ? "rugby%" : `${group}\\_%`}`;
}

function sportGroups(prefixes: string[]): SportGroup[] {
  const out = new Set<SportGroup>();
  for (const prefix of prefixes) {
    const group = sportGroup(prefix);
    if (group) out.add(group);
  }
  return [...out];
}

type Input = {
  sport?: SportGroup;
  period: LeaderboardPeriod;
  sort: LeaderboardSort;
  order: LeaderboardOrder;
  scope: LeaderboardScope;
  page: number;
  pageSize: number;
  minGraded: number;
};

function filtersFor(
  input: Input,
  columns: { sportKey: SQLWrapper; commenceTime: SQLWrapper },
): SQL[] {
  const filters: SQL[] = [];
  const days = PERIOD_DAYS[input.period];
  if (days !== null)
    filters.push(
      sql`${columns.commenceTime} >= ${dayjs().subtract(days, "day").toISOString()}`,
    );
  if (input.sport) filters.push(sportFilter(columns.sportKey, input.sport));
  return filters;
}

// Live picks and on chain history in one stream; `live` keeps the split visible per row.
function aggregate(input: Input) {
  const db = getDb();
  const live = db
    .select({
      userId: picks.userId,
      sportKey: picks.sportKey,
      result: picks.result,
      units: picks.units,
      oddsDecimal: picks.oddsDecimal,
      live: sql<boolean>`true`.as("live"),
    })
    .from(picks)
    .where(and(...filtersFor(input, picks)));
  const history = db
    .select({
      userId: historyPicks.userId,
      sportKey: historyPicks.sportKey,
      result: historyPicks.result,
      units: historyPicks.units,
      oddsDecimal: historyPicks.oddsDecimal,
      live: sql<boolean>`false`.as("live"),
    })
    .from(historyPicks)
    .where(
      and(
        ...filtersFor(input, historyPicks),
        input.scope === "live" ? sql`false` : undefined,
      ),
    );
  const src = unionAll(live, history).as("src");
  const graded = sql`count(*) filter (where ${src.result} in ${GRADED})::int`;

  return {
    graded,
    query: db
      .select({
        userId: src.userId,
        picks: sql`count(*)::int`.mapWith(Number).as("picks"),
        graded: graded.mapWith(Number).as("graded"),
        gradedLive:
          sql`count(*) filter (where ${src.result} in ${GRADED} and ${src.live})::int`
            .mapWith(Number)
            .as("graded_live"),
        wins: sql`count(*) filter (where ${src.result} = 'win')::int`
          .mapWith(Number)
          .as("wins"),
        losses: sql`count(*) filter (where ${src.result} = 'loss')::int`
          .mapWith(Number)
          .as("losses"),
        pushes: sql`count(*) filter (where ${src.result} = 'push')::int`
          .mapWith(Number)
          .as("pushes"),
        units: netOf(src.result, src.units, src.oddsDecimal).as("units"),
        unitsRisked: riskedOf(src.result, src.units).as("units_risked"),
        prefixes: sql<
          string[]
        >`array_agg(distinct split_part(${src.sportKey}, '_', 1))`.as(
          "prefixes",
        ),
      })
      .from(src)
      .groupBy(src.userId),
  };
}

type AggRow = AvatarSource & {
  username: string;
  picks: number;
  graded: number;
  gradedLive: number;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  unitsRisked: number;
  prefixes: string[];
  source: SourcePlatform | null;
};

function toRow(row: AggRow): UnrankedRow {
  return {
    username: row.username,
    picks: row.picks,
    graded: row.graded,
    gradedLive: row.gradedLive,
    gradedHistory: row.graded - row.gradedLive,
    wins: row.wins,
    losses: row.losses,
    pushes: row.pushes,
    units: row.units,
    unitsRisked: row.unitsRisked,
    roi: row.unitsRisked > 0 ? row.units / row.unitsRisked : 0,
    sports: sportGroups(row.prefixes),
    source: row.source,
    avatarUrl: avatarUrl(row, 64),
  };
}

async function queryLeaderboard(input: Input): Promise<LeaderboardResponse> {
  const db = getDb();
  const ranked = aggregate(input);
  const rankedAgg = ranked.query
    .having(sql`${ranked.graded} >= ${input.minGraded}`)
    .as("agg");
  const columns = (agg: typeof rankedAgg) => ({
    username: users.username,
    picks: agg.picks,
    graded: agg.graded,
    gradedLive: agg.gradedLive,
    wins: agg.wins,
    losses: agg.losses,
    pushes: agg.pushes,
    units: agg.units,
    unitsRisked: agg.unitsRisked,
    prefixes: agg.prefixes,
    source: users.sourcePlatform,
    ...avatarColumns,
  });

  const roi = sql`${rankedAgg.units} / nullif(${rankedAgg.unitsRisked}, 0)`;
  const key = {
    roi,
    units: sql`${rankedAgg.units}`,
    picks: sql`${rankedAgg.graded}`,
  } satisfies Record<LeaderboardSort, SQL>;
  const order = sql`${key[input.sort]} desc nulls last, ${rankedAgg.graded} desc, ${users.username} asc`;
  // Rank stays the position in the descending table whichever way the page is read.
  const listOrder =
    input.order === "asc"
      ? sql`${key[input.sort]} asc nulls last, ${rankedAgg.graded} asc, ${users.username} desc`
      : order;

  const unranked = aggregate(input);
  const unrankedAgg = unranked.query
    .having(sql`${unranked.graded} < ${input.minGraded}`)
    .as("agg");

  const [rows, waiting] = await Promise.all([
    db
      .select({
        ...columns(rankedAgg),
        rank: sql`row_number() over (order by ${order})::int`.mapWith(Number),
        total: sql`count(*) over ()::int`.mapWith(Number),
      })
      .from(rankedAgg)
      .innerJoin(users, eq(users.id, rankedAgg.userId))
      .leftJoin(authUser, eq(authUser.id, users.authUserId))
      .orderBy(listOrder)
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db
      .select(columns(unrankedAgg))
      .from(unrankedAgg)
      .innerJoin(users, eq(users.id, unrankedAgg.userId))
      .leftJoin(authUser, eq(authUser.id, users.authUserId))
      .orderBy(
        sql`${unrankedAgg.graded} desc, ${unrankedAgg.picks} desc, ${users.username} asc`,
      )
      .limit(LEADERBOARD_UNRANKED_LIMIT),
  ]);

  return {
    rows: rows.map((row) => ({ rank: row.rank, ...toRow(row) })),
    unranked: waiting.map(toRow),
    scope: input.scope,
    minGraded: input.minGraded,
    total: rows[0]?.total ?? 0,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getLeaderboard(
  query: LeaderboardQuery,
): Promise<LeaderboardResponse> {
  const input = {
    sport: query.sport,
    period: query.period ?? "all",
    sort: query.sort ?? "roi",
    order: query.order ?? "desc",
    scope: query.scope ?? "all",
    page: Number(query.page ?? "1"),
    pageSize: Number(query.pageSize ?? LEADERBOARD_PAGE_SIZE),
    minGraded: serverEnv.ranking.leaderboardMinGradedPicks,
  };
  const cacheKey = JSON.stringify(input);
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;

  const value = await queryLeaderboard(input);
  for (const [k, entry] of cache) {
    if (now - entry.at >= CACHE_TTL_MS) cache.delete(k);
  }
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
  cache.set(cacheKey, { at: now, value });
  return value;
}
