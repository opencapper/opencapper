import {
  LEADERBOARD_PAGE_SIZE,
  LEADERBOARD_UNRANKED_LIMIT,
  type LeaderboardOrder,
  type LeaderboardPeriod,
  type LeaderboardScope,
  type LeaderboardQuery,
  type LeaderboardSort,
  parseSportList,
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
import { visibleUser } from "@/server/users/hidden";
import { and, eq, inArray, sql, type SQL, type SQLWrapper } from "drizzle-orm";
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
function sportFilter(column: SQLWrapper, groups: SportGroup[]): SQL {
  const prefixes = groups.flatMap((group) =>
    group === "rugby" ? ["rugbyleague", "rugbyunion"] : [group],
  );
  return inArray(sql`split_part(${column}, '_', 1)`, prefixes);
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
  sports: SportGroup[];
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
  if (input.sports.length > 0)
    filters.push(sportFilter(columns.sportKey, input.sports));
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
      at: picks.createdAt,
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
      at: historyPicks.tradedAt,
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
  const prefix = sql`split_part(${src.sportKey}, '_', 1)`;

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
        sportCount:
          sql`count(distinct case when ${prefix} like 'rugby%' then 'rugby' else ${prefix} end)::int`
            .mapWith(Number)
            .as("sport_count"),
        lastPickAt: sql<Date | string | null>`max(${src.at})`.as(
          "last_pick_at",
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
  lastPickAt: Date | string | null;
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
    lastPickAt: row.lastPickAt ? dayjs(row.lastPickAt).toISOString() : null,
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
    lastPickAt: agg.lastPickAt,
    source: users.sourcePlatform,
    ...avatarColumns,
  });

  const roi = sql`${rankedAgg.units} / nullif(${rankedAgg.unitsRisked}, 0)`;
  const metric = {
    roi,
    units: sql`${rankedAgg.units}`,
    picks: sql`${rankedAgg.graded}`,
  };
  // Rank is the position by the chosen metric; every other column ranks by ROI.
  const rankKey =
    input.sort === "units" || input.sort === "picks" ? metric[input.sort] : roi;
  const order = sql`${rankKey} desc nulls last, ${rankedAgg.graded} desc, ${users.username} asc`;
  const reversed = sql`${rankKey} asc nulls first, ${rankedAgg.graded} asc, ${users.username} desc`;
  const dir = sql.raw(input.order === "asc" ? "asc" : "desc");
  const listOrder = {
    roi: input.order === "asc" ? reversed : order,
    units: input.order === "asc" ? reversed : order,
    picks: input.order === "asc" ? reversed : order,
    // Rank 1 heads the descending table, so ascending rank is that order.
    rank: input.order === "asc" ? order : reversed,
    capper: sql`${users.username} ${dir}`,
    record: sql`${rankedAgg.wins}::float / nullif(${rankedAgg.wins} + ${rankedAgg.losses}, 0) ${dir} nulls last, ${rankedAgg.wins} ${dir}, ${users.username} asc`,
    sports: sql`${rankedAgg.sportCount} ${dir}, ${order}`,
    last: sql`${rankedAgg.lastPickAt} ${dir} nulls last, ${users.username} asc`,
  } satisfies Record<LeaderboardSort, SQL>;

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
      .where(visibleUser)
      .orderBy(listOrder[input.sort])
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    db
      .select(columns(unrankedAgg))
      .from(unrankedAgg)
      .innerJoin(users, eq(users.id, unrankedAgg.userId))
      .leftJoin(authUser, eq(authUser.id, users.authUserId))
      .where(visibleUser)
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

// Hiding a profile must take it off the board now, not after the TTL.
export function clearLeaderboardCache() {
  cache.clear();
}

export async function getLeaderboard(
  query: LeaderboardQuery,
): Promise<LeaderboardResponse> {
  const input = {
    sports: parseSportList(query.sport).toSorted(),
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
