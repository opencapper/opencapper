import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import { SPORT_GROUPS } from "@/lib/config/sports";
import { t } from "elysia";

export const LeaderboardPeriod = t.Union([
  t.Literal("30d"),
  t.Literal("90d"),
  t.Literal("1y"),
  t.Literal("all"),
]);
export type LeaderboardPeriod = typeof LeaderboardPeriod.static;

export const LEADERBOARD_PERIODS = LeaderboardPeriod.anyOf.map((l) => l.const);

export const LeaderboardSort = t.Union([
  t.Literal("roi"),
  t.Literal("units"),
  t.Literal("picks"),
]);
export type LeaderboardSort = typeof LeaderboardSort.static;

export const LEADERBOARD_SORTS = LeaderboardSort.anyOf.map((l) => l.const);

export const LeaderboardOrder = t.Union([t.Literal("desc"), t.Literal("asc")]);
export type LeaderboardOrder = typeof LeaderboardOrder.static;

export const LEADERBOARD_ORDERS = LeaderboardOrder.anyOf.map((l) => l.const);

// "all" ranks live picks plus on chain history, "live" only picks logged here.
export const LeaderboardScope = t.Union([t.Literal("all"), t.Literal("live")]);
export type LeaderboardScope = typeof LeaderboardScope.static;

export const LEADERBOARD_SCOPES = LeaderboardScope.anyOf.map((l) => l.const);

export const LeaderboardSport = t.Union(SPORT_GROUPS.map((g) => t.Literal(g)));

export const LEADERBOARD_PAGE_SIZE = 50;
export const LEADERBOARD_UNRANKED_LIMIT = 100;

export const LeaderboardQuery = t.Object({
  sport: t.Optional(LeaderboardSport),
  period: t.Optional(LeaderboardPeriod),
  sort: t.Optional(LeaderboardSort),
  order: t.Optional(LeaderboardOrder),
  scope: t.Optional(LeaderboardScope),
  // A string: Elysia skips minimum and maximum on coerced query numbers.
  page: t.Optional(t.String({ pattern: "^[1-9][0-9]{0,2}$" })),
  pageSize: t.Optional(
    t.String({ pattern: `^(${PAGE_SIZE_OPTIONS.join("|")})$` }),
  ),
});
export type LeaderboardQuery = typeof LeaderboardQuery.static;
