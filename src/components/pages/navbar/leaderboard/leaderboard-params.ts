import {
  LEADERBOARD_ORDERS,
  LEADERBOARD_PAGE_SIZE,
  LEADERBOARD_PERIODS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_SORTS,
  type LeaderboardQuery,
} from "@/lib/api/typebox/leaderboard";
import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import { SPORT_GROUPS } from "@/lib/config/sports";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";

const MAX_PAGE = 999;

// Shared by the client hook and the server prefetch, so both build the same query key.
export const LEADERBOARD_PARSERS = {
  // A comma list; a single value (`?sport=mma`) still parses.
  sport: parseAsArrayOf(parseAsStringLiteral(SPORT_GROUPS), ",").withDefault(
    [],
  ),
  period: parseAsStringLiteral(LEADERBOARD_PERIODS).withDefault("all"),
  sort: parseAsStringLiteral(LEADERBOARD_SORTS).withDefault("roi"),
  order: parseAsStringLiteral(LEADERBOARD_ORDERS).withDefault("desc"),
  scope: parseAsStringLiteral(LEADERBOARD_SCOPES).withDefault("all"),
  page: parseAsInteger.withDefault(1),
  size: parseAsNumberLiteral(PAGE_SIZE_OPTIONS).withDefault(
    LEADERBOARD_PAGE_SIZE,
  ),
};

export const loadLeaderboardFilters = createLoader(LEADERBOARD_PARSERS);

export type LeaderboardFilterState = inferParserType<
  typeof LEADERBOARD_PARSERS
>;

export function leaderboardQuery(
  filters: LeaderboardFilterState,
): LeaderboardQuery {
  return {
    sport: filters.sport.length > 0 ? filters.sport.join(",") : undefined,
    period: filters.period,
    sort: filters.sort,
    order: filters.order,
    scope: filters.scope,
    // A hand edited `?page=0` or `?page=-3` would fail validation; clamp to what the API accepts.
    page: String(Math.min(Math.max(filters.page, 1), MAX_PAGE)),
    pageSize: String(filters.size),
  };
}
