import {
  LEADERBOARD_ORDERS,
  LEADERBOARD_PAGE_SIZE,
  LEADERBOARD_PERIODS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_SORTS,
} from "@/lib/api/typebox/leaderboard";
import { PAGE_SIZE_OPTIONS } from "@/lib/config/constants";
import { SPORT_GROUPS } from "@/lib/config/sports";
import {
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

const PARSERS = {
  sport: parseAsStringLiteral(SPORT_GROUPS),
  period: parseAsStringLiteral(LEADERBOARD_PERIODS).withDefault("all"),
  sort: parseAsStringLiteral(LEADERBOARD_SORTS).withDefault("roi"),
  order: parseAsStringLiteral(LEADERBOARD_ORDERS).withDefault("desc"),
  scope: parseAsStringLiteral(LEADERBOARD_SCOPES).withDefault("all"),
  page: parseAsInteger.withDefault(1),
  size: parseAsNumberLiteral(PAGE_SIZE_OPTIONS).withDefault(
    LEADERBOARD_PAGE_SIZE,
  ),
};

export function useLeaderboardFilters() {
  return useQueryStates(PARSERS);
}

export type LeaderboardFilterState = ReturnType<
  typeof useLeaderboardFilters
>[0];
export type SetLeaderboardFilters = ReturnType<typeof useLeaderboardFilters>[1];
