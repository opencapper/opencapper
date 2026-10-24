import {
  LEADERBOARD_PERIODS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_SORTS,
} from "@/lib/api/typebox/leaderboard";
import { SPORT_GROUPS } from "@/lib/config/sports";
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";

const PARSERS = {
  sport: parseAsStringLiteral(SPORT_GROUPS),
  period: parseAsStringLiteral(LEADERBOARD_PERIODS).withDefault("all"),
  sort: parseAsStringLiteral(LEADERBOARD_SORTS).withDefault("roi"),
  scope: parseAsStringLiteral(LEADERBOARD_SCOPES).withDefault("all"),
  page: parseAsInteger.withDefault(1),
};

export function useLeaderboardFilters() {
  return useQueryStates(PARSERS);
}

export type LeaderboardFilterState = ReturnType<
  typeof useLeaderboardFilters
>[0];
export type SetLeaderboardFilters = ReturnType<typeof useLeaderboardFilters>[1];
